import type { QuoteItem } from '../types';
import { formatProductPrice } from './budgetCalculator';
import type { RoomStudioProduct } from './productAdapter';

export const quoteLineKey = (item: QuoteItem) =>
  item.roomDesignId
    ? JSON.stringify(['room', item.tenantId, item.roomDesignId, item.catalogProductId ?? item.productId])
    : item.sourceContext
    ? JSON.stringify(['catalog', item.tenantId, item.sourceContext, item.catalogProductId ?? item.productId])
    : item.productId;

export function reconcileRoomQuote(
  items: QuoteItem[],
  tenantId: string,
  designId: string,
  products: RoomStudioProduct[],
  addedAt: string
) {
  const owned = (i: QuoteItem) => i.roomDesignId === designId && i.tenantId === tenantId;
  const lines = new Map<string, QuoteItem>();
  for (const p of products) {
    const entry = p.quoteEntry;
    if (entry && entry.tenantId !== tenantId) throw new Error('Catalogue tenant mismatch');
    const id = entry?.catalogProductId ?? p.id,
      prior = lines.get(id);
    if (prior) {
      prior.quantity++;
      continue;
    }
    const existing = items.find((i) => owned(i) && (i.catalogProductId ?? i.productId) === id);
    lines.set(id, {
      productId: entry?.productId ?? p.id,
      catalogProductId: entry?.catalogProductId,
      sourceType: entry?.sourceType,
      tenantId,
      roomDesignId: designId,
      sourceContext: 'ROOM_DESIGN',
      // An unknown price is null, never a 0đ line in the quotation.
      priceSnapshot: entry ? entry.showroomPrice : p.priceMin && p.priceMin > 0 ? p.priceMin : null,
      name: p.name,
      sku: p.sku ?? p.id,
      category: p.category,
      brand: p.brand ?? '',
      priceMin: p.priceMin ?? 0,
      priceMax: p.priceMax ?? p.priceMin ?? 0,
      priceRange: formatProductPrice(p),
      unpriced: !(p.priceMin || p.priceMax),
      quantity: 1,
      image: p.imageUrl ?? null,
      showroomName: p.source.showroomName ?? '',
      showroomLocation: p.source.showroomLocation ?? '',
      addedAt: existing?.addedAt ?? addedAt,
    });
  }
  const next: QuoteItem[] = [];
  for (const item of items) {
    if (!owned(item)) {
      next.push(item);
      continue;
    }
    const key = item.catalogProductId ?? item.productId;
    const updated = lines.get(key);
    if (updated) next.push(updated);
    lines.delete(key);
  }
  next.push(...lines.values());
  return JSON.stringify(next) === JSON.stringify(items) ? items : next;
}
