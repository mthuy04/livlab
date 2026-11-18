'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import type { HomeCategory } from '@/lib/storefront/tenantHome';
import s from './CategoryKeywords.module.css';

/**
 * The `keywords` category navigation — LivLab's homepage (V3 spec).
 *
 * Five product categories, in a fixed order, each a real link with its live
 * count, shown as a centred stack of words. Idle: one word (LAVABO) dark, the
 * rest pale, no photograph. On hover or keyboard focus the word under the
 * pointer goes dark and one small photograph eases in beside it, partly
 * behind its letters; leaving the list returns to the idle state. All
 * products is the heading's own link, not a sixth word.
 *
 * The photograph is decoration: no pointer events, no layout space, alt "".
 * Touch screens and phones get a small inline image per word instead, and a
 * single tap follows the link.
 */

/** The five categories, in the order the spec fixes, by catalogue name. */
const ORDER = ['Bồn cầu', 'Lavabo', 'Vòi lavabo', 'Sen tắm', 'Gương & phụ kiện'];
const IDLE = 'Lavabo';
const PREVIEW_W = 168;
const PREVIEW_H = 210;
/** Past the end of the word, or before its start — alternating down the list. */
const SIDE: Array<'end' | 'start'> = ['end', 'start', 'end', 'start', 'end'];
const OUT_MS = 260;

type Preview = { src: string; alt: string; focus?: string };
type Item = { name: string; label: string; href: string; count: number; preview?: Preview };
type Layer = { index: number; top: number; left: number; leaving: boolean; id: number };

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
  const idle = Math.max(
    0,
    items.findIndex((i) => i.name === IDLE)
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [active, setActive] = useState(idle);
  const [layers, setLayers] = useState<Layer[]>([]);
  const seq = useRef(0);

  const place = useCallback((index: number) => {
    const stage = stageRef.current?.getBoundingClientRect();
    const word = wordRefs.current[index]?.getBoundingClientRect();
    if (!stage || !word) return null;
    const left =
      SIDE[index % SIDE.length] === 'end'
        ? word.right - stage.left - PREVIEW_W * 0.32
        : word.left - stage.left - PREVIEW_W * 0.68;
    const top = word.top - stage.top + word.height / 2 - PREVIEW_H * 0.6;
    return { left: Math.max(0, Math.min(left, stage.width - PREVIEW_W)), top };
  }, []);

  /** Hover or focus: the word goes dark and its photograph eases in. */
  const activate = useCallback(
    (index: number) => {
      setActive(index);
      if (!items[index]?.preview) return;
      const at = place(index);
      if (!at) return;
      setLayers((current) => {
        if (current.some((l) => !l.leaving && l.index === index)) return current;
        const id = ++seq.current;
        return [...current.filter((l) => !l.leaving).map((l) => ({ ...l, leaving: true })), { index, ...at, leaving: false, id }];
      });
    },
    [items, place]
  );

  /** Leaving the list: back to the idle word, no photograph. */
  const reset = useCallback(() => {
    setActive(idle);
    setLayers((current) => current.map((l) => ({ ...l, leaving: true })));
  }, [idle]);

  useEffect(() => {
    if (!layers.some((l) => l.leaving)) return;
    const t = window.setTimeout(() => setLayers((current) => current.filter((l) => !l.leaving)), OUT_MS + 40);
    return () => window.clearTimeout(t);
  }, [layers]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="home-category-rail" className={s.section}>
      <div className="home-container">
        <div className={s.head}>
          <div>
            <h2 id="home-category-rail" className={s.heading}>
              {title}
            </h2>
            {intro && <p className={s.intro}>{intro}</p>}
          </div>
          <Link href={'/products' as Route} className={s.all}>
            XEM TẤT CẢ {productCount} SẢN PHẨM →
          </Link>
        </div>

        <div
          ref={stageRef}
          className={s.stage}
          onMouseLeave={reset}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) reset();
          }}
        >
          <ul className={s.list}>
            {items.map((item, index) => (
              <li key={item.name}>
                <Link
                  href={item.href as Route}
                  className={s.item}
                  data-on={active === index || undefined}
                  onMouseEnter={() => activate(index)}
                  onFocus={() => activate(index)}
                >
                  {item.preview && (
                    <span className={s.thumb} aria-hidden="true">
                      <Image
                        src={item.preview.src}
                        alt=""
                        width={40}
                        height={50}
                        loading="lazy"
                        style={{ objectPosition: item.preview.focus }}
                      />
                    </span>
                  )}
                  <span
                    className={s.word}
                    ref={(el) => {
                      wordRefs.current[index] = el;
                    }}
                  >
                    {item.label}
                    <sup className={s.index} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </sup>
                    {/* The live count, shown for the dark word only. */}
                    <span className={s.count} aria-hidden="true">
                      {item.count} sản phẩm
                    </span>
                  </span>
                  <span className="sr-only">, {item.count} sản phẩm</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className={s.previews} aria-hidden="true">
            {layers.map((layer) => {
              const preview = items[layer.index]?.preview;
              if (!preview) return null;
              return (
                <div
                  key={layer.id}
                  className={`${s.preview} ${layer.leaving ? s.leaving : ''}`}
                  style={{ top: layer.top, left: layer.left, width: PREVIEW_W, height: PREVIEW_H }}
                >
                  <Image src={preview.src} alt="" fill sizes={`${PREVIEW_W}px`} style={{ objectPosition: preview.focus }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
