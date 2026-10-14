'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import {
  PageShell, Section, EmptyState, ErrorState, MigrationNotice,
  Table, THead, TH, TBody, TR, TD, TableSkeleton, FilterBar, FilterTabs, FootNote,
  price, relativeTime, type Tone,
} from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';

/**
 * What this showroom sells, and on what terms.
 *
 * Replaces "Sản phẩm quan tâm", which promised customer-interest data that is
 * not recorded anywhere and was really a read-only product list.
 *
 * The page is built around one distinction: LivLab owns product identity and
 * specification, the showroom owns price and availability. Everything editable
 * here is in the right-hand group of columns; nothing on the left can be
 * changed from this screen, which is why the header says so out loud.
 */

const AVAILABILITY: { value: string; label: string; tone: Tone }[] = [
  { value: 'AVAILABLE', label: 'Có thể cung ứng', tone: 'positive' },
  { value: 'MADE_TO_ORDER', label: 'Cần đặt hàng', tone: 'info' },
  { value: 'OUT_OF_STOCK', label: 'Tạm hết', tone: 'negative' },
  { value: 'CONTACT_REQUIRED', label: 'Liên hệ xác nhận', tone: 'attention' },
  { value: 'UNKNOWN', label: 'Chưa cập nhật', tone: 'muted' },
];
const AVAILABILITY_BY_VALUE = Object.fromEntries(AVAILABILITY.map((a) => [a.value, a]));

const AVAILABILITY_DOT: Record<Tone, string> = {
  positive: 'bg-[#2E7D52]', info: 'bg-[#2B7CB8]', negative: 'bg-[#C7453B]',
  attention: 'bg-[#C98A12]', muted: 'bg-[#C3CDD6]', neutral: 'bg-[#8095A8]',
};

interface Item {
  productId: string; name: string; brand: string | null; category: string | null;
  referencePriceMin: number | null; isOffered: boolean | null;
  showroomPrice: number | null; availability: string; updatedAt: string | null;
}

type LoadState = 'loading' | 'ready' | 'migration' | 'error';
type Scope = 'all' | 'offered' | 'missing-price';

