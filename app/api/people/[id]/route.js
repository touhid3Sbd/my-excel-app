// app/api/people/[id]/route.js → FIXED: SINGLE EDIT/DELETE WORKS
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';

export async function PUT(request, { params }) {
  await dbConnect();

  try {
    const body = await request.json();
    const updated = await Person.findByIdAndUpdate(params.id, body, { new: true });
    if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();

  try {
    const deleted = await Person.findByIdAndDelete(params.id);
    if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ message: 'Deleted' });
  } catch (error) {
    return Response.json({ error: 'Failed to delete' }, { status: 500 });
  }
}