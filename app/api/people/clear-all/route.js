// app/api/people/clear-all/route.js
import Person from '@/models/Person';

export async function POST() {
  try {
    await Person.deleteMany({});
    return Response.json({ message: 'All data deleted' });
  } catch (error) {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}