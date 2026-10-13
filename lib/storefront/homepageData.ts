import { prisma } from '@/lib/prisma';
import { concepts } from '@/lib/data';

/**
 * Assembles the homepage from real data, on the server.
 *
 * Everything shown is either a LivLab concept with authored hotspot
 * coordinates or a product row from the catalogue. Nothing is invented: a
 * product the database does not have simply does not get a card, and a price
 * that does not exist is not displayed.
 */

export interface RoomProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  priceMin: number | null;
  imageUrl: string | null;
  slug: string | null;
}

export interface RoomHotspot extends RoomProduct {
  xPercent: number;
  yPercent: number;
  label: string;
}

export interface FeaturedRoom {
  slug: string;
  title: string;
  description: string;
  /** The concept's own photograph — hotspots were authored against this one. */
  image: string;
  products: RoomProduct[];
  hotspots: RoomHotspot[];
  priceFrom: number | null;
  /** Sum of the real catalogue prices, or null when none of them have one. */
  priceTo: number | null;
}

export interface CollectionItem {
  slug: string;
  title: string;
  description: string;
  image: string;
}

/**
 * LivLab's own renders, matched to a concept by its TITLE rather than its
 * `style` field.
 *
 * The seed data is offset by one: every concept's `style` belongs to the next
 * concept's title, so "Minimal" is attached to "Phòng tắm phong cách khách
 * sạn". Choosing the image by style would put a white minimalist room under a
 * hotel headline. The title is what a customer reads, so the picture is
 * matched to that and the style label is not shown at all. Fixing the seed
 * itself is a content change, not a storefront one.
 */
const TITLE_IMAGES: { match: RegExp; image: string }[] = [
  { match: /japandi/i, image: '/images/concept-japandi-bathroom.png' },
  { match: /khách sạn/i, image: '/images/concept-hotel-gray-bathroom.png' },
  { match: /cao cấp|master|premium/i, image: '/images/concept-luxury-master-bathroom.png' },
  { match: /tối giản|trắng sáng|minimal/i, image: '/images/concept-minimal-white-bathroom.png' },
  { match: /tiết kiệm|cho thuê/i, image: '/images/concept-rental-budget-bathroom.png' },
  { match: /nhỏ|compact|4m/i, image: '/images/concept-compact-bathroom.png' },
];

/** Held back from the collections row so the page never repeats a render. */
export const ROOM_STUDIO_IMAGE = '/images/concept-luxury-master-bathroom.png';

function imageForTitle(title: string): string | null {
  return TITLE_IMAGES.find((entry) => entry.match.test(title))?.image ?? null;
}

export interface CategoryEntry {
  name: string;
  count: number;
  image: string;
  href: string;
}

export interface HomepageData {
  categories: CategoryEntry[];
  featured: FeaturedRoom | null;
  collections: CollectionItem[];
}

/**
 * The four sanitaryware categories the storefront leads with, in the order a
 * bathroom is specified. Each is a real catalogue category; one with no
 * products simply does not appear.
 */
const LEAD_CATEGORIES = ['Lavabo', 'Bồn cầu', 'Sen tắm', 'Gương'];

async function getCategories(): Promise<CategoryEntry[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { category: { in: LEAD_CATEGORIES }, imageUrl: { not: null } },
      select: { category: true, imageUrl: true },
      orderBy: { name: 'asc' },
    });

    return LEAD_CATEGORIES.map((name) => {
      const inCategory = rows.filter((r) => r.category === name);
      return {
        name,
        count: inCategory.length,
        image: inCategory[0]?.imageUrl ?? '',
        href: `/products?category=${encodeURIComponent(name)}`,
      };
    }).filter((c) => c.image);
  } catch {
    return [];
  }
}

/**
 * Catalogue scoping by tenant lands with the Phase 2 product work; until then
 * every storefront shows the same concepts, which is correct while LivLab has
 * one live tenant. See docs/storefront-tenant-fields.md.
 */
export async function getHomepageData(): Promise<HomepageData> {
  // The first concept whose style has a LivLab render, so the featured room is
  // shown at the quality the rest of the page is held to. Deterministic, so the
  // homepage does not shuffle between deploys.
  // The shoppable room must be a concept that has BOTH hotspots and products
  // the catalogue can resolve.
  const candidate = concepts.find((c) => (c.hotspots?.length ?? 0) > 0 && (c.productIds?.length ?? 0) > 0);

  let featured: FeaturedRoom | null = null;

  if (candidate) {
    const ids = [
      ...new Set([...(candidate.productIds ?? []), ...(candidate.hotspots ?? []).map((h) => h.productId)]),
    ].filter(Boolean) as string[];

    let rows: {
      id: string; name: string; brand: string | null; category: string | null;
      priceMin: number | null; imageUrl: string | null; slug: string | null;
    }[] = [];

    try {
      rows = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, brand: true, category: true, priceMin: true, imageUrl: true, slug: true },
      });
    } catch {
      // The homepage must still render without the database. It then shows the
      // room without product cards, which is honest, rather than failing.
      rows = [];
    }

    const prices = rows.map((r) => r.priceMin).filter((p): p is number => typeof p === 'number' && p > 0);

    const byId = new Map(rows.map((r) => [r.id, r]));
    const hotspots = (candidate.hotspots ?? [])
      .map((h) => {
        const product = byId.get(h.productId);
        return product ? { ...product, xPercent: h.xPercent, yPercent: h.yPercent, label: h.label } : null;
      })
      .filter((h): h is RoomHotspot => h !== null);

    featured = {
      slug: candidate.slug,
      title: candidate.title,
      description: candidate.shortDescription ?? '',
      // Asked for at editorial width. Unsplash serves the same photograph at
      // any size, so this is a larger render of the asset already in use.
      image: candidate.image.replace(/([?&])w=\d+/, '$1w=2000'),
      products: rows,
      hotspots,
      priceFrom: prices.length ? Math.min(...prices) : null,
      priceTo: prices.length ? prices.reduce((a, b) => a + b, 0) : null,
    };
  }

  // One concept per style, so the collections row reads as distinct looks
  // rather than six variations of the same room.
  // Deduped by IMAGE, so the row shows distinct rooms rather than the same
  // render under several headlines. The Room Studio section holds one render
  // back for itself.
  const seen = new Set<string>([ROOM_STUDIO_IMAGE]);
  const collections: CollectionItem[] = [];
  for (const concept of concepts) {
    const image = imageForTitle(concept.title);
    if (!image || seen.has(image) || concept.slug === featured?.slug) continue;
    seen.add(image);
    collections.push({
      slug: concept.slug,
      title: concept.title,
      description: concept.shortDescription ?? '',
      image,
    });
    if (collections.length >= 4) break;
  }

  return { categories: await getCategories(), featured, collections };
}
