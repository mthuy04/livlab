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

import { formatCm } from '../geometry';
import { frontSpace } from '../spatialGeometry';
import type { TechnicalRule, TechnicalValidationResult } from '../types';

export const clearanceRule: TechnicalRule = {
  id: 'clearance',
  category: 'CLEARANCE',

  run(context) {
    const results: TechnicalValidationResult[] = [];
    const withoutFigure: string[] = [];

    for (const entry of context.entries) {
      const { placed, product, metadata } = entry;
      if(context.focusInstanceId && context.focusInstanceId!==placed.instanceId)continue;
      const recommendedFront = metadata.recommendedClearance?.front;

      if (recommendedFront === undefined) {
        // No figure exists. Collect and report once at the end — never guess,
        // but also never repeat the same notice for every product.
        withoutFigure.push(product.name);
        continue;
      }

      const space = frontSpace(context, entry);
      if (!space) {
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

      const { available, blockedBy } = space;

      if (available >= recommendedFront) {
        results.push({
          id: `clearance:${placed.instanceId}`,
          ruleId: 'clearance',
          category: 'CLEARANCE',
          severity: space.missingObstacleDimensions ? 'VERIFY' : 'SUITABLE',
          title: space.missingObstacleDimensions ? 'Cần xác minh vật cản' : 'Khoảng trống phía trước đạt khuyến nghị',
          message: space.missingObstacleDimensions ? `Chưa đủ kích thước của thiết bị gần ${product.name} để xác minh khoảng trống.` : `Khoảng trống phía trước ${product.name} hiện khoảng ${formatCm(available)}, đạt mức ${formatCm(recommendedFront)} ${metadata.clearanceOrigin==='CATALOGUE'?'theo thông số sản phẩm.':'theo hướng dẫn tham khảo LivLab v1.'}`,
          affectedInstanceIds: [placed.instanceId],
          dataSource: 'PRODUCT_METADATA',
          confidence: space.missingObstacleDimensions ? 'LOW' : metadata.clearanceOrigin === 'CATALOGUE' ? 'HIGH' : 'MEDIUM',
          requiresHumanVerification: space.missingObstacleDimensions,
          reason: space.missingObstacleDimensions ? 'MISSING_DATA' : undefined,
        });
        continue;
      }

      results.push({
        id: `clearance:${placed.instanceId}`,
        ruleId: 'clearance',
        category: 'CLEARANCE',
        severity: metadata.clearanceOrigin==='CATALOGUE'?'VERIFY':'OPTIMIZE',
        placementIssue: 'CLEARANCE',
        title: 'Khoảng trống phía trước còn hạn chế',
        message:
          `Khoảng trống phía trước ${product.name} hiện khoảng ${formatCm(available)}; ${metadata.clearanceOrigin==='CATALOGUE'?'thông số sản phẩm yêu cầu':'hướng dẫn tham khảo LivLab v1 khuyến nghị'} khoảng ${formatCm(recommendedFront)}.` +
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
        affectedInstanceIds: context.entries
          .filter(entry => entry.metadata.recommendedClearance?.front === undefined)
          .map(entry => entry.placed.instanceId),
        dataSource: 'UNKNOWN',
        confidence: 'LOW',
        requiresHumanVerification: true,
        reason: 'MISSING_DATA',
      });
    }

    return results;
  },
};
