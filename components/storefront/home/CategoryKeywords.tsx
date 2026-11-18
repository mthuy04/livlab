'use client';

import { useCallback, useMemo, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Inter } from 'next/font/google';
import type { HomeCategory } from '@/lib/storefront/tenantHome';
import s from './CategoryKeywords.module.css';

/**
 * The `keywords` category navigation — LivLab's homepage, built to the
 * approved editorial-gallery screenshot (18 Nov 2026, 1774 × 887).
 *
 * Five product categories, in a fixed order, each a real link with its live
 * count. On desktop the five words sit in the middle of a floating
 * composition of five photographs — three on the left, two on the right —
 * with a small index/count column at the far right. All five photographs are
 * always visible and never move: hovering or focusing a category keeps its
 * photograph in colour and turns the other four grey, and its word dark while
 * the others fade. Hovering a photograph does the same for its category.
 * Leaving the gallery restores the idle state (everything in colour).
 *
 * Phones get a stacked list instead, each word paired with its photograph;
 * nothing there depends on hover.
 *
 * The photographs repeat the category links, so they are hidden from
 * assistive technology and from the tab order; the words carry the names and
 * the counts.
 */
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

/** The five categories, in the order the spec fixes, by catalogue name. */
const ORDER = ['Bồn cầu', 'Lavabo', 'Vòi lavabo', 'Sen tắm', 'Gương & phụ kiện'];

/**
 * Per-slot photo sizes for `next/image` (share of the viewport the photo
 * occupies on desktop; phones use the inline thumbnail instead).
 */
const PHOTO_SIZES = ['13vw', '19vw', '12vw', '12vw', '13vw'];

type Preview = { src: string; alt: string; focus?: string };
type Item = { name: string; label: string; href: string; count: number; preview?: Preview };

const pad = (n: number) => String(n).padStart(2, '0');

export default function CategoryKeywords({
  title,
  intro,
  categories,
  productCount,
  previews,
}: {
  title: string;
  intro?: string;
  categories: HomeCategory[];
  productCount: number;
  previews: Record<string, Preview>;
}) {
  const items: Item[] = useMemo(
    () =>
      ORDER.map((name) => categories.find((c) => c.name === name))
        .filter((c): c is HomeCategory => Boolean(c))
        .map((c) => ({
          name: c.name,
          label: c.name.toLocaleUpperCase('vi'),
          href: c.href,
          count: c.count,
          preview: previews[c.name],
        })),
    [categories, previews]
  );

  // One shared state for the whole gallery: the active category, or none.
  const [active, setActive] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /** Mouse and pen only: a tap on a touch screen just follows the link. */
  const hover = useCallback(
    (index: number) => (e: PointerEvent) => {
      if (e.pointerType !== 'touch') setActive(index);
    },
    []
  );

  /** Leaving the gallery: idle again, unless keyboard focus is still inside. */
  const leave = useCallback(() => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && stageRef.current?.contains(focused) && focused.matches(':focus-visible')) {
      const index = Number(focused.dataset.index);
      setActive(Number.isFinite(index) ? index : null);
      return;
    }
    setActive(null);
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="home-category-rail" className={`${s.section} ${inter.className}`}>
      <div className={s.inner}>
        <div className={s.head}>
          <div>
            <h2 id="home-category-rail" className={s.heading}>
              {title}
            </h2>
            {intro && <p className={s.intro}>{intro}</p>}
          </div>
          <Link href={'/products' as Route} className={s.all}>
            <span className={s.allLabel}>XEM TẤT CẢ {productCount} SẢN PHẨM</span>
            <span className={s.allArrow} aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div
          ref={stageRef}
          className={s.stage}
          data-active={active !== null || undefined}
          onPointerLeave={leave}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null);
          }}
        >
          {/* The photographs: decorative repeats of the category links. */}
          <div className={s.photos} aria-hidden="true">
            {items.map((item, index) =>
              item.preview ? (
                <Link
                  key={item.name}
                  href={item.href as Route}
                  tabIndex={-1}
                  className={s.photo}
                  data-slot={index + 1}
                  data-on={active === index || undefined}
                  onPointerEnter={hover(index)}
                >
                  <Image
                    src={item.preview.src}
                    alt=""
                    fill
                    sizes={PHOTO_SIZES[index] ?? '13vw'}
                    style={{ objectPosition: item.preview.focus }}
                  />
                </Link>
              ) : null
            )}
          </div>

          <ul className={s.list}>
            {items.map((item, index) => (
              <li key={item.name} className={s.row} data-slot={index + 1}>
                <Link
                  href={item.href as Route}
                  className={s.item}
                  data-index={index}
                  data-on={active === index || undefined}
                  onPointerEnter={hover(index)}
                  onFocus={() => setActive(index)}
                >
                  {item.preview && (
                    <span className={s.thumb} aria-hidden="true">
                      <Image
                        src={item.preview.src}
                        alt=""
                        fill
                        sizes="88px"
                        style={{ objectPosition: item.preview.focus }}
                      />
                    </span>
                  )}
                  <span className={s.text}>
                    <span className={s.word}>
                      {item.label}
                      <sup className={s.index} aria-hidden="true">
                        {pad(index + 1)}
                      </sup>
                    </span>
                    {/* Phones only: the count under the word. */}
                    <span className={s.meta} aria-hidden="true">
                      {item.count} sản phẩm
                    </span>
                  </span>
                  <span className="sr-only">, {item.count} sản phẩm</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Index and live count, repeated from the links above. */}
          <ol className={s.stats} aria-hidden="true">
            {items.map((item, index) => (
              <li key={item.name}>
                {pad(index + 1)} — {pad(item.count)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
