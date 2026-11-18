'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Inter } from 'next/font/google';
import { ArrowLeft, ArrowRight, Layers, Maximize2 } from 'lucide-react';
import type { ConceptCardModel } from '@/lib/storefront/conceptTypes';
import { CONCEPT_IMAGE_HEIGHT, CONCEPT_IMAGE_WIDTH } from '@/lib/storefront/conceptLibrary';
import type { TenantCopy } from '@/lib/storefront/tenantExperience';
import s from './SpacesShowcase.module.css';

/**
 * The `spaces` concept section — LivLab's homepage, built to the approved
 * 1821 × 864 reference (18 Nov 2026).
 *
 * One white rounded card. Heading row: eyebrow, H2, intro, and the link to
 * every space. Below, one room at a time: its name, one line, area, product
 * count and the way into it on the left; its photograph in the centre with
 * the room's product pins and a white index label cut into the corner; four
 * vertical tabs with previous / next on the right. The rooms, photographs,
 * pins, areas, counts and links are the concept library's own.
 *
 * All four rooms are in the HTML, stacked in one cell so the card never
 * changes size; the photograph links to the room, whose page carries the
 * interactive hotspots — the same as the section this replaces.
 */
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

type Copy = NonNullable<TenantCopy['sections']['spaces']>;

const pad = (n: number) => String(n).padStart(2, '0');
/** "Hiện đại cao cấp · 10–14 m²" → "10–14 m²": the label is always style · area. */
const areaOf = (c: ConceptCardModel) => c.metaLabel.split(' · ').pop() ?? c.areaLabel;

export default function SpacesShowcase({
  eyebrow,
  title,
  body,
  copy,
  concepts,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  copy: Copy;
  /** The featured room first, then the others, in the library's order. */
  concepts: ConceptCardModel[];
}) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const uid = useId();
  const count = concepts.length;
  if (count === 0) return null;

  const tabId = (i: number) => `${uid}-tab-${i}`;
  const panelId = (i: number) => `${uid}-panel-${i}`;
  const go = (i: number, focus = false) => {
    const next = (i + count) % count;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? active + 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? active - 1
      : e.key === 'Home' ? 0
      : e.key === 'End' ? count - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    go(next, true);
  };

  return (
    <section className={`${s.section} ${inter.className}`} aria-labelledby="home-concepts">
      <div className={s.wrap}>
        <div className={s.card}>
          <div className={s.head}>
            <div>
              {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
              <h2 id="home-concepts" className={s.title}>
                {title}
              </h2>
              {body && <p className={s.body}>{body}</p>}
            </div>
            <Link href={'/concepts' as Route} className={s.seeAll}>
              {copy.seeAll}
              <ArrowRight className={s.seeAllArrow} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>

          <div className={s.main}>
            <div className={s.panels}>
              {concepts.map((c, i) => {
                const name = c.name ?? c.titleVi;
                const href = `/concepts/${c.slug}` as Route;
                const current = active === i;
                return (
                  <div
                    key={c.slug}
                    id={panelId(i)}
                    role="tabpanel"
                    aria-labelledby={tabId(i)}
                    className={s.panel}
                    data-on={current || undefined}
                    data-size={name.length > 18 ? 's' : name.length > 14 ? 'm' : undefined}
                  >
                    <div className={s.copy}>
                      <p className={s.status}>
                        {pad(i + 1)} / {i === 0 ? copy.featuredLabel : copy.entryLabel}
                      </p>
                      <h3 className={s.name}>{name}</h3>
                      <p className={s.summary}>{copy.summaries[c.slug] ?? c.titleVi}</p>
                      <div className={s.meta}>
                        <span className={s.metaItem}>
                          <Maximize2 className={s.metaIcon} strokeWidth={1.5} aria-hidden="true" />
                          {areaOf(c)}
                        </span>
                        <span className={s.metaItem}>
                          <Layers className={s.metaIcon} strokeWidth={1.5} aria-hidden="true" />
                          <span>
                            {c.productCount} {c.curated ? 'sản phẩm gợi ý' : 'sản phẩm'}
                          </span>
                        </span>
                      </div>
                      <Link href={href} className={s.cta} tabIndex={current ? undefined : -1}>
                        {copy.cta}
                        <ArrowRight className={s.ctaArrow} strokeWidth={1.75} aria-hidden="true" />
                      </Link>
                    </div>

                    <div className={s.figure}>
                      <Link href={href} className={s.photoLink} tabIndex={-1}>
                        {/* The photograph's own 4:3 box, centred in the frame as the
                            cover crop places it, so each pin stays on its fixture. */}
                        <span className={s.stage}>
                          <Image
                            src={c.image}
                            alt={c.imageAlt}
                            width={CONCEPT_IMAGE_WIDTH}
                            height={CONCEPT_IMAGE_HEIGHT}
                            sizes="(max-width: 1099px) 92vw, 52vw"
                            className={s.photo}
                          />
                          {c.dots.map((d) => (
                            <span
                              key={d.id}
                              className="concept-card-pin"
                              style={{ left: `${d.xPct}%`, top: `${d.yPct}%` }}
                            />
                          ))}
                        </span>
                      </Link>
                      <p className={s.label} aria-hidden="true">
                        <span className={s.labelNumber}>{pad(i + 1)}</span>
                        <span className={s.labelName}>{copy.navLabels?.[c.slug] ?? name}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={s.nav}>
              <div className={s.arrows}>
                <button type="button" className={s.arrow} onClick={() => go(active - 1)} aria-label="Không gian trước">
                  <ArrowLeft strokeWidth={1.5} aria-hidden="true" />
                </button>
                <button type="button" className={s.arrow} onClick={() => go(active + 1)} aria-label="Không gian tiếp theo">
                  <ArrowRight strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <div className={s.tabs} role="tablist" aria-label="Các không gian gợi ý" aria-orientation="vertical">
                {concepts.map((c, i) => (
                  <button
                    key={c.slug}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={tabId(i)}
                    aria-selected={active === i}
                    aria-controls={panelId(i)}
                    tabIndex={active === i ? 0 : -1}
                    className={s.tab}
                    data-on={active === i || undefined}
                    onClick={() => go(i)}
                    onKeyDown={onKeyDown}
                  >
                    <span className={s.tabName}>{copy.navLabels?.[c.slug] ?? c.name ?? c.titleVi}</span>
                    <span className={s.tabNumber}>{pad(i + 1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
