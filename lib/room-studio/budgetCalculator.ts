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

export function formatBudgetRange(estimate: BudgetEstimate): string {
  if (estimate.min <= 0 && estimate.max <= 0) return 'Liên hệ';
  if (estimate.min === estimate.max) return formatVnd(estimate.min);
  return `${formatVnd(estimate.min)} – ${formatVnd(estimate.max)}`;
}
