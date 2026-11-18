/**
 * A storefront tenant: one showroom's branded customer-facing experience.
 *
 * LivLab runs one codebase for every showroom. A customer on Showroom A's
 * storefront sees A's name, A's accent, A's contact and A's consultation
 * destination — and never sees that B and C exist. Nothing here is forked per
 * showroom; it is all configuration.
 *
 * Phase 1 keeps this as configuration rather than database columns. The
 * Showroom table has name, contact and address but no logo or brand colour,
 * and this phase is explicitly not allowed to migrate production. The fields
 * that would eventually need persisting are listed in
 * docs/storefront-tenant-fields.md.
 */

import { EDITORIAL_EXPERIENCE, type TenantExperience, type TenantTheme } from './tenantExperience';

export interface TenantBrand {
  /** Shown in the header, the footer and page titles. */
  name: string;
  /** Short line under the name in the footer. Omitted when there is nothing true to say. */
  tagline?: string;
  /** Path to a logo in /public. When absent the header renders the name as a wordmark. */
  logo?: string;
  logoAlt?: string;
  /** Square icon in /public for the browser tab and search results. Falls back to the site favicon. */
  icon?: string;
  /**
   * The one colour a tenant controls. Deliberately a single accent rather than
   * a palette: a showroom supplying one brand colour cannot accidentally
   * produce an unreadable storefront.
   */
  accent: string;
  accentHover: string;
  /** Text placed ON the accent. Supplied explicitly so contrast is a decision, not a guess. */
  accentContrast: string;
}

export interface TenantNavItem {
  href: string;
  label: string;
  /**
   * Sub-entries shown in a dropdown on desktop and nested in the mobile
   * drawer. Grouping is what lets the header stay short WITHOUT putting any
   * feature out of reach — the first cut of this nav dropped to four flat
   * links and quietly made Combo, Visual Studio, Gợi ý AI and Cẩm nang
   * unreachable from the header even though all four pages still worked.
   */
  children?: { href: string; label: string }[];
}

