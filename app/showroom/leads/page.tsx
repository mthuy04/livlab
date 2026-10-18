'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Search, X } from 'lucide-react';
import {
  PageShell, Section, Status, EmptyState, ErrorState, MigrationNotice,
  Table, THead, TH, TBody, TR, TD, TableSkeleton, FilterBar, FilterTabs, FootNote,
  money, relativeTime, shortDate, uncontactedFor, dueIn, type Tone,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';
import { STAGE_LABEL } from '@/lib/showroom/leadStage';
import type { LeadListItem } from '@/lib/showroom/showroomRepository';
import LeadDrawer from '@/components/showroom/LeadDrawer';

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
  { value: 'RETAIL_RFQ', label: 'Báo giá khách lẻ' },
  { value: 'PROJECT_RFQ', label: 'Báo giá công trình' },
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
  const [uncontactedOnly, setUncontactedOnly] = useState(() => searchParams.get('uncontacted') === '1');
  const [from, setFrom] = useState(() => searchParams.get('from') ?? '');
  const [to, setTo] = useState(() => searchParams.get('to') ?? '');
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [showTestRecords, setShowTestRecords] = useState(false);
  const [state, setState] = useState<LoadState>('loading');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounced so typing a name does not fire a request per keystroke, and
  // guarded by `cancelled` so a slow result cannot overwrite a newer one.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (tab) params.set('requestType', tab);
      if (stage) params.set('stage', stage);
      if (query.trim()) params.set('q', query.trim());
      if (overdueOnly) params.set('overdue', '1');
      if (uncontactedOnly) params.set('uncontacted', '1');
      if (from) params.set('from', from);
      if (to) params.set('to', to);
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
  }, [tab, stage, query, overdueOnly, uncontactedOnly, from, to, refreshKey]);

  /** What this lead is waiting on — a scheduled action outranks an age. */
  const waitingOn = (lead: LeadListItem) =>
    lead.nextActionAt ? dueIn(lead.nextActionAt) : uncontactedFor(lead.uncontactedHours, lead.createdAt);

  const { visible, hiddenTestCount, summary } = useMemo(() => {
    const real = items.filter((l) => !l.isTestRecord);
    const base = showTestRecords ? items : real;
    return {
      visible: base,
      hiddenTestCount: items.length - real.length,
      summary: {
        total: real.length,
        fresh: real.filter((l) => l.stage === 'NEW').length,
        overdue: real.filter((l) => waitingOn(l).urgency === 'overdue').length,
        following: real.filter((l) => l.stage === 'QUOTE_SENT' || l.stage === 'FOLLOW_UP').length,
      },
    };
  }, [items, showTestRecords]);

  const hasFilter = Boolean(tab || stage || query.trim() || overdueOnly || uncontactedOnly || from || to);

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
                    placeholder="Tên, điện thoại hoặc mã yêu cầu"
                    aria-label="Tìm lead"
                    className={`${CX.input} w-60 pl-8`}
                  />
                </label>
              }
              filters={
                <>
                  <FilterTabs value={tab} options={REQUEST_TABS} onChange={setTab} />
                  <label className="flex items-center gap-1.5 text-[11px] text-[#777A75]">Từ <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={`${CX.input} w-[128px]`} /></label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#777A75]">Đến <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={`${CX.input} w-[128px]`} /></label>
                  <button type="button" onClick={() => setUncontactedOnly((value) => !value)} aria-pressed={uncontactedOnly} className={`h-8 rounded-lg border px-2.5 text-[11px] font-bold ${uncontactedOnly ? 'border-[#E7B454] bg-[#FFF1D6] text-[#8D530B]' : 'border-[#E5E4DF] bg-white text-[#777A75]'}`}>Chưa liên hệ</button>
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
              resultLabel={state === 'ready' ? `${visible.length} yêu cầu` : undefined}
            />

            <Table minWidth={1480}>
              <THead>
                <TH>Mã yêu cầu</TH>
                <TH>Khách hàng</TH>
                <TH>Loại yêu cầu</TH>
                <TH>Không gian / sản phẩm</TH>
                <TH>Ngân sách / giá trị</TH>
                <TH>Giai đoạn / phụ trách</TH>
                <TH>Theo dõi tiếp</TH>
                <TH>Ngày gửi</TH>
              </THead>
              {state === 'loading' ? (
                <TableSkeleton columns={8} />
              ) : state === 'error' ? (
                <TBody>
                  <tr>
                    <td colSpan={8}>
                      <ErrorState title="Không tải được danh sách lead." />
                    </td>
                  </tr>
                </TBody>
              ) : visible.length === 0 ? (
                <TBody>
                  <tr>
                    <td colSpan={8}>
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
                              onClick={() => { setTab(''); setStage(''); setQuery(''); setOverdueOnly(false); setUncontactedOnly(false); setFrom(''); setTo(''); }}
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
                        <TD><button type="button" onClick={() => setSelectedLeadId(lead.id)} className="whitespace-nowrap text-[11px] font-extrabold text-[#B97F20] hover:underline">{lead.requestCode ?? 'Yêu cầu cũ'}</button></TD>
                        <TD>
                          <button
                            type="button"
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="whitespace-nowrap font-medium text-[#111A22] hover:text-[#123C5A]"
                          >
                            {lead.customerName}
                          </button>
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
                        <TD className="max-w-[260px] text-[#4F6070]"><span className="block truncate">{lead.contextSummary ?? '—'}</span><span className="mt-1 block text-[10px] text-[#999B95]">{lead.productCount} sản phẩm</span></TD>
                        <TD>
                          <span className="block text-[11px] text-[#777A75]">{lead.budgetRange || (lead.targetBudget ? `Tới ${money(lead.targetBudget)}` : 'Chưa nêu ngân sách')}</span>
                          <span className="font-medium text-[#111A22]">{money(lead.estimatedValue)}</span>
                        </TD>
                        <TD>
                          <Status tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Status>
                          <p className="mt-1 text-[10px] text-[#999B95]">{lead.assigneeName || 'Chưa phân công'}</p>
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
                        <TD className="text-[#8795A3]"><span className="block">{shortDate(lead.createdAt)}</span><span className="text-[10px]">{relativeTime(lead.createdAt)}</span></TD>
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
          {selectedLeadId && <LeadDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onChanged={() => setRefreshKey((value) => value + 1)} />}
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
