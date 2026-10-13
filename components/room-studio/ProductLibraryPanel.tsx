'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import {
  CAPABILITY_BADGE,
  NO_DIMENSIONS_REASON,
  isPlaceable,
  isSurfaceMaterial,
} from '@/lib/room-studio/productCapability';

interface ProductLibraryPanelProps {
  products: RoomStudioProduct[];
  isLoading: boolean;
  placedProductIds: Set<string>;
  onAddProduct: (product: RoomStudioProduct) => void;
}

/**
 * The SAME catalogue the rest of LivLab shows — Room Studio does not keep a
 * product list of its own. Products stream in through productAdapter, so the
 * day this becomes a Supabase query nothing in this component changes.
 */
const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'lavabo', label: 'Lavabo' },
  { id: 'toilet', label: 'Bồn cầu' },
  { id: 'shower', label: 'Sen tắm' },
  { id: 'faucet', label: 'Vòi' },
  { id: 'mirror', label: 'Gương' },
  { id: 'vanity', label: 'Tủ lavabo' },
  { id: 'accessory', label: 'Phụ kiện' },
];

const CAPABILITY_ORDER: Record<string, number> = {
  VERIFIED_3D: 2,
  EXACT_DIMENSIONS: 1,
  NO_DIMENSIONS: 0,
};

export default function ProductLibraryPanel({
  products,
  isLoading,
  placedProductIds,
  onAddProduct,
}: ProductLibraryPanelProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((p) => activeTab === 'all' || p.normalizedCategory === activeTab)
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.brand ?? '').toLowerCase().includes(needle))
      // Tiles configure surfaces in VẬT LIỆU; they are not placeable objects.
      .filter((p) => !isSurfaceMaterial(p.normalizedCategory))
      // Placeable products first, then by what can be shown of them. A product
      // with no usable dimensions stays visible — the showroom needs to see
      // which rows are missing data — but it sinks to the bottom.
      .sort((a, b) => {
        const byPlaceable = (isPlaceable(b.capability) ? 1 : 0) - (isPlaceable(a.capability) ? 1 : 0);
        if (byPlaceable !== 0) return byPlaceable;
        const byCapability = CAPABILITY_ORDER[b.capability] - CAPABILITY_ORDER[a.capability];
        if (byCapability !== 0) return byCapability;
        return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
      });
  }, [products, activeTab, query]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#D8E2EA] bg-white">
      <div className="shrink-0 border-b border-[#D8E2EA] bg-[#F3F7FA] p-4">
        <h3 className="mb-3 text-sm font-bold text-[#0B1623]">Thư viện sản phẩm LivLab</h3>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA9B6]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc thương hiệu"
            aria-label="Tìm sản phẩm"
            className="w-full rounded-xl border border-[#D8E2EA] bg-white py-2 pl-9 pr-3 text-xs text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
          />
        </div>

        <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                activeTab === tab.id
                  ? 'border-[#123C5A] bg-[#123C5A] text-white'
                  : 'border-[#D8E2EA] bg-white text-[#627386] hover:bg-[#EEF4F7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {isLoading && <p className="py-8 text-center text-xs text-[#627386]">Đang tải sản phẩm…</p>}

        {!isLoading && visible.length === 0 && (
          <p className="py-8 text-center text-xs text-[#627386]">Không có sản phẩm phù hợp.</p>
        )}

        {visible.map((product) => {
          const isPlaced = placedProductIds.has(product.id);
          const placeable = isPlaceable(product.capability);
          const badge = CAPABILITY_BADGE[product.capability];
          return (
            <div
              key={product.id}
              draggable={placeable}
              onDragStart={(e) => {
                if (!placeable) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData('application/livlab-product', product.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className={`group flex gap-3 rounded-2xl border p-2.5 transition-colors ${
                placeable
                  ? 'cursor-grab border-[#D8E2EA] hover:border-[#C8A96A]/70 active:cursor-grabbing'
                  : 'border-[#E8EEF2] bg-[#FAFCFD]'
              }`}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D8E2EA]/60 bg-[#EEF4F7]">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    draggable={false}
                    className="pointer-events-none h-full w-full object-contain p-1"
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden';
                    }}
                  />
                ) : (
                  <span className="px-1 text-center text-[8px] font-bold uppercase text-[#627386]">
                    {product.normalizedCategory}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="mb-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-[#627386]">
                  {product.brand || product.category}
                </span>
                <h4 className="line-clamp-2 text-xs font-bold leading-snug text-[#0B1623]" title={product.name}>
                  {product.name}
                </h4>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <p className="truncate text-[11px] font-bold text-[#C8A96A]">{product.priceRange || 'Liên hệ'}</p>
                  {/* The only 3D-capability claim in Room Studio. `3D VERIFIED`
                      requires a READY registry asset that passed every QA
                      check; a dimension volume gets ĐÚNG KÍCH THƯỚC and never
                      the word 3D. */}
                  {badge && (
                    <span
                      title={badge.title}
                      className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold ${
                        product.capability === 'VERIFIED_3D'
                          ? 'bg-[#123C5A] text-white'
                          : 'bg-[#EEF4F7] text-[#4A6275]'
                      }`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
                {placeable ? (
                  product.dimensionsLabel && (
                    <p className="mt-0.5 truncate text-[11px] text-[#7C8C9A]">{product.dimensionsLabel}</p>
                  )
                ) : (
                  <p className="mt-0.5 truncate text-[11px] text-[#9AA9B6]">{NO_DIMENSIONS_REASON}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onAddProduct(product)}
                disabled={!placeable}
                title={placeable ? 'Đưa vào phòng' : `${NO_DIMENSIONS_REASON} — chưa đặt được vào phòng`}
                aria-label={
                  placeable
                    ? `Đưa ${product.name} vào phòng`
                    : `${product.name}: ${NO_DIMENSIONS_REASON}, chưa đặt được vào phòng`
                }
                className={`flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-xl transition-colors ${
                  !placeable
                    ? 'cursor-not-allowed bg-[#EEF1F4] text-[#B4C0C9]'
                    : isPlaced
                      ? 'bg-[#DCEBF5] text-[#123C5A]'
                      : 'bg-[#0B3A55] text-white hover:bg-[#082B40]'
                }`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
