import Link from 'next/link';
import type { Route } from 'next';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import {
  AREA_BAND_LABEL,
  MATCH_CAVEAT,
  STYLE_FACET_LABEL,
  STYLE_FACET_OF,
  TARGET_LABEL,
  toHotspotViews,
  type ResolvedConcept,
} from '@/lib/storefront/conceptTypes';
import { DIVIDER } from '@/components/storefront/home/editorial';
import { formatVnd } from '@/lib/storefront/productDetailTypes';
import ConceptStage from './ConceptStage';
import ConceptStory from './ConceptStory';
import ConceptQuoteActions from './ConceptQuoteActions';
import RetailProductCard from '@/components/storefront/home/RetailProductCard';

/**
 * The `commerce` concept page: one room, the products in it, the way to buy.
 *
 * On a desktop the heading, the facts and a numbered index of the products
 * sit beside the stage, so the room, its name and every pin fit in one screen
 * — the point of the page is that one scene is made of these products, and a
 * reader should see both halves of that at once. The stage itself is the
 * editorial one, uncropped at the asset's 4:3, so every pin stays on its
 * fixture at every width.
 *
 * Everything shown comes from the resolved concept: products are the ones the
 * tenant's catalogue still holds, in hotspot order, and the equipment total is
 * the concept's own estimate from current catalogue prices.
 */

const MUTED = '#5E5C58';
const FAINT = '#8A8782';

