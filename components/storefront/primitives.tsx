import type { ReactNode } from 'react';

/**
 * Layout primitives for the storefront.
 *
 * Four of them, not twenty. Their only job is that every page shares the same
 * gutters, max width and vertical rhythm, so hierarchy comes from image scale,
 * type and spacing rather than from each page inventing its own card chrome.
 */

/** Standard reading width. Full-bleed sections simply do not use this. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full ${className}`}
      style={{ maxWidth: 'var(--sf-max-width)', paddingInline: 'var(--sf-gutter)' }}
    >
      {children}
    </div>
  );
}

/**
 * Vertical rhythm. `tight` and `spacious` exist because an editorial page needs
 * a few deliberate breaks in pace, not because every section is configurable.
 */
export function Section({
  children,
  size = 'default',
  className = '',
  muted = false,
}: {
  children: ReactNode;
  size?: 'tight' | 'default' | 'spacious';
  className?: string;
  muted?: boolean;
}) {
  const padding = {
    tight: 'py-10 lg:py-14',
    default: 'py-14 lg:py-20',
    spacious: 'py-20 lg:py-28',
  }[size];

  return (
    <section
      className={`${padding} ${className}`}
      style={muted ? { backgroundColor: 'var(--sf-surface-muted)' } : undefined}
    >
      {children}
    </section>
  );
}

/**
 * Section heading.
 *
 * The optional action is a text link rather than a button: a page with six
 * filled buttons reads as a template, and "Xem tất cả →" carries the same
 * meaning with far less weight.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p
            className="sf-caption mb-3 uppercase"
            style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.1em' }}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="sf-h2">{title}</h2>
        {description && (
          <p className="sf-body-lg mt-3" style={{ color: 'var(--sf-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Editorial image frame.
 *
 * Ratios rather than one rounded card for everything: a tall product shot and
 * a wide room shot should not be forced into the same box. Radius defaults to
 * none because a full-bleed photograph with rounded corners looks like a
 * widget, not a photograph.
 */
export function EditorialImage({
  src,
  alt,
  ratio = '16/9',
  radius = 'none',
  position = 'center',
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  ratio?: '16/9' | '4/3' | '3/4' | '1/1';
  radius?: 'none' | 'sm' | 'md';
  position?: string;
  className?: string;
  priority?: boolean;
}) {
  const radiusValue = { none: '0', sm: 'var(--sf-radius)', md: 'var(--sf-radius-lg)' }[radius];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: ratio.replace('/', ' / '),
        borderRadius: radiusValue,
        backgroundColor: 'var(--sf-surface-muted)',
      }}
    >
      {/* A plain img: these are editorial surfaces whose sizes vary per
          composition, and next/image's layout assumptions fight that. Pages
          that want optimisation keep using next/image directly. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className="h-full w-full object-cover"
        style={{ objectPosition: position }}
      />
    </div>
  );
}
