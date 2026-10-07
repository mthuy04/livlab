'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Phone } from 'lucide-react';
import {
  PageShell, Section, StatusChip, EmptyState, MigrationNotice, money, relativeTime,
} from '@/components/showroom/ui/primitives';
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/showroom/leadStage';

/**
 * Everything the showroom received about one customer, on one screen.
 *
 * The value of a LivLab lead is that the customer already did the work: a room,
 * a product selection, a budget, and whatever the Technical Advisor flagged.
 * This page shows that rather than a contact form, so the first call can start
 * from what they chose instead of from scratch.
 */

const REQUEST_LABEL: Record<string, string> = {
  QUOTATION: 'Yêu cầu báo giá',
  SHOWROOM_CONSULTATION: 'Cần showroom tư vấn',
  TECHNICAL_CHECK: 'Cần kiểm tra kỹ thuật',
};

const ACTIVITY_LABEL: Record<string, string> = {
  NOTE: 'Ghi chú', CALL: 'Gọi điện', MESSAGE: 'Nhắn tin', MEETING: 'Gặp tại showroom',
  QUOTE_SENT: 'Gửi báo giá', FOLLOW_UP: 'Theo dõi', TECHNICAL_CHECK: 'Kiểm tra kỹ thuật',
  STAGE_CHANGE: 'Đổi giai đoạn',
};

