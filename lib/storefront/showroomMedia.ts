/**
 * A showroom's own combos and videos — records, not page copy.
 *
 * Both are content the business published elsewhere (its Facebook page), so
 * each record says where it came from and whether it may be shown. Nothing
 * here is inferred: a combo's components, prices and validity are the
 * showroom's to confirm, and until it does the record stays unpublished.
 */

/** Where a record came from. */
export interface MediaSource {
  url: string;
  /** ISO date the business posted it, when the post shows one. */
  postedAt?: string;
  /** ISO date LivLab read it. */
  checkedAt: string;
}

export interface ComboComponent {
  /** What the business calls the part, in its own words. */
  label: string;
  quantity: number;
  /** A product in this tenant's catalogue, once the exact model is confirmed. */
  catalogProductId?: string;
  /** Size, colour or finish options the business mentions. */
  variantNote?: string;
}

export type ComboPricing =
  /** No confirmed figure: the combo is quoted on request. */
  | { status: 'CONTACT' }
  /** A figure the showroom confirmed for this combo, VND. */
  | { status: 'CONFIRMED'; amount: number; confirmedAt: string };

export type ComboValidity =
  /** An offer tied to a past date. Its terms are not repeated. */
  | { status: 'EXPIRED'; endedAt: string }
  /** No end date stated; the showroom confirms it on each quote. */
  | { status: 'ONGOING' };

export type Publication =
  /** Read from a public post; waits for the owner's approval and files. */
  | 'AWAITING_OWNER'
  | 'PUBLISHED';

export interface ShowroomCombo {
  id: string;
  tenantId: string;
  title: string;
  summary: string;
  components: ComboComponent[];
  pricing: ComboPricing;
  validity: ComboValidity;
  publication: Publication;
  source: MediaSource;
  /** What is still missing before it can be published. */
  pending?: string[];
}

export interface ShowroomVideo {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  /** The public post on the business's own Facebook page. */
  facebookUrl: string;
  /** Where the video leads on the storefront. */
  next: { label: string; href: string };
  publication: Publication;
  source: MediaSource;
}

/* ---------------------------------------------------------------- Giang Sơn */

export const SHOWROOM_COMBOS: ShowroomCombo[] = [
  {
    id: 'giangson-ban-da-voi-guong',
    tenantId: 'giangson',
    title: 'Bàn đá lavabo + vòi + gương LED',
    summary: 'Bàn đá lavabo hai tầng tràn viền, vòi lavabo và gương LED ba màu; bàn đá làm theo kích thước.',
    components: [
      { label: 'Bàn đá lavabo 2 tầng tràn viền', quantity: 1, variantNote: 'Nhiều mẫu, nhận làm theo kích thước' },
      { label: 'Vòi lavabo', quantity: 1 },
      { label: 'Gương LED 3 màu', quantity: 1 },
    ],
    // The post gives "1xxx" and "2xxx": masked figures, not prices.
    pricing: { status: 'CONTACT' },
    validity: { status: 'ONGOING' },
    publication: 'AWAITING_OWNER',
    source: {
      url: 'https://www.facebook.com/thietbigiangson/posts/639995171891324/',
      checkedAt: '2026-11-18',
    },
    pending: [
      'Mã hoặc quy cách từng thành phần (kích thước bàn đá, model vòi, kích thước gương)',
      'Giá xác nhận cho bộ, hoặc đồng ý hiển thị "Liên hệ báo giá"',
      'Ảnh gốc của showroom và quyền đăng trên website',
    ],
  },
  {
    id: 'giangson-combo-5-mon-2025-12',
    tenantId: 'giangson',
    title: 'Combo phòng tắm 5 món tông xám – đen mờ',
    summary:
      'Tủ lavabo kèm chậu đá nhân tạo vân marble, tủ gương LED, sen cây nóng lạnh đen mờ, bồn cầu ' +
      'liền khối dáng oval và bộ phụ kiện đen mờ.',
    components: [
      { label: 'Tủ lavabo + chậu đá nhân tạo vân marble', quantity: 1 },
      { label: 'Tủ gương LED viền sáng', quantity: 1 },
      { label: 'Bộ sen cây nóng lạnh inox 304 đen mờ', quantity: 1 },
      { label: 'Bồn cầu liền khối dáng oval', quantity: 1 },
      { label: 'Bộ phụ kiện đen mờ (kệ, móc, giá treo, cốc)', quantity: 1 },
    ],
    pricing: { status: 'CONTACT' },
    // "Giảm 20% so với mua lẻ" was a December 2025 year-end offer. It ended
    // and is not carried over.
    validity: { status: 'EXPIRED', endedAt: '2025-12-31' },
    publication: 'AWAITING_OWNER',
    source: {
      url: 'https://www.facebook.com/thietbigiangson/posts/879757214581784/',
      postedAt: '2025-12-29',
      checkedAt: '2026-11-18',
    },
    pending: [
      'Showroom xác nhận combo còn bán và thành phần hiện tại',
      'Thương hiệu, mã sản phẩm và kích thước từng món',
      'Giá hiện hành (ưu đãi 20% tháng 12/2025 đã hết hạn, không dùng lại)',
      'Ảnh gốc và quyền đăng trên website',
    ],
  },
];

