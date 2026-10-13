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
  priceMax: number | null;
  priceRange: string | null;
  material: string | null;
  finish: string | null;
  dimensions: string | null;
  warranty: string | null;
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

/**
 * Which concept becomes the shoppable room, in order. Titles rather than the
 * `style` field, for the reason given above. The shoppable section is the one
 * place a customer looks closely at a room, so it gets the best render LivLab
 * has rather than whichever concept happens to be first in the seed.
 */
const FEATURED_PREFERENCE = [/master cao cấp/i, /luxury/i, /khách sạn/i, /japandi/i];

/**
 * Held back from the collections row so the page never repeats a render. The
 * Room Studio section shows a screenshot of the application, not a render, so
 * only the hero and the shoppable room reserve one.
 */
const HERO_IMAGE = '/images/hero-bathroom-luxury.png';

function imageForTitle(title: string): string | null {
  return TITLE_IMAGES.find((entry) => entry.match.test(title))?.image ?? null;
}

export interface CategoryEntry {
  name: string;
  image: string;
  /** Scale applied inside the stage so every product reads at one size. */
  imageScale: number;
  href: string;
}

export interface FeaturedProduct extends RoomProduct {
  imageScale: number;
}

export interface HomepageData {
  categories: CategoryEntry[];
  featured: FeaturedRoom | null;
  featuredProducts: FeaturedProduct[];
  collections: CollectionItem[];
}

/**
 * The product stage.
 *
 * The catalogue's shots are square with white margin baked in, but how much
 * margin varies enormously, so `object-contain` alone renders one product huge
 * and the next tiny. Each scale below was measured off the asset — the comment
 * gives its content box as width × height percent of the file — and solved so
 * the product's LARGER side lands at ~74% of the stage.
 *
 * Normalising on height alone was the earlier mistake: a wide object like the
 * TX109LD mixer then grew until it filled the stage sideways. Swapping an
 * image means re-measuring it.
 */
const STAGE_SCALE: Record<string, number> = {
  'llv-toi-toto-cs818dt2': 0.76,   // 79 × 97
  'llv-toi-toto-cs838dt8': 0.76,   // 65 × 97
  'llv-lav-toto-lt1705-xw': 0.81,  // 91 × 75
  'llv-lav-toto-lht328c': 0.81,    // 92 × 83
  'llv-sho-inax-bfv915s': 0.77,    // 30 × 96
  'llv-sho-inax-bfv655t8c': 0.82,  // 48 × 90
  'llv-fau-toto-tx109ld': 1.07,    // 69 × 54 — wide, so height alone misleads
  'llv-mir-karat-em0240250': 0.78, // 56 × 95
};

const stageScale = (id: string) => STAGE_SCALE[id] ?? 0.82;

/**
 * The four categories the storefront leads with, in the order a bathroom is
 * specified. `Bồn tắm` is not here because the catalogue holds no bathtub, so
 * the fourth slot is mirrors and accessories instead of an empty category.
 */
const LEAD_CATEGORIES: { name: string; productId: string; category: string }[] = [
  { name: 'Bồn cầu', productId: 'llv-toi-toto-cs818dt2', category: 'Bồn cầu' },
  { name: 'Chậu lavabo', productId: 'llv-lav-toto-lt1705-xw', category: 'Lavabo' },
  { name: 'Sen & vòi', productId: 'llv-sho-inax-bfv915s', category: 'Sen tắm' },
  { name: 'Gương & phụ kiện', productId: 'llv-mir-karat-em0240250', category: 'Gương' },
];

/** A toilet, a basin, a mixer and a shower — the spine of a bathroom spec. */
const FEATURED_PRODUCT_IDS = [
  'llv-toi-toto-cs838dt8',
  'llv-lav-toto-lht328c',
  'llv-fau-toto-tx109ld',
  'llv-sho-inax-bfv655t8c',
];

const PRODUCT_FIELDS = {
  id: true, name: true, brand: true, category: true,
  priceMin: true, priceMax: true, priceRange: true,
  material: true, finish: true, dimensions: true, warranty: true,
  imageUrl: true, slug: true,
} as const;

async function getCategories(): Promise<CategoryEntry[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: LEAD_CATEGORIES.map((c) => c.productId) } },
      select: { id: true, imageUrl: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r.imageUrl]));

    return LEAD_CATEGORIES.map((entry) => ({
      name: entry.name,
      image: byId.get(entry.productId) ?? '',
      imageScale: stageScale(entry.productId),
      href: `/products?category=${encodeURIComponent(entry.category)}`,
    })).filter((c) => c.image);
  } catch {
    return [];
  }
}

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: FEATURED_PRODUCT_IDS } },
      select: PRODUCT_FIELDS,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return FEATURED_PRODUCT_IDS.map((id) => {
      const row = byId.get(id);
      return row ? { ...row, imageScale: stageScale(id) } : null;
    }).filter((p): p is FeaturedProduct => p !== null && Boolean(p.imageUrl));
  } catch {
    return [];
  }
}

export async function getHomepageData(): Promise<HomepageData> {
  // The first concept whose style has a LivLab render, so the featured room is
  // shown at the quality the rest of the page is held to. Deterministic, so the
  // homepage does not shuffle between deploys.
  // The shoppable room must be a concept that has BOTH hotspots and products
  // the catalogue can resolve.
  const shoppable = concepts.filter(
    (c) => (c.hotspots?.length ?? 0) > 0 && (c.productIds?.length ?? 0) > 0 && imageForTitle(c.title)
  );
  const candidate =
    FEATURED_PREFERENCE.map((pattern) => shoppable.find((c) => pattern.test(c.title))).find(Boolean) ??
    shoppable[0] ??
    concepts.find((c) => (c.hotspots?.length ?? 0) > 0 && (c.productIds?.length ?? 0) > 0);

  let featured: FeaturedRoom | null = null;

  if (candidate) {
    const ids = [
      ...new Set([...(candidate.productIds ?? []), ...(candidate.hotspots ?? []).map((h) => h.productId)]),
    ].filter(Boolean) as string[];

    let rows: RoomProduct[] = [];

    try {
      rows = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: PRODUCT_FIELDS,
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
      // LivLab's own render where there is one. The seed's stock photograph is
      // the fallback, asked for at editorial width.
      image: imageForTitle(candidate.title) ?? candidate.image.replace(/([?&])w=\d+/, '$1w=2000'),
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
  const seen = new Set<string>([HERO_IMAGE, featured?.image ?? '']);
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

  const [categories, featuredProducts] = await Promise.all([getCategories(), getFeaturedProducts()]);
  return { categories, featured, featuredProducts, collections };
}
