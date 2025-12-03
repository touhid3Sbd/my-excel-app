// app/api/people/[id]/route.js → FIXED FOR NEXT.JS 13+ APP ROUTER
import dbConnect from '../../../../lib/mongodb';
import Person from '../../../../models/Person';

export async function PUT(request, { params }) {
  await dbConnect();
  const { id } = await params;  // ← MUST AWAIT params!
  const body = await request.json();

  const updated = await Person.findByIdAndUpdate(id, body, { new: true });
  if (!updated) return new Response('Not found', { status: 404 });
  
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(request, { params }) {
  await dbConnect();
  const { id } = await params;  // ← MUST AWAIT params!

  const deleted = await Person.findByIdAndDelete(id);
  if (!deleted) return new Response('Not found', { status: 404 });

  return new Response(null, { status: 204 });
}