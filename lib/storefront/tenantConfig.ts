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

import { EDITORIAL_EXPERIENCE, type TenantExperience } from './tenantExperience';

export interface TenantBrand {
  /** Shown in the header, the footer and page titles. */
  name: string;
  /** Short line under the name in the footer. Omitted when there is nothing true to say. */
  tagline?: string;
  /** Path to a logo in /public. When absent the header renders the name as a wordmark. */
  logo?: string;
  logoAlt?: string;
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
  seo: { title: string; description: string };
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
  if (isDefaultTenant) advice.push({ href: '/about', label: 'Về LivLab' });

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
 * The default storefront, used by livlab.vercel.app and whenever tenant
 * resolution finds nothing. It keeps LivLab's existing navy identity.
 */
export const LIVLAB_TENANT: TenantStorefrontConfig = {
  id: 'livlab',
  slug: 'livlab',
  brand: {
    name: 'LivLab',
    tagline: 'Dựng thử không gian phòng tắm với sản phẩm thật trước khi quyết định.',
    logo: '/images/logo.png',
    logoAlt: 'LivLab',
    accent: '#123C5A',
    accentHover: '#0D2B42',
    accentContrast: '#FFFFFF',
  },
  navigation: baseNavigation(LIVLAB_FEATURES, { isDefaultTenant: true }),
  contact: {},
  catalogScope: { showroomId: null, categories: [] },
  features: LIVLAB_FEATURES,
  poweredByLivLab: false,
  experience: EDITORIAL_EXPERIENCE,
  seo: {
    title: 'LivLab — Dựng thử phòng tắm với sản phẩm thật',
    description:
      'Chọn sản phẩm thật, dựng phòng đúng kích thước và gửi yêu cầu báo giá tới showroom.',
  },
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
 * the same components.
 *
 * Colours, checked for contrast rather than eyeballed:
 *   #EF9F00 orange fills the primary action; charcoal on it is 6.3:1, while
 *     white on it would be 2.2:1, so the action's text is charcoal.
 *   #B45309 is the same orange as TEXT on white (5.0:1): prices and links.
 *   #D61A2C is the source's promo red darkened to 5.2:1 for small text, and
 *     appears only beside a genuinely higher list price.
 */
const TUNGDANG_EXPERIENCE: TenantExperience = {
  theme: {
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
  },
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
      },
      categories: {
        eyebrow: 'DANH MỤC SẢN PHẨM',
        title: 'Khám phá danh mục sản phẩm',
        description:
          'Tìm hiểu các nhóm thiết bị vệ sinh và vật liệu hoàn thiện phù hợp với từng không gian.',
        items: [
          {
            id: 'bon-cau',
            name: 'Bồn cầu',
            note: 'Một khối, hai khối · TOTO, INAX',
            image: {
              src: '/concepts/serene-modern-stone-spa-bathroom.webp',
              alt: 'Bồn cầu trong không gian phòng tắm đá xám hiện đại',
            },
            href: giangsonCategory('Bồn cầu'),
          },
          {
            id: 'lavabo',
            name: 'Lavabo',
            note: 'Chậu đặt bàn cho khu vực rửa mặt',
            image: {
              src: '/concepts/coastal-minimalist-spa-bathroom.webp',
              alt: 'Lavabo đặt bàn trong không gian phòng tắm xanh xám',
            },
            href: giangsonCategory('Lavabo'),
          },
          {
            id: 'voi-lavabo',
            name: 'Vòi lavabo',
            note: 'Vòi nóng lạnh, van gốm bền bỉ',
            image: {
              src: '/concepts/serene-japandi-spa-bathroom.webp',
              alt: 'Vòi lavabo trên chậu đặt bàn trong phòng tắm Japandi',
            },
            href: giangsonCategory('Vòi lavabo'),
          },
          {
            id: 'sen-tam',
            name: 'Sen tắm',
            note: 'Sen cây nóng lạnh cho khu tắm đứng',
            image: {
              src: '/concepts/luxurious-modern-stone-spa-bathroom.webp',
              alt: 'Khu tắm kính với sen cây trong phòng tắm hiện đại',
            },
            href: giangsonCategory('Sen tắm'),
          },
          {
            id: 'bon-tam',
            name: 'Bồn tắm',
            note: 'Bồn đặt sàn và bồn có yếm acrylic',
            image: {
              src: '/concepts/luxury-smart-bathroom-retreat.webp',
              alt: 'Bồn tắm đặt sàn trong phòng tắm master phong cách spa',
            },
            href: giangsonCategory('Bồn tắm'),
          },
        ],
      },
      concepts: {
        eyebrow: 'KHÔNG GIAN GỢI Ý',
        title: 'Từ không gian yêu thích đến sản phẩm phù hợp',
        description:
          'Khám phá các không gian gợi ý, chạm vào từng sản phẩm để xem thông tin và lưu trực tiếp vào yêu cầu báo giá.',
        cta: { label: 'KHÁM PHÁ KHÔNG GIAN', href: '/concepts' },
        items: [
          {
            title: 'Spa tại gia',
            note: 'Bồn tắm đặt sàn · Lavabo đặt bàn đôi',
            image: {
              src: '/concepts/luxury-smart-bathroom-retreat.webp',
              alt: 'Phòng tắm master phong cách spa với bồn tắm đặt sàn và lavabo đôi',
            },
            href: '/concepts/giangson-master-spa',
          },
          {
            title: 'Scandinavian ấm sáng',
            note: 'Bồn cầu hai khối · Sen cây · Vòi lavabo',
            image: {
              src: '/concepts/scandinavian-bathroom-with-warm-accents.webp',
              alt: 'Phòng tắm Scandinavian sáng với điểm nhấn gỗ ấm',
            },
            href: '/concepts/giangson-scandinavian-bath',
          },
          {
            title: 'Nghỉ dưỡng thanh lịch',
            note: 'Bồn cầu một khối · Lavabo chữ nhật · Sen cây',
            image: {
              src: '/concepts/serene-luxury-spa-bathroom.webp',
              alt: 'Phòng tắm nghỉ dưỡng thanh lịch tông sáng',
            },
            href: '/concepts/giangson-premium-suite',
          },
        ],
      },
      products: {
        eyebrow: 'SẢN PHẨM NỔI BẬT',
        title: 'Sản phẩm được tuyển chọn',
        description:
          'Thiết bị TOTO và INAX chính hãng, kèm thông số, hình ảnh và giá bán lẻ đề xuất của hãng.',
        note: 'Giá bán lẻ đề xuất do hãng công bố. Giang Sơn báo giá thực tế theo số lượng và công trình.',
        items: [
          {
            name: 'Bồn cầu 1 khối INAX AC-1017VRN',
            brand: 'INAX',
            sku: 'AC-1017VRN',
            category: 'Bồn cầu',
            image: {
              src: '/demo/manufacturers/inax/ac-1017vrn-primary.webp',
              alt: 'Bồn cầu một khối INAX AC-1017VRN trên nền sáng',
            },
            referencePrice: 17290000,
            sourceLabel: 'Giá bán lẻ đề xuất · INAX · Có mô hình 3D',
            href: '/products/inax-ac-1017vrn',
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
            sourceLabel: 'Giá bán lẻ đề xuất · TOTO',
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
            referencePrice: 12276000,
            sourceLabel: 'Giá khuyến mãi đề xuất · TOTO',
            href: '/products/toto-ms889drt8',
          },
        ],
      },
      roomStudio: {
        eyebrow: 'THIẾT KẾ TRỰC QUAN 3D',
        title: 'Chủ động thiết kế không gian của bạn',
        description:
          'Với Room Studio, khách hàng có thể thiết lập kích thước phòng, lựa chọn màu sắc, chất liệu gạch tường và sàn, phối hợp các thiết bị vệ sinh và quan sát tổng thể trong môi trường 3D. Điều này giúp so sánh phương án thiết kế, đánh giá mức độ phù hợp với không gian và đưa ra lựa chọn sản phẩm có cơ sở hơn trước khi yêu cầu báo giá.',
        cta: { label: 'TRẢI NGHIỆM ROOM STUDIO', href: '/room-studio' },
        image: {
          src: '/images/room-studio-ui.png',
          alt: 'Giao diện Room Studio đang chạy với phòng 3D, bảng vật liệu và thư viện sản phẩm',
        },
      },
      about: {
        eyebrow: 'VỀ GIANG SƠN',
        title: 'Giang Sơn — Thiết bị và vật liệu hoàn thiện',
        // From the company's own directory listing (Trang Vàng Việt Nam,
        // checked 2026-10-19): what it sells, to whom, and what it commits to.
        body:
          'Công ty TNHH Thương mại và Xây dựng Giang Sơn Việt Nam phân phối thiết bị vệ sinh, gạch ốp lát, ' +
          'thiết bị điện và vật liệu ngành nước cho nhà ở và công trình tại miền Bắc. Hàng chính hãng, ' +
          'cung cấp đủ số lượng cho công trình, chiết khấu cho đơn hàng lớn và giao hàng tận nơi. ' +
          'Showroom: Số 240 Hồ Tùng Mậu, P. Phú Diễn, Q. Bắc Từ Liêm, Hà Nội.',
      },
      contact: {
        title: 'Bắt đầu lựa chọn cho không gian của bạn',
        body: 'Khám phá sản phẩm, thử bố trí trong Room Studio hoặc gửi yêu cầu để nhận tư vấn phù hợp.',
        cta: { label: 'YÊU CẦU BÁO GIÁ', href: '/quote' },
        phone: '0395 279 360',
      },
    },
  },
  copy: {
    utility: ['Thiết bị & vật liệu hoàn thiện', 'Tư vấn & báo giá'],
    demoNotice: 'Bản trình diễn showroom số LivLab, sử dụng thông tin từ nguồn công khai',
    header: {
      primaryCta: { label: 'YÊU CẦU BÁO GIÁ', href: '/quote' },
      searchHref: '/products',
      showSearch: true,
      showSaved: false,
      logoSize: 'large',
      collapseAt: 'lg',
    },
    hero: {
      eyebrow: 'GIANG SƠN · THIẾT BỊ & VẬT LIỆU HOÀN THIỆN',
      titleLines: ['Hoàn thiện không gian,', 'bắt đầu từ lựa chọn đúng.'],
      body:
        'Khám phá thiết bị vệ sinh, gạch ốp lát và giải pháp hoàn thiện. Trực tiếp phối thử thiết bị, vật liệu trong không gian 3D trước khi lựa chọn.',
      primaryCta: { label: 'KHÁM PHÁ SẢN PHẨM', href: '/products' },
      secondaryCta: { label: 'TRẢI NGHIỆM ROOM STUDIO', href: '/room-studio' },
      trust: [
        {
          title: 'HÀNG CHÍNH HÃNG',
          body: 'Thiết bị TOTO, INAX kèm mã sản phẩm, thông số và giá bán lẻ đề xuất của hãng.',
        },
        {
          title: 'THIẾT KẾ TRỰC QUAN 3D',
          body: 'Tùy chỉnh kích thước, phối vật liệu và bố trí thiết bị ngay trong không gian.',
        },
        {
          title: 'TƯ VẤN & BÁO GIÁ',
          body: 'Lưu lựa chọn và gửi yêu cầu để showroom tư vấn theo nhu cầu thực tế.',
        },
      ],
    },
    sections: {
      categoriesTitle: 'DANH MỤC SẢN PHẨM',
      conceptsEyebrow: 'KHÔNG GIAN GỢI Ý',
      conceptsTitle: 'Thấy không gian yêu thích. Khám phá sản phẩm ngay.',
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
    footerBlurb:
      'Thiết bị vệ sinh, gạch ốp lát và vật liệu hoàn thiện cho nhu cầu nhà ở và công trình.',
    footer: {
      explore: [
        { label: 'Không gian gợi ý', href: '/concepts' },
        { label: 'Tất cả sản phẩm', href: '/products' },
        { label: 'Room Studio', href: '/room-studio' },
      ],
      support: [
        { label: 'Về Giang Sơn', href: '/#about-giangson' },
        { label: 'Yêu cầu báo giá', href: '/quote' },
        { label: 'Tra cứu báo giá', href: '/track-quote' },
        { label: 'Hotline / Zalo 0395 279 360', href: 'tel:0395279360' },
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
    name: 'Giang Sơn Việt Nam',
    tagline: 'Trường tồn với thời gian',
    logo: '/demo/giangson/logo.png',
    logoAlt: 'Giang Sơn — Trường tồn với thời gian',
    accent: '#007BAA',
    accentHover: '#00648B',
    accentContrast: '#FFFFFF',
  },
  navigation: baseNavigation(DEMO_FEATURES, {
    isDefaultTenant: false,
    productCategories: GIANGSON_CATEGORIES,
  }),
  // Hotline and showroom address as the company publishes them on its own
  // directory listing (Trang Vàng Việt Nam, checked 2026-10-19).
  contact: { phone: '0395 279 360', address: 'Số 240 Hồ Tùng Mậu, P. Phú Diễn, Q. Bắc Từ Liêm, Hà Nội' },
  catalogScope: { showroomId: null, categories: GIANGSON_CATEGORIES },
  requestWorkspace: { showroomId: 'workspace-demo-giangson', kind: 'DEMO' },
  features: DEMO_FEATURES,
  poweredByLivLab: true,
  publicDemo: true,
  experience: GIANGSON_EXPERIENCE,
  seo: {
    title: 'Giang Sơn — Thiết bị & vật liệu hoàn thiện',
    description:
      'Khám phá thiết bị vệ sinh, gạch ốp lát, vật liệu hoàn thiện và thử thiết kế phòng tắm trên Room Studio.',
  },
};

export const TENANTS: Record<string, TenantStorefrontConfig> = {
  [LIVLAB_TENANT.slug]: LIVLAB_TENANT,
  [DEMO_SHOWROOM_TENANT.slug]: DEMO_SHOWROOM_TENANT,
  [DEMO_TUNGDANG_TENANT.slug]: DEMO_TUNGDANG_TENANT,
  [DEMO_GIANGSON_TENANT.slug]: DEMO_GIANGSON_TENANT,
};
