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
const NAV_HEIGHT = 50;

/**
 * Where an anchored section comes to rest.
 *
 * The header and the rail together are 124px of fixed chrome, so a bare
 * `#thong-so` jump puts the heading underneath them. This leaves the heading
 * clear of the rail with room to breathe.
 */
export const ANCHOR_OFFSET = HEADER_HEIGHT + NAV_HEIGHT + 34;

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
  const [pastContent, setPastContent] = useState(false);
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

  // The rail belongs to the product's own technical content. Once the last
  // anchored section has gone by, the reader is looking at other products and
  // then at the footer, and a rail still highlighting MÔ PHỎNG is describing
  // something that is no longer on screen.
  useEffect(() => {
    const last = document.getElementById(sections[sections.length - 1]);
    if (!last) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPastContent(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: `-${HEADER_HEIGHT + NAV_HEIGHT}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(last);
    return () => observer.disconnect();
  }, [sections]);

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

  // Which section the reader is in, decided by position rather than by which
  // boxes happen to overlap an observation band. The band approach kept
  // naming THÔNG SỐ while the drawing filled the screen, because a tall
  // section's box still intersected the band after its content had gone by.
  // The rule here is the plain one: the last section that has passed under
  // the rail is the section you are reading.
  useEffect(() => {
    if (sections.length < 2) return;
    const line = HEADER_HEIGHT + NAV_HEIGHT + 1;
    let last = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      last = Date.now();
      let current = sections[0];
      for (const id of sections) {
        const node = document.getElementById(id);
        if (node && node.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };

    // Throttled on the clock rather than on an animation frame: a frame
    // callback does not run while the tab is in the background, which would
    // leave the rail naming whatever section it last saw.
    const onScroll = () => {
      const since = Date.now() - last;
      if (since >= 80) {
        update();
      } else if (timer === undefined) {
        timer = setTimeout(() => {
          timer = undefined;
          update();
        }, 80 - since);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sections]);

  const price = vm.pricing.showroomPrice ?? vm.pricing.marketReferencePrice;

  return (
    <>
      {sections.length > 1 && (
        <nav
          ref={railRef}
          aria-label="Nội dung sản phẩm"
          className="sticky z-30 transition-transform duration-200"
          style={{
            top: HEADER_HEIGHT,
            backgroundColor: '#FFFFFF',
            borderTop: `1px solid ${DIVIDER}`,
            borderBottom: `1px solid ${DIVIDER}`,
            // Sticky elements keep their slot in the flow, so sliding it out
            // of view disengages the rail without shifting the page.
            transform: pastContent ? `translateY(-${HEADER_HEIGHT + NAV_HEIGHT + 2}px)` : undefined,
            pointerEvents: pastContent ? 'none' : undefined,
          }}
          aria-hidden={pastContent || undefined}
        >
          <div className="home-container">
            <ul className="no-scrollbar flex items-stretch gap-8 overflow-x-auto" style={{ height: NAV_HEIGHT }}>
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
      marketReferencePrice: vm.pricing.marketReferencePrice,
      priceType: vm.pricing.priceType,
      priceUnit: vm.pricing.priceUnit,
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
