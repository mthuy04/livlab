'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, PackageSearch, Search } from 'lucide-react';
import { PageShell, EmptyState, ErrorState, MigrationNotice, FilterBar, FilterTabs, FootNote, price } from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';

const AVAILABILITY = [
  { value: 'AVAILABLE', label: 'Có thể cung ứng' }, { value: 'MADE_TO_ORDER', label: 'Cần đặt hàng' },
  { value: 'OUT_OF_STOCK', label: 'Tạm hết' }, { value: 'CONTACT_REQUIRED', label: 'Liên hệ xác nhận' },
  { value: 'UNKNOWN', label: 'Chưa cập nhật' },
];

interface Item {
  productId: string; name: string; brand: string | null; category: string | null; imageUrl: string | null;
  referencePriceMin: number | null; referencePriceMax: number | null; isOffered: boolean | null;
  showroomPrice: number | null; availability: string; updatedAt: string | null; readOnly?: boolean;
}
type Scope = 'all' | 'offered' | 'missing-price';

export default function ShowroomCatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');
  const [readOnly, setReadOnly] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (scope === 'offered') params.set('offered', '1');
    try {
      const response = await fetch(`/api/showroom/catalog?${params}`);
      if (response.status === 503) return setState('migration');
      if (!response.ok) return setState('error');
      const data = await response.json();
      setItems(data.items ?? []);
      setReadOnly(Boolean(data.readOnly));
      setState('ready');
    } catch { setState('error'); }
  }, [query, scope]);

  useEffect(() => { const timer = setTimeout(load, query ? 300 : 0); return () => clearTimeout(timer); }, [load, query]);

  async function update(productId: string, patch: Record<string, unknown>) {
    if (readOnly) return;
    setSaving(productId);
    try {
      const response = await fetch('/api/showroom/catalog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, ...patch }) });
      if (!response.ok) throw new Error('SAVE_FAILED');
      await load();
      setJustSaved(productId);
      setTimeout(() => setJustSaved((value) => value === productId ? null : value), 1600);
    } finally { setSaving(null); }
  }

  const visible = useMemo(() => scope === 'missing-price' ? items.filter((item) => !item.showroomPrice) : items, [items, scope]);
  const summary = useMemo(() => ({ offered: items.filter((item) => item.isOffered).length, missing: items.filter((item) => !item.showroomPrice).length, brands: new Set(items.map((item) => item.brand).filter(Boolean)).size }), [items]);

  return (
    <PageShell width="full" title="Sản phẩm & giá" description="Danh mục thiết bị showroom đang giới thiệu trên LivLab, cùng giá tham khảo và tình trạng cung ứng.">
      {state === 'migration' ? <MigrationNotice /> : <>
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Summary label="Sản phẩm" value={items.length} tone="violet" /><Summary label="Đang giới thiệu" value={summary.offered} tone="green" /><Summary label="Chưa có giá" value={summary.missing} tone="peach" /><Summary label="Thương hiệu" value={summary.brands} tone="amber" />
        </div>

        <div className="overflow-hidden rounded-[17px] border border-[#EAE9E4] bg-white shadow-[0_7px_24px_rgba(46,45,43,.035)]">
          <FilterBar search={<label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9D98]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, mã hoặc thương hiệu" className={`${CX.input} w-72 pl-9`} /></label>} filters={<FilterTabs value={scope} options={[{ value: 'all' as Scope, label: 'Tất cả' }, { value: 'offered' as Scope, label: 'Đang bán' }, { value: 'missing-price' as Scope, label: 'Thiếu giá', count: summary.missing || undefined }]} onChange={setScope} />} resultLabel={state === 'ready' ? `${visible.length} sản phẩm` : undefined} />
        </div>

        {readOnly && <div className="mt-3 rounded-xl border border-[#F0E0BC] bg-[#FFF8E9] px-4 py-3 text-xs leading-5 text-[#795719]">Workspace demo đọc trực tiếp catalogue fixture đã duyệt của storefront Tùng Đăng. Giá và tình trạng ở đây là chỉ đọc; dữ liệu thương mại live không bị trộn vào demo.</div>}

        {state === 'loading' ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0,1,2,3,4,5].map((i) => <div key={i} className="h-[330px] animate-pulse rounded-[15px] bg-white" />)}</div> : state === 'error' ? <div className="mt-4 rounded-2xl border border-[#EAE9E4] bg-white"><ErrorState title="Không tải được danh mục." onRetry={() => void load()} /></div> : visible.length === 0 ? <div className="mt-4 rounded-2xl border border-[#EAE9E4] bg-white"><EmptyState title="Không tìm thấy sản phẩm phù hợp" action={<button className={CX.buttonSecondary} onClick={() => { setQuery(''); setScope('all'); }}>Xoá bộ lọc</button>} /></div> : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => <ProductCard key={item.productId} item={item} readOnly={readOnly || Boolean(item.readOnly)} busy={saving === item.productId} saved={justSaved === item.productId} update={update} />)}
          </div>
        )}
        <FootNote>{readOnly ? 'Danh mục demo tách biệt hoàn toàn khỏi offer và tồn kho của showroom live.' : 'Tình trạng cung ứng do showroom tự cập nhật, không nối với hệ thống tồn kho. “Chưa cập nhật” không có nghĩa là giá bằng 0.'}</FootNote>
      </>}
    </PageShell>
  );
}

