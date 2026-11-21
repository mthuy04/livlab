/**
 * LivLab reference prices for SKUs with no showroom offer.
 *
 * One versioned file (data/pricing/reference-prices.json), each price with its
 * source URL, its kind and the date it was checked. A reference price is never
 * a showroom quotation: every surface that shows one labels it by `basis`.
 * SKUs with no verifiable Vietnamese price are listed separately and stay
 * unpriced — no number is invented and no other model's price is borrowed.
 */
import data from '@/data/pricing/reference-prices.json';

export type ReferencePriceKind = 'MANUFACTURER_LIST' | 'RETAILER_PUBLIC';

export interface ReferencePrice {
  brand: string;
  sku: string;
  priceVnd: number;
  /** A promotion shown beside the list price on the same page; informational only. */
  promoPriceVnd?: number;
  kind: ReferencePriceKind;
  sourceName: string;
  sourceUrl: string;
  checkedAt: string;
  /** Set when the price needs a human to confirm it before quoting. */
  needsReview?: string;
}

export interface UnpricedSku {
  brand: string;
  sku: string;
  checkedAt: string;
  reason: string;
}

const key = (brand: string, sku: string) => `${brand.toUpperCase()}::${sku.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

const PRICES = new Map((data.prices as ReferencePrice[]).map((p) => [key(p.brand, p.sku), p]));

export const UNPRICED_SKUS: UnpricedSku[] = data.unpriced as UnpricedSku[];
export const REFERENCE_PRICES: ReferencePrice[] = [...PRICES.values()];

export function referencePriceFor(brand: string | null | undefined, sku: string | null | undefined): ReferencePrice | null {
  if (!brand || !sku) return null;
  const price = PRICES.get(key(brand, sku));
  return price && price.priceVnd > 0 ? price : null;
}

/** What the figure is, in the shopper's words. "hãng" triggers the manufacturer disclaimer on detail pages. */
export function referencePriceBasis(price: ReferencePrice): string {
  return price.kind === 'MANUFACTURER_LIST' ? 'Giá hãng đề xuất' : `Giá bán lẻ tham khảo · ${price.sourceName}`;
}
