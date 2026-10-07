'use client';

import { useEffect, useState } from 'react';
import { PageShell, Section, EmptyState, MigrationNotice, money, relativeTime, StatusChip } from '@/components/showroom/ui/primitives';

interface Customer {
  key: string; name: string; phone: string | null; email: string | null;
  leadCount: number; openLeads: number; lastActivityAt: string;
  latestQuoteCode: string | null; latestQuoteTotal: number | null; wonValue: number;
}

export default function ShowroomCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/showroom/customers');
      if (res.status === 503) return setState('migration');
      if (!res.ok) return setState('error');
      setCustomers((await res.json()).customers ?? []);
      setState('ready');
    })();
  }, []);

  return (
    <PageShell title="Khách hàng" description="Gom theo số điện thoại từ các lead của showroom.">
      {state === 'migration' ? <MigrationNotice /> : (
        <Section>
          {state === 'loading' ? (
            <div className="px-5 py-10 text-[14px] text-[#5B6B7C]">Đang tải…</div>
          ) : customers.length === 0 ? (
            <EmptyState title="Chưa có khách hàng" hint="Khách sẽ xuất hiện khi showroom nhận lead đầu tiên từ LivLab." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[#E8EDF2] text-[12px] uppercase tracking-wide text-[#7A8795]">
                    <th className="px-5 py-2.5 font-semibold">Khách hàng</th>
                    <th className="px-5 py-2.5 font-semibold">Liên hệ</th>
                    <th className="px-5 py-2.5 font-semibold">Lead</th>
                    <th className="px-5 py-2.5 font-semibold">Báo giá gần nhất</th>
                    <th className="px-5 py-2.5 font-semibold text-right">Đã chốt</th>
                    <th className="px-5 py-2.5 font-semibold">Hoạt động gần nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F3F6]">
                  {customers.map((c) => (
                    <tr key={c.key} className="h-[52px] hover:bg-[#FAFCFD]">
                      <td className="px-5 font-semibold text-[#0B1623]">{c.name}</td>
                      <td className="px-5 text-[13px] text-[#45586B]">{c.phone ?? c.email ?? '—'}</td>
                      <td className="px-5 text-[13px] text-[#45586B]">
                        {c.leadCount}
                        {c.openLeads > 0 && <StatusChip tone="info">{c.openLeads} đang mở</StatusChip>}
                      </td>
                      <td className="px-5 text-[13px] text-[#45586B]">
                        {c.latestQuoteCode ? `${c.latestQuoteCode} · ${money(c.latestQuoteTotal)}` : '—'}
                      </td>
                      {/* Only accepted quotes count here — a sent quote is not revenue. */}
                      <td className="px-5 text-right font-semibold">{c.wonValue > 0 ? money(c.wonValue) : '—'}</td>
                      <td className="px-5 text-[13px] text-[#7A8795]">{relativeTime(c.lastActivityAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}
    </PageShell>
  );
}