export default function CommerceConceptPage({
  tenant,
  resolved,
}: {
  tenant: TenantStorefrontConfig;
  resolved: ResolvedConcept;
}) {
  const { concept, estimate } = resolved;
  const presentation = concept.presentation;
  const hotspots = toHotspotViews(resolved);
  const copy = tenant.experience.copy.concept;

  // One entry per product, in the order the pins read across the room.
  const seen = new Set<string>();
  const items = hotspots.filter((h) => {
    if (seen.has(h.product.catalogProductId)) return false;
    seen.add(h.product.catalogProductId);
    return true;
  });
  const products = items.map((h) => h.product);

  const heading = presentation?.leadWithName ? concept.title : concept.titleVi;
  const subtitle = presentation?.leadWithName ? concept.titleVi : null;
  const facts = [
    presentation?.styleLabel ?? STYLE_FACET_LABEL[STYLE_FACET_OF[concept.style]],
    presentation?.areaLabel ?? AREA_BAND_LABEL[concept.areaBand],
    presentation?.budgetLabel,
  ].filter((f): f is string => Boolean(f));
  const caveat = items[0] ? MATCH_CAVEAT[items[0].match] : null;
  const eyebrow = [tenant.brand.name, presentation?.roomType].filter(Boolean).join(' · ');

  return (
    <>
      <div className="home-container" style={{ paddingTop: 24 }}>
        <nav aria-label="Breadcrumb">
          <ol
            className="flex flex-wrap items-center gap-2"
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: FAINT }}
          >
            <li>
              <Link href={'/' as Route} className="transition-colors hover:text-[color:var(--tenant-accent-ink)]">
                {tenant.brand.name.toUpperCase()}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={'/concepts' as Route} className="transition-colors hover:text-[color:var(--tenant-accent-ink)]">
                KHÔNG GIAN
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: 'var(--tenant-ink)' }}>{heading.toUpperCase()}</li>
          </ol>
        </nav>

        <div className="mt-6 grid items-start gap-9 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12">
          <div>
            <p
              className="flex items-center gap-3"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.16em', color: 'var(--tenant-accent-ink)' }}
            >
              <span aria-hidden="true" className="h-[3px] w-6" style={{ backgroundColor: 'var(--tenant-accent)' }} />
              {eyebrow.toUpperCase()}
            </p>

            <h1
              className="mt-5"
              style={{
                fontSize: 'clamp(32px, 1.6rem + 1.2vw, 46px)',
                fontWeight: 500,
                lineHeight: 1.08,
                letterSpacing: '-0.015em',
                color: 'var(--tenant-ink)',
              }}
            >
              {heading}
            </h1>
            {subtitle && (
              <p className="mt-2" style={{ fontSize: 18, lineHeight: 1.4, color: MUTED }}>
                {subtitle}
              </p>
            )}

            <ul className="mt-5 flex flex-wrap items-center gap-y-2">
              {facts.map((fact, i) => (
                <li
                  key={fact}
                  className={i > 0 ? 'pl-3.5 ml-3.5' : ''}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '.12em',
                    color: 'var(--tenant-ink)',
                    borderLeft: i > 0 ? '1px solid #DAD7D2' : undefined,
                  }}
                >
                  {fact.toUpperCase()}
                </li>
              ))}
            </ul>

            <p className="mt-5" style={{ fontSize: 15, lineHeight: 1.7, color: MUTED }}>
              {concept.shortDescription}
            </p>

            {/* The index: the four pins, as a list a reader can scan. */}
            {items.length > 0 && (
              <div className="mt-7">
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.14em', color: FAINT }}>
                  {items.length} {items.some((h) => h.match === 'EXACT_VISUAL') ? 'SẢN PHẨM' : 'SẢN PHẨM GỢI Ý'}
                </p>
                <ol className="mt-3" style={{ borderTop: `1px solid ${DIVIDER}` }}>
                  {items.map((h, i) => (
                    <li key={h.id} style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                      <Link
                        href={h.product.href as Route}
                        className="group flex items-baseline gap-3.5 py-3"
                      >
                        <span
                          className="w-5 shrink-0 tabular-nums"
                          style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tenant-accent-ink)' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate transition-colors group-hover:text-[color:var(--tenant-accent-ink)]"
                            style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tenant-ink)' }}
                          >
                            {h.product.brand} {h.product.sku ?? ''}
                          </span>
                          <span className="block" style={{ fontSize: 12.5, color: FAINT }}>
                            {TARGET_LABEL[h.targetType].charAt(0).toUpperCase() + TARGET_LABEL[h.targetType].slice(1)}
                          </span>
                        </span>
                        {h.product.showroomPrice ? (
                          <span
                            className="shrink-0"
                            style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tenant-price, var(--tenant-ink))' }}
                          >
                            {formatVnd(h.product.showroomPrice)}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ol>
                <p className="mt-2.5" style={{ fontSize: 11.5, color: FAINT }}>
                  Giá tham khảo tại thời điểm cập nhật danh mục.
                </p>
              </div>
            )}
          </div>

          <ConceptStage
            image={concept.canonicalImage}
            imageAlt={concept.imageAlt}
            hotspots={hotspots}
            commerce
            conceptSlug={concept.slug}
          />
        </div>
      </div>

      <ConceptStory
        heading={heading}
        story={concept.conceptStory}
        principles={concept.designPrinciples}
      />

      {products.length > 0 && (
        <section className="home-container" style={{ paddingTop: 44 }} aria-labelledby="concept-products">
          <div style={{ borderTop: `1px solid ${DIVIDER}`, paddingTop: 40 }}>
            <h2
              id="concept-products"
              style={{
                fontSize: 'clamp(22px, 1.2rem + .6vw, 30px)',
                fontWeight: 500,
                lineHeight: 1.12,
                letterSpacing: 'var(--tenant-heading-tracking)',
                color: 'var(--tenant-ink)',
              }}
            >
              {copy?.productsTitle ?? 'SẢN PHẨM TRONG KHÔNG GIAN'}
            </h2>
            {caveat && (
              <p className="max-w-[680px]" style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.65, color: MUTED }}>
                {caveat}
              </p>
            )}
            <div className="mt-8 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
              {products.map((p, i) => (
                <RetailProductCard
                  key={p.catalogProductId}
                  product={{ ...p, image: p.imagePresentable && p.image ? p.image : '' }}
                  tenantId={tenant.id}
                  addLabel={tenant.experience.copy.quote.addToQuote}
                  index={i + 1}
                  sourceContext={`CONCEPT:${concept.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="home-container" style={{ paddingTop: 56, paddingBottom: 96 }}>
        <div
          className="grid gap-10 px-6 py-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:px-12 md:py-12"
          style={{ backgroundColor: 'var(--tenant-surface-muted)', borderRadius: 'var(--tenant-radius)' }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(22px, 1.2rem + .6vw, 30px)', fontWeight: 500, lineHeight: 1.15, color: 'var(--tenant-ink)' }}>
              {copy?.ctaTitle ?? 'YÊU CẦU BÁO GIÁ CHO KHÔNG GIAN NÀY'}
            </h2>
            {copy?.ctaBody && (
              <p className="mt-4 max-w-[520px]" style={{ fontSize: 15, lineHeight: 1.7, color: MUTED }}>
                {copy.ctaBody}
              </p>
            )}
            <div className="mt-8">
              <ConceptQuoteActions
                products={products}
                conceptSlug={concept.slug}
                roomStudio={tenant.features.roomStudio}
              />
            </div>
          </div>

          {/* Equipment only, from current catalogue prices. Never the finished room. */}
          <div className="md:border-l md:border-[#DAD7D2] md:pl-10">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.13em', color: FAINT }}>
              {copy?.estimateTitle ?? 'GIÁ THIẾT BỊ ƯỚC TÍNH'}
            </p>
            <p className="mt-3" style={{ fontSize: 'clamp(24px, 1.3rem + .7vw, 32px)', fontWeight: 500, color: 'var(--tenant-ink)' }}>
              {estimate.kind === 'RANGE'
                ? `${Math.round(estimate.min / 1_000_000)}–${Math.round(estimate.max / 1_000_000)} triệu`
                : 'Liên hệ showroom'}
            </p>
            <p className="mt-3" style={{ fontSize: 13, lineHeight: 1.65, color: MUTED }}>
              Ước tính cho {products.length} thiết bị gợi ý theo giá tham khảo hiện tại. Không bao gồm
              vật liệu hoàn thiện, thi công, nội thất và lắp đặt — chi phí hoàn thiện toàn bộ phòng
              được showroom xác nhận riêng.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
