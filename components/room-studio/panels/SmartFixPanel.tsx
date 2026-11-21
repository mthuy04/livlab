'use client';
import { useEffect, useRef, useState } from 'react';
import type { RoomState } from '@/lib/room-studio/roomState';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { RoomProposal } from '@/lib/room-studio/roomProposal';
import type { SnapView } from '@/lib/room-studio/snapPlacement';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import { formatBudgetRange } from '@/lib/room-studio/budgetCalculator';
import { Eye, Loader2, Sparkles } from 'lucide-react';

export default function SmartFixPanel({
  state,
  findings,
  products,
  views,
  preview,
}: {
  state: RoomState;
  findings: TechnicalValidationResult[];
  products: RoomStudioProduct[];
  views: SnapView[];
  preview: (p: RoomProposal) => void;
}) {
  const issues = findings.filter((f) => f.placementIssue);
  const [id, select] = useState(''),
    [choices, setChoices] = useState<RoomProposal[] | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const job = useRef<Worker | null>(null);
  useEffect(() => () => job.current?.terminate(), []);
  if (!issues.length) return null;
  const issue = issues.find((f) => f.id === id) ?? issues[0];

  // What each proposal does, in plain directions, and only once per outcome:
  // two searches that land the product on the same spot are one proposal.
  const shortName = (instanceId: string) => {
    const product = views.find((v) => v.placed.instanceId === instanceId)?.product;
    if (!product) return 'Sản phẩm';
    const cut = product.brand ? product.name.toLowerCase().indexOf(' ' + product.brand.toLowerCase()) : -1;
    return cut > 0 ? product.name.slice(0, cut) : product.name;
  };
  const cm = (metres: number) => Math.round(Math.abs(metres) * 100);
  const directions = (p: RoomProposal) =>
    p.operations.flatMap((op) => {
      if (op.op === 'rotate') return [`${shortName(op.instanceId)}: xoay hướng`];
      if (op.op !== 'move') return [];
      const before = state.placedProducts.find((x) => x.instanceId === op.instanceId);
      if (!before) return [];
      if (op.wall && op.wall !== before.wall) {
        return [`${shortName(op.instanceId)}: chuyển sang tường ${op.wall === 'left' ? 'trái' : op.wall === 'right' ? 'phải' : 'trong'}`];
      }
      const dx = op.position[0] - before.position[0];
      const dz = op.position[2] - before.position[2];
      const parts = [
        cm(dx) ? `${dx > 0 ? 'sang phải' : 'sang trái'} ${cm(dx)} cm` : '',
        cm(dz) ? `${dz > 0 ? 'ra phía trước' : 'lùi về tường trong'} ${cm(dz)} cm` : '',
      ].filter(Boolean);
      return parts.length ? [`${shortName(op.instanceId)}: ${parts.join(', ')}`] : [];
    });
  const outcome = (p: RoomProposal) =>
    JSON.stringify(
      p.operations.map((op) =>
        op.op === 'move' ? [op.instanceId, op.position.map((v) => Math.round(v * 100)), op.wall ?? ''] : op
      )
    );
  const shown = choices?.filter((p, i, all) => all.findIndex((q) => outcome(q) === outcome(p)) === i) ?? null;
  function search() {
    job.current?.terminate();
    setChoices(null);
    setBusy(true);
    setError('');
    const worker = new Worker(new URL('../../../lib/room-studio/smartFix.worker.ts', import.meta.url), {
      type: 'module',
    });
    job.current = worker;
    worker.onmessage = (e) => {
      setChoices(e.data);
      setBusy(false);
      worker.terminate();
    };
    worker.onerror = () => {
      setError('Không thể kiểm tra phương án. Vui lòng thử lại.');
      setBusy(false);
      worker.terminate();
    };
    worker.postMessage({ state, issue, products, views });
  }
  return (
    <section aria-label="Smart Fix" className="my-3 rounded-xl border border-[#D6E2EC] bg-[#F7FAFC] p-3 text-xs">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B2239] text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-[#0B1623]">Smart Fix</p>
          <p className="text-[11px] leading-snug text-[#5B6B7A]">
            {issues.length} vị trí cần xử lý · đề xuất bố trí đã kiểm tra lại
          </p>
        </div>
      </div>
      <label className="mt-3 block text-[11px] font-semibold text-[#3F4F5C]">
        Xung đột cần xử lý
        <select
          className="mt-1 block w-full rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-2 text-[12px] font-normal text-[#0B1623] focus:border-[#0B2239] focus:outline-none focus:ring-2 focus:ring-[#7FA7C9]/40"
          value={issue.id}
          onChange={(e) => {
            select(e.target.value);
            job.current?.terminate();
            setBusy(false);
            setChoices(null);
            setError('');
          }}
        >
          {issues.map((f) => (
            <option key={f.id} value={f.id}>
              {f.message}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B2239] px-4 py-2.5 text-[12px] font-semibold tracking-[0.1em] text-white shadow-[0_6px_16px_rgba(11,34,57,0.22)] transition hover:bg-[#15324F] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75"
        disabled={busy}
        onClick={search}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
        {busy ? 'Đang kiểm tra…' : 'SMART FIX'}
      </button>
      <div aria-live="polite" className="text-[12px] text-[#5B6B7A] empty:hidden [&:not(:empty)]:mt-2">
        {error}
        {shown?.length === 0 && 'Chưa tìm được phương án phù hợp với hình học và dữ liệu hiện có.'}
      </div>
      {shown && shown.length > 0 && (
        <ol className="mt-3 space-y-2">
          {shown.map((p, i) => (
            <li className="rounded-lg border border-[#E1E8ED] bg-white p-2.5 shadow-[0_1px_2px_rgba(11,34,57,0.04)]" key={i}>
              <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#0B1623]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF3F7] text-[11px] text-[#0B2239]">
                  {i + 1}
                </span>
                <strong className="font-semibold">{p.label}</strong>
              </p>
              {directions(p).length > 0 && (
                <p className="mt-1.5 text-[12px] font-medium leading-snug text-[#0B2239]">{directions(p).join(' · ')}</p>
              )}
              <p className="mt-1 leading-relaxed text-[#5B6B7A]">{p.changes.join(' · ')}</p>
              <p className="mt-1 text-[11px] text-[#5B6B7A]">
                {p.budget && formatBudgetRange(p.budget.after)}
                {p.budget && ' · '}
                {p.budget?.difference
                  ? 'Δ ' +
                    p.budget.difference.min.toLocaleString('vi-VN') +
                    ' – ' +
                    p.budget.difference.max.toLocaleString('vi-VN') +
                    'đ'
                  : 'Chênh lệch chưa xác định'}
              </p>
              <details className="mt-1 text-[11px] text-[#5B6B7A]">
                <summary className="cursor-pointer select-none">Lưu ý còn lại ({p.validation?.remaining.length ?? 0})</summary>
                {p.validation?.remaining.map((f) => (
                  <p className="mt-1" key={f.id}>
                    {f.message}
                  </p>
                ))}
              </details>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#0B2239] px-3 py-1.5 text-[12px] font-semibold text-[#0B2239] transition-colors hover:bg-[#0B2239] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9]"
                onClick={() => preview(p)}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden />
                Xem trước phương án {i + 1}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
