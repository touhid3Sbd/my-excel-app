// app/api/people/route.js → FINAL: SEARCH WORKS (GLOBAL + COLUMN-SPECIFIC)
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await dbConnect();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const isExport = url.searchParams.get('export') === 'true';
  const limit = isExport ? 0 : 15;
  const search = url.searchParams.get('search') || '';
  const column = url.searchParams.get('column') || '';
  const allColumns = url.searchParams.get('all') === 'true'; // ← NEW: All columns search

  let filter = {};

  if (search.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };

    if (allColumns || !column) {
      // SEARCH ALL STRING FIELDS
      filter.$or = [
        { clientName: regex },
        { status: regex },
        { teritory: regex },
        { parent: regex },
        { software: regex },
        { collector: regex },
        { rep: regex },
        { remarks: regex },
        { otoMatic: regex },
        { controlHub: regex },
        { zone: regex },
        { contacts1: regex },
        { ownerName: regex },
        { phoneNumber: regex },
        { managerName: regex },
        { phoneNumber1: regex },
        { scFrom: regex },
        { contractPaper: regex },
        { ultraViwer: regex }
        // Add any other string fields here
      ];
    } else if (column) {
      // SEARCH SPECIFIC COLUMN
      filter[column] = regex;
    }
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
    totalPages: Math.ceil(total / 15)
  });
}

// POST - Add new row (unchanged)
export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const person = await Person.create(body);
    return Response.json(person, { status: 201 });
  } catch (error) {
    console.error('Add error:', error);
    return Response.json({ error: 'Failed to add' }, { status: 500 });
  }
}

// PUT - Edit row (unchanged)
export async function PUT(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { _id, ...updateData } = body;
    const updated = await Person.findByIdAndUpdate(_id, updateData, { new: true });
    return Response.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    return Response.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Single delete (unchanged)
export async function DELETE(request) {
  await dbConnect();

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    await Person.findByIdAndDelete(id);
    return Response.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return Response.json({ error: 'Failed to delete' }, { status: 500 });
  }
}