// app/api/upload/route.js → 100% WORKING ON VERCEL + BLOB + EXCEL IMPORT
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Person from '@/models/Person';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds (requires Vercel Pro or Hobby with boost)

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Optional: limit file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Step 1: Upload to Vercel Blob (this triggers token creation automatically)
    const blob = await put(`excel-uploads/${Date.now()}-${file.name}`, file.stream(), {
      access: 'public',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN, // ← Vercel injects this automatically
    });

    // Step 2: Download the blob to parse it (safe & reliable)
    const response = await fetch(blob.downloadUrl);
    if (!response.ok) throw new Error('Failed to download uploaded file');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 3: Parse Excel with exceljs
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet || worksheet.rowCount <= 1) {
      return NextResponse.json({ error: 'No data in file' }, { status: 400 });
    }

    // === Smart Header Detection (your awesome logic) ===
    const headers = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const value = cell.value ? String(cell.value).trim().toLowerCase() : '';
      headers[colNumber] = value;
    });

    const fieldMap = {
      name: ['name', 'full name', 'person name', 'fullname'],
      age: ['age', 'years'],
      email: ['email', 'e-mail', 'mail'],
      city: ['city', 'town', 'location'],
      phone: ['phone', 'mobile', 'contact', 'number'],
    };

    const columnToField = {};
    Object.entries(headers).forEach(([col, header]) => {
      const found = Object.entries(fieldMap).find(([field, aliases]) =>
        aliases.includes(header) || header.includes(field)
      );
      columnToField[col] = found ? found[0] : header;
    });

    // === Extract rows ===
    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const field = columnToField[colNumber];
        obj[field] = cell.value;
      });
      rows.push(obj);
    });

    // === Remove empty rows ===
    const validRows = rows.filter(row =>
      Object.values(row).some(val =>
        val !== null && val !== undefined && val !== ''
      )
    );

    if (validRows.length === 0) {
      return NextResponse.json({ added: 0, skipped: 0, message: 'No valid data found' });
    }

    // === Duplicate detection by email ===
    const emails = validRows
      .map(r => r.email || Object.values(r).find(v => typeof v === 'string' && v.includes('@')))
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    let skipped = 0;
    let added = 0;

    if (emails.length > 0) {
      const existing = await Person.find({ email: { $in: emails } }).select('email').lean();
      const existingSet = new Set(existing.map(e => e.email.toLowerCase()));

      const newRows = validRows.filter(row => {
        const email = row.email || Object.values(row).find(v => typeof v === 'string' && v.includes('@'));
        if (!email) return true;
        const normalized = String(email).trim().toLowerCase();
        if (existingSet.has(normalized)) {
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
      uploadedFile: blob.url,
      message: added > 0 ? `Success! ${added} rows imported` : 'No new data (all duplicates)',
    });

  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}