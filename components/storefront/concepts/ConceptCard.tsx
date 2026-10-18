import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { TEXT, TEXT_MUTED, TEXT_FAINT } from '@/components/storefront/home/editorial';
import { AREA_BAND_LABEL, STYLE_FACET_LABEL, type ConceptCardModel } from '@/lib/storefront/conceptTypes';
import { CONCEPT_IMAGE_HEIGHT, CONCEPT_IMAGE_WIDTH } from '@/lib/storefront/conceptLibrary';

/**
 * A concept on the grid.
 *
 * No card: no border, no shadow, no radius, no surface behind the text. The
 * photograph is the object and everything under it is a caption, which is how
 * an interiors magazine sets a room and why the result reads as curation
 * rather than as search results.
 *
 * The dots over the image are the concept's own verified hotspot coordinates,
 * not decoration placed to suggest interactivity. They sit where the products
 * actually are, so the preview and the detail page cannot tell different
 * stories about the same room.
 */
export default function ConceptCard({
  concept,
  priority,
  headingLevel = 'h2',
}: {
  concept: ConceptCardModel;
  priority: boolean;
  /** `h3` where the grid sits under a section heading, as on a homepage. */
  headingLevel?: 'h2' | 'h3';
}) {
  const href = `/concepts/${concept.slug}` as Route;
  const Heading = headingLevel;
  const { estimate } = concept;

  return (
    <article className="concept-card">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <div className="concept-card-frame">
          <Image
            src={concept.image}
            alt={concept.imageAlt}
            width={CONCEPT_IMAGE_WIDTH}
            height={CONCEPT_IMAGE_HEIGHT}
            sizes="(max-width: 1099px) 100vw, 46vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="concept-card-image"
          />
          {concept.dots.map((d) => (
            <span
              key={d.id}
              aria-hidden="true"
              className="concept-card-dot"
              style={{ left: `${d.xPct}%`, top: `${d.yPct}%` }}
            />
          ))}
        </div>
      </Link>

      <p
        style={{
          marginTop: 20,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '.12em',
          color: TEXT_FAINT,
          textTransform: 'uppercase',
        }}
      >
        {STYLE_FACET_LABEL[concept.styleFacet]} · {concept.areaLabel || AREA_BAND_LABEL.MEDIUM}
      </p>

      <Heading
        style={{
          marginTop: 9,
          fontSize: 23,
          fontWeight: 500,
          lineHeight: 1.22,
          letterSpacing: '.005em',
          color: TEXT,
        }}
      >
        <Link href={href} className="transition-opacity hover:opacity-70">
          {concept.titleVi}
        </Link>
      </Heading>

      {/* The card's share of the editorial copy: one sentence on why the room
          is like this. The full story belongs on the detail page — a card that
          carries it stops being a card. */}
      <p className="max-w-[46ch]" style={{ marginTop: 11, fontSize: 14.5, lineHeight: 1.62, color: TEXT_MUTED }}>
        {concept.shortDescription}
      </p>

      <p style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.6, color: TEXT_FAINT }}>
        {concept.productCount} sản phẩm phù hợp
        {estimate.kind === 'RANGE' && (
          <>
            {' · '}
            Khoảng {Math.round(estimate.min / 1_000_000)}–{Math.round(estimate.max / 1_000_000)} triệu
          </>
        )}
      </p>

      <p style={{ marginTop: 20 }}>
        <Link
          href={href}
          className="transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}
        >
          KHÁM PHÁ KHÔNG GIAN →
        </Link>
      </p>
    </article>
  );
}
