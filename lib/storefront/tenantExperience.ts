/**
 * How a storefront looks and speaks, as data.
 *
 * `TenantBrand` answers "whose shop is this" — a name, a logo, one accent.
 * That is enough to re-badge a page and not enough to make two showrooms feel
 * like two different businesses: swap the accent on an identical layout and a
 * customer sees the same website in a different colour. A retailer that sells
 * on price and range and an architectural showroom that sells on atmosphere
 * need different headers, a different hero, a different product card and a
 * different voice — from one codebase.
 *
 * So the experience is described here in four layers, each one plain data
 * (it crosses from the server layout into client components):
 *
 *   theme          design tokens, emitted once as CSS custom properties
 *   variants       which treatment each region uses
 *   home           which homepage sections appear, in which order
 *   copy           every customer-facing string that differs by showroom
 *
 * Variant names describe a TREATMENT, never a showroom: `retail`, `commerce`,
 * `iconRail`, `priceLed`. A second retail showroom reuses them with its own
 * tokens; an editorial showroom picks the other values. No component branches
 * on a tenant id.
 */

/* ── Theme ───────────────────────────────────────────────────────────────── */

/** Fonts a tenant may select. Registered in `tenantFonts.ts`. */
export type TenantFontId = 'inter' | 'beVietnamPro';

/**
 * Tokens beyond the brand accent.
 *
 * Every field is optional, and a tenant that sets none of them renders exactly
 * as the LivLab storefront does: the defaults below are LivLab's own values,
 * and the workspace tokens (`ui*`) are only emitted when present so that Room
 * Studio and the quote drawer keep their original colours as CSS fallbacks.
 */
export interface TenantTheme {
  /** Charcoal for dark bars and panels. */
  ink?: string;
  /** Text on `ink`. */
  inkContrast?: string;
  /**
   * The accent when it is TEXT on a light surface. A bright accent that works
   * as a button fill often fails 4.5:1 as a word on white, so the two are
   * separate decisions rather than one colour asked to do both.
   */
  accentInk?: string;
  /** Full-bleed brand panels (consultation band). Text on it is `panelContrast`. */
  panel?: string;
  panelContrast?: string;
  /** Prices in product cards and on the product page. */
  price?: string;
  /**
   * A genuine price difference: a list price the catalogue really holds above
   * the showroom price. Never used for invented urgency.
   */
  discount?: string;
  /** Quiet surfaces: section bands, image stages. */
  surfaceMuted?: string;
  /** Corner radius of actions, inputs and cards, in px. */
  radius?: number;
  /** Letter-spacing of uppercase section titles. */
  headingTracking?: string;
  font?: TenantFontId;

  /** Workspace (Room Studio, quote drawer) primary action. */
  uiPrimary?: string;
  uiPrimaryHover?: string;
  uiPrimaryContrast?: string;
  /** Selected tab / chip. */
  uiSelected?: string;
  uiSelectedContrast?: string;
  /** Tinted state, e.g. a product already in the room. */
  uiSoft?: string;
  uiSoftContrast?: string;
  /** Text links inside the workspace. */
  uiLink?: string;
  /** Quiet panels inside the workspace (basket rows, totals). */
  uiSurface?: string;
  /** Dark workspace surfaces: the confirmation toast. */
  uiInk?: string;
}

/* ── Variants ────────────────────────────────────────────────────────────── */

/**
 * `editorial`: one thin neutral utility row, logo, centred nav, one filled CTA.
 * `retail`: a dark utility bar carrying the showroom's own descriptor and
 * hotline, a quote-lookup link beside the CTA — the trust furniture a
 * specialist retailer leads with.
 */
export type HeaderVariant = 'editorial' | 'retail';

/**
 * `editorial`: full-bleed photograph with text over it.
 * `commerce`: copy beside a shoppable room — real catalogue products pinned
 * to the scene with their prices — and a row of service facts beneath.
 */
export type HeroVariant = 'editorial' | 'commerce';

/** `stage`: four product photographs. `iconRail`: every category, as line icons with counts. */
export type CategoryNavVariant = 'stage' | 'iconRail';

