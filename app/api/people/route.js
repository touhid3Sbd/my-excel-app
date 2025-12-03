import dbConnect from '../../../lib/mongodb';
import Person from '../../../models/Person';

export async function GET() {
  await dbConnect();
  const people = await Person.find({});
  return new Response(JSON.stringify(people), { status: 200 });
}

export async function POST(request) {
  await dbConnect();
  const data = await request.json();
  const newPerson = new Person(data);
  await newPerson.save();
  return new Response(JSON.stringify(newPerson), { status: 201 });
}