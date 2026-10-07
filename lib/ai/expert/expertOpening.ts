/**
 * The opening message and the quick actions.
 *
 * Both are computed locally from Room Studio state — LivLab already knows the
 * room size, what is in it and what it costs, so spending a Gemini call to have
 * a model read those numbers back would waste free-tier quota for no gain.
 *
 * This is also why the Expert never greets with a context-free
 * "Xin chào, tôi có thể giúp gì?": by the time the panel opens, it already
 * knows what the customer is working on.
 */

import type { LivLabExpertContext } from './expertContext';

function vnd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0đ';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const rounded = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `${rounded.replace('.', ',')} triệu`;
  }
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

export function buildOpeningMessage(context: LivLabExpertContext): string {
  const room = context.room;
  const placed = context.placedProducts ?? [];
  const budget = context.budget;
  const selected = context.selectedProduct;

  // Most specific context first: a selected product is what the customer is
  // looking at right now.
  if (selected) {
    const size = selected.widthMm ? ` rộng ${selected.widthMm} mm` : '';
    return `Bạn đang xem ${selected.name}${size}. Tôi có thể giúp bạn so sánh kích thước với phòng, giải thích thông số, hoặc tìm mẫu tương tự trong danh mục LivLab.`;
  }

  if (room && placed.length > 0 && budget) {
    const total = vnd(budget.estimatedTotalMin);
    const base = `Tôi đã xem không gian ${room.length} × ${room.width} m của bạn. Hiện có ${placed.length} sản phẩm trong phòng với chi phí tham khảo khoảng ${total}.`;
    if (budget.targetBudget !== undefined) {
      if ((budget.amountOverBudget ?? 0) > 0) {
        return `${base} So với ngân sách ${vnd(budget.targetBudget)}, combo đang vượt khoảng ${vnd(budget.amountOverBudget!)}. Tôi có thể gợi ý phương án thay thế rẻ hơn.`;
      }
      return `${base} So với ngân sách ${vnd(budget.targetBudget)}, bạn còn khoảng ${vnd(budget.remainingBudget ?? 0)}. Tôi có thể giúp bạn bổ sung hoặc nâng cấp sản phẩm.`;
    }
    return `${base} Tôi có thể giúp bạn tối ưu combo hoặc kiểm tra ngân sách.`;
  }

  if (room && placed.length === 0) {
    return `Tôi đã xem không gian ${room.length} × ${room.width} m của bạn, hiện chưa có sản phẩm nào trong phòng. Bạn muốn tôi gợi ý nên bắt đầu từ đâu không?`;
  }

  return 'Bạn có thể bắt đầu bằng cách nhập kích thước phòng, chọn sản phẩm từ thư viện, hoặc cho tôi biết ngân sách dự kiến.';
}

export interface ExpertQuickAction {
  id: string;
  label: string;
  /** The message actually sent when tapped. */
  prompt: string;
}

/**
 * Quick actions change with context — an action that cannot apply is never
 * shown (no "tối ưu combo" for an empty room, no budget check without a budget).
 */
export function buildQuickActions(context: LivLabExpertContext): ExpertQuickAction[] {
  const actions: ExpertQuickAction[] = [];
  const placed = context.placedProducts ?? [];
  const budget = context.budget;
  const selected = context.selectedProduct;
  const overBudget = (budget?.amountOverBudget ?? 0) > 0;

  if (selected) {
    actions.push({
      id: 'explain-specs',
      label: 'Giải thích thông số sản phẩm',
      prompt: `Giải thích giúp tôi các thông số của ${selected.name}.`,
    });
    actions.push({
      id: 'similar',
      label: 'Tìm sản phẩm tương tự',
      prompt: `Tìm giúp tôi các sản phẩm tương tự ${selected.name} trong danh mục LivLab.`,
    });
    if (context.room) {
      actions.push({
        id: 'smaller',
        label: 'Gợi ý mẫu nhỏ gọn hơn',
        prompt: `Phòng của tôi khá chật. Có mẫu nào nhỏ gọn hơn ${selected.name} không?`,
      });
    }
  }

  if (placed.length > 0) {
    if (budget?.targetBudget !== undefined) {
      actions.push({
        id: 'budget-check',
        label: 'Combo này có vừa ngân sách không?',
        prompt: 'Combo hiện tại có vừa ngân sách của tôi không?',
      });
    }
    if (overBudget) {
      actions.push({
        id: 'over-budget-driver',
        label: 'Sản phẩm nào làm vượt ngân sách?',
        prompt: 'Sản phẩm nào đang làm combo của tôi vượt ngân sách?',
      });
      actions.push({
        id: 'optimize',
        label: 'Tối ưu combo giúp tôi',
        prompt: 'Tối ưu giúp tôi combo hiện tại để về gần ngân sách.',
      });
    } else {
      actions.push({
        id: 'review-combo',
        label: 'Đánh giá combo hiện tại',
        prompt: 'Combo hiện tại của tôi đã hợp lý chưa? Còn thiếu gì không?',
      });
    }
  }

  if (placed.length === 0) {
    actions.push({
      id: 'where-to-start',
      label: 'Phòng này nên bắt đầu từ đâu?',
      prompt: 'Phòng này nên bắt đầu từ đâu?',
    });
    actions.push({
      id: 'essentials',
      label: 'Gợi ý combo cơ bản',
      prompt: 'Gợi ý giúp tôi một combo cơ bản phù hợp với kích thước phòng này.',
    });
  }

  if (context.stylePreferences?.length) {
    actions.push({
      id: 'by-style',
      label: 'Gợi ý theo phong cách hiện tại',
      prompt: `Gợi ý sản phẩm hợp với phong cách ${context.stylePreferences.join(', ')}.`,
    });
  }

  return actions.slice(0, 4);
}
