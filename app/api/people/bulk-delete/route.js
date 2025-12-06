// app/api/people/bulk-delete/route.js
import Person from '@/models/Person';

export async function POST(request) {
  const { ids } = await request.json();
  if (!ids || !Array.isArray(ids)) return Response.json({ error: 'No IDs' }, { status: 400 });

  await Person.deleteMany({ _id: { $in: ids } });
  return Response.json({ deleted: ids.length });
}