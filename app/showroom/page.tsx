'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, RefreshCw } from 'lucide-react';
import {
  PageShell, Section, Metric, Status, EmptyState, ErrorState, MigrationNotice,
  Table, THead, TH, TBody, TR, TD, TableSkeleton, FootNote,
  money, dueIn, uncontactedFor, type Tone,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';
import { STAGE_LABEL } from '@/lib/showroom/leadStage';
import type { DashboardViewModel } from '@/lib/showroom/showroomRepository';

const REQUEST_LABEL: Record<string, string> = {
  QUOTATION: 'Yêu cầu báo giá',
  SHOWROOM_CONSULTATION: 'Cần tư vấn',
  TECHNICAL_CHECK: 'Kiểm tra kỹ thuật',
};

const STAGE_TONE: Record<string, Tone> = {
  NEW: 'info', CONTACTED: 'info', QUALIFIED: 'info', QUOTING: 'attention',
  QUOTE_SENT: 'attention', FOLLOW_UP: 'attention', WON: 'positive', LOST: 'muted',
};

const URGENCY_TONE = { calm: 'muted', due: 'attention', overdue: 'negative' } as const;

/**
 * What this row is waiting on.
 *
 * A scheduled action wins over an age: once someone has planned a call, when
 * they planned it for is the only deadline that matters. Both render in words
 * — the workspace used to print "Chưa liên hệ 2989h", which is a true number
 * nobody converts to four months in their head, and which is so large it stops
 * reading as urgent at all.
 */
function waitingOn(item: DashboardViewModel['actionQueue'][number]) {
  return item.nextActionAt ? dueIn(item.nextActionAt) : uncontactedFor(item.uncontactedHours, item.createdAt);
}

type LoadState = 'loading' | 'ready' | 'migration' | 'error';

/** One place that knows how the dashboard endpoint reports its three outcomes. */
async function fetchDashboard(): Promise<{ state: LoadState; data: DashboardViewModel | null }> {
  try {
    const res = await fetch('/api/showroom/dashboard');
    if (res.status === 503) return { state: 'migration', data: null };
    if (!res.ok) return { state: 'error', data: null };
    return { state: 'ready', data: (await res.json()) as DashboardViewModel };
  } catch {
    return { state: 'error', data: null };
  }
}

export default function ShowroomDashboard() {
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchDashboard();
    setState(result.state);
    if (result.data) setData(result.data);
  }, []);

  // The fetch is the effect's whole purpose, and every setState inside `load`
  // happens after an await. Written as an inline async call so the hook lint
  // can see that nothing is set during the effect's synchronous pass.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchDashboard();
      if (cancelled) return;
      setState(result.state);
      if (result.data) setData(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });

  if (state === 'migration') return <PageShell title="Tổng quan"><MigrationNotice /></PageShell>;
  if (state === 'error') {
    return (
      <PageShell title="Tổng quan">
        <Section flush>
          <ErrorState title="Không tải được dữ liệu tổng quan." onRetry={() => void load()} />
        </Section>
      </PageShell>
    );
  }
  if (state === 'loading' || !data) {
    return (
      <PageShell title="Tổng quan" context={<span className="capitalize">{today}</span>}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_2fr]">
          <div className="h-[104px] animate-pulse rounded-md border border-[#E3E9EE] bg-white" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-md border border-[#E3E9EE] bg-white" />
            ))}
          </div>
        </div>
        <Section className="mt-4" flush title="Cần xử lý hôm nay">
          <Table><THead><TH>Khách hàng</TH><TH>Yêu cầu</TH><TH>Việc tiếp theo</TH><TH>Chờ</TH></THead>
            <TableSkeleton columns={4} />
          </Table>
        </Section>
      </PageShell>
    );
  }

  const queue = data.actionQueue;
  const overdue = queue.filter((i) => waitingOn(i).urgency === 'overdue').length;
  const activePipeline = data.pipeline.filter((s) => s.stage !== 'WON' && s.stage !== 'LOST');
  const won = data.pipeline.find((s) => s.stage === 'WON');
  const lost = data.pipeline.find((s) => s.stage === 'LOST');

  return (
    <PageShell
      title="Tổng quan"
      context={<span className="capitalize">{today}</span>}
      description="Những việc showroom cần xử lý trước."
      actions={
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void load().finally(() => setRefreshing(false));
          }}
          className={CX.buttonSecondary}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      }
    >
      {/* Pipeline value leads; the four counters are operational and compact.
          Five identical cards gave the same weight to a number worth tens of
          millions and a count of four. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_2.4fr]">
        <div className="rounded-md border border-[#E3E9EE] bg-white px-5 py-4">
          <p className={CX.microLabel}>Giá trị pipeline</p>
          <p className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[#111A22]">
            {money(data.pipelineValue)}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[#7E8D9B]">
            Tổng giá trị lead đang mở. Chưa chốt — không phải doanh thu.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Lead mới" value={data.newLeads} href="/showroom/leads?stage=NEW" />
          <Metric
            label="Chưa liên hệ"
            value={data.uncontacted}
            hint={data.uncontactedOverdue > 0 ? `${data.uncontactedOverdue} quá 24 giờ` : 'Trong hạn'}
            href="/showroom/leads?overdue=1"
          />
          <Metric label="Báo giá theo dõi" value={data.quoteFollowUps} href="/showroom/leads?stage=QUOTE_SENT" />
          <Metric
            label="Kiểm tra kỹ thuật"
            value={data.technicalChecks}
            href="/showroom/leads?requestType=TECHNICAL_CHECK"
          />
        </div>
      </div>

      {/* The core of the page: who to contact, why, and how late it already is. */}
      <Section
        className="mt-4"
        flush
        title="Cần xử lý hôm nay"
        description={
          queue.length === 0
            ? undefined
            : overdue > 0
              ? `${queue.length} việc · ${overdue} đã quá hạn`
              : `${queue.length} việc`
        }
        action={
          <Link href="/showroom/leads" className="text-[13px] font-medium text-[#123C5A] hover:underline">
            Xem tất cả lead
          </Link>
        }
      >
        {queue.length === 0 ? (
          <EmptyState
            title="Không có lead nào cần xử lý hôm nay"
            hint="Lead mới từ LivLab và các việc đã lên lịch sẽ xuất hiện ở đây."
          />
        ) : (
          <Table minWidth={1120}>
            <THead>
              <TH>Khách hàng</TH>
              <TH>Yêu cầu</TH>
              <TH>Bối cảnh</TH>
              <TH align="right">Giá trị</TH>
              <TH>Giai đoạn</TH>
              <TH>Việc tiếp theo</TH>
              <TH>Đang chờ</TH>
            </THead>
            <TBody>
              {queue.map((item) => {
                const waiting = waitingOn(item);
                return (
                  <TR key={item.id}>
                    <TD>
                      <Link
                        href={`/showroom/leads/${item.id}` as Route}
                        className="whitespace-nowrap font-medium text-[#111A22] hover:text-[#123C5A]"
                      >
                        {item.customerName}
                      </Link>
                      {item.phone && <p className="text-[12px] tabular-nums text-[#8795A3]">{item.phone}</p>}
                    </TD>
                    <TD className="text-[#4F6070]">
                      {item.requestType ? REQUEST_LABEL[item.requestType] ?? item.requestType : '—'}
                    </TD>
                    <TD className="max-w-[220px] truncate text-[#4F6070]">{item.contextSummary ?? '—'}</TD>
                    <TD align="right" className="font-medium text-[#111A22]">{money(item.estimatedValue)}</TD>
                    <TD><Status tone={STAGE_TONE[item.stage]}>{STAGE_LABEL[item.stage]}</Status></TD>
                    <TD className="max-w-[200px] truncate text-[#4F6070]">
                      {item.nextActionNote ?? 'Gọi xác nhận nhu cầu'}
                    </TD>
                    <TD>
                      <span title={waiting.title}>
                        <Status tone={URGENCY_TONE[waiting.urgency]}>{waiting.text}</Status>
                      </span>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Section>

      {/* Active funnel and closed outcomes are separated: won and lost are not
          stages work still moves through, and mixing them flattens the shape
          of the pipeline. */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[3fr_1fr]">
        <Section title="Pipeline đang mở" flush>
          <div className="grid grid-cols-2 gap-px bg-[#EFF3F6] sm:grid-cols-3 lg:grid-cols-6">
            {activePipeline.map((stage) => (
              <Link
                key={stage.stage}
                href={`/showroom/leads?stage=${stage.stage}` as Route}
                className="bg-white px-3.5 py-3 transition-colors hover:bg-[#FAFCFD]"
              >
                <p className="truncate text-[12px] text-[#7E8D9B]">{STAGE_LABEL[stage.stage]}</p>
                <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#111A22]">
                  {stage.count}
                </p>
                {stage.value > 0 && (
                  <p className="mt-1 text-[12px] tabular-nums text-[#8795A3]">{money(stage.value)}</p>
                )}
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Đã kết thúc" flush>
          <div className="grid grid-cols-2 gap-px bg-[#EFF3F6]">
            {[won, lost].map((stage, i) =>
              stage ? (
                <Link
                  key={stage.stage}
                  href={`/showroom/leads?stage=${stage.stage}` as Route}
                  className="bg-white px-3.5 py-3 transition-colors hover:bg-[#FAFCFD]"
                >
                  <p className="truncate text-[12px] text-[#7E8D9B]">{STAGE_LABEL[stage.stage]}</p>
                  <p
                    className={`mt-1 text-[20px] font-semibold leading-none tabular-nums ${
                      i === 0 ? 'text-[#2E7D52]' : 'text-[#8795A3]'
                    }`}
                  >
                    {stage.count}
                  </p>
                  {stage.value > 0 && (
                    <p className="mt-1 text-[12px] tabular-nums text-[#8795A3]">{money(stage.value)}</p>
                  )}
                </Link>
              ) : null
            )}
          </div>
        </Section>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <FootNote>
          Số liệu tính trực tiếp từ lead của showroom.
          {data.hiddenTestRecords > 0 && (
            <>
              {' '}
              Đã loại {data.hiddenTestRecords} bản ghi kiểm thử khỏi mọi con số trên trang này.
            </>
          )}
        </FootNote>
        <Link
          href="/showroom/reports"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#123C5A] hover:underline"
        >
          Xem báo cáo <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </PageShell>
  );
}