function ProductCard({ item, readOnly, busy, saved, update }: { item: Item; readOnly: boolean; busy: boolean; saved: boolean; update: (id: string, patch: Record<string, unknown>) => void }) {
  const showroom = price(item.showroomPrice);
  return <article className="overflow-hidden rounded-[15px] border border-[#E9EAE5] bg-white">
    <div className="relative flex h-[175px] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#F4F2ED,#EBEAE5)]">
      {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="(min-width:1280px) 30vw, (min-width:640px) 48vw, 100vw" className="object-contain p-4 mix-blend-multiply" /> : <PackageSearch className="h-12 w-12 text-[#CDC9BF]" />}
      <span className="absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#75776F]">{item.category || 'Thiết bị'}</span>
    </div>
    <div className="flex min-h-[160px] flex-col p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#B68633]">{item.brand || 'LivLab'}</p>
      <h2 className="mt-2 line-clamp-2 min-h-10 text-[13px] font-bold leading-5">{item.name}</h2>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div><p className="text-[10px] text-[#A1A29C]">Giá showroom</p>{readOnly ? <p className="mt-1 text-[17px] font-extrabold text-[#9B6309]">{showroom.text}</p> : <input key={`${item.productId}-${item.showroomPrice}`} type="number" min={0} defaultValue={item.showroomPrice ?? ''} onBlur={(event) => { const next = event.target.value === '' ? null : Number(event.target.value); if (next !== item.showroomPrice) update(item.productId, { showroomPrice: next }); }} className={`${CX.input} mt-1 w-36 tabular-nums`} />}</div>
        {saved && <Check className="h-4 w-4 text-[#2E7D52]" />}
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-[#F0F0ED] pt-3">
        <select value={item.availability} disabled={readOnly || busy} onChange={(event) => update(item.productId, { availability: event.target.value })} className="h-8 min-w-0 flex-1 rounded-lg border border-[#E6E4DE] bg-white px-2 text-[11px] text-[#66645F] disabled:bg-[#F8F7F4]">{AVAILABILITY.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#858781]"><input type="checkbox" checked={item.isOffered ?? false} disabled={readOnly || busy} onChange={(event) => update(item.productId, { isOffered: event.target.checked })} className="h-4 w-4 accent-[#EF9F00]" /> Đang bán</label>
      </div>
    </div>
  </article>;
}

function Summary({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colors: Record<string, string> = { violet: 'bg-[#F0EDFF] border-[#E9E4FF]', green: 'bg-[#E8F6F1] border-[#DCF2E8]', peach: 'bg-[#FFF0EA] border-[#FCE9E1]', amber: 'bg-[#FFF5DF] border-[#F6EACC]' };
  return <div className={`rounded-[15px] border px-5 py-4 ${colors[tone]}`}><p className="text-xs font-bold text-[#777870]">{label}</p><p className="mt-3 text-2xl font-extrabold">{value}</p></div>;
}
