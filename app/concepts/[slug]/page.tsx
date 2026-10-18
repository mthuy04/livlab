import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getConceptBySlug, publishedSlugs } from '@/lib/storefront/concepts';
import {
  AREA_BAND_LABEL,
  STYLE_FACET_LABEL,
  STYLE_FACET_OF,
  groupByZone,
  toHotspotViews,
} from '@/lib/storefront/conceptTypes';
import { DIVIDER, TEXT, TEXT_FAINT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import ConceptStage from '@/components/storefront/concepts/ConceptStage';
import ConceptProductList from '@/components/storefront/concepts/ConceptProductList';
import ConceptStory from '@/components/storefront/concepts/ConceptStory';
import CommerceConceptPage from '@/components/storefront/concepts/CommerceConceptPage';

/**
 * One concept, on the server.
 *
 * The page this replaces was a client component handed only a slug, which it
 * resolved against a library in localStorage — so a concept URL opened cold,
 * from a message or by a crawler, found nothing. Everything a customer reads
 * is rendered here; the stage is the only island.
 *
 * Four different failures share one answer. An unknown slug, an archived
 * concept, another tenant's concept, and a concept that has fallen below the
 * publication bar all return `notFound()`, because telling them apart in the
 * response would confirm to a crawler which slugs exist on storefronts it
 * cannot see.
 */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const resolved = await getConceptBySlug(tenant, slug);

  if (!resolved) {
    return { title: `Không tìm thấy không gian | ${tenant.brand.name}`, robots: { index: false } };
  }

  const { concept } = resolved;
  const name = concept.presentation?.leadWithName ? `${concept.title} — ${concept.titleVi}` : concept.titleVi;
  return {
    title: `${name} | ${tenant.brand.name}`,
    description: concept.shortDescription,
    alternates: { canonical: `/concepts/${concept.slug}` },
    openGraph: {
      title: `${name} | ${tenant.brand.name}`,
      description: concept.shortDescription,
      images: [{ url: concept.canonicalImage, width: 1448, height: 1086, alt: concept.imageAlt }],
    },
  };
}

export default async function ConceptDetailPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await resolveTenant();
  const resolved = await getConceptBySlug(tenant, slug);
  if (!resolved) notFound();

  // A storefront on the `commerce` treatment gets the shoppable layout; the
  // resolution, the 404 rules and the stage are the same either way.
  if (tenant.experience.variants.conceptDetail === 'commerce') {
    return <CommerceConceptPage tenant={tenant} resolved={resolved} />;
  }

  const { concept, products, estimate } = resolved;
  const hotspots = toHotspotViews(resolved);
  const zones = groupByZone(resolved);
  const exactCount = products.filter((p) => p.match === 'EXACT_VISUAL').length;

  return (
    <>
      <div className="home-container" style={{ paddingTop: 26, paddingBottom: 26 }}>
        <nav aria-label="Breadcrumb">
          <ol
            className="flex flex-wrap items-center gap-2"
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.10em', color: TEXT_MUTED }}
          >
            <li>
              <Link href={'/' as Route} className="transition-opacity hover:opacity-60">TRANG CHỦ</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={'/concepts' as Route} className="transition-opacity hover:opacity-60">KHÔNG GIAN</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: TEXT }}>{concept.title.toUpperCase()}</li>
          </ol>
        </nav>

        <p
          style={{
            marginTop: 22,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.12em',
            color: TEXT_FAINT,
            textTransform: 'uppercase',
          }}
        >
          {STYLE_FACET_LABEL[STYLE_FACET_OF[concept.style]]} · {AREA_BAND_LABEL[concept.areaBand]}
        </p>

        <h1
          style={{
            marginTop: 10,
            fontSize: 'clamp(27px, 1.5rem + 1vw, 41px)',
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: '.01em',
            color: TEXT,
          }}
        >
          {concept.titleVi}
        </h1>

        <p className="max-w-[680px]" style={{ marginTop: 14, fontSize: 15, lineHeight: 1.68, color: TEXT_MUTED }}>
          {concept.shortDescription}
        </p>
      </div>

      <div className="home-container" style={{ paddingBottom: 18 }}>
        <ConceptStage image={concept.canonicalImage} imageAlt={concept.imageAlt} hotspots={hotspots} />
      </div>

      <ConceptStory heading={concept.titleVi} story={concept.conceptStory} principles={concept.designPrinciples} />

      <ConceptProductList zones={zones} exactCount={exactCount} />

      <div className="home-container" style={{ paddingTop: 44, paddingBottom: 96 }}>
        <div style={{ borderTop: `1px solid ${DIVIDER}`, paddingTop: 40 }}>
          {estimate.kind === 'RANGE' ? (
            <>
              <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
                GIÁ THIẾT BỊ ƯỚC TÍNH
              </h2>
              <p style={{ marginTop: 12, fontSize: 'clamp(23px, 1.3rem + .7vw, 32px)', fontWeight: 500, color: TEXT }}>
                {Math.round(estimate.min / 1_000_000)}–{Math.round(estimate.max / 1_000_000)} triệu
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
                GIÁ THIẾT BỊ
              </h2>
              <p style={{ marginTop: 12, fontSize: 20, fontWeight: 500, color: TEXT }}>Liên hệ showroom</p>
            </>
          )}

          <p className="max-w-[600px]" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.65, color: TEXT_MUTED }}>
            Ước tính dựa trên các sản phẩm đã xác định trong concept. Chi phí hoàn thiện và lắp đặt
            được showroom xác nhận riêng.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-10 gap-y-4">
            <Link
              href={'/quote' as Route}
              style={{
                display: 'inline-block',
                padding: '16px 30px',
                background: TEXT,
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.1em',
              }}
            >
              YÊU CẦU BÁO GIÁ CHO KHÔNG GIAN NÀY
            </Link>
            <Link
              href={'/concepts' as Route}
              className="transition-opacity hover:opacity-60"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: TEXT }}
            >
              ← XEM KHÔNG GIAN KHÁC
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
