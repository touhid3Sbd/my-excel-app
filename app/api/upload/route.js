// app/api/upload/route.js → VERCEL BLOB + SAFE EXCEL IMPORT (2025 BEST PRACTICE)
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Person from '@/models/Person';

export const runtime = 'nodejs'; // Important: exceljs needs Node.js runtime
export const maxDuration = 60;   // Allow up to 60s (Vercel Pro needed for >10s)

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !file.name) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Optional: limit file size (e.g., 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Upload directly to Vercel Blob (fast, durable, public URL)
    const { url, downloadUrl } = await put(`uploads/${Date.now()}-${file.name}`, file.stream(), {
      access: 'public',
      addRandomSuffix: true,
    });

    // Now safely parse the file from the stable URL
    const response = await fetch(downloadUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    if (!ws || ws.rowCount <= 1) {
      return NextResponse.json({ error: 'Empty file or no data rows' }, { status: 400 });
    }

    // === Header Detection (same smart logic as yours) ===
    const rawHeaders = {};
    ws.getRow(1).eachCell((cell, colNumber) => {
      rawHeaders[colNumber] = String(cell.value || '').trim().toLowerCase();
    });

    const headerMap = {
      name: ['name', 'full name', 'person name', 'fullname'],
      age: ['age', 'years', 'age in years'],
      email: ['email', 'mail', 'e-mail', 'email address'],
      city: ['city', 'town', 'location'],
      phone: ['phone', 'mobile', 'contact', 'number'],
    };

    const reverseMap = {};
    Object.keys(headerMap).forEach(dbField => {
      headerMap[dbField].forEach(alias => {
        reverseMap[alias.toLowerCase()] = dbField;
      });
    });

    // === Parse rows ===
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

    const validRows = rows.filter(r =>
      Object.values(r).some(v => v != null && v !== '' && v !== undefined)
    );

    if (validRows.length === 0) {
      return NextResponse.json({ added: 0, skipped: 0, message: 'No valid data' });
    }

    // === Smart duplicate detection by email ===
    const emailsInFile = validRows
      .map(row => {
        const emailField = row.email || Object.values(row).find(v =>
          typeof v === 'string' && v.includes('@') && /\.\w+$/.test(v)
        );
        return emailField ? String(emailField).trim().toLowerCase() : null;
      })
      .filter(Boolean);

    let added = 0;
    let skipped = 0;

    if (emailsInFile.length > 0) {
      const existing = await Person.find(
        { email: { $in: emailsInFile } }
      ).select('email').lean();

      const existingEmails = new Set(existing.map(e => e.email.toLowerCase()));

      const newRows = validRows.filter(row => {
        const email = row.email || Object.values(row).find(v =>
          typeof v === 'string' && v.includes('@')
        );
        if (!email) return true;
        const normalized = String(email).trim().toLowerCase();
        if (existingEmails.has(normalized)) {
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
      added,
      skipped,
      fileUrl: url, // optional: show user the uploaded file
      message: skipped > 0 ? `${skipped} duplicates skipped` : 'All rows imported!'
    });

  } catch (error) {
    console.error('Upload & import error:', error);
    return NextResponse.json(
      { error: 'Import failed. File may be corrupted or too large.' },
      { status: 500 }
    );
  }
}