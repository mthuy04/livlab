'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { LandingHotspot, LandingImage, TenantCopy } from '@/lib/storefront/tenantExperience';
import styles from './ArchitecturalLanding.module.css';

export default function ArchitecturalHero({
  copy,
  image,
  hotspots,
}: {
  copy: TenantCopy['hero'];
  image: LandingImage;
  hotspots: LandingHotspot[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = hotspots[activeIndex];

  return (
    <section className={styles.hero} aria-labelledby="giangson-hero-title">
      <div className={`${styles.heroGrid} home-container`}>
        <div className={styles.heroCopy}>
          {copy.eyebrow && <p className={styles.eyebrow}>{copy.eyebrow}</p>}
          <h1 id="giangson-hero-title" className={styles.heroTitle}>
            {copy.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={styles.heroBody}>{copy.body}</p>

          <div className={styles.heroActions}>
            <Link href={copy.primaryCta.href as Route} className={styles.primaryButton}>
              {copy.primaryCta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
            {copy.secondaryCta && (
              <Link href={copy.secondaryCta.href as Route} className={styles.secondaryButton}>
                {copy.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        <div className={styles.heroVisual}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="(max-width: 767px) 100vw, 55vw"
            className={styles.heroImage}
          />
          <div className={styles.imageShade} aria-hidden="true" />

          {hotspots.map((hotspot, index) => (
            <button
              key={hotspot.label}
              type="button"
              aria-label={`Xem ${hotspot.label}`}
              aria-pressed={index === activeIndex}
              className={styles.hotspot}
              style={{ left: `${hotspot.xPct}%`, top: `${hotspot.yPct}%` }}
              onClick={() => setActiveIndex(index)}
            >
              <span>{index + 1}</span>
            </button>
          ))}

          {active && (
            <div className={styles.hotspotCard} aria-live="polite">
              <p>{`GỢI Ý ${activeIndex + 1}/${hotspots.length}`}</p>
              <strong>{active.label}</strong>
              <span>{active.detail}</span>
              <Link href={active.href as Route}>TRAO ĐỔI NHU CẦU →</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
