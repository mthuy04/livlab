import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { concepts as fallbackConcepts } from '@/lib/data';
import { seededConcepts } from '@/lib/seedData';

export async function GET() {
  try {
    const concepts = await prisma.concept.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (concepts.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('[API] DB rỗng, trả về fallback demo data (Development)');
      const fallback = seededConcepts.length > 0 ? seededConcepts : fallbackConcepts;
      return NextResponse.json({ concepts: fallback, source: 'fallback' });
    }

    if (concepts.length === 0) {
      return NextResponse.json({ error: 'Không tải được dữ liệu từ database. Bảng Concept hiện đang trống.' }, { status: 404 });
    }

    const mappedConcepts = concepts.map(c => ({
      id: c.id,
      slug: c.slug || '',
      title: c.name, // Prisma uses name
      roomType: c.roomType || '',
      style: c.style || '',
      budgetRange: c.budgetRange || '',
      areaSize: '',
      shortDescription: c.description || '',
      description: c.description || '',
      image: c.image || '/images/concepts/placeholder-room.jpg',
      productIds: [],
      hotspots: []
    }));

    return NextResponse.json({ concepts: mappedConcepts, source: 'database' });
  } catch (error) {
    console.error('Error fetching concepts:', error);
    return NextResponse.json({ error: 'Không tải được dữ liệu từ database.' }, { status: 500 });
  }
}
