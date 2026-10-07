'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PageShell, Section, StatusChip, EmptyState, MigrationNotice, money, relativeTime, type Tone,
} from '@/components/showroom/ui/primitives';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp', SENT: 'Đã gửi', ACCEPTED: 'Khách duyệt', REJECTED: 'Khách từ chối', EXPIRED: 'Hết hạn',
};
const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'muted', SENT: 'info', ACCEPTED: 'positive', REJECTED: 'negative', EXPIRED: 'muted',
};

interface QuoteRow {
  id: string; code: string; status: string; total: number; createdAt: string; validUntil: string | null;
  customerNameSnapshot: string;
  lead: { id: string; customerName: string } | null;
  createdBy: { name: string | null; email: string } | null;
  _count: { lines: number };
}

export default function ShowroomQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [status, setStatus] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');

  useEffect(() => {
    (async () => {
      setState('loading');
      const res = await fetch(`/api/showroom/quotes${status ? `?status=${status}` : ''}`);
      if (res.status === 503) return setState('migration');
      if (!res.ok) return setState('error');
      setQuotes((await res.json()).quotes ?? []);
      setState('ready');
    })();
  }, [status]);

  return (
    <PageShell title="Báo giá" description="Báo giá showroom phát hành cho khách.">
      {state === 'migration' ? (
        <MigrationNotice />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1">
            {['', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  status === s ? 'bg-[#0B2239] text-white' : 'text-[#5B6B7C] hover:bg-[#EDF1F5]'
                }`}
              >
                {s ? STATUS_LABEL[s] : 'Tất cả'}
              </button>
            ))}
          </div>

          <Section>
            {state === 'loading' ? (
              <div className="px-5 py-10 text-[14px] text-[#5B6B7C]">Đang tải…</div>
            ) : quotes.length === 0 ? (
              <EmptyState
                title="Chưa có báo giá"
                hint="Mở một lead và bấm “Tạo báo giá” — sản phẩm khách đã chọn sẽ được điền sẵn."
                action={
                  <Link href="/showroom/leads" className="inline-flex rounded-lg bg-[#0B2239] px-4 py-2 text-[13px] font-semibold text-white">
                    Tới danh sách lead
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-[#E8EDF2] text-[12px] uppercase tracking-wide text-[#7A8795]">
                      <th className="px-5 py-2.5 font-semibold">Mã</th>
                      <th className="px-5 py-2.5 font-semibold">Khách hàng</th>
                      <th className="px-5 py-2.5 font-semibold">Dòng</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Tổng</th>
                      <th className="px-5 py-2.5 font-semibold">Trạng thái</th>
                      <th className="px-5 py-2.5 font-semibold">Hiệu lực</th>
                      <th className="px-5 py-2.5 font-semibold">Tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F3F6]">
                    {quotes.map((q) => (
                      <tr key={q.id} className="h-[52px] hover:bg-[#FAFCFD]">
                        <td className="px-5">
                          <Link href={`/showroom/quotes/${q.id}`} className="font-semibold text-[#123C5A] hover:underline">{q.code}</Link>
                        </td>
                        <td className="px-5">
                          {/* Snapshot, so the quote still names its recipient
                              even if the lead was deleted afterwards. */}
                          <span className="font-semibold text-[#0B1623]">{q.customerNameSnapshot}</span>
                          {q.lead && (
                            <Link href={`/showroom/leads/${q.lead.id}`} className="block text-[12px] text-[#7A8795] hover:text-[#123C5A]">
                              Xem lead
                            </Link>
                          )}
                        </td>
                        <td className="px-5 text-[13px] text-[#45586B]">{q._count.lines}</td>
                        <td className="px-5 text-right font-semibold text-[#0B1623]">{money(q.total)}</td>
                        <td className="px-5"><StatusChip tone={STATUS_TONE[q.status]}>{STATUS_LABEL[q.status]}</StatusChip></td>
                        <td className="px-5 text-[13px] text-[#7A8795]">
                          {q.validUntil ? new Date(q.validUntil).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-5 text-[13px] text-[#7A8795]">{relativeTime(q.createdAt)}</td>
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