/** `editorial`: image-first, price as a footnote. `priceLed`: SKU, price and quote action up front. */
export type ProductCardVariant = 'editorial' | 'priceLed';

/**
 * The concept detail page.
 *
 * `editorial`: the room, its story, its products grouped by zone.
 * `commerce`: the same room with each hotspot's preview carrying price and a
 * quote action, the products as numbered cards in hotspot order, and a closing
 * block that puts the whole room into the quote basket.
 */
export type ConceptDetailVariant = 'editorial' | 'commerce';

/** `neutral`: a white dot. `accent`: the tenant's accent with a white "+". */
export type HotspotVariant = 'neutral' | 'accent';

export interface TenantVariants {
  header: HeaderVariant;
  hero: HeroVariant;
  categoryNav: CategoryNavVariant;
  productCard: ProductCardVariant;
  conceptDetail: ConceptDetailVariant;
  hotspot: HotspotVariant;
}

/* ── Homepage ────────────────────────────────────────────────────────────── */

/**
 * `showcase` is the LivLab homepage, built from LivLab's own showcase data.
 * `catalog` is assembled from the tenant's catalogue and concept library, in
 * the order `sections` gives — so what a showroom's homepage shows is always
 * something it actually sells.
 */
export type HomeLayout = 'showcase' | 'catalog' | 'architecturalLanding';

export interface LandingImage {
  src: string;
  alt: string;
}

export interface LandingHotspot {
  label: string;
  detail: string;
  href: string;
  xPct: number;
  yPct: number;
}

export interface ArchitecturalLandingContent {
  hero: {
    image: LandingImage;
    hotspots: LandingHotspot[];
  };
  categories: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ id: string; name: string; note: string; image: LandingImage; href: string }>;
  };
  concepts: {
    eyebrow: string;
    title: string;
    description: string;
    cta: CtaCopy;
    items: Array<{ title: string; note: string; image: LandingImage; href: string }>;
  };
  roomStudio: {
    eyebrow: string;
    title: string;
    description: string;
    cta: CtaCopy;
    image: LandingImage;
  };
  about: {
    eyebrow: string;
    title: string;
    body: string;
  };
  contact: {
    title: string;
    body: string;
    cta: CtaCopy;
    phone: string;
  };
}

export type HomeSection =
  | 'hero'
  | 'categories'
  | 'concepts'
  | 'featuredProducts'
  | 'brands'
  | 'roomStudio'
  | 'consultation';

export interface TenantHome {
  layout: HomeLayout;
  /** Only read for the `catalog` layout. */
  sections: HomeSection[];
  /** Static, database-independent content for a public architectural landing. */
  landing?: ArchitecturalLandingContent;
}

/* ── Merchandising ───────────────────────────────────────────────────────── */

/**
 * What the showroom chooses to put forward. References only — ids from its
 * own catalogue and slugs from its own concept library — so a choice that
 * stops resolving drops out instead of rendering something invented.
 */
export interface TenantMerchandising {
  /** Catalogue `id`s, in display order. Topped up from the catalogue if some no longer resolve. */
  featuredProductIds: string[];
  /** The concept whose room the `commerce` hero shows. */
  heroConceptSlug?: string;
  /** How many concepts the homepage concept section shows. */
  conceptCount?: number;
  /** The concept the homepage concept section leads with, as a large card. */
  featuredConceptSlug?: string;
  /** A capture of this storefront's own Room Studio, for the homepage teaser. */
  roomStudioImage?: { src: string; alt: string };
}

/* ── Copy ────────────────────────────────────────────────────────────────── */

export interface CtaCopy {
  label: string;
  href: string;
}

