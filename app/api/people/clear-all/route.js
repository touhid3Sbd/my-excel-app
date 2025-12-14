// app/api/people/clear-all/route.js → FIXED: CLEAR ALL WORKS
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';

export async function POST(request) {
  await dbConnect();

  try {
    await Person.deleteMany({});
    return Response.json({ message: 'All deleted' });
  } catch (error) {
    console.error('Clear all error:', error);
    return Response.json({ error: 'Failed to clear' }, { status: 500 });
  }
}