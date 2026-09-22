/**
 * Rule 1 — is the product actually inside the room?
 *
 * Room Studio's drag clamp already keeps products in the room, but it does so
 * with an axis-aligned box that ignores `rotationY`. A rotated product can
 * therefore sit slightly past a wall while the clamp considers it fine. This
 * rule re-checks with rotation applied, which is why it can report something
 * the drag never prevented.
 *
 * Dimensions come only from the catalogue, and most products state some but not
 * all of them. Rather than refusing whenever anything is missing, the rule
 * checks the axes it actually knows and says which ones it could not check —
 * "nó có lọt vào phòng không" is usually a width/depth question, and answering
 * that is far more useful than declining because a height is absent. It never
 * substitutes an assumed size for a missing one.
 */

import { getRoomBounds } from '@/lib/room-studio/roomGeometry';
import { technicalRulesConfig } from '../config';
import { formatCm, getWorldAabb } from '../geometry';
import type { TechnicalRule, TechnicalValidationResult } from '../types';

export const roomBoundsRule: TechnicalRule = {
  id: 'room-bounds',
  category: 'ROOM_BOUNDS',

  run(context) {
    const results: TechnicalValidationResult[] = [];
    const bounds = getRoomBounds(context.room);
    const tolerance = technicalRulesConfig.roomBoundsToleranceM;

    for (const entry of context.entries) {
      const { placed, product, metadata } = entry;

      const knownAxes = {
        horizontal: metadata.width !== undefined && metadata.depth !== undefined,
        vertical: metadata.height !== undefined,
      };

      if (!knownAxes.horizontal && !knownAxes.vertical) {
        results.push({
          id: `room-bounds:${placed.instanceId}`,
          ruleId: 'room-bounds',
          category: 'ROOM_BOUNDS',
          severity: 'VERIFY',
          title: 'Chưa đủ kích thước để kiểm tra',
          message: `LivLab chưa có kích thước của ${product.name}, nên chưa thể xác nhận sản phẩm có nằm gọn trong phòng hay không.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'UNKNOWN',
          confidence: 'LOW',
          requiresHumanVerification: true,
          reason: 'MISSING_DATA',
          suggestedAction: 'Đề nghị showroom cung cấp kích thước chi tiết của sản phẩm.',
        });
        continue;
      }

      // Unknown axes are given zero extent so they simply do not participate in
      // the comparison. They are never filled in with a guess.
      const box = getWorldAabb({
        position: placed.position,
        width: metadata.width ?? 0,
        depth: metadata.depth ?? 0,
        height: metadata.height ?? 0,
        rotationY: placed.rotationY,
      });

      // How far past each face the product reaches, in metres. Only positive
      // values matter.
      const breaches: { side: string; by: number }[] = [
        ...(knownAxes.horizontal
          ? [
              { side: 'tường trái', by: bounds.minX - box.minX },
              { side: 'tường phải', by: box.maxX - bounds.maxX },
              { side: 'tường trong', by: bounds.minZ - box.minZ },
              { side: 'phía trước phòng', by: box.maxZ - bounds.maxZ },
            ]
          : []),
        ...(knownAxes.vertical
          ? [
              { side: 'sàn', by: bounds.minY - box.minY },
              { side: 'trần', by: box.maxY - bounds.maxY },
            ]
          : []),
      ].filter((b) => b.by > tolerance);

      const partial = !knownAxes.horizontal || !knownAxes.vertical;

      if (breaches.length === 0) {
        results.push({
          id: `room-bounds:${placed.instanceId}`,
          ruleId: 'room-bounds',
          category: 'ROOM_BOUNDS',
          severity: 'SUITABLE',
          title: partial ? 'Nằm trong phạm vi phòng (kiểm tra một phần)' : 'Nằm trong phạm vi phòng',
          message: partial
            ? `${product.name} nằm gọn trong phòng theo các kích thước LivLab hiện có. ${
                knownAxes.horizontal ? 'Chưa có chiều cao nên chưa kiểm tra được theo phương đứng.' : 'Chưa có chiều rộng/chiều sâu nên chỉ kiểm tra được theo phương đứng.'
              }`
            : `${product.name} nằm gọn trong kích thước phòng hiện tại.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: partial ? 'UNKNOWN' : 'ROOM_GEOMETRY',
          confidence: partial ? 'MEDIUM' : 'HIGH',
          requiresHumanVerification: false,
          reason: partial ? 'MISSING_DATA' : undefined,
        });
        continue;
      }

      const worst = breaches.reduce((a, b) => (b.by > a.by ? b : a));
      results.push({
        id: `room-bounds:${placed.instanceId}`,
        ruleId: 'room-bounds',
        category: 'ROOM_BOUNDS',
        severity: 'VERIFY',
        title: 'Vượt ra ngoài phạm vi phòng',
        message: `${product.name} đang vượt quá ${worst.side} khoảng ${formatCm(worst.by)}. Bạn nên dịch sản phẩm vào trong hoặc kiểm tra lại kích thước phòng.`,
        affectedInstanceIds: [placed.instanceId],
        dataSource: 'ROOM_GEOMETRY',
        confidence: 'HIGH',
        requiresHumanVerification: false,
        suggestedAction: 'Kéo sản phẩm vào trong phòng.',
      });
    }

    return results;
  },
};