interface LeadDetail {
  id: string; customerName: string; phone: string | null; email: string | null;
  roomType: string | null; conceptName: string | null; notes: string | null;
  requestType: string | null; effectiveStage: string; estimatedValue: number | null;
  budgetMin: number | null; budgetMax: number | null;
  nextActionAt: string | null; nextActionNote: string | null; firstContactAt: string | null;
  contextJson: Record<string, unknown> | null; createdAt: string;
  assignedTo: { name: string | null; email: string } | null;
  items: { id: string; productName: string; quantity: number; priceMin: number | null; priceMax: number | null;
    product: { brand: string | null; imageUrl: string | null; slug: string | null } | null }[];
  quotes: { id: string; code: string; status: string; total: number; createdAt: string }[];
  activities: { id: string; type: string; body: string | null; dueAt: string | null; doneAt: string | null;
    createdAt: string; createdBy: { name: string | null; email: string } | null }[];
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'missing'>('loading');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  // Bumped after every mutation to re-run the effect below. Fetching inside
  // the effect — rather than through a callback the effect invokes — keeps the
  // request cancellable, so a response arriving after navigation cannot write
  // to a component that is gone.
  const [reloadAt, setReloadAt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/showroom/leads/${id}`);
      if (cancelled) return;
      if (res.status === 503) return setState('migration');
      if (!res.ok) return setState('missing');
      const data = await res.json();
      if (cancelled) return;
      setLead(data.lead);
      setState('ready');
    })();
    return () => { cancelled = true; };
  }, [id, reloadAt]);

  async function mutate(path: string, body: unknown, method = 'PATCH') {
    setBusy(true);
    try {
      await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setReloadAt((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  if (state === 'loading') return <PageShell title="Lead"><p className="text-[14px] text-[#5B6B7C]">Đang tải…</p></PageShell>;
  if (state === 'migration') return <PageShell title="Lead"><MigrationNotice /></PageShell>;
  if (state === 'missing' || !lead) {
    return (
      <PageShell title="Lead">
        <Section><EmptyState title="Không tìm thấy lead" hint="Lead này không tồn tại hoặc không thuộc showroom của bạn." /></Section>
      </PageShell>
    );
  }

  const ctx = lead.contextJson as
    | { room?: { length?: number; width?: number; height?: number; floorFinish?: string; wallFinish?: string };
        technicalFindings?: { severity: string; title: string; message?: string; affectedProduct?: string }[] }
    | null;
  const openQuote = lead.quotes[0];

  return (
    <PageShell
      title={lead.customerName}
      description={`${lead.requestType ? REQUEST_LABEL[lead.requestType] : 'Yêu cầu'} · tạo ${relativeTime(lead.createdAt)}`}
      actions={
        <>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4EC] px-3 py-2 text-[13px] font-semibold text-[#45586B] hover:border-[#B9C9D8]">
              <Phone className="h-3.5 w-3.5" /> {lead.phone}
            </a>
          )}
          <button
            disabled={busy}
            onClick={() => mutate('/api/showroom/quotes', { leadId: lead.id }, 'POST')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2239] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#061827] disabled:opacity-60"
          >
            <FileText className="h-3.5 w-3.5" /> Tạo báo giá
          </button>
        </>
      }
    >
      <Link href="/showroom/leads" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5B6B7C] hover:text-[#0B1623]">
        <ArrowLeft className="h-3.5 w-3.5" /> Tất cả lead
      </Link>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Section title="Giai đoạn">
            <div className="flex flex-wrap gap-1.5 px-5 py-4">
              {STAGE_ORDER.map((s) => (
                <button
                  key={s}
                  disabled={busy || s === lead.effectiveStage}
                  onClick={() => mutate(`/api/showroom/leads/${lead.id}`, { stage: s })}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    s === lead.effectiveStage ? 'bg-[#0B2239] text-white' : 'bg-[#F2F5F8] text-[#5B6B7C] hover:bg-[#E4EBF1]'
                  }`}
                >
                  {STAGE_LABEL[s]}
                </button>
              ))}
            </div>
          </Section>

          <Section title={`Sản phẩm khách đã chọn (${lead.items.length})`}>
            {lead.items.length === 0 ? (
              <EmptyState title="Khách chưa chọn sản phẩm cụ thể" hint="Yêu cầu này đến mà không kèm sản phẩm nào." />
            ) : (
              <table className="w-full text-left text-[14px]">
                <tbody className="divide-y divide-[#F0F3F6]">
                  {lead.items.map((item) => (
                    <tr key={item.id} className="h-[52px]">
                      <td className="px-5 py-2">
                        <p className="font-semibold text-[#0B1623]">{item.productName}</p>
                        <p className="text-[12px] text-[#7A8795]">
                          {[item.product?.brand, item.product?.slug].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </td>
                      <td className="px-5 text-[13px] text-[#45586B]">× {item.quantity}</td>
                      <td className="px-5 text-right">
                        <span className="font-semibold text-[#0B1623]">{money(item.priceMin)}</span>
                        <p className="text-[12px] text-[#7A8795]">giá tham khảo LivLab</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {(ctx?.room || lead.roomType) && (
            <Section title="Không gian">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-[14px] sm:grid-cols-3">
                {ctx?.room?.length && (
                  <div><dt className="text-[12px] text-[#7A8795]">Kích thước</dt>
                    <dd className="font-semibold">{ctx.room.length} × {ctx.room.width} × {ctx.room.height} m</dd></div>
                )}
                {ctx?.room?.floorFinish && (
                  <div><dt className="text-[12px] text-[#7A8795]">Sàn</dt><dd className="font-semibold">{ctx.room.floorFinish}</dd></div>
                )}
                {ctx?.room?.wallFinish && (
                  <div><dt className="text-[12px] text-[#7A8795]">Tường</dt><dd className="font-semibold">{ctx.room.wallFinish}</dd></div>
                )}
                {lead.roomType && !ctx?.room && (
                  <div><dt className="text-[12px] text-[#7A8795]">Loại phòng</dt><dd className="font-semibold">{lead.roomType}</dd></div>
                )}
                {lead.conceptName && (
                  <div><dt className="text-[12px] text-[#7A8795]">Concept</dt>
                    <dd className="font-semibold">{lead.conceptName.replace(/^Room Studio · /, '')}</dd></div>
                )}
              </dl>
            </Section>
          )}

          {ctx?.technicalFindings && ctx.technicalFindings.length > 0 && (
            <Section title={`Điểm cần xác minh (${ctx.technicalFindings.length})`}>
              <ul className="divide-y divide-[#F0F3F6]">
                {ctx.technicalFindings.map((f, i) => (
                  <li key={i} className="px-5 py-3">
                    <div className="flex items-start gap-2">
                      <StatusChip tone={f.severity === 'VERIFY' ? 'attention' : 'info'}>{f.severity}</StatusChip>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#0B1623]">{f.title}</p>
                        {f.affectedProduct && <p className="text-[12px] text-[#7A8795]">{f.affectedProduct}</p>}
                        {f.message && <p className="mt-0.5 text-[13px] leading-relaxed text-[#45586B]">{f.message}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Older leads carry their LivLab context as prose in `notes`, because
              the structured snapshot column is new and nothing was backfilled.
              Showing the briefing verbatim beats parsing it and guessing wrong. */}
          {!ctx && lead.notes && (
            <Section title="Bối cảnh từ LivLab">
              <pre className="whitespace-pre-wrap px-5 py-4 font-sans text-[13px] leading-relaxed text-[#45586B]">
                {lead.notes}
              </pre>
            </Section>
          )}

          <Section title="Lịch sử">
            {lead.activities.length === 0 ? (
              <EmptyState title="Chưa có hoạt động" hint="Cuộc gọi, ghi chú và thay đổi giai đoạn sẽ hiện ở đây." />
            ) : (
              <ul className="divide-y divide-[#F0F3F6]">
                {lead.activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <StatusChip tone={a.doneAt ? 'muted' : 'attention'}>{ACTIVITY_LABEL[a.type] ?? a.type}</StatusChip>
                    <div className="min-w-0 flex-1">
                      {a.body && <p className="text-[14px] text-[#0B1623]">{a.body}</p>}
                      <p className="text-[12px] text-[#7A8795]">
                        {a.doneAt ? relativeTime(a.doneAt) : `Hẹn ${new Date(a.dueAt!).toLocaleString('vi-VN')}`}
                        {a.createdBy && ` · ${a.createdBy.name ?? a.createdBy.email}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Ngân sách">
            <dl className="space-y-2.5 px-5 py-4 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-[#5B6B7C]">Khách dự kiến</dt>
                <dd className="font-semibold">{money(lead.budgetMax ?? lead.budgetMin)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5B6B7C]">Tham khảo LivLab</dt>
                <dd className="font-semibold">{money(lead.estimatedValue)}</dd>
              </div>
              <div className="flex justify-between border-t border-[#E8EDF2] pt-2.5">
                <dt className="text-[#5B6B7C]">Báo giá showroom</dt>
                <dd className="font-semibold">{openQuote ? money(openQuote.total) : 'Chưa có'}</dd>
              </div>
            </dl>
            <p className="border-t border-[#E8EDF2] px-5 py-2.5 text-[12px] leading-relaxed text-[#7A8795]">
              Giá LivLab là giá tham khảo. Giá cuối do showroom xác nhận.
            </p>
          </Section>

          <Section title="Việc kế tiếp">
            <div className="space-y-3 px-5 py-4">
              {lead.nextActionAt ? (
                <div className="rounded-lg bg-[#FBF2E0] px-3 py-2.5">
                  <p className="text-[14px] font-semibold text-[#8A6520]">{lead.nextActionNote ?? 'Việc đã lên lịch'}</p>
                  <p className="text-[12px] text-[#8A6520]/80">{new Date(lead.nextActionAt).toLocaleString('vi-VN')}</p>
                </div>
              ) : (
                <p className="text-[13px] text-[#7A8795]">Chưa đặt việc kế tiếp.</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {(['CALL', 'MESSAGE', 'MEETING', 'FOLLOW_UP'] as const).map((type) => (
                  <button
                    key={type}
                    disabled={busy}
                    onClick={() =>
                      mutate('/api/showroom/activities', {
                        leadId: lead.id, type,
                        body: ACTIVITY_LABEL[type],
                        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
                      }, 'POST')
                    }
                    className="rounded-lg border border-[#DCE4EC] px-2.5 py-1.5 text-[12px] font-semibold text-[#45586B] hover:border-[#B9C9D8] disabled:opacity-50"
                  >
                    + {ACTIVITY_LABEL[type]}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Ghi chú nội bộ">
            <div className="space-y-2 px-5 py-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="VD: Khách muốn đổi lavabo nhỏ hơn."
                className="w-full resize-none rounded-lg border border-[#DCE4EC] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
              />
              <button
                disabled={busy || !note.trim()}
                onClick={async () => {
                  await mutate('/api/showroom/activities', { leadId: lead.id, type: 'NOTE', body: note.trim() }, 'POST');
                  setNote('');
                }}
                className="w-full rounded-lg bg-[#123C5A] py-2 text-[13px] font-semibold text-white hover:bg-[#0D2B42] disabled:opacity-50"
              >
                Lưu ghi chú
              </button>
              <p className="text-[11px] text-[#7A8795]">Chỉ hiển thị nội bộ, khách không nhìn thấy.</p>
            </div>
          </Section>

          {lead.quotes.length > 0 && (
            <Section title={`Báo giá (${lead.quotes.length})`}>
              <ul className="divide-y divide-[#F0F3F6]">
                {lead.quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between px-5 py-3">
                    <Link href={`/showroom/quotes/${q.id}`} className="text-[14px] font-semibold text-[#123C5A] hover:underline">
                      {q.code}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{money(q.total)}</span>
                      <StatusChip tone={q.status === 'ACCEPTED' ? 'positive' : q.status === 'DRAFT' ? 'muted' : 'info'}>
                        {q.status}
                      </StatusChip>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </PageShell>
  );
}
