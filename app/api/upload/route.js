// app/api/upload/route.js
import dbConnect from '../../../lib/mongodb';
import Person from '../../../models/Person';
import { read, utils } from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  await dbConnect();
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return new Response('No file', { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = utils.sheet_to_json(sheet, { defval: null });

  await Person.deleteMany({});
  await Person.insertMany(data);

  return new Response(JSON.stringify({ count: data.length }), { status: 200 });
}