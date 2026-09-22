'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { formatBudgetRange, type BudgetEstimate } from '@/lib/room-studio/budgetCalculator';

interface BudgetSummaryBarProps {
  budget: BudgetEstimate;
  onAddAllToQuote: () => void;
  onClearRoom: () => void;
}

/**
 * Reference product cost for what is currently standing in the room.
 *
 * Wording matters here: this is "chi phí sản phẩm tham khảo", never a quotation.
 * The showroom still confirms final price, promotion, stock and installation.
 */
export default function BudgetSummaryBar({ budget, onAddAllToQuote, onClearRoom }: BudgetSummaryBarProps) {
  return (
    <div
      /* Read by the LivLab Expert entry, which parks itself directly above this
         bar. Its height is not constant — the CTAs wrap on narrow and tablet
         widths — so the Expert measures it rather than assuming a number. */
      data-budget-bar
      className="sticky bottom-0 z-40 border-t border-[#D8E2EA] bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF4F7] sm:flex">
            <Wallet className="h-5 w-5 text-[#123C5A]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#627386]">Chi phí sản phẩm tham khảo</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-[#0B1623] md:text-lg">{formatBudgetRange(budget)}</span>
              <span className="rounded bg-[#DCEBF5] px-2 py-0.5 text-[11px] font-bold text-[#123C5A]">
                {budget.itemCount} sản phẩm
              </span>
            </div>
            <p className="mt-0.5 text-[10px] leading-snug text-[#627386]">
              Giá tham khảo. Showroom xác nhận giá cuối, khuyến mãi, tồn kho và chi phí lắp đặt.
              {budget.unpricedCount > 0 && ` ${budget.unpricedCount} sản phẩm chưa có giá tham khảo.`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClearRoom}
            disabled={budget.itemCount === 0}
            className="rounded-xl bg-[#F3F7FA] px-3 py-3 text-xs font-bold text-[#627386] transition-colors hover:bg-[#E4EDF2] disabled:opacity-40"
          >
            Xoá phòng
          </button>
          <button
            type="button"
            onClick={onAddAllToQuote}
            disabled={budget.itemCount === 0}
            className="flex-1 rounded-xl bg-[#EEF4F7] px-4 py-3 text-xs font-bold text-[#0B2239] transition-colors hover:bg-[#D8E2EA] disabled:opacity-40 md:flex-none"
          >
            Lưu vào giỏ báo giá
          </button>
          <Link
            href="/quote"
            className="flex-1 rounded-xl bg-[#0B2239] px-4 py-3 text-center text-xs font-bold text-white transition-colors hover:bg-[#061827] md:flex-none"
          >
            Gửi yêu cầu báo giá
          </Link>
        </div>
      </div>
    </div>
  );
}
