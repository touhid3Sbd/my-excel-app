// app/api/people/route.js
import dbConnect from '../../../lib/mongodb';
import Person from '../../../models/Person';
const isExport = searchParams.get('export') === 'true';
const limit = isExport ? 10000 : 10; // export all, otherwise 10
const skip = isExport ? 0 : (page - 1) * limit;

export async function GET() {
  await dbConnect();
  const people = await Person.find({}).sort({ createdAt: -1 });
  return new Response(JSON.stringify(people), { status: 200 });
}

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const person = await Person.create(body);
  return new Response(JSON.stringify(person), { status: 201 });
}