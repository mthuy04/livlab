'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuote } from '@/lib/context/QuoteContext';
import { StageImage } from '@/components/storefront/catalog/ProductImage';
import { DIVIDER, TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import {
  SECTION_LABELS,
  formatVnd,
  type ProductDetailViewModel,
  type SectionId,
} from '@/lib/storefront/productDetailTypes';

/**
 * The anchor rail and the compact action bar.
 *
 * One component because they share one piece of state — how far down the page
 * the reader is — and because they share one sticky offset. The storefront
 * header is 74px and already sticky; stacking a rail and a product bar under
 * it unconditionally would leave a 180px permanent block over a page whose
 * subject is a photograph. So the rail sticks, and the action bar only
 * appears once the overview has gone, replacing nothing and overlapping
 * nothing.
 */

const HEADER_HEIGHT = 74;

export default function ProductNav({
  vm,
  sections,
}: {
  vm: ProductDetailViewModel;
  sections: SectionId[];
}) {
  const [active, setActive] = useState<SectionId>(sections[0]);
  const [pastOverview, setPastOverview] = useState(false);
  const [atHandoff, setAtHandoff] = useState(false);
  const railRef = useRef<HTMLElement | null>(null);

  // Shown between the two ends of the page: after the overview's own actions
  // have scrolled away, and until the closing consultation section arrives
  // with the same two actions in it. Offering YÊU CẦU BÁO GIÁ twice on one
  // screen makes the page look like it is nagging rather than helping.
  const barVisible = pastOverview && !atHandoff;

  useEffect(() => {
    const overview = document.getElementById('tong-quan');
    if (!overview) return;
    // The bar arrives when the overview's actions have left the viewport, and
    // not a pixel before: a product bar over the product itself is noise.
    const observer = new IntersectionObserver(
      ([entry]) => setPastOverview(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: `-${HEADER_HEIGHT + 60}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(overview);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handoff = document.getElementById('tu-van');
    if (!handoff) return;
    // From the handoff onwards, not only while it is on screen. Past it lies
    // the footer, where a product bar has nothing left to offer and covers
    // the site's own links to do it.
    const observer = new IntersectionObserver(
      ([entry]) => setAtHandoff(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(handoff);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (sections.length < 2) return;
    const nodes = sections
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id as SectionId);
      },
      { rootMargin: `-${HEADER_HEIGHT + 70}px 0px -62% 0px`, threshold: 0 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  const price = vm.pricing.showroomPrice;

  return (
    <>
      {sections.length > 1 && (
        <nav
          ref={railRef}
          aria-label="Nội dung sản phẩm"
          className="sticky z-30"
          style={{
            top: HEADER_HEIGHT,
            backgroundColor: '#FFFFFF',
            borderTop: `1px solid ${DIVIDER}`,
            borderBottom: `1px solid ${DIVIDER}`,
          }}
        >
          <div className="home-container">
            <ul className="no-scrollbar flex items-stretch gap-8 overflow-x-auto" style={{ height: 50 }}>
              {sections.map((id) => {
                const current = id === active;
                return (
                  <li key={id} className="flex shrink-0 items-stretch">
                    <a
                      href={`#${id}`}
                      aria-current={current ? 'true' : undefined}
                      className="relative flex items-center transition-opacity duration-150 hover:opacity-70"
                      style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.10em', color: current ? TEXT : '#6F6F6C' }}
                    >
                      {SECTION_LABELS[id]}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 right-0"
                        style={{ height: 2, backgroundColor: current ? 'var(--tenant-accent)' : 'transparent' }}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}

      {barVisible && <StickyBar vm={vm} price={price} />}
    </>
  );
}

function StickyBar({ vm, price }: { vm: ProductDetailViewModel; price: number | null }) {
  const { addCatalogItem, hasItem } = useQuote();
  const { identity, media, roomStudio } = vm;
  const inQuote = hasItem(identity.id);

  const add = () => {
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
      image: media.primary?.url ?? null,
      showroomPrice: vm.pricing.showroomPrice,
      referencePrice: vm.pricing.showroomReferencePrice,
      sourceContext: 'PRODUCT_DETAIL',
    });
  };

  return (
    <>
      {/* Desktop: identity on the left, the decision on the right. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 max-lg:hidden"
        style={{ height: 58, backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E5E2' }}
      >
        <div className="home-container flex h-full items-center justify-between gap-8">
          <div className="flex min-w-0 items-center gap-4">
            {media.primary && media.presentable && (
              <div className="shrink-0 overflow-hidden" style={{ width: 44, height: 44, border: `1px solid ${DIVIDER}` }}>
                <StageImage src={media.primary.url} alt="" occupancy={media.occupancy * 0.9} normalized={media.normalized} />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate" style={{ fontSize: 13.5, fontWeight: 500, color: TEXT }}>
                {identity.name}
              </p>
              <p style={{ fontSize: 12, color: TEXT_MUTED }}>
                {price ? formatVnd(price) : 'Liên hệ để nhận báo giá'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {roomStudio.ready && roomStudio.href && (
              <a
                href={roomStudio.href}
                className="inline-flex items-center justify-center transition-colors hover:bg-[#F6F6F4]"
                style={{ height: 42, paddingInline: 20, border: '1px solid #333333', fontSize: 11.5, fontWeight: 600, letterSpacing: '.09em', color: TEXT }}
              >
                THỬ TRONG ROOM STUDIO
              </a>
            )}
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center justify-center transition-opacity hover:opacity-85"
              style={{
                height: 42,
                paddingInline: 24,
                backgroundColor: 'var(--tenant-accent)',
                color: 'var(--tenant-accent-contrast)',
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '.09em',
              }}
            >
              {inQuote ? 'ĐÃ THÊM' : 'YÊU CẦU BÁO GIÁ'}
            </button>
          </div>
        </div>
      </div>

      {/* Phone: price and the one action. Room Studio and the simulator stay
          in the page body — a bottom bar with four controls is a toolbar. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{ backgroundColor: '#FFFFFF', borderTop: `1px solid ${DIVIDER}`, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between gap-4 px-[18px]" style={{ height: 64 }}>
          <div className="min-w-0">
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.10em', color: TEXT_MUTED }}>
              {vm.pricing.displayPriceLabel}
            </p>
            <p className="truncate" style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>
              {price ? formatVnd(price) : 'Liên hệ'}
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            className="shrink-0 transition-opacity hover:opacity-85"
            style={{
              height: 44,
              paddingInline: 20,
              backgroundColor: 'var(--tenant-accent)',
              color: 'var(--tenant-accent-contrast)',
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: '.09em',
            }}
          >
            {inQuote ? 'ĐÃ THÊM' : 'YÊU CẦU BÁO GIÁ'}
          </button>
        </div>
      </div>
    </>
  );
}