export const SHOWROOM_VIDEOS: ShowroomVideo[] = [
  {
    id: 'giangson-video-tu-chau',
    tenantId: 'giangson',
    title: 'Tủ chậu lavabo tại Giang Sơn',
    description: 'Mẫu tủ chậu lavabo showroom đang giới thiệu.',
    facebookUrl: 'https://www.facebook.com/thietbigiangson/videos/1939802803485299/',
    next: { label: 'Hỏi giá tủ chậu', href: '/quote?interest=T%E1%BB%A7%20ch%E1%BA%ADu%20lavabo' },
    // Played through Facebook's own embedded player, from the business's
    // public page: nothing is copied or re-hosted.
    publication: 'PUBLISHED',
    source: { url: 'https://www.facebook.com/thietbigiangson/videos/1939802803485299/', checkedAt: '2026-11-18' },
  },
  {
    id: 'giangson-video-gioi-thieu',
    tenantId: 'giangson',
    title: 'Thiết bị vệ sinh Giang Sơn',
    description: 'Video giới thiệu từ trang Facebook của showroom.',
    facebookUrl: 'https://www.facebook.com/thietbigiangson/videos/1717154986188552/',
    next: { label: 'Chỉ đường đến showroom', href: '/#showroom' },
    publication: 'PUBLISHED',
    source: { url: 'https://www.facebook.com/thietbigiangson/videos/1717154986188552/', checkedAt: '2026-11-18' },
  },
];

/**
 * A combo the storefront may show: approved, and — when it names catalogue
 * products — every one of them still in the catalogue, so "add the whole set
 * to the quote" never adds a product that is gone.
 */
export function publishedCombos(tenantId: string, catalogIds: ReadonlySet<string>): ShowroomCombo[] {
  return SHOWROOM_COMBOS.filter(
    (c) =>
      c.tenantId === tenantId &&
      c.publication === 'PUBLISHED' &&
      c.validity.status !== 'EXPIRED' &&
      c.components.every((part) => !part.catalogProductId || catalogIds.has(part.catalogProductId))
  );
}

export function publishedVideos(tenantId: string): ShowroomVideo[] {
  return SHOWROOM_VIDEOS.filter((v) => v.tenantId === tenantId && v.publication === 'PUBLISHED');
}

/** Facebook's embedded player for a public video. Loaded only after the visitor presses play. */
export function facebookPlayerUrl(videoUrl: string): string {
  const params = new URLSearchParams({ href: videoUrl, show_text: 'false', autoplay: 'true', width: '720' });
  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}
