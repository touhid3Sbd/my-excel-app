// app/api/people/page/route.js
import Person from '@/models/Person';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 10;
  const search = searchParams.get('search') || '';
  const minAge = searchParams.get('minAge') || '';
  const maxAge = searchParams.get('maxAge') || '';
  const isExport = searchParams.get('export') === 'true';

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { age: { $regex: search, $options: 'i' } }
    ];
  }

  if (minAge || maxAge) {
    filter.age = {};
    if (minAge) filter.age.$gte = parseInt(minAge);
    if (maxAge) filter.age.$lte = parseInt(maxAge);
  }

  const skip = isExport ? 0 : (page - 1) * limit;
  const limitValue = isExport ? 10000 : limit;

  const [data, total] = await Promise.all([
    Person.find(filter).skip(skip).limit(limitValue).lean(),
    Person.countDocuments(filter)
  ]);

  return Response.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}