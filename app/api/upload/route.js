// app/api/upload/route.js   ← Replace your entire file with this
import dbConnect from '../../../lib/mongodb';
import Person from '../../../models/Person';
import { read, utils } from 'xlsx';

export const dynamic = 'force-dynamic';
export const bodyParser = false;

export async function POST(request) {
  await dbConnect();

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No valid file' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = utils.sheet_to_json(sheet, { defval: '' });

    // Normalize field names (handles "Name", "NAME ", " Age", etc.)
    const normalizedData = rawData.map(row => ({
      name: String(row.name || row.Name || row.NAME || row['Name '] || row[' Full Name'] || '').trim(),
      age: Number(row.age || row.Age || row.AGE || row['Age '] || 0),
      email: String(row.email || row.Email || row.EMAIL || row['Email '] || row['E-mail'] || '').trim(),
    })).filter(item => item.name && item.email); // Remove empty rows

    if (normalizedData.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid data found in Excel' }), { status: 400 });
    }

    await Person.deleteMany({});        // Optional: clear old data
    await Person.insertMany(normalizedData);

    return new Response(JSON.stringify({
      message: 'Success!',
      count: normalizedData.length
    }), { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}