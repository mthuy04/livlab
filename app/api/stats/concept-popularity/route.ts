import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Key = conceptName trimmed + lowercased, so "Japandi Nhỏ Gọn " and "japandi nhỏ gọn"
// count as the same concept even if formatting drifted between submissions.
function normalizeConceptName(name: string): string {
  return name.trim().toLowerCase();
}

export async function GET() {
  try {
    const grouped = await prisma.quoteLead.groupBy({
      by: ['conceptName'],
      where: { conceptName: { not: null } },
      _count: true,
    });

    console.log('[concept-popularity] raw groupBy result:', grouped);

    const counts: Record<string, number> = {};
    for (const row of grouped) {
      if (!row.conceptName) continue;
      const key = normalizeConceptName(row.conceptName);
      if (!key) continue;
      counts[key] = (counts[key] || 0) + row._count;
    }

    console.log('[concept-popularity] normalized counts:', counts);

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('[concept-popularity] Error fetching concept popularity:', error);
    return NextResponse.json({ counts: {} }, { status: 500 });
  }
}
