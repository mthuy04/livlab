import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Inter } from 'next/font/google';
import { ArrowRight } from 'lucide-react';
import type { TenantCopy, TenantExperience } from '@/lib/storefront/tenantExperience';
import s from './ClosingScene.module.css';

/**
 * The `scene` closing section — LivLab's homepage, built to the approved
 * 1920 × 819 reference (18 Nov 2026).
 *
 * One full-bleed scene: a warm taupe plaster wall on the left carrying the
 * eyebrow, one H2 in two lines, a short description and two actions; the
 * bathroom beyond it on the right. The scene is a clean render with no text
 * in it; every letter and both actions are real HTML. Phones stack the copy,
 * on the same wall, over the bathroom alone.
 *
 * The actions keep the routes the previous closing section used: the quote
 * request page and the contact page. Set in Inter, like the categories
 * heading, for this section only.
 */
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

type Scene = NonNullable<NonNullable<TenantExperience['merchandising']>['closingScene']>;

export default function ClosingScene({
  copy,
  scene,
  quotations,
}: {
  copy: NonNullable<TenantCopy['closing']>;
  scene: Scene;
  quotations: boolean;
}) {
  return (
    <section className={`${s.section} ${inter.className}`} aria-labelledby="home-closing-title">
      <div className={s.scene}>
        {/* Decorative: the wall and the bathroom carry no information. */}
        <div className={s.backdrop} aria-hidden="true">
          <Image
            src={scene.background.src}
            alt=""
            fill
            sizes="(max-width: 899px) 340vw, 100vw"
            className={s.background}
          />
        </div>
        <div className={s.content}>
          <p className={s.eyebrow}>{copy.eyebrow}</p>
          <h2 id="home-closing-title" className={s.title}>
            {copy.titleLines.map((line, i) => (
              <span key={line} className={s.line}>
                {i > 0 && ' '}
                {line}
              </span>
            ))}
          </h2>
          <p className={s.body}>{copy.body}</p>
          <div className={s.actions}>
            {quotations && (
              <Link href={'/quote' as Route} className={`${s.action} ${s.primary}`}>
                {copy.primaryCta}
                <ArrowRight className={s.arrow} strokeWidth={1.6} aria-hidden="true" />
              </Link>
            )}
            <Link href={'/contact' as Route} className={`${s.action} ${s.secondary}`}>
              {copy.secondaryCta}
              <ArrowRight className={s.arrow} strokeWidth={1.6} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className={s.photo} aria-hidden="true">
        <Image src={scene.mobile.src} alt="" fill sizes="100vw" className={s.photoImage} />
      </div>
    </section>
  );
}
