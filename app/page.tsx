import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getHomepageData, ROOM_STUDIO_IMAGE } from '@/lib/storefront/homepageData';
import { Container } from '@/components/storefront/primitives';
import ShoppableSpace from '@/components/storefront/home/ShoppableSpace';

/**
 * The storefront homepage.
 *
 * Photography runs edge to edge and type carries the hierarchy: one weight for
 * the headline, one for the body, and a small letterspaced label above each
 * section so you always know where you are. No cards, no shadows on content,
 * no gradient except the one scrim the hero text needs to stay legible.
 */

const INK = '#141412';
const BODY = '#4A4844';
const MUTED = '#86837C';
const LINE = '#DEDCD7';
const SURFACE = '#F4F3F1';

/** One headline scale for the whole page, so sections read as siblings. */
const H2 = {
  fontSize: 'clamp(30px, 1.9rem + 1.7vw, 50px)',
  lineHeight: 1.08,
  fontWeight: 700,
  letterSpacing: '-0.026em',
  color: INK,
} as const;

const EYEBROW = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.16em',
  color: MUTED,
} as const;

function Eyebrow({ children }: { children: string }) {
  return <p style={EYEBROW}>{children.toUpperCase()}</p>;
}

export default async function HomePage() {
  const tenant = await resolveTenant();
  const { categories, featured, collections } = await getHomepageData();

  const money = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu` : `${v.toLocaleString('vi-VN')}đ`;

  return (
    <>
      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-end"
        style={{ minHeight: 'min(max(660px, calc(100svh - 72px)), 820px)' }}
      >
        <Image
          src="/images/hero-bathroom-luxury.png"
          alt="Phòng tắm tông tối với bàn đá và vòi gắn tường"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center lg:object-[66%_center]"
        />
        {/* The only gradient on the page, and only where type sits on photo. */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.32) 48%, rgba(0,0,0,0) 100%)' }}
        />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.20) 42%, rgba(0,0,0,0) 70%)' }}
        />

        <Container>
          <div className="relative max-w-[560px] pb-10 sm:pb-16 lg:max-w-[760px] lg:pb-[92px]">
            <h1
              className="text-white"
              style={{
                fontSize: 'clamp(38px, 2.1rem + 2.6vw, 68px)',
                lineHeight: 1.03,
                fontWeight: 700,
                letterSpacing: '-0.032em',
              }}
            >
              Nhìn thấy phòng tắm<br className="hidden lg:inline" /> trước khi bạn chọn
            </h1>
            <p
              className="mt-6 max-w-[460px]"
              style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}
            >
              Sản phẩm thật từ showroom, phối thử trong đúng kích thước phòng bạn.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-7">
              <Link
                href="/concepts"
                className="inline-flex items-center transition-opacity hover:opacity-90"
                style={{ height: 52, padding: '0 28px', backgroundColor: '#FFFFFF', color: INK, fontSize: 15, fontWeight: 700, letterSpacing: '0.01em' }}
              >
                Khám phá không gian
              </Link>
              {tenant.features.roomStudio && (
                <Link
                  href="/room-studio"
                  className="text-[15px] text-white transition-opacity hover:opacity-75"
                  style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.45)', paddingBottom: 3 }}
                >
                  Thiết kế phòng của tôi →
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Product categories ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section style={{ paddingBlock: 'clamp(72px, 8vw, 116px)' }}>
          <Container>
            <Eyebrow>Danh mục</Eyebrow>
            <h2 className="mt-4" style={H2}>Khám phá sản phẩm</h2>

            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:mt-16 lg:grid-cols-4 lg:gap-x-8">
              {categories.map((category) => (
                <Link key={category.name} href={category.href as Route} className="group block">
                  <div className="overflow-hidden" style={{ backgroundColor: SURFACE }}>
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={640}
                      height={640}
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="aspect-square w-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-5 text-[19px]" style={{ color: INK, fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {category.name} <span style={{ color: MUTED, fontWeight: 400 }}>→</span>
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
                    {category.count} sản phẩm
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 3. Shoppable space — full-bleed photograph ──────────────────── */}
      {featured && featured.hotspots.length > 0 && (
        <section style={{ paddingTop: 'clamp(72px, 8vw, 116px)', paddingBottom: 'clamp(72px, 8vw, 116px)', backgroundColor: SURFACE }}>
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Eyebrow>Không gian</Eyebrow>
                <h2 className="mt-4" style={H2}>Khám phá theo không gian</h2>
              </div>
              <p className="max-w-sm text-[16px] lg:text-right" style={{ color: BODY, lineHeight: 1.65 }}>
                Chạm vào điểm đánh dấu trên ảnh để mở thẳng sản phẩm trong phòng.
              </p>
            </div>
          </Container>

          <div className="mt-12 lg:mt-16">
            <ShoppableSpace room={featured} />
          </div>

          <Container>
            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-lg">
                <p style={{ fontSize: 'clamp(22px, 1.4rem + 0.7vw, 30px)', color: INK, fontWeight: 600, letterSpacing: '-0.018em', lineHeight: 1.2 }}>
                  {featured.title}
                </p>
                {featured.description && (
                  <p className="mt-3 text-[16px]" style={{ color: BODY, lineHeight: 1.65 }}>{featured.description}</p>
                )}
              </div>
              <div className="shrink-0 sm:text-right">
                <p className="text-[14px]" style={{ color: MUTED }}>
                  {featured.products.length} sản phẩm
                  {featured.priceTo ? ` · khoảng ${money(featured.priceTo)}` : ''}
                </p>
                <Link
                  href={`/concepts/${featured.slug}` as Route}
                  className="mt-2 inline-block text-[15px] transition-opacity hover:opacity-70"
                  style={{ color: INK, fontWeight: 700, borderBottom: `2px solid ${INK}`, paddingBottom: 3 }}
                >
                  Dùng không gian này làm điểm bắt đầu
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ── 4. Collections — full-bleed photograph, caption beneath ─────── */}
      {collections.length > 0 && (
        <section style={{ paddingBlock: 'clamp(72px, 8vw, 116px)' }}>
          <Container>
            <Eyebrow>Bộ sưu tập</Eyebrow>
            <h2 className="mt-4" style={H2}>Chọn phong cách của bạn</h2>
          </Container>

          <div className="mt-12 lg:mt-16">
            {collections.slice(0, 3).map((item, index) => (
              <article key={item.slug} style={index > 0 ? { marginTop: 'clamp(56px, 6vw, 88px)' } : undefined}>
                <Link href={`/concepts/${item.slug}` as Route} className="group block overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={2400}
                    height={1200}
                    sizes="100vw"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] sm:aspect-[21/9]"
                  />
                </Link>
                <Container>
                  <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
                    <h3
                      style={{
                        fontSize: 'clamp(26px, 1.7rem + 1.2vw, 40px)',
                        fontWeight: 700,
                        color: INK,
                        letterSpacing: '-0.026em',
                        lineHeight: 1.1,
                      }}
                    >
                      {item.title}
                    </h3>
                    <div>
                      {item.description && (
                        <p className="text-[17px]" style={{ color: BODY, lineHeight: 1.65 }}>{item.description}</p>
                      )}
                      <Link
                        href={`/concepts/${item.slug}` as Route}
                        className="mt-5 inline-block text-[15px] transition-opacity hover:opacity-70"
                        style={{ color: INK, fontWeight: 700, borderBottom: `2px solid ${INK}`, paddingBottom: 3 }}
                      >
                        Khám phá không gian
                      </Link>
                    </div>
                  </div>
                </Container>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Room Studio ──────────────────────────────────────────────── */}
      {tenant.features.roomStudio && (
        <section style={{ paddingBlock: 'clamp(72px, 8vw, 116px)', backgroundColor: SURFACE }}>
          <Container>
            <div className="grid items-center gap-10 lg:grid-cols-[58fr_42fr] lg:gap-20">
              <Image
                src={ROOM_STUDIO_IMAGE}
                alt="Giao diện Room Studio của LivLab"
                width={1672}
                height={1254}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="aspect-[4/3] w-full object-cover"
              />
              <div>
                <Eyebrow>Room Studio</Eyebrow>
                <h2 className="mt-4" style={H2}>Thử trong không gian của bạn</h2>
                <p className="mt-5 text-[17px]" style={{ color: BODY, lineHeight: 1.65 }}>
                  Nhập kích thước phòng, chọn vật liệu sàn và tường, rồi đặt thiết bị thật vào đúng tỉ lệ.
                </p>

                <dl className="mt-9">
                  {[
                    ['Kích thước thực', 'Dài × rộng × cao theo phòng của bạn'],
                    ['Sản phẩm thực', 'Thiết bị trong danh mục, đúng kích thước'],
                    ['Ngân sách tham khảo', 'Cộng dồn theo giá niêm yết'],
                  ].map(([term, detail]) => (
                    <div key={term} className="flex gap-6 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
                      <dt className="w-[150px] shrink-0 text-[15px]" style={{ color: INK, fontWeight: 600 }}>{term}</dt>
                      <dd className="text-[15px]" style={{ color: BODY }}>{detail}</dd>
                    </div>
                  ))}
                </dl>

                <Link
                  href="/room-studio"
                  className="mt-8 inline-block text-[15px] transition-opacity hover:opacity-70"
                  style={{ color: INK, fontWeight: 700, borderBottom: `2px solid ${INK}`, paddingBottom: 3 }}
                >
                  Mở Room Studio
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ── 6. Consultation ─────────────────────────────────────────────── */}
      <section className="flex items-center" style={{ backgroundColor: '#1F1F1D', minHeight: 380 }}>
        <Container>
          <div className="grid gap-10 py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-20 lg:py-0">
            <div className="max-w-xl">
              <p style={{ ...EYEBROW, color: 'rgba(255,255,255,0.5)' }}>TƯ VẤN SHOWROOM</p>
              <h2
                className="mt-4 text-white"
                style={{ fontSize: 'clamp(28px, 1.8rem + 1.4vw, 44px)', fontWeight: 700, letterSpacing: '-0.026em', lineHeight: 1.1 }}
              >
                Cần thêm một góc nhìn trước khi quyết định?
              </h2>
              <p className="mt-5 text-[17px]" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>
                Nhân viên showroom tiếp tục từ chính sản phẩm và không gian bạn đã chọn.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-7">
              <Link
                href="/contact"
                className="inline-flex items-center transition-opacity hover:opacity-90"
                style={{ height: 52, padding: '0 28px', backgroundColor: '#FFFFFF', color: INK, fontSize: 15, fontWeight: 700, letterSpacing: '0.01em' }}
              >
                Nhờ showroom tư vấn
              </Link>
              {tenant.features.quotations && (
                <Link
                  href="/quote"
                  className="text-[15px] text-white transition-opacity hover:opacity-75"
                  style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.45)', paddingBottom: 3 }}
                >
                  Yêu cầu báo giá →
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
