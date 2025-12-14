// app/api/people/route.js → FIXED SEARCH + FULL CRUD
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await dbConnect();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const exportMode = url.searchParams.get('export') === 'true';
  const limit = exportMode ? 0 : 15;
  const search = (url.searchParams.get('search') || '').trim();

  let filter = {};

  if (search) {
    // Improved: Handle both _id (ObjectId) separately + all String fields
    const orConditions = [];

    // 1. If search looks like a valid MongoDB ObjectId, add _id match
    if (ObjectId.isValid(search) && search.length === 24) {
      orConditions.push({ _id: new ObjectId(search) });
    }

    // 2. Dynamic regex search on ALL String fields
    const stringFields = Object.keys(Person.schema.paths)
      .filter((key) => {
        const path = Person.schema.paths[key];
        return path.instance === 'String' && key !== '__v';
      });

    if (stringFields.length > 0) {
      orConditions.push(
        ...stringFields.map((field) => ({
          [field]: { $regex: search, $options: 'i' },
        }))
      );
    }

    if (orConditions.length > 0) {
      filter = { $or: orConditions };
    }
  }

  const skip = limit === 0 ? 0 : (page - 1) * 15;

  const [data, total] = await Promise.all([
    Person.find(filter).skip(skip).limit(limit).lean(),
    Person.countDocuments(filter),
  ]);

  return Response.json({
    data,
    total,
    page,
    totalPages: limit === 0 ? 1 : Math.ceil(total / 15),
    isExport: exportMode,
  });
}

// POST - Create a new person (unchanged)
export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const person = await Person.create(body);
    return Response.json({ success: true, data: person }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// PUT - Update an existing person by ID (unchanged)
export async function PUT(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return Response.json(
        { success: false, error: 'ID is required for update' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(_id)) {
      return Response.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const updatedPerson = await Person.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedPerson) {
      return Response.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: updatedPerson });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE - Delete a person by ID (unchanged)
export async function DELETE(request) {
  await dbConnect();

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json(
        { success: false, error: 'ID is required for deletion' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const deletedPerson = await Person.findByIdAndDelete(id);

    if (!deletedPerson) {
      return Response.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, message: 'Person deleted successfully' });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}