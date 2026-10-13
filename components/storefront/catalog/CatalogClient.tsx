'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import type { Route } from 'next';
import type { CatalogProduct } from '@/lib/storefront/catalogTypes';
import { AVAILABILITY_LABEL, sortCategories, type Availability } from '@/lib/storefront/catalogTypes';
import {
  applyFilters, buildFacets, filtersFromParams, paramsFromFilters, sortProducts,
  activeFilterCount, PAGE_SIZE, SORT_OPTIONS,
  type CatalogFilters,
} from '@/lib/storefront/catalogFilters';
import { toggleCompare, toggleSaved, useTenantIds } from '@/lib/storefront/tenantStorage';
import { TEXT, TEXT_FAINT, DIVIDER, STAGE } from '@/components/storefront/home/editorial';
import CatalogProductCard from './CatalogProductCard';
import { AllIcon, iconFor } from './CategoryIcons';
import { BRAND_LOGOS } from './brandLogos';
import CatalogFilterPanel from './CatalogFilterPanel';
import CompareTray from './CompareTray';
import QuickView from './QuickView';

/**
 * The tenant's catalogue.
 *
 * Filter state lives in the URL, so a filtered view survives a refresh and can
 * be shared; the component mirrors it rather than owning it. Products are
 * fetched once from the tenant-scoped API and filtered in the browser, which
 * is the right trade at this catalogue size — the filter model is a pure
 * function over an array, so moving it behind the API later changes one call.
 */

type LoadState = 'loading' | 'ready' | 'error';

