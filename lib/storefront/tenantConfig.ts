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
  { isDefaultTenant }: { isDefaultTenant: boolean }
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
    { href: '/products', label: 'Sản phẩm' },
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
  features: DEMO_FEATURES,
  poweredByLivLab: true,
  seo: {
    title: 'Luxbath Studio — Thiết bị vệ sinh phòng tắm',
    description: 'Xem sản phẩm phòng tắm và dựng thử không gian trước khi quyết định.',
  },
};

/**
 * An internal demo storefront built on publicly visible sanitaryware data from
 * a showroom that has NOT signed with LivLab.
 *
 * Nothing here claims a relationship: no "đối tác chính thức", no co-branding,
 * no logo. The brand name is deliberately neutral, the credit line is off, and
 * the catalogue is served from a fixture so the demo can never write to, or
 * read from, another tenant's data.
 */
export const DEMO_TUNGDANG_TENANT: TenantStorefrontConfig = {
  id: 'tungdang',
  slug: 'tungdang',
  brand: {
    name: 'Showroom Demo',
    tagline: 'Danh mục thiết bị phòng tắm dùng cho demo nội bộ.',
    accent: '#123F5D',
    accentHover: '#0D2B42',
    accentContrast: '#FFFFFF',
  },
  navigation: baseNavigation(DEMO_FEATURES, { isDefaultTenant: false }),
  catalogScope: {
    showroomId: null,
    categories: ['Bồn cầu', 'Lavabo', 'Vòi lavabo', 'Sen tắm', 'Bồn tắm', 'Gương & phụ kiện'],
  },
  features: DEMO_FEATURES,
  poweredByLivLab: false,
  // Safe to hand out: the catalogue is a fixture, the name shown is "Showroom
  // Demo" rather than any real company's, and no live showroom's prices or
  // offers are behind it.
  publicDemo: true,
  seo: {
    title: 'Showroom Demo — Thiết bị phòng tắm',
    description: 'Danh mục thiết bị phòng tắm dùng cho demo nội bộ của LivLab.',
  },
};

export const TENANTS: Record<string, TenantStorefrontConfig> = {
  [LIVLAB_TENANT.slug]: LIVLAB_TENANT,
  [DEMO_SHOWROOM_TENANT.slug]: DEMO_SHOWROOM_TENANT,
  [DEMO_TUNGDANG_TENANT.slug]: DEMO_TUNGDANG_TENANT,
};
