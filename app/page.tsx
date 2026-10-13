import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getHomepageData, ROOM_STUDIO_IMAGE } from '@/lib/storefront/homepageData';
import { Container, Section, SectionHeader } from '@/components/storefront/primitives';
import FeaturedRoom from '@/components/storefront/home/FeaturedRoom';

/**
 * The storefront homepage.
 *
 * It shows before it explains. The order is a customer's order — a room, then
 * what is in it, then other looks, then "could this be my bathroom", then a
 * person to talk to — rather than problem / solution / features / technology,
 * which is a pitch deck with a scrollbar.
 *
 * Nothing on this page is a metric, a badge or a capability grid. Everything
 * is a real concept, a real catalogue row or a real price.
 */
export default async function HomePage() {
  const tenant = await resolveTenant();
  const { featured, collections } = await getHomepageData();

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────────
          One photograph, one sentence, two actions. The room carries the page;
          the text stays out of its way. */}
      <section className="relative flex min-h-[78vh] items-end lg:min-h-[86vh]">
        <Image
          src="/images/hero-bathroom-luxury.png"
          alt="Phòng tắm tông tối với bàn đá và vòi gắn tường"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center lg:object-[68%_center]"
        />
        {/*
          Only as much scrim as the text needs, and in the direction the text
          actually sits. A single horizontal gradient tuned for the desktop
          layout leaves white type on a bright wall once the copy spans the
          full width of a phone.
        */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{ background: 'linear-gradient(0deg, rgba(10,12,14,0.86) 0%, rgba(10,12,14,0.55) 46%, rgba(10,12,14,0.15) 100%)' }}
        />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{ background: 'linear-gradient(90deg, rgba(10,12,14,0.76) 0%, rgba(10,12,14,0.42) 42%, rgba(10,12,14,0) 72%)' }}
        />

        <Container>
          <div className="relative max-w-2xl pb-16 lg:pb-24">
            <h1 className="sf-display" style={{ color: '#FCFCFB' }}>
              Nhìn thấy phòng tắm{' '}
              {/* The break is a desktop composition choice; on a phone the
                  line is narrower than the phrase, so natural wrapping reads
                  better than a forced one. */}
              <br className="hidden lg:inline" />
              trước khi bạn chọn.
            </h1>
            <p className="sf-body-lg mt-6 max-w-md" style={{ color: 'rgba(252,252,251,0.78)' }}>
              Sản phẩm thật từ showroom, phối thử trong đúng kích thước phòng bạn, trước khi quyết định.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                href="/concepts"
                className="px-7 py-3.5 text-[15px] font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--tenant-accent)',
                  color: 'var(--tenant-accent-contrast)',
                  borderRadius: 'var(--sf-radius)',
                }}
              >
                Khám phá không gian
              </Link>
              {tenant.features.roomStudio && (
                <Link
                  href="/room-studio"
                  className="inline-flex items-center gap-2 border-b pb-1 text-[15px] font-medium transition-colors"
                  style={{ color: '#FCFCFB', borderColor: 'rgba(252,252,251,0.45)' }}
                >
                  Thiết kế phòng của tôi <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Shoppable room ─────────────────────────────────────────────────── */}
      {featured && (
        <Section size="spacious">
          <Container>
            <SectionHeader
              eyebrow="Khám phá theo không gian"
              title="Một không gian, và những gì làm nên nó"
              description="Từng thiết bị trong phòng là sản phẩm thật trong danh mục, kèm thương hiệu và giá tham khảo."
            />
            <FeaturedRoom room={featured} />
          </Container>
        </Section>
      )}

      {/* ── Editorial collections ──────────────────────────────────────────── */}
      {collections.length > 0 && (
        <Section size="spacious" muted>
          <Container>
            <SectionHeader
              eyebrow="Phong cách"
              title="Chọn một phong cách để bắt đầu"
              action={
                <Link href="/concepts" className="sf-link">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />

            <div className="space-y-16 lg:space-y-24">
              {collections.map((item, index) => (
                <article
                  key={item.slug}
                  className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                    // Alternating direction, so the page reads as a magazine
                    // spread rather than a column of identical cards.
                    index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  <Link href={`/concepts/${item.slug}` as Route} className="block overflow-hidden" style={{ borderRadius: 'var(--sf-radius)' }}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={1672}
                      height={941}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </Link>
                  <div className="max-w-md">
                    <h3 className="sf-h3">{item.title}</h3>
                    {item.description && (
                      <p className="sf-body mt-3" style={{ color: 'var(--sf-text-secondary)' }}>
                        {item.description}
                      </p>
                    )}
                    <Link href={`/concepts/${item.slug}` as Route} className="sf-link mt-5">
                      Xem không gian <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── Room Studio ────────────────────────────────────────────────────── */}
      {tenant.features.roomStudio && (
        <Section size="spacious">
          <Container>
            <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
              <div className="overflow-hidden" style={{ borderRadius: 'var(--sf-radius)' }}>
                <Image
                  src={ROOM_STUDIO_IMAGE}
                  alt="Phòng tắm master được dựng theo kích thước thật"
                  width={1672}
                  height={941}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>

              <div className="max-w-md">
                <p className="sf-caption uppercase" style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.1em' }}>
                  Room Studio
                </p>
                <h2 className="sf-h2 mt-2">Thử trong không gian của bạn</h2>
                <p className="sf-body-lg mt-4" style={{ color: 'var(--sf-text-secondary)' }}>
                  Nhập kích thước phòng, chọn vật liệu sàn và tường, rồi đặt thiết bị thật vào đúng tỉ lệ.
                </p>

                {/* Three lines of text, not three coloured cards. */}
                <dl className="mt-7 space-y-3">
                  {[
                    ['Kích thước thực', 'Dài × rộng × cao theo phòng của bạn'],
                    ['Sản phẩm thực', 'Thiết bị trong danh mục, đúng kích thước'],
                    ['Ngân sách tham khảo', 'Cộng dồn theo giá niêm yết'],
                  ].map(([term, detail]) => (
                    <div key={term} className="flex gap-4" style={{ borderTop: '1px solid var(--sf-border)', paddingTop: '0.75rem' }}>
                      <dt className="w-[150px] shrink-0 text-[14px] font-medium">{term}</dt>
                      <dd className="text-[14px]" style={{ color: 'var(--sf-text-secondary)' }}>{detail}</dd>
                    </div>
                  ))}
                </dl>

                <Link href="/room-studio" className="sf-link mt-7">
                  Mở Room Studio <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* ── Consultation ───────────────────────────────────────────────────── */}
      <Section size="spacious" muted>
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="sf-caption uppercase" style={{ color: 'var(--sf-text-muted)', letterSpacing: '0.1em' }}>
              Tư vấn showroom
            </p>
            <h2 className="sf-h2 mt-3">Bạn cần tư vấn trước khi quyết định?</h2>
            <p className="sf-body-lg mt-4" style={{ color: 'var(--sf-text-secondary)' }}>
              Nhân viên showroom tiếp tục từ chính sản phẩm, không gian và ngân sách bạn đã chọn — bạn
              không cần mô tả lại từ đầu.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/contact"
                className="px-7 py-3.5 text-[15px] font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--tenant-accent)',
                  color: 'var(--tenant-accent-contrast)',
                  borderRadius: 'var(--sf-radius)',
                }}
              >
                Nhờ showroom tư vấn
              </Link>
              {tenant.features.quotations && (
                <Link href="/quote" className="sf-link">
                  Yêu cầu báo giá <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