export interface TenantContact {
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Which LivLab capabilities this storefront exposes.
 *
 * A showroom that has not had its products modelled in 3D should not show a
 * Room Studio entry that leads to an empty room.
 */
export interface TenantFeatureFlags {
  roomStudio: boolean;
  expert: boolean;
  consultation: boolean;
  quotations: boolean;
}

/**
 * Which part of the LivLab catalogue this storefront sells.
 *
 * Phase 1 only records the intent — nothing filters on it yet. It exists now
 * so the scoping work in a later phase has somewhere to read from rather than
 * inventing a shape then.
 */
export interface TenantCatalogScope {
  /** Showroom whose catalogue and prices apply. Null for the LivLab demo storefront. */
  showroomId: string | null;
  /** Vietnamese category labels this tenant sells. Empty means "everything". */
  categories: string[];
}

export interface TenantStorefrontConfig {
  id: string;
  slug: string;
  brand: TenantBrand;
  navigation: TenantNavItem[];
  contact?: TenantContact;
  catalogScope: TenantCatalogScope;
  /**
   * Server-owned destination for customer requests. It is intentionally not
   * inferred from catalogScope: a demo can use fixture products while still
   * owning a dedicated, isolated inbox.
   */
  requestWorkspace?: {
    showroomId: string;
    kind: 'LIVE' | 'DEMO';
  };
  features: TenantFeatureFlags;
  /** Quiet "Powered by LivLab" in the footer. A tenant may switch it off. */
  poweredByLivLab: boolean;
  /**
   * Reachable by anyone who has the link, including in production, via
   * `/s/<slug>`.
   *
   * Only for storefronts that exist to be shown: their catalogue is a fixture,
   * their branding is their own, and nothing behind them is a real showroom's
   * commercial data. A tenant backed by a live `showroomId` must never carry
   * this, because its prices and offers belong to that showroom.
   */
  publicDemo?: boolean;
  /**
   * Tokens, layout variants, homepage composition and copy. This is what lets
   * two showrooms differ in more than a logo and a colour — see
   * `tenantExperience.ts`.
   */
  experience: TenantExperience;
  seo: TenantSeo;
  /**
   * The tenant's own public address on the web. Present only for a storefront
   * that is served on a hostname of its own; a tenant without it is reachable
   * only as a preview on LivLab's hosts and is never indexed there.
   */
  site?: TenantSite;
  /**
   * The business as it presents itself publicly — the facts behind its
   * LocalBusiness structured data. Only facts confirmed by the business's
   * own channels belong here; everything else stays out until confirmed.
   */
  business?: TenantBusiness;
  /** Third-party measurement, configured per tenant and off until an id is supplied. */
  analytics?: { ga4MeasurementId: string | null };
  /**
   * Hostnames of this showroom's own website. Photographs copied from there
   * are the showroom's and appear on its storefront only — never on another
   * tenant's, even for the same SKU.
   */
  ownedImageHosts?: string[];
}

export interface TenantSeo {
  /** The homepage title, and the default for pages that set none. */
  title: string;
  description: string;
  /** The site's name as search engines should show it (WebSite.name, og:site_name). */
  siteName?: string;
  /** Other names the business is genuinely known by (WebSite.alternateName). */
  alternateNames?: string[];
  /** Google Search Console HTML-tag token, once the owner has created the property. */
  googleSiteVerification?: string | null;
  /** 1200×630 image for shared links (Open Graph). Falls back to the hero image, then the logo. */
  shareImage?: string;
}

export interface TenantSite {
  /** Canonical origin, no trailing slash. Every canonical, sitemap and JSON-LD URL is built on it. */
  origin: string;
  /** Lower-case hostnames, without ports, that serve this tenant. */
  hosts: string[];
  /**
   * Hostnames that also serve this tenant but are never indexed — a stand-in
   * address while the real domain is being connected. Canonical URLs on them
   * still point at `origin`, so nothing has to move when the domain goes live.
   */
  previewHosts?: string[];
  /**
   * Where a link on LivLab's own site (`/s/<slug>`) sends a visitor, while
   * `origin` is not reachable yet — the preview host until DNS is connected.
   * Remove it once the domain answers; `origin` is then used.
   */
  entryOrigin?: string;
  /**
   * Whether product pages may be indexed on this tenant's own host. Off for a
   * catalogue that is a reference list rather than the business's offer.
   */
  indexProducts: boolean;
}

export interface TenantBusiness {
  name: string;
  /** schema.org type, e.g. 'HomeGoodsStore'. */
  schemaType: string;
  streetAddress: string;
  /** The address line exactly as the business publishes it. */
  displayAddress: string;
  locality: string;
  country: string;
  /** E.164, for structured data and tel: links. */
  telephone: string;
  /** As the business writes it. */
  telephoneDisplay: string;
  /** A Zalo chat link, when the business publishes a Zalo number. */
  zaloUrl?: string;
  /** The business's own profiles elsewhere (schema.org sameAs). */
  sameAs: string[];
}

/**
 * Storefront navigation.
 *
 * Four top-level entries so the header reads calmly, with everything the
 * previous ten-link header offered still one hover or tap away. The old header
 * put Concept, Combo, Gợi ý AI, Visual Studio, Room Studio, Cẩm nang, Trang
 * chủ, Về LivLab and Tra cứu báo giá on one row; the problem was the flat list,
 * not the destinations.
 *
 * `isDefaultTenant` controls the LivLab-specific entries: "Về LivLab" is
 * LivLab's own sales page, and a showroom's storefront should not carry it.
 */
function baseNavigation(
  features: TenantFeatureFlags,
  {
    isDefaultTenant,
    productCategories = [],
  }: {
    isDefaultTenant: boolean;
    /**
     * Category-first product navigation, for a retailer whose customers shop
     * by fixture type. Only categories the catalogue actually holds belong
     * here: an entry that filters to nothing is a dead link.
     */
    productCategories?: string[];
  }
): TenantNavItem[] {
  const advice: { href: string; label: string }[] = [
    { href: '/contact', label: 'Tư vấn showroom' },
  ];
  if (features.quotations) {
    advice.push(
      { href: '/quote', label: 'Yêu cầu báo giá' },
      { href: '/track-quote', label: 'Tra cứu báo giá' },
      { href: '/quote-process', label: 'Quy trình báo giá' }
    );
  }
  if (isDefaultTenant) {
    advice.push({ href: '/showrooms', label: 'Dành cho showroom' }, { href: '/about', label: 'Về LivLab' });
  }

  const items: TenantNavItem[] = [
    {
      href: '/concepts',
      label: 'Không gian',
      children: [
        { href: '/concepts', label: 'Concept phòng tắm' },
        { href: '/blog', label: 'Cẩm nang' },
      ],
    },
    productCategories.length > 0
      ? {
          href: '/products',
          label: 'Sản phẩm',
          children: [
            { href: '/products', label: 'Tất cả sản phẩm' },
            ...productCategories.map((category) => ({
              href: `/products?category=${encodeURIComponent(category)}`,
              label: category,
            })),
          ],
        }
      : { href: '/products', label: 'Sản phẩm' },
  ];

  if (features.roomStudio) items.push({ href: '/room-studio', label: 'Room Studio' });
  items.push({ href: '/contact', label: 'Tư vấn', children: advice });

  return items;
}

/**
 * The thin bar above the header. Only real destinations go here — never a
 * phone number or address the tenant has not actually provided.
 */
export function utilityLinks(features: TenantFeatureFlags): { href: string; label: string }[] {
  const links = [{ href: '/blog', label: 'CẨM NANG' }];
  if (features.quotations) links.push({ href: '/track-quote', label: 'TRA CỨU BÁO GIÁ' });
  return links;
}

const LIVLAB_FEATURES: TenantFeatureFlags = {
  roomStudio: true,
  expert: true,
  consultation: true,
  quotations: true,
};

/**
 * The warm retail palette: charcoal ink, an orange primary action and the same
 * orange darkened for text. Worn by LivLab's own storefront and by the Tùng
 * Đăng demo, so the two look alike while carrying different names and logos.
 *
 * Colours, checked for contrast rather than eyeballed:
 *   #EF9F00 orange fills the primary action; charcoal on it is 6.3:1, while
 *     white on it would be 2.2:1, so the action's text is charcoal.
 *   #B45309 is the same orange as TEXT on white (5.0:1): prices and links.
 *   #D61A2C is a promo red darkened to 5.2:1 for small text, and appears only
 *     beside a genuinely higher list price.
 */
const WARM_RETAIL_THEME: TenantTheme = {
  ink: '#2E2D2B',
  inkContrast: '#FFFFFF',
  accentInk: '#B45309',
  panel: '#2E2D2B',
  panelContrast: '#FFFFFF',
  price: '#B45309',
  discount: '#D61A2C',
  surfaceMuted: '#F4F3F1',
  radius: 6,
  headingTracking: '.04em',
  font: 'beVietnamPro',
  uiPrimary: '#EF9F00',
  uiPrimaryHover: '#FCA359',
  uiPrimaryContrast: '#2E2D2B',
  uiSelected: '#EF9F00',
  uiSelectedContrast: '#2E2D2B',
  uiSoft: '#FDF1DC',
  uiSoftContrast: '#8A4500',
  uiLink: '#B45309',
  uiSurface: '#F6F5F3',
  uiInk: '#2E2D2B',
};

/**
 * LivLab's own storefront — the default, used by livlab.space and whenever
 * tenant resolution finds nothing. It is the Tùng Đăng demo's storefront
 * exactly: the same warm palette, header, commerce hero, icon rail, price-led
 * cards, section order and scene photographs. What differs is identity only —
 * LivLab's logo, copy, product library and concepts. Nothing here reads a
 * showroom's catalogue, name, address or contact details.
 */
const LIVLAB_CATEGORIES = ['Bồn cầu', 'Lavabo', 'Vòi lavabo', 'Sen tắm', 'Gương & phụ kiện'];

const LIVLAB_RETAIL_EXPERIENCE: TenantExperience = {
  theme: WARM_RETAIL_THEME,
  variants: {
    header: 'retail',
    hero: 'commerce',
    categoryNav: 'iconRail',
    productCard: 'priceLed',
    conceptDetail: 'commerce',
    hotspot: 'accent',
  },
  home: {
    layout: 'catalog',
    sections: ['hero', 'categories', 'concepts', 'featuredProducts', 'brands', 'roomStudio', 'consultation'],
  },
  merchandising: {
    // From LivLab's own product library (the database catalogue).
    featuredProductIds: [
      'llv-toi-toto-cs838dt8',
      'llv-lav-toto-lt1735-xw',
      'llv-sho-inax-bfv655t8c',
      'llv-fau-toto-tx109ld',
    ],
    // The same scenes the retail storefront leads with, pinned to LivLab's
    // own products (lib/storefront/conceptLibrary.ts).
    heroConceptSlug: 'livlab-master-spa-retreat',
    featuredConceptSlug: 'livlab-golden-retreat',
    conceptCount: 3,
    // Captured from LivLab's own Room Studio with `?demo=1` (the room below),
    // 1440 × 1097 and cropped beneath the site header — the same framing as
    // the retail demo's picture.
    roomStudioImage: {
      src: '/images/room-studio-livlab.webp',
      alt: 'Room Studio của LivLab: phòng 3,0 × 2,0 m với lavabo và bồn cầu từ thư viện sản phẩm LivLab',
    },
  },
  copy: {
    utility: ['Nền tảng thương mại trực quan cho showroom', 'Thiết bị vệ sinh & nội thất'],
    hero: {
      eyebrow: 'LIVLAB',
      kicker: 'NỀN TẢNG THƯƠNG MẠI TRỰC QUAN',
      // The page's one H1.
      // Three short lines: the hero column is narrow, and a long first line
      // breaks mid-phrase.
      titleLines: ['LivLab — Nền tảng', 'trải nghiệm sản phẩm', 'cho showroom'],
      body:
        'Số hoá danh mục sản phẩm, gợi ý không gian, phối phòng 3D và yêu cầu báo giá — trong một ' +
        'trải nghiệm thống nhất cho showroom thiết bị vệ sinh và nội thất.',
      primaryCta: { label: 'MỞ ROOM STUDIO', href: '/room-studio' },
      secondaryCta: { label: 'DÀNH CHO SHOWROOM', href: '/showrooms' },
      // Six capabilities, two to a column; each line is something the
      // platform does today.
      trust: [
        {
          title: 'DANH MỤC SỐ & BỘ SƯU TẬP',
          body: 'Danh mục sản phẩm kèm thông số và giá tham khảo, cùng không gian gợi ý gắn sản phẩm thật.',
        },
        {
          title: 'ROOM STUDIO 3D & CẤU HÌNH',
          body: 'Dựng phòng đúng kích thước, phối vật liệu sàn tường và đặt thiết bị để thấy trước kết quả.',
        },
        {
          title: 'BÁO GIÁ & QUẢN LÝ LEAD',
          body: 'Yêu cầu báo giá có cấu trúc đổ về dashboard của showroom để theo dõi và chăm sóc khách.',
        },
      ],
    },
    sections: {
      categoriesTitle: 'DANH MỤC SẢN PHẨM SỐ',
      conceptsEyebrow: 'BỘ SƯU TẬP & CẢM HỨNG',
      conceptsTitle: 'GỢI Ý KHÔNG GIAN',
      conceptsBody:
        'Bắt đầu từ phong cách, diện tích và ngân sách — mỗi không gian gắn với sản phẩm thật trong ' +
        'thư viện LivLab.',
      productsEyebrow: 'THƯ VIỆN SẢN PHẨM LIVLAB',
      productsTitle: 'SẢN PHẨM NỔI BẬT',
      productsNote: 'Giá tham khảo tại thời điểm cập nhật thư viện. Showroom xác nhận giá cuối khi báo giá.',
      brandsTitle: 'THƯƠNG HIỆU TRONG THƯ VIỆN',
    },
    quote: {
      cta: 'YÊU CẦU BÁO GIÁ',
      trackLabel: 'Tra cứu báo giá',
      drawerTitle: 'Giỏ báo giá',
      drawerBody: 'Lưu lại những thiết bị bạn quan tâm để showroom tư vấn và gửi báo giá.',
      submit: 'Gửi yêu cầu báo giá',
      addToQuote: 'THÊM BÁO GIÁ',
    },
    roomStudio: { libraryTitle: 'Thư viện sản phẩm LivLab', primaryCta: 'Yêu cầu báo giá' },
    footerBlurb:
      'Nền tảng trải nghiệm sản phẩm và thương mại trực quan cho showroom thiết bị vệ sinh và nội thất: ' +
      'danh mục số, gợi ý không gian, Room Studio 3D và báo giá.',
    concept: {
      productsTitle: 'SẢN PHẨM GỢI Ý TRONG CONCEPT',
      ctaTitle: 'ĐÃ TÌM ĐƯỢC KHÔNG GIAN PHÙ HỢP?',
      ctaBody: 'Lưu các thiết bị bạn quan tâm vào giỏ báo giá để showroom tư vấn và gửi báo giá.',
      estimateTitle: 'NGÂN SÁCH THIẾT BỊ THAM KHẢO',
    },
  },
  // LivLab's Room Studio offers its whole library, 3D reconstructions included.
  roomStudioCatalog: 'livlab',
  // `/room-studio?demo=1`: the furnished 3 × 2 m room the home page's Room
  // Studio picture was captured from — the retail demo's arrangement, with
  // LivLab's own basin and toilet. A product that cannot be placed is skipped.
  roomStudioDemo: {
    dimensions: { length: 3, width: 2, height: 2.7 },
    floor: { material: 'stone-look', color: 'beige', finish: 'matte' },
    walls: { material: 'porcelain', color: 'white', finish: 'matte' },
    products: [
      { id: 'llv-lav-toto-lt1705-xw', at: [-0.75, -0.75] },
      { id: 'llv-toi-toto-cs838dt8', at: [0.65, -0.55] },
    ],
    selectProductId: 'llv-toi-toto-cs838dt8',
  },
};

export const LIVLAB_TENANT: TenantStorefrontConfig = {
  id: 'livlab',
  slug: 'livlab',
  brand: {
    name: 'LivLab',
    tagline: 'Dựng thử không gian phòng tắm với sản phẩm thật trước khi quyết định.',
    logo: '/images/logo.png',
    logoAlt: 'LivLab',
    // The room mark from the logo, on white — replaces the Next/Vercel
    // triangle that Google was showing beside LivLab's results.
    icon: '/images/livlab-icon.png',
    accent: '#EF9F00',
    accentHover: '#FCA359',
    accentContrast: '#2E2D2B',
  },
  navigation: baseNavigation(LIVLAB_FEATURES, { isDefaultTenant: true, productCategories: LIVLAB_CATEGORIES }),
  contact: {},
  catalogScope: { showroomId: null, categories: [] },
  features: LIVLAB_FEATURES,
  poweredByLivLab: false,
  experience: LIVLAB_RETAIL_EXPERIENCE,
  seo: {
    title: 'LivLab | Nền tảng thương mại trực quan & 3D Room Studio',
    description:
      'LivLab giúp showroom số hóa danh mục sản phẩm, xây dựng trải nghiệm phối phòng 3D, quản lý ' +
      'yêu cầu báo giá và phát triển hoạt động kinh doanh trực tuyến.',
    siteName: 'LivLab',
    shareImage: '/images/livlab-og.png',
    // Search Console HTML-tag token for https://www.livlab.space/, set in Vercel.
    googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION_LIVLAB ?? null,
  },
  // livlab.space answers with a 308 to www, so www is the canonical origin.
  // Product pages stay unindexed, as before: LivLab's catalogue is a reference
  // library, not an offer.
  site: { origin: 'https://www.livlab.space', hosts: ['www.livlab.space', 'livlab.space'], indexProducts: false },
};

const DEMO_FEATURES: TenantFeatureFlags = {
  roomStudio: true,
  expert: true,
  consultation: true,
  quotations: true,
};

/**
 * An internal demonstration storefront, used to prove one codebase renders
 * different branding.
 *
 * This showroom has NOT signed anything with LivLab. Nothing here claims a
 * partnership, and no copy implies endorsement — it is a configuration used to
 * show the architecture, and the storefront says only what the showroom itself
 * would say about its own products.
 *
 * Scoped to sanitaryware: this is a bathroom showroom, so kitchen and general
 * furniture categories are deliberately absent.
 */
export const DEMO_SHOWROOM_TENANT: TenantStorefrontConfig = {
  id: 'luxbath',
  slug: 'luxbath',
  brand: {
    name: 'Luxbath Studio',
    tagline: 'Thiết bị vệ sinh và không gian phòng tắm.',
    accent: '#1F3A34',
    accentHover: '#152824',
    accentContrast: '#FFFFFF',
  },
  navigation: baseNavigation(DEMO_FEATURES, { isDefaultTenant: false }),
  // Left empty on purpose. Real contact details are read from the Showroom
  // record at resolution time; inventing a phone number for a showroom that
  // has not agreed to anything would be worse than showing none.
  contact: {},
  catalogScope: {
    showroomId: 'sr-luxbath-1',
    categories: [
      'Bồn cầu', 'Chậu lavabo', 'Vòi chậu', 'Sen tắm',
      'Bồn tắm', 'Gương', 'Phụ kiện phòng tắm', 'Thoát sàn',
    ],
  },
  requestWorkspace: { showroomId: 'sr-luxbath-1', kind: 'LIVE' },
  features: DEMO_FEATURES,
  poweredByLivLab: true,
  experience: EDITORIAL_EXPERIENCE,
  seo: {
    title: 'Luxbath Studio — Thiết bị vệ sinh phòng tắm',
    description: 'Xem sản phẩm phòng tắm và dựng thử không gian trước khi quyết định.',
  },
};

/**
 * The categories the Tùng Đăng catalogue holds today, in the order a bathroom
 * is specified. Read off the fixture rather than the source site's menu: the
 * site also lists mirrors and accessories, and the fixture has none, so they
 * are not offered here.
 */
const TUNGDANG_CATEGORIES = ['Bồn cầu', 'Lavabo', 'Vòi lavabo', 'Sen tắm', 'Bồn tắm'];

/**
 * The retail treatment — Tùng Đăng's identity on LivLab's visual-commerce core.
 *
 * Nothing in here is specific to this showroom except its values. The
 * variants (`retail`, `commerce`, `iconRail`, `priceLed`) are treatments any
 * retailer can take; an editorial showroom takes the other values of the same
 * fields and gets a different header, hero, category navigation and card from
 * the same components. Its palette is WARM_RETAIL_THEME, shared with LivLab.
 */
const TUNGDANG_EXPERIENCE: TenantExperience = {
  theme: WARM_RETAIL_THEME,
  variants: {
    header: 'retail',
    hero: 'commerce',
    categoryNav: 'iconRail',
    productCard: 'priceLed',
    conceptDetail: 'commerce',
    hotspot: 'accent',
  },
  home: {
    layout: 'catalog',
    sections: ['hero', 'categories', 'concepts', 'featuredProducts', 'brands', 'roomStudio', 'consultation'],
  },
  merchandising: {
    // One per fixture type, chosen for a clean manufacturer photograph. The
    // faucets are left out because their only images are dimension drawings.
    featuredProductIds: [
      'inax-ac-1008vrn',
      'toto-lt4715mtg17-cmw',
      'jomoo-26163-644-1b-i011',
      'toto-pay1725vc-tvbf411',
    ],
    heroConceptSlug: 'master-spa-retreat',
    // The showroom's own room, art-directed around four products it sells.
    featuredConceptSlug: 'tungdang-golden-retreat',
    conceptCount: 3,
    // Captured from this storefront's own Room Studio with `?demo=1` (see
    // public/demo/tungdang/source-map.json). The default teaser image shows
    // LivLab's library, which is a different catalogue.
    roomStudioImage: {
      src: '/demo/tungdang/room-studio.webp',
      alt: 'Room Studio của Bếp Tùng Đăng: phòng 3,0 × 2,0 m với bồn cầu và lavabo từ danh mục showroom',
    },
  },
  copy: {
    // The descriptor is the showroom's own, from its logo. No service claim
    // the showroom has not made, and none LivLab has verified, appears here.
    utility: ['Thiết bị bếp – Phòng tắm nhập khẩu', 'Tư vấn tại showroom'],
    demoNotice: 'Trải nghiệm showroom số trên LivLab',
    hero: {
      eyebrow: 'BẾP TÙNG ĐĂNG',
      kicker: 'TRẢI NGHIỆM SHOWROOM SỐ',
      titleLines: ['Thấy trước không gian.', 'Chọn đúng thiết bị.'],
      body:
        'Khám phá thiết bị phòng tắm trong không gian thực tế — từ cảm hứng, lựa chọn sản phẩm ' +
        'đến tư vấn và báo giá.',
      primaryCta: { label: 'KHÁM PHÁ KHÔNG GIAN', href: '/concepts' },
      secondaryCta: { label: 'MỞ ROOM STUDIO', href: '/room-studio' },
      // Each line is true of the storefront today: every card carries a model
      // code and a reference price, dimensions and drawings are shown where a
      // manufacturer publishes them, and the quote flow reaches the showroom.
      trust: [
        { title: 'SẢN PHẨM THỰC', body: 'Thiết bị trong danh mục showroom, kèm mã sản phẩm và giá tham khảo.' },
        { title: 'THÔNG SỐ KỸ THUẬT', body: 'Kích thước, chất liệu và bản vẽ khi nhà sản xuất có công bố.' },
        { title: 'TƯ VẤN TỪ SHOWROOM', body: 'Gửi danh sách thiết bị để showroom tư vấn và báo giá.' },
      ],
    },
    sections: {
      categoriesTitle: 'DANH MỤC SẢN PHẨM',
      conceptsEyebrow: 'BẾP TÙNG ĐĂNG',
      conceptsTitle: 'GỢI Ý KHÔNG GIAN',
      conceptsBody:
        'Bắt đầu từ phong cách, diện tích và ngân sách — sau đó khám phá các thiết bị phù hợp ' +
        'trong từng không gian.',
      productsEyebrow: 'DANH MỤC BẾP TÙNG ĐĂNG',
      productsTitle: 'SẢN PHẨM NỔI BẬT',
      productsNote: 'Giá tham khảo tại thời điểm cập nhật danh mục. Showroom xác nhận giá cuối khi báo giá.',
      brandsTitle: 'THƯƠNG HIỆU TRONG DANH MỤC',
    },
    quote: {
      cta: 'YÊU CẦU BÁO GIÁ',
      trackLabel: 'Tra cứu báo giá',
      drawerTitle: 'Giỏ báo giá',
      drawerBody: 'Lưu lại những thiết bị bạn quan tâm để showroom tư vấn và gửi báo giá.',
      submit: 'Gửi yêu cầu báo giá',
      addToQuote: 'THÊM BÁO GIÁ',
    },
    // True only because `roomStudioCatalog: 'tenant'` below makes the library
    // this showroom's catalogue. Switch that back and this must change too.
    roomStudio: { libraryTitle: 'Sản phẩm từ Bếp Tùng Đăng', primaryCta: 'Yêu cầu báo giá' },
    footerBlurb:
      'Thiết bị bếp – phòng tắm nhập khẩu. Xem thiết bị trong không gian, so sánh thông số và gửi ' +
      'yêu cầu báo giá tới showroom.',
    concept: {
      productsTitle: 'SẢN PHẨM GỢI Ý TRONG CONCEPT',
      ctaTitle: 'ĐÃ TÌM ĐƯỢC KHÔNG GIAN PHÙ HỢP?',
      ctaBody: 'Lưu các thiết bị bạn quan tâm để Tùng Đăng tiếp tục tư vấn và gửi báo giá.',
      estimateTitle: 'NGÂN SÁCH THIẾT BỊ THAM KHẢO',
    },
  },
  roomStudioCatalog: 'tenant',
  // `/room-studio?demo=1`: a furnished 3 × 2 m room for presentations. Both
  // products are placeable because their size is on file — the INAX toilet's
  // from the manufacturer, the TOTO basin's from the catalogue — and they are
  // drawn as true-size volumes, not as manufacturer 3D. The shower and faucet
  // rows state no dimensions, so they cannot be placed and are not listed.
  roomStudioDemo: {
    dimensions: { length: 3, width: 2, height: 2.7 },
    floor: { material: 'stone-look', color: 'beige', finish: 'matte' },
    walls: { material: 'porcelain', color: 'white', finish: 'matte' },
    // Basin on the left of the back wall, toilet on the right, a clear metre
    // between them — the arrangement a 3 m wall is usually given.
    products: [
      { id: 'toto-lt4715mtg17-cmw', at: [-0.75, -0.75] },
      { id: 'inax-ac-1008vrn', at: [0.65, -0.55] },
    ],
    selectProductId: 'inax-ac-1008vrn',
  },
};

/**
 * Bếp Tùng Đăng, as a white-label demonstration storefront.
 *
 * The storefront carries the showroom's own name, logo and public hotline so
 * that the demonstration shows what LivLab would give this showroom. It does
 * NOT claim a relationship: there is no "đối tác chính thức", no endorsement
 * wording, and every page carries a quiet "Trải nghiệm showroom số trên
 * LivLab" disclosure plus the Powered-by credit. The catalogue is the public
 * fixture in data/demo, never a live showroom's commercial data, which is what
 * keeps `publicDemo` safe to hand out.
 */
export const DEMO_TUNGDANG_TENANT: TenantStorefrontConfig = {
  id: 'tungdang',
  slug: 'tungdang',
  brand: {
    name: 'Bếp Tùng Đăng',
    tagline: 'Thiết bị bếp – Phòng tắm nhập khẩu',
    // The showroom's own mark, stored locally (provenance beside it in
    // public/demo/tungdang/source-map.json). Never hotlinked.
    logo: '/demo/tungdang/logo.png',
    logoAlt: 'Bếp Tùng Đăng — Thiết bị bếp, phòng tắm nhập khẩu',
    accent: '#EF9F00',
    accentHover: '#FCA359',
    accentContrast: '#2E2D2B',
  },
  navigation: baseNavigation(DEMO_FEATURES, {
    isDefaultTenant: false,
    productCategories: TUNGDANG_CATEGORIES,
  }),
  // The hotline published on the showroom's own site (beptungdang.vn, checked
  // 2026-10-18). Nothing else is added: no address, no opening hours.
  contact: { phone: '0983 446 656' },
  catalogScope: {
    showroomId: null,
    categories: TUNGDANG_CATEGORIES,
  },
  requestWorkspace: { showroomId: 'workspace-demo-tungdang', kind: 'DEMO' },
  ownedImageHosts: ['beptungdang.vn'],
  features: DEMO_FEATURES,
  poweredByLivLab: true,
  publicDemo: true,
  experience: TUNGDANG_EXPERIENCE,
  seo: {
    title: 'Bếp Tùng Đăng — Trải nghiệm showroom số',
    description:
      'Khám phá thiết bị phòng tắm trong không gian thực tế, xem thông số và gửi yêu cầu báo giá. ' +
      'Bản trình diễn trải nghiệm showroom số trên LivLab.',
  },
};

/**
 * Giang Sơn sells across these sanitaryware groups; the storefront lists only
 * the ones its demo catalogue (data/demo/giangson-sanitaryware.json) holds, so
 * no category link filters to nothing.
 */
const GIANGSON_CATEGORIES = ['Bồn cầu', 'Lavabo', 'Vòi lavabo', 'Sen tắm', 'Bồn tắm'];
const GIANGSON_ADDRESS = '240 Hồ Tùng Mậu, Phú Diễn, Bắc Từ Liêm, Hà Nội';
const giangsonCategory = (category: string) => `/products?category=${encodeURIComponent(category)}`;

const GIANGSON_EXPERIENCE: TenantExperience = {
  theme: {
    ink: '#123F62',
    inkContrast: '#FFFFFF',
    accentInk: '#006B91',
    panel: '#123F62',
    panelContrast: '#FFFFFF',
    surfaceMuted: '#F2F7F8',
    radius: 4,
    headingTracking: '.035em',
    font: 'beVietnamPro',
    uiPrimary: '#007BAA',
    uiPrimaryHover: '#00648B',
    uiPrimaryContrast: '#FFFFFF',
    uiSelected: '#12A7A0',
    uiSelectedContrast: '#FFFFFF',
    uiSoft: '#E5F5F4',
    uiSoftContrast: '#075E5B',
    uiLink: '#006B91',
    uiSurface: '#F2F7F8',
    uiInk: '#123F62',
  },
  variants: {
    header: 'retail',
    hero: 'commerce',
    categoryNav: 'stage',
    productCard: 'editorial',
    conceptDetail: 'editorial',
    hotspot: 'accent',
  },
  home: {
    layout: 'architecturalLanding',
    sections: [],
    landing: {
      hero: {
        image: {
          src: '/concepts/serene-modern-stone-spa-bathroom.webp',
          alt: 'Không gian phòng tắm hiện đại với bề mặt đá sáng, lavabo, bồn cầu và khu tắm kính',
        },
        hotspots: [
          {
            label: 'Lavabo & vòi',
            detail: 'Chậu đặt bàn TOTO, INAX và vòi nóng lạnh cho khu vực rửa mặt.',
            href: giangsonCategory('Lavabo'),
            xPct: 23,
            yPct: 55,
          },
          {
            label: 'Bồn cầu',
            detail: 'Bồn cầu một khối, hai khối TOTO và INAX, men chống bám bẩn.',
            href: giangsonCategory('Bồn cầu'),
            xPct: 52,
            yPct: 64,
          },
          {
            label: 'Sen tắm',
            detail: 'Sen cây nóng lạnh cho khu tắm đứng.',
            href: giangsonCategory('Sen tắm'),
            xPct: 82,
            yPct: 36,
          },
        ],
        // Under the two buttons: the 3D planner supports shopping, it does not replace it.
        supportLink: { label: 'Thử bố trí phòng tắm 3D trong Room Studio', href: '/room-studio' },
      },
      categories: {
        eyebrow: 'DANH MỤC',
        title: 'Tìm thiết bị theo nhu cầu',
        // Only the groups the catalogue holds; tủ chậu, bàn đá and gương join
        // when the showroom supplies their products.
        description: 'Chọn bồn cầu, lavabo, vòi, sen tắm hoặc bồn tắm để xem mẫu và thông tin sản phẩm.',
        items: [
          {
            id: 'bon-cau',
            name: 'Bồn cầu',
            note: 'Một khối, hai khối · TOTO, INAX',
            image: { src: '/demo/manufacturers/inax/ac-912vn-primary.webp', alt: 'Bồn cầu một khối INAX AC-912VN' },
            href: giangsonCategory('Bồn cầu'),
          },
          {
            id: 'lavabo',
            name: 'Lavabo',
            note: 'Chậu đặt bàn · TOTO, INAX',
            image: { src: '/demo/manufacturers/toto/lt710ctr-primary.webp', alt: 'Chậu đặt bàn TOTO LT710CTR' },
            href: giangsonCategory('Lavabo'),
          },
          {
            id: 'voi-lavabo',
            name: 'Vòi lavabo',
            note: 'Vòi nóng lạnh một lỗ · INAX',
            image: { src: '/demo/manufacturers/inax/lfv-1402s-primary.webp', alt: 'Vòi lavabo nóng lạnh INAX LFV-1402S' },
            href: giangsonCategory('Vòi lavabo'),
          },
          {
            id: 'sen-tam',
            name: 'Sen tắm',
            note: 'Sen cây nóng lạnh · INAX',
            image: { src: '/demo/manufacturers/inax/bfv-70s-primary.webp', alt: 'Sen cây nóng lạnh INAX BFV-70S' },
            href: giangsonCategory('Sen tắm'),
          },
          {
            id: 'bon-tam',
            name: 'Bồn tắm',
            note: 'Đặt sàn, có yếm · TOTO, INAX',
            image: { src: '/demo/manufacturers/toto/pay1725vc-tvbf411-primary.webp', alt: 'Bồn tắm có yếm TOTO PAY1725VC' },
            href: giangsonCategory('Bồn tắm'),
          },
        ],
      },
      combos: {
        eyebrow: 'COMBO',
        title: 'Bộ thiết bị phòng tắm tại Giang Sơn',
        description:
          'Tham khảo những bộ sản phẩm showroom đang giới thiệu. Thành phần, kích thước và giá được xác nhận khi báo giá.',
      },
      products: {
        eyebrow: 'SẢN PHẨM',
        title: 'Sản phẩm đang giới thiệu',
        description: 'Xem hình ảnh, mã sản phẩm, kích thước và giá tham khảo trước khi liên hệ showroom.',
        note: 'Giá hãng đề xuất, theo website TOTO và INAX. Giang Sơn xác nhận giá bán khi báo giá.',
        items: [
          {
            name: 'Bồn cầu 1 khối INAX AC-912VN',
            brand: 'INAX',
            sku: 'AC-912VN',
            category: 'Bồn cầu',
            // INAX's own product photograph, kept locally.
            image: {
              src: '/demo/manufacturers/inax/ac-912vn-primary.webp',
              alt: 'Bồn cầu một khối INAX AC-912VN, thân bo tròn liền khối, màu trắng',
            },
            referencePrice: 10900000,
            sourceLabel: 'Giá hãng đề xuất · INAX',
            href: '/products/inax-ac-912vn',
          },
          {
            name: 'Bồn tắm có yếm TOTO PAY1725VC/TVBF411 1,7 m',
            brand: 'TOTO',
            sku: 'PAY1725VC/TVBF411',
            category: 'Bồn tắm',
            image: {
              src: '/demo/manufacturers/toto/pay1725vc-tvbf411-primary.webp',
              alt: 'Bồn tắm acrylic có yếm TOTO PAY1725VC trên nền sáng',
            },
            referencePrice: 21521000,
            sourceLabel: 'Giá hãng đề xuất · TOTO',
            href: '/products/toto-pay1725vc-tvbf411',
          },
          {
            name: 'Bồn cầu 1 khối TOTO MS889DRT8 nắp êm TC600VS',
            brand: 'TOTO',
            sku: 'MS889DRT8',
            category: 'Bồn cầu',
            image: {
              src: '/demo/manufacturers/toto/ms889drt8-primary.webp',
              alt: 'Bồn cầu một khối TOTO MS889DRT8 trên nền sáng',
            },
            // vn.toto.com, checked 2026-11-18: 12.276.000 ₫ promotional
            // against a 14.443.000 ₫ list price.
            referencePrice: 12276000,
            sourceLabel: 'Giá khuyến mãi hãng đề xuất · TOTO',
            href: '/products/toto-ms889drt8',
          },
        ],
      },
      videos: {
        eyebrow: 'VIDEO',
        title: 'Xem sản phẩm thực tế từ Giang Sơn',
        description: 'Video tủ chậu lavabo và giới thiệu showroom, đăng trên trang Facebook của Giang Sơn.',
        note:
          'Video phát qua trình phát của Facebook và chỉ tải khi bạn bấm phát; Facebook có thể ghi nhận ' +
          'lượt xem theo chính sách của Facebook.',
      },
      concepts: {
        eyebrow: 'MẪU PHỐI',
        title: 'Mẫu phối phòng tắm theo diện tích và phong cách',
        description: 'Xem phối cảnh và chọn các mẫu thiết bị được gợi ý cho từng không gian.',
        cta: { label: 'XEM TẤT CẢ MẪU PHỐI', href: '/concepts' },
        items: [
          {
            title: 'Master phong cách spa',
            note: 'Master 10–14 m² · Bồn tắm đặt sàn, lavabo đôi',
            image: {
              src: '/concepts/luxury-smart-bathroom-retreat.webp',
              alt: 'Phòng tắm master phong cách spa với bồn tắm đặt sàn và lavabo đôi',
            },
            href: '/concepts/giangson-master-spa',
          },
          {
            title: 'Scandinavian ấm sáng',
            note: 'Gia đình 4–6 m² · Bồn cầu hai khối, sen cây',
            image: {
              src: '/concepts/scandinavian-bathroom-with-warm-accents.webp',
              alt: 'Phòng tắm Scandinavian sáng với điểm nhấn gỗ ấm',
            },
            href: '/concepts/giangson-scandinavian-bath',
          },
          {
            title: 'Nghỉ dưỡng thanh lịch',
            note: 'Master 6–9 m² · Bồn cầu một khối, sen cây',
            image: {
              src: '/concepts/serene-luxury-spa-bathroom.webp',
              alt: 'Phòng tắm nghỉ dưỡng thanh lịch tông sáng',
            },
            href: '/concepts/giangson-premium-suite',
          },
        ],
      },
      roomStudio: {
        eyebrow: 'ROOM STUDIO 3D',
        title: 'Thử bố trí thiết bị trong phòng tắm 3D',
        description:
          'Nhập kích thước phòng, chọn thiết bị và thử các phương án sắp xếp trước khi gửi yêu cầu tư vấn.',
        note:
          'Hình 3D giúp hình dung bố cục, không thay cho việc đo đạc thực tế và kiểm tra kỹ thuật lắp ' +
          'đặt (cấp thoát nước, tường, sàn) tại công trình.',
        cta: { label: 'MỞ ROOM STUDIO', href: '/room-studio' },
        // Captured from this storefront's own Room Studio (`?demo=1`).
        image: {
          src: '/demo/giangson/room-studio.webp',
          alt: 'Room Studio của Giang Sơn: phòng 3,2 × 2,4 m với bồn tắm và bồn cầu INAX từ danh mục showroom',
        },
      },
      showroom: {
        eyebrow: 'SHOWROOM',
        title: 'Đến showroom Giang Sơn tại 240 Hồ Tùng Mậu',
        description:
          'Xem mẫu trực tiếp và mang theo kích thước phòng hoặc mã sản phẩm để được tư vấn cụ thể. ' +
          'Nên gọi trước khi đến để showroom chuẩn bị mẫu bạn quan tâm.',
        address: GIANGSON_ADDRESS,
        phone: '032 969 0164',
        zaloUrl: 'https://zalo.me/0329690164',
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(GIANGSON_ADDRESS)}`,
        facebookUrl: 'https://www.facebook.com/thietbigiangson/',
        cta: { label: 'GỬI YÊU CẦU BÁO GIÁ', href: '/quote' },
      },
      contact: {
        title: 'Cần báo giá cho phòng tắm của bạn?',
        body:
          'Gửi mã sản phẩm, số lượng hoặc kích thước cần làm. Giang Sơn sẽ liên hệ xác nhận phương án và báo giá.',
        cta: { label: 'GỬI YÊU CẦU BÁO GIÁ', href: '/quote' },
        phone: '032 969 0164',
      },
    },
  },
  copy: {
    utility: ['Showroom 240 Hồ Tùng Mậu, Hà Nội', 'Tư vấn & báo giá'],
    demoNotice: 'Website showroom số trên nền tảng LivLab. Giá hiển thị là giá bán lẻ đề xuất của hãng',
    header: {
      primaryCta: { label: 'YÊU CẦU BÁO GIÁ', href: '/quote' },
      searchHref: '/products',
      showSearch: true,
      showSaved: false,
      logoSize: 'large',
      collapseAt: 'lg',
    },
    hero: {
      eyebrow: 'SHOWROOM THIẾT BỊ VỆ SINH · 240 HỒ TÙNG MẬU',
      // The one H1 on the homepage: the name customers search for, and where.
      titleLines: ['Thiết bị vệ sinh Giang Sơn', 'tại Hà Nội'],
      body:
        'Xem mẫu bồn cầu, lavabo, sen vòi và bồn tắm TOTO, INAX; tủ chậu, bàn đá lavabo và gương ' +
        'phòng tắm có tại showroom. Tra cứu thông số, tham khảo giá và gửi yêu cầu để Giang Sơn tư vấn ' +
        'theo kích thước, số lượng và nhu cầu lắp đặt.',
      // "& combo" joins the label once a combo is approved and published.
      primaryCta: { label: 'XEM SẢN PHẨM', href: '/products' },
      secondaryCta: { label: 'NHẬN BÁO GIÁ TỪ GIANG SƠN', href: '/quote' },
      trust: [
        { title: 'MÃ & THÔNG SỐ', body: 'Mỗi mẫu có mã sản phẩm, kích thước và giá hãng đề xuất.' },
        { title: 'BỐ TRÍ THỬ 3D', body: 'Đặt thiết bị vào phòng đúng kích thước trước khi chọn.' },
        { title: 'BÁO GIÁ TỪ SHOWROOM', body: 'Gửi mã, số lượng hoặc kích thước; showroom xác nhận giá.' },
      ],
    },
    sections: {
      categoriesTitle: 'DANH MỤC SẢN PHẨM',
      conceptsEyebrow: 'KHÔNG GIAN GỢI Ý',
      conceptsTitle: 'Mẫu phối phòng tắm theo diện tích và phong cách',
      productsTitle: 'SẢN PHẨM',
      productsNote: 'Giá bán lẻ đề xuất do hãng công bố. Giang Sơn xác nhận giá cuối khi báo giá.',
      brandsTitle: 'THƯƠNG HIỆU',
    },
    quote: {
      cta: 'YÊU CẦU BÁO GIÁ',
      trackLabel: 'TRA CỨU BÁO GIÁ',
      drawerTitle: 'Giỏ báo giá',
      drawerBody: 'Lưu những thiết bị bạn quan tâm để Giang Sơn tư vấn và gửi báo giá.',
      submit: 'Gửi yêu cầu báo giá',
      addToQuote: 'THÊM BÁO GIÁ',
    },
    // True because `roomStudioCatalog: 'tenant'` below makes the library this
    // showroom's catalogue. Switch that back and this must change too.
    roomStudio: { libraryTitle: 'Sản phẩm từ Giang Sơn', primaryCta: 'Yêu cầu báo giá' },
    footerBlurb: 'Showroom thiết bị vệ sinh và phòng tắm tại 240 Hồ Tùng Mậu, Phú Diễn, Bắc Từ Liêm, Hà Nội.',
    footer: {
      explore: [
        { label: 'Không gian gợi ý', href: '/concepts' },
        { label: 'Tất cả sản phẩm', href: '/products' },
        { label: 'Room Studio', href: '/room-studio' },
      ],
      support: [
        { label: 'Showroom Giang Sơn', href: '/#showroom' },
        { label: 'Yêu cầu báo giá', href: '/quote' },
        { label: 'Tra cứu báo giá', href: '/track-quote' },
        { label: 'Hotline 032 969 0164', href: 'tel:+84329690164' },
        { label: 'Chat Zalo', href: 'https://zalo.me/0329690164' },
        { label: 'Facebook Giang Sơn', href: 'https://www.facebook.com/thietbigiangson/' },
      ],
    },
  },
  roomStudioCatalog: 'tenant',
  // `/room-studio?demo=1`: a furnished 3,2 × 2,4 m room for presentations,
  // drawn with the INAX reconstructions this catalogue carries. Back wall:
  // the 1,6 m tub on the left, the toilet on the right.
  roomStudioDemo: {
    dimensions: { length: 3.2, width: 2.4, height: 2.7 },
    floor: { material: 'stone-look', color: 'light-grey', finish: 'matte' },
    walls: { material: 'porcelain', color: 'white', finish: 'matte' },
    products: [
      { id: 'inax-bf-1656v', at: [-0.75, -0.78] },
      { id: 'inax-ac-1017vrn', at: [0.95, -0.78] },
    ],
    selectProductId: 'inax-bf-1656v',
  },
};

export const DEMO_GIANGSON_TENANT: TenantStorefrontConfig = {
  id: 'giangson',
  slug: 'giangson',
  brand: {
    // The name the business uses on its own Facebook page.
    name: 'Thiết bị vệ sinh Giang Sơn',
    tagline: 'Trường tồn với thời gian',
    logo: '/demo/giangson/logo.png',
    logoAlt: 'Thiết bị vệ sinh Giang Sơn',
    // The diamond mark cropped from the supplied logo.
    icon: '/demo/giangson/icon.png',
    accent: '#007BAA',
    accentHover: '#00648B',
    accentContrast: '#FFFFFF',
  },
  navigation: baseNavigation(DEMO_FEATURES, {
    isDefaultTenant: false,
    productCategories: GIANGSON_CATEGORIES,
  }),
  // Phone and address as the business publishes them on its own Facebook page
  // (facebook.com/thietbigiangson, "Giới thiệu", checked 2026-11-17). The
  // second number listed there is not published until the owner confirms it.
  contact: { phone: '032 969 0164', address: GIANGSON_ADDRESS },
  catalogScope: { showroomId: null, categories: GIANGSON_CATEGORIES },
  requestWorkspace: { showroomId: 'workspace-demo-giangson', kind: 'DEMO' },
  features: DEMO_FEATURES,
  poweredByLivLab: true,
  publicDemo: true,
  experience: GIANGSON_EXPERIENCE,
  seo: {
    title: 'Thiết bị vệ sinh Giang Sơn | 240 Hồ Tùng Mậu, Hà Nội',
    description:
      'Showroom thiết bị vệ sinh Giang Sơn, 240 Hồ Tùng Mậu, Hà Nội: bồn cầu, lavabo, sen vòi, bồn tắm ' +
      'TOTO, INAX. Xem mẫu, thông số, giá hãng đề xuất và gửi yêu cầu báo giá.',
    siteName: 'Thiết bị vệ sinh Giang Sơn',
    alternateNames: ['Giang Sơn thiết bị vệ sinh', 'Giang Sơn'],
    googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION_GIANGSON ?? null,
  },
  site: {
    origin: 'https://giangson.livlab.space',
    hosts: ['giangson.livlab.space'],
    // Live while giangson.livlab.space waits for its DNS record (2026-11-17).
    previewHosts: ['giangson-livlab.vercel.app'],
    // giangson.livlab.space had no DNS record on 2026-11-18. Delete this line
    // when it answers, and /s/giangson then sends visitors to the domain.
    entryOrigin: 'https://giangson-livlab.vercel.app',
    indexProducts: true,
  },
  business: {
    name: 'Thiết bị vệ sinh Giang Sơn',
    schemaType: 'HomeGoodsStore',
    streetAddress: '240 Hồ Tùng Mậu',
    displayAddress: GIANGSON_ADDRESS,
    locality: 'Hà Nội',
    country: 'VN',
    telephone: '+84329690164',
    telephoneDisplay: '032 969 0164',
    zaloUrl: 'https://zalo.me/0329690164',
    sameAs: ['https://www.facebook.com/thietbigiangson/'],
  },
  analytics: { ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID_GIANGSON ?? null },
};


export const TENANTS: Record<string, TenantStorefrontConfig> = {
  [LIVLAB_TENANT.slug]: LIVLAB_TENANT,
  [DEMO_SHOWROOM_TENANT.slug]: DEMO_SHOWROOM_TENANT,
  [DEMO_TUNGDANG_TENANT.slug]: DEMO_TUNGDANG_TENANT,
  [DEMO_GIANGSON_TENANT.slug]: DEMO_GIANGSON_TENANT,
};
