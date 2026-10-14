'use client';

import { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { StageImage, ProductImagePlaceholder } from '@/components/storefront/catalog/ProductImage';
import { opticalScale } from '@/lib/storefront/catalogTypes';
import { formatProductPrice } from '@/lib/room-studio/budgetCalculator';
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
  /** Opens the combo recommendations. Replaces the floating Expert card. */
  onSuggestCombo: () => void;
  /**
   * A category the workspace wants shown — from the empty-room prompt. `nonce`
   * makes a repeat request distinct, so tapping "Bồn cầu" again re-applies the
   * filter after the customer has changed it by hand.
   */
  categoryRequest?: { id: string; nonce: number } | null;
}

/**
 * The SAME catalogue the rest of LivLab shows — Room Studio keeps no product
 * list of its own. What it does keep is a narrower view of it: wall tile
 * configures a surface in VẬT LIỆU and is not an object to place, and a product
 * whose dimensions the catalogue does not state cannot be placed at all.
 */
const CATEGORY_LABEL: Record<string, string> = {
  toilet: 'Bồn cầu',
  lavabo: 'Lavabo',
  faucet: 'Vòi',
  shower: 'Sen tắm',
  mirror: 'Gương',
  vanity: 'Tủ chậu',
  lighting: 'Đèn',
  accessory: 'Phụ kiện',
};

/** Display order when a category is present. */
const CATEGORY_ORDER = ['toilet', 'lavabo', 'faucet', 'shower', 'mirror', 'vanity', 'lighting', 'accessory'];

const CAPABILITY_RANK: Record<string, number> = {
  VERIFIED_3D: 2,
  EXACT_DIMENSIONS: 1,
  NO_DIMENSIONS: 0,
};

/** §38: the panel is 320px wide and the catalogue is one scroll. */
const PAGE_SIZE = 18;

