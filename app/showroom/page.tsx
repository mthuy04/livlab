'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import {
  PageShell, Section, Metric, StatusChip, EmptyState, MigrationNotice, money, type Tone,
} from '@/components/showroom/ui/primitives';
import { STAGE_LABEL } from '@/lib/showroom/leadStage';
import type { DashboardViewModel } from '@/lib/showroom/showroomRepository';

const REQUEST_LABEL: Record<string, string> = {
  QUOTATION: 'Yêu cầu báo giá',
  SHOWROOM_CONSULTATION: 'Cần tư vấn',
  TECHNICAL_CHECK: 'Kiểm tra kỹ thuật',
};

const STAGE_TONE: Record<string, Tone> = {
  NEW: 'info', CONTACTED: 'info', QUALIFIED: 'info', QUOTING: 'attention',
  QUOTE_SENT: 'attention', FOLLOW_UP: 'attention', WON: 'positive', LOST: 'negative',
};

/** How late this row is, or how long nobody has touched it. */
function dueLabel(item: DashboardViewModel['actionQueue'][number]): { text: string; tone: Tone } {
  if (item.nextActionAt) {
    const diff = new Date(item.nextActionAt).getTime() - Date.now();
    const hours = Math.round(Math.abs(diff) / 3_600_000);
    if (diff < 0) return { text: `Quá hạn ${hours}h`, tone: 'negative' };
    return { text: hours < 1 ? 'Đến hạn' : `Còn ${hours}h`, tone: 'attention' };
  }
  if (item.uncontactedHours !== null) {
    return {
      text: `Chưa liên hệ ${item.uncontactedHours}h`,
      tone: item.uncontactedHours > 24 ? 'negative' : 'attention',
    };
  }
  return { text: '—', tone: 'muted' };
}

export default function ShowroomDashboard() {
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/showroom/dashboard');
        if (res.status === 503) return setState('migration');
        if (!res.ok) return setState('error');
        setData(await res.json());
        setState('ready');
      } catch {
        setState('error');
      }
    })();
  }, []);

  if (state === 'loading') {
    return <PageShell title="Tổng quan"><p className="text-[14px] text-[#5B6B7C]">Đang tải…</p></PageShell>;
  }
  if (state === 'migration') {
    return <PageShell title="Tổng quan"><MigrationNotice /></PageShell>;
  }
  if (state === 'error' || !data) {
    return (
      <PageShell title="Tổng quan">
        <Section><EmptyState title="Không tải được dữ liệu" hint="Vui lòng thử lại." /></Section>
      </PageShell>
    );
  }

  return (
    <PageShell title="Hôm nay" description="Những việc showroom cần xử lý trước.">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Lead mới" value={data.newLeads} href="/showroom/leads?stage=NEW" />
        <Metric
          label="Chưa liên hệ"
          value={data.uncontacted}
          hint={data.uncontactedOverdue > 0 ? `${data.uncontactedOverdue} quá 24h` : undefined}
          tone="negative"
          href="/showroom/leads"
        />
        <Metric label="Báo giá cần theo dõi" value={data.quoteFollowUps} href="/showroom/leads?stage=QUOTE_SENT" />
        <Metric
          label="Cần xác minh kỹ thuật"
          value={data.technicalChecks}
          href="/showroom/leads?requestType=TECHNICAL_CHECK"
        />
        {/* Open opportunity value, deliberately not called doanh thu: none of
            it is closed, and labelling it revenue would overstate the business. */}
        <Metric label="Giá trị pipeline" value={money(data.pipelineValue)} hint="Chưa chốt" tone="muted" />
      </div>

      <Section
        title="Cần xử lý hôm nay"
        className="mt-6"
        action={
          <Link href="/showroom/leads" className="text-[13px] font-semibold text-[#123C5A] hover:underline">
            Xem tất cả lead
          </Link>
        }
      >
        {data.actionQueue.length === 0 ? (
          <EmptyState
            title="Không có việc nào đến hạn"
            hint="Lead mới từ LivLab và các việc đã lên lịch sẽ xuất hiện ở đây."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-[#E8EDF2] text-[12px] uppercase tracking-wide text-[#7A8795]">
                  <th className="px-5 py-2.5 font-semibold">Khách hàng</th>
                  <th className="px-5 py-2.5 font-semibold">Yêu cầu</th>
                  <th className="px-5 py-2.5 font-semibold">Bối cảnh</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Giá trị</th>
                  <th className="px-5 py-2.5 font-semibold">Giai đoạn</th>
                  <th className="px-5 py-2.5 font-semibold">Việc kế tiếp</th>
                  <th className="px-5 py-2.5 font-semibold">Hạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3F6]">
                {data.actionQueue.map((item) => {
                  const due = dueLabel(item);
                  return (
                    <tr key={item.id} className="h-[52px] hover:bg-[#FAFCFD]">
                      <td className="px-5">
                        <Link href={`/showroom/leads/${item.id}`} className="font-semibold text-[#0B1623] hover:text-[#123C5A]">
                          {item.customerName}
                        </Link>
                        {item.phone && <p className="text-[12px] text-[#7A8795]">{item.phone}</p>}
                      </td>
                      <td className="px-5 text-[13px] text-[#45586B]">
                        {item.requestType ? REQUEST_LABEL[item.requestType] : '—'}
                      </td>
                      <td className="px-5 text-[13px] text-[#45586B]">{item.contextSummary ?? '—'}</td>
                      <td className="px-5 text-right font-semibold text-[#0B1623]">{money(item.estimatedValue)}</td>
                      <td className="px-5">
                        <StatusChip tone={STAGE_TONE[item.stage]}>{STAGE_LABEL[item.stage]}</StatusChip>
                      </td>
                      <td className="px-5 text-[13px] text-[#45586B]">{item.nextActionNote ?? 'Gọi xác nhận'}</td>
                      <td className="px-5"><StatusChip tone={due.tone}>{due.text}</StatusChip></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Pipeline" className="mt-6">
        <div className="grid grid-cols-2 gap-px bg-[#E8EDF2] sm:grid-cols-4 lg:grid-cols-8">
          {data.pipeline.map((stage) => (
            <Link
              key={stage.stage}
              href={`/showroom/leads?stage=${stage.stage}`}
              className="bg-white px-4 py-3.5 transition-colors hover:bg-[#FAFCFD]"
            >
              <p className="text-[12px] font-medium text-[#7A8795]">{STAGE_LABEL[stage.stage]}</p>
              <p className="mt-1 text-[22px] font-bold leading-none text-[#0B1623]">{stage.count}</p>
              {stage.value > 0 && <p className="mt-1 text-[12px] text-[#7A8795]">{money(stage.value)}</p>}
            </Link>
          ))}
        </div>
      </Section>

      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-[#7A8795]">
        <Clock className="h-3.5 w-3.5" />
        Số liệu suy ra trực tiếp từ lead của showroom. Không dùng dữ liệu demo.
        <Link href="/showroom/reports" className="ml-1 inline-flex items-center gap-1 font-semibold text-[#123C5A] hover:underline">
          Xem báo cáo <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </PageShell>
  );
}
