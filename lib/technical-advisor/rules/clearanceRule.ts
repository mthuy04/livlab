/**
 * Rule 3 — is there enough free space in front of the product?
 *
 * The critical constraint here is what this rule refuses to do. There is no
 * universal bathroom clearance table in LivLab's data, so the rule does NOT
 * invent one. It only runs when a product's own metadata states a recommended
 * figure, and when it reports one it attributes it to LivLab reference data —
 * never to a standard or a building code.
 *
 * Products with no clearance figure are still reported — a silent pass would
 * read as "checked and fine" — but they are aggregated into ONE finding rather
 * than one per product. With only two products in the catalogue carrying a
 * clearance figure, per-product notices buried the findings that were actually
 * actionable.
 *
 * "In front" means along +Z in the room frame (the open side of the room),
 * rotated by the product's own yaw.
 */

import { getRoomBounds } from '@/lib/room-studio/roomGeometry';
import { formatCm, getOverlap, getWorldAabb, type Aabb } from '../geometry';
import type { TechnicalProductEntry, TechnicalRule, TechnicalValidationResult } from '../types';

function boxFor(entry: TechnicalProductEntry): Aabb | null {
  const { metadata, placed } = entry;
  if (metadata.width === undefined || metadata.depth === undefined || metadata.height === undefined) return null;
  return getWorldAabb({
    position: placed.position,
    width: metadata.width,
    depth: metadata.depth,
    height: metadata.height,
    rotationY: placed.rotationY,
  });
}

export const clearanceRule: TechnicalRule = {
  id: 'clearance',
  category: 'CLEARANCE',

  run(context) {
    const results: TechnicalValidationResult[] = [];
    const bounds = getRoomBounds(context.room);

    const boxes = context.entries.map((entry) => ({ entry, box: boxFor(entry) }));
    const withoutFigure: string[] = [];

    for (const { entry, box } of boxes) {
      const { placed, product, metadata } = entry;
      const recommendedFront = metadata.recommendedClearance?.front;

      if (recommendedFront === undefined) {
        // No figure exists. Collect and report once at the end — never guess,
        // but also never repeat the same notice for every product.
        withoutFigure.push(product.name);
        continue;
      }

      if (!box) {
        results.push({
          id: `clearance:${placed.instanceId}`,
          ruleId: 'clearance',
          category: 'CLEARANCE',
          severity: 'VERIFY',
          title: 'Chưa đủ kích thước để đo khoảng trống',
          message: `LivLab chưa có đầy đủ kích thước của ${product.name}, nên chưa thể đo khoảng trống phía trước.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'UNKNOWN',
          confidence: 'LOW',
          requiresHumanVerification: true,
          reason: 'MISSING_DATA',
        });
        continue;
      }

      // Free run from the product's front face to the open side of the room,
      // minus anything standing in the way.
      let available = bounds.maxZ - box.maxZ;
      let blockedBy: string | null = null;

      for (const other of boxes) {
        if (other.entry.placed.instanceId === placed.instanceId || !other.box) continue;
        // Only things actually in front, and actually overlapping this
        // product's width and height band.
        if (other.box.minZ < box.maxZ) continue;
        const overlap = getOverlap(box, other.box);
        if (overlap.x <= 0 || overlap.y <= 0) continue;

        const gap = other.box.minZ - box.maxZ;
        if (gap < available) {
          available = gap;
          blockedBy = other.entry.product.name;
        }
      }

      if (available >= recommendedFront) {
        results.push({
          id: `clearance:${placed.instanceId}`,
          ruleId: 'clearance',
          category: 'CLEARANCE',
          severity: 'SUITABLE',
          title: 'Khoảng trống phía trước đạt khuyến nghị',
          message: `Khoảng trống phía trước ${product.name} hiện khoảng ${formatCm(available)}, đạt mức ${formatCm(recommendedFront)} theo dữ liệu tham khảo của LivLab.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'PRODUCT_METADATA',
          confidence: 'MEDIUM',
          requiresHumanVerification: false,
        });
        continue;
      }

      results.push({
        id: `clearance:${placed.instanceId}`,
        ruleId: 'clearance',
        category: 'CLEARANCE',
        severity: 'OPTIMIZE',
        title: 'Khoảng trống phía trước còn hạn chế',
        message:
          `Khoảng trống phía trước ${product.name} hiện khoảng ${formatCm(available)}; dữ liệu tham khảo của LivLab khuyến nghị khoảng ${formatCm(recommendedFront)}.` +
          (blockedBy ? ` Vị trí này đang bị ${blockedBy} chắn phía trước.` : ''),
        affectedInstanceIds: [placed.instanceId],
        dataSource: 'PRODUCT_METADATA',
        confidence: 'MEDIUM',
        requiresHumanVerification: false,
        suggestedAction: blockedBy
          ? 'Thử dịch một trong hai sản phẩm để mở rộng lối thao tác.'
          : 'Thử dịch sản phẩm lùi lại để có thêm khoảng thao tác.',
      });
    }

    if (withoutFigure.length > 0) {
      const named = withoutFigure.slice(0, 2).join(', ');
      const extra = withoutFigure.length - Math.min(2, withoutFigure.length);
      results.push({
        id: 'clearance:no-data',
        ruleId: 'clearance',
        category: 'CLEARANCE',
        severity: 'VERIFY',
        title: 'Chưa có dữ liệu khoảng trống khuyến nghị',
        message: `LivLab chưa có dữ liệu khoảng trống khuyến nghị cho ${named}${
          extra > 0 ? ` và ${extra} sản phẩm khác` : ''
        }, nên chưa thể đánh giá không gian thao tác phía trước các sản phẩm này.`,
        affectedInstanceIds: boxes
          .filter(({ entry }) => entry.metadata.recommendedClearance?.front === undefined)
          .map(({ entry }) => entry.placed.instanceId),
        dataSource: 'UNKNOWN',
        confidence: 'LOW',
        requiresHumanVerification: true,
        reason: 'MISSING_DATA',
      });
    }

    return results;
  },
};
