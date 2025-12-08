// app/api/upload/route.js → WORKS ON LOCALHOST + VERCEL PRODUCTION
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Person from '@/models/Person';

// Auto-switch: use real Vercel Blob in production, fallback to memory in dev
const isDev = process.env.NODE_ENV === 'development';

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file selected' }, { status: 400 });
    }

    let buffer;
    let fileUrl = null;

    if (isDev) {
      // LOCALHOST: Just read file into memory (no blob needed)
      buffer = Buffer.from(await file.arrayBuffer());
      fileUrl = `http://localhost:3000/temp/${file.name}`;
      console.log('Dev mode: File loaded into memory');
    } else {
      // PRODUCTION: Upload to Vercel Blob
      const blob = await put(`uploads/${Date.now()}-${file.name}`, file.stream(), {
        access: 'public',
        addRandomSuffix: true,
      });
      fileUrl = blob.url;

      const response = await fetch(blob.downloadUrl);
      buffer = Buffer.from(await response.arrayBuffer());
      console.log('Production: File uploaded to Vercel Blob →', fileUrl);
    }

    // Now parse Excel (works the same everywhere)
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    if (!ws || ws.rowCount <= 1) {
      return NextResponse.json({ error: 'Empty Excel file' }, { status: 400 });
    }

    // === Your smart header detection (unchanged) ===
    const headers = {};
    ws.getRow(1).eachCell((cell, col) => {
      headers[col] = String(cell.value || '').trim().toLowerCase();
    });

    const fieldMap = {
      name: ['name', 'full name', 'person'],
      age: ['age', 'years'],
      email: ['email', 'e-mail', 'mail'],
      city: ['city', 'town'],
      phone: ['phone', 'mobile', 'contact'],
    };

    const colToField = {};
    Object.entries(headers).forEach(([col, h]) => {
      const match = Object.entries(fieldMap).find(([f, aliases]) =>
        aliases.some(a => h.includes(a)) || h.includes(f)
      );
      colToField[col] = match ? match[0] : h;
    });

    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      if (n === 1) return;
      const obj = {};
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        obj[colToField[col]] = cell.value;
      });
      rows.push(obj);
    });

    const validRows = rows.filter(r => Object.values(r).some(v => v != null && v !== ''));

    // === Duplicate check & insert (same as before) ===
    let added = 0;
    let skipped = 0;

    if (validRows.length > 0) {
      const emails = validRows
        .map(r => r.email || Object.values(r).find(v => typeof v === 'string' && v.includes('@')))
        .filter(Boolean)
        .map(e => String(e).trim().toLowerCase());

      if (emails.length > 0) {
        const existing = await Person.find({ email: { $in: emails } }).lean();
        const existingSet = new Set(existing.map(e => e.email.toLowerCase()));

        const newRows = validRows.filter(row => {
          const email = row.email || Object.values(row).find(v => typeof v === 'string' && v.includes('@'));
          if (!email) return true;
          const norm = String(email).trim().toLowerCase();
          if (existingSet.has(norm)) {
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
    }

    return NextResponse.json({
      success: true,
      added,
      skipped,
      fileUrl: isDev ? null : fileUrl,
      message: added > 0
        ? `${added} rows imported!`
        : 'No new data (all duplicates or empty)'
    });

  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}