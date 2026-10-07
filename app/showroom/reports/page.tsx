'use client';

import { useEffect, useState } from 'react';
import { PageShell, Section, Metric, MigrationNotice, EmptyState, money } from '@/components/showroom/ui/primitives';
import type { ReportViewModel } from '@/lib/showroom/showroomRepository';

/**
 * Reports built only from recorded facts.
 *
 * The previous page showed three charts fed by `showroomDemoData` — invented
 * weekly volumes, budget splits and status mixes. Those are gone. Where a
 * figure cannot be derived, this page says so instead of filling the space.
 */
export default function ShowroomReportsPage() {
  const [data, setData] = useState<ReportViewModel | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/showroom/reports');
      if (res.status === 503) return setState('migration');
      if (!res.ok) return setState('error');
      setData(await res.json());
      setState('ready');
    })();
  }, []);

  if (state === 'migration') return <PageShell title="Báo cáo"><MigrationNotice /></PageShell>;
  if (state === 'loading') return <PageShell title="Báo cáo"><p className="text-[14px] text-[#5B6B7C]">Đang tải…</p></PageShell>;
  if (!data) return <PageShell title="Báo cáo"><Section><EmptyState title="Không tải được báo cáo" /></Section></PageShell>;

  const maxCount = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <PageShell title="Báo cáo" description="Suy ra từ lead và báo giá thật của showroom.">
      <Section title="Phễu bán hàng">
        <div className="space-y-2.5 px-5 py-4">
          {data.funnel.map((step) => (
            <div key={step.label} className="flex items-center gap-4">
              <span className="w-44 shrink-0 text-[14px] text-[#45586B]">{step.label}</span>
              <div className="h-7 flex-1 rounded bg-[#F2F5F8]">
                <div className="h-7 rounded bg-[#123C5A]" style={{ width: `${(step.count / maxCount) * 100}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right text-[14px] font-semibold text-[#0B1623]">
                {step.count}
                {step.rate !== null && <span className="ml-1.5 text-[12px] font-normal text-[#7A8795]">{step.rate}%</span>}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Phản hồi trung vị"
          value={data.medianFirstResponseHours !== null ? `${data.medianFirstResponseHours}h` : 'Chưa đủ dữ liệu'}
        />
        <Metric label="Chưa liên hệ quá 24h" value={data.uncontacted24h} tone="negative" />
        <Metric label="Báo giá đã gửi" value={data.quotesSent} />
        <Metric
          label="Tỉ lệ chốt từ báo giá"
          value={data.quoteWinRate !== null ? `${data.quoteWinRate}%` : 'Chưa đủ dữ liệu'}
        />
      </div>

      <Section title="Giá trị báo giá" className="mt-5">
        <dl className="grid grid-cols-1 gap-4 px-5 py-4 text-[14px] sm:grid-cols-3">
          <div>
            <dt className="text-[12px] text-[#7A8795]">Tổng giá trị đã gửi</dt>
            <dd className="mt-1 text-[20px] font-bold text-[#0B1623]">{money(data.quotedValue)}</dd>
            <p className="text-[12px] text-[#7A8795]">Chưa chốt — không phải doanh thu.</p>
          </div>
          <div>
            <dt className="text-[12px] text-[#7A8795]">Giá trị khách đã duyệt</dt>
            <dd className="mt-1 text-[20px] font-bold text-[#2E7D52]">{money(data.acceptedValue)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#7A8795]">Giá trị báo giá trung bình</dt>
            <dd className="mt-1 text-[20px] font-bold text-[#0B1623]">
              {data.averageQuoteValue !== null ? money(data.averageQuoteValue) : 'Chưa đủ dữ liệu'}
            </dd>
          </div>
        </dl>
      </Section>

      {data.gaps.length > 0 && (
        <Section title="Chưa đủ dữ liệu" className="mt-5">
          <ul className="space-y-1.5 px-5 py-4 text-[13px] leading-relaxed text-[#5B6B7C]">
            {data.gaps.map((gap, i) => <li key={i}>• {gap}</li>)}
          </ul>
        </Section>
      )}
    </PageShell>
  );
}
