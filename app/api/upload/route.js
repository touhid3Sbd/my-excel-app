// app/api/upload/route.js → FULLY DYNAMIC: WORKS WITH ANY EXCEL FORMAT
import { NextResponse } from 'next/server';
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];
    if (!ws || ws.rowCount <= 1) return NextResponse.json({ error: 'Empty file or no data rows' }, { status: 400 });

    // READ HEADERS DYNAMICALLY
    const headers = [];
    ws.getRow(1).eachCell((cell, colNumber) => {
      let headerText = '';
      if (cell.value) {
        if (typeof cell.value === 'string') {
          headerText = cell.value;
        } else if (cell.value.richText) {
          headerText = cell.value.richText.map(rt => rt.text).join('');
        } else if (cell.value.text) {
          headerText = cell.value.text;
        } else {
          headerText = String(cell.value);
        }
      }
      const cleanHeader = headerText.trim();
      // Convert to snake_case for DB field
      const dbField = cleanHeader
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      headers[colNumber - 1] = { original: cleanHeader, db: dbField || `column_${colNumber}` };
    });

    // READ ROWS
    const rows = [];
    for (let rowNumber = 2; rowNumber <= ws.rowCount; rowNumber++) {
      const row = ws.getRow(rowNumber);
      const obj = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (!header) return;

        let cellValue = cell.value;

        // Handle different cell types safely
        if (cellValue === null || cellValue === undefined) {
          cellValue = '';
        } else if (typeof cellValue === 'object') {
          if (cellValue.richText) {
            cellValue = cellValue.richText.map(rt => rt.text).join('');
          } else if (cellValue.result) {
            cellValue = cellValue.result;
          } else if (cellValue.formula) {
            cellValue = ''; // ignore formula
          } else {
            cellValue = String(cellValue);
          }
        } else {
          cellValue = String(cellValue);
        }

        obj[header.db] = cellValue.trim();
      });

      // Skip completely empty rows
      const hasValue = Object.values(obj).some(v => v !== '');
      if (hasValue) rows.push(obj);
    }

    if (rows.length === 0) {
      return NextResponse.json({ added: 0, skipped: 0, message: 'No valid data found' });
    }

    // DUPLICATE CHECK on first column (usually Sl or ID)
    const firstField = headers[0]?.db;
    const keysInFile = rows
      .map(row => row[firstField] ? String(row[firstField]).trim().toLowerCase() : null)
      .filter(Boolean);

    let added = 0;
    let skipped = 0;
    let duplicateFound = false;

    if (keysInFile.length > 0) {
      const existing = await Person.find({ [firstField]: { $in: keysInFile } }).select(firstField).lean();
      const existingKeys = new Set(existing.map(e => String(e[firstField]).toLowerCase()));

      const newRows = rows.filter(row => {
        const key = row[firstField] ? String(row[firstField]).trim().toLowerCase() : null;
        if (key && existingKeys.has(key)) {
          skipped++;
          duplicateFound = true;
          return false;
        }
        return true;
      });

      if (newRows.length > 0) {
        await Person.insertMany(newRows);
        added = newRows.length;
      }
    } else {
      await Person.insertMany(rows);
      added = rows.length;
    }

    return NextResponse.json({
      added,
      skipped,
      message: duplicateFound ? 'Some rows skipped (duplicates)' : 'Upload successful'
    });

  } catch (error) {
    console.error('Dynamic upload error:', error);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }
}