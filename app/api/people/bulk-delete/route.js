// app/api/people/bulk-delete/route.js → FIXED: BULK DELETE WORKS
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';

export async function POST(request) {
  await dbConnect();

  try {
    const { ids } = await request.json();
    if (!ids || ids.length === 0) return Response.json({ error: 'No IDs' }, { status: 400 });
    await Person.deleteMany({ _id: { $in: ids } });
    return Response.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return Response.json({ error: 'Failed to delete' }, { status: 500 });
  }
}