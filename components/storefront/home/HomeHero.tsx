import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/storefront/primitives';

/**
 * The hero: one dark bathroom photograph, a compact block of text on the left.
 *
 * The photograph is the subject. The type sits inside 480px against a 1536px
 * stage, and the scrim is fully transparent by 68% so the stone, the joinery
 * and both basins stay readable.
 */
export const HERO_IMAGE = '/images/hero-bathroom-luxury.png';

export default function HomeHero({ roomStudio }: { roomStudio: boolean }) {
  return (
    <section className="relative flex items-center" style={{ height: 'clamp(520px, 68svh, 660px)' }}>
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
            'linear-gradient(90deg, rgba(0,0,0,.58) 0%, rgba(0,0,0,.42) 24%, rgba(0,0,0,.20) 45%, rgba(0,0,0,0) 68%)',
        }}
      />

      <Container>
        {/* The offset settles the block's centre at ~55% of the hero height. */}
        <div className="relative max-w-[480px] mt-[7svh]">
          <h1
            style={{
              // 43px at 1536, 42 at 1440, 38 at 1024, 34 on a phone.
              //
              // The brief asked for 46px inside a 480px block, but "Thấy trước
              // không gian." needs ~505px at that size, so it broke to three
              // lines. Two lines inside 480px is the constraint that matters,
              // and 43px is the largest size that holds it.
              fontSize: 'clamp(34px, 28px + 0.977vw, 43px)',
              fontWeight: 500,
              lineHeight: 1.12,
              letterSpacing: '-0.015em',
              color: '#FFFFFF',
            }}
          >
            Thấy trước không gian.<br />Chọn đúng thiết bị.
          </h1>
          <p
            className="max-w-[470px]"
            style={{ marginTop: 22, fontSize: 16, fontWeight: 400, lineHeight: 1.65, color: 'rgba(255,255,255,0.88)' }}
          >
            Khám phá thiết bị thật trong từng không gian và thử trực tiếp với kích thước phòng của bạn.
          </p>
          <div className="flex flex-wrap items-center gap-y-4" style={{ marginTop: 30, columnGap: 30 }}>
            <Link
              href="/concepts"
              className="inline-flex items-center transition-opacity hover:opacity-85"
              style={{
                height: 42,
                paddingInline: 18,
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                color: 'var(--tenant-accent)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.08em',
              }}
            >
              KHÁM PHÁ KHÔNG GIAN
            </Link>
            {roomStudio && (
              <Link
                href="/room-studio"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', color: '#FFFFFF' }}
              >
                MỞ ROOM STUDIO <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
