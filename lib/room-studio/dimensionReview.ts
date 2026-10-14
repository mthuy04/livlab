/**
 * Catalogue rows whose stated dimensions are not trusted.
 *
 * Separate from the 3D registry on purpose: this is a defect in the product
 * DATA, not in any model. A model can be converted perfectly and still be
 * checked against a figure that is wrong, and the check would pass — which is
 * the worst outcome available, because it produces a verified-looking asset
 * built on a number nobody confirmed.
 *
 * Nothing here corrects a figure. Reinterpreting a manufacturer's published
 * dimension because it looks implausible is how a guess acquires the authority
 * of a spec sheet. The only thing recorded is that a person has to go and read
 * the source.
 */

export interface DimensionReview {
  sku: string;
  brand: string;
  /** Exactly as the catalogue states it. Never edited here. */
  catalogueValue: string;
  reason: string;
  /** What would settle it. */
  resolution: string;
}

export const DIMENSION_REVIEW_REQUIRED: DimensionReview[] = [
  {
    sku: 'BFV-655T-8C',
    brand: 'INAX',
    catalogueValue: '575 x 1176 x 450 mm',
    reason:
      'Đọc theo quy ước W × D × H của danh mục thì đây là cây sen sâu 1,18 m — ' +
      'sâu hơn cả chiều cao. Nhiều khả năng dòng này ghi W × H × D, nhưng đó là ' +
      'suy đoán, và các cây sen khác trong danh mục đều ghi W × D × H.',
    resolution:
      'Showroom đối chiếu với catalogue INAX cho BFV-655T-8C và xác nhận thứ tự ' +
      'ba số. Sửa dữ liệu nguồn, không sửa ở đây.',
  },
];

const BY_SKU = new Map(DIMENSION_REVIEW_REQUIRED.map((r) => [r.sku.toUpperCase(), r]));

/** Whether this SKU's stated dimensions are under review. */
export function needsDimensionReview(sku: string | null | undefined): boolean {
  return Boolean(sku && BY_SKU.has(sku.toUpperCase()));
}

export function dimensionReviewFor(sku: string | null | undefined): DimensionReview | null {
  if (!sku) return null;
  return BY_SKU.get(sku.toUpperCase()) ?? null;
}