export interface TenantCopy {
  /** Utility-bar statements. Only things the showroom itself says. */
  utility?: string[];
  /**
   * A quiet disclosure for demo storefronts: this is a demonstration built on
   * LivLab, not the showroom's own site and not a partnership.
   */
  demoNotice?: string;
  header?: {
    /** A real destination used when the quote workflow is not part of this release. */
    primaryCta?: CtaCopy;
    searchHref?: string;
    showSearch?: boolean;
    showSaved?: boolean;
    /** Collapse to the drawer early when the logo and four primary items need more room. */
    collapseAt?: 'lg' | 'xl';
  };
  hero: {
    eyebrow?: string;
    kicker?: string;
    titleLines: string[];
    body: string;
    primaryCta: CtaCopy;
    secondaryCta?: CtaCopy;
    /** Service facts under the `commerce` hero. Each must be true of the product today. */
    trust?: { title: string; body: string }[];
  };
  sections: {
    categoriesTitle: string;
    conceptsEyebrow?: string;
    conceptsTitle: string;
    conceptsBody?: string;
    productsEyebrow?: string;
    productsTitle: string;
    productsNote?: string;
    brandsTitle: string;
  };
  quote: {
    /** The header's primary action. */
    cta: string;
    trackLabel: string;
    drawerTitle: string;
    drawerBody?: string;
    submit: string;
    addToQuote: string;
  };
  roomStudio: {
    /** Title of the product library. Name the showroom only when the library IS its catalogue. */
    libraryTitle: string;
    primaryCta: string;
  };
  footerBlurb: string;
  footer?: {
    explore: Array<{ label: string; href: string }>;
    support: Array<{ label: string; href: string }>;
  };
  /** The `commerce` concept detail page. */
  concept?: {
    productsTitle: string;
    ctaTitle: string;
    ctaBody: string;
    /** The equipment total's label — equipment only, never the finished room. */
    estimateTitle: string;
  };
}

/* ── Room Studio ─────────────────────────────────────────────────────────── */

/**
 * Where Room Studio's product library comes from.
 *
 * `livlab` is the verified-products CSV Room Studio was built on. `tenant` is
 * the storefront's own catalogue, through the same tenant-scoped API the
 * product grid uses — so the room offers exactly what this showroom sells.
 */
export type RoomStudioCatalog = 'livlab' | 'tenant';

/**
 * A furnished starting room for demonstrations, opened with
 * `/room-studio?demo=1`.
 *
 * Products are referenced by catalogue id and placed by Room Studio's own
 * placement rules, as if the customer had dropped each one at its `at` point
 * (or pressed "+ THÊM"); nothing about their size or shape is set here. A product that no longer
 * resolves, or cannot be placed, is skipped. Without the query parameter
 * nothing here runs, so ordinary visits are untouched.
 */
export interface RoomStudioDemoRoom {
  /** Metres. */
  dimensions: { length: number; width: number; height: number };
  floor?: { material: string; color: string; finish: string };
  walls?: { material: string; color: string; finish: string };
  /**
   * `at` is a point on the floor plan in metres from the room's centre
   * (x along the length, z into the depth, back wall negative) — the same
   * thing a drop onto the canvas supplies. Placement rules still decide the
   * height and the wall and clamp it inside the room.
   */
  products: { id: string; at?: [number, number] }[];
  /** Which product starts selected. */
  selectProductId?: string;
}

/* ── The whole experience ────────────────────────────────────────────────── */

export interface TenantExperience {
  theme: TenantTheme;
  variants: TenantVariants;
  home: TenantHome;
  merchandising?: TenantMerchandising;
  copy: TenantCopy;
  roomStudioCatalog: RoomStudioCatalog;
  roomStudioDemo?: RoomStudioDemoRoom;
}

/**
 * The LivLab storefront as it already is. Every string here is the one the
 * editorial components were rendering before this layer existed, so a tenant
 * on this experience is pixel-for-pixel unchanged.
 */
