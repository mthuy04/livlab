/**
 * Rule 6 — does the product's water/drain requirement line up with the points
 * the customer has declared?
 *
 * Scope is deliberately narrow: a distance comparison between a product that
 * says it needs a point and a point the customer has told LivLab about. There
 * is no pipe routing, no hydraulics, no assumption about where plumbing "must"
 * be. LivLab cannot see inside walls, and pretending otherwise would be the
 * single most dangerous thing this feature could do.
 *
 * Three honest outcomes:
 *   - no declared points at all  -> VERIFY, "chưa có dữ liệu"
 *   - a point within reach       -> SUITABLE
 *   - a point but a long way off -> OPTIMIZE, "cần kỹ thuật viên kiểm tra"
 *
 * Note what is absent: there is no "không lắp được" outcome. Re-routing a
 * supply or a drain is ordinary work, and LivLab is in no position to declare
 * an installation impossible.
 */

import { technicalRulesConfig } from '../config';
import { formatCm, horizontalDistance } from '../geometry';
import type { PlumbingSpec } from '../productTechnicalMetadata';
import type { TechnicalRule, TechnicalValidationResult, UtilityPoint, UtilityPointType } from '../types';

const REQUIREMENT_LABEL: Record<UtilityPointType, string> = {
  COLD_WATER: 'điểm cấp nước lạnh',
  HOT_WATER: 'điểm cấp nước nóng',
  DRAIN: 'điểm thoát nước',
  TOILET_WASTE: 'điểm xả bồn cầu',
  ELECTRICAL: 'điểm điện',
  UNKNOWN: 'điểm kỹ thuật',
};

/** Which utility types this product's metadata says it needs. */
function requiredTypes(plumbing: PlumbingSpec | undefined): UtilityPointType[] {
  if (!plumbing) return [];
  const types: UtilityPointType[] = [];
  if (plumbing.requiresColdWater) types.push('COLD_WATER');
  if (plumbing.requiresHotWater) types.push('HOT_WATER');
  if (plumbing.requiresDrain) types.push('DRAIN');
  if (plumbing.requiresToiletWaste) types.push('TOILET_WASTE');
  return types;
}

function nearestPoint(
  points: UtilityPoint[],
  type: UtilityPointType,
  at: [number, number, number]
): { point: UtilityPoint; distance: number } | null {
  let best: { point: UtilityPoint; distance: number } | null = null;
  for (const point of points) {
    if (point.type !== type) continue;
    const d = horizontalDistance(at, point.position);
    if (!best || d < best.distance) best = { point, distance: d };
  }
  return best;
}

export const plumbingPointRule: TechnicalRule = {
  id: 'plumbing-point',
  category: 'PLUMBING',

  run(context) {
    const results: TechnicalValidationResult[] = [];
    const { utilityPointNearM, utilityPointFarM } = technicalRulesConfig;

    for (const entry of context.entries) {
      const { placed, product, metadata } = entry;

      if (metadata.plumbingOrigin === 'MISSING') {
        results.push({
          id: `plumbing:${placed.instanceId}`,
          ruleId: 'plumbing-point',
          category: 'PLUMBING',
          severity: 'VERIFY',
          title: 'Chưa có dữ liệu yêu cầu cấp thoát nước',
          message: `LivLab chưa có dữ liệu về yêu cầu cấp/thoát nước của ${product.name}. Bạn nên hỏi showroom trước khi chốt phương án lắp đặt.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'UNKNOWN',
          confidence: 'LOW',
          requiresHumanVerification: true,
          reason: 'MISSING_DATA',
        });
        continue;
      }

      const needs = requiredTypes(metadata.plumbing);
      if (needs.length === 0) {
        // Metadata exists and says nothing is needed — a real PASS, e.g. a mirror.
        results.push({
          id: `plumbing:${placed.instanceId}`,
          ruleId: 'plumbing-point',
          category: 'PLUMBING',
          severity: 'SUITABLE',
          title: 'Không cần đấu nối cấp thoát nước',
          message: `${product.name} không yêu cầu điểm cấp hoặc thoát nước theo dữ liệu hiện có của LivLab.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'PRODUCT_METADATA',
          confidence: 'MEDIUM',
          requiresHumanVerification: false,
        });
        continue;
      }

      // The customer has told LivLab nothing about the room's plumbing. Do not
      // guess where it is — say the check cannot run.
      if (context.utilityPoints.length === 0) {
        const labels = needs.map((t) => REQUIREMENT_LABEL[t]).join(', ');
        results.push({
          id: `plumbing:${placed.instanceId}`,
          ruleId: 'plumbing-point',
          category: 'PLUMBING',
          severity: 'VERIFY',
          title: 'Cần kiểm tra điểm cấp thoát nước',
          message: `${product.name} cần ${labels}, nhưng LivLab chưa có thông tin vị trí các điểm này trong phòng của bạn.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'UNKNOWN',
          confidence: 'LOW',
          requiresHumanVerification: true,
          reason: 'MISSING_DATA',
          suggestedAction: 'Khai báo điểm cấp/thoát nước hiện có trong phòng để LivLab kiểm tra giúp bạn.',
        });
        continue;
      }

      for (const type of needs) {
        const nearest = nearestPoint(context.utilityPoints, type, placed.position);
        const label = REQUIREMENT_LABEL[type];
        const id = `plumbing:${placed.instanceId}:${type}`;

        if (!nearest) {
          results.push({
            id,
            ruleId: 'plumbing-point',
            category: 'PLUMBING',
            severity: 'VERIFY',
            title: `Chưa khai báo ${label}`,
            message: `${product.name} cần ${label}, nhưng bạn chưa khai báo điểm này trong phòng. Kỹ thuật viên cần kiểm tra khả năng đấu nối.`,
            affectedInstanceIds: [placed.instanceId],
            dataSource: 'UNKNOWN',
            confidence: 'LOW',
            requiresHumanVerification: true,
            reason: 'MISSING_DATA',
          });
          continue;
        }

        if (nearest.distance <= utilityPointNearM) {
          results.push({
            id,
            ruleId: 'plumbing-point',
            category: 'PLUMBING',
            severity: 'SUITABLE',
            title: `Gần ${label} đã khai báo`,
            message: `${product.name} cách ${label} bạn đã khai báo khoảng ${formatCm(nearest.distance)}.`,
            affectedInstanceIds: [placed.instanceId],
            dataSource: 'ROOM_UTILITY_POINT',
            confidence: 'MEDIUM',
            requiresHumanVerification: false,
          });
          continue;
        }

        const far = nearest.distance > utilityPointFarM;
        results.push({
          id,
          ruleId: 'plumbing-point',
          category: 'PLUMBING',
          severity: far ? 'VERIFY' : 'OPTIMIZE',
          title: far ? `Cách khá xa ${label}` : `Hơi xa ${label}`,
          message: `${product.name} cần ${label}. Vị trí hiện tại cách điểm đã khai báo khoảng ${formatCm(nearest.distance)}, nên cần kỹ thuật viên kiểm tra khả năng đấu nối.`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'ROOM_UTILITY_POINT',
          confidence: 'MEDIUM',
          requiresHumanVerification: true,
          suggestedAction: 'Thử đặt sản phẩm gần điểm kỹ thuật hơn, hoặc hỏi showroom về phương án đấu nối.',
        });
      }
    }

    return results;
  },
};
