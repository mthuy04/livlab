import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { Headset, PackageCheck, Ruler } from 'lucide-react';
import type { TenantCopy } from '@/lib/storefront/tenantExperience';
import type { HomeHeroRoom } from '@/lib/storefront/tenantHome';
import { MATCH_LABEL, TARGET_LABEL } from '@/lib/storefront/conceptTypes';
import { CONCEPT_IMAGE_HEIGHT, CONCEPT_IMAGE_WIDTH } from '@/lib/storefront/conceptLibrary';

/**
 * The `commerce` hero: copy beside a shoppable room.
 *
 * Where the editorial hero sells a mood, this one shows the proposition in a
 * single frame — a room, the showroom's real products pinned to it with their
 * model codes and prices, and the way into it. The room is a published concept
 * resolved against this tenant's catalogue, so every pin is a product the
 * showroom sells today and a pin that stops resolving simply disappears.
 *
 * The pins say what the concept library says about them: these rooms are
 * generated scenes, and the strongest claim the evidence supports is "sản
 * phẩm gợi ý tương đồng". The caption carries that wording.
 */

const MUTED = '#5E5C58';
const FAINT = '#8A8782';

const formatVnd = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

const TRUST_ICONS = [PackageCheck, Ruler, Headset];

export default function CommerceHero({
  copy,
  room,
  productCount,
  brandCount,
  categoryCount,
  roomStudio,
}: {
  copy: TenantCopy['hero'];
  room: HomeHeroRoom | null;
  productCount: number;
  brandCount: number;
  categoryCount: number;
  roomStudio: boolean;
}) {
  const stats = [
    { value: productCount, label: 'THIẾT BỊ' },
    { value: brandCount, label: 'THƯƠNG HIỆU' },
    { value: categoryCount, label: 'DANH MỤC' },
  ].filter((s) => s.value > 0);

  return (
    <section className="bg-white">
      <div className="home-container grid items-center gap-9 pt-7 lg:grid-cols-2 lg:gap-12 lg:pt-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-14">
        <div className="max-w-[520px]">
          {copy.eyebrow && (
            <p
              className="flex flex-wrap items-center gap-x-3 gap-y-1"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.16em', color: 'var(--tenant-ink)' }}
            >
              <span aria-hidden="true" className="h-[3px] w-7" style={{ backgroundColor: 'var(--tenant-accent)' }} />
              {copy.eyebrow}
              {copy.kicker && <span style={{ color: FAINT }}>{copy.kicker}</span>}
            </p>
          )}

          {/* Scales with its column from lg, so each line stays one line. */}
          <h1
            className="mt-6 text-[32px] leading-[1.12] md:text-[42px] lg:text-[clamp(32px,3.1vw,46px)]"
            style={{ fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--tenant-ink)' }}
          >
            {copy.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-[440px]" style={{ fontSize: 16, lineHeight: 1.7, color: MUTED }}>
            {copy.body}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href={copy.primaryCta.href as Route}
              className="inline-flex h-12 items-center bg-[color:var(--tenant-accent)] px-6 transition-colors hover:bg-[color:var(--tenant-accent-hover)]"
              style={{
                borderRadius: 'var(--tenant-radius)',
                color: 'var(--tenant-accent-contrast)',
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '.09em',
              }}
            >
              {copy.primaryCta.label}
            </Link>
            {roomStudio && copy.secondaryCta && (
              <Link
                href={copy.secondaryCta.href as Route}
                className="group inline-flex items-center gap-2 transition-colors hover:text-[color:var(--tenant-accent-ink)]"
                style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '.09em', color: 'var(--tenant-ink)' }}
              >
                {copy.secondaryCta.label}
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'var(--tenant-accent-ink)' }}
                >
                  →
                </span>
              </Link>
            )}
          </div>

          {/* Counted off the catalogue on every request, never typed in. */}
          {stats.length > 0 && (
            <dl className="mt-9 flex items-stretch">
              {stats.map((stat, i) => (
                // Label first in the markup, number first on screen.
                <div
                  key={stat.label}
                  className={`flex flex-col-reverse ${i === 0 ? 'pr-6' : 'px-6'}`}
                  style={i > 0 ? { borderLeft: '1px solid #E4E2DE' } : undefined}
                >
                  <dt className="mt-2" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.14em', color: FAINT }}>
                    {stat.label}
                  </dt>
                  <dd style={{ fontSize: 24, fontWeight: 500, lineHeight: 1, color: 'var(--tenant-ink)' }}>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {room && <HeroRoom room={room} />}
      </div>

      {copy.trust && copy.trust.length > 0 && (
        <div className="home-container mt-7">
          <ul className="grid md:grid-cols-3" style={{ borderBlock: '1px solid #E7E5E1' }}>
            {copy.trust.map((item, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <li
                  key={item.title}
                  // Stacked on a phone, so the dividers run across; side by
                  // side from md, so they stand between the columns.
                  className={`flex items-start gap-3.5 py-4 ${
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
                    <p className="mt-1" style={{ fontSize: 13.5, lineHeight: 1.55, color: MUTED }}>
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

/**
 * The room, with its pins.
 *
 * Hotspot coordinates are percentages of the 4:3 asset, so the asset is never
 * cropped relative to the pins: it sits in an inner 4:3 box that covers the
 * frame (sized with container units), and the pins live in that same box. The
 * frame can then be any shape the layout needs and every pin stays on the
 * fixture it names.
 */
function HeroRoom({ room }: { room: HomeHeroRoom }) {
  const pins = room.hotspots.filter((h) => h.product.showroomPrice).slice(0, 3);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden lg:aspect-auto lg:h-[clamp(360px,47vh,470px)]"
      style={{ borderRadius: 'var(--tenant-radius)', backgroundColor: '#EEECE8', containerType: 'size' }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'max(100cqw, 133.334cqh)', aspectRatio: '4 / 3' }}
      >
        <Image
          src={room.image}
          alt={room.imageAlt}
          width={CONCEPT_IMAGE_WIDTH}
          height={CONCEPT_IMAGE_HEIGHT}
          priority
          sizes="(max-width: 1023px) 100vw, 58vw"
          className="h-full w-full object-cover"
        />

        {pins.map((pin) => {
          const flip = pin.xPct > 58;
          const label = TARGET_LABEL[pin.targetType];
          return (
            <Link
              key={pin.id}
              href={pin.product.href as Route}
              aria-label={`${pin.product.name} — ${formatVnd(pin.product.showroomPrice!)}`}
              className="group absolute z-10"
              style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
            >
              <span
                aria-hidden="true"
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{ width: 16, height: 16, boxShadow: '0 0 0 4px rgba(255,255,255,.35)' }}
              >
                <span
                  className="absolute inset-[4px] rounded-full"
                  style={{ backgroundColor: 'var(--tenant-accent)' }}
                />
              </span>
              <span
                className={`absolute top-0 hidden -translate-y-1/2 whitespace-nowrap bg-white px-3.5 py-2.5 transition-transform group-hover:-translate-y-[55%] sm:block ${
                  flip ? 'right-4' : 'left-4'
                }`}
                style={{ borderRadius: 'var(--tenant-radius)', boxShadow: '0 6px 20px rgba(26,24,20,.14)' }}
              >
                <span className="block" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', color: FAINT }}>
                  {label.toUpperCase()} · {pin.product.brand.toUpperCase()}
                </span>
                <span className="mt-0.5 block" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--tenant-ink)' }}>
                  {pin.product.sku ?? pin.product.name}
                </span>
                <span className="mt-0.5 block" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tenant-price, var(--tenant-ink))' }}>
                  {formatVnd(pin.product.showroomPrice!)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href={`/concepts/${room.slug}` as Route}
        className="group absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-5 bg-white px-4 py-3 sm:right-auto sm:max-w-[440px] lg:bottom-5 lg:left-5"
        style={{ borderRadius: 'var(--tenant-radius)' }}
      >
        <span className="min-w-0">
          <span className="block" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.14em', color: 'var(--tenant-accent-ink)' }}>
            KHÔNG GIAN GỢI Ý
          </span>
          <span className="mt-0.5 block truncate" style={{ fontSize: 14, fontWeight: 500, color: 'var(--tenant-ink)' }}>
            {room.titleVi}
          </span>
          <span className="mt-0.5 block" style={{ fontSize: 12, color: FAINT }}>
            {room.productCount} {MATCH_LABEL.CLOSE_VISUAL_MATCH.toLowerCase()}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ fontSize: 16, color: 'var(--tenant-ink)' }}
        >
          →
        </span>
      </Link>
    </div>
  );
}
