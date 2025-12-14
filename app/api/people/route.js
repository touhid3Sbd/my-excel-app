// app/api/people/route.js → FINAL: DYNAMIC SEARCH ON ALL COLUMNS + 15 PER PAGE
import Person from '@/models/Person';
import { dbConnect } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await dbConnect();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = url.searchParams.get('export') === 'true' ? 0 : 15;
  const search = url.searchParams.get('search') || '';

  let filter = {};

  if (search.trim()) {
    // DYNAMIC SEARCH: search in EVERY field
    filter = {
      $or: [
        // This will match any string field containing the search term
        { $text: { $search: search } }, // if you have text index
      ]
    };

    // Fallback: manual regex on all possible string fields (safe for dynamic)
    // Since model is strict: false, we use regex on common patterns
    filter = {
      $or: Object.keys(Person.schema.paths)
        .filter(key => Person.schema.paths[key].instance === 'String')
        .map(key => ({ [key]: { $regex: search, $options: 'i' } }))
    };
  }

  const skip = limit === 0 ? 0 : (page - 1) * 15;

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

// Keep your POST, PUT, DELETE as before (or use the previous dynamic ones)