/**
 * The proactive nudge engine for LivLab Expert.
 *
 * This is a PURE function over Room Studio state. It deliberately does not
 * call Gemini: deciding which one-line hint to show is a job for rules over
 * numbers LivLab already computed, not for a language model. Spending an API
 * call per state change would burn free-tier quota to restate facts the app
 * already knows, and would make the bubble non-deterministic and untestable.
 *
 * Gemini is still the Level 2 experience — the Expert panel, opened by tapping
 * the bubble. The nudge only decides what the advisor says unprompted.
 *
 * Every number rendered here comes from an existing deterministic source
 * (budgetCalculator, the Technical Advisor). Nothing is estimated, and when
 * LivLab has no data the copy says so rather than filling in a plausible value.
 */

import type { RoomDimensions } from './roomGeometry';
import type { BudgetEstimate } from './budgetCalculator';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';

/**
 * A structured request handed to the Expert panel when a CTA is tapped.
 *
 * Structured rather than a hardcoded chat string so the mapping from "what the
 * customer clicked" to "what is asked" lives in one place and can change
 * without touching the nudge copy.
 */
export type ExpertIntent =
  | 'OPTIMIZE_BUDGET'
  | 'EXPLAIN_TECHNICAL_WARNINGS'
  | 'EXPLAIN_MISSING_DATA'
  | 'ADVISE_SELECTED_PRODUCT'
  | 'RECOMMEND_NEXT_PRODUCT'
  | 'REVIEW_COMBO'
  | 'START_ROOM';

export type ExpertNudgeType =
  | 'WELCOME'
  | 'ROOM_READY'
  | 'ADD_FIRST_PRODUCT'
  | 'PRODUCT_ADDED'
  | 'BUDGET_HEALTHY'
  | 'BUDGET_WARNING'
  | 'PRODUCT_SELECTED'
  | 'TECHNICAL_WARNING'
  | 'MISSING_DATA'
  | 'NEXT_STEP'
  | 'QUOTE_READY';

/** Small contextual tag shown on the bubble — one advisor, several modes. */
export type ExpertMode = 'Sản phẩm' | 'Ngân sách' | 'Không gian' | 'Kỹ thuật';

export interface ExpertNudge {
  /** Stable identity INCLUDING the data that matters, e.g. `BUDGET_WARNING:2400000`.
   *  Two nudges with the same key are the same advice and must not be shown
   *  twice; a changed number produces a new key and may legitimately speak
   *  again. This is the whole deduplication mechanism. */
  key: string;
  type: ExpertNudgeType;
  mode: ExpertMode;
  /** Higher wins. See PRIORITY below. */
  priority: number;
  /** One short Vietnamese line. Never more than ~3 lines when rendered. */
  message: string;
  /** Omitted when opening the panel would add nothing. */
  cta?: { label: string; intent: ExpertIntent };
  /** Warnings stay until dismissed; everything else may auto-collapse. */
  persistent?: boolean;
  /** Only useful as the very first thing the Expert says. A generic greeting
   *  arriving AFTER a specific suggestion reads as the advisor losing its
   *  place, so the scheduler drops these once anything else has been shown. */
  firstContactOnly?: boolean;
}

/**
 * Explicit priority table, ordered as the product spec requires. Kept as data
 * rather than inline numbers so the ordering can be read at a glance.
 */
const PRIORITY: Record<ExpertNudgeType, number> = {
  TECHNICAL_WARNING: 100,
  BUDGET_WARNING: 90,
  MISSING_DATA: 80,
  PRODUCT_SELECTED: 70,
  QUOTE_READY: 65,
  // Above PRODUCT_ADDED: a budget figure only exists because the customer
  // opted in by setting a target, which makes it more wanted than a count of
  // what they can already see in the room.
  BUDGET_HEALTHY: 62,
  PRODUCT_ADDED: 60,
  // MVP emits no bare NEXT_STEP: the concrete nudges below already carry the
  // next step, and a generic "what now?" beside a specific one would be noise.
  NEXT_STEP: 40,
  // Above ADD_FIRST_PRODUCT, which says the same thing without the numbers.
  // The version that can name the customer's actual room always wins.
  ROOM_READY: 38,
  ADD_FIRST_PRODUCT: 35,
  WELCOME: 10,
};

/**
 * What the evaluator reads. A narrow projection of state Room Studio already
 * holds — this intentionally does NOT define a second RoomState.
 */
export interface ExpertNudgeContext {
  dimensions: RoomDimensions;
  /** True once the customer has actually edited the room away from defaults. */
  hasCustomDimensions: boolean;
  placedCount: number;
  selectedProductName?: string;
  budget: BudgetEstimate;
  targetBudget?: number;
  findings: TechnicalValidationResult[];
  quoteItemCount: number;
}

