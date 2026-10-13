import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';

/**
 * The homepage's design tokens and its shared pieces.
 *
 * Bright neutral canvas, one accent used sparingly, no shadow on content, no
 * radius. Sections import these rather than restating colours and sizes.
 */

export const BG_SOFT = '#F7F7F5';
export const STAGE = '#F6F6F4';
export const DIVIDER = '#E5E5E5';
export const TEXT = '#262626';
export const TEXT_MUTED = '#666666';

/** Section title on the left, "xem tất cả" on the right. */
export function SectionHeader({ title, href }: { title: string; href?: Route | string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 md:mb-12">
      <h2
        style={{
          fontSize: 'clamp(30px, 1.4rem + 1vw, 36px)',
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: '.015em',
          color: TEXT,
        }}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href as Route}
          className="shrink-0 transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: '#333333' }}
        >
          XEM TẤT CẢ →
        </Link>
      )}
    </div>
  );
}

/** A small uppercase text link with an arrow. Most actions are one of these. */
export function ArrowLink({
  href,
  children,
  tone = 'dark',
}: {
  href: Route | string;
  children: ReactNode;
  tone?: 'dark' | 'light';
}) {
  return (
    <Link
      href={href as Route}
      className="inline-block shrink-0 transition-opacity hover:opacity-60"
      style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '.08em',
        color: tone === 'light' ? '#FFFFFF' : TEXT,
      }}
    >
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

/** The filled action. There are three on the page and no more. */
export function SolidLink({
  href,
  children,
  tone = 'accent',
}: {
  href: Route | string;
  children: ReactNode;
  tone?: 'accent' | 'white';
}) {
  const onWhite = tone === 'white';
  return (
    <Link
      href={href as Route}
      className="inline-flex items-center transition-opacity hover:opacity-85"
      style={{
        height: 43,
        paddingInline: 20,
        backgroundColor: onWhite ? '#FFFFFF' : 'var(--tenant-accent)',
        color: onWhite ? 'var(--tenant-accent)' : 'var(--tenant-accent-contrast)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '.09em',
      }}
    >
      {children}
    </Link>
  );
}

/**
 * The product stage: a neutral square the product is scaled into, so a toilet
 * that fills its source frame and a basin that floats in white read at the
 * same size. `scale` comes from the measured asset — see homepageData.
 */
export function ProductStage({
  src,
  alt,
  scale,
  sizes,
  ratio = '1 / 1.04',
  inset = '12%',
}: {
  src: string;
  alt: string;
  scale: number;
  sizes: string;
  ratio?: string;
  inset?: string;
}) {
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: STAGE, aspectRatio: ratio }}>
      <div className="absolute" style={{ inset }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          sizes={sizes}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.025]"
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