export default function ShowroomCatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (scope === 'offered') params.set('offered', '1');
    try {
      const res = await fetch(`/api/showroom/catalog?${params}`);
      if (res.status === 503) return setState('migration');
      if (!res.ok) return setState('error');
      setItems((await res.json()).items ?? []);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [query, scope]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  async function update(productId: string, patch: Record<string, unknown>) {
    setSaving(productId);
    setJustSaved(null);
    try {
      await fetch('/api/showroom/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...patch }),
      });
      await load();
      setJustSaved(productId);
      setTimeout(() => setJustSaved((id) => (id === productId ? null : id)), 1800);
    } finally {
      setSaving(null);
      setEditing(null);
    }
  }

  const visible = useMemo(
    () => (scope === 'missing-price' ? items.filter((i) => !i.showroomPrice) : items),
    [items, scope]
  );

  const missingPriceCount = useMemo(() => items.filter((i) => !i.showroomPrice).length, [items]);

  return (
    <PageShell
      width="full"
      title="Danh mục & Giá"
      description="Giá bán và tình trạng cung ứng do showroom quản lý. Tên, mã và thông số kỹ thuật do LivLab quản lý và không sửa được ở đây."
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
                    placeholder="Tìm tên hoặc thương hiệu"
                    aria-label="Tìm sản phẩm"
                    className={`${CX.input} w-64 pl-8`}
                  />
                </label>
              }
              filters={
                <FilterTabs
                  value={scope}
                  options={[
                    { value: 'all' as Scope, label: 'Tất cả' },
                    { value: 'offered' as Scope, label: 'Đang bán' },
                    { value: 'missing-price' as Scope, label: 'Thiếu giá', count: missingPriceCount || undefined },
                  ]}
                  onChange={setScope}
                />
              }
              resultLabel={state === 'ready' ? `${visible.length} sản phẩm` : undefined}
            />

            <Table minWidth={1040}>
              <THead>
                <TH>Sản phẩm</TH>
                <TH width="130px">Thương hiệu</TH>
                <TH align="right" width="130px">Giá tham khảo</TH>
                <TH align="right" width="150px">Giá showroom</TH>
                <TH width="180px">Tình trạng</TH>
                <TH align="center" width="90px">Đang bán</TH>
                <TH width="120px">Cập nhật</TH>
              </THead>
              {state === 'loading' ? (
                <TableSkeleton columns={7} />
              ) : state === 'error' ? (
                <TBody><tr><td colSpan={7}><ErrorState title="Không tải được danh mục." onRetry={() => void load()} /></td></tr></TBody>
              ) : visible.length === 0 ? (
                <TBody>
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title={query || scope !== 'all' ? 'Không tìm thấy sản phẩm phù hợp bộ lọc' : 'Chưa có sản phẩm'}
                        hint={
                          query || scope !== 'all'
                            ? undefined
                            : 'Sản phẩm của showroom trong danh mục LivLab sẽ hiện ở đây.'
                        }
                        action={
                          query || scope !== 'all' ? (
                            <button type="button" onClick={() => { setQuery(''); setScope('all'); }} className={CX.buttonSecondary}>
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
                  {visible.map((item) => {
                    const reference = price(item.referencePriceMin);
                    const showroom = price(item.showroomPrice);
                    const availability = AVAILABILITY_BY_VALUE[item.availability] ?? AVAILABILITY_BY_VALUE.UNKNOWN;
                    const isSaving = saving === item.productId;

                    return (
                      <TR key={item.productId}>
                        <TD>
                          <span className="block max-w-[320px] truncate font-medium text-[#111A22]">{item.name}</span>
                          {item.category && <span className="text-[12px] text-[#8795A3]">{item.category}</span>}
                        </TD>
                        <TD className="text-[#4F6070]">{item.brand ?? '—'}</TD>

                        {/* Reference price is LivLab's figure. A stored zero means
                            nobody entered one — printing "0đ" told a salesperson
                            the showroom sells a mirror for nothing. */}
                        <TD align="right">
                          <span className={reference.isSet ? 'text-[#4F6070]' : 'text-[#9AA7B4]'}>
                            {reference.text}
                          </span>
                        </TD>

                        <TD align="right">
                          {editing === item.productId ? (
                            <input
                              type="number"
                              min={0}
                              autoFocus
                              defaultValue={item.showroomPrice ?? ''}
                              placeholder="Chưa đặt"
                              aria-label={`Giá showroom cho ${item.name}`}
                              onBlur={(e) => {
                                const next = e.target.value === '' ? null : Number(e.target.value);
                                if (next !== item.showroomPrice) update(item.productId, { showroomPrice: next });
                                else setEditing(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                                if (e.key === 'Escape') setEditing(null);
                              }}
                              className={`${CX.input} w-28 text-right tabular-nums`}
                            />
                          ) : (
                            /* Value by default, field on click: 57 always-visible
                               number inputs made the table read as a form. */
                            <button
                              type="button"
                              onClick={() => setEditing(item.productId)}
                              className={`inline-flex h-7 items-center gap-1.5 rounded px-2 tabular-nums transition-colors hover:bg-[#F1F5F7] ${
                                showroom.isSet ? 'font-medium text-[#111A22]' : 'text-[#9AA7B4]'
                              }`}
                            >
                              {isSaving ? 'Đang lưu…' : showroom.text}
                              {justSaved === item.productId && <Check className="h-3.5 w-3.5 text-[#2E7D52]" />}
                            </button>
                          )}
                        </TD>

                        <TD>
                          <label className="sr-only" htmlFor={`avail-${item.productId}`}>
                            Tình trạng cung ứng cho {item.name}
                          </label>
                          <div className="flex items-center gap-2">
                            {/* A bare dot, not a chip: a lozenge on every one of
                                57 rows turns the column into stripes. */}
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${AVAILABILITY_DOT[availability.tone]}`}
                              aria-hidden
                            />
                            <select
                              id={`avail-${item.productId}`}
                              value={item.availability}
                              disabled={isSaving}
                              onChange={(e) => update(item.productId, { availability: e.target.value })}
                              className="h-7 w-full rounded border border-transparent bg-transparent px-1 text-[13px] text-[#4F6070] transition-colors hover:border-[#E3E9EE] hover:bg-white focus:border-[#123C5A] focus:outline-none"
                            >
                              {AVAILABILITY.map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                              ))}
                            </select>
                          </div>
                        </TD>

                        <TD align="center">
                          <input
                            type="checkbox"
                            checked={item.isOffered ?? false}
                            disabled={isSaving}
                            aria-label={`Showroom đang bán ${item.name}`}
                            onChange={(e) => update(item.productId, { isOffered: e.target.checked })}
                            className="h-4 w-4 accent-[#123C5A]"
                          />
                        </TD>

                        <TD className="whitespace-nowrap text-[#8795A3]">
                          {item.updatedAt ? (
                            relativeTime(item.updatedAt)
                          ) : (
                            <span title="Showroom chưa đặt giá hay tình trạng cho sản phẩm này.">—</span>
                          )}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              )}
            </Table>
          </Section>

          <FootNote>
            Tình trạng cung ứng do showroom tự cập nhật, không nối với hệ thống tồn kho — LivLab không hiển thị số lượng
            tồn. “Chưa cập nhật” ở cột giá nghĩa là chưa ai nhập, không phải giá bằng 0.
          </FootNote>
        </>
      )}
    </PageShell>
  );
}
