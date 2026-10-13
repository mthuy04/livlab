import type { ConceptHotspot, StorefrontConcept } from './conceptTypes';

/**
 * The Phase-1 concept library: five rooms, annotated by hand.
 *
 * Every coordinate here was read off the canonical 1448×1086 asset with a
 * pixel grid, one fixture at a time, and every mapping was argued against the
 * tenant's own product photographs rather than against a product name. The
 * `note` on each hotspot is that argument, kept so a later editor can disagree
 * with it on the evidence instead of re-deriving it.
 *
 * A caveat governs the whole file. These five rooms are generated scenes, not
 * photographs of a showroom and not renders built from manufacturer CAD. The
 * fixtures in them are plausible objects, not specific models. So nothing here
 * is `EXACT_VISUAL`: a generated bowl that resembles a TOTO is not a TOTO, and
 * a storefront that says otherwise is wrong in the one place a customer would
 * never think to check. `CLOSE_VISUAL_MATCH` — rendered as "sản phẩm gợi ý
 * tương đồng" — is the strongest claim the evidence supports, and it is the
 * claim we make.
 */

/** Natural pixel dimensions every percentage below was measured against. */
export const CONCEPT_IMAGE_WIDTH = 1448;
export const CONCEPT_IMAGE_HEIGHT = 1086;

const pct = (x: number, y: number) => ({
  xPct: Number(((x / CONCEPT_IMAGE_WIDTH) * 100).toFixed(2)),
  yPct: Number(((y / CONCEPT_IMAGE_HEIGHT) * 100).toFixed(2)),
});

const box = (x0: number, y0: number, x1: number, y1: number) => ({
  xPct: Number(((x0 / CONCEPT_IMAGE_WIDTH) * 100).toFixed(2)),
  yPct: Number(((y0 / CONCEPT_IMAGE_HEIGHT) * 100).toFixed(2)),
  widthPct: Number((((x1 - x0) / CONCEPT_IMAGE_WIDTH) * 100).toFixed(2)),
  heightPct: Number((((y1 - y0) / CONCEPT_IMAGE_HEIGHT) * 100).toFixed(2)),
});

/**
 * Catalogue ids are `demo:<tenant>:<BRAND>:<NORMALISED SKU>`.
 *
 * Built through the same helper the catalogue uses rather than pasted, so a
 * change to the identity scheme breaks here loudly instead of silently
 * orphaning every hotspot in the library.
 */