export const EDITORIAL_EXPERIENCE: TenantExperience = {
  theme: {},
  variants: {
    header: 'editorial',
    hero: 'editorial',
    categoryNav: 'stage',
    productCard: 'editorial',
    conceptDetail: 'editorial',
    hotspot: 'neutral',
  },
  home: { layout: 'showcase', sections: [] },
  copy: {
    hero: {
      titleLines: ['Thấy trước không gian.', 'Chọn đúng thiết bị.'],
      body: 'Khám phá thiết bị thật trong từng không gian và thử trực tiếp với kích thước phòng của bạn.',
      primaryCta: { label: 'KHÁM PHÁ KHÔNG GIAN', href: '/concepts' },
      secondaryCta: { label: 'MỞ ROOM STUDIO', href: '/room-studio' },
    },
    sections: {
      categoriesTitle: 'SẢN PHẨM',
      conceptsTitle: 'KHÔNG GIAN',
      productsTitle: 'SẢN PHẨM NỔI BẬT',
      brandsTitle: 'THƯƠNG HIỆU',
    },
    quote: {
      cta: 'YÊU CẦU BÁO GIÁ',
      trackLabel: 'TRA CỨU BÁO GIÁ',
      drawerTitle: 'Giỏ báo giá của bạn',
      submit: 'Gửi yêu cầu báo giá',
      addToQuote: 'THÊM BÁO GIÁ',
    },
    roomStudio: { libraryTitle: 'Sản phẩm', primaryCta: 'Yêu cầu báo giá' },
    footerBlurb: 'Khám phá, phối thử và lựa chọn thiết bị phòng tắm trước khi quyết định.',
  },
  roomStudioCatalog: 'livlab',
};

/** LivLab's own values, used wherever a tenant leaves a token unset. */
const DEFAULT_TOKENS = {
  ink: '#1A1A18',
  inkContrast: '#FFFFFF',
  panelContrast: '#FFFFFF',
  surfaceMuted: '#F4F3F1',
  radius: 0,
  headingTracking: '.015em',
};

/**
 * The CSS custom properties a tenant controls, applied once on the shell.
 *
 * Derived tokens fall back to the accent (`accentInk`, `panel`), so a tenant
 * that only supplies an accent still gets a coherent page. The `--tenant-ui-*`
 * family is emitted only when the tenant sets it: the workspace components
 * carry their original colours as `var()` fallbacks, which is what keeps
 * LivLab's Room Studio exactly as it was.
 */
export function themeCssVars(
  accent: { accent: string; accentHover: string; accentContrast: string },
  theme: TenantTheme
): Record<string, string> {
  const vars: Record<string, string> = {
    '--tenant-accent': accent.accent,
    '--tenant-accent-hover': accent.accentHover,
    '--tenant-accent-contrast': accent.accentContrast,
    '--tenant-accent-ink': theme.accentInk ?? accent.accent,
    '--tenant-ink': theme.ink ?? DEFAULT_TOKENS.ink,
    '--tenant-ink-contrast': theme.inkContrast ?? DEFAULT_TOKENS.inkContrast,
    '--tenant-panel': theme.panel ?? accent.accent,
    '--tenant-panel-contrast': theme.panelContrast ?? DEFAULT_TOKENS.panelContrast,
    '--tenant-surface-muted': theme.surfaceMuted ?? DEFAULT_TOKENS.surfaceMuted,
    '--tenant-radius': `${theme.radius ?? DEFAULT_TOKENS.radius}px`,
    '--tenant-heading-tracking': theme.headingTracking ?? DEFAULT_TOKENS.headingTracking,
  };

  const optional: [string, string | undefined][] = [
    ['--tenant-price', theme.price],
    ['--tenant-discount', theme.discount],
    ['--tenant-ui-primary', theme.uiPrimary],
    ['--tenant-ui-primary-hover', theme.uiPrimaryHover],
    ['--tenant-ui-primary-contrast', theme.uiPrimaryContrast],
    ['--tenant-ui-selected', theme.uiSelected],
    ['--tenant-ui-selected-contrast', theme.uiSelectedContrast],
    ['--tenant-ui-soft', theme.uiSoft],
    ['--tenant-ui-soft-contrast', theme.uiSoftContrast],
    ['--tenant-ui-link', theme.uiLink],
    ['--tenant-ui-surface', theme.uiSurface],
    ['--tenant-ui-ink', theme.uiInk],
  ];
  for (const [name, value] of optional) if (value) vars[name] = value;
  if (theme.radius !== undefined) vars['--tenant-ui-radius'] = `${theme.radius}px`;

  return vars;
}
