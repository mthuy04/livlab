'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useQuote } from '@/lib/context/QuoteContext';
import { toggleCompare, toggleSaved, useTenantIds } from '@/lib/storefront/tenantStorage';
import { TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import type { ProductDetailViewModel } from '@/lib/storefront/productDetailTypes';

/**
 * The actions on a product.
 *
 * One primary, one secondary that exists only when Room Studio can really
 * place this SKU, and the simulator as a text link where the brand has one.
 * Save and compare are quiet by design: they are shortcuts, not decisions.
 *
 * Nothing here holds its own state. The basket is the storefront's existing
 * QuoteContext, and save and compare are the same tenant-scoped stores the
 * catalogue writes — so a product saved on the grid is already saved when the
 * customer opens it, and a comparison started on one page continues on the
 * other.
 */
export default function ProductActions({ vm }: { vm: ProductDetailViewModel }) {
  const { addCatalogItem, hasItem } = useQuote();
  const [savedIds, setSavedIds] = useTenantIds(vm.tenantId, 'saved');
  const [compareIds, setCompareIds] = useTenantIds(vm.tenantId, 'compare');
  const [compareError, setCompareError] = useState<string | null>(null);

  const { identity, pricing, roomStudio, manufacturerSimulator } = vm;
  const inQuote = hasItem(identity.id);
  const saved = savedIds.includes(identity.id);
  const comparing = compareIds.includes(identity.id);

  const requestQuote = () => {
    if (inQuote) return;
    addCatalogItem({
      catalogProductId: identity.catalogProductId,
      productId: identity.id,
      sourceType: identity.sourceType,
      tenantId: vm.tenantId,
      name: identity.name,
      brand: identity.brand,
      category: identity.category,
      sku: identity.sku,
      image: vm.media.primary?.url ?? null,
      showroomPrice: pricing.showroomPrice,
      referencePrice: pricing.showroomReferencePrice,
      marketReferencePrice: pricing.marketReferencePrice,
      priceType: pricing.priceType,
      priceUnit: pricing.priceUnit,
      sourceContext: 'PRODUCT_DETAIL',
    });
  };

  const onCompare = () => {
    // The catalogue's own rules — three at most, one category — applied by the
    // same function the grid calls. A detail page cannot resolve the category
    // of ids it has never seen, so the store answers for them.
    const result = toggleCompare(vm.tenantId, identity.id, identity.category, () => null);
    setCompareIds(result.ids);
    setCompareError(result.error ?? null);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestQuote}
          className="inline-flex items-center justify-center transition-opacity hover:opacity-85"
          style={{
            height: 46,
            paddingInline: 28,
            backgroundColor: 'var(--tenant-accent)',
            color: 'var(--tenant-accent-contrast)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.10em',
          }}
        >
          {inQuote ? 'ĐÃ THÊM VÀO YÊU CẦU' : 'YÊU CẦU BÁO GIÁ'}
        </button>

        {/* Only when a LivLab master asset exists for this exact SKU. */}
        {roomStudio.ready && roomStudio.href && (
          <Link
            href={roomStudio.href as Route}
            className="inline-flex items-center justify-center transition-colors hover:bg-[#F6F6F4]"
            style={{
              height: 46,
              paddingInline: 24,
              border: '1px solid #333333',
              backgroundColor: '#FFFFFF',
              color: TEXT,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.10em',
            }}
          >
            THỬ TRONG ROOM STUDIO
          </Link>
        )}
      </div>

      {inQuote && (
        <p className="mt-3" style={{ fontSize: 12.5, color: TEXT_MUTED }}>
          Sản phẩm đã có trong yêu cầu của bạn.{' '}
          <Link href={'/quote' as Route} className="underline underline-offset-2" style={{ color: TEXT }}>
            Xem yêu cầu
          </Link>
        </p>
      )}

      {/* Tertiary: the manufacturer's own tool, named as theirs. */}
      {manufacturerSimulator && (
        <p className="mt-4">
          <a
            href={manufacturerSimulator.href}
            {...(manufacturerSimulator.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className="transition-opacity hover:opacity-60"
            style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: 'var(--tenant-accent-ink)' }}
          >
            MÔ PHỎNG SẢN PHẨM →
          </a>
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-7">
        <button
          type="button"
          onClick={() => setSavedIds(toggleSaved(vm.tenantId, identity.id))}
          aria-pressed={saved}
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', color: TEXT_MUTED }}
        >
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill={saved ? TEXT : 'none'} aria-hidden="true">
            <path d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z" stroke={TEXT} strokeWidth="1.4" />
          </svg>
          {saved ? 'ĐÃ LƯU' : 'LƯU'}
        </button>

        <button
          type="button"
          onClick={onCompare}
          aria-pressed={comparing}
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', color: TEXT_MUTED }}
        >
          <span
            className="inline-block"
            style={{
              width: 13,
              height: 13,
              border: `1px solid ${TEXT}`,
              backgroundColor: comparing ? 'var(--tenant-accent)' : 'transparent',
            }}
            aria-hidden="true"
          />
          SO SÁNH
        </button>

        {compareIds.length > 0 && (
          <Link
            href={`/compare?ids=${compareIds.join(',')}` as Route}
            className="transition-opacity hover:opacity-60"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', color: TEXT }}
          >
            XEM SO SÁNH ({compareIds.length}) →
          </Link>
        )}
      </div>

      {compareError && (
        <p role="status" className="mt-3" style={{ fontSize: 12.5, color: '#A33A3A' }}>
          {compareError}
        </p>
      )}
    </div>
  );
}