const demoId = (tenantId: string, brand: string, sku: string) =>
  `demo:${tenantId}:${brand.toUpperCase()}:${sku.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

/** The showroom these five concepts were annotated against. */
export const PHASE1_TENANT = 'tungdang';

type HotspotSeed = Omit<ConceptHotspot, 'id' | 'conceptId'>;

const h = (conceptId: string, i: number, seed: HotspotSeed): ConceptHotspot => ({
  id: `${conceptId}-h${i}`,
  conceptId,
  ...seed,
});

/* ----------------------------------------------------------- shared fixtures */

/**
 * The same exposed shower column appears in four of the five scenes.
 *
 * Mapping four rooms to one SKU looks lazy and is not: the rendered columns
 * are the same object — gooseneck arm, round rain head, riser-mounted handset,
 * chrome — and inventing four different SKUs to make the library look varied
 * would be the exact dishonesty this rebuild exists to remove.
 */
const SHOWER_COLUMN = {
  brand: 'JOMOO',
  sku: 'P36412-484/1B-1',
  note:
    'Cây sen lộ thiên, bát sen tròn trên tay cần cong, tay sen gắn trên thanh trượt, mạ chrome. ' +
    'Khớp hình dáng tổng thể; không thể xác định model chính xác từ một cảnh dựng.',
};

const VESSEL_BASIN_RECT = {
  brand: 'JOMOO',
  sku: '12132-1/01Z',
  note:
    'Chậu đặt bàn hình chữ nhật, góc bo nhẹ, thành mỏng, men trắng. ' +
    'Khớp kiểu lắp đặt và tỷ lệ; không thể xác định model chính xác.',
};

/* -------------------------------------------------------------------- C01 */

const C01_ID = 'c01-urban-light-spa';

const c01: StorefrontConcept = {
  id: C01_ID,
  slug: 'urban-light-spa',
  title: 'Urban Light Spa',
  titleVi: 'Phòng tắm sáng & gọn cho căn hộ hiện đại',
  description:
    'Phòng tắm căn hộ nhỏ gọn với bề mặt trung tính sáng, vách kính trong suốt và điểm nhấn gỗ ấm, ' +
    'bố trí theo tuyến thẳng để lối đi không bị cắt ngang.',
  whyItWorks: [
    'Bề mặt sáng đồng tông làm căn phòng hẹp bớt cảm giác bị chia nhỏ.',
    'Vách kính trong giữ tầm nhìn liền mạch tới cửa sổ thay vì chặn lại ở khu tắm.',
    'Gỗ ấm ở tủ lavabo làm dịu nền đá xám, tránh cảm giác lạnh của phòng toàn sứ trắng.',
  ],
  canonicalImage: '/concepts/modern-spa-like-bathroom-interior.webp',
  imageAlt:
    'Phòng tắm căn hộ nhỏ tông xám sáng: bồn cầu hai khối bên trái, buồng tắm kính ở giữa, ' +
    'tủ lavabo gỗ với mặt bàn đúc liền bên phải.',
  imageHash: '8018b608b62ab73fb77fb77f',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'modern_spa_like_bathroom_interior.png',
  style: 'MODERN_MINIMAL',
  useCase: 'URBAN_APARTMENT',
  areaBand: 'COMPACT',
  budgetBand: 'ENTRY_TO_MID',
  tone: 'LIGHT_NEUTRAL',
  /**
   * Held back, and the reason is a catalogue gap rather than a bad picture.
   *
   * Three of the six fixtures in this room — the moulded vanity top, the
   * mirror and the cabinet — are product categories this showroom does not
   * stock at all, and the fourth, the basin mixer, has only a dimension
   * drawing on file, which is not evidence of a silhouette. That leaves two
   * defensible mappings against a floor of three.
   */
  publicationStatus: 'QA_PENDING',
  qaNote:
    'Chỉ map được 2/6 thiết bị (ngưỡng tối thiểu 3). Mặt bàn đúc liền, gương và tủ không có ' +
    'trong danh mục tenant; vòi lavabo chỉ có bản vẽ kỹ thuật nên không đủ căn cứ so hình. ' +
    'Sẽ đạt ngưỡng ngay khi vòi INAX có ảnh sản phẩm thật.',
  tenantId: null,
  hotspots: [
    h(C01_ID, 1, {
      targetType: 'TOILET',
      ...pct(300, 720),
      bbox: box(190, 500, 430, 950),
      catalogProductId: demoId(PHASE1_TENANT, 'TOTO', 'CS769DRT8'),
      brand: 'TOTO',
      sku: 'CS769DRT8',
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note:
        'Bồn cầu hai khối, két hộp nắp phẳng, thân liền chân, nắp bầu dục. ' +
        'Khớp kiểu két và dáng thân; không thể xác định model chính xác từ một cảnh dựng.',
    }),
    h(C01_ID, 2, {
      targetType: 'SHOWER',
      ...pct(838, 350),
      bbox: box(700, 60, 900, 580),
      catalogProductId: demoId(PHASE1_TENANT, SHOWER_COLUMN.brand, SHOWER_COLUMN.sku),
      ...SHOWER_COLUMN,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C01_ID, 3, {
      targetType: 'BASIN',
      ...pct(1150, 600),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        'Mặt bàn đúc liền khối: chậu, mặt bàn và yếm trước là một khối liền, không có đường ' +
        'nối vành. Danh mục tenant chỉ có chậu rời (đặt bàn / âm bàn / bán âm) — không có sản phẩm tương ứng.',
    }),
    h(C01_ID, 4, {
      targetType: 'FAUCET',
      ...pct(1247, 505),
      matchConfidence: 'UNVERIFIED',
      qaStatus: 'VERIFIED',
      note:
        'Vòi gật gù một tay chỉnh, mạ chrome. Hai vòi INAX trong danh mục chỉ có bản vẽ kỹ ' +
        'thuật làm ảnh chính — không đọc được dáng vòi, bề mặt hay kiểu đầu ra, nên không đủ căn cứ so hình.',
    }),
    h(C01_ID, 5, {
      targetType: 'MIRROR',
      ...pct(1230, 230),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Danh mục tenant không có nhóm gương.',
    }),
  ],
};

/* -------------------------------------------------------------------- C02 */

const C02_ID = 'c02-soft-scandinavian-bath';

const c02: StorefrontConcept = {
  id: C02_ID,
  slug: 'soft-scandinavian-bath',
  title: 'Soft Scandinavian Bath',
  titleVi: 'Phòng tắm Scandinavian ấm sáng',
  description:
    'Phòng tắm tông Scandinavian với gỗ sáng, đá trung tính ấm, phụ kiện chrome đơn giản ' +
    'và ánh sáng tự nhiên được giữ cân bằng.',
  whyItWorks: [
    'Gỗ sáng và đá ấm cùng độ bão hoà thấp nên không có bề mặt nào tranh phần nhìn.',
    'Mặt bàn dài liền khối cho chỗ để đồ hằng ngày mà không cần thêm kệ nổi.',
    'Cửa sổ đặt giữa trục bồn cầu và khu tắm, chia ánh sáng cho cả hai khu.',
  ],
  canonicalImage: '/concepts/scandinavian-bathroom-with-warm-accents.webp',
  imageAlt:
    'Phòng tắm Scandinavian tông ấm: tủ lavabo gỗ và mặt bàn đúc liền bên trái, ' +
    'bồn cầu hai khối ở giữa, buồng tắm kính bên phải.',
  imageHash: '1c00068c67cd6fcd2fdf3fdf',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'scandinavian_bathroom_with_warm_accents.png',
  style: 'SCANDINAVIAN',
  useCase: 'YOUNG_FAMILY',
  areaBand: 'COMPACT_TO_MEDIUM',
  budgetBand: 'ENTRY_TO_MID',
  tone: 'WARM_LIGHT',
  publicationStatus: 'QA_PENDING',
  qaNote:
    'Chỉ map được 2/6 thiết bị (ngưỡng tối thiểu 3). Cùng nguyên nhân với C01: mặt bàn đúc ' +
    'liền, gương, tủ không có trong danh mục; vòi chỉ có bản vẽ kỹ thuật.',
  tenantId: null,
  hotspots: [
    h(C02_ID, 1, {
      targetType: 'TOILET',
      ...pct(742, 726),
      bbox: box(600, 530, 900, 920),
      catalogProductId: demoId(PHASE1_TENANT, 'TOTO', 'CS769DRT8'),
      brand: 'TOTO',
      sku: 'CS769DRT8',
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note:
        'Cùng thiết bị với C01, nhìn từ góc chính diện hơn: hai khối, két hộp nắp phẳng, ' +
        'thân liền chân. Không thể xác định model chính xác.',
    }),
    h(C02_ID, 2, {
      targetType: 'SHOWER',
      ...pct(1000, 380),
      bbox: box(900, 50, 1120, 600),
      catalogProductId: demoId(PHASE1_TENANT, SHOWER_COLUMN.brand, SHOWER_COLUMN.sku),
      ...SHOWER_COLUMN,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C02_ID, 3, {
      targetType: 'BASIN',
      ...pct(300, 600),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Mặt bàn đúc liền khối — danh mục tenant chỉ có chậu rời.',
    }),
    h(C02_ID, 4, {
      targetType: 'FAUCET',
      ...pct(300, 495),
      matchConfidence: 'UNVERIFIED',
      qaStatus: 'VERIFIED',
      note: 'Vòi trong danh mục chỉ có bản vẽ kỹ thuật — không đủ căn cứ so hình.',
    }),
  ],
};

/* -------------------------------------------------------------------- C03 */

const C03_ID = 'c03-warm-smart-retreat';

const c03: StorefrontConcept = {
  id: C03_ID,
  slug: 'warm-smart-retreat',
  title: 'Warm Smart Retreat',
  titleVi: 'Phòng tắm smart ấm áp cho gia đình trẻ',
  description:
    'Hướng phòng tắm thông minh tông ấm: bồn cầu điện tử không két, chậu đặt bàn, ' +
    'gương hắt sáng và khu tắm kính tách riêng.',
  whyItWorks: [
    'Bồn cầu không két giải phóng mảng tường phía sau, phòng đọc gọn hơn thực tế.',
    'Ánh sáng hắt sau gương và trong hốc tường thay cho đèn trần, nên không có bóng đổ gắt trên mặt.',
    'Đá tông ấm và gỗ sáng giữ nhiệt độ màu đồng nhất với ánh sáng vàng.',
  ],
  canonicalImage: '/concepts/warm-luxury-spa-bathroom.webp',
  imageAlt:
    'Phòng tắm tông ấm với bồn cầu điện tử không két bên trái, buồng tắm kính ở giữa ' +
    'và chậu rửa đặt bàn trên mặt đá bên phải.',
  imageHash: '8118b610b633b77ab7fab772',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'warm_luxury_spa_bathroom.png',
  style: 'SMART_MODERN',
  useCase: 'SMART_LIVING',
  areaBand: 'MEDIUM',
  budgetBand: 'MID_TO_PREMIUM',
  tone: 'WARM_NEUTRAL',
  publicationStatus: 'PUBLISHED_VERIFIED',
  tenantId: null,
  hotspots: [
    h(C03_ID, 1, {
      targetType: 'TOILET',
      ...pct(295, 740),
      bbox: box(150, 580, 440, 910),
      catalogProductId: demoId(PHASE1_TENANT, 'JOMOO', 'ZD6310-SA-IDO305'),
      brand: 'JOMOO',
      sku: 'ZD6310-SA-IDO305',
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note:
        'Bồn cầu thông minh không két, nắp điện tử liền thân, bảng điều khiển bên hông, ' +
        'dáng trứng liền mạch, men trắng. Khớp loại và dáng; model chính xác không xác định được.',
    }),
    h(C03_ID, 2, {
      targetType: 'BASIN',
      ...pct(1150, 565),
      bbox: box(985, 510, 1330, 625),
      catalogProductId: demoId(PHASE1_TENANT, 'JOMOO', 'P12663-1/01Z-1'),
      brand: 'JOMOO',
      sku: 'P12663-1/01Z-1',
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note:
        'Chậu đặt bàn dáng bầu dục mềm, thành cong, men trắng, đặt nổi trên mặt đá. ' +
        'Khớp kiểu lắp đặt và dáng; model chính xác không xác định được.',
    }),
    h(C03_ID, 3, {
      targetType: 'SHOWER',
      ...pct(810, 400),
      bbox: box(660, 60, 900, 560),
      catalogProductId: demoId(PHASE1_TENANT, SHOWER_COLUMN.brand, SHOWER_COLUMN.sku),
      ...SHOWER_COLUMN,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C03_ID, 4, {
      targetType: 'FAUCET',
      ...pct(1185, 490),
      matchConfidence: 'UNVERIFIED',
      qaStatus: 'VERIFIED',
      note: 'Vòi cao thân trụ. Danh mục chỉ có bản vẽ kỹ thuật — không đủ căn cứ so hình.',
    }),
    h(C03_ID, 5, {
      targetType: 'MIRROR',
      ...pct(1230, 250),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Gương hắt sáng LED — danh mục tenant không có nhóm gương.',
    }),
  ],
};

/* -------------------------------------------------------------------- C04 */

const C04_ID = 'c04-serene-premium-suite';

const c04: StorefrontConcept = {
  id: C04_ID,
  slug: 'serene-premium-suite',
  title: 'Serene Premium Suite',
  titleVi: 'Phòng tắm nghỉ dưỡng thanh lịch',
  description:
    'Phòng tắm cao cấp tông đá ấm, ánh sáng được tiết chế, buồng tắm kính và ' +
    'không khí gần với phòng tắm khách sạn.',
  whyItWorks: [
    'Một loại đá duy nhất chạy từ sàn lên tường, nên mắt không bị cắt bởi đường chuyển vật liệu.',
    'Ánh sáng hắt trong hốc tường và sau gương thay cho đèn chiếu thẳng.',
    'Khu tắm không bậc, cùng cốt sàn với phần còn lại, giữ mặt sàn liền một mảng.',
  ],
  canonicalImage: '/concepts/serene-luxury-spa-bathroom.webp',
  imageAlt:
    'Phòng tắm tông đá travertine ấm: bồn cầu một khối bên trái, buồng tắm kính ở giữa, ' +
    'chậu rửa đặt bàn trên mặt đá bên phải.',
  imageHash: '83f8b610b630b63cb67cb77c',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'serene_luxury_spa_bathroom.png',
  style: 'SERENE_LUXURY',
  useCase: 'PREMIUM_SUITE',
  areaBand: 'MEDIUM_TO_LARGE',
  budgetBand: 'PREMIUM',
  tone: 'WARM_STONE',
  publicationStatus: 'PUBLISHED_VERIFIED',
  tenantId: null,
  hotspots: [
    h(C04_ID, 1, {
      targetType: 'TOILET',
      ...pct(310, 740),
      bbox: box(180, 545, 450, 930),
      catalogProductId: demoId(PHASE1_TENANT, 'JOMOO', '11411-2-231K-1'),
      brand: 'JOMOO',
      sku: '11411-2-231K-1',
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note:
        'Bồn cầu một khối, chuyển từ két xuống thân liền mạch không có đường nối, thân liền ' +
        'chân, nắp bầu dục. Khớp kiểu một khối và dáng; model chính xác không xác định được.',
    }),
    h(C04_ID, 2, {
      targetType: 'BASIN',
      ...pct(1288, 598),
      bbox: box(1175, 555, 1420, 655),
      catalogProductId: demoId(PHASE1_TENANT, VESSEL_BASIN_RECT.brand, VESSEL_BASIN_RECT.sku),
      ...VESSEL_BASIN_RECT,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C04_ID, 3, {
      targetType: 'SHOWER',
      ...pct(828, 390),
      bbox: box(660, 50, 900, 560),
      catalogProductId: demoId(PHASE1_TENANT, SHOWER_COLUMN.brand, SHOWER_COLUMN.sku),
      ...SHOWER_COLUMN,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C04_ID, 4, {
      targetType: 'FAUCET',
      ...pct(1222, 492),
      matchConfidence: 'UNVERIFIED',
      qaStatus: 'VERIFIED',
      note: 'Danh mục chỉ có bản vẽ kỹ thuật — không đủ căn cứ so hình.',
    }),
  ],
};

/* -------------------------------------------------------------------- C05 */

const C05_ID = 'c05-master-spa-retreat';

const c05: StorefrontConcept = {
  id: C05_ID,
  slug: 'master-spa-retreat',
  title: 'Master Spa Retreat',
  titleVi: 'Master bathroom phong cách spa tại nhà',
  description:
    'Phòng tắm master rộng, tổ chức quanh bồn tắm đặt sàn, mặt bàn đôi, ' +
    'khu tắm tách riêng và bảng vật liệu tông ấm tự nhiên.',
  whyItWorks: [
    'Bồn tắm đặt tự do trước cửa sổ, nên khung nhìn là phần kết của trục đi chính.',
    'Mặt bàn đôi tách hai khu dùng buổi sáng mà không cần thêm vách ngăn.',
    'Khu tắm và khu vệ sinh dồn về một phía, để phần sàn còn lại liền mạch.',
  ],
  canonicalImage: '/concepts/luxury-smart-bathroom-retreat.webp',
  imageAlt:
    'Phòng tắm master rộng tông đá ấm: mặt bàn đôi với hai chậu đặt bàn bên trái, ' +
    'bồn tắm đặt sàn trước cửa sổ, buồng tắm kính và bồn cầu bên phải.',
  imageHash: 'ffc89f881000dfe0dfe897e1',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'luxury_smart_bathroom_retreat.png',
  style: 'WARM_LUXURY',
  useCase: 'MASTER_BATHROOM',
  areaBand: 'LARGE',
  budgetBand: 'PREMIUM_PLUS',
  tone: 'NATURAL_WARM',
  publicationStatus: 'PUBLISHED_VERIFIED',
  tenantId: null,
  hotspots: [
    h(C05_ID, 1, {
      targetType: 'BATHTUB',
      ...pct(670, 630),
      bbox: box(468, 505, 873, 760),
      catalogProductId: demoId(PHASE1_TENANT, 'Viglacera', 'P.61.320'),
      brand: 'Viglacera',
      sku: 'P.61.320',
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note:
        'Bồn tắm đặt sàn dáng bầu dục, thành trơn vuốt thon, men trắng mờ, đặt tách khỏi tường. ' +
        'Là bồn đặt sàn duy nhất trong danh mục khớp kiểu lắp đặt — các bồn còn lại đều là ' +
        'bồn xây hoặc chân yếm. Model chính xác không xác định được.',
    }),
    h(C05_ID, 2, {
      targetType: 'BASIN',
      ...pct(265, 567),
      bbox: box(185, 535, 345, 600),
      catalogProductId: demoId(PHASE1_TENANT, VESSEL_BASIN_RECT.brand, VESSEL_BASIN_RECT.sku),
      ...VESSEL_BASIN_RECT,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C05_ID, 3, {
      targetType: 'BASIN',
      ...pct(150, 648),
      bbox: box(0, 595, 215, 700),
      catalogProductId: demoId(PHASE1_TENANT, VESSEL_BASIN_RECT.brand, VESSEL_BASIN_RECT.sku),
      ...VESSEL_BASIN_RECT,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note: `${VESSEL_BASIN_RECT.note} Chậu thứ hai của mặt bàn đôi, cùng model với chậu bên trong.`,
    }),
    h(C05_ID, 4, {
      targetType: 'TOILET',
      ...pct(1345, 740),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        'Bồn cầu đặt sàn sát tường, két âm (thấy nút xả trên tường), không có két lộ. ' +
        'Bồn cầu không két duy nhất trong danh mục là JOMOO 11413-2-211K loại treo tường — ' +
        'khác kiểu lắp đặt, nên không map.',
    }),
    h(C05_ID, 5, {
      targetType: 'SHOWER',
      ...pct(1100, 300),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        'Bát sen tròn gắn trần cộng tay sen trên thanh ngắn, van âm tường. Hai bộ sen âm ' +
        'tường trong danh mục đều dùng bát sen vuông gắn tường — khác kiểu gắn và khác dáng bát sen.',
    }),
  ],
};

/**
 * Order is editorial, not alphabetical: the two rooms a customer is most
 * likely to be shopping for come first.
 */
export const CONCEPT_LIBRARY: StorefrontConcept[] = [c03, c04, c05, c01, c02];
