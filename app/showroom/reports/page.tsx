'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  PageShell, Section, MigrationNotice, ErrorState, FootNote, money, moneyFull, percent,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';
import type { ReportViewModel } from '@/lib/showroom/showroomRepository';

/**
 * Reports built only from recorded facts.
 *
 * The page this replaces drew three charts from `showroomDemoData` — invented
 * weekly volumes, budget splits and status mixes. Where a figure cannot be
 * derived it now says which fact is missing, because a KPI card reading
 * "Chưa đủ dữ liệu" with no explanation is a dead end.
 *
 * Two metrics on this page look like they contradict each other and do not:
 * the funnel counts LEADS that reached the quoting stage, while "Báo giá thực
 * tế đã gửi" counts Quote documents with a send timestamp. A lead can be moved
 * to QUOTE_SENT by a salesperson without a quote ever being issued — which is
 * itself worth seeing, so both are shown with names that say which is which.
 */

type LoadState = 'loading' | 'ready' | 'migration' | 'error';

export default function ShowroomReportsPage() {
  const [data, setData] = useState<ReportViewModel | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/showroom/reports');
        if (cancelled) return;
        if (res.status === 503) return setState('migration');
        if (!res.ok) return setState('error');
        setData(await res.json());
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state === 'migration') return <PageShell title="Báo cáo"><MigrationNotice /></PageShell>;
  if (state === 'error') {
    return (
      <PageShell title="Báo cáo">
        <Section flush><ErrorState title="Không tải được báo cáo." /></Section>
      </PageShell>
    );
  }
  if (state === 'loading' || !data) {
    return (
      <PageShell title="Báo cáo" description="Suy ra từ lead và báo giá thật của showroom.">
        <div className="h-[260px] animate-pulse rounded-md border border-[#E3E9EE] bg-white" />
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-md border border-[#E3E9EE] bg-white" />
          ))}
        </div>
      </PageShell>
    );
  }

  const maxCount = Math.max(...data.funnel.map((f) => f.count), 1);
  const top = data.funnel[0]?.count ?? 0;

  return (
    <PageShell
      title="Báo cáo"
      description="Suy ra từ lead và báo giá thật của showroom."
      actions={<a href="/api/showroom/reports/export" className={CX.buttonSecondary}><Download className="h-3.5 w-3.5" /> Xuất báo cáo</a>}
    >
      {/* One chart, and it answers a question: where does the pipeline stop? */}
      <Section title="Phễu bán hàng" description="Số lead đã đi qua từng giai đoạn, tính trên tổng lead." flush>
        <div className="px-4 py-4">
          {data.funnel.map((step, i) => {
            const previous = i === 0 ? null : data.funnel[i - 1];
            // Step-to-step conversion is the number a manager acts on: it
            // locates the stage that leaks, which a share-of-total cannot.
            const stepRate =
              previous && previous.count > 0 ? Math.round((step.count / previous.count) * 100) : null;
            return (
              <div key={step.label} className="flex items-center gap-4 py-1.5">
                <span className="w-52 shrink-0 text-[13px] text-[#4F6070]">{step.label}</span>
                <div className="h-6 min-w-0 flex-1 rounded-sm bg-[#F1F5F7]">
                  <div
                    className="h-6 rounded-sm bg-[#123C5A]"
                    style={{ width: `${Math.max((step.count / maxCount) * 100, step.count > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-[14px] font-semibold tabular-nums text-[#111A22]">
                  {step.count}
                </span>
                <span className="w-28 shrink-0 text-right text-[12px] tabular-nums text-[#8795A3]">
                  {i === 0
                    ? `${percent(step.rate)} tổng`
                    : stepRate === null
                      ? '—'
                      : `${stepRate}% từ bước trên`}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Section title="Kỷ luật phản hồi" description="Showroom trả lời khách nhanh đến đâu.">
          <dl className="grid grid-cols-2 gap-4">
            <Figure
              label="Phản hồi trung vị"
              value={data.medianFirstResponseHours !== null ? `${data.medianFirstResponseHours} giờ` : null}
              missing="Chưa lead nào được ghi nhận thời điểm liên hệ đầu tiên."
            />
            <Figure
              label="Chưa liên hệ quá 24 giờ"
              value={String(data.uncontacted24h)}
              tone={data.uncontacted24h > 0 ? 'negative' : 'positive'}
              note={`trên ${top} lead`}
            />
          </dl>
        </Section>

        <Section title="Báo giá" description="Đếm trên chứng từ báo giá, không phải giai đoạn của lead.">
          <dl className="grid grid-cols-2 gap-4">
            <Figure
              label="Báo giá thực tế đã gửi"
              value={String(data.quotesSent)}
              note="có mốc thời gian gửi"
            />
            <Figure
              label="Tỉ lệ khách duyệt"
              value={data.quoteWinRate !== null ? `${data.quoteWinRate}%` : null}
              missing="Chưa có báo giá nào được gửi để tính tỉ lệ duyệt."
            />
          </dl>
        </Section>
      </div>

      <Section title="Giá trị báo giá" className="mt-3">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Figure label="Tổng giá trị đã gửi" value={money(data.quotedValue)} note="Chưa chốt — không phải doanh thu." big />
          <Figure label="Khách đã duyệt" value={money(data.acceptedValue)} tone="positive" big />
          <Figure
            label="Giá trị trung bình mỗi báo giá"
            value={data.averageQuoteValue !== null ? moneyFull(data.averageQuoteValue) : null}
            missing="Chưa có báo giá đã gửi để tính trung bình."
            big
          />
        </dl>
      </Section>

      {data.gaps.length > 0 && (
        <Section title="Vì sao một số chỉ số chưa có" className="mt-3">
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-[#5A6977]">
            {data.gaps.map((gap, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#AFBCC7]" aria-hidden />
                {gap}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <FootNote>
        “Lead tới giai đoạn báo giá” đếm lead đã được chuyển sang giai đoạn đó; “Báo giá thực tế đã gửi” đếm chứng từ
        báo giá có mốc thời gian gửi. Hai con số lệch nhau là bình thường — nghĩa là có lead đã đánh dấu báo giá nhưng
        chưa phát hành chứng từ.
        {data.hiddenTestRecords > 0 && ` Đã loại ${data.hiddenTestRecords} bản ghi kiểm thử khỏi mọi con số trên trang này.`}
      </FootNote>
    </PageShell>
  );
}

/** One figure. `missing` replaces a dead "Chưa đủ dữ liệu" with the reason. */
function Figure({
  label,
  value,
  note,
  missing,
  tone,
  big = false,
}: {
  label: string;
  value: string | null;
  note?: string;
  missing?: string;
  tone?: 'positive' | 'negative';
  big?: boolean;
}) {
  return (
    <div>
      <dt className={CX.microLabel}>{label}</dt>
      {value === null ? (
        <>
          <dd className="mt-1.5 text-[15px] text-[#9AA7B4]">Chưa đủ dữ liệu</dd>
          {missing && <p className="mt-1 text-[12px] leading-relaxed text-[#8795A3]">{missing}</p>}
        </>
      ) : (
        <>
          <dd
            className={`mt-1.5 font-semibold leading-none tabular-nums ${big ? 'text-[22px]' : 'text-[20px]'} ${
              tone === 'positive' ? 'text-[#2E7D52]' : tone === 'negative' ? 'text-[#B4322A]' : 'text-[#111A22]'
            }`}
          >
            {value}
          </dd>
          {note && <p className="mt-1.5 text-[12px] text-[#8795A3]">{note}</p>}
        </>
      )}
    </div>
  );
}