/** Formats VND the way the rest of the Expert surface does. */
function vnd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0đ';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const rounded = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `${rounded.replace('.', ',')} triệu`;
  }
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

/** Trims a trailing `.0` so "3 × 2 m" never renders as "3.0 × 2.0 m". */
function m(value: number): string {
  return String(Number(value.toFixed(2))).replace('.', ',');
}

/**
 * Every nudge that currently applies, highest priority first.
 *
 * Returns a list rather than a single winner so the caller can skip candidates
 * it has already shown or the customer has dismissed, and fall through to the
 * next most useful thing to say.
 */
export function evaluateExpertNudges(context: ExpertNudgeContext): ExpertNudge[] {
  const {
    dimensions,
    hasCustomDimensions,
    placedCount,
    selectedProductName,
    budget,
    targetBudget,
    findings,
    quoteItemCount,
  } = context;

  const nudges: ExpertNudge[] = [];
  const push = (n: Omit<ExpertNudge, 'priority'>) =>
    nudges.push({ ...n, priority: PRIORITY[n.type] });

  // ─── Technical ────────────────────────────────────────────────────────────
  // Split by cause: a real geometric problem and "LivLab has no data" are
  // different messages, and conflating them would either overstate a risk or
  // hide one.
  const verify = findings.filter((f) => f.severity === 'VERIFY');
  const realWarnings = verify.filter((f) => f.category !== 'DATA_COMPLETENESS');
  const dataGaps = verify.filter((f) => f.category === 'DATA_COMPLETENESS');

  if (realWarnings.length > 0) {
    push({
      key: `TECHNICAL_WARNING:${realWarnings.length}:${realWarnings[0].ruleId}`,
      type: 'TECHNICAL_WARNING',
      mode: 'Kỹ thuật',
      message:
        realWarnings.length === 1
          ? 'Có 1 điểm cần kiểm tra kỹ thuật trước khi chốt.'
          : `Có ${realWarnings.length} điểm cần kiểm tra trước khi chốt.`,
      cta: { label: 'Xem chi tiết', intent: 'EXPLAIN_TECHNICAL_WARNINGS' },
      persistent: true,
    });
  }

  // ─── Budget ───────────────────────────────────────────────────────────────
  // Only when the customer actually set a target. Without one there is nothing
  // to be over, and inventing a "typical budget" would be a fabricated number.
  if (targetBudget !== undefined && targetBudget > 0) {
    const over = budget.min - targetBudget;
    if (over > 0) {
      push({
        key: `BUDGET_WARNING:${Math.round(over / 100_000)}`,
        type: 'BUDGET_WARNING',
        mode: 'Ngân sách',
        message: `Combo hiện tại đang vượt ngân sách khoảng ${vnd(over)}.`,
        cta: { label: 'Tối ưu', intent: 'OPTIMIZE_BUDGET' },
        persistent: true,
      });
    } else if (placedCount > 0) {
      push({
        key: `BUDGET_HEALTHY:${placedCount}`,
        type: 'BUDGET_HEALTHY',
        mode: 'Ngân sách',
        message: `Combo đang trong ngân sách, còn khoảng ${vnd(targetBudget - budget.min)}. Tôi có thể giúp bạn nâng cấp hoặc bổ sung.`,
        cta: { label: 'Xem gợi ý', intent: 'RECOMMEND_NEXT_PRODUCT' },
      });
    }
  }

  if (dataGaps.length > 0) {
    push({
      key: `MISSING_DATA:${dataGaps.length}`,
      type: 'MISSING_DATA',
      mode: 'Kỹ thuật',
      message:
        dataGaps.length === 1 && dataGaps[0].affectedInstanceIds.length > 0
          ? 'LivLab chưa có đủ dữ liệu kỹ thuật để xác nhận sản phẩm này.'
          : 'LivLab chưa có đủ dữ liệu kỹ thuật cho một số sản phẩm trong phòng.',
      cta: { label: 'Xem chi tiết', intent: 'EXPLAIN_MISSING_DATA' },
      persistent: true,
    });
  }

  // ─── Selection ────────────────────────────────────────────────────────────
  if (selectedProductName) {
    push({
      key: `PRODUCT_SELECTED:${selectedProductName}`,
      type: 'PRODUCT_SELECTED',
      mode: 'Sản phẩm',
      message: `Bạn đang chọn ${selectedProductName}. Tôi có thể giúp so sánh kích thước hoặc giá.`,
      cta: { label: 'Xem gợi ý', intent: 'ADVISE_SELECTED_PRODUCT' },
    });
  }

  // ─── Combo progress ───────────────────────────────────────────────────────
  // "Quote ready" is deliberately conservative: it only fires when nothing is
  // flagged and the budget is not exceeded, so it can never nudge a customer
  // toward a quotation that the Technical Advisor has doubts about.
  const overBudget = targetBudget !== undefined && budget.min > targetBudget;
  if (placedCount >= 3 && verify.length === 0 && !overBudget && quoteItemCount === 0) {
    push({
      key: `QUOTE_READY:${placedCount}`,
      type: 'QUOTE_READY',
      mode: 'Sản phẩm',
      message: 'Combo đã khá hoàn chỉnh. Bạn có thể lưu vào giỏ báo giá để showroom tư vấn tiếp.',
      cta: { label: 'Xem gợi ý', intent: 'REVIEW_COMBO' },
    });
  }

  if (placedCount === 1) {
    push({
      key: 'PRODUCT_ADDED:1',
      type: 'PRODUCT_ADDED',
      mode: 'Sản phẩm',
      message: 'Đã có sản phẩm đầu tiên. Tôi có thể giúp bạn chọn sản phẩm tiếp theo phù hợp.',
      cta: { label: 'Xem gợi ý', intent: 'RECOMMEND_NEXT_PRODUCT' },
    });
  } else if (placedCount >= 2) {
    push({
      key: `PRODUCT_ADDED:${placedCount}`,
      type: 'PRODUCT_ADDED',
      mode: 'Sản phẩm',
      message: `Bạn đang có ${placedCount} sản phẩm trong phòng. Tôi có thể giúp hoàn thiện combo.`,
      cta: { label: 'Xem gợi ý', intent: 'REVIEW_COMBO' },
    });
  }

  // ─── Empty room ───────────────────────────────────────────────────────────
  if (placedCount === 0) {
    if (hasCustomDimensions) {
      push({
        key: `ROOM_READY:${m(dimensions.length)}x${m(dimensions.width)}`,
        type: 'ROOM_READY',
        mode: 'Không gian',
        message: `Không gian ${m(dimensions.length)} × ${m(dimensions.width)} m đã sẵn sàng. Bạn có thể bắt đầu với lavabo hoặc bồn cầu.`,
        cta: { label: 'Xem gợi ý', intent: 'START_ROOM' },
      });
    }
    push({
      key: 'ADD_FIRST_PRODUCT',
      type: 'ADD_FIRST_PRODUCT',
      mode: 'Sản phẩm',
      message: 'Bạn có thể bắt đầu với một thiết bị chính để định hình combo.',
      cta: { label: 'Xem gợi ý', intent: 'START_ROOM' },
    });
  }

  push({
    key: 'WELCOME',
    type: 'WELCOME',
    mode: 'Không gian',
    message: 'Chào bạn 👋 Hãy bắt đầu bằng kích thước phòng hoặc chọn một sản phẩm bạn muốn thử.',
    firstContactOnly: true,
  });

  return nudges.sort((a, b) => b.priority - a.priority);
}

