// app/api/people/[id]/route.js → FIXED FOR NEXT.JS 16 (await params)
import { dbConnect } from '@/lib/mongodb';
import Person from '@/models/Person';
import { NextResponse } from 'next/server';

// PUT — Edit row
export async function PUT(request, { params }) {
  await dbConnect();

  const { id } = await params; // ← MUST AWAIT params IN NEXT.JS 16

  try {
    const body = await request.json();
    const updated = await Person.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updated) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE — Delete row
export async function DELETE(request, { params }) {
  await dbConnect();

  const { id } = await params; // ← MUST AWAIT params IN NEXT.JS 16

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

// Optional: GET single row (for future use)
export async function GET(request, { params }) {
  await dbConnect();

  const { id } = await params;

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