import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getHomepageData } from '@/lib/storefront/homepageData';
import { Container } from '@/components/storefront/primitives';
import HomeHero from '@/components/storefront/home/HomeHero';
import HomeCategories from '@/components/storefront/home/HomeCategories';
import ShoppableSpace from '@/components/storefront/home/ShoppableSpace';
import HomeCollections from '@/components/storefront/home/HomeCollections';
import FeaturedProducts from '@/components/storefront/home/FeaturedProducts';
import RoomStudioFeature from '@/components/storefront/home/RoomStudioFeature';
import ShowroomConsultation from '@/components/storefront/home/ShowroomConsultation';
import { SectionHeader, ArrowLink, SECTION_PAD, TEXT, TEXT_MUTED, BODY_STYLE } from '@/components/storefront/home/editorial';
import type { Route } from 'next';

/**
 * The storefront homepage: hero, products, space, collections, featured
 * products, Room Studio, consultation. Nothing else — no feature grid, no
 * metrics, no process diagram.
 */
export default async function HomePage() {
  const tenant = await resolveTenant();
  const { categories, featured, featuredProducts, collections } = await getHomepageData();

  const money = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu` : `${v.toLocaleString('vi-VN')}đ`;

  return (
    <>
      <HomeHero roomStudio={tenant.features.roomStudio} />

      <HomeCategories categories={categories} />

      {/* ── Không gian ──────────────────────────────────────────────────── */}
      {featured && featured.hotspots.length > 0 && (
        <section style={{ paddingBlock: SECTION_PAD, backgroundColor: '#FFFFFF' }}>
          <Container>
            <SectionHeader title="KHÔNG GIAN" href={'/concepts' as Route} />

            <div className="mt-10 lg:mt-14">
              <ShoppableSpace room={featured} />
            </div>

            <div className="mt-8 grid gap-7 lg:grid-cols-[64fr_36fr] lg:gap-[60px]">
              <div>
                <p style={{ fontSize: 'clamp(20px, 1.1rem + 0.5vw, 24px)', fontWeight: 500, color: TEXT, letterSpacing: '.02em' }}>
                  {featured.title.toUpperCase()}
                </p>
                <p className="mt-4 max-w-[520px]" style={BODY_STYLE}>
                  Khám phá từng thiết bị trong không gian và dùng concept này làm điểm bắt đầu cho phòng của bạn.
                </p>
              </div>
              <div className="lg:pt-1">
                <p style={{ fontSize: 14, color: TEXT_MUTED }}>
                  {featured.products.length} sản phẩm
                  {/* Only when the catalogue actually prices every item. */}
                  {featured.priceTo ? ` · khoảng ${money(featured.priceTo)}` : ''}
                </p>
                <div className="mt-5">
                  <ArrowLink href={`/concepts/${featured.slug}` as Route}>DÙNG LÀM ĐIỂM BẮT ĐẦU</ArrowLink>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      <HomeCollections collections={collections} />

      <FeaturedProducts products={featuredProducts} />

      {tenant.features.roomStudio && <RoomStudioFeature />}

      <ShowroomConsultation quotations={tenant.features.quotations} />
    </>
  );
}
