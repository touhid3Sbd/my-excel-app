// app/api/upload/route.js
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Person from '@/models/Person';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro/Hobby needed for >10s

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Optional: limit size
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`uploads/${Date.now()}-${file.name}`, file.stream(), {
      access: 'public',
      addRandomSuffix: true,
    });

    // Download & parse
    const response = await fetch(blob.downloadUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.getWorksheet(1);

    if (!ws || ws.rowCount <= 1) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }

    // Header mapping
    const headerRow = ws.getRow(1);
    const headerMap = {};
    headerRow.eachCell((cell, col) => {
      const val = cell.value ? String(cell.value).trim().toLowerCase() : '';
      headerMap[col] = val;
    });

    const fieldAliases = {
      name: ['name', 'full name', 'person', 'fullname'],
      age: ['age', 'years'],
      email: ['email', 'e-mail', 'mail'],
      city: ['city', 'town', 'location'],
      phone: ['phone', 'mobile', 'contact', 'number'],
    };

    const colToField = {};
    Object.entries(headerMap).forEach(([col, header]) => {
      const match = Object.entries(fieldAliases).find(([field, aliases]) =>
        aliases.includes(header) || header.includes(field)
      );
      colToField[col] = match ? match[0] : header;
    });

    // Read data rows
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum === 1) return;
      const obj = {};
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        obj[colToField[col]] = cell.value;
      });
      rows.push(obj);
    });

    const validRows = rows.filter(r =>
      Object.values(r).some(v => v != null && v !== '')
    );

    if (validRows.length === 0) {
      return NextResponse.json({ added: 0, skipped: 0, message: 'No valid rows' });
    }

    // Duplicate check
    const emails = validRows
      .map(r => r.email || Object.values(r).find(v => typeof v === 'string' && v.includes('@')))
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    let added = 0;
    let skipped = 0;

    if (emails.length > 0) {
      const existing = await Person.find({ email: { $in: emails } }).lean();
      const existingEmails = new Set(existing.map(e => e.email.toLowerCase()));

      const newRows = validRows.filter(row => {
        const email = row.email || Object.values(row).find(v => typeof v === 'string' && v.includes('@'));
        if (!email) return true;
        const norm = String(email).trim().toLowerCase();
        if (existingEmails.has(norm)) {
          skipped++;
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
      success: true,
      added,
      skipped,
      fileUrl: blob.url,
      message: `${added} rows imported${skipped > 0 ? `, ${skipped} duplicates skipped` : ''}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}