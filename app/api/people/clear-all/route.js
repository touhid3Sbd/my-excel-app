// app/api/people/clear-all/route.js
import Person from '@/models/Person';

export async function POST() {
  await Person.deleteMany({});
  return Response.json({ message: 'All data deleted' });
}