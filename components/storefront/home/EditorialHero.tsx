import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { Inter } from 'next/font/google';
import { ArrowUpRight, Headset, PackageCheck, Ruler } from 'lucide-react';
import type { TenantCopy } from '@/lib/storefront/tenantExperience';
import s from './EditorialHero.module.css';

/**
 * The `editorialCommerce` hero — LivLab's homepage, built to the approved
 * mockup (APPROVED_HERO_VISUAL_REFERENCE.jpg, 1671 × 941).
 *
 * Real DOM throughout: a tracked eyebrow; one H1 whose two lines oppose each
 * other (near-black left, pale grey right); a short description beside the
 * first line; below, a wide fluted-glass band on the left, the bathroom
 * photograph, and a quiet right rail with two real links. No CTA blocks,
 * prices or product pins inside the hero — those live in the sections below.
 *
 * Set in Inter (OFL, self-hosted by next/font) for this hero only: the
 * neo-grotesk the mockup is drawn in, with Vietnamese diacritics.
 */
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

const TRUST_ICONS = [PackageCheck, Ruler, Headset];

export default function EditorialHero({
  copy,
  image,
  glass,
}: {
  copy: TenantCopy['hero'];
  image: { src: string; alt: string; width: number; height: number };
  glass?: { src: string; width: number; height: number };
}) {
  const [first, ...rest] = copy.titleLines;
  const links = copy.railLinks ?? [];

  return (
    <section className={`${s.hero} ${inter.className}`} data-commerce-hero>
      <div className={s.head}>
        {copy.eyebrow && <p className={s.eyebrow}>{copy.eyebrow}</p>}
        <div className={s.titleRow}>
          {/* One H1; the two lines are spans. */}
          <h1 className={s.title}>
            <span className={s.line1}>{first}</span>{' '}
            {rest.map((line) => (
              <span key={line} className={s.line2}>
                {line}
              </span>
            ))}
          </h1>
          <p className={s.desc}>{copy.body}</p>
          <span className={s.rule} aria-hidden="true" />
        </div>
      </div>

      <div className={s.strip}>
        <div className={s.visual}>
          {glass && (
            // Decorative: reeded glass drawing in from the left on load.
            <div className={s.glass} aria-hidden="true">
              <Image src={glass.src} alt="" fill priority sizes="30vw" className={s.glassImg} />
            </div>
          )}
          <figure className={s.figure}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              priority
              sizes="(max-width: 767px) 100vw, 53vw"
              className={s.photo}
            />
          </figure>
        </div>

        <aside className={s.rail}>
          {/* Editorial indicators only: not a slider, not interactive. */}
          <p className={s.index} aria-hidden="true">
            01 <span className={s.indexLine} /> 05
          </p>
          <ul className={s.dots} aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} data-on={i === 0 || undefined} />
            ))}
          </ul>
          {links.length > 0 && (
            <nav className={s.links} aria-label="Khám phá LivLab">
              {links.map((link) => (
                <Link key={link.href} href={link.href as Route} className={s.link}>
                  {link.label}
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.75} />
                </Link>
              ))}
            </nav>
          )}
        </aside>
      </div>

      {/* The feature strip, exactly as the commerce hero renders it. */}
      {copy.trust && copy.trust.length > 0 && (
        <div className={`${s.trust} home-container`} data-hero-trust>
          <ul className="grid md:grid-cols-3" style={{ borderBlock: '1px solid #E7E5E1' }}>
            {copy.trust.map((item, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <li
                  key={item.title}
                  className={`flex items-start gap-3.5 py-3.5 ${
                    i > 0 ? 'border-t border-[#E7E5E1] md:border-l md:border-t-0 md:pl-7' : ''
                  } ${i < copy.trust!.length - 1 ? 'md:pr-7' : ''}`}
                >
                  <Icon
                    className="mt-0.5 h-[22px] w-[22px] shrink-0"
                    strokeWidth={1.4}
                    style={{ color: 'var(--tenant-accent-ink)' }}
                    aria-hidden
                  />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.11em', color: 'var(--tenant-ink)' }}>
                      {item.title}
                    </p>
                    <p className="mt-1" style={{ fontSize: 13, lineHeight: 1.5, color: '#5E5C58' }}>
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
