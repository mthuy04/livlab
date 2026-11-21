'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomState } from '@/lib/room-studio/roomState';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { RoomProposal } from '@/lib/room-studio/roomProposal';
import type { SnapView } from '@/lib/room-studio/snapPlacement';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import { Eye, Loader2, Sparkles } from 'lucide-react';

/** The money side of a proposal, in a few words. */
function costImpact(p: RoomProposal): string {
  const d = p.budget?.difference;
  if (!d) return 'Chưa đủ giá để tính chi phí';
  if (d.min === 0 && d.max === 0) return 'Không đổi chi phí';
  return `Chi phí ${d.min.toLocaleString('vi-VN')} – ${d.max.toLocaleString('vi-VN')}đ`;
}

export default function SmartFixPanel({
  state,
  findings,
  products,
  views,
  preview,
  apply,
}: {
  state: RoomState;
  findings: TechnicalValidationResult[];
  products: RoomStudioProduct[];
  views: SnapView[];
  preview: (p: RoomProposal) => void;
  /** Applies a proposal straight from its card, without the preview step. */
  apply?: (p: RoomProposal) => void;
}) {
  const issues = findings.filter((f) => f.placementIssue);
  const [id, select] = useState(''),
    [choices, setChoices] = useState<RoomProposal[] | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const job = useRef<Worker | null>(null);
  useEffect(() => () => job.current?.terminate(), []);

  const run = useCallback(
    (target: TechnicalValidationResult) => {
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
      worker.postMessage({ state, issue: target, products, views });
    },
    [state, products, views]
  );

  // "Sửa bằng Smart Fix" on an advisor card: select that issue and search.
  useEffect(() => {
    const onFix = (event: Event) => {
      const target = issues.find((f) => f.id === (event as CustomEvent<string>).detail);
      if (!target) return;
      select(target.id);
      run(target);
    };
    window.addEventListener('livlab:smart-fix', onFix);
    return () => window.removeEventListener('livlab:smart-fix', onFix);
  }, [issues, run]);

  if (!issues.length) return null;
  const issue = issues.find((f) => f.id === id) ?? issues[0];

  // What each proposal does, in plain words, and only once per outcome:
  // two searches that land the product on the same spot are one proposal.
  const shortName = (instanceId: string) => {
    const product = views.find((v) => v.placed.instanceId === instanceId)?.product;
    if (!product) return 'sản phẩm';
    const cut = product.brand ? product.name.toLowerCase().indexOf(' ' + product.brand.toLowerCase()) : -1;
    return (cut > 0 ? product.name.slice(0, cut) : product.name).toLowerCase();
  };
  const cm = (metres: number) => Math.round(Math.abs(metres) * 100);
  const actions = (p: RoomProposal) =>
    p.operations.flatMap((op) => {
      if (op.op === 'rotate') return [shortName(op.instanceId)];
      if (op.op !== 'move') return [];
      const before = state.placedProducts.find((x) => x.instanceId === op.instanceId);
      if (!before) return [];
      if (op.wall && op.wall !== before.wall) {
        return [`${shortName(op.instanceId)} sang tường ${op.wall === 'left' ? 'trái' : op.wall === 'right' ? 'phải' : 'trong'}`];
      }
      const dx = op.position[0] - before.position[0];
      const dz = op.position[2] - before.position[2];
      const parts = [
        cm(dx) ? `${dx > 0 ? 'sang phải' : 'sang trái'} ${cm(dx)} cm` : '',
        cm(dz) ? `${dz > 0 ? 'ra phía trước' : 'lùi về tường'} ${cm(dz)} cm` : '',
      ].filter(Boolean);
      return parts.length ? [`${shortName(op.instanceId)} ${parts.join(', ')}`] : [];
    });
  const mainAction = (p: RoomProposal) => {
    const list = actions(p);
    if (!list.length) return p.changes[0] ?? p.label;
    return list.length > 1 ? `${p.label}: ${list.join(' · ')}` : `${p.label} ${list[0]}`;
  };
  const outcome = (p: RoomProposal) =>
    JSON.stringify(
      p.operations.map((op) =>
        op.op === 'move' ? [op.instanceId, op.position.map((v) => Math.round(v * 100)), op.wall ?? ''] : op
      )
    );
  const shown = choices?.filter((p, i, all) => all.findIndex((q) => outcome(q) === outcome(p)) === i) ?? null;
  const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FA7C9]';

  return (
    <section id="smart-fix" aria-label="Smart Fix" className="scroll-mt-4 rounded-xl border border-[#D6E2EC] bg-[#F7FAFC] p-3 text-xs">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B2239] text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-[#0B1623]">Smart Fix</p>
          <p className="text-[11px] leading-snug text-[#5B6B7A]">Tự tìm bố trí hợp lệ cho {issues.length} vị trí cần xử lý</p>
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
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B2239] px-4 py-2.5 text-[12px] font-semibold tracking-[0.1em] text-white shadow-[0_6px_16px_rgba(11,34,57,0.22)] transition hover:bg-[#15324F] active:translate-y-px ${ring} focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75`}
        disabled={busy}
        onClick={() => run(issue)}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
        {busy ? 'Đang kiểm tra…' : 'SMART FIX'}
      </button>
      <div aria-live="polite" className="text-[12px] text-[#5B6B7A] empty:hidden [&:not(:empty)]:mt-2">
        {error}
        {shown?.length === 0 && 'Chưa tìm được phương án phù hợp với hình học và dữ liệu hiện có.'}
      </div>
      {shown && shown.length > 0 && (
        <>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5B6B7A]">
            {shown.length} phương án đã kiểm tra lại
          </p>
          <ol className="mt-1.5 space-y-2">
            {shown.map((p, i) => {
              const left = p.validation?.remaining.filter((f) => f.placementIssue).length ?? 0;
              return (
                <li className="rounded-xl border border-[#E1E8ED] bg-white p-3 shadow-[0_1px_3px_rgba(11,34,57,0.06)]" key={i}>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B2239] text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold leading-snug text-[#0B1623]">{mainAction(p)}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[#5B6B7A]">Giải quyết · {issue.title}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                        left ? 'border-[#F2D3A0] bg-[#FFF6E8] text-[#9A5B0B]' : 'border-[#CBE8DA] bg-[#EEF8F3] text-[#1F7A55]'
                      }`}
                    >
                      {left ? `Còn ${left} vấn đề vị trí` : 'Hết xung đột vị trí'}
                    </span>
                    <span className="rounded-full border border-[#E1E8ED] bg-[#F7F9FB] px-2 py-0.5 text-[10.5px] font-medium text-[#5B6B7A]">
                      {costImpact(p)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex gap-1.5">
                    <button
                      type="button"
                      aria-label={`Xem trước phương án ${i + 1}`}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#0B2239] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#15324F] ${ring}`}
                      onClick={() => preview(p)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Xem trước
                    </button>
                    {apply && (
                      <button
                        type="button"
                        aria-label={`Áp dụng phương án ${i + 1}`}
                        className={`whitespace-nowrap rounded-lg border border-[#D8E2EA] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0B2239] transition-colors hover:border-[#0B2239] ${ring}`}
                        onClick={() => apply(p)}
                      >
                        Áp dụng
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            aria-label="Bỏ qua các phương án"
            className={`mt-2 w-full rounded-lg py-1.5 text-[12px] font-medium text-[#5B6B7A] hover:text-[#0B2239] ${ring}`}
            onClick={() => setChoices(null)}
          >
            Bỏ qua
          </button>
        </>
      )}
    </section>
  );
}
