'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import {
  PageShell, Section, StatusChip, EmptyState, MigrationNotice, money, relativeTime, type Tone,
} from '@/components/showroom/ui/primitives';
import { STAGE_LABEL } from '@/lib/showroom/leadStage';
import type { LeadListItem } from '@/lib/showroom/showroomRepository';

/**
 * The single sales inbox.
 *
 * Previously split across "Yêu cầu báo giá" and "Khách hàng / Leads", which
 * showed overlapping rows and forced a guess about which one to open. Rows also
 * showed only name/phone/budget/status, throwing away the room, products and
 * technical context LivLab had already collected — the whole point of the
 * handoff.
 */

const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'QUOTATION', label: 'Yêu cầu báo giá' },
  { key: 'SHOWROOM_CONSULTATION', label: 'Cần tư vấn' },
  { key: 'TECHNICAL_CHECK', label: 'Kiểm tra kỹ thuật' },
];

const STAGE_TONE: Record<string, Tone> = {
  NEW: 'info', CONTACTED: 'info', QUALIFIED: 'info', QUOTING: 'attention',
  QUOTE_SENT: 'attention', FOLLOW_UP: 'attention', WON: 'positive', LOST: 'negative',
};

function LeadsWorkspace() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<LeadListItem[]>([]);
  // Seeded from the URL so dashboard links like ?stage=NEW land pre-filtered.
  // Read through useSearchParams rather than window in an effect: the hook
  // gives the same value on the server render and the client, so there is
  // nothing to reconcile afterwards.
  const [tab, setTab] = useState(() => searchParams.get('requestType') ?? '');
  const [stage, setStage] = useState(() => searchParams.get('stage') ?? '');
  const [query, setQuery] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');

  // Debounced so typing a name does not fire a request per keystroke, and
  // guarded by `cancelled` so a result that arrives after the filters moved on
  // cannot overwrite the newer one.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (tab) params.set('requestType', tab);
      if (stage) params.set('stage', stage);
      if (query.trim()) params.set('q', query.trim());
      try {
        const res = await fetch(`/api/showroom/leads?${params}`);
        if (cancelled) return;
        if (res.status === 503) return setState('migration');
        if (!res.ok) return setState('error');
        const data = await res.json();
        setItems(data.items ?? []);
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    }, query ? 300 : 0);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [tab, stage, query]);

  return (
    <PageShell
      title="Leads"
      description="Mọi yêu cầu từ LivLab, kèm bối cảnh khách đã tạo sẵn."
      actions={
        /* An API route that streams a CSV download, not a page navigation,
           so next/link would be wrong here. */
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          href="/api/showroom/leads/export"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4EC] px-3 py-2 text-[13px] font-semibold text-[#45586B] transition-colors hover:border-[#B9C9D8]"
        >
          <Download className="h-3.5 w-3.5" /> Xuất CSV
        </a>
      }
    >
      {state === 'migration' ? (
        <MigrationNotice />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    tab === t.key ? 'bg-[#0B2239] text-white' : 'text-[#5B6B7C] hover:bg-[#EDF1F5]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stage && (
                <button
                  onClick={() => setStage('')}
                  className="rounded-lg bg-[#EEF2F6] px-2.5 py-1.5 text-[12px] font-semibold text-[#45586B]"
                >
                  {STAGE_LABEL[stage as keyof typeof STAGE_LABEL]} ✕
                </button>
              )}
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA9B6]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm tên hoặc số điện thoại"
                  className="w-56 rounded-lg border border-[#DCE4EC] py-2 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                />
              </label>
            </div>
          </div>

          <Section>
            {state === 'loading' ? (
              <div className="px-5 py-10 text-[14px] text-[#5B6B7C]">Đang tải…</div>
            ) : items.length === 0 ? (
              <EmptyState
                title="Chưa có lead nào"
                hint="Yêu cầu khách gửi từ LivLab — báo giá, tư vấn hoặc kiểm tra kỹ thuật — sẽ xuất hiện tại đây."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-[#E8EDF2] text-[12px] uppercase tracking-wide text-[#7A8795]">
                      <th className="px-5 py-2.5 font-semibold">Khách hàng</th>
                      <th className="px-5 py-2.5 font-semibold">Yêu cầu</th>
                      <th className="px-5 py-2.5 font-semibold">Bối cảnh LivLab</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Ngân sách</th>
                      <th className="px-5 py-2.5 font-semibold">Giai đoạn</th>
                      <th className="px-5 py-2.5 font-semibold">Việc kế tiếp</th>
                      <th className="px-5 py-2.5 font-semibold">Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F3F6]">
                    {items.map((lead) => (
                      <tr key={lead.id} className="h-[52px] hover:bg-[#FAFCFD]">
                        <td className="px-5">
                          <Link href={`/showroom/leads/${lead.id}`} className="font-semibold text-[#0B1623] hover:text-[#123C5A]">
                            {lead.customerName}
                          </Link>
                          {lead.phone && <p className="text-[12px] text-[#7A8795]">{lead.phone}</p>}
                        </td>
                        <td className="px-5 text-[13px] text-[#45586B]">
                          {lead.requestType ? TABS.find((t) => t.key === lead.requestType)?.label : '—'}
                        </td>
                        <td className="px-5 text-[13px] text-[#45586B]">{lead.contextSummary ?? '—'}</td>
                        <td className="px-5 text-right">
                          <span className="font-semibold text-[#0B1623]">{money(lead.estimatedValue)}</span>
                          {lead.targetBudget && (
                            <p className="text-[12px] text-[#7A8795]">mục tiêu {money(lead.targetBudget)}</p>
                          )}
                        </td>
                        <td className="px-5"><StatusChip tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</StatusChip></td>
                        <td className="px-5 text-[13px] text-[#45586B]">
                          {lead.nextActionAt ? (
                            <>
                              {lead.nextActionNote ?? 'Việc đã lên lịch'}
                              <p className="text-[12px] text-[#7A8795]">
                                {new Date(lead.nextActionAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </>
                          ) : lead.uncontactedHours !== null ? (
                            <StatusChip tone={lead.uncontactedHours > 24 ? 'negative' : 'attention'}>
                              Chưa liên hệ {lead.uncontactedHours}h
                            </StatusChip>
                          ) : '—'}
                        </td>
                        <td className="px-5 text-[13px] text-[#7A8795]">{relativeTime(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </PageShell>
  );
}

/**
 * useSearchParams opts the subtree into client-side rendering, so Next requires
 * a Suspense boundary around it or the whole route fails to prerender.
 */
export default function ShowroomLeadsPage() {
  return (
    <Suspense fallback={<PageShell title="Leads"><p className="text-[14px] text-[#5B6B7C]">Đang tải…</p></PageShell>}>
      <LeadsWorkspace />
    </Suspense>
  );
}
