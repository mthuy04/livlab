import { Fragment } from 'react';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';
import type { HomeSection } from '@/lib/storefront/tenantExperience';
import { getCatalogHomeData, type CatalogHomeData } from '@/lib/storefront/tenantHome';
import { opticalScale } from '@/lib/storefront/catalogTypes';
import HomeHero from './HomeHero';
import HomeCategories from './HomeCategories';
import FeaturedProducts from './FeaturedProducts';
import RoomStudioFeature from './RoomStudioFeature';
import ShowroomConsultation from './ShowroomConsultation';
import CommerceHero from './CommerceHero';
import CategoryRail from './CategoryRail';
import { BrandStrip, ConceptShowcase, RetailProductGrid } from './catalogSections';

/**
 * A showroom's homepage: the sections its experience lists, in that order,
 * each in the variant its experience picks, all fed from its own catalogue.
 *
 * This is the whole of the white-label mechanism for the homepage. A second
 * showroom is a different `sections` list and different `variants` — an
 * editorial showroom can take the full-bleed hero, photographic categories
 * and image-first cards with no pricing emphasis, and lose the brand strip —
 * with no new page and no fork of this one.
 */
export default async function CatalogHome({ tenant }: { tenant: TenantStorefrontConfig }) {
  const data = await getCatalogHomeData(tenant);
  const { sections } = tenant.experience.home;

  return (
    <>
      {sections.map((section) => (
        <Fragment key={section}>{renderSection(section, tenant, data)}</Fragment>
      ))}
    </>
  );
}

function renderSection(section: HomeSection, tenant: TenantStorefrontConfig, data: CatalogHomeData) {
  const { variants, copy } = tenant.experience;

  switch (section) {
    case 'hero':
      return variants.hero === 'commerce' ? (
        <CommerceHero
          copy={copy.hero}
          room={data.heroRoom}
          productCount={data.productCount}
          brandCount={data.brands.length}
          categoryCount={data.categories.length}
          roomStudio={tenant.features.roomStudio}
        />
      ) : (
        <HomeHero roomStudio={tenant.features.roomStudio} copy={copy.hero} />
      );

    case 'categories':
      return variants.categoryNav === 'iconRail' ? (
        <CategoryRail
          title={copy.sections.categoriesTitle}
          categories={data.categories}
          productCount={data.productCount}
        />
      ) : (
        <HomeCategories
          title={copy.sections.categoriesTitle}
          categories={data.categories
            .filter((c) => c.image)
            .slice(0, 4)
            .map((c) => ({ name: c.name, image: c.image, href: c.href, imageScale: opticalScale(c.name, '') }))}
        />
      );

    case 'concepts':
      return (
        <ConceptShowcase
          eyebrow={copy.sections.conceptsEyebrow}
          title={copy.sections.conceptsTitle}
          body={copy.sections.conceptsBody}
          concepts={data.concepts}
        />
      );

    case 'featuredProducts':
      return variants.productCard === 'priceLed' ? (
        <RetailProductGrid
          eyebrow={copy.sections.productsEyebrow}
          title={copy.sections.productsTitle}
          note={copy.sections.productsNote}
          products={data.featured}
          tenantId={tenant.id}
          addLabel={copy.quote.addToQuote}
        />
      ) : (
        <FeaturedProducts
          title={copy.sections.productsTitle}
          products={data.featured.map((p) => ({
            id: p.id,
            slug: p.href.replace(/^\/products\//, ''),
            name: p.name,
            brand: p.brand,
            category: p.category,
            priceMin: p.showroomPrice,
            priceMax: p.showroomPrice,
            priceRange: null,
            material: null,
            finish: null,
            dimensions: null,
            warranty: null,
            imageUrl: p.image,
            imageScale: opticalScale(p.category, p.name),
          }))}
        />
      );

    case 'brands':
      return <BrandStrip title={copy.sections.brandsTitle} brands={data.brands} />;

    case 'roomStudio':
      return tenant.features.roomStudio ? (
        <RoomStudioFeature
          image={tenant.experience.merchandising?.roomStudioImage?.src}
          imageAlt={tenant.experience.merchandising?.roomStudioImage?.alt}
        />
      ) : null;

    case 'consultation':
      return <ShowroomConsultation quotations={tenant.features.quotations} />;
  }
}

