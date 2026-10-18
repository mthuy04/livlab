import Image from 'next/image';
import type { TenantCopy } from '@/lib/storefront/tenantExperience';
import { EDITORIAL_EXPERIENCE } from '@/lib/storefront/tenantExperience';
import { ArrowLink, SolidLink } from './editorial';

/**
 * The hero: one dark bathroom photograph with a compact block of text on it.
 *
 * The scrim is localized to the left and fully transparent by 70%, so the
 * stone, the joinery and both basins stay the subject.
 */
export const HERO_IMAGE = '/images/hero-bathroom-luxury.png';

export default function HomeHero({
  roomStudio,
  copy = EDITORIAL_EXPERIENCE.copy.hero,
}: {
  roomStudio: boolean;
  /** Defaults to the LivLab storefront's own words. */
  copy?: TenantCopy['hero'];
}) {
  return (
    <section className="relative h-[650px] overflow-hidden max-md:h-[72svh] max-md:min-h-[580px]">
      <Image
        src={HERO_IMAGE}
        alt="Phòng tắm tông tối với bàn đá, hai chậu rửa và vòi gắn tường"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.62)_0%,rgba(0,0,0,.44)_25%,rgba(0,0,0,.16)_48%,rgba(0,0,0,0)_70%)]" />

      <div className="home-container relative flex h-full items-center max-md:items-end max-md:pb-14">
        <div className="w-full max-w-[475px] text-white">
          <h1
            className="text-[40px] leading-[1.1] md:text-[44px]"
            style={{ fontWeight: 500, letterSpacing: '-0.025em' }}
          >
            {copy.titleLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-[460px] text-[16px] leading-[1.7] text-white/85">
            {copy.body}
          </p>

          <div className="mt-8 flex items-center gap-8 max-sm:flex-col max-sm:items-start max-sm:gap-5">
            <SolidLink href={copy.primaryCta.href} tone="white">{copy.primaryCta.label}</SolidLink>
            {roomStudio && copy.secondaryCta && (
              <ArrowLink href={copy.secondaryCta.href} tone="light">{copy.secondaryCta.label}</ArrowLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
