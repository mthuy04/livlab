import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/storefront/primitives';
import { ArrowLink, TEXT } from './editorial';

/**
 * The hero: one bright bathroom photograph, text on the left.
 *
 * The only gradient on the page is the left-side scrim below, and it stops
 * well before the middle so the room stays the subject.
 */
export const HERO_IMAGE = '/images/concept-japandi-bathroom.png';

export default function HomeHero({ roomStudio }: { roomStudio: boolean }) {
  return (
    <section className="relative flex items-center" style={{ height: 'clamp(560px, 74svh, 760px)' }}>
      <Image
        src={HERO_IMAGE}
        alt="Phòng tắm sáng với bồn tắm, bàn đá và vòi gắn tường"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.28) 26%, rgba(0,0,0,0) 58%)' }}
      />

      <Container>
        {/* Sits a little below centre, as the reference layouts do. */}
        {/* 520px is the locked content width; the headline's first line needs
            a little more than that at 56px, so desktop gets 600. */}
        <div className="relative max-w-[520px] pt-[8svh] lg:max-w-[600px]">
          <h1
            className="text-white"
            style={{
              fontSize: 'clamp(36px, 1.4rem + 2.2vw, 56px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Không gian phòng tắm,<br />được hình dung trước khi lựa chọn.
          </h1>
          <p
            className="mt-6"
            style={{ fontSize: 'clamp(15px, 0.9rem + 0.2vw, 16px)', lineHeight: 1.65, color: 'rgba(255,255,255,0.86)' }}
          >
            Khám phá sản phẩm thật trong từng không gian, thử trực tiếp với kích thước phòng của bạn và
            tiếp tục tư vấn cùng showroom.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5">
            <Link
              href="/concepts"
              className="inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 48,
                padding: '0 26px',
                borderRadius: 2,
                backgroundColor: 'var(--tenant-accent)',
                color: 'var(--tenant-accent-contrast)',
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '.08em',
              }}
            >
              KHÁM PHÁ KHÔNG GIAN
            </Link>
            {roomStudio && <ArrowLink href="/room-studio" tone="light">MỞ ROOM STUDIO</ArrowLink>}
          </div>
        </div>
      </Container>
      <span className="sr-only" style={{ color: TEXT }} />
    </section>
  );
}
