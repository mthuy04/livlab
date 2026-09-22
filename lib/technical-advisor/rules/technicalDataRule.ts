/**
 * Rule 7 — how much does LivLab actually know about these products?
 *
 * The other rules each report on one aspect. This one answers the question a
 * customer should be asking after reading them: "how much of this was actually
 * checked?" Without it, a room full of VERIFY findings looks like a room full
 * of problems, when the real situation is that LivLab is missing data.
 *
 * Phrased for consumers, not developers — "chưa có đủ thông tin kỹ thuật",
 * never "metadata completeness: partial".
 */

import { isTechnicalDataComplete } from '../productTechnicalMetadata';
import type { TechnicalRule, TechnicalValidationResult } from '../types';

export const technicalDataRule: TechnicalRule = {
  id: 'technical-data',
  category: 'DATA_COMPLETENESS',

  run(context) {
    if (context.entries.length === 0) return [];

    const incomplete = context.entries.filter((entry) => !isTechnicalDataComplete(entry.metadata));

    if (incomplete.length === 0) {
      return [
        {
          id: 'technical-data:complete',
          ruleId: 'technical-data',
          category: 'DATA_COMPLETENESS',
          severity: 'SUITABLE',
          title: 'Đủ thông tin kỹ thuật để kiểm tra',
          message: 'LivLab có đủ dữ liệu kỹ thuật cơ bản cho các sản phẩm trong phòng.',
          affectedInstanceIds: [],
          dataSource: 'PRODUCT_METADATA',
          confidence: 'MEDIUM',
          requiresHumanVerification: false,
        } satisfies TechnicalValidationResult,
      ];
    }

    // Name at most two products, then count the rest — a list of eight names is
    // not something anyone reads.
    const names = incomplete.slice(0, 2).map((e) => e.product.name);
    const extra = incomplete.length - names.length;
    const subject = extra > 0 ? `${names.join(', ')} và ${extra} sản phẩm khác` : names.join(', ');

    return [
      {
        id: 'technical-data:partial',
        ruleId: 'technical-data',
        category: 'DATA_COMPLETENESS',
        severity: 'VERIFY',
        title: 'Chưa đủ thông tin kỹ thuật',
        message: `LivLab chưa có đủ thông tin kỹ thuật để kiểm tra đầy đủ cho ${subject}. Các kết luận bên dưới chỉ dựa trên phần dữ liệu hiện có.`,
        affectedInstanceIds: incomplete.map((e) => e.placed.instanceId),
        dataSource: 'UNKNOWN',
        confidence: 'LOW',
        requiresHumanVerification: true,
        reason: 'MISSING_DATA',
        suggestedAction: 'Hỏi showroom để bổ sung thông số lắp đặt của sản phẩm.',
      } satisfies TechnicalValidationResult,
    ];
  },
};
