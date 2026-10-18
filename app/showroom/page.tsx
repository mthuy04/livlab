'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, CheckCircle2, FileText, Inbox, Phone, RefreshCw, WalletCards } from 'lucide-react';
import {
  PageShell, Section, Status, EmptyState, ErrorState, MigrationNotice,
  Table, THead, TH, TBody, TR, TD, TableSkeleton, money, relativeTime, dueIn, uncontactedFor, type Tone,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';
import { STAGE_LABEL } from '@/lib/showroom/leadStage';
import type { DashboardViewModel } from '@/lib/showroom/showroomRepository';

const STAGE_TONE: Record<string, Tone> = {
  NEW: 'info', CONTACTED: 'info', QUALIFIED: 'info', QUOTING: 'attention',
  QUOTE_SENT: 'attention', FOLLOW_UP: 'attention', WON: 'positive', LOST: 'muted',
};
const PERIODS = [{ value: 7, label: '7 ngày' }, { value: 30, label: '30 ngày' }, { value: 90, label: '90 ngày' }, { value: 0, label: 'Tất cả' }];

async function fetchDashboard(days: number): Promise<{ state: 'ready' | 'migration' | 'error'; data: DashboardViewModel | null }> {
  try {
    const response = await fetch(`/api/showroom/dashboard?days=${days}`);
    if (response.status === 503) return { state: 'migration', data: null };
    if (!response.ok) return { state: 'error', data: null };
    return { state: 'ready', data: await response.json() };
  } catch { return { state: 'error', data: null }; }
}

export default function ShowroomDashboard() {
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [period, setPeriod] = useState(30);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const result = await fetchDashboard(period);
    setState(result.state);
    if (result.data) setData(result.data);
  }

  useEffect(() => {
    let cancelled = false;
    fetchDashboard(period).then((result) => {
      if (cancelled) return;
      setState(result.state);
      if (result.data) setData(result.data);
    });
    return () => { cancelled = true; };
  }, [period]);

  const stageBreakdown = useMemo(() => data?.pipeline.filter((stage) => stage.count > 0) ?? [], [data]);
  if (state === 'migration') return <PageShell title="Tổng quan"><MigrationNotice /></PageShell>;
  if (state === 'error') return <PageShell title="Tổng quan"><Section flush><ErrorState title="Không tải được dữ liệu tổng quan." onRetry={() => void load()} /></Section></PageShell>;

  return (
    <PageShell
      title="Tổng quan kinh doanh"
      description="Theo dõi hoạt động và những việc cần xử lý."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-[10px] bg-[#F0F0EB] p-1">
            {PERIODS.map((option) => <button key={option.value} type="button" onClick={() => { setState('loading'); setPeriod(option.value); }} className={`rounded-[7px] px-3 py-1.5 text-[11px] font-bold ${period === option.value ? 'bg-white text-[#2E2D2B] shadow-sm' : 'text-[#8A8E87]'}`}>{option.label}</button>)}
          </div>
          <button type="button" onClick={() => { setRefreshing(true); void load().finally(() => setRefreshing(false)); }} className={CX.buttonSecondary} aria-label="Làm mới"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /></button>
        </div>
      }
    >
      {state === 'loading' || !data ? <DashboardSkeleton /> : (
        <>
          <section className="relative mb-6 overflow-hidden rounded-[18px] border border-[#F5E5C6] bg-[linear-gradient(116deg,#FFF6E4_0%,#FFF9EC_57%,#F8EFE2_100%)] px-6 py-5 sm:px-8">
            <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#A47937]"><span className="h-2 w-2 rounded-full bg-[#EFA724] ring-4 ring-[#FBEAC8]" /> Ưu tiên hôm nay</p>
                <h2 className="mt-3 text-xl font-bold tracking-[-0.03em]">{data.actionQueue.length > 0 ? `${data.actionQueue.length} yêu cầu đang chờ xử lý` : 'Các yêu cầu đang được xử lý đúng hạn'}</h2>
                <p className="mt-1 text-xs leading-6 text-[#968D7B]">Lead mới và việc đã tới hạn được đưa lên trước để đội ngũ không bỏ sót khách.</p>
              </div>
              <Link href="/showroom/leads" className={`${CX.buttonPrimary} relative z-10 justify-center`}>Mở danh sách xử lý <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <span className="absolute -right-16 -top-24 h-52 w-52 rounded-full border-[32px] border-[#F9E1AD]/45" />
          </section>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard tone="violet" icon={<Inbox />} label="Yêu cầu đã nhận" value={data.totalRequests} note={period ? `${period} ngày gần nhất` : 'Toàn bộ thời gian'} />
            <MetricCard tone="green" icon={<Phone />} label="Khách chưa liên hệ" value={data.uncontacted} note={data.uncontactedOverdue ? `${data.uncontactedOverdue} khách quá 24 giờ` : 'Không có khách quá hạn'} />
            <MetricCard tone="peach" icon={<FileText />} label="Báo giá đã gửi" value={data.quotesSent} note="Tính từ chứng từ đã phát hành" />
            <MetricCard tone="amber" icon={<WalletCards />} label="Giá trị được duyệt" value={money(data.acceptedValue)} note="Không đồng nghĩa doanh thu" />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.56fr_1fr]">
            <Section title="Nhịp độ kinh doanh" description={period ? `Yêu cầu và báo giá đã gửi trong ${period} ngày.` : 'Yêu cầu và báo giá đã gửi trong toàn bộ thời gian.'}>
              <TrendChart values={data.trend} />
            </Section>
            <Section title="Phân bổ pipeline" description="Trạng thái hiện tại của yêu cầu trong kỳ.">
              {stageBreakdown.length === 0 ? <EmptyState title="Chưa có dữ liệu trong kỳ" /> : <PipelineBreakdown data={stageBreakdown} total={data.totalRequests} />}
            </Section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_.85fr]">
            <Section title="Yêu cầu gần đây" description="Những yêu cầu cần hành động sớm." flush action={<Link href="/showroom/leads" className="text-xs font-bold text-[#9B6309] hover:underline">Xem tất cả</Link>}>
              {data.actionQueue.length === 0 ? <EmptyState title="Không có yêu cầu đang chờ" hint="Yêu cầu mới sẽ xuất hiện tại đây." /> : (
                <Table minWidth={760}><THead><TH>Mã / khách hàng</TH><TH>Bối cảnh</TH><TH align="right">Giá trị</TH><TH>Trạng thái</TH><TH>Đang chờ</TH></THead><TBody>
                  {data.actionQueue.slice(0, 7).map((lead) => {
                    const waiting = lead.nextActionAt ? dueIn(lead.nextActionAt) : uncontactedFor(lead.uncontactedHours, lead.createdAt);
                    return <TR key={lead.id}><TD><Link href={`/showroom/leads/${lead.id}` as Route} className="font-bold hover:text-[#9B6309]">{lead.customerName}</Link><p className="mt-0.5 text-[10px] font-bold text-[#B97F20]">{lead.requestCode ?? 'Yêu cầu cũ'}</p></TD><TD className="max-w-[220px] truncate text-[#6F706B]">{lead.contextSummary ?? '—'}</TD><TD align="right" className="font-bold">{money(lead.estimatedValue)}</TD><TD><Status tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Status></TD><TD className={waiting.urgency === 'overdue' ? 'text-[#B4322A]' : 'text-[#92948D]'}>{waiting.text}</TD></TR>;
                  })}
                </TBody></Table>
              )}
            </Section>

            <Section title="Hoạt động mới" description="Dòng thời gian chăm sóc gần nhất.">
              {data.recentActivities.length === 0 ? <EmptyState title="Chưa có hoạt động" /> : <div className="divide-y divide-[#F0F0ED]">
                {data.recentActivities.map((activity) => <div key={activity.id} className="flex gap-3 py-3 first:pt-0 last:pb-0"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-[#F3F0E9] text-[#B08C52]"><CheckCircle2 className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-xs font-bold">{activity.customerName}</p><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#969891]">{activity.body || activity.type}</p><p className="mt-1 text-[10px] text-[#B0B1AC]">{relativeTime(activity.createdAt)}</p></div></div>)}
              </div>}
            </Section>
          </div>
        </>
      )}
    </PageShell>
  );
}

function MetricCard({ tone, icon, label, value, note }: { tone: string; icon: React.ReactNode; label: string; value: string | number; note: string }) {
  const tones: Record<string, string> = { violet: 'bg-[#F0EDFF] border-[#E9E4FF]', green: 'bg-[#E8F6F1] border-[#DCF2E8]', peach: 'bg-[#FFF0EA] border-[#FCE9E1]', amber: 'bg-[#FFF5DF] border-[#F6EACC]' };
  return <article className={`relative min-h-[155px] overflow-hidden rounded-[16px] border p-5 ${tones[tone]}`}><div className="flex items-center justify-between"><p className="text-xs font-bold text-[#6A6C68]">{label}</p><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/65 text-[#9B6B22] [&>svg]:h-4 [&>svg]:w-4">{icon}</span></div><p className="mt-6 text-[30px] font-extrabold leading-none tracking-[-0.045em]">{value}</p><p className="mt-3 text-[10.5px] text-[#858781]">{note}</p><span className="absolute -bottom-16 -right-5 h-28 w-28 rounded-full bg-white/40" /></article>;
}

function TrendChart({ values }: { values: DashboardViewModel['trend'] }) {
  const max = Math.max(...values.flatMap((value) => [value.requests, value.quotesSent]), 1);
  const points = (key: 'requests' | 'quotesSent') => values.map((value, index) => `${index * (600 / Math.max(values.length - 1, 1))},${180 - value[key] / max * 140}`).join(' ');
  return <div className="pt-2"><div className="mb-4 flex gap-5 text-[11px] text-[#7E807A]"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#E9A52C]" /> Yêu cầu mới</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#62B49D]" /> Báo giá đã gửi</span></div><svg viewBox="0 0 600 215" className="h-auto max-h-[230px] w-full" role="img" aria-label="Biểu đồ nhịp độ kinh doanh theo thời gian">{[40,80,120,160].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#EEEDE8" strokeWidth="1" />)}<polyline fill="none" stroke="#E9A52C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points('requests')} /><polyline fill="none" stroke="#62B49D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points('quotesSent')} />{values.map((value, index) => <text key={value.label} x={index * (600 / Math.max(values.length - 1, 1))} y="207" textAnchor={index === 0 ? 'start' : index === values.length - 1 ? 'end' : 'middle'} fontSize="10" fill="#AAA9A5">{value.label}</text>)}</svg></div>;
}

function PipelineBreakdown({ data, total }: { data: DashboardViewModel['pipeline']; total: number }) {
  const colors = ['#EFB45C', '#B8A3E4', '#79C7B6', '#93B7EC', '#F0A09A', '#D8B56A'];
  return <div className="space-y-3 pt-2">{data.map((stage, index) => <div key={stage.stage} className="grid grid-cols-[115px_1fr_30px] items-center gap-3 text-[11px]"><span className="truncate text-[#797D78]">{STAGE_LABEL[stage.stage]}</span><span className="h-2.5 overflow-hidden rounded-full bg-[#F2F3F0]"><i className="block h-full rounded-full" style={{ width: `${Math.max(total ? stage.count / total * 100 : 0, stage.count ? 4 : 0)}%`, background: colors[index % colors.length] }} /></span><b>{stage.count}</b></div>)}</div>;
}

function DashboardSkeleton() {
  return <><div className="mb-6 h-32 animate-pulse rounded-[18px] bg-[#FFF3DC]" /><div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0,1,2,3].map((i) => <div key={i} className="h-[155px] animate-pulse rounded-[16px] bg-white" />)}</div><Section flush><Table><THead><TH>Yêu cầu</TH><TH>Khách hàng</TH><TH>Trạng thái</TH></THead><TableSkeleton columns={3} /></Table></Section></>;
}
