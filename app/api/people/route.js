// app/api/people/route.js
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET: List people with pagination, search, age filter
export async function GET(request) {
  await dbConnect();

  // ← Everything that uses request.url MUST be inside the function
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = 15;
  const search = url.searchParams.get('search') || '';
  const minAge = url.searchParams.get('minAge') || '';
  const maxAge = url.searchParams.get('maxAge') || '';

  const filter = {};

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [
      { name: regex },
      { email: regex },
      { city: regex },
      { phone: regex },
      { age: { $regex: search, $options: 'i' } } // age should also be string regex if searching
    ];
  }

  if (minAge || maxAge) {
    filter.age = {};
    if (minAge) filter.age.$gte = parseInt(minAge);
    if (maxAge) filter.age.$lte = parseInt(maxAge);
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
    totalPages: Math.ceil(total / limit)
  });
}

// POST: Add new person
export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();

    // Clean unwanted fields
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    const person = await Person.create(body);
    return Response.json(person, { status: 201 });
  } catch (error) {
    console.error('Add person error:', error);
    return Response.json({ error: 'Failed to add person' }, { status: 500 });
  }
}

// PUT: Edit existing person
export async function PUT(request) {
  await dbConnect();
  try {
    const { _id, ...updateData } = await request.json();

    const person = await Person.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });

    if (!person) {
      return Response.json({ error: 'Person not found' }, { status: 404 });
    }
    return Response.json(person);
  } catch (error) {
    console.error('Update error:', error);
    return Response.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE: Single delete
export async function DELETE(request) {
  await dbConnect();

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    const result = await Person.findByIdAndDelete(id);
    if (!result) {
      return Response.json({ error: 'Person not found' }, { status: 404 });
    }
    return Response.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return Response.json({ error: 'Failed to delete' }, { status: 500 });
  }
}