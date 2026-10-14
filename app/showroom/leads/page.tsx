'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Download, Search, X } from 'lucide-react';
import {
  PageShell, Section, Status, EmptyState, ErrorState, MigrationNotice,
  Table, THead, TH, TBody, TR, TD, TableSkeleton, FilterBar, FilterTabs, FootNote,
  money, relativeTime, uncontactedFor, dueIn, type Tone,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';
import { STAGE_LABEL } from '@/lib/showroom/leadStage';
import type { LeadListItem } from '@/lib/showroom/showroomRepository';

/**
 * The single sales inbox.
 *
 * Previously split across "Yêu cầu báo giá" and "Khách hàng / Leads", which
 * showed overlapping rows and forced a guess about which to open. Rows showed
 * only name, phone, budget and status, discarding the room, products and
 * technical context LivLab had already collected — the whole point of the
 * handoff.
 */

const REQUEST_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'QUOTATION', label: 'Yêu cầu báo giá' },
  { value: 'SHOWROOM_CONSULTATION', label: 'Cần tư vấn' },
  { value: 'TECHNICAL_CHECK', label: 'Kiểm tra kỹ thuật' },
];

const STAGE_TONE: Record<string, Tone> = {
  NEW: 'info', CONTACTED: 'info', QUALIFIED: 'info', QUOTING: 'attention',
  QUOTE_SENT: 'attention', FOLLOW_UP: 'attention', WON: 'positive', LOST: 'muted',
};

const URGENCY_TONE = { calm: 'muted', due: 'attention', overdue: 'negative' } as const;

type LoadState = 'loading' | 'ready' | 'migration' | 'error';

function LeadsWorkspace() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<LeadListItem[]>([]);
  // Seeded from the URL so dashboard links like ?stage=NEW land pre-filtered.
  // Read through useSearchParams rather than window in an effect: the hook
  // returns the same value on the server render and the client.
  const [tab, setTab] = useState(() => searchParams.get('requestType') ?? '');
  const [stage, setStage] = useState(() => searchParams.get('stage') ?? '');
  const [overdueOnly, setOverdueOnly] = useState(() => searchParams.get('overdue') === '1');
  const [query, setQuery] = useState('');
  const [showTestRecords, setShowTestRecords] = useState(false);
  const [state, setState] = useState<LoadState>('loading');

  // Debounced so typing a name does not fire a request per keystroke, and
  // guarded by `cancelled` so a slow result cannot overwrite a newer one.
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

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tab, stage, query]);

  /** What this lead is waiting on — a scheduled action outranks an age. */
  const waitingOn = (lead: LeadListItem) =>
    lead.nextActionAt ? dueIn(lead.nextActionAt) : uncontactedFor(lead.uncontactedHours, lead.createdAt);

  const { visible, hiddenTestCount, summary } = useMemo(() => {
    const real = items.filter((l) => !l.isTestRecord);
    const base = showTestRecords ? items : real;
    const filtered = overdueOnly ? base.filter((l) => waitingOn(l).urgency === 'overdue') : base;

    return {
      visible: filtered,
      hiddenTestCount: items.length - real.length,
      summary: {
        total: real.length,
        fresh: real.filter((l) => l.stage === 'NEW').length,
        overdue: real.filter((l) => waitingOn(l).urgency === 'overdue').length,
        following: real.filter((l) => l.stage === 'QUOTE_SENT' || l.stage === 'FOLLOW_UP').length,
      },
    };
  }, [items, showTestRecords, overdueOnly]);

  const hasFilter = Boolean(tab || stage || query.trim() || overdueOnly);

  return (
    <PageShell
      width="full"
      title="Leads"
      description="Mọi yêu cầu từ LivLab, kèm bối cảnh khách đã tạo sẵn."
      actions={
        /* An API route that streams a CSV download, not a page navigation,
           so next/link would be wrong here. */
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a href="/api/showroom/leads/export" className={CX.buttonSecondary}>
          <Download className="h-3.5 w-3.5" /> Xuất CSV
        </a>
      }
    >
      {state === 'migration' ? (
        <MigrationNotice />
      ) : (
        <>
          {/* Four counts, not five cards: total, and the three states that
              decide what someone does next. */}
          <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile label="Tổng lead" value={summary.total} onClick={() => { setStage(''); setOverdueOnly(false); }} />
            <SummaryTile label="Lead mới" value={summary.fresh} active={stage === 'NEW'} onClick={() => { setStage(stage === 'NEW' ? '' : 'NEW'); setOverdueOnly(false); }} />
            <SummaryTile
              label="Quá hạn liên hệ"
              value={summary.overdue}
              tone={summary.overdue > 0 ? 'negative' : undefined}
              active={overdueOnly}
              onClick={() => { setOverdueOnly(!overdueOnly); setStage(''); }}
            />
            <SummaryTile label="Đang theo dõi" value={summary.following} active={stage === 'QUOTE_SENT'} onClick={() => { setStage(stage === 'QUOTE_SENT' ? '' : 'QUOTE_SENT'); setOverdueOnly(false); }} />
          </div>

          <Section flush>
            <FilterBar
              search={
                <label className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA7B4]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm tên hoặc số điện thoại"
                    aria-label="Tìm lead"
                    className={`${CX.input} w-60 pl-8`}
                  />
                </label>
              }
              filters={
                <>
                  <FilterTabs value={tab} options={REQUEST_TABS} onChange={setTab} />
                  {stage && (
                    <button
                      type="button"
                      onClick={() => setStage('')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-[#EAF1F6] px-2.5 text-[13px] font-medium text-[#123C5A]"
                    >
                      {STAGE_LABEL[stage as keyof typeof STAGE_LABEL] ?? stage}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {overdueOnly && (
                    <button
                      type="button"
                      onClick={() => setOverdueOnly(false)}
                      className="inline-flex h-8 items-center gap-1 rounded bg-[#FBEDEC] px-2.5 text-[13px] font-medium text-[#B4322A]"
                    >
                      Quá hạn liên hệ
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </>
              }
              resultLabel={state === 'ready' ? `${visible.length} lead` : undefined}
            />

            <Table minWidth={1180}>
              <THead>
                <TH>Khách hàng</TH>
                <TH>Yêu cầu</TH>
                <TH>Bối cảnh LivLab</TH>
                <TH align="right">Giá trị</TH>
                <TH>Giai đoạn</TH>
                <TH>Việc tiếp theo</TH>
                <TH>Tạo lúc</TH>
              </THead>
              {state === 'loading' ? (
                <TableSkeleton columns={7} />
              ) : state === 'error' ? (
                <TBody>
                  <tr>
                    <td colSpan={7}>
                      <ErrorState title="Không tải được danh sách lead." />
                    </td>
                  </tr>
                </TBody>
              ) : visible.length === 0 ? (
                <TBody>
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title={hasFilter ? 'Không có lead khớp bộ lọc' : 'Chưa có lead nào'}
                        hint={
                          hasFilter
                            ? undefined
                            : 'Yêu cầu khách gửi từ LivLab — báo giá, tư vấn hoặc kiểm tra kỹ thuật — sẽ xuất hiện tại đây.'
                        }
                        action={
                          hasFilter ? (
                            <button
                              type="button"
                              onClick={() => { setTab(''); setStage(''); setQuery(''); setOverdueOnly(false); }}
                              className={CX.buttonSecondary}
                            >
                              Xoá bộ lọc
                            </button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                </TBody>
              ) : (
                <TBody>
                  {visible.map((lead) => {
                    const waiting = waitingOn(lead);
                    return (
                      <TR key={lead.id} muted={lead.isTestRecord}>
                        <TD>
                          <Link
                            href={`/showroom/leads/${lead.id}` as Route}
                            className="whitespace-nowrap font-medium text-[#111A22] hover:text-[#123C5A]"
                          >
                            {lead.customerName}
                          </Link>
                          {/* Phone sits under the name on purpose: it is the
                              identifier customers are grouped by, so two rows
                              with one name are told apart here. */}
                          {lead.phone && <p className="text-[12px] tabular-nums text-[#8795A3]">{lead.phone}</p>}
                          {lead.isTestRecord && (
                            <span className="mt-0.5 inline-block text-[11px] font-medium text-[#946200]">
                              Bản ghi kiểm thử
                            </span>
                          )}
                        </TD>
                        <TD className="text-[#4F6070]">
                          {lead.requestType
                            ? REQUEST_TABS.find((t) => t.value === lead.requestType)?.label ?? lead.requestType
                            : '—'}
                        </TD>
                        <TD className="max-w-[260px] truncate text-[#4F6070]">{lead.contextSummary ?? '—'}</TD>
                        <TD align="right">
                          <span className="font-medium text-[#111A22]">{money(lead.estimatedValue)}</span>
                          {lead.targetBudget !== null && lead.targetBudget !== undefined && (
                            <p className="text-[12px] text-[#8795A3]">mục tiêu {money(lead.targetBudget)}</p>
                          )}
                        </TD>
                        <TD>
                          <Status tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Status>
                        </TD>
                        <TD>
                          {lead.nextActionAt ? (
                            <>
                              <span className="block max-w-[180px] truncate text-[#4F6070]">
                                {lead.nextActionNote ?? 'Việc đã lên lịch'}
                              </span>
                              <span title={waiting.title}>
                                <span
                                  className={`text-[12px] ${
                                    waiting.urgency === 'overdue' ? 'text-[#B4322A]' : 'text-[#8795A3]'
                                  }`}
                                >
                                  {waiting.text}
                                </span>
                              </span>
                            </>
                          ) : (
                            <span title={waiting.title}>
                              <Status tone={URGENCY_TONE[waiting.urgency]}>{waiting.text}</Status>
                            </span>
                          )}
                        </TD>
                        <TD className="text-[#8795A3]">{relativeTime(lead.createdAt)}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              )}
            </Table>
          </Section>

          {hiddenTestCount > 0 && (
            <FootNote>
              Đã ẩn {hiddenTestCount} bản ghi kiểm thử khỏi danh sách.{' '}
              <button
                type="button"
                onClick={() => setShowTestRecords(!showTestRecords)}
                className="font-medium text-[#123C5A] underline underline-offset-2"
              >
                {showTestRecords ? 'Ẩn lại' : 'Hiện để kiểm tra'}
              </button>
            </FootNote>
          )}
        </>
      )}
    </PageShell>
  );
}

/** A summary count that is also the filter for its own number. */
function SummaryTile({
  label,
  value,
  tone,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'negative';
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border bg-white px-4 py-3 text-left transition-colors ${
        active ? 'border-[#123C5A] ring-1 ring-[#123C5A]/15' : 'border-[#E3E9EE] hover:border-[#CFD9E1]'
      }`}
    >
      <span className={CX.microLabel}>{label}</span>
      <span
        className={`mt-1.5 block text-[24px] font-semibold leading-none tabular-nums ${
          tone === 'negative' && value > 0 ? 'text-[#B4322A]' : 'text-[#111A22]'
        }`}
      >
        {value}
      </span>
    </button>
  );
}

/**
 * useSearchParams opts the subtree into client-side rendering, so Next requires
 * a Suspense boundary around it or the route fails to prerender.
 */
export default function ShowroomLeadsPage() {
  return (
    <Suspense
      fallback={
        <PageShell width="full" title="Leads">
          <Section flush>
            <Table><THead><TH>Khách hàng</TH><TH>Yêu cầu</TH><TH>Bối cảnh</TH><TH>Giai đoạn</TH></THead>
              <TableSkeleton columns={4} />
            </Table>
          </Section>
        </PageShell>
      }
    >
      <LeadsWorkspace />
    </Suspense>
  );
}
