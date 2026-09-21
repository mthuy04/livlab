'use client';

import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { ExpertReply } from '@/lib/ai/expert/expertContext';

interface ExpertBudgetCardProps {
  card: NonNullable<ExpertReply['budgetCard']>;
}

function vnd(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(Math.abs(value)))}đ`;
}

/**
 * Budget figures rendered from the deterministic values LivLab computed, not
 * from the model's prose. The Expert may explain these numbers; it never
 * produces them.
 */
export default function ExpertBudgetCard({ card }: ExpertBudgetCardProps) {
  const over = card.difference !== undefined && card.difference < 0;
  const hasTarget = card.targetBudget !== undefined;

  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-[#F8FAFC] p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5 text-[#123C5A]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#627386]">
          Chi phí sản phẩm tham khảo
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#627386]">Tổng hiện tại</span>
          <span className="font-bold text-[#0B1623]">
            {vnd(card.estimatedTotalMin)}
            {card.estimatedTotalMax !== card.estimatedTotalMin && ` – ${vnd(card.estimatedTotalMax)}`}
          </span>
        </div>

        {hasTarget && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#627386]">Ngân sách mục tiêu</span>
              <span className="font-bold text-[#0B1623]">{vnd(card.targetBudget)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#D8E2EA] pt-1.5">
              <span className="text-[#627386]">{over ? 'Đang vượt' : 'Còn lại'}</span>
              <span className={`flex items-center gap-1 font-bold ${over ? 'text-red-500' : 'text-emerald-600'}`}>
                {over ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {vnd(card.difference)}
              </span>
            </div>
            {card.fitLabel && (
              <div className="flex items-center justify-between">
                <span className="text-[#627386]">Đánh giá</span>
                <span className="font-bold text-[#123C5A]">{card.fitLabel}</span>
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-2 text-[10px] leading-snug text-[#9AA9B6]">{card.note}</p>
    </div>
  );
}
