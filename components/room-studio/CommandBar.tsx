'use client';

import { useState } from 'react';
import { ArrowRight, MoreHorizontal } from 'lucide-react';
import { formatBudgetRange, formatVnd, type BudgetEstimate } from '@/lib/room-studio/budgetCalculator';
import type { TechnicalSummary } from '@/lib/technical-advisor/types';

interface CommandBarProps {
  budget: BudgetEstimate;
  /** Distinct SKUs in the room; `budget.itemCount` counts quantities. */
  uniqueCount: number;
  technical: TechnicalSummary;
  hasUtilityPoints: boolean;
  targetBudget?: number;
  onOpenBudget: () => void;
  /** Opens the KỸ THUẬT tab. The status line is the way in. */
  onOpenTechnical: () => void;
  onSaveDesign: () => void;
  onRequestQuote: () => void;
  /** The primary action's words, from the tenant's copy. */
  requestQuoteLabel?: string;
  onResetRoom: () => void;
}

/**
 * What the room currently costs, what it still needs checking for, and the two
 * things the customer can do next.
 *
 * The bar it replaces gave `Xoá phòng` the same size and the same row as the
 * primary action, three taps from a full room — so the most destructive control
 * on the page was the easiest one to hit by accident. It now lives behind the
 * overflow menu, is named for what it does, and asks first.
 */
export default function CommandBar({
  budget,
  uniqueCount,
  technical,
  hasUtilityPoints,
  targetBudget,
  onOpenBudget,
  onOpenTechnical,
  onSaveDesign,
  onRequestQuote,
  requestQuoteLabel = 'Yêu cầu báo giá',
  onResetRoom,
}: CommandBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const empty = budget.itemCount === 0;

  /**
   * The technical line, worded by what was actually evaluated.
   *
   * "Không phát hiện xung đột" is a statement about the rules that ran, not a
   * claim that the room is installable — and with no declared utility points
   * the plumbing rules did not run at all, which is "thiếu dữ liệu" and not a
   * pass. §53: this surface never says "đạt chuẩn".
   */
  const technicalLine = (() => {
    if (empty) return { text: 'Chưa kiểm tra', tone: 'muted' as const };
    if (technical.verify > 0) {
      return { text: `${technical.verify} điểm cần kiểm tra`, tone: 'warn' as const };
    }
    if (!hasUtilityPoints) return { text: 'Thiếu dữ liệu kỹ thuật', tone: 'muted' as const };
    if (technical.optimize > 0) {
      return { text: `${technical.optimize} điểm nên tối ưu`, tone: 'muted' as const };
    }
    return { text: 'Không phát hiện xung đột', tone: 'ok' as const };
  })();

  return (
    <div className="shrink-0 border-t border-[#E1E8ED] bg-white">
      {/* One row on desktop; on a phone the summary stacks above the actions,
          because a 375px line cannot hold a price, a status, a budget link and
          two buttons without one of them being cut off. */}
      <div className="flex flex-col gap-1.5 px-4 py-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:px-6 lg:py-2.5">
        {/* LEFT — what is in the room */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-[13px] text-[#5B6B7A]">
            {uniqueCount === 0
              ? 'Phòng trống'
              : `${uniqueCount} sản phẩm${budget.itemCount > uniqueCount ? ` · ${budget.itemCount} món` : ''}`}
          </span>
          <span className="text-[15px] font-semibold text-[#0B1623]">{formatBudgetRange(budget)}</span>
          {budget.unpricedCount > 0 && (
            <span
              title="Những sản phẩm này chưa có giá tham khảo, nên chưa được tính vào tổng."
              className="text-[12px] text-[#9AA9B6]"
            >
              {budget.itemCount - budget.unpricedCount}/{budget.itemCount} có giá
            </span>
          )}
        </div>

        {/* MIDDLE — technical status, and the budget that used to own a whole
            left-panel section for a single optional number. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={onOpenTechnical}
            title="Mở thẻ Kỹ thuật"
            className={`truncate text-left text-[13px] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current ${
              technicalLine.tone === 'warn'
                ? 'text-[#A8691F]'
                : technicalLine.tone === 'ok'
                  ? 'text-[#4F7355]'
                  : 'text-[#8C9BAB]'
            }`}
          >
            {technicalLine.text}
          </button>
          <button
            type="button"
            onClick={onOpenBudget}
            className="shrink-0 text-[13px] font-medium text-[color:var(--tenant-ui-link,#0F3D5C)] underline decoration-[#C8D5DE] underline-offset-4 transition-colors hover:decoration-current"
          >
            {targetBudget ? `Ngân sách ${formatVnd(targetBudget)}` : '+ Đặt ngân sách'}
          </button>
        </div>

        {/* RIGHT — the two real next steps, plus the overflow. */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v);
                setConfirmingReset(false);
              }}
              aria-expanded={menuOpen}
              aria-label="Tuỳ chọn phòng"
              className="flex h-9 w-9 items-center justify-center rounded text-[#8C9BAB] transition-colors hover:bg-[#F3F7FA] hover:text-[#3F4F5C]"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmingReset(false);
                  }}
                />
                <div className="absolute bottom-11 right-0 z-50 w-60 rounded border border-[#D8E2EA] bg-white p-1.5 shadow-lg">
                  {confirmingReset ? (
                    <div className="p-2">
                      <p className="text-[13px] leading-relaxed text-[#3F4F5C]">
                        Xoá {uniqueCount} sản phẩm và đưa phòng về kích thước mặc định?
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onResetRoom();
                            setMenuOpen(false);
                            setConfirmingReset(false);
                          }}
                          className="flex-1 rounded bg-[#B4322A] py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#95271F]"
                        >
                          Đặt lại
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingReset(false)}
                          className="flex-1 rounded border border-[#D8E2EA] py-1.5 text-[13px] font-medium text-[#3F4F5C]"
                        >
                          Giữ lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* On a phone the bar carries one primary action; saving
                          the design is still here rather than dropped. */}
                      <button
                        type="button"
                        disabled={empty}
                        onClick={() => {
                          onSaveDesign();
                          setMenuOpen(false);
                        }}
                        className="w-full rounded px-2.5 py-2 text-left text-[13px] text-[#3F4F5C] transition-colors hover:bg-[#F3F7FA] disabled:opacity-40 lg:hidden"
                      >
                        Lưu thiết kế vào giỏ báo giá
                      </button>
                      <button
                        type="button"
                        onClick={() => (empty ? onResetRoom() : setConfirmingReset(true))}
                        className="w-full rounded px-2.5 py-2 text-left text-[13px] text-[#3F4F5C] transition-colors hover:bg-[#F3F7FA]"
                      >
                        Đặt lại phòng
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onSaveDesign}
            disabled={empty}
            title="Lưu những sản phẩm đang trong phòng vào giỏ báo giá"
            className="hidden whitespace-nowrap rounded border border-[#D8E2EA] px-3.5 py-2 text-[13px] font-medium text-[#0B2239] transition-colors hover:border-[#0B2239] disabled:cursor-not-allowed disabled:opacity-40 lg:block"
          >
            Lưu thiết kế
          </button>
          <button
            type="button"
            onClick={onRequestQuote}
            className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--tenant-ui-radius,0.25rem)] bg-[color:var(--tenant-ui-primary,#0B2239)] px-4 py-2 text-[13px] font-semibold text-[color:var(--tenant-ui-primary-contrast,#FFFFFF)] transition-colors hover:bg-[color:var(--tenant-ui-primary-hover,#061827)] lg:flex-none"
          >
            {requestQuoteLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
