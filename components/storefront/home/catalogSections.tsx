import Link from 'next/link';
import type { Route } from 'next';
import type { ConceptCardModel } from '@/lib/storefront/conceptTypes';
import type { HomeBrand, HomeProductView } from '@/lib/storefront/tenantHome';
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
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  concepts: ConceptCardModel[];
}) {
  if (concepts.length === 0) return null;
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
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
          {concepts.map((concept) => (
            <ConceptCard key={concept.slug} concept={concept} priority={false} headingLevel="h3" />
          ))}
        </div>
      </div>
    </section>
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
