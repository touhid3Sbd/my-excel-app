// app/api/upload/route.js
// AUTO-MAP ANY EXCEL HEADERS TO DATABASE FIELDS
import { NextResponse } from 'next/server';
import Person from '@/models/Person';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    if (!ws || ws.rowCount <= 1) return NextResponse.json({ error: 'Empty file' });

    // READ HEADERS
    const rawHeaders = {};
    ws.getRow(1).eachCell((cell, colNumber) => {
      rawHeaders[colNumber] = String(cell.value || '').trim().toLowerCase();
    });

    // MAPPING RULES – YOU CAN CHANGE THESE ANYTIME
    const headerMap = {
      name: ['name', 'full name', 'person name', 'fullname'],
      age: ['age', 'years', 'age in years', 'year'],
      email: ['email', 'mail', 'e-mail', 'email address'],
      city: ['city', 'town', 'location'],
      phone: ['phone', 'mobile', 'contact', 'number']
    };

    // REVERSE MAP: "email" → ['email', 'mail', ...]
    const reverseMap = {};
    Object.keys(headerMap).forEach(dbField => {
      headerMap[dbField].forEach(alias => {
        reverseMap[alias.toLowerCase()] = dbField;
      });
    });

    // READ ROWS
    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerText = rawHeaders[colNumber];
        const dbField = reverseMap[headerText] || headerText; // fallback to original
        obj[dbField] = cell.value;
      });
      rows.push(obj);
    });

    // Clean empty rows
    const validRows = rows.filter(r => Object.values(r).some(v => v != null && v !== ''));

    // Skip duplicates by email
    const emails = validRows.map(r => r.email ? String(r.email).trim().toLowerCase() : null).filter(Boolean);
    const existing = emails.length ? await Person.find({ email: { $in: emails } }).select('email') : [];
    const existingSet = new Set(existing.map(e => e.email.trim().toLowerCase()));

    const newRows = validRows.filter(r => !r.email || !existingSet.has(String(r.email).trim().toLowerCase()));

    let added = 0;
    if (newRows.length > 0) {
      await Person.insertMany(newRows);
      added = newRows.length;
    }

    return NextResponse.json({ added, skipped: validRows.length - added });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}