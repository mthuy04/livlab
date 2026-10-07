/**
 * Rules 4 and 5 — is the product on a surface it can actually mount to, and is
 * it actually touching that surface?
 *
 * Two related checks live together because they share the same inputs:
 *
 *  - SURFACE: does the declared placement type match where the product is?
 *    A wall-hung basin dropped in the middle of the floor is the classic case.
 *  - ADHERENCE: a wall product should be against its wall and a floor product
 *    should be on the floor, not hovering.
 *
 * Provenance matters a lot here. `Product.mountType` is declared in
 * lib/types.ts but populated for no product in the catalogue, so for anything
 * outside the curated demo set the placement type is a guess from the category
 * name. When that is the case the rule reports VERIFY with an explicit "LivLab
 * suy ra từ nhóm sản phẩm" rather than asserting a mismatch it cannot prove.
 */

import { getRoomBounds } from '@/lib/room-studio/roomGeometry';
import { technicalRulesConfig } from '../config';
import { formatCm, getWorldAabb } from '../geometry';
import type { TechnicalRule, TechnicalValidationResult } from '../types';

const SURFACE_LABEL: Record<string, string> = {
  FLOOR: 'đặt sàn',
  WALL: 'treo tường',
  COUNTERTOP: 'đặt trên mặt bàn',
  CEILING: 'gắn trần',
  SURFACE: 'đặt trên bề mặt',
  UNKNOWN: 'chưa xác định',
};

export const placementSurfaceRule: TechnicalRule = {
  id: 'placement-surface',
  category: 'PLACEMENT_SURFACE',

  run(context) {
    const results: TechnicalValidationResult[] = [];
    const bounds = getRoomBounds(context.room);
    const { wallAdherenceToleranceM, floorAdherenceToleranceM } = technicalRulesConfig;

    for (const entry of context.entries) {
      const { placed, product, metadata } = entry;

      if (metadata.placementType === 'UNKNOWN') {
        results.push({
          id: `placement:${placed.instanceId}`,
          ruleId: 'placement-surface',
          category: 'PLACEMENT_SURFACE',
          severity: 'VERIFY',
          title: 'Chưa rõ kiểu lắp đặt',
          message: `LivLab chưa có dữ liệu kiểu lắp đặt của ${product.name}, nên chưa thể kiểm tra vị trí lắp có phù hợp hay không.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'UNKNOWN',
          confidence: 'LOW',
          requiresHumanVerification: true,
          reason: 'MISSING_DATA',
        });
        continue;
      }

      const inferred = metadata.placementOrigin === 'INFERRED';

      if (metadata.width === undefined || metadata.depth === undefined || metadata.height === undefined) {
        results.push({
          id: `placement:${placed.instanceId}`,
          ruleId: 'placement-surface',
          category: 'PLACEMENT_SURFACE',
          severity: 'VERIFY',
          title: 'Chưa đủ dữ liệu để kiểm tra vị trí lắp',
          message: `${product.name} được LivLab xem là loại ${SURFACE_LABEL[metadata.placementType]}, nhưng chưa có đủ kích thước để kiểm tra vị trí lắp đặt.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'UNKNOWN',
          confidence: 'LOW',
          requiresHumanVerification: true,
          reason: 'MISSING_DATA',
        });
        continue;
      }

      const box = getWorldAabb({
        position: placed.position,
        width: metadata.width,
        depth: metadata.depth,
        height: metadata.height,
        rotationY: placed.rotationY,
      });

      // Distance from the product to the surface it claims to mount on.
      let gap: number | null = null;
      let surfaceName = '';

      if (metadata.placementType === 'WALL') {
        const wall = placed.wall ?? 'back';
        surfaceName = wall === 'left' ? 'tường trái' : wall === 'right' ? 'tường phải' : 'tường trong';
        gap =
          wall === 'left'
            ? box.minX - bounds.minX
            : wall === 'right'
              ? bounds.maxX - box.maxX
              : box.minZ - bounds.minZ;
      } else if (metadata.placementType === 'FLOOR') {
        surfaceName = 'sàn';
        gap = box.minY - bounds.minY;
      } else if (metadata.placementType === 'CEILING') {
        surfaceName = 'trần';
        gap = bounds.maxY - box.maxY;
      }

      const tolerance = metadata.placementType === 'WALL' ? wallAdherenceToleranceM : floorAdherenceToleranceM;

      if (metadata.placementType === 'COUNTERTOP' || metadata.placementType === 'SURFACE') {
        // LivLab has no vanity/counter geometry in the room yet, so whether a
        // real supporting surface exists cannot be determined. Say that.
        results.push({
          id: `placement:${placed.instanceId}`,
          ruleId: 'placement-surface',
          category: 'PLACEMENT_SURFACE',
          severity: 'VERIFY',
          title: 'Cần mặt bàn đỡ phía dưới',
          message: `${product.name} là loại ${SURFACE_LABEL[metadata.placementType]}. LivLab chưa mô phỏng tủ hoặc mặt bàn trong phòng, nên bạn cần xác nhận có mặt bàn đỡ ở vị trí này.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: inferred ? 'LIVLAB_RULE' : 'PRODUCT_METADATA',
          confidence: inferred ? 'LOW' : 'MEDIUM',
          requiresHumanVerification: true,
          suggestedAction: 'Chọn thêm tủ lavabo hoặc xác nhận mặt bàn hiện có.',
        });
        continue;
      }

      if (gap === null) continue;

      if (gap <= tolerance) {
        results.push({
          id: `placement:${placed.instanceId}`,
          ruleId: 'placement-surface',
          category: 'PLACEMENT_SURFACE',
          severity: inferred ? 'VERIFY' : 'SUITABLE',
          title: inferred ? 'Vị trí lắp phù hợp với suy đoán của LivLab' : 'Vị trí lắp đặt phù hợp',
          message: inferred
            ? `${product.name} đang nằm đúng ${surfaceName}. LivLab suy ra kiểu lắp ${SURFACE_LABEL[metadata.placementType]} từ nhóm sản phẩm, nên bạn vẫn nên đối chiếu với hướng dẫn của nhà sản xuất.`
            : `${product.name} là loại ${SURFACE_LABEL[metadata.placementType]} và đang nằm đúng ${surfaceName}.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: inferred ? 'LIVLAB_RULE' : 'PRODUCT_METADATA',
          confidence: inferred ? 'LOW' : 'HIGH',
          requiresHumanVerification: inferred,
          reason: inferred ? 'INFERRED_DATA' : undefined,
        });
        continue;
      }

      results.push({
        id: `placement:${placed.instanceId}`,
        ruleId: 'placement-surface',
        category: 'PLACEMENT_SURFACE',
        severity: 'VERIFY',
        title: 'Sản phẩm đang cách xa bề mặt lắp đặt',
        message: `${product.name} là loại ${SURFACE_LABEL[metadata.placementType]} nhưng hiện cách ${surfaceName} khoảng ${formatCm(gap)}. Bạn nên đưa sản phẩm về sát bề mặt lắp đặt.`,
        affectedInstanceIds: [placed.instanceId],
        dataSource: inferred ? 'LIVLAB_RULE' : 'PRODUCT_METADATA',
        confidence: inferred ? 'LOW' : 'HIGH',
        requiresHumanVerification: inferred,
        reason: inferred ? 'INFERRED_DATA' : undefined,
        suggestedAction: `Kéo sản phẩm về sát ${surfaceName}.`,
      });
    }

    return results;
  },
};
