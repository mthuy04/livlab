'use client';

import type { RoomProposal } from '@/lib/room-studio/roomProposal';
import { formatBudgetRange, type BudgetEstimate } from '@/lib/room-studio/budgetCalculator';
import WorkspaceDialog from './WorkspaceDialog';

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
          <button type="button" onClick={onDiscard} className="rounded border px-4 py-2">Bỏ qua</button>
          <button type="button" onClick={onApply} disabled={!proposal.eligible}
            className="rounded bg-[color:var(--tenant-ui-primary,#0B2239)] px-4 py-2 font-semibold text-white disabled:opacity-40">Áp dụng</button>
        </div>
      </div>
  );
  return inline ? <section aria-label="Xem trước Smart Fix" className="border-y py-3">{content}</section> : <WorkspaceDialog open title={`Xem trước · ${proposal.label}`} onClose={onDiscard}>{content}</WorkspaceDialog>;
}
