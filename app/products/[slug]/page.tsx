import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenantContext } from '@/lib/storefront/resolveTenant';
import JsonLd from '@/components/seo/JsonLd';
import { TrackOnMount } from '@/components/analytics/AnalyticsTracker';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/structuredData';
import { getProductDetail } from '@/lib/storefront/productDetail';
import { activeSections, formatVnd } from '@/lib/storefront/productDetailTypes';
import { DIVIDER, TEXT, TEXT_MUTED, TEXT_FAINT } from '@/components/storefront/home/editorial';
import ProductGallery from '@/components/storefront/product/ProductGallery';
import ProductActions from '@/components/storefront/product/ProductActions';
import ProductNav, { ANCHOR_OFFSET } from '@/components/storefront/product/ProductNav';
import {
  Compatibility,
  Consultation,
  DimensionsAndDrawing,
  Documents,
  RelatedProducts,
  Simulation,
  Specifications,
  Technologies,
} from '@/components/storefront/product/sections';

/**
 * A product, on the server.
 *
 * The page this replaces was a client component that read the catalogue out
 * of localStorage, which meant a product URL opened cold — in a new tab, from
 * a message, by a crawler — resolved against an empty cache and 404'd, and
 * that the 99 products in the demo showroom's fixture-backed catalogue had no
 * detail page at all because they are not rows in the database.
 *
 * Resolution now goes through the same catalogue service `/products` uses:
 * tenant first, then the catalogue, which knows whether this storefront is
 * backed by Prisma or by a demo fixture and answers in one shape either way.
 * The page never learns which, and never reads client state to decide what
 * product it is showing.
 *
 * Interactive pieces are islands: the gallery, the actions and the anchor
 * rail. Everything a customer reads, and everything a search engine indexes,
 * is rendered here.
 */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { tenant, indexable } = await resolveTenantContext();
  const vm = await getProductDetail(tenant, slug);

  // A product that does not resolve for this tenant gets no product metadata:
  // a title carrying a name and a brand would leak the catalogue the 404 is
  // there to withhold.
  if (!vm) return { title: `Không tìm thấy sản phẩm | ${tenant.brand.name}`, robots: { index: false } };

  const path = `/products/${encodeURIComponent(vm.identity.id)}`;
  return {
    title: `${vm.identity.name} | ${tenant.brand.name}`,
    description: vm.summary ?? undefined,
    alternates: { canonical: path },
    // A demo configuration's product pages are not search results. A tenant
    // that publishes its catalogue (`site.indexProducts`) is — on its own
    // domain only. Stated explicitly either way: a page-level `undefined`
    // would replace the layout's noindex rather than inherit it.
    robots:
      indexable && (vm.commercial.commercialConfirmed || tenant.site?.indexProducts)
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      title: `${vm.identity.name} | ${tenant.brand.name}`,
      description: vm.summary ?? undefined,
      type: 'website',
      url: path,
      images: vm.media.primary ? [{ url: vm.media.primary.url }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const { tenant, origin } = await resolveTenantContext();
  const vm = await getProductDetail(tenant, slug);

  // Not in this tenant's catalogue: a real 404, before anything about the
  // product has been rendered.
  if (!vm) notFound();

  const { identity, media, pricing, commercial, provenance } = vm;
  const sections = activeSections(vm);
  const path = `/products/${encodeURIComponent(identity.id)}`;
  const categoryPath = `/products?category=${encodeURIComponent(identity.category)}`;

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            origin,
            path,
            name: identity.name,
            brand: identity.brand,
            sku: identity.sku,
            category: identity.category,
            description: vm.summary,
            images: [media.primary, ...media.gallery].flatMap((m) => (m ? [m.url] : [])).slice(0, 4),
            // Only a confirmed showroom price is an offer; a reference price is not.
            offerPrice: commercial.commercialConfirmed ? pricing.showroomPrice : null,
          }),
          breadcrumbJsonLd(origin, [
            { name: 'Trang chủ', path: '/' },
            { name: 'Sản phẩm', path: '/products' },
            { name: identity.category, path: categoryPath },
            { name: identity.name, path },
          ]),
        ]}
      />
      <TrackOnMount
        name="view_item"
        params={{
          currency: 'VND',
          value: pricing.showroomPrice ?? undefined,
          items: [{
            item_id: identity.id,
            item_name: identity.name,
            item_brand: identity.brand,
            item_category: identity.category,
            price: pricing.showroomPrice ?? undefined,
          }],
        }}
      />
      <section id="tong-quan" style={{ scrollMarginTop: ANCHOR_OFFSET }}>
        <div className="home-container" style={{ paddingTop: 26, paddingBottom: 'clamp(44px, 4.4vw, 68px)' }}>
          <nav aria-label="Breadcrumb">
            <ol
              className="flex flex-wrap items-center gap-x-2 gap-y-1"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: '#777777' }}
            >
              <li>
                <Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={'/products' as Route} className="transition-opacity hover:opacity-60">SẢN PHẨM</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/products?category=${encodeURIComponent(identity.category)}` as Route}
                  className="transition-opacity hover:opacity-60"
                >
                  {identity.category.toUpperCase()}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" style={{ color: TEXT }}>
                {(identity.sku ?? identity.name).toUpperCase()}
              </li>
            </ol>
          </nav>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-[56px]">
            <ProductGallery
              media={media}
              brand={identity.brand}
              sku={identity.sku}
              name={identity.name}
            />

            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: '#777777' }}>
                {identity.brand.toUpperCase()}
              </p>

              <h1
                className="mt-2.5 line-clamp-3"
                style={{
                  fontSize: 'clamp(26px, 1.25rem + 1.05vw, 35px)',
                  fontWeight: 500,
                  lineHeight: 1.12,
                  letterSpacing: '-0.01em',
                  color: TEXT,
                }}
              >
                {identity.name}
              </h1>

              {identity.sku && (
                <p className="mt-2.5" style={{ fontSize: 13, color: TEXT_MUTED }}>
                  Mã sản phẩm: {identity.sku}
                </p>
              )}

              <p className="mt-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: TEXT_FAINT }}>
                {[identity.category, identity.subcategory].filter(Boolean).join(' · ').toUpperCase()}
              </p>

              {/* ── Price ─────────────────────────────────────────────── */}
              <div className="mt-6">
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_MUTED }}>
                  {pricing.displayPriceLabel}
                </p>
                <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {pricing.showroomPrice ? (
                    <span style={{ fontSize: 'clamp(24px, 1.2rem + .7vw, 30px)', fontWeight: 600, color: `var(--tenant-price, ${TEXT})` }}>
                      {formatVnd(pricing.showroomPrice)}
                    </span>
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 500, color: TEXT }}>Liên hệ để nhận báo giá</span>
                  )}

                  {/* One reference figure, never three competing prices. */}
                  {pricing.comparePrice && pricing.showroomPrice && pricing.comparePrice > pricing.showroomPrice && (
                    <span style={{ fontSize: 14, color: '#999999', textDecoration: 'line-through' }}>
                      {formatVnd(pricing.comparePrice)}
                    </span>
                  )}
                  {pricing.discountPercent !== null && pricing.discountPercent > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tenant-discount, var(--tenant-accent))' }}>
                      −{pricing.discountPercent}%
                    </span>
                  )}
                </div>

                {pricing.compareLabel && (
                  <p className="mt-1.5" style={{ fontSize: 12, color: TEXT_FAINT }}>
                    {pricing.compareLabel}
                  </p>
                )}

                {/* Shown only where the tenant actually holds commercial state. */}
                {commercial.availabilityLabel && (
                  <p className="mt-3" style={{ fontSize: 13, color: TEXT }}>
                    {commercial.availabilityLabel}
                    {commercial.leadTimeDays ? ` · khoảng ${commercial.leadTimeDays} ngày` : ''}
                  </p>
                )}

                {pricing.note && (
                  <p className="mt-2.5 max-w-[480px]" style={{ fontSize: 13, lineHeight: 1.55, color: TEXT_MUTED }}>
                    {pricing.note}
                  </p>
                )}
              </div>

              {vm.summary && (
                <p className="mt-6 max-w-[500px]" style={{ fontSize: 15.5, lineHeight: 1.6, color: '#4A4A4A' }}>
                  {vm.summary}
                </p>
              )}

              {/* ── The facts that decide ─────────────────────────────── */}
              {vm.overviewFacts.length > 0 && (
                <dl className="mt-6 max-w-[500px]">
                  {vm.overviewFacts.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1"
                      style={{ borderBottom: `1px solid ${DIVIDER}`, minHeight: 46, paddingBlock: 11 }}
                    >
                      <dt style={{ fontSize: 13, color: '#737373' }}>{fact.label}</dt>
                      <dd className="text-right" style={{ fontSize: 14, color: TEXT }}>
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <ProductActions vm={vm} />

              {/* Restrained attribution. The URLs themselves stay internal. */}
              {provenance.technicalAttribution && (
                <p className="mt-8" style={{ fontSize: 12, color: TEXT_FAINT }}>
                  {provenance.technicalAttribution}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <ProductNav vm={vm} sections={sections} />

      <Specifications groups={vm.specifications} />
      <DimensionsAndDrawing vm={vm} />
      <Technologies vm={vm} />
      <Compatibility items={vm.compatibility} />
      <Documents vm={vm} />
      <Simulation vm={vm} />
      <RelatedProducts items={vm.relatedProducts} category={identity.category} />

      <Consultation quotations={tenant.features.quotations} />

      {/* The sticky bar sits over the last section; this keeps the footer
          reachable rather than permanently half-covered. */}
      {/* Safe space under the fixed product bar, so the closing section is
          never the thing it covers. */}
      <div aria-hidden="true" style={{ height: 58 }} className="max-lg:h-16" />
    </>
  );
}
