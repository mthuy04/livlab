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
 * Images and type compose the page; there is no card, no shadow on content, no
 * gradient except the one scrim the hero text needs to stay legible. Section
 * content sits directly on the canvas rather than inside rounded containers.
 */

const INK = '#252525';
const MUTED = '#666666';
const LINE = '#DDDDDD';
const SURFACE = '#F5F5F3';

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
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.30) 48%, rgba(0,0,0,0) 100%)' }}
        />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0) 68%)' }}
        />

        <Container>
          <div className="relative max-w-[560px] pb-9 sm:pb-16 lg:pb-[88px]">
            <h1
              className="text-white"
              style={{ fontSize: 'clamp(34px, 2rem + 1.8vw, 56px)', lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.02em' }}
            >
              Nhìn thấy phòng tắm trước khi bạn chọn
            </h1>
            <p
              className="mt-5 max-w-[480px]"
              style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)' }}
            >
              Sản phẩm thật từ showroom, phối thử trong đúng kích thước phòng bạn.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-7">
              <Link
                href="/concepts"
                className="inline-flex items-center transition-opacity hover:opacity-90"
                style={{ height: 46, padding: '0 22px', backgroundColor: '#FFFFFF', color: INK, fontSize: 15, fontWeight: 600, borderRadius: 2 }}
              >
                Khám phá không gian
              </Link>
              {tenant.features.roomStudio && (
                <Link href="/room-studio" className="text-[15px] text-white transition-opacity hover:opacity-75" style={{ fontWeight: 500 }}>
                  Thiết kế phòng của tôi →
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Product categories ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section style={{ paddingBlock: 'clamp(64px, 8vw, 108px)' }}>
          <Container>
            <h2 style={{ fontSize: 'clamp(28px, 2rem + 0.8vw, 38px)', fontWeight: 600, color: INK, letterSpacing: '-0.018em' }}>
              Khám phá sản phẩm
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 lg:mt-12 lg:grid-cols-4 lg:gap-x-7">
              {categories.map((category) => (
                <Link key={category.name} href={category.href as Route} className="group block">
                  <div className="overflow-hidden" style={{ backgroundColor: SURFACE, borderRadius: 2 }}>
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={640}
                      height={480}
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="aspect-[4/3] w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <p className="mt-4 text-[17px]" style={{ color: INK, fontWeight: 500 }}>
                    {category.name} <span style={{ color: MUTED }}>→</span>
                  </p>
                  <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>
                    {category.count} sản phẩm
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 3. Shoppable space ──────────────────────────────────────────── */}
      {featured && featured.hotspots.length > 0 && (
        <section style={{ paddingBlock: 'clamp(64px, 8vw, 108px)', backgroundColor: SURFACE }}>
          <Container>
            <h2 style={{ fontSize: 'clamp(28px, 2rem + 0.8vw, 38px)', fontWeight: 600, color: INK, letterSpacing: '-0.018em' }}>
              Khám phá theo không gian
            </h2>
            <p className="mt-3 max-w-xl text-[17px]" style={{ color: MUTED, lineHeight: 1.6 }}>
              Chạm vào điểm đánh dấu để xem sản phẩm trong phòng.
            </p>

            <div className="mt-10 lg:mt-12">
              <ShoppableSpace room={featured} />
            </div>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-md">
                <p className="text-[19px]" style={{ color: INK, fontWeight: 500 }}>{featured.title}</p>
                {featured.description && (
                  <p className="mt-1.5 text-[15px]" style={{ color: MUTED, lineHeight: 1.6 }}>{featured.description}</p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-[14px]" style={{ color: MUTED }}>
                  {featured.products.length} sản phẩm
                  {featured.priceTo ? ` · khoảng ${money(featured.priceTo)}` : ''}
                </p>
                <Link
                  href={`/concepts/${featured.slug}` as Route}
                  className="mt-2 inline-block text-[15px] transition-opacity hover:opacity-70"
                  style={{ color: 'var(--tenant-accent)', fontWeight: 500 }}
                >
                  Dùng không gian này làm điểm bắt đầu →
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ── 4. Collections ──────────────────────────────────────────────── */}
      {collections.length > 0 && (
        <section style={{ paddingBlock: 'clamp(64px, 8vw, 108px)' }}>
          <Container>
            <h2 style={{ fontSize: 'clamp(28px, 2rem + 0.8vw, 38px)', fontWeight: 600, color: INK, letterSpacing: '-0.018em' }}>
              Chọn phong cách của bạn
            </h2>

            <div className="mt-10 space-y-14 lg:mt-14 lg:space-y-20">
              {collections.slice(0, 3).map((item, index) => (
                <article key={item.slug} className="grid items-center gap-7 lg:grid-cols-[65fr_35fr] lg:gap-14">
                  <Link
                    href={`/concepts/${item.slug}` as Route}
                    className={`block overflow-hidden ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                    style={{ borderRadius: 2 }}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={1672}
                      height={941}
                      sizes="(max-width: 1024px) 100vw, 65vw"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </Link>
                  <div>
                    <h3 style={{ fontSize: 'clamp(24px, 1.6rem + 0.6vw, 30px)', fontWeight: 500, color: INK, letterSpacing: '-0.015em' }}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-3 text-[16px]" style={{ color: MUTED, lineHeight: 1.6 }}>{item.description}</p>
                    )}
                    <Link
                      href={`/concepts/${item.slug}` as Route}
                      className="mt-5 inline-block text-[15px] transition-opacity hover:opacity-70"
                      style={{ color: 'var(--tenant-accent)', fontWeight: 500 }}
                    >
                      Khám phá không gian →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 5. Room Studio ──────────────────────────────────────────────── */}
      {tenant.features.roomStudio && (
        <section style={{ paddingBlock: 'clamp(64px, 8vw, 108px)', backgroundColor: SURFACE }}>
          <Container>
            <div className="grid items-center gap-9 lg:grid-cols-[64fr_36fr] lg:gap-16">
              <Image
                src={ROOM_STUDIO_IMAGE}
                alt="Giao diện Room Studio của LivLab"
                width={1672}
                height={941}
                sizes="(max-width: 1024px) 100vw, 64vw"
                className="aspect-[16/10] w-full object-cover"
                style={{ borderRadius: 2 }}
              />
              <div>
                <h2 style={{ fontSize: 'clamp(28px, 2rem + 0.8vw, 38px)', fontWeight: 600, color: INK, letterSpacing: '-0.018em' }}>
                  Thử trong không gian của bạn
                </h2>
                <p className="mt-4 text-[17px]" style={{ color: MUTED, lineHeight: 1.6 }}>
                  Nhập kích thước phòng, chọn vật liệu sàn và tường, rồi đặt thiết bị thật vào đúng tỉ lệ.
                </p>

                <dl className="mt-8">
                  {[
                    ['Kích thước thực', 'Dài × rộng × cao theo phòng của bạn'],
                    ['Sản phẩm thực', 'Thiết bị trong danh mục, đúng kích thước'],
                    ['Ngân sách tham khảo', 'Cộng dồn theo giá niêm yết'],
                  ].map(([term, detail]) => (
                    <div key={term} className="flex gap-5 py-3" style={{ borderTop: `1px solid ${LINE}` }}>
                      <dt className="w-[146px] shrink-0 text-[15px]" style={{ color: INK, fontWeight: 500 }}>{term}</dt>
                      <dd className="text-[15px]" style={{ color: MUTED }}>{detail}</dd>
                    </div>
                  ))}
                </dl>

                <Link
                  href="/room-studio"
                  className="mt-7 inline-block text-[15px] transition-opacity hover:opacity-70"
                  style={{ color: 'var(--tenant-accent)', fontWeight: 500 }}
                >
                  Mở Room Studio →
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ── 6. Consultation ─────────────────────────────────────────────── */}
      <section className="flex items-center" style={{ backgroundColor: '#292929', minHeight: 360 }}>
        <Container>
          <div className="grid gap-9 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:py-0">
            <div className="max-w-xl">
              <p className="text-[13px] uppercase" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em' }}>
                Tư vấn showroom
              </p>
              <h2 className="mt-3 text-white" style={{ fontSize: 'clamp(26px, 1.9rem + 0.8vw, 36px)', fontWeight: 600, letterSpacing: '-0.018em', lineHeight: 1.18 }}>
                Cần thêm một góc nhìn trước khi quyết định?
              </h2>
              <p className="mt-4 text-[16px]" style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                Nhân viên showroom tiếp tục từ chính sản phẩm và không gian bạn đã chọn.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-7">
              <Link
                href="/contact"
                className="inline-flex items-center transition-opacity hover:opacity-90"
                style={{ height: 46, padding: '0 22px', backgroundColor: '#FFFFFF', color: INK, fontSize: 15, fontWeight: 600, borderRadius: 2 }}
              >
                Nhờ showroom tư vấn
              </Link>
              {tenant.features.quotations && (
                <Link href="/quote" className="text-[15px] text-white transition-opacity hover:opacity-75" style={{ fontWeight: 500 }}>
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
