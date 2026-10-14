import type { CatalogProduct } from './catalogTypes';

/**
 * The catalogue's filter model.
 *
 * Every option is derived from the products actually in the tenant's
 * catalogue — a filter with nothing behind it is never rendered — and the
 * whole state round-trips through the URL, so a filtered view can be
 * refreshed, shared and navigated back to.
 */

export interface CatalogFilters {
  category: string | null;
  brands: string[];
  subcategories: string[];
  priceMin: number | null;
  priceMax: number | null;
  colors: string[];
  availability: string[];
  roomStudio: boolean;
  search: string;
  sort: SortKey;
  page: number;
}

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'name', label: 'Tên A–Z' },
];

/**
 * Price bands that span the real catalogue: a wall-hung basin and a smart
 * toilet are two orders of magnitude apart, so a top band of "trên 20 triệu"
 * would hold most of the expensive half of the shop.
 */
export const PRICE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Dưới 5 triệu', min: null, max: 5_000_000 },
  { label: '5 – 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: '10 – 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: '20 – 40 triệu', min: 20_000_000, max: 40_000_000 },
  { label: 'Trên 40 triệu', min: 40_000_000, max: null },
];

export const PAGE_SIZE = 18;

export const EMPTY_FILTERS: CatalogFilters = {
  category: null,
  brands: [],
  subcategories: [],
  priceMin: null,
  priceMax: null,
  colors: [],
  availability: [],
  roomStudio: false,
  search: '',
  sort: 'featured',
  page: 1,
};

/* ── URL state ───────────────────────────────────────────────────────────── */

export function filtersFromParams(params: URLSearchParams): CatalogFilters {
  const list = (key: string) => (params.get(key) ? params.get(key)!.split(',').filter(Boolean) : []);
  const num = (key: string) => {
    const raw = params.get(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const sort = params.get('sort') as SortKey | null;

  return {
    category: params.get('category'),
    brands: list('brand'),
    subcategories: list('type'),
    priceMin: num('priceMin'),
    priceMax: num('priceMax'),
    colors: list('color'),
    availability: list('availability'),
    roomStudio: params.get('roomStudio') === '1',
    search: params.get('q') ?? '',
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : 'featured',
    page: Math.max(1, num('page') ?? 1),
  };
}

export function paramsFromFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  const set = (key: string, value: string | null) => {
    if (value) params.set(key, value);
  };
  set('category', filters.category);
  set('brand', filters.brands.join(','));
  set('type', filters.subcategories.join(','));
  set('priceMin', filters.priceMin ? String(filters.priceMin) : null);
  set('priceMax', filters.priceMax ? String(filters.priceMax) : null);
  set('color', filters.colors.join(','));
  set('availability', filters.availability.join(','));
  if (filters.roomStudio) params.set('roomStudio', '1');
  set('q', filters.search.trim() || null);
  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function activeFilterCount(filters: CatalogFilters): number {
  return (
    (filters.category ? 1 : 0) +
    filters.brands.length +
    filters.subcategories.length +
    filters.colors.length +
    filters.availability.length +
    (filters.priceMin || filters.priceMax ? 1 : 0) +
    (filters.roomStudio ? 1 : 0) +
    (filters.search.trim() ? 1 : 0)
  );
}

/* ── Applying them ───────────────────────────────────────────────────────── */

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

/** Name, SKU, brand and category — the four things a customer types. */
export function matchesSearch(product: CatalogProduct, query: string): boolean {
  const q = normalise(query.trim());
  if (!q) return true;
  const haystack = normalise(
    [product.name, product.sku ?? '', product.brand, product.category, product.subcategory ?? ''].join(' ')
  );
  return q.split(/\s+/).every((term) => haystack.includes(term));
}

export function applyFilters(products: CatalogProduct[], filters: CatalogFilters): CatalogProduct[] {
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false;
    if (filters.subcategories.length > 0 && !(p.subcategory && filters.subcategories.includes(p.subcategory)))
      return false;
    if (filters.colors.length > 0 && !(p.color && filters.colors.includes(p.color))) return false;
    if (filters.availability.length > 0 && !(p.availability && filters.availability.includes(p.availability)))
      return false;
    if (filters.roomStudio && !p.roomStudioReady) return false;

    const price = p.showroomPrice;
    if (filters.priceMin !== null && (price === null || price < filters.priceMin)) return false;
    if (filters.priceMax !== null && (price === null || price > filters.priceMax)) return false;

    return matchesSearch(p, filters.search);
  });
}

export function sortProducts(products: CatalogProduct[], sort: SortKey): CatalogProduct[] {
  const out = [...products];
  switch (sort) {
    case 'price-asc':
      return out.sort((a, b) => (a.showroomPrice ?? Infinity) - (b.showroomPrice ?? Infinity));
    case 'price-desc':
      return out.sort((a, b) => (b.showroomPrice ?? -1) - (a.showroomPrice ?? -1));
    case 'name':
      return out.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    case 'newest':
      // The catalogue arrives newest-first from both sources.
      return out;
    case 'featured':
    default:
      // Priced products with a real saving first; they are the ones a
      // showroom actually wants in front of a customer.
      return out.sort((a, b) => {
        const score = (p: CatalogProduct) =>
          (p.showroomPrice ? 2 : 0) + (p.referencePrice ? 1 : 0) + (p.dimensions ? 1 : 0);
        return score(b) - score(a);
      });
  }
}

/* ── Facets ──────────────────────────────────────────────────────────────── */

export interface Facet {
  value: string;
  label: string;
  count: number;
}

function tally(values: (string | null)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

const toFacets = (counts: Map<string, number>, order?: string[]): Facet[] => {
  const facets = [...counts.entries()].map(([value, count]) => ({ value, label: value, count }));
  if (order) {
    return facets.sort((a, b) => {
      const ia = order.indexOf(a.value);
      const ib = order.indexOf(b.value);
      if (ia === -1 && ib === -1) return b.count - a.count;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }
  return facets.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'vi'));
};

/**
 * Facets are counted against the catalogue narrowed by every filter EXCEPT the
 * one being built, so ticking a second brand does not make the first look like
 * it has no products.
 */
export function buildFacets(products: CatalogProduct[], filters: CatalogFilters) {
  const without = (key: keyof CatalogFilters) =>
    applyFilters(products, { ...filters, [key]: EMPTY_FILTERS[key] } as CatalogFilters);

  return {
    categories: toFacets(tally(applyFilters(products, { ...filters, category: null, subcategories: [] }).map((p) => p.category))),
    brands: toFacets(tally(without('brands').map((p) => p.brand))),
    subcategories: toFacets(tally(without('subcategories').map((p) => p.subcategory))),
    colors: toFacets(tally(without('colors').map((p) => p.color))),
    availability: toFacets(tally(without('availability').map((p) => p.availability))),
    roomStudio: without('roomStudio').filter((p) => p.roomStudioReady).length,
  };
}
