// app/api/upload/route.js → FINAL: UPLOAD WORKS 100% ON VERCEL & LOCAL
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Person from '@/models/Person';

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    if (!ws || ws.rowCount <= 1) {
      return NextResponse.json({ error: 'File is empty or has no data' }, { status: 400 });
    }

    // Read headers
    const rawHeaders = {};
    ws.getRow(1).eachCell((cell, colNumber) => {
      rawHeaders[colNumber] = String(cell.value || '').trim().toLowerCase();
    });

    // Header mapping
    const headerMap = {
      name: ['name', 'full name', 'person name', 'fullname'],
      age: ['age', 'years', 'age in years'],
      email: ['email', 'mail', 'e-mail', 'email address'],
      city: ['city', 'town', 'location'],
      phone: ['phone', 'mobile', 'contact', 'number']
    };

    const reverseMap = {};
    Object.keys(headerMap).forEach(dbField => {
      headerMap[dbField].forEach(alias => {
        reverseMap[alias.toLowerCase()] = dbField;
      });
    });

    // Read rows
    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerText = rawHeaders[colNumber];
        const dbField = reverseMap[headerText] || headerText;
        obj[dbField] = cell.value;
      });
      rows.push(obj);
    });

    // Filter valid rows
    const validRows = rows.filter(r =>
      Object.values(r).some(v => v != null && v !== '' && v !== undefined)
    );

    if (validRows.length === 0) {
      return NextResponse.json({ added: 0, skipped: 0, message: 'No valid data found' });
    }

    // Extract emails for duplicate check
    const emailsInFile = validRows
      .map(row => {
        if (row.email && typeof row.email === 'string') {
          return row.email.trim().toLowerCase();
        }
        const emailValue = Object.values(row).find(v =>
          typeof v === 'string' && v.includes('@') && v.includes('.')
        );
        return emailValue ? emailValue.trim().toLowerCase() : null;
      })
      .filter(Boolean);

    let added = 0;
    let skipped = 0;
    let duplicateFound = false;

    if (emailsInFile.length > 0) {
      const existing = await Person.find({ email: { $in: emailsInFile } }).select('email').lean();
      const existingEmails = new Set(existing.map(e => e.email.toLowerCase()));

      const newRows = validRows.filter(row => {
        const email = Object.values(row).find(v =>
          typeof v === 'string' && v.includes('@') && v.includes('.')
        );
        if (!email) return true;
        const normalized = email.trim().toLowerCase();
        if (existingEmails.has(normalized)) {
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
      await Person.insertMany(validRows);
      added = validRows.length;
    }

    return NextResponse.json({
      added,
      skipped,
      message: duplicateFound ? 'Duplicate data found' : 'Upload successful'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed. Check server logs.' }, { status: 500 });
  }
}