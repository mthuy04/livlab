'use client';
import { useEffect, useRef, useState } from 'react';
import type { RoomState } from '@/lib/room-studio/roomState';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { RoomProposal } from '@/lib/room-studio/roomProposal';
import type { SnapView } from '@/lib/room-studio/snapPlacement';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import { formatBudgetRange } from '@/lib/room-studio/budgetCalculator';

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
    <div className="my-3 space-y-2 border-y py-3 text-xs">
      <label>
        Xung đột cần xử lý
        <select
          className="block w-full rounded border p-2"
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
        className="rounded border border-[#aa935e] px-3 py-2 font-semibold"
        disabled={busy}
        onClick={search}
      >
        {busy ? 'Đang kiểm tra…' : 'SMART FIX'}
      </button>
      <div aria-live="polite">
        {error}
        {choices?.length === 0 && 'Chưa tìm được phương án phù hợp với hình học và dữ liệu hiện có.'}
      </div>
      {choices?.map((p, i) => (
        <div className="space-y-1 border-t py-2" key={i}>
          <strong>{p.label}</strong>
          <p>{p.changes.join(' · ')}</p>
          <p>
            {p.budget && formatBudgetRange(p.budget.after)} ·{' '}
            {p.budget?.difference
              ? 'Δ ' +
                p.budget.difference.min.toLocaleString('vi-VN') +
                ' – ' +
                p.budget.difference.max.toLocaleString('vi-VN') +
                'đ'
              : 'Chênh lệch chưa xác định'}
          </p>
          <details>
            <summary>Lưu ý còn lại ({p.validation?.remaining.length ?? 0})</summary>
            {p.validation?.remaining.map((f) => (
              <p key={f.id}>{f.message}</p>
            ))}
          </details>
          <button type="button" className="underline" onClick={() => preview(p)}>
            Xem trước phương án {i + 1}
          </button>
        </div>
      ))}
    </div>
  );
}
