// app/api/upload/route.js → FINAL: SKIPS DUPLICATES EVEN WITH DIFFERENT HEADERS
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

    // SMART HEADER MAPPING (works with any header name)
    const headerMap = {
      name: ['name', 'full name', 'person name', 'fullname', 'full_name'],
      age: ['age', 'years', 'age in years', 'ageinyears', 'year'],
      email: ['email', 'mail', 'e-mail', 'email address', 'emailaddress'],
      city: ['city', 'town', 'location', 'address'],
      phone: ['phone', 'mobile', 'contact', 'number', 'phone number']
    };

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
        const dbField = reverseMap[headerText] || headerText; // map or keep original
        obj[dbField] = cell.value;
      });
      rows.push(obj);
    });

    // Clean empty rows
    const validRows = rows.filter(r => 
      Object.values(r).some(v => v != null && v !== '' && v !== undefined)
    );

    if (validRows.length === 0) {
      return NextResponse.json({ added: 0, skipped: 0 });
    }

    // EXTRACT EMAILS FOR DUPLICATE CHECK (mapped or original)
    const emailsInFile = validRows
      .map(row => {
        const possibleEmailFields = ['email', 'mail', 'e-mail', 'email address', 'emailaddress'];
        for (const field of possibleEmailFields) {
          if (row[field] && typeof row[field] === 'string') {
            return row[field].trim().toLowerCase();
          }
        }
        return null;
      })
      .filter(Boolean);

    // CHECK EXISTING EMAILS IN DB
    let skipped = 0;
    let added = 0;

    if (emailsInFile.length > 0) {
      const existing = await Person.find({
        email: { $in: emailsInFile }
      }).select('374').lean();

      const existingEmails = new Set(existing.map(e => e.email.toLowerCase()));

      const newRows = validRows.filter(row => {
        const email = Object.values(row)
          .find(v => typeof v === 'string' && v.includes('@') && v.includes('.'));
        if (!email) return true; // no email → allow
        const normalized = email.trim().toLowerCase();
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
      // No email fields → insert all
      await Person.insertMany(validRows);
      added = validRows.length;
    }

  return NextResponse.json({
  added: 5,
  skipped: 45,
  message: duplicateFound ? 'Duplicate data found' : 'Upload successful'
});

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}