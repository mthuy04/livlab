'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PageShell, Section, Status, EmptyState, ErrorState, MigrationNotice,
  Table, THead, TH, TBody, TR, TD, TableSkeleton, FilterBar, FootNote,
  money, relativeTime,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';
import { Search } from 'lucide-react';
import { isTestRecord } from '@/lib/showroom/testRecords';

/**
 * Who this showroom is talking to, and where each relationship stands.
 *
 * Grouped by phone number, falling back to email — never by display name.
 * Two people called Nguyễn Minh Thuý with different numbers are two customers,
 * and the table shows the number under the name so the difference is visible
 * rather than something the reader has to take on trust.
 */

interface Customer {
  key: string; name: string; phone: string | null; email: string | null;
  leadCount: number; openLeads: number; lastActivityAt: string;
  latestQuoteCode: string | null; latestQuoteTotal: number | null; wonValue: number;
}

type LoadState = 'loading' | 'ready' | 'migration' | 'error';

export default function ShowroomCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/showroom/customers');
        if (cancelled) return;
        if (res.status === 503) return setState('migration');
        if (!res.ok) return setState('error');
        setCustomers((await res.json()).customers ?? []);
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { visible, hiddenTestCount, duplicateNames } = useMemo(() => {
    const real = customers.filter((c) => !isTestRecord({ customerName: c.name, phone: c.phone, email: c.email }));
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? real.filter(
          (c) =>
            c.name.toLowerCase().includes(needle) ||
            (c.phone ?? '').includes(needle) ||
            (c.email ?? '').toLowerCase().includes(needle)
        )
      : real;

    // Names held by more than one record. Not duplicates to merge — distinct
    // customers who happen to share a name, which is worth marking so nobody
    // "cleans them up".
    const nameCount = new Map<string, number>();
    for (const c of real) nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1);

    return {
      visible: filtered,
      hiddenTestCount: customers.length - real.length,
      duplicateNames: new Set([...nameCount.entries()].filter(([, n]) => n > 1).map(([name]) => name)),
    };
  }, [customers, query]);

  return (
    <PageShell
      width="full"
      title="Khách hàng"
      description="Gom theo số điện thoại từ các lead của showroom. Cùng tên nhưng khác số là hai khách khác nhau."
    >
      {state === 'migration' ? (
        <MigrationNotice />
      ) : (
        <>
          <Section flush>
            <FilterBar
              search={
                <label className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA7B4]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm tên, số điện thoại hoặc email"
                    aria-label="Tìm khách hàng"
                    className={`${CX.input} w-72 pl-8`}
                  />
                </label>
              }
              resultLabel={state === 'ready' ? `${visible.length} khách hàng` : undefined}
            />

            <Table minWidth={940}>
              <THead>
                <TH>Khách hàng</TH>
                <TH width="170px">Liên hệ</TH>
                <TH align="right" width="110px">Lead</TH>
                <TH width="200px">Báo giá gần nhất</TH>
                <TH align="right" width="140px">Đã chốt</TH>
                <TH width="150px">Hoạt động gần nhất</TH>
              </THead>
              {state === 'loading' ? (
                <TableSkeleton columns={6} />
              ) : state === 'error' ? (
                <TBody><tr><td colSpan={6}><ErrorState title="Không tải được danh sách khách hàng." /></td></tr></TBody>
              ) : visible.length === 0 ? (
                <TBody>
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title={query ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng'}
                        hint={query ? undefined : 'Khách sẽ xuất hiện khi showroom nhận lead đầu tiên từ LivLab.'}
                        action={
                          query ? (
                            <button type="button" onClick={() => setQuery('')} className={CX.buttonSecondary}>
                              Xoá tìm kiếm
                            </button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                </TBody>
              ) : (
                <TBody>
                  {visible.map((c) => (
                    <TR key={c.key}>
                      <TD>
                        <span className="font-medium text-[#111A22]">{c.name}</span>
                        {duplicateNames.has(c.name) && (
                          <span
                            title="Có khách khác trùng tên nhưng khác số điện thoại. Đây là hai khách riêng biệt."
                            className="ml-2 text-[11px] font-medium text-[#946200]"
                          >
                            trùng tên
                          </span>
                        )}
                      </TD>
                      {/* The identifier the grouping is actually keyed on. */}
                      <TD>
                        <span className="block tabular-nums text-[#4F6070]">{c.phone ?? '—'}</span>
                        {c.email && <span className="block truncate text-[12px] text-[#8795A3]">{c.email}</span>}
                      </TD>
                      <TD align="right">
                        <span className="text-[#111A22]">{c.leadCount}</span>
                        {c.openLeads > 0 && (
                          <span className="ml-2 inline-block">
                            <Status tone="info">{c.openLeads} mở</Status>
                          </span>
                        )}
                      </TD>
                      <TD className="text-[#4F6070]">
                        {c.latestQuoteCode ? (
                          <>
                            <span className="tabular-nums">{c.latestQuoteCode}</span>
                            <span className="ml-1.5 text-[#8795A3]">{money(c.latestQuoteTotal)}</span>
                          </>
                        ) : (
                          <span className="text-[#9AA7B4]">Chưa có báo giá</span>
                        )}
                      </TD>
                      {/* Only accepted quotes count — a sent quote is not revenue. */}
                      <TD align="right" className={c.wonValue > 0 ? 'font-medium text-[#2E7D52]' : 'text-[#9AA7B4]'}>
                        {c.wonValue > 0 ? money(c.wonValue) : '—'}
                      </TD>
                      <TD className="text-[#8795A3]">{relativeTime(c.lastActivityAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              )}
            </Table>
          </Section>

          <FootNote>
            “Đã chốt” chỉ tính báo giá khách đã duyệt.
            {hiddenTestCount > 0 && ` Đã ẩn ${hiddenTestCount} bản ghi kiểm thử.`}
          </FootNote>
        </>
      )}
    </PageShell>
  );
}
