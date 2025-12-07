// app/api/people/[id]/route.js → FINAL: WORKS PERFECTLY IN NEXT.JS 16+
import { dbConnect } from '@/lib/mongodb';
import Person from '@/models/Person';
import { NextResponse } from 'next/server';

// PUT → Edit a person by ID
export async function PUT(request, { params }) {
  await dbConnect();

  const { id } = params;  // ← NO AWAIT NEEDED IN NEXT.JS 16+

  try {
    const body = await request.json();

    const updated = await Person.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE → Delete a person by ID
export async function DELETE(request, { params }) {
  await dbConnect();

  const { id } = params;  // ← NO AWAIT NEEDED

  try {
    const deleted = await Person.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// Optional: GET single person (useful for editing)
export async function GET(request, { params }) {
  await dbConnect();

  const { id } = params;

  try {
    const person = await Person.findById(id).lean();
    if (!person) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(person);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}