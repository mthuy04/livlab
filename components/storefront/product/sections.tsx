import Link from 'next/link';
import type { Route } from 'next';
import { StageImage, ProductImagePlaceholder } from '@/components/storefront/catalog/ProductImage';
import DimensionsBlock from './DimensionsBlock';
import { ANCHOR_OFFSET } from './ProductNav';
import { DIVIDER, TEXT, TEXT_MUTED, TEXT_FAINT } from '@/components/storefront/home/editorial';
import {
  formatVnd,
  type ProductDetailViewModel,
  type RelatedProductRef,
  type SpecGroup,
} from '@/lib/storefront/productDetailTypes';

/**
 * The sections below the overview.
 *
 * All server-rendered: none of them has state, and a product page whose
 * specifications arrive after hydration is a product page a search engine
 * cannot read. The two interactive pieces — the gallery and the action rail —
 * live in their own islands.
 *
 * Every one of these returns null when its data is empty. The page's section
 * order is a priority, not a checklist: a page with an overview, a
 * specification table, a drawing and a quote is stronger than one padded out
 * with an empty "Công nghệ" heading to preserve the numbering.
 */

const ROW_BORDER = '#E9E9E6';

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 'clamp(23px, 1.2rem + .62vw, 32px)',
        fontWeight: 500,
        lineHeight: 1.14,
        letterSpacing: '-0.01em',
        color: TEXT,
      }}
    >
      {children}
    </h2>
  );
}

/**
 * A section's height comes from what is in it.
 *
 * Every section used to take the same 104px of air above and below, which
 * made a two-row document list occupy as much of the page as the drawing. The
 * default is tighter now, and `tall` is for the sections that are genuinely
 * visual — the drawing, the related-product grid — rather than a default
 * applied everywhere for drama.
 */
export function Section({
  id,
  children,
  muted = false,
  tall = false,
  compact = false,
}: {
  id?: string;
  children: React.ReactNode;
  muted?: boolean;
  tall?: boolean;
  /** For a section whose content is a few lines however the page grows. */
  compact?: boolean;
}) {
  const paddingBlock = tall
    ? 'clamp(60px, 6.4vw, 100px)'
    : compact
      ? 'clamp(40px, 4vw, 64px)'
      : 'clamp(44px, 4.6vw, 72px)';
  return (
    <section
      id={id}
      style={{
        ...(muted ? { backgroundColor: '#F7F7F5' } : null),
        ...(id ? { scrollMarginTop: ANCHOR_OFFSET } : null),
      }}
    >
      <div className="home-container" style={{ paddingBlock }}>
        {children}
      </div>
    </section>
  );
}

/* ── Specifications ───────────────────────────────────────────────────── */

export function Specifications({ groups }: { groups: SpecGroup[] }) {
  const filled = groups.filter((group) => group.rows.length > 0);
  if (filled.length === 0) return null;

  return (
    <Section id="thong-so">
      <SectionHeading>THÔNG SỐ SẢN PHẨM</SectionHeading>

      {/* Constrained so a short spec list does not drift across a 1360px
          canvas, while the heading stays on the container's own left edge. */}
      <div className="mt-7 flex max-w-[1100px] flex-col gap-8">
        {filled.map((group) => (
          <div key={group.title}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
              {group.title}
            </p>
            {/* Two columns on a desktop, one on a phone. No cards: the rule
                between rows is the structure. */}
            <dl className="mt-3 grid gap-x-20 md:grid-cols-2">
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1"
                  style={{ borderBottom: `1px solid ${ROW_BORDER}`, minHeight: 46, paddingBlock: 12 }}
                >
                  <dt style={{ fontSize: 13, color: '#737373' }}>{row.label}</dt>
                  <dd className="text-right" style={{ fontSize: 14.5, fontWeight: 500, color: TEXT }}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── Dimensions and the technical drawing ─────────────────────────────── */

export function DimensionsAndDrawing({ vm }: { vm: ProductDetailViewModel }) {
  const { dimensions, media } = vm;
  const drawing = media.technicalDrawing;
  if (!dimensions && !drawing) return null;

  // The spec sheet and the CAD both carry the dimensioned drawing; either is a
  // better "xem bản vẽ gốc" than a re-hosted picture of one.
  const drawingDocument =
    vm.documents.find((doc) => doc.label === 'Bản thông số kỹ thuật') ??
    vm.documents.find((doc) => doc.label === 'Tệp CAD') ??
    null;

  return (
    <Section id="ban-ve">
      <SectionHeading>KÍCH THƯỚC &amp; BẢN VẼ KỸ THUẬT</SectionHeading>
      <DimensionsBlock
        drawing={drawing}
        dimensions={dimensions}
        drawingDocument={drawingDocument}
        productName={vm.identity.name}
        brand={vm.identity.brand}
      />
    </Section>
  );
}

/* ── Technologies ─────────────────────────────────────────────────────── */

/**
 * What the manufacturer's technologies actually do.
 *
 * This section used to print bare names — CEFIONTECT, TORNADO — under a 32px
 * heading with nothing beneath them, which reads as an unfinished page rather
 * than a technical claim. The explanations are the brand's own prose, read
 * off the brand's own technology pages by
 * `scripts/enrich_technologies.py`; none of it is written here.
 *
 * Only technologies that have one reach this section. A name without a
 * published explanation is a fact, not an editorial block, so it is stated in
 * the specification table instead and never given invented copy to justify
 * the space.
 */
export function Technologies({ vm }: { vm: ProductDetailViewModel }) {
  if (vm.technologies.length === 0) return null;

  return (
    <Section id="cong-nghe">
      <SectionHeading>CÔNG NGHỆ &amp; TÍNH NĂNG</SectionHeading>

      <div className="mt-7 max-w-[960px]">
        {vm.technologies.map((technology, index) => (
          <article
            key={technology.name}
            className="grid gap-x-12 gap-y-3 py-6 md:grid-cols-[216px_1fr]"
            style={index === 0 ? undefined : { borderTop: `1px solid ${ROW_BORDER}` }}
          >
            <h3
              style={{
                fontSize: 17,
                fontWeight: 500,
                letterSpacing: '.02em',
                lineHeight: 1.3,
                color: TEXT,
              }}
            >
              {technology.name}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.72, color: '#4A4A4A' }}>{technology.description}</p>
          </article>
        ))}
      </div>

      <p className="mt-6 max-w-[960px]" style={{ fontSize: 12.5, color: TEXT_MUTED }}>
        Mô tả theo tài liệu {vm.identity.brand} công bố
        {vm.provenance.manufacturerUrl && (
          <>
            {' · '}
            <a
              href={vm.provenance.manufacturerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-opacity hover:opacity-60"
              style={{ color: TEXT }}
            >
              xem trên trang hãng
            </a>
          </>
        )}
      </p>
    </Section>
  );
}

/* ── Documents ────────────────────────────────────────────────────────── */

export function Documents({ vm }: { vm: ProductDetailViewModel }) {
  if (vm.documents.length === 0) return null;

  return (
    <Section id="tai-lieu">
      <SectionHeading>TÀI LIỆU SẢN PHẨM</SectionHeading>

      {/* Fixed format and action columns: four short rows stretched across a
          1360px canvas is what made this read as an empty section. */}
      <ul className="mt-7 max-w-[1000px]">
        {vm.documents.map((doc) => (
          <li key={doc.url} style={{ borderBottom: `1px solid ${ROW_BORDER}` }}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-8 transition-opacity hover:opacity-60 sm:grid-cols-[1fr_80px_80px]"
              style={{ minHeight: 58 }}
            >
              <span style={{ fontSize: 14.5, color: TEXT }}>{doc.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT_MUTED }}>
                {doc.format}
              </span>
              <span
                className="text-right sm:text-left"
                style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.09em', color: TEXT }}
              >
                {doc.action === 'DOWNLOAD' ? 'TẢI →' : 'XEM →'}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-[1000px]" style={{ fontSize: 12.5, color: TEXT_MUTED }}>
        Tài liệu do hãng phát hành và lưu trữ trên hệ thống của hãng.
      </p>
    </Section>
  );
}

/* ── 3D and simulation ────────────────────────────────────────────────── */

/**
 * Two different things, kept apart.
 *
 * LivLab's Room Studio places a LivLab-made asset in the customer's own room.
 * The manufacturer's simulator is the brand's own tool, opened on a LivLab
 * URL where its headers permit framing and in its own tab where they do not.
 * A manufacturer's CAD, 3DS MAX file or drawing is source material for the
 * first, never a substitute for it — so neither side is labelled simply "3D".
 */
export function Simulation({ vm }: { vm: ProductDetailViewModel }) {
  const { roomStudio, manufacturerSimulator } = vm;
  if (!roomStudio.ready && !manufacturerSimulator) return null;
  const both = roomStudio.ready && Boolean(manufacturerSimulator);

  // Named for what is actually on offer. With only the brand's own tool here,
  // calling the section "3D" would imply LivLab 3D that does not exist yet.
  const heading = both ? '3D & MÔ PHỎNG' : roomStudio.ready ? '3D & MÔ PHỎNG' : 'MÔ PHỎNG SẢN PHẨM';

  return (
    <Section id="mo-phong" muted compact>
      {/* Compact, and horizontal. No preview image is shown because none can
          be produced from the brand's tool without re-hosting a screenshot of
          someone else's product, and a mocked-up 3D render would misrepresent
          what opening it actually gives you. A short typographic block is
          honest; a 400px empty panel is not. */}
      <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <SectionHeading>{heading}</SectionHeading>

        <div className={`grid gap-x-16 gap-y-10 ${both ? 'md:grid-cols-2' : ''}`}>
          {roomStudio.ready && roomStudio.href && (
            <div className="max-w-[480px]">
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
                LIVLAB ROOM STUDIO
              </p>
              <p className="mt-3.5" style={{ fontSize: 15.5, lineHeight: 1.65, color: TEXT }}>
                Thử sản phẩm trong không gian của bạn.
              </p>
              <p className="mt-5">
                <Link
                  href={roomStudio.href as Route}
                  className="transition-opacity duration-150 hover:opacity-60"
                  style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-accent-ink)' }}
                >
                  THỬ TRONG ROOM STUDIO →
                </Link>
              </p>
            </div>
          )}

          {manufacturerSimulator && (
            <div
              className="max-w-[480px]"
              style={both ? { borderLeft: `1px solid ${DIVIDER}`, paddingLeft: 40 } : undefined}
            >
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
                {manufacturerSimulator.brand.toUpperCase()}
              </p>
              <p className="mt-3.5" style={{ fontSize: 15.5, lineHeight: 1.65, color: TEXT }}>
                Sử dụng công cụ mô phỏng do {manufacturerSimulator.brand} cung cấp để khám phá các
                phương án của hãng.
              </p>
              <p className="mt-5">
                <a
                  href={manufacturerSimulator.href}
                  {...(manufacturerSimulator.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="transition-opacity duration-150 hover:opacity-60"
                  style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-accent-ink)' }}
                >
                  MỞ MÔ PHỎNG →
                </a>
              </p>
              <p className="mt-4" style={{ fontSize: 12, color: TEXT_MUTED }}>
                {manufacturerSimulator.attribution}
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ── Product rows ─────────────────────────────────────────────────────── */

function ProductTile({ item }: { item: RelatedProductRef }) {
  return (
    <article className="flex flex-col">
      <Link
        href={item.href as Route}
        className="block overflow-hidden h-[clamp(170px,38vw,230px)] md:h-[clamp(230px,19.6vw,300px)]"
        style={{ border: `1px solid #ECECE8` }}
      >
        {item.image && item.presentable ? (
          <StageImage src={item.image} alt={item.name} occupancy={item.occupancy} normalized={false} sizes="25vw" />
        ) : (
          <ProductImagePlaceholder brand={item.brand} sku={item.sku} />
        )}
      </Link>

      <p className="mt-4" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: '#808080' }}>
        {item.brand.toUpperCase()}
      </p>
      {/* Two lines are reserved whether or not the name needs them, so the
          SKU and the price of every tile in the row share a baseline. */}
      <h3 className="mt-2">
        <Link
          href={item.href as Route}
          className="line-clamp-2 transition-opacity duration-150 hover:opacity-60"
          style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: TEXT, minHeight: 'calc(15px * 1.45 * 2)' }}
        >
          {item.name}
        </Link>
      </h3>
      <p className="mt-1.5" style={{ fontSize: 12, color: '#8B8B8B', minHeight: 17 }}>
        {item.sku ?? '\u00A0'}
      </p>
      <p className="mt-2" style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>
        {/* A product the showroom does not sell carries no showroom price and
            is never routed into a quote as if it did. */}
        {item.referenceOnly ? (
          <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED }}>Tham khảo từ hãng</span>
        ) : item.showroomPrice ? (
          formatVnd(item.showroomPrice)
        ) : (
          <span style={{ fontSize: 13, fontWeight: 400, color: TEXT_FAINT }}>Liên hệ</span>
        )}
      </p>
    </article>
  );
}

export function Compatibility({ items }: { items: RelatedProductRef[] }) {
  if (items.length === 0) return null;
  return (
    <Section id="tuong-thich">
      <SectionHeading>SẢN PHẨM TƯƠNG THÍCH</SectionHeading>
      <p className="mt-4 max-w-[640px]" style={{ fontSize: 14, lineHeight: 1.7, color: TEXT_MUTED }}>
        Theo quan hệ tương thích do hãng công bố.
      </p>
      <div className="mt-9 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
        {items.map((item) => (
          <ProductTile key={item.catalogProductId} item={item} />
        ))}
      </div>
    </Section>
  );
}

export function RelatedProducts({ items, category }: { items: RelatedProductRef[]; category: string }) {
  if (items.length === 0) return null;
  return (
    <Section tall>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <SectionHeading>SẢN PHẨM CÙNG DANH MỤC</SectionHeading>
        <Link
          href={`/products?category=${encodeURIComponent(category)}` as Route}
          className="shrink-0 transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: '#333333' }}
        >
          XEM TẤT CẢ →
        </Link>
      </div>
      <div className="mt-9 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
        {items.map((item) => (
          <ProductTile key={item.catalogProductId} item={item} />
        ))}
      </div>
    </Section>
  );
}

/* ── Closing handoff ──────────────────────────────────────────────────── */

export function Consultation({ quotations }: { quotations: boolean }) {
  return (
    // Identified so the sticky product bar can stand down while this is on
    // screen: it already offers the same two actions.
    <section id="tu-van" style={{ backgroundColor: 'var(--tenant-panel)', color: 'var(--tenant-panel-contrast)' }}>
      <div className="home-container" style={{ paddingBlock: 'clamp(48px, 4.4vw, 72px)' }}>
        <div className="max-w-[620px]">
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.15em', color: 'rgba(255,255,255,.65)' }}>
            TƯ VẤN SHOWROOM
          </p>
          <h2 className="mt-4" style={{ fontSize: 'clamp(25px, 1.3rem + .7vw, 33px)', fontWeight: 500, lineHeight: 1.16, letterSpacing: '-0.01em' }}>
            Cần xác nhận trước khi lựa chọn?
          </h2>
          <p className="mt-5" style={{ fontSize: 15.5, lineHeight: 1.65, color: 'rgba(255,255,255,.82)' }}>
            Showroom có thể kiểm tra tình trạng cung ứng, phương án lắp đặt và lập báo giá dựa trên sản
            phẩm bạn đang xem.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-8">
            <Link
              href={'/contact' as Route}
              className="inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 46,
                paddingInline: 26,
                backgroundColor: '#FFFFFF',
                color: 'var(--tenant-panel)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '.10em',
              }}
            >
              NHỜ SHOWROOM TƯ VẤN
            </Link>
            {quotations && (
              <Link
                href={'/quote' as Route}
                className="transition-opacity hover:opacity-60"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.09em', color: '#FFFFFF' }}
              >
                YÊU CẦU BÁO GIÁ →
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
