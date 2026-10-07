import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OfferAvailability } from '@prisma/client';
import { withSchemaGuard } from '@/lib/showroom/guards';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

/**
 * The showroom's catalogue: LivLab master products joined with this showroom's
 * commercial overlay.
 *
 * Master identity and specifications come from Product and are read-only here.
 * Only the overlay is writable, which is what keeps a showroom from editing
 * what a product IS while still letting it decide what it sells and for how
 * much.
 */
export async function GET(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('q')?.trim();
    const offeredOnly = url.searchParams.get('offered') === '1';

    const products = await prisma.product.findMany({
      where: {
        showroomId: ctx.showroomId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { brand: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 200,
    });

    const offers = await withSchemaGuard(() =>
      prisma.showroomProductOffer.findMany({
        where: { showroomId: ctx.showroomId, productId: { in: products.map((p) => p.id) } },
      })
    );
    const byProduct = new Map(offers.map((o) => [o.productId, o]));

    const items = products
      .map((product) => {
        const offer = byProduct.get(product.id);
        return {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          imageUrl: product.imageUrl,
          referencePriceMin: product.priceMin,
          referencePriceMax: product.priceMax,
          // Absent overlay means "not configured yet", which is why these are
          // null rather than defaulted to the reference price — a showroom
          // price nobody set is not a showroom price.
          isOffered: offer?.isOffered ?? null,
          showroomPrice: offer?.showroomPrice ?? null,
          promotionPrice: offer?.promotionPrice ?? null,
          availability: offer?.availability ?? OfferAvailability.UNKNOWN,
          leadTimeDays: offer?.leadTimeDays ?? null,
          updatedAt: offer?.updatedAt ?? null,
        };
      })
      .filter((item) => (offeredOnly ? item.isOffered === true : true));

    return NextResponse.json({ items });
  } catch (error) {
    return handleShowroomError(error);
  }
}

/** Upserts this showroom's overlay for one product. */
export async function PATCH(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const body = await request.json();
    if (typeof body?.productId !== 'string') {
      return NextResponse.json({ error: 'Thiếu sản phẩm.' }, { status: 400 });
    }

    // The product must belong to this showroom; otherwise a crafted productId
    // would create an overlay against someone else's catalogue row.
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true, showroomId: true },
    });
    if (!product || product.showroomId !== ctx.showroomId) {
      return NextResponse.json({ error: 'Sản phẩm không thuộc showroom của bạn.' }, { status: 403 });
    }

    const toPrice = (value: unknown): number | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null || value === '') return null;
      const n = Math.round(Number(value));
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };

    const availability =
      body.availability !== undefined && Object.values(OfferAvailability).includes(body.availability)
        ? body.availability
        : undefined;

    const payload = {
      isOffered: typeof body.isOffered === 'boolean' ? body.isOffered : undefined,
      showroomPrice: toPrice(body.showroomPrice),
      promotionPrice: toPrice(body.promotionPrice),
      availability,
      leadTimeDays: toPrice(body.leadTimeDays),
      note: typeof body.note === 'string' ? body.note : undefined,
    };

    const offer = await withSchemaGuard(() =>
      prisma.showroomProductOffer.upsert({
        where: { showroomId_productId: { showroomId: ctx.showroomId, productId: product.id } },
        create: { showroomId: ctx.showroomId, productId: product.id, ...payload, updatedById: ctx.user.id },
        update: { ...payload, updatedById: ctx.user.id },
      })
    );
    return NextResponse.json({ offer });
  } catch (error) {
    return handleShowroomError(error);
  }
}
