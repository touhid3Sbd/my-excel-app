// app/api/people/page/route.js
// SERVER-SIDE PAGINATION + SEARCH + AGE FILTER
import dbConnect from '@/lib/mongodb';
import Person from '@/models/Person';

export async function GET(request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = 10;
  const search = searchParams.get('search') || '';
  const minAge = searchParams.get('minAge') || '';
  const maxAge = searchParams.get('maxAge') || '';

  // Build filter
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (minAge || maxAge) {
    const ageFilter = {};
    if (minAge) ageFilter.$gte = parseInt(minAge);
    if (maxAge) ageFilter.$lte = parseInt(maxAge);
    if (Object.keys(ageFilter).length > 0) {
      filter.age = ageFilter;
    }
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Person.find(filter).skip(skip).limit(limit).lean(),
    Person.countDocuments(filter)
  ]);

  return Response.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  });
}