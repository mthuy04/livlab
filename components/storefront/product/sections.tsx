import Link from 'next/link';
import type { Route } from 'next';
import { StageImage, ProductImagePlaceholder } from '@/components/storefront/catalog/ProductImage';
import DimensionsBlock from './DimensionsBlock';
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
    <h2 style={{ fontSize: 'clamp(24px, 1.3rem + .8vw, 32px)', fontWeight: 500, lineHeight: 1.15, letterSpacing: '.005em', color: TEXT }}>
      {children}
    </h2>
  );
}

export function Section({
  id,
  children,
  muted = false,
}: {
  id?: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section id={id} style={muted ? { backgroundColor: '#F6F6F4' } : undefined}>
      <div className="home-container" style={{ paddingBlock: 'clamp(56px, 7vw, 104px)' }}>
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

      <div className="mt-10 flex flex-col gap-12">
        {filled.map((group) => (
          <div key={group.title}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
              {group.title}
            </p>
            {/* Two columns on a desktop, one on a phone. No cards: the rule
                between rows is the structure. */}
            <dl className="mt-5 grid gap-x-16 md:grid-cols-2">
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 py-3.5"
                  style={{ borderBottom: `1px solid ${ROW_BORDER}` }}
                >
                  <dt style={{ fontSize: 13, color: '#737373' }}>{row.label}</dt>
                  <dd className="text-right" style={{ fontSize: 14.5, color: TEXT }}>
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
      />
    </Section>
  );
}

/* ── Technologies ─────────────────────────────────────────────────────── */

/**
 * Names only.
 *
 * The enrichment records which technologies the manufacturer states for this
 * exact SKU; it records no description for any of them. Writing one from
 * general knowledge would be inventing manufacturer copy, so the section
 * lists what is confirmed and points at the page where the manufacturer
 * explains it.
 */
export function Technologies({ vm }: { vm: ProductDetailViewModel }) {
  if (vm.technologies.length === 0) return null;

  return (
    <Section id="cong-nghe">
      <SectionHeading>CÔNG NGHỆ &amp; TÍNH NĂNG</SectionHeading>

      <div className="mt-10 max-w-[860px]">
        {vm.technologies.map((name, index) => (
          <div
            key={name}
            className="py-6"
            style={index === 0 ? undefined : { borderTop: `1px solid ${ROW_BORDER}` }}
          >
            <p style={{ fontSize: 16, fontWeight: 500, letterSpacing: '.03em', color: TEXT }}>{name}</p>
          </div>
        ))}
      </div>

      <p className="mt-6" style={{ fontSize: 12.5, color: TEXT_MUTED }}>
        Theo thông tin {vm.identity.brand} công bố cho mã sản phẩm này
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

      <ul className="mt-10 max-w-[860px]">
        {vm.documents.map((doc) => (
          <li key={doc.url} style={{ borderBottom: `1px solid ${ROW_BORDER}` }}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4 transition-opacity hover:opacity-60"
            >
              <span className="flex-1 min-w-[180px]" style={{ fontSize: 14.5, color: TEXT }}>
                {doc.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: TEXT_MUTED }}>
                {doc.format}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.09em', color: TEXT }}>
                {doc.action === 'DOWNLOAD' ? 'TẢI →' : 'XEM →'}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-5" style={{ fontSize: 12.5, color: TEXT_MUTED }}>
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

  return (
    <Section id="mo-phong" muted>
      <SectionHeading>3D &amp; MÔ PHỎNG</SectionHeading>

      <div className={`mt-10 grid gap-10 ${both ? 'md:grid-cols-2 md:gap-16' : ''}`}>
        {roomStudio.ready && roomStudio.href && (
          <div className="max-w-[460px]">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
              LIVLAB ROOM STUDIO
            </p>
            <p className="mt-4" style={{ fontSize: 16, lineHeight: 1.65, color: TEXT }}>
              Thử sản phẩm trong không gian của bạn.
            </p>
            <p className="mt-5">
              <Link
                href={roomStudio.href as Route}
                className="transition-opacity hover:opacity-60"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-accent)' }}
              >
                THỬ TRONG ROOM STUDIO →
              </Link>
            </p>
          </div>
        )}

        {manufacturerSimulator && (
          <div
            className="max-w-[460px]"
            style={both ? { borderLeft: `1px solid ${DIVIDER}`, paddingLeft: 40 } : undefined}
          >
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
              {manufacturerSimulator.brand.toUpperCase()}
            </p>
            <p className="mt-4" style={{ fontSize: 16, lineHeight: 1.65, color: TEXT }}>
              Sử dụng công cụ mô phỏng do {manufacturerSimulator.brand} cung cấp để khám phá thêm các
              phương án của hãng.
            </p>
            <p className="mt-5">
              <a
                href={manufacturerSimulator.href}
                {...(manufacturerSimulator.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="transition-opacity hover:opacity-60"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-accent)' }}
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
    </Section>
  );
}

/* ── Product rows ─────────────────────────────────────────────────────── */

function ProductTile({ item }: { item: RelatedProductRef }) {
  return (
    <article className="flex flex-col">
      <Link href={item.href as Route} className="block overflow-hidden" style={{ aspectRatio: '1 / 1', border: `1px solid #F0F0EE` }}>
        {item.image && item.presentable ? (
          <StageImage src={item.image} alt={item.name} occupancy={item.occupancy} normalized={false} sizes="25vw" />
        ) : (
          <ProductImagePlaceholder brand={item.brand} sku={item.sku} />
        )}
      </Link>

      <p className="mt-4" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.10em', color: '#808080' }}>
        {item.brand.toUpperCase()}
      </p>
      <h3 className="mt-2">
        <Link
          href={item.href as Route}
          className="line-clamp-2 transition-opacity hover:opacity-60"
          style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.45, color: TEXT }}
        >
          {item.name}
        </Link>
      </h3>
      {item.sku && (
        <p className="mt-1.5" style={{ fontSize: 11.5, color: '#8B8B8B' }}>
          {item.sku}
        </p>
      )}
      <p className="mt-2" style={{ fontSize: 14.5, fontWeight: 600, color: TEXT }}>
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
      <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
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
    <Section>
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
      <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
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
    <section style={{ backgroundColor: 'var(--tenant-accent)', color: '#FFFFFF' }}>
      <div className="home-container" style={{ paddingBlock: 'clamp(56px, 6vw, 92px)' }}>
        <div className="max-w-[640px]">
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.15em', color: 'rgba(255,255,255,.65)' }}>
            TƯ VẤN SHOWROOM
          </p>
          <h2 className="mt-5" style={{ fontSize: 'clamp(26px, 1.4rem + 1.1vw, 36px)', fontWeight: 500, lineHeight: 1.18, letterSpacing: '-0.01em' }}>
            Cần xác nhận trước khi lựa chọn?
          </h2>
          <p className="mt-6" style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,.82)' }}>
            Showroom có thể kiểm tra tình trạng cung ứng, phương án lắp đặt và lập báo giá dựa trên sản
            phẩm bạn đang xem.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-8">
            <Link
              href={'/contact' as Route}
              className="inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 46,
                paddingInline: 26,
                backgroundColor: '#FFFFFF',
                color: 'var(--tenant-accent)',
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
