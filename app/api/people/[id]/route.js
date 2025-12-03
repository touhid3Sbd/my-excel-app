// app/api/people/[id]/route.js
import dbConnect from '../../../../lib/mongodb';
import Person from '../../../../models/Person';

export async function PUT(request, { params }) {
  await dbConnect();
  const body = await request.json();
  const updated = await Person.findByIdAndUpdate(params.id, body, { new: true });
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(request, { params }) {
  await dbConnect();
  await Person.findByIdAndDelete(params.id);
  return new Response(JSON.stringify({ message: 'Deleted' }), { status: 200 });
}