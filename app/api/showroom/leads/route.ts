import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { demoShowroomLeads } from '@/lib/showroomDemoData';
import { getSessionUser, hasRole, unauthorized, forbidden, showroomScopeFilter } from '@/lib/auth/session';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN', 'SHOWROOM')) return forbidden();

  try {
    const leads = await prisma.quoteLead.findMany({
      where: showroomScopeFilter(user),
      include: {
        items: {
          include: { product: true }
        },
        showroom: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Only ADMIN's unscoped query can tell us the table itself is empty. A SHOWROOM
    // user's result being empty may just mean they're correctly scoped to zero
    // (e.g. not assigned to a showroom yet) — showing demo data there would defeat
    // the showroom scoping this route exists to enforce.
    if (leads.length === 0 && process.env.NODE_ENV === 'development' && user.role === 'ADMIN') {
      console.log('[API] DB rỗng, trả về fallback demo data (Development)');
      return NextResponse.json({ leads: demoShowroomLeads, source: 'fallback' });
    }

    if (leads.length === 0) {
      return NextResponse.json({ leads: [], source: 'database' }, { status: 200 });
    }

    const statusMap: Record<string, any> = {
      NEW: 'Mới',
      CONTACTED: 'Đã liên hệ',
      QUOTED: 'Đã báo giá',
      WON: 'Đã chốt',
      LOST: 'Mất lead'
    };

    const mappedLeads = leads.map(l => ({
      id: l.id,
      requestCode: l.id.slice(-6).toUpperCase(),
      customerName: l.customerName,
      email: l.email || '',
      phone: l.phone || '',
      roomType: l.roomType || '',
      budgetRange: l.budgetRange || '',
      selectedConcept: l.conceptName || '',
      notes: l.notes || '',
      status: statusMap[l.status] || 'Mới',
      createdAt: l.createdAt.toISOString(),
      estimatedValueMin: l.estimatedValue || 0,
      estimatedValueMax: l.estimatedValue || 0,
      selectedProducts: l.items.map(item => ({
        productId: item.productId,
        name: item.productName,
        quantity: item.quantity,
        priceMin: item.priceMin || 0,
        priceMax: item.priceMax || 0,
        image: item.product?.imageUrl || null
      })),
      needsInstallation: false,
      consent: l.consent,
      aiSummary: l.aiSummary,
      aiFitScore: l.aiFitScore,
      aiSource: l.aiSource,
      budgetMin: l.budgetMin,
      budgetMax: l.budgetMax,
      budgetFit: l.budgetFit
    }));

    return NextResponse.json({ leads: mappedLeads, source: 'database' });
  } catch (error) {
    console.error('Error fetching showroom leads:', error);
    return NextResponse.json({ error: 'Không tải được dữ liệu từ database.' }, { status: 500 });
  }
}
