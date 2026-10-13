/**
 * Room Studio budget. Reference product cost only — explicitly NOT a showroom
 * quotation: the showroom still confirms final price, promotions, stock and
 * installation/service cost.
 */

import type { RoomStudioProduct } from './productAdapter';

export interface BudgetEstimate {
  /** Sum of priceMin across placed items. */
  min: number;
  /** Sum of priceMax (falling back to priceMin) across placed items. */
  max: number;
  itemCount: number;
  /** Items placed in the room that carry no reference price at all. */
  unpricedCount: number;
}

export interface BudgetLine {
  product: RoomStudioProduct;
  quantity: number;
}

export function calculateRoomBudget(lines: BudgetLine[]): BudgetEstimate {
  let min = 0;
  let max = 0;
  let itemCount = 0;
  let unpricedCount = 0;

  for (const { product, quantity } of lines) {
    const qty = Math.max(1, quantity);
    itemCount += qty;
    const lo = product.priceMin ?? 0;
    const hi = product.priceMax ?? product.priceMin ?? 0;
    if (lo === 0 && hi === 0) {
      unpricedCount += qty;
      continue;
    }
    min += lo * qty;
    max += hi * qty;
  }

  return { min, max, itemCount, unpricedCount };
}

export function formatVnd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Liên hệ';
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

/**
 * One product's reference price, compactly.
 *
 * Always derived from the numbers rather than from the catalogue's pre-rendered
 * `priceRange` string, so Room Studio cannot end up showing `4.350.000đ` in one
 * place and `4.350.000 VNĐ` in another. "Từ" is doing real work: where a range
 * exists, the low end alone is not the price, and saying so is cheaper than
 * printing both in a 300px column.
 */
export function formatProductPrice(product: { priceMin?: number; priceMax?: number }): string {
  const lo = product.priceMin ?? 0;
  const hi = product.priceMax ?? lo;
  if (lo <= 0 && hi <= 0) return 'Liên hệ';
  if (hi > lo) return `Từ ${formatVnd(lo)}`;
  return formatVnd(lo);
}

export function formatBudgetRange(estimate: BudgetEstimate): string {
  if (estimate.min <= 0 && estimate.max <= 0) return 'Liên hệ';
  if (estimate.min === estimate.max) return formatVnd(estimate.min);
  return `${formatVnd(estimate.min)} – ${formatVnd(estimate.max)}`;
}
