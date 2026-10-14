'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
  PageShell, Section, Status, EmptyState, ErrorState, MigrationNotice,
  Table, THead, TH, TBody, TR, TD, TableSkeleton, FilterBar, FilterTabs, FootNote,
  money, relativeTime, shortDate, type Tone,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';
import { isTestRecord } from '@/lib/showroom/testRecords';

/**
 * The quote lifecycle, as a resource index.
 *
 * A quote only becomes a commitment when it is sent, so the table leads with
 * value and status and treats validity as the thing that decides urgency: a
 * sent quote nobody chased is the most expensive row on this page.
 */

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp', SENT: 'Đã gửi', ACCEPTED: 'Khách duyệt', REJECTED: 'Khách từ chối', EXPIRED: 'Hết hạn',
};
const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'muted', SENT: 'info', ACCEPTED: 'positive', REJECTED: 'negative', EXPIRED: 'attention',
};
const STATUS_ORDER = ['', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

interface QuoteRow {
  id: string; code: string; status: string; total: number; createdAt: string; validUntil: string | null;
  customerNameSnapshot: string;
  lead: { id: string; customerName: string } | null;
  createdBy: { name: string | null; email: string } | null;
  _count: { lines: number };
}

type LoadState = 'loading' | 'ready' | 'migration' | 'error';

/** Whole days from `now` until the quote expires. */
function daysLeft(validUntil: string, now: number): number {
  return Math.ceil((new Date(validUntil).getTime() - now) / 86_400_000);
}

/** Days left on a sent quote, or why there is no clock. */
function validity(quote: QuoteRow, now: number): { text: string; tone: Tone; title?: string } {
  if (!quote.validUntil) {
    // An unset expiry is not a missing value to dash out — it is a quote that
    // can be accepted indefinitely, which is a commercial decision worth
    // seeing rather than hiding.
    return { text: 'Chưa đặt hạn', tone: 'muted', title: 'Báo giá chưa có ngày hết hiệu lực.' };
  }
  const days = daysLeft(quote.validUntil, now);
  const title = `Hiệu lực đến ${shortDate(quote.validUntil)}.`;
  if (days < 0) return { text: `Hết hạn ${Math.abs(days)} ngày`, tone: 'negative', title };
  if (days === 0) return { text: 'Hết hạn hôm nay', tone: 'negative', title };
  if (days <= 7) return { text: `Còn ${days} ngày`, tone: 'attention', title };
  return { text: shortDate(quote.validUntil), tone: 'muted', title };
}

export default function ShowroomQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [status, setStatus] = useState('');
  const [state, setState] = useState<LoadState>('loading');
  /**
   * The instant every row is judged against, captured when the data lands.
   *
   * Reading the clock during render would let two rows be measured against
   * two different "now"s on the same screen, and would make the component
   * re-render to a different answer for no reason.
   */
  const [now, setNow] = useState(() => Date.now());
  const [showTestRecords, setShowTestRecords] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/showroom/quotes${status ? `?status=${status}` : ''}`);
        if (cancelled) return;
        if (res.status === 503) return setState('migration');
        if (!res.ok) return setState('error');
        setQuotes((await res.json()).quotes ?? []);
        setNow(Date.now());
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [status]);

  /**
   * Quotes raised against a QA lead are hidden for the same reason the leads
   * are: the partner's quote list is the one place a wrong row looks like a
   * real commitment to a real customer.
   */
  const { visible, hiddenTestCount } = useMemo(() => {
    const real = quotes.filter(
      (q) => !isTestRecord({ customerName: q.lead?.customerName ?? q.customerNameSnapshot })
    );
    return { visible: showTestRecords ? quotes : real, hiddenTestCount: quotes.length - real.length };
  }, [quotes, showTestRecords]);

  const summary = useMemo(() => {
    const sent = visible.filter((q) => q.status === 'SENT');
    const expiringSoon = sent.filter((q) => {
      if (!q.validUntil) return false;
      const days = daysLeft(q.validUntil, now);
      return days >= 0 && days <= 7;
    });
    return {
      draft: visible.filter((q) => q.status === 'DRAFT').length,
      sent: sent.length,
      accepted: visible.filter((q) => q.status === 'ACCEPTED').length,
      expiringSoon: expiringSoon.length,
      // Only sent quotes are outstanding: a draft is not yet a commitment.
      outstanding: sent.reduce((s, q) => s + q.total, 0),
    };
  }, [visible, now]);

  return (
    <PageShell
      width="full"
      title="Báo giá"
      description="Báo giá showroom phát hành cho khách. Chỉ báo giá đã gửi mới tính là cam kết."
    >
      {state === 'migration' ? (
        <MigrationNotice />
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Tile label="Nháp" value={summary.draft} />
            <Tile label="Đã gửi" value={summary.sent} />
            <Tile label="Khách duyệt" value={summary.accepted} tone="positive" />
            <Tile label="Sắp hết hạn" value={summary.expiringSoon} tone={summary.expiringSoon > 0 ? 'negative' : undefined} />
            <Tile label="Giá trị đang chờ" value={money(summary.outstanding)} />
          </div>

          <Section flush>
            <FilterBar
              filters={
                <FilterTabs
                  value={status}
                  options={STATUS_ORDER.map((s) => ({
                    value: s,
                    label: s ? STATUS_LABEL[s] : 'Tất cả',
                  }))}
                  onChange={setStatus}
                />
              }
              resultLabel={state === 'ready' ? `${visible.length} báo giá` : undefined}
            />

            <Table minWidth={980}>
              <THead>
                <TH width="130px">Mã báo giá</TH>
                <TH>Khách hàng</TH>
                <TH align="right">Giá trị</TH>
                <TH align="right" width="90px">Dòng</TH>
                <TH width="150px">Trạng thái</TH>
                <TH width="160px">Hiệu lực</TH>
                <TH width="130px">Cập nhật</TH>
              </THead>
              {state === 'loading' ? (
                <TableSkeleton columns={7} />
              ) : state === 'error' ? (
                <TBody><tr><td colSpan={7}><ErrorState title="Không tải được danh sách báo giá." /></td></tr></TBody>
              ) : visible.length === 0 ? (
                <TBody>
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title={status ? 'Không có báo giá ở trạng thái này' : 'Chưa có báo giá nào'}
                        hint={
                          status
                            ? undefined
                            : 'Báo giá tạo từ một lead sẽ xuất hiện ở đây cùng trạng thái và hiệu lực.'
                        }
                        action={
                          status ? (
                            <button type="button" onClick={() => setStatus('')} className={CX.buttonSecondary}>
                              Xem tất cả
                            </button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                </TBody>
              ) : (
                <TBody>
                  {visible.map((quote) => {
                    const valid = validity(quote, now);
                    return (
                      <TR key={quote.id}>
                        <TD>
                          <Link
                            href={`/showroom/quotes/${quote.id}` as Route}
                            className="whitespace-nowrap font-medium tabular-nums text-[#111A22] hover:text-[#123C5A]"
                          >
                            {quote.code}
                          </Link>
                        </TD>
                        <TD>
                          <span className="text-[#111A22]">
                            {quote.lead?.customerName ?? quote.customerNameSnapshot}
                          </span>
                          {quote.createdBy && (
                            <p className="text-[12px] text-[#8795A3]">
                              {quote.createdBy.name ?? quote.createdBy.email}
                            </p>
                          )}
                        </TD>
                        <TD align="right" className="font-medium text-[#111A22]">{money(quote.total)}</TD>
                        <TD align="right" className="text-[#8795A3]">{quote._count.lines}</TD>
                        <TD>
                          <Status tone={STATUS_TONE[quote.status] ?? 'neutral'}>
                            {STATUS_LABEL[quote.status] ?? quote.status}
                          </Status>
                        </TD>
                        <TD>
                          <span title={valid.title} className="text-[13px] text-[#4F6070]">
                            {valid.tone === 'muted' ? (
                              <span className="text-[#8795A3]">{valid.text}</span>
                            ) : (
                              <Status tone={valid.tone}>{valid.text}</Status>
                            )}
                          </span>
                        </TD>
                        <TD className="text-[#8795A3]">{relativeTime(quote.createdAt)}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              )}
            </Table>
          </Section>

          <FootNote>
            Giá trị đang chờ chỉ tính báo giá ở trạng thái “Đã gửi” — bản nháp chưa phải cam kết với khách.
            {hiddenTestCount > 0 && (
              <>
                {' '}Đã ẩn {hiddenTestCount} báo giá thuộc bản ghi kiểm thử.{' '}
                <button
                  type="button"
                  onClick={() => setShowTestRecords(!showTestRecords)}
                  className="font-medium text-[#123C5A] underline underline-offset-2"
                >
                  {showTestRecords ? 'Ẩn lại' : 'Hiện để kiểm tra'}
                </button>
              </>
            )}
          </FootNote>
        </>
      )}
    </PageShell>
  );
}

function Tile({ label, value, tone }: { label: string; value: string | number; tone?: 'positive' | 'negative' }) {
  return (
    <div className="rounded-md border border-[#E3E9EE] bg-white px-4 py-3">
      <span className={CX.microLabel}>{label}</span>
      <span
        className={`mt-1.5 block text-[22px] font-semibold leading-none tabular-nums ${
          tone === 'positive' ? 'text-[#2E7D52]' : tone === 'negative' && value ? 'text-[#B4322A]' : 'text-[#111A22]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
