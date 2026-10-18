import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { ConceptCardModel } from '@/lib/storefront/conceptTypes';
import { CONCEPT_IMAGE_HEIGHT, CONCEPT_IMAGE_WIDTH } from '@/lib/storefront/conceptLibrary';
import type { HomeBrand, HomeFeaturedConcept, HomeProductView } from '@/lib/storefront/tenantHome';
import { StageImage } from '@/components/storefront/catalog/ProductImage';
import ConceptCard from '@/components/storefront/concepts/ConceptCard';
import RetailProductCard from './RetailProductCard';

/**
 * Sections of the `catalog` homepage that read the tenant's own data.
 *
 * Colours and radii come from the tenant's tokens, never from here, so the
 * same section renders as a different showroom by configuration alone.
 */

const MUTED = '#5E5C58';

/** Eyebrow, title, optional line of copy, and a "see all" link. */
export function CatalogSectionHeader({
  eyebrow,
  title,
  body,
  href,
  linkLabel = 'XEM TẤT CẢ',
  id,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 md:mb-11">
      <div className="max-w-[640px]">
        {eyebrow && (
          <p
            className="mb-4 flex items-center gap-3"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.16em', color: 'var(--tenant-accent-ink)' }}
          >
            <span aria-hidden="true" className="h-[3px] w-6" style={{ backgroundColor: 'var(--tenant-accent)' }} />
            {eyebrow}
          </p>
        )}
        <h2
          id={id}
          style={{
            fontSize: 'clamp(26px, 1.2rem + .9vw, 32px)',
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: 'var(--tenant-heading-tracking)',
            color: 'var(--tenant-ink)',
          }}
        >
          {title}
        </h2>
        {body && (
          <p className="mt-4" style={{ fontSize: 15, lineHeight: 1.7, color: MUTED }}>
            {body}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href as Route}
          className="shrink-0 transition-colors hover:text-[color:var(--tenant-accent-ink)]"
          style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.1em', color: 'var(--tenant-ink)' }}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/**
 * The concept section. The cards are the `/concepts` grid's own, so the
 * homepage and the library cannot describe one room two ways.
 */
export function ConceptShowcase({
  eyebrow,
  title,
  body,
  concepts,
  featured,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  concepts: ConceptCardModel[];
  featured?: HomeFeaturedConcept | null;
}) {
  if (concepts.length === 0 && !featured) return null;
  return (
    <section
      aria-labelledby="home-concepts"
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--tenant-surface-muted)' }}
    >
      <div className="home-container">
        <CatalogSectionHeader
          id="home-concepts"
          eyebrow={eyebrow}
          title={title}
          body={body}
          href="/concepts"
          linkLabel="XEM TẤT CẢ KHÔNG GIAN"
        />
        {featured && <FeaturedConceptCard featured={featured} />}
        <div className={`grid gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3 ${featured ? 'mt-14' : ''}`}>
          {concepts.map((concept) => (
            <ConceptCard key={concept.slug} concept={concept} priority={false} headingLevel="h3" />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The concept a showroom leads with: its room large, uncropped at 4:3 so the
 * pins stay on their fixtures, its name and facts beside it, and the products
 * the room is made of as thumbnails — the card says "this scene is shoppable"
 * before anyone reads a word of it.
 */
function FeaturedConceptCard({ featured }: { featured: HomeFeaturedConcept }) {
  const { card, products } = featured;
  const href = `/concepts/${card.slug}` as Route;

  return (
    <article
      className="grid overflow-hidden bg-white lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
      style={{ borderRadius: 'var(--tenant-radius)', border: '1px solid #E7E5E1' }}
    >
      <Link href={href} className="concept-card relative block" tabIndex={-1} aria-hidden="true">
        <div className="concept-card-frame" style={{ background: '#EEECE8' }}>
          <Image
            src={card.image}
            alt=""
            width={CONCEPT_IMAGE_WIDTH}
            height={CONCEPT_IMAGE_HEIGHT}
            sizes="(max-width: 1023px) 100vw, 58vw"
            className="concept-card-image"
          />
          {card.dots.map((d) => (
            <span key={d.id} className="concept-card-pin" style={{ left: `${d.xPct}%`, top: `${d.yPct}%` }} />
          ))}
        </div>
      </Link>

      <div className="flex flex-col px-6 py-7 md:px-9 md:py-9 xl:px-11 xl:py-10">
        <p
          className="flex items-center gap-3"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.16em', color: 'var(--tenant-accent-ink)' }}
        >
          <span aria-hidden="true" className="h-[3px] w-6" style={{ backgroundColor: 'var(--tenant-accent)' }} />
          KHÔNG GIAN NỔI BẬT
        </p>
        <h3
          className="mt-5"
          style={{ fontSize: 'clamp(28px, 1.3rem + 1vw, 38px)', fontWeight: 500, lineHeight: 1.1, color: 'var(--tenant-ink)' }}
        >
          <Link href={href} className="transition-colors hover:text-[color:var(--tenant-accent-ink)]">
            {card.name ?? card.titleVi}
          </Link>
        </h3>
        {card.name && (
          <p className="mt-2" style={{ fontSize: 17, lineHeight: 1.4, color: MUTED }}>
            {card.titleVi}
          </p>
        )}
        <p className="mt-4" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: '#8A8782' }}>
          {card.metaLabel.toUpperCase()}
        </p>
        <p className="mt-5 line-clamp-3" style={{ fontSize: 14.5, lineHeight: 1.65, color: MUTED }}>
          {card.shortDescription}
        </p>

        {products.length > 0 && (
          <div className="mt-7">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.13em', color: 'var(--tenant-ink)' }}>
              {products.length} {card.curated ? 'SẢN PHẨM GỢI Ý' : 'SẢN PHẨM'}
            </p>
            <ul className="mt-3 grid grid-cols-4 gap-2.5">
              {products.slice(0, 4).map((p, i) => (
                <li key={p.catalogProductId}>
                  <Link href={p.href as Route} className="group block" aria-label={`${p.brand} ${p.sku ?? ''}`}>
                    <span
                      className="relative block aspect-square overflow-hidden"
                      style={{ borderRadius: 4, border: '1px solid #EFEDEA' }}
                    >
                      <StageImage src={p.image} alt="" occupancy={0.78} />
                      <span
                        className="absolute left-1.5 top-1.5 grid h-5 min-w-5 place-items-center px-1"
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          borderRadius: 3,
                          color: 'var(--tenant-accent-contrast)',
                          backgroundColor: 'var(--tenant-accent)',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </span>
                    <span
                      className="mt-1.5 block truncate transition-colors group-hover:text-[color:var(--tenant-accent-ink)]"
                      style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em', color: '#6E6B66' }}
                    >
                      {p.brand}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* Equipment only, from today's catalogue prices — the concept's own estimate. */}
            {card.estimate.kind === 'RANGE' && (
              <p className="mt-4" style={{ fontSize: 12.5, color: MUTED }}>
                Ngân sách thiết bị tham khảo{' '}
                <span style={{ fontWeight: 600, color: 'var(--tenant-price, var(--tenant-ink))' }}>
                  {Math.round(card.estimate.min / 1_000_000)}–{Math.round(card.estimate.max / 1_000_000)} triệu
                </span>
              </p>
            )}
          </div>
        )}

        <Link
          href={href}
          className="mt-8 inline-flex items-center gap-2 self-start transition-colors hover:text-[color:var(--tenant-accent-ink)] lg:mt-auto lg:pt-8"
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-ink)' }}
        >
          KHÁM PHÁ KHÔNG GIAN <span aria-hidden="true" style={{ color: 'var(--tenant-accent-ink)' }}>→</span>
        </Link>
      </div>
    </article>
  );
}

export function RetailProductGrid({
  eyebrow,
  title,
  note,
  products,
  tenantId,
  addLabel,
}: {
  eyebrow?: string;
  title: string;
  note?: string;
  products: HomeProductView[];
  tenantId: string;
  addLabel: string;
}) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="home-products" className="bg-white py-16 md:py-24">
      <div className="home-container">
        <CatalogSectionHeader
          id="home-products"
          eyebrow={eyebrow}
          title={title}
          href="/products"
          linkLabel="XEM TẤT CẢ SẢN PHẨM"
        />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <RetailProductCard key={product.id} product={product} tenantId={tenantId} addLabel={addLabel} />
          ))}
        </div>
        {note && (
          <p className="mt-6" style={{ fontSize: 12.5, color: '#8A8782' }}>
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Brands the catalogue actually carries, with how many products each. A
 * typeset wordmark rather than a logo wall: only some brands have a cleared
 * logo file, and a row that mixes logos with plain names reads as unfinished.
 */
export function BrandStrip({ title, brands }: { title: string; brands: HomeBrand[] }) {
  if (brands.length === 0) return null;
  return (
    <section aria-labelledby="home-brands" className="bg-white pb-16 md:pb-24">
      <div className="home-container">
        <div
          className="flex flex-col gap-6 py-7 md:flex-row md:items-center md:gap-12"
          style={{ borderBlock: '1px solid #E7E5E1' }}
        >
          <h2
            id="home-brands"
            className="shrink-0"
            style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.16em', color: '#8A8782' }}
          >
            {title}
          </h2>
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {brands.map((brand) => (
              <li key={brand.name}>
                <Link
                  href={brand.href as Route}
                  className="group flex items-baseline gap-2"
                  aria-label={`${brand.name}: ${brand.count} sản phẩm`}
                >
                  <span
                    className="transition-colors group-hover:text-[color:var(--tenant-accent-ink)]"
                    style={{ fontSize: 17, fontWeight: 600, letterSpacing: '.06em', color: 'var(--tenant-ink)' }}
                  >
                    {brand.name.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: '#8A8782' }}>{brand.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
