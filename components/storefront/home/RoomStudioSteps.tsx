'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Inter } from 'next/font/google';
import {
  ArrowRight,
  Box,
  Droplet,
  FileText,
  Layers,
  Monitor,
  MousePointer2,
  Scan,
  Store,
  Tag,
  Toilet,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { TenantCopy } from '@/lib/storefront/tenantExperience';
import s from './RoomStudioSteps.module.css';

/**
 * The `steps` Room Studio section — LivLab's homepage, built to the four
 * approved 1672 × 941 references (18 Nov 2026).
 *
 * One white rounded card. Left: the eyebrow, the step's headline, a short
 * description, three feature rows, the step counter and the yellow call to
 * action. Right: a capture of the editor at that step. Along the
 * bottom: four working tabs. Choosing a tab swaps the copy, the screenshot,
 * the counter and the call to action together; the card never changes size,
 * because all four panels share one grid cell and only the active one shows.
 *
 * All four panels are in the HTML, so every step's copy is indexable. The
 * headline is uppercased in CSS only, set like the categories heading.
 */
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

/** The three feature icons of each step, as drawn in the references. */
const ICONS: LucideIcon[][] = [
  [Scan, Zap, Toilet],
  [Layers, Droplet, Monitor],
  [Box, MousePointer2, Tag],
  [FileText, Store, Wrench],
];

type Steps = NonNullable<TenantCopy['roomStudio']['steps']>;
type StepImage = { src: string; alt: string; width: number; height: number };

const ROOM_STUDIO_HREF = '/room-studio' as Route;

export default function RoomStudioSteps({ steps, images }: { steps: Steps; images: StepImage[] }) {
  const items = steps.items;
  const total = String(items.length).padStart(2, '0');
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const uid = useId();
  const tabId = (i: number) => `${uid}-tab-${i}`;
  const panelId = (i: number) => `${uid}-panel-${i}`;

  /** Arrow keys, Home and End move between tabs and select them. */
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = items.length - 1;
    const next =
      e.key === 'ArrowRight' ? (active === last ? 0 : active + 1)
      : e.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className={s.section} aria-labelledby={`${uid}-title`}>
      <div className={s.wrap}>
        <div className={s.card}>
          <h2 id={`${uid}-title`} className={s.eyebrow}>
            <span className={s.eyebrowLine} aria-hidden="true" />
            {steps.eyebrow}
          </h2>

          <div className={s.panels}>
            {items.map((step, i) => {
              const Icons = ICONS[i] ?? ICONS[0];
              const image = images[i];
              const label = step.cta.replace(/\s*→\s*$/, '');
              return (
                <div
                  key={step.id}
                  id={panelId(i)}
                  role="tabpanel"
                  aria-labelledby={tabId(i)}
                  className={s.panel}
                  data-on={active === i || undefined}
                >
                  <div className={s.copy}>
                    <h3 className={`${s.title} ${inter.className}`}>{step.title}</h3>
                    <p className={s.description}>{step.description}</p>
                    <ul className={s.features}>
                      {step.benefits.map((benefit, b) => {
                        const Icon = Icons[b] ?? Box;
                        return (
                          <li key={benefit} className={s.feature}>
                            <Icon className={s.featureIcon} strokeWidth={1.5} aria-hidden="true" />
                            {benefit}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className={s.action}>
                    <p className={s.counter}>
                      <span className={s.counterNow}>{step.id}</span>
                      <span className={s.counterTotal}> / {total}</span>
                    </p>
                    <Link href={ROOM_STUDIO_HREF} className={s.cta} tabIndex={active === i ? undefined : -1}>
                      {label}
                      <ArrowRight className={s.ctaArrow} strokeWidth={2} aria-hidden="true" />
                    </Link>
                  </div>

                  {image && (
                    <div className={s.frame}>
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        sizes="(max-width: 1099px) 92vw, 58vw"
                        quality={90}
                        className={s.shot}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={s.tabs} role="tablist" aria-label="Các bước trong Room Studio">
            {items.map((step, i) => (
              <button
                key={step.id}
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
                onClick={() => setActive(i)}
                onKeyDown={onKeyDown}
              >
                <span className={s.tabInner}>
                  <span className={s.tabNumber}>{step.id}</span>
                  <span className={s.tabLabel}>{step.tab}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
