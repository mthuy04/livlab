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

export function MaterialsShowcase({ title, body }: { title: string; body?: string }) {
  const items = [
    { name: 'Gạch ốp lát', detail: '5 loại nguồn', href: '/products?category=G%E1%BA%A1ch%20%E1%BB%91p%20l%C3%A1t', mark: '600 × 600' },
    { name: 'Vật liệu ngành nước', detail: '5 loại nguồn', href: '/products?category=V%E1%BA%ADt%20li%E1%BB%87u%20ng%C3%A0nh%20n%C6%B0%E1%BB%9Bc', mark: 'MEP' },
    { name: 'Material Studio', detail: 'Ước tính diện tích sơ bộ', href: '/room-studio', mark: 'm² + hao hụt' },
  ];
  return (
    <section id="materials" aria-labelledby="home-materials" className="py-16 md:py-24" style={{ backgroundColor: 'var(--tenant-surface-muted)' }}>
      <div className="home-container">
        <CatalogSectionHeader id="home-materials" eyebrow="VẬT LIỆU HOÀN THIỆN" title={title} body={body} />
        <div className="grid gap-px overflow-hidden border border-[#D9E6E8] bg-[#D9E6E8] md:grid-cols-3" style={{ borderRadius: 'var(--tenant-radius)' }}>
          {items.map((item) => (
            <Link key={item.name} href={item.href as Route} className="group flex min-h-52 flex-col justify-between bg-white p-7 transition-colors hover:bg-[#F8FBFB] md:p-9">
              <span className="text-[11px] font-semibold tracking-[.14em] text-[color:var(--tenant-accent-ink)]">{item.mark}</span>
              <span>
                <strong className="block text-[22px] font-medium text-[color:var(--tenant-ink)]">{item.name}</strong>
                <span className="mt-2 block text-sm text-[#6D797E]">{item.detail}</span>
                <span className="mt-6 block text-xs font-semibold tracking-[.09em] text-[color:var(--tenant-ink)]">KHÁM PHÁ <span aria-hidden>→</span></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectQuoteShowcase({ title, body }: { title: string; body?: string }) {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="project-quote-title">
      <div className="home-container grid overflow-hidden lg:grid-cols-[1.25fr_.75fr]" style={{ border: '1px solid #D8E4E7', borderRadius: 'var(--tenant-radius)' }}>
        <div className="px-7 py-10 md:px-12 md:py-14">
          <p className="text-[11px] font-semibold tracking-[.16em] text-[color:var(--tenant-accent-ink)]">CHO NHÀ THẦU & DỰ ÁN</p>
          <h2 id="project-quote-title" className="mt-4 text-[clamp(28px,3vw,40px)] font-medium leading-tight text-[color:var(--tenant-ink)]">{title}</h2>
          {body && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#5E6A70]">{body}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={'/project-quote' as Route} className="inline-flex h-12 items-center bg-[color:var(--tenant-accent)] px-6 text-xs font-semibold tracking-[.09em] text-[color:var(--tenant-accent-contrast)]">TẠO YÊU CẦU CÔNG TRÌNH</Link>
            <a href="/demo/giangson/GiangSon_BOQ_Template.xlsx" download className="inline-flex h-12 items-center border border-[#C7D3D6] px-6 text-xs font-semibold tracking-[.09em] text-[color:var(--tenant-ink)]">TẢI MẪU BOQ</a>
          </div>
        </div>
        <div className="grid content-center gap-4 bg-[color:var(--tenant-ink)] px-7 py-10 text-white md:px-10">
          {['Danh mục & quy cách', 'Số lượng theo đơn vị', 'Địa điểm & tiến độ', 'Ghi chú kỹ thuật'].map((item, index) => (
            <div key={item} className="flex items-center gap-4 border-b border-white/15 pb-4 last:border-0">
              <span className="text-xs text-[#78D2D0]">0{index + 1}</span><span className="text-sm font-medium tracking-wide">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutShowroom({ title, body }: { title: string; body?: string }) {
  return (
    <section id="about-giangson" className="py-16 md:py-20" aria-labelledby="about-giangson-title" style={{ backgroundColor: 'var(--tenant-surface-muted)' }}>
      <div className="home-container grid gap-7 md:grid-cols-[.75fr_1.25fr] md:items-start">
        <p className="text-[11px] font-semibold tracking-[.16em] text-[color:var(--tenant-accent-ink)]">HỒ SƠ NGUỒN CÔNG KHAI</p>
        <div>
          <h2 id="about-giangson-title" className="text-[clamp(28px,3vw,40px)] font-medium leading-tight text-[color:var(--tenant-ink)]">{title}</h2>
          {body && <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#5E6A70]">{body}</p>}
          <p className="mt-5 text-xs leading-6 text-[#7A858A]">MST theo hồ sơ nguồn: 0106917237 · Thông tin liên hệ và địa điểm cần doanh nghiệp xác nhận trước khi chuyển sang vận hành chính thức.</p>
        </div>
      </div>
    </section>
  );
}
