import type { Route } from 'next';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import { getHomepageData } from '@/lib/storefront/homepageData';
import HomeHero from '@/components/storefront/home/HomeHero';
import HomeCategories from '@/components/storefront/home/HomeCategories';
import ShoppableSpace from '@/components/storefront/home/ShoppableSpace';
import HomeCollections from '@/components/storefront/home/HomeCollections';
import FeaturedProducts from '@/components/storefront/home/FeaturedProducts';
import RoomStudioFeature from '@/components/storefront/home/RoomStudioFeature';
import ShowroomConsultation from '@/components/storefront/home/ShowroomConsultation';
import CatalogHome from '@/components/storefront/home/CatalogHome';
import ArchitecturalLanding from '@/components/storefront/home/ArchitecturalLanding';
import { SectionHeader, ArrowLink, TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';

/**
 * The storefront homepage.
 *
 * A tenant whose experience asks for the `catalog` layout gets a homepage
 * composed from its own catalogue and concept library (see CatalogHome).
 * Everyone else — LivLab itself included — gets the `showcase` page below,
 * unchanged: hero, products, space, collections, featured products, Room
 * Studio, consultation. Nothing else — no feature grid, no metrics, no
 * process diagram.
 */
export default async function HomePage() {
  const tenant = await resolveTenant();
  if (tenant.experience.home.layout === 'architecturalLanding') {
    return <ArchitecturalLanding tenant={tenant} />;
  }
  if (tenant.experience.home.layout === 'catalog') return <CatalogHome tenant={tenant} />;

  const { categories, featured, featuredProducts, collections } = await getHomepageData();

  const money = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu` : `${v.toLocaleString('vi-VN')}đ`;

  return (
    <>
      <HomeHero roomStudio={tenant.features.roomStudio} />

      <HomeCategories categories={categories} />

      {/* ── Không gian ──────────────────────────────────────────────────── */}
      {featured && featured.hotspots.length > 0 && (
        <section className="home-section pt-0">
          <div className="home-container">
            <SectionHeader title="KHÔNG GIAN" href={'/concepts' as Route} />

            <ShoppableSpace room={featured} />

            <div className="grid gap-6 pt-7 md:grid-cols-[1fr_auto]">
              <div>
                <h3 style={{ fontSize: 23, fontWeight: 500, letterSpacing: '.01em', color: TEXT }}>
                  {featured.title.toUpperCase()}
                </h3>
                <p className="mt-3 max-w-[620px]" style={{ fontSize: 15, lineHeight: 1.7, color: TEXT_MUTED }}>
                  Khám phá từng thiết bị trong không gian và dùng concept này làm điểm bắt đầu cho phòng của bạn.
                </p>
              </div>

              <div className="md:text-right">
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
          </div>
        </section>
      )}

      <HomeCollections collections={collections} />

      <FeaturedProducts products={featuredProducts} />

      {tenant.features.roomStudio && <RoomStudioFeature />}

      <ShowroomConsultation quotations={tenant.features.quotations} />
    </>
  );
}