/**
 * Turns a structured intent into the question actually sent to the Expert.
 *
 * Lives beside the intents themselves so the copy the model receives is never
 * scattered across components, and a CTA can be re-worded without changing
 * what gets asked.
 */
export function buildIntentPrompt(intent: ExpertIntent, selectedProductName?: string): string {
  switch (intent) {
    case 'OPTIMIZE_BUDGET':
      return 'Tối ưu giúp tôi combo hiện tại để về gần ngân sách. Sản phẩm nào nên thay thế?';
    case 'EXPLAIN_TECHNICAL_WARNINGS':
      return 'Giải thích giúp tôi các điểm cần kiểm tra kỹ thuật trong phòng của tôi và nên xử lý thế nào.';
    case 'EXPLAIN_MISSING_DATA':
      return 'Những sản phẩm nào trong phòng chưa đủ dữ liệu kỹ thuật, và tôi cần hỏi showroom điều gì?';
    case 'ADVISE_SELECTED_PRODUCT':
      return selectedProductName
        ? `Tư vấn giúp tôi về ${selectedProductName}: kích thước có hợp với phòng này không, và có mẫu nào đáng cân nhắc hơn?`
        : 'Tư vấn giúp tôi về sản phẩm tôi đang chọn.';
    case 'RECOMMEND_NEXT_PRODUCT':
      return 'Tôi nên bổ sung sản phẩm nào tiếp theo cho phòng này?';
    case 'REVIEW_COMBO':
      return 'Combo hiện tại của tôi đã hợp lý chưa? Còn thiếu gì không?';
    case 'START_ROOM':
      return 'Phòng này nên bắt đầu từ đâu? Gợi ý giúp tôi một combo cơ bản phù hợp với kích thước phòng.';
    default:
      return 'Bạn có thể tư vấn giúp tôi không?';
  }
}