export default function ProductLibraryPanel({
  products,
  isLoading,
  placedProductIds,
  onAddProduct,
  onSuggestCombo,
  categoryRequest,
}: ProductLibraryPanelProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Derived from the request rather than pushed in by an effect: the customer's
  // own tab choice wins until a NEW request arrives.
  const [answered, setAnswered] = useState<number | null>(null);
  if (categoryRequest && categoryRequest.nonce !== answered) {
    setAnswered(categoryRequest.nonce);
    setActiveTab(categoryRequest.id);
    setQuery('');
    setLimit(PAGE_SIZE);
  }

  /** Everything Room Studio will show: the catalogue minus surface materials. */
  const inScope = useMemo(
    () => products.filter((p) => !isSurfaceMaterial(p.normalizedCategory)),
    [products]
  );

  // Only categories this catalogue actually has. A tab that filters to nothing
  // is a dead end the customer has to discover by tapping it.
  const tabs = useMemo(() => {
    const present = new Set(inScope.map((p) => p.normalizedCategory));
    return [
      { id: 'all', label: 'Tất cả' },
      ...CATEGORY_ORDER.filter((id) => present.has(id)).map((id) => ({
        id,
        label: CATEGORY_LABEL[id] ?? id,
      })),
    ];
  }, [inScope]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inScope
      .filter((p) => activeTab === 'all' || p.normalizedCategory === activeTab)
      // §37: name, brand and SKU. Never the technical prose — searching
      // "porcelain" should not surface a toilet because its care instructions
      // mention it.
      .filter(
        (p) =>
          !needle ||
          p.name.toLowerCase().includes(needle) ||
          (p.brand ?? '').toLowerCase().includes(needle) ||
          (p.sku ?? '').toLowerCase().includes(needle)
      )
      // Placeable first. A product with no usable dimensions stays listed —
      // the showroom needs to see which rows are missing data — but it sinks.
      .sort((a, b) => {
        const byCapability = CAPABILITY_RANK[b.capability] - CAPABILITY_RANK[a.capability];
        if (byCapability !== 0) return byCapability;
        return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
      });
  }, [inScope, activeTab, query]);

  const shown = visible.slice(0, limit);
  const placeableCount = useMemo(() => visible.filter((p) => isPlaceable(p.capability)).length, [visible]);

  const resetFilters = () => {
    setActiveTab('all');
    setQuery('');
    setLimit(PAGE_SIZE);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-[#E1E8ED] px-4 pb-3 pt-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#0B1623]">
            Sản phẩm
          </h2>
          {/* §41: the Expert is requested, not resident. The floating card used
              to sit over the viewport and the command bar at all times. */}
          <button
            type="button"
            onClick={onSuggestCombo}
            className="flex items-center gap-1 text-[13px] font-medium text-[#0F3D5C] transition-colors hover:text-[#C8A96A]"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Gợi ý combo
          </button>
        </div>

        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA9B6]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Tìm sản phẩm hoặc thương hiệu"
            aria-label="Tìm sản phẩm"
            className="w-full rounded border border-[#D8E2EA] bg-white py-2 pl-8.5 pr-3 text-[13px] text-[#0B1623] focus:border-[#0F3D5C] focus:outline-none"
            style={{ paddingLeft: 34 }}
          />
        </div>

        <div className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setLimit(PAGE_SIZE);
              }}
              aria-pressed={activeTab === tab.id}
              className={`whitespace-nowrap rounded border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0B2239] bg-[#0B2239] text-white'
                  : 'border-[#D8E2EA] bg-white text-[#5B6B7A] hover:border-[#9AA9B6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && (
          <ul className="space-y-px p-2" aria-label="Đang tải sản phẩm">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex animate-pulse gap-3 p-2">
                <div className="h-16 w-16 shrink-0 rounded bg-[#F1F5F7]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2.5 w-16 rounded bg-[#F1F5F7]" />
                  <div className="h-3 w-full rounded bg-[#F1F5F7]" />
                  <div className="h-2.5 w-24 rounded bg-[#F1F5F7]" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-[#5B6B7A]">Không tìm thấy sản phẩm phù hợp.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 text-[13px] font-medium text-[#0F3D5C] underline decoration-[#C8D5DE] underline-offset-4"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}

        {!isLoading && shown.length > 0 && (
          <ul className="divide-y divide-[#F1F5F7]">
            {shown.map((product) => {
              const placeable = isPlaceable(product.capability);
              const badge = CAPABILITY_BADGE[product.capability];
              const isPlaced = placedProductIds.has(product.id);

              return (
                <li
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
                  className={`flex gap-3 px-4 py-3 transition-colors ${
                    placeable ? 'cursor-grab hover:bg-[#FAFCFD] active:cursor-grabbing' : 'bg-[#FCFDFD]'
                  }`}
                >
                  <div
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded border border-[#EDF2F5] ${
                      placeable ? '' : 'opacity-55'
                    }`}
                  >
                    {product.imageUrl ? (
                      <StageImage
                        src={product.imageUrl}
                        alt={product.name}
                        occupancy={opticalScale(product.normalizedCategory, product.name) * 0.88}
                      />
                    ) : (
                      <ProductImagePlaceholder
                        brand={product.brand ?? product.category}
                        sku={product.sku ?? null}
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[12px] uppercase tracking-[0.08em] text-[#8C9BAB]">
                      {product.brand || product.category}
                      {product.sku && <span className="normal-case tracking-normal"> · {product.sku}</span>}
                    </span>
                    {/* §31: two lines, full name on hover. A scraped name is
                        sometimes 90 characters and must not make one row twice
                        the height of its neighbours. */}
                    <h3
                      className="line-clamp-2 text-[13px] font-medium leading-snug text-[#0B1623]"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13px] font-semibold text-[#0B1623]">
                        {formatProductPrice(product)}
                      </span>
                      {/* The only 3D claim in Room Studio. `3D VERIFIED` needs
                          a READY asset that passed every QA check; a dimension
                          volume gets ĐÚNG KÍCH THƯỚC and never the word 3D. */}
                      {badge && (
                        <span
                          title={badge.title}
                          className={`whitespace-nowrap rounded px-1.5 py-px text-[11px] font-semibold tracking-[0.04em] ${
                            product.capability === 'VERIFIED_3D'
                              ? 'bg-[#123C5A] text-white'
                              : 'bg-[#EEF4F7] text-[#4A6275]'
                          }`}
                        >
                          {badge.label}
                        </span>
                      )}
                      {/* A stand-in gets its own words, never the 3D badge. The
                          room will draw a shape under this product's name, and
                          this is the only thing on screen that says the shape
                          is not the product. */}
                      {product.illustrativeModel && (
                        <span
                          title="Hình khối 3D chỉ để minh hoạ, không phải hình dáng thật của sản phẩm này. Kích thước trong phòng vẫn đúng."
                          className="whitespace-nowrap rounded border border-[#D8E2EA] px-1.5 py-px text-[11px] font-medium tracking-[0.04em] text-[#8C9BAB]"
                        >
                          MÔ HÌNH MINH HOẠ
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[12px] text-[#9AA9B6]">
                      {placeable ? product.dimensionsLabel : NO_DIMENSIONS_REASON}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddProduct(product)}
                    disabled={!placeable}
                    // §39: the button says four characters; the accessible name
                    // says which product and, when it cannot be placed, why.
                    aria-label={
                      placeable
                        ? `Thêm ${product.name} vào phòng`
                        : `${product.name}: ${NO_DIMENSIONS_REASON}, chưa đặt được vào phòng`
                    }
                    title={placeable ? undefined : `${NO_DIMENSIONS_REASON} — chưa đặt được vào phòng`}
                    className={`h-8 shrink-0 self-center rounded px-2.5 text-[12px] font-semibold tracking-[0.04em] transition-colors ${
                      !placeable
                        ? 'cursor-not-allowed bg-[#F1F5F7] text-[#B4C0C9]'
                        : isPlaced
                          ? 'bg-[#DCEBF5] text-[#123C5A]'
                          : 'bg-[#0B3A55] text-white hover:bg-[#082B40]'
                    }`}
                  >
                    {isPlaced ? 'ĐÃ CÓ' : '+ THÊM'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!isLoading && visible.length > shown.length && (
          <div className="px-4 py-4">
            <button
              type="button"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
              className="w-full rounded border border-[#D8E2EA] py-2 text-[13px] font-medium text-[#0B2239] transition-colors hover:border-[#0B2239]"
            >
              Xem thêm ({visible.length - shown.length})
            </button>
          </div>
        )}
      </div>

      {!isLoading && visible.length > 0 && (
        <p className="shrink-0 border-t border-[#F1F5F7] px-4 py-2 text-[12px] text-[#9AA9B6]">
          {placeableCount}/{visible.length} sản phẩm có kích thước để đặt vào phòng
        </p>
      )}
    </div>
  );
}