export default function CatalogClient({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  const [compareIds, setCompareIds] = useTenantIds(tenantId, 'compare');
  const [savedIds, setSavedIds] = useTenantIds(tenantId, 'saved');
  const [compareError, setCompareError] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<CatalogProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params]);

  // The search box types faster than the URL should change.
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const searchDraftRef = useRef(filters.search);

  // `loading` is the initial state and the retry button sets it before
  // bumping the token, so the effect never has to set it on the way in.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/storefront/products')
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { products: CatalogProduct[] }) => {
        if (cancelled) return;
        setProducts(data.products ?? []);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => { cancelled = true; };
  }, [reloadToken]);

  const update = useCallback(
    (next: Partial<CatalogFilters>) => {
      const merged = { ...filters, ...next, page: next.page ?? 1 };
      const query = paramsFromFilters(merged).toString();
      router.replace((query ? `/products?${query}` : '/products') as Route, { scroll: false });
    },
    [filters, router]
  );

  useEffect(() => {
    if (searchDraft === filters.search) return;
    searchDraftRef.current = searchDraft;
    const id = setTimeout(() => {
      if (searchDraftRef.current === searchDraft) update({ search: searchDraft });
    }, 300);
    return () => clearTimeout(id);
  }, [searchDraft, filters.search, update]);

  const categoryOf = useCallback(
    (id: string) => products.find((p) => p.id === id)?.category ?? null,
    [products]
  );

  const handleToggleCompare = (product: CatalogProduct) => {
    const result = toggleCompare(tenantId, product.id, product.category, categoryOf);
    setCompareIds(result.ids);
    setCompareError(result.error ?? null);
    if (result.error) setTimeout(() => setCompareError(null), 4000);
  };

  const handleToggleSave = (id: string) => setSavedIds(toggleSaved(tenantId, id));

  const filtered = useMemo(() => applyFilters(products, filters), [products, filters]);
  const sorted = useMemo(() => sortProducts(filtered, filters.sort), [filtered, filters.sort]);
  const facets = useMemo(() => buildFacets(products, filters), [products, filters]);

  const visible = sorted.slice(0, filters.page * PAGE_SIZE);
  const compareProducts = compareIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is CatalogProduct => Boolean(p));

  const categoryRail = useMemo(() => {
    const counts = new Map<string, { count: number; image: string }>();
    for (const p of products) {
      const existing = counts.get(p.category);
      counts.set(p.category, { count: (existing?.count ?? 0) + 1, image: existing?.image ?? p.image });
    }
    return sortCategories([...counts.keys()]).map((name) => ({ name, ...counts.get(name)! }));
  }, [products]);

  const brandRail = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of applyFilters(products, { ...filters, brands: [] })) {
      counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [products, filters]);

  const activeCount = activeFilterCount(filters);

  /* ── Error ─────────────────────────────────────────────────────────────── */
  if (state === 'error') {
    return (
      <div className="home-container py-24 text-center">
        <p style={{ fontSize: 20, fontWeight: 500, color: TEXT }}>Chưa thể tải danh mục sản phẩm.</p>
        <button
          type="button"
          onClick={() => { setState('loading'); setReloadToken((t) => t + 1); }}
          className="mt-6 inline-flex items-center"
          style={{
            height: 42, paddingInline: 20,
            backgroundColor: 'var(--tenant-accent)', color: 'var(--tenant-accent-contrast)',
            fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
          }}
        >
          THỬ LẠI
        </button>
      </div>
    );
  }

  const loading = state === 'loading';

  return (
    <>
      {/* ── Category rail ───────────────────────────────────────────────── */}
      {!loading && categoryRail.length > 1 && (
        <div className="home-container relative" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <RailFade />
          <div className="no-scrollbar -mx-5 flex overflow-x-auto px-5 md:mx-0 md:px-0">
            {[{ name: 'TẤT CẢ', key: null as string | null }, ...categoryRail.map((c) => ({ name: c.name, key: c.name }))].map(
              (entry) => {
                const selected = filters.category === entry.key;
                const Icon = entry.key ? iconFor(entry.key) : AllIcon;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => update({ category: selected ? null : entry.key, subcategories: [] })}
                    aria-pressed={selected}
                    className="relative flex shrink-0 flex-col items-center justify-center gap-2.5 pb-5 pt-4"
                    style={{ width: 112, color: selected ? 'var(--tenant-accent)' : '#343434' }}
                  >
                    <span className="grid place-items-center" style={{ width: 32, height: 32 }}>
                      <Icon style={{ width: 27, height: 27 }} />
                    </span>
                    <span
                      className="text-center"
                      style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.05em', lineHeight: 1.2 }}
                    >
                      {entry.name.toUpperCase()}
                    </span>
                    {/* A short centred rule, not a full-width underline. */}
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2"
                        style={{ width: 46, height: 2, backgroundColor: 'var(--tenant-accent)' }}
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ── Brand rail ──────────────────────────────────────────────────── */}
      {!loading && brandRail.length > 1 && (
        <div className="home-container relative pb-1 pt-6" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <p className="mb-2" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
            THƯƠNG HIỆU
          </p>
          <RailFade />
          <div className="no-scrollbar -mx-5 flex overflow-x-auto px-5 md:mx-0 md:px-0">
            {[{ name: 'TẤT CẢ', count: products.length }, ...brandRail].map((b, index) => {
              const isAll = b.name === 'TẤT CẢ';
              const selected = isAll ? filters.brands.length === 0 : filters.brands.includes(b.name);
              const logo = isAll ? null : BRAND_LOGOS[b.name];
              return (
                <button
                  key={b.name}
                  type="button"
                  aria-pressed={selected}
                  aria-label={isAll ? 'Tất cả thương hiệu' : b.name}
                  onClick={() =>
                    update({
                      brands: isAll
                        ? []
                        : filters.brands.includes(b.name)
                          ? filters.brands.filter((x) => x !== b.name)
                          : [...filters.brands, b.name],
                    })
                  }
                  className="relative flex shrink-0 items-center justify-center"
                  style={{
                    width: 130,
                    height: 62,
                    paddingInline: 18,
                    borderLeft: index > 0 ? '1px solid #ECECEA' : undefined,
                  }}
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt={b.name}
                      className="object-contain"
                      style={{ maxHeight: 28, maxWidth: 100 }}
                    />
                  ) : (
                    // No asset for this brand, so its wordmark stands in — set
                    // at one size so a logo and a name sit at the same weight.
                    <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.04em', color: TEXT }}>
                      {b.name.toUpperCase()}
                    </span>
                  )}
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2"
                      style={{ width: '65%', height: 2, backgroundColor: 'var(--tenant-accent)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Toolbar + results ───────────────────────────────────────────── */}
      <div className="home-container pb-24 pt-7">
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-3 md:flex-nowrap"
          style={{ minHeight: 54, borderBottom: `1px solid ${DIVIDER}` }}
        >
          <p className="shrink-0" style={{ fontSize: 14, color: TEXT }}>
            {loading ? 'Đang tải…' : `${sorted.length} sản phẩm`}
          </p>

          <div className="order-last w-full md:order-none md:mx-auto md:w-auto">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2"
                fill="none"
                stroke={TEXT_FAINT}
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Tìm theo tên, SKU hoặc thương hiệu"
                aria-label="Tìm trong danh mục"
                className="w-full bg-white pl-10 pr-3.5 md:w-[360px]"
                style={{ height: 42, border: '1px solid #D9D9D6', fontSize: 14 }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 xl:hidden"
            style={{ height: 42, fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: TEXT, border: `1px solid ${DIVIDER}`, paddingInline: 14 }}
          >
            LỌC{activeCount > 0 ? ` · ${activeCount}` : ''}
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-6 md:ml-0">
            {compareIds.length > 0 ? (
              <Link
                href={`/compare?ids=${compareIds.join(',')}` as Route}
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-accent)' }}
              >
                SO SÁNH · {compareIds.length}
              </Link>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.09em', color: TEXT_FAINT }}>
                So sánh
              </span>
            )}
            <label>
              <span className="sr-only">Sắp xếp</span>
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as CatalogFilters['sort'] })}
                className="bg-white px-3"
                style={{ height: 42, width: 155, border: '1px solid #D9D9D6', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', color: TEXT }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label.toUpperCase()}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Active filters */}
        {activeCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filters.category && (
              <Chip label={filters.category} onRemove={() => update({ category: null, subcategories: [] })} />
            )}
            {filters.brands.map((b) => (
              <Chip key={b} label={b} onRemove={() => update({ brands: filters.brands.filter((x) => x !== b) })} />
            ))}
            {filters.subcategories.map((t) => (
              <Chip key={t} label={t} onRemove={() => update({ subcategories: filters.subcategories.filter((x) => x !== t) })} />
            ))}
            {filters.colors.map((c) => (
              <Chip key={c} label={c} onRemove={() => update({ colors: filters.colors.filter((x) => x !== c) })} />
            ))}
            {filters.availability.map((a) => (
              <Chip
                key={a}
                label={AVAILABILITY_LABEL[a as Availability] ?? a}
                onRemove={() => update({ availability: filters.availability.filter((x) => x !== a) })}
              />
            ))}
            {(filters.priceMin || filters.priceMax) && (
              <Chip
                label={`${filters.priceMin ? (filters.priceMin / 1e6).toFixed(0) : '0'}–${filters.priceMax ? (filters.priceMax / 1e6).toFixed(0) + ' triệu' : '∞'}`}
                onRemove={() => update({ priceMin: null, priceMax: null })}
              />
            )}
            {filters.roomStudio && <Chip label="Room Studio" onRemove={() => update({ roomStudio: false })} />}
            {filters.search.trim() && (
              <Chip label={`“${filters.search.trim()}”`} onRemove={() => { setSearchDraft(''); update({ search: '' }); }} />
            )}
            <button
              type="button"
              onClick={() => { setSearchDraft(''); router.replace('/products' as Route, { scroll: false }); }}
              className="transition-opacity hover:opacity-60"
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.07em', color: '#777777' }}
            >
              XÓA TẤT CẢ
            </button>
          </div>
        )}

        {compareError && (
          <p role="status" className="mt-4" style={{ fontSize: 13, color: '#A33A3A' }}>{compareError}</p>
        )}

        <div className="mt-8 grid gap-10 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-10">
          <aside className="hidden xl:block">
            <div className="sticky top-[92px]">
              {!loading && <CatalogFilterPanel filters={filters} facets={facets} onChange={update} />}
            </div>
          </aside>

          <div>
            {loading ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-square w-full animate-pulse" style={{ backgroundColor: STAGE }} />
                    <div className="mt-4 h-3 w-16 animate-pulse" style={{ backgroundColor: STAGE }} />
                    <div className="mt-3 h-4 w-full animate-pulse" style={{ backgroundColor: STAGE }} />
                    <div className="mt-2 h-4 w-24 animate-pulse" style={{ backgroundColor: STAGE }} />
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="py-20 text-center">
                <p style={{ fontSize: 20, fontWeight: 500, color: TEXT }}>Không tìm thấy sản phẩm phù hợp</p>
                <p className="mt-3" style={{ fontSize: 15, color: '#666666' }}>
                  Hãy thử bỏ bớt bộ lọc hoặc chọn khoảng giá khác.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchDraft(''); router.replace('/products' as Route, { scroll: false }); }}
                  className="mt-6"
                  style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT, border: `1px solid ${DIVIDER}`, padding: '11px 18px' }}
                >
                  XÓA BỘ LỌC
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 lg:gap-x-8">
                  {visible.map((p, index) => (
                    <CatalogProductCard
                      key={p.id}
                      product={p}
                      eager={index < 3}
                      saved={savedIds.includes(p.id)}
                      comparing={compareIds.includes(p.id)}
                      onToggleSave={handleToggleSave}
                      onToggleCompare={handleToggleCompare}
                      onQuickView={setQuickView}
                    />
                  ))}
                </div>

                {visible.length < sorted.length && (
                  <div className="mt-14 text-center">
                    <button
                      type="button"
                      onClick={() => update({ page: filters.page + 1 })}
                      style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT, border: `1px solid ${DIVIDER}`, padding: '13px 28px' }}
                    >
                      XEM THÊM ({sorted.length - visible.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] bg-white xl:hidden" role="dialog" aria-modal="true" aria-label="Bộ lọc">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}>BỘ LỌC</span>
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Đóng bộ lọc" style={{ fontSize: 20 }}>×</button>
          </div>
          <div className="h-[calc(100%-110px)] overflow-auto px-5">
            <CatalogFilterPanel filters={filters} facets={facets} onChange={update} />
          </div>
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${DIVIDER}` }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full py-3.5"
              style={{ backgroundColor: 'var(--tenant-accent)', color: 'var(--tenant-accent-contrast)', fontSize: 12, fontWeight: 600, letterSpacing: '.08em' }}
            >
              XEM {sorted.length} SẢN PHẨM
            </button>
          </div>
        </div>
      )}

      <QuickView product={quickView} onClose={() => setQuickView(null)} />

      <CompareTray
        products={compareProducts}
        onRemove={(id) => setCompareIds(compareIds.filter((x) => x !== id))}
        onClear={() => setCompareIds([])}
      />
    </>
  );
}

/**
 * The scrollbar under a rail is hidden, so a short fade at the right edge is
 * what tells you there is more to scroll to.
 */
function RailFade() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
      style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, #FFFFFF 85%)' }}
    />
  );
}

/** Functional, removable, and the one place a pill shape is right. */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-2 bg-white px-2.5"
      style={{ height: 28, borderRadius: 2, border: '1px solid #DCDCD9', fontSize: 11, color: TEXT }}
    >
      {label}
      <button type="button" onClick={onRemove} aria-label={`Bỏ lọc ${label}`} style={{ color: '#777777' }}>×</button>
    </span>
  );
}
