'use client';

import type { RoomProposal } from '@/lib/room-studio/roomProposal';
import { formatBudgetRange, type BudgetEstimate } from '@/lib/room-studio/budgetCalculator';
import WorkspaceDialog from './WorkspaceDialog';
import { Sparkles } from 'lucide-react';

function estimate(budget: BudgetEstimate) {
  if (!budget.itemCount) return 'Phòng trống';
  const priced = budget.itemCount > budget.unpricedCount ? formatBudgetRange(budget) : '';
  return [priced, budget.unpricedCount ? `${budget.unpricedCount} sản phẩm chưa có giá` : ''].filter(Boolean).join(' + ');
}

export default function RoomProposalDialog({ proposal, onApply, onDiscard, inline=false }: {
  inline?:boolean; proposal: RoomProposal; onApply: () => void; onDiscard: () => void;
}) {
  const { budget, validation } = proposal;
  const amount = (n: number) => new Intl.NumberFormat('vi-VN', { signDisplay: 'exceptZero' }).format(n) + 'đ';
  const content = (
      <div className="space-y-4 text-[13px] leading-relaxed text-[#3F4F5C]">
        <ul className="list-inside list-disc">
          {[...proposal.changes, ...(proposal.notes ?? [])].map((line, i) => <li key={i}>{line}</li>)}
        </ul>
        {budget && <div>
          <h3 className="font-semibold">Ngân sách tham khảo</h3>
          <p>Hiện tại · {estimate(budget.before)}</p>
          <p>Đề xuất · {estimate(budget.after)}</p>
          <p>Chênh lệch · {budget.difference ? (budget.difference.min === budget.difference.max
            ? amount(budget.difference.min) : `${amount(budget.difference.min)} / ${amount(budget.difference.max)}`)
            : 'Chưa đủ giá để tính'}</p>
        </div>}
        {validation?.remaining.length ? <details>
          <summary className="cursor-pointer font-medium">Lưu ý kỹ thuật ({validation.remaining.length})</summary>
          <ul className="mt-2 space-y-2">{validation.remaining.map(finding => <li key={finding.id}>{finding.message}</li>)}</ul>
        </details> : null}
        {proposal.errors.map((error, i) => <p key={i} role="alert" className="text-red-700">{error}</p>)}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onDiscard}
            className="rounded-lg border border-[#D8E2EA] bg-white px-4 py-2 font-medium text-[#3F4F5C] transition-colors hover:border-[#0B2239] hover:text-[#0B2239] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9]">Bỏ qua</button>
          <button type="button" onClick={onApply} disabled={!proposal.eligible}
            className="rounded-lg bg-[color:var(--tenant-ui-primary,#0B2239)] px-5 py-2 font-semibold text-white shadow-[0_6px_16px_rgba(11,34,57,0.18)] transition hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9] focus-visible:ring-offset-2 disabled:opacity-40">Áp dụng</button>
        </div>
      </div>
  );
  if (inline) {
    const left = validation?.remaining.filter((f) => f.placementIssue).length ?? 0;
    const reason = proposal.notes?.[0];
    const d = budget?.difference;
    const cost = !d ? 'Chưa đủ giá để tính chi phí' : d.min === 0 && d.max === 0 ? 'Không đổi chi phí' : `Chi phí ${amount(d.min)} / ${amount(d.max)}`;
    return (
      <section aria-label="Xem trước Smart Fix" className="rounded-xl border border-[#BFD3E4] bg-white p-3 shadow-[0_8px_24px_rgba(11,34,57,0.10)]">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B2239] px-2.5 py-1 text-[11px] font-semibold text-white">
            <Sparkles aria-hidden className="h-3.5 w-3.5" />
            Đang xem trước
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5B6B7A]">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm border-2 border-[#C62828]" />
            vị trí cũ
          </span>
        </div>
        <p className="mt-2.5 text-[13.5px] font-semibold leading-snug text-[#0B1623]">{proposal.changes[0] ?? proposal.label}</p>
        {reason && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#5B6B7A]">Giải quyết · {reason.split(/(?<=\.)\s/)[0]}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${left ? 'border-[#F2D3A0] bg-[#FFF6E8] text-[#9A5B0B]' : 'border-[#CBE8DA] bg-[#EEF8F3] text-[#1F7A55]'}`}>
            {left ? `Còn ${left} vấn đề vị trí` : 'Hết xung đột vị trí'}
          </span>
          <span className="rounded-full border border-[#E1E8ED] bg-[#F7F9FB] px-2 py-0.5 text-[10.5px] font-medium text-[#5B6B7A]">{cost}</span>
        </div>
        <details className="mt-2 text-[11.5px] leading-relaxed text-[#5B6B7A]">
          <summary className="cursor-pointer select-none font-medium hover:text-[#0B2239]">Xem chi tiết</summary>
          <ul className="mt-1.5 space-y-1">
            {[...proposal.changes, ...(proposal.notes ?? [])].map((line, i) => <li key={i}>{line}</li>)}
            {budget && <li>Ngân sách · {estimate(budget.before)} → {estimate(budget.after)}</li>}
            {validation?.remaining.map((finding) => <li key={finding.id}>{finding.message}</li>)}
          </ul>
        </details>
        {proposal.errors.map((error, i) => <p key={i} role="alert" className="mt-2 text-[12px] text-red-700">{error}</p>)}
        <div className="mt-3 flex gap-1.5">
          <button type="button" onClick={onApply} disabled={!proposal.eligible}
            className="flex-1 rounded-lg bg-[color:var(--tenant-ui-primary,#0B2239)] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(11,34,57,0.18)] transition hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9] focus-visible:ring-offset-2 disabled:opacity-40">Áp dụng</button>
          <button type="button" onClick={onDiscard}
            className="rounded-lg border border-[#D8E2EA] bg-white px-4 py-2 text-[13px] font-medium text-[#3F4F5C] transition-colors hover:border-[#0B2239] hover:text-[#0B2239] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9]">Bỏ qua</button>
        </div>
      </section>
    );
  }
  return <WorkspaceDialog open title={`Xem trước · ${proposal.label}`} onClose={onDiscard}>{content}</WorkspaceDialog>;
}
