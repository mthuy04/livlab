'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Send, Trash2 } from 'lucide-react';
import {
  PageShell, Section, StatusChip, MigrationNotice, EmptyState, money, type Tone,
} from '@/components/showroom/ui/primitives';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp', SENT: 'Đã gửi', ACCEPTED: 'Khách duyệt', REJECTED: 'Khách từ chối', EXPIRED: 'Hết hạn',
};
const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'muted', SENT: 'info', ACCEPTED: 'positive', REJECTED: 'negative', EXPIRED: 'muted',
};

interface Line {
  id?: string; type: string; nameSnapshot: string; skuSnapshot: string | null; brandSnapshot: string | null;
  quantity: number; referencePriceSnapshot: number | null; unitPrice: number; discountAmount: number; lineTotal: number;
}
interface Quote {
  id: string; code: string; status: string; subtotal: number; discount: number; total: number;
  validUntil: string | null; notes: string | null; customerNameSnapshot: string;
  customerPhoneSnapshot: string | null; lines: Line[]; lead: { id: string; customerName: string } | null;
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'missing'>('loading');
  const [busy, setBusy] = useState(false);

  // Bumped after every mutation to re-run the effect, which owns the fetch so
  // it can be cancelled if the page changes mid-request.
  const [reloadAt, setReloadAt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/showroom/quotes/${id}`);
      if (cancelled) return;
      if (res.status === 503) return setState('migration');
      if (!res.ok) return setState('missing');
      const q = (await res.json()).quote as Quote;
      if (cancelled) return;
      setQuote(q);
      setLines(q.lines);
      setState('ready');
    })();
    return () => { cancelled = true; };
  }, [id, reloadAt]);

  const isDraft = quote?.status === 'DRAFT';
  // Previewed locally so the figures move as you type; the server recomputes
  // them on save and its numbers are the ones that count.
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const discount = lines.reduce((s, l) => s + (l.discountAmount || 0), 0);

  function patchLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/showroom/quotes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      });
      setReloadAt((n) => n + 1);
    } finally { setBusy(false); }
  }

  async function setStatus(status: string) {
    setBusy(true);
    try {
      await fetch(`/api/showroom/quotes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setReloadAt((n) => n + 1);
    } finally { setBusy(false); }
  }

  if (state === 'loading') return <PageShell title="Báo giá"><p className="text-[14px] text-[#5B6B7C]">Đang tải…</p></PageShell>;
  if (state === 'migration') return <PageShell title="Báo giá"><MigrationNotice /></PageShell>;
  if (!quote) return <PageShell title="Báo giá"><Section><EmptyState title="Không tìm thấy báo giá" /></Section></PageShell>;

  return (
    <PageShell
      title={quote.code}
      description={`${quote.customerNameSnapshot}${quote.customerPhoneSnapshot ? ` · ${quote.customerPhoneSnapshot}` : ''}`}
      actions={
        <>
          <StatusChip tone={STATUS_TONE[quote.status]}>{STATUS_LABEL[quote.status]}</StatusChip>
          {isDraft && (
            <>
              <button onClick={save} disabled={busy}
                className="rounded-lg border border-[#DCE4EC] px-3 py-2 text-[13px] font-semibold text-[#45586B] hover:border-[#B9C9D8] disabled:opacity-50">
                Lưu nháp
              </button>
              <button onClick={() => setStatus('SENT')} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2239] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#061827] disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> Đánh dấu đã gửi
              </button>
            </>
          )}
          {quote.status === 'SENT' && (
            <>
              <button onClick={() => setStatus('ACCEPTED')} disabled={busy}
                className="rounded-lg bg-[#2E7D52] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">Khách duyệt</button>
              <button onClick={() => setStatus('REJECTED')} disabled={busy}
                className="rounded-lg border border-[#DCE4EC] px-3 py-2 text-[13px] font-semibold text-[#A33A3A] disabled:opacity-50">Từ chối</button>
            </>
          )}
        </>
      }
    >
      <Link href="/showroom/quotes" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5B6B7C] hover:text-[#0B1623]">
        <ArrowLeft className="h-3.5 w-3.5" /> Tất cả báo giá
      </Link>

      <Section title="Dòng báo giá">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#E8EDF2] text-[12px] uppercase tracking-wide text-[#7A8795]">
                <th className="px-5 py-2.5 font-semibold">Sản phẩm / dịch vụ</th>
                <th className="px-5 py-2.5 font-semibold w-20">SL</th>
                <th className="px-5 py-2.5 font-semibold text-right w-32">Tham khảo</th>
                <th className="px-5 py-2.5 font-semibold text-right w-36">Giá showroom</th>
                <th className="px-5 py-2.5 font-semibold text-right w-32">Giảm</th>
                <th className="px-5 py-2.5 font-semibold text-right w-32">Thành tiền</th>
                {isDraft && <th className="w-12" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F3F6]">
              {lines.map((line, i) => (
                <tr key={i} className="h-[52px]">
                  <td className="px-5 py-2">
                    {isDraft && line.type === 'SERVICE' ? (
                      <input value={line.nameSnapshot} onChange={(e) => patchLine(i, { nameSnapshot: e.target.value })}
                        className="w-full rounded border border-[#DCE4EC] px-2 py-1 text-[14px]" />
                    ) : (
                      <p className="font-semibold text-[#0B1623]">{line.nameSnapshot}</p>
                    )}
                    <p className="text-[12px] text-[#7A8795]">
                      {line.type === 'SERVICE' ? 'Dịch vụ' : [line.brandSnapshot, line.skuSnapshot].filter(Boolean).join(' · ') || 'Sản phẩm'}
                    </p>
                  </td>
                  <td className="px-5">
                    {isDraft ? (
                      <input type="number" min={1} value={line.quantity}
                        onChange={(e) => patchLine(i, { quantity: Math.max(1, Number(e.target.value)) })}
                        className="w-16 rounded border border-[#DCE4EC] px-2 py-1 text-[14px]" />
                    ) : line.quantity}
                  </td>
                  <td className="px-5 text-right text-[#7A8795]">{money(line.referencePriceSnapshot)}</td>
                  <td className="px-5 text-right">
                    {isDraft ? (
                      <input type="number" min={0} value={line.unitPrice}
                        onChange={(e) => patchLine(i, { unitPrice: Math.max(0, Number(e.target.value)) })}
                        className="w-32 rounded border border-[#DCE4EC] px-2 py-1 text-right text-[14px]" />
                    ) : money(line.unitPrice)}
                  </td>
                  <td className="px-5 text-right">
                    {isDraft ? (
                      <input type="number" min={0} value={line.discountAmount}
                        onChange={(e) => patchLine(i, { discountAmount: Math.max(0, Number(e.target.value)) })}
                        className="w-28 rounded border border-[#DCE4EC] px-2 py-1 text-right text-[14px]" />
                    ) : money(line.discountAmount)}
                  </td>
                  <td className="px-5 text-right font-semibold text-[#0B1623]">
                    {money(Math.max(0, line.quantity * line.unitPrice - (line.discountAmount || 0)))}
                  </td>
                  {isDraft && (
                    <td className="px-3">
                      <button onClick={() => setLines((p) => p.filter((_, x) => x !== i))}
                        className="text-[#9AA9B6] hover:text-[#A33A3A]"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isDraft && (
          <div className="border-t border-[#E8EDF2] px-5 py-3">
            {/* Service lines carry no default price: inventing one would put a
                number in front of a customer that nobody at the showroom chose. */}
            <button
              onClick={() => setLines((p) => [...p, {
                type: 'SERVICE', nameSnapshot: 'Lắp đặt', skuSnapshot: null, brandSnapshot: null,
                quantity: 1, referencePriceSnapshot: null, unitPrice: 0, discountAmount: 0, lineTotal: 0,
              }])}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#123C5A] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm dịch vụ (lắp đặt, vận chuyển, khảo sát)
            </button>
          </div>
        )}

        <div className="border-t border-[#E8EDF2] px-5 py-4">
          <dl className="ml-auto max-w-xs space-y-2 text-[14px]">
            <div className="flex justify-between"><dt className="text-[#5B6B7C]">Tạm tính</dt><dd className="font-semibold">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#5B6B7C]">Giảm giá</dt><dd className="font-semibold">− {money(discount)}</dd></div>
            <div className="flex justify-between border-t border-[#E8EDF2] pt-2 text-[16px]">
              <dt className="font-bold">Tổng</dt><dd className="font-bold">{money(Math.max(0, subtotal - discount))}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] leading-relaxed text-[#7A8795]">
            Báo giá do showroom phát hành. Chưa bao gồm thuế và các chi phí phát sinh nếu không ghi rõ ở trên.
          </p>
        </div>
      </Section>
    </PageShell>
  );
}
