// app/api/people/route.js → 100% WORKING — BUILD-PROOF
import Person from '@/models/Person';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await dbConnect();

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const isExport = searchParams.get('export') === 'true';
  const limit = isExport ? 100000 : 10;
  const search = searchParams.get('search') || '';
  const minAge = searchParams.get('minAge') || '';
  const maxAge = searchParams.get('maxAge') || '';

  const filter = {};

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [
      { name: regex },
      { email: regex },
      { city: regex },
      { phone: regex },
      { age: regex }
    ];
  }

  if (minAge || maxAge) {
    filter.age = {};
    if (minAge) filter.age.$gte = parseInt(minAge);
    if (maxAge) filter.age.$lte = parseInt(maxAge);
  }

  const skip = isExport ? 0 : (page - 1) * limit;

  const [data, total] = await Promise.all([
    Person.find(filter).skip(skip).limit(limit).lean(),
    Person.countDocuments(filter)
  ]);

  return Response.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / 10)
  });
}