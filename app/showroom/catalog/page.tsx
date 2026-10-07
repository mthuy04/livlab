'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import {
  PageShell, Section, StatusChip, EmptyState, MigrationNotice, money, relativeTime, type Tone,
} from '@/components/showroom/ui/primitives';

/**
 * What this showroom sells, and on what terms.
 *
 * Replaces "Sản phẩm quan tâm", which promised customer-interest data that is
 * not recorded anywhere and was in fact a read-only product list. Master
 * identity and specifications stay LivLab's and are not editable here; only
 * the commercial overlay — offered, price, availability — belongs to the
 * showroom.
 */

const AVAILABILITY: { value: string; label: string; tone: Tone }[] = [
  { value: 'AVAILABLE', label: 'Có thể cung ứng', tone: 'positive' },
  { value: 'MADE_TO_ORDER', label: 'Cần đặt hàng', tone: 'info' },
  { value: 'OUT_OF_STOCK', label: 'Tạm hết', tone: 'negative' },
  { value: 'CONTACT_REQUIRED', label: 'Liên hệ xác nhận', tone: 'attention' },
  { value: 'UNKNOWN', label: 'Chưa cập nhật', tone: 'muted' },
];

interface Item {
  productId: string; name: string; brand: string | null; category: string | null;
  referencePriceMin: number | null; isOffered: boolean | null;
  showroomPrice: number | null; availability: string; updatedAt: string | null;
}

export default function ShowroomCatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [offeredOnly, setOfferedOnly] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (offeredOnly) params.set('offered', '1');
    const res = await fetch(`/api/showroom/catalog?${params}`);
    if (res.status === 503) return setState('migration');
    if (!res.ok) return setState('error');
    setItems((await res.json()).items ?? []);
    setState('ready');
  }, [query, offeredOnly]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  async function update(productId: string, patch: Record<string, unknown>) {
    setSaving(productId);
    try {
      await fetch('/api/showroom/catalog', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...patch }),
      });
      await load();
    } finally { setSaving(null); }
  }

  return (
    <PageShell
      title="Danh mục & Giá"
      description="Giá bán và tình trạng cung ứng của showroom. Thông số kỹ thuật do LivLab quản lý."
      actions={
        <label className="flex items-center gap-2 text-[13px] font-semibold text-[#45586B]">
          <input type="checkbox" checked={offeredOnly} onChange={(e) => setOfferedOnly(e.target.checked)} />
          Chỉ sản phẩm đang bán
        </label>
      }
    >
      {state === 'migration' ? (
        <MigrationNotice />
      ) : (
        <>
          <label className="relative mb-4 block w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA9B6]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên hoặc thương hiệu"
              className="w-full rounded-lg border border-[#DCE4EC] py-2 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#C8A96A]" />
          </label>

          <Section>
            {state === 'loading' ? (
              <div className="px-5 py-10 text-[14px] text-[#5B6B7C]">Đang tải…</div>
            ) : items.length === 0 ? (
              <EmptyState title="Chưa có sản phẩm" hint="Sản phẩm của showroom trong danh mục LivLab sẽ hiện ở đây." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-[#E8EDF2] text-[12px] uppercase tracking-wide text-[#7A8795]">
                      <th className="px-5 py-2.5 font-semibold">Sản phẩm</th>
                      <th className="px-5 py-2.5 font-semibold">Thương hiệu</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Giá tham khảo</th>
                      <th className="px-5 py-2.5 font-semibold text-right w-40">Giá showroom</th>
                      <th className="px-5 py-2.5 font-semibold w-44">Tình trạng</th>
                      <th className="px-5 py-2.5 font-semibold w-24">Đang bán</th>
                      <th className="px-5 py-2.5 font-semibold">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F3F6]">
                    {items.map((item) => (
                      <tr key={item.productId} className={`h-[52px] ${saving === item.productId ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-2">
                          <p className="font-semibold text-[#0B1623]">{item.name}</p>
                          {item.category && <p className="text-[12px] text-[#7A8795]">{item.category}</p>}
                        </td>
                        <td className="px-5 text-[13px] text-[#45586B]">{item.brand ?? '—'}</td>
                        <td className="px-5 text-right text-[#7A8795]">{money(item.referencePriceMin)}</td>
                        <td className="px-5 text-right">
                          <input
                            type="number" min={0} defaultValue={item.showroomPrice ?? ''}
                            placeholder="Chưa đặt"
                            onBlur={(e) => {
                              const v = e.target.value === '' ? null : Number(e.target.value);
                              if (v !== item.showroomPrice) update(item.productId, { showroomPrice: v });
                            }}
                            className="w-32 rounded border border-[#DCE4EC] px-2 py-1 text-right text-[14px]"
                          />
                        </td>
                        <td className="px-5">
                          <select
                            value={item.availability}
                            onChange={(e) => update(item.productId, { availability: e.target.value })}
                            className="w-full rounded border border-[#DCE4EC] px-2 py-1 text-[13px]"
                          >
                            {AVAILABILITY.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                          </select>
                        </td>
                        <td className="px-5">
                          <input type="checkbox" checked={item.isOffered ?? false}
                            onChange={(e) => update(item.productId, { isOffered: e.target.checked })} />
                        </td>
                        <td className="px-5 text-[12px] text-[#7A8795]">
                          {item.updatedAt ? relativeTime(item.updatedAt) : <StatusChip tone="muted">Chưa cấu hình</StatusChip>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <p className="mt-3 text-[12px] leading-relaxed text-[#7A8795]">
            Tình trạng cung ứng do showroom tự cập nhật, không kết nối hệ thống tồn kho — LivLab không hiển thị số lượng tồn.
          </p>
        </>
      )}
    </PageShell>
  );
}
