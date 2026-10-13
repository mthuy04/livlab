import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';

/**
 * The homepage's design tokens and its two shared pieces.
 *
 * Everything here is the locked system: a bright neutral canvas, one accent
 * used sparingly, no shadow on content, no radius above 2px. Sections import
 * these rather than restating colours and sizes.
 */

export const BG = '#FFFFFF';
export const BG_SOFT = '#F5F5F3';
export const STAGE = '#F6F6F5';
export const DIVIDER = '#E5E5E5';
export const TEXT = '#262626';
export const TEXT_MUTED = '#666666';

/** 38/500/.03em desktop, 30px on a phone. One scale for every section. */
export const H2_STYLE = {
  fontSize: 'clamp(30px, 1.5rem + 1vw, 38px)',
  fontWeight: 500,
  lineHeight: 1.15,
  letterSpacing: '.03em',
  color: TEXT,
} as const;

export const BODY_STYLE = {
  fontSize: 'clamp(15px, 0.9rem + 0.2vw, 16px)',
  lineHeight: 1.65,
  color: TEXT_MUTED,
} as const;

/**
 * Half of the gap between sections, applied to each side, so two neighbours
 * add up to the real rhythm: ~98px on a 1536 desktop, 68px on a phone. Giving
 * every section a full 104px top AND bottom was what opened the 200px holes.
 */
export const SECTION_PAD = 'clamp(34px, 3.2vw, 52px)';

/** A text link with an arrow. Most actions on this page are one of these. */
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
      className="group inline-flex shrink-0 items-center gap-2 transition-opacity hover:opacity-60"
      style={{
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '.08em',
        color: tone === 'light' ? '#FFFFFF' : TEXT,
      }}
    >
      <span className="border-b border-transparent group-hover:border-current">{children}</span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/** Section title on the left, "xem tất cả" on the right. */
export function SectionHeader({
  title,
  href,
  action = 'XEM TẤT CẢ',
}: {
  title: string;
  href?: Route | string;
  action?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <h2 style={H2_STYLE}>{title}</h2>
      {href && <ArrowLink href={href}>{action}</ArrowLink>}
    </div>
  );
}

/** 32×6px accent rule. The only place the tenant colour appears in a section. */
export function AccentRule() {
  return (
    <span
      aria-hidden="true"
      className="block"
      style={{ width: 32, height: 6, backgroundColor: 'var(--tenant-accent)' }}
    />
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
  priority = false,
}: {
  src: string;
  alt: string;
  scale: number;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: STAGE, aspectRatio: '1 / 1.05' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}
