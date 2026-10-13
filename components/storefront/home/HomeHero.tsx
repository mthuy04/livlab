import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/storefront/primitives';
import { ArrowLink } from './editorial';

/**
 * The hero: one dark bathroom photograph, text on the left.
 *
 * object-position holds the vanity and basins in frame on a wide screen while
 * the darker left wall carries the type, so the only overlay needed is the
 * localized scrim below — it is fully transparent by 78% and never touches the
 * sanitaryware.
 */
export const HERO_IMAGE = '/images/hero-bathroom-luxury.png';

export default function HomeHero({ roomStudio }: { roomStudio: boolean }) {
  return (
    <section className="relative flex items-center" style={{ height: 'clamp(560px, 74svh, 760px)' }}>
      <Image
        src={HERO_IMAGE}
        alt="Phòng tắm tông tối với bàn đá, hai chậu rửa và vòi gắn tường"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center lg:object-[62%_center]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.42) 32%, rgba(0,0,0,.12) 62%, rgba(0,0,0,0) 78%)',
        }}
      />

      <Container>
        <div className="relative max-w-[560px]">
          <h1
            className="text-white"
            style={{
              fontSize: 'clamp(36px, 1.4rem + 2.2vw, 56px)',
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
            }}
          >
            Thấy trước không gian.<br />Chọn đúng thiết bị.
          </h1>
          <p
            className="mt-6 max-w-[520px]"
            style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.90)' }}
          >
            Khám phá thiết bị thật trong từng không gian, thử theo kích thước phòng và tiếp tục tư vấn
            cùng showroom.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5">
            <Link
              href="/concepts"
              className="inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 46,
                padding: '0 26px',
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                color: 'var(--tenant-accent)',
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
    </section>
  );
}
