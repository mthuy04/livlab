import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public concept catalog — no auth. Not wired into lib/storage.ts's sync layer yet:
// Prisma's Concept model has no hotspots/productIds columns, so every concept from
// this route always has hotspots: [] and productIds: []. Overwriting the concept
// cache with this route would wipe out the interactive hotspot experience (the demo's
// headline feature). This route exists for future use (e.g. an admin concepts
// dashboard) only — do not point the customer-facing concept cache at it.
export async function GET() {
  try {
    const concepts = await prisma.concept.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    if (concepts.length === 0) {
      return NextResponse.json({ concepts: [], isEmpty: true });
    }

    const mapped = concepts.map((c) => ({
      id: c.id,
      slug: c.slug || '',
      title: c.title || '',
      roomType: c.roomType || '',
      style: c.style || '',
      budgetRange: c.budgetRange || '',
      areaSize: c.areaRange || '',
      shortDescription: c.description || '',
      description: c.description || '',
      image: c.imageUrl || '',
      productIds: [],
      hotspots: [],
    }));

    return NextResponse.json({ concepts: mapped, isEmpty: false });
  } catch (error) {
    console.error('Error fetching public concepts:', error);
    return NextResponse.json({ error: 'Không tải được dữ liệu concept.' }, { status: 500 });
  }
}
