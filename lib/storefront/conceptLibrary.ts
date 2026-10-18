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

/**
 * Phase-2 coordinates were read on a 420x315 copy of each scene, Phase-1 ones
 * on 1448x1086, and both batches now ship at 1448x1086. The helpers keep each
 * batch's own measuring frame and emit percentages, so the frame a coordinate
 * was read in stops mattering the moment it is written.
 *
 * That is not a theoretical nicety: the Phase-2 scenes arrived first as one
 * low-resolution composite and were replaced with full-resolution originals
 * afterwards, and not one of the 26 points had to be measured again. The
 * replacement was checked by overlaying the existing coordinates on the new
 * files — every point still sits on the fixture it names.
 */
export const PHASE2_IMAGE_WIDTH = 420;
export const PHASE2_IMAGE_HEIGHT = 315;

const at = (w: number, h: number) => ({
  pct: (x: number, y: number) => ({
    xPct: Number(((x / w) * 100).toFixed(2)),
    yPct: Number(((y / h) * 100).toFixed(2)),
  }),
  box: (x0: number, y0: number, x1: number, y1: number) => ({
    xPct: Number(((x0 / w) * 100).toFixed(2)),
    yPct: Number(((y0 / h) * 100).toFixed(2)),
    widthPct: Number((((x1 - x0) / w) * 100).toFixed(2)),
    heightPct: Number((((y1 - y0) / h) * 100).toFixed(2)),
  }),
});

const { pct, box } = at(CONCEPT_IMAGE_WIDTH, CONCEPT_IMAGE_HEIGHT);
const { pct: p2, box: b2 } = at(PHASE2_IMAGE_WIDTH, PHASE2_IMAGE_HEIGHT);

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
/**
 * The basin mixer in the two compact rooms.
 *
 * This mapping was rejected once, on the grounds that the catalogue holds a
 * dimension drawing rather than a photograph and a drawing is not evidence of
 * a silhouette. Reading the drawing instead of dismissing it reverses that:
 * the elevation gives body height, spout height and reach to the millimetre,
 * and shows a squared body with a flat paddle lever and a stepped spout —
 * more shape information than most product photographs carry, not less.
 *
 * The drawing is still what a customer sees in the hotspot card, which is a
 * catalogue gap rather than a mapping error: these two SKUs already appear
 * that way on `/products` today. The fix is a photograph, not a weaker claim.
 */
const BASIN_MIXER_LOW = {
  brand: 'INAX',
  sku: 'LFV-6002S',
  note:
    'Vòi một lỗ, một tay gạt bẹt ngả sau, thân vuông thuôn, vòi bậc phẳng nhô ngang ở lưng chừng ' +
    'thân — khớp bản vẽ hình chiếu cạnh (cao 151mm, vòi 85mm, vươn 105mm) với thiết bị trong ảnh. ' +
    'Bề mặt không ghi trong dữ liệu, không mâu thuẫn với chrome trong cảnh. Model chính xác không xác định được.',
};

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
  shortDescription:
    'Không gian sáng, gọn và dễ ứng dụng, cân bằng giữa thiết bị thiết yếu, ánh sáng tự nhiên ' +
    'và vật liệu trung tính cho nhịp sống đô thị.',
  conceptStory:
    'Urban Light Spa được phát triển cho những phòng tắm căn hộ cần tối ưu diện tích mà vẫn giữ ' +
    'cảm giác thoáng và thư giãn. Bảng màu trắng – xám sáng giúp mở rộng cảm nhận thị giác, ' +
    'trong khi bề mặt gỗ sáng bổ sung độ ấm để không gian không trở nên lạnh hoặc quá kỹ thuật.\n\n' +
    'Khu lavabo, bồn cầu và khu tắm được phân chia rõ ràng nhưng vẫn duy trì sự liên tục nhờ vách ' +
    'kính trong suốt. Các thiết bị có hình khối gọn, đường nét đơn giản và hoàn thiện chrome giúp ' +
    'tổng thể dễ phối, dễ sử dụng và phù hợp với nhu cầu sinh hoạt hàng ngày. Đây là concept hướng ' +
    'tới sự đơn giản, hiệu quả và thoải mái trong một diện tích vừa đủ.',
  designPrinciples: [
    'Tối ưu diện tích nhưng không tạo cảm giác chật.',
    'Bảng màu sáng giúp không gian nhẹ và liền mạch.',
    'Kính trong duy trì sự phân khu mà không chia cắt thị giác.',
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
  publicationStatus: 'PUBLISHED_VERIFIED',
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
      bbox: box(1200, 460, 1300, 560),
      catalogProductId: demoId(PHASE1_TENANT, BASIN_MIXER_LOW.brand, BASIN_MIXER_LOW.sku),
      ...BASIN_MIXER_LOW,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
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
  shortDescription:
    'Gỗ sáng, bề mặt trung tính và ánh sáng mềm tạo nên một phòng tắm giản dị, ấm áp ' +
    'và thân thiện với nhịp sống gia đình.',
  conceptStory:
    'Soft Scandinavian Bath tập trung vào cảm giác gần gũi và dễ sống thay vì sự phô trương. ' +
    'Gỗ sáng đóng vai trò làm ấm không gian, kết hợp cùng các bề mặt đá và sứ màu trung tính để ' +
    'tạo nên một bảng vật liệu nhẹ nhàng, sạch và bền về thị giác.\n\n' +
    'Các thiết bị được sắp xếp theo trật tự rõ ràng, ưu tiên khoảng lưu thông và khả năng sử dụng ' +
    'hàng ngày. Ánh sáng tự nhiên cùng chiếu sáng gián tiếp quanh gương giúp khu lavabo trở thành ' +
    'điểm cân bằng của căn phòng, trong khi khu tắm được tách bằng kính để giữ không gian mở. ' +
    'Concept phù hợp với người dùng tìm kiếm một phòng tắm tối giản nhưng không lạnh, hiện đại ' +
    'nhưng vẫn có cảm giác nhà.',
  designPrinciples: [
    'Gỗ sáng cân bằng độ lạnh của sứ và đá.',
    'Thiết bị có hình khối đơn giản, dễ kết hợp.',
    'Ánh sáng mềm tạo cảm giác bình tĩnh và thân thiện.',
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
  publicationStatus: 'PUBLISHED_VERIFIED',
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
      bbox: box(250, 450, 350, 550),
      catalogProductId: demoId(PHASE1_TENANT, BASIN_MIXER_LOW.brand, BASIN_MIXER_LOW.sku),
      ...BASIN_MIXER_LOW,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note: `${BASIN_MIXER_LOW.note} Cùng thiết bị với C01, nhìn từ góc khác.`,
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
  shortDescription:
    'Một không gian hiện đại kết hợp thiết bị thông minh với vật liệu ấm, giúp công nghệ hòa vào ' +
    'trải nghiệm thay vì trở thành điểm phô diễn.',
  conceptStory:
    'Warm Smart Retreat được xây dựng từ ý tưởng rằng một phòng tắm thông minh không nhất thiết ' +
    'phải trông lạnh hoặc mang cảm giác công nghệ. Những thiết bị hiện đại được đặt trong nền vật ' +
    'liệu đá ấm, gỗ nhẹ và ánh sáng gián tiếp để tạo ra một trải nghiệm mềm mại và thư giãn hơn.\n\n' +
    'Bồn cầu thông minh, gương có chiếu sáng tích hợp và khu tắm được tổ chức thành những điểm chức ' +
    'năng rõ ràng, trong khi lavabo đặt bàn trở thành điểm nhấn thị giác ở khu rửa mặt. Công nghệ ' +
    'xuất hiện vừa đủ để tăng tiện nghi nhưng không phá vỡ sự yên tĩnh của không gian. Concept phù ' +
    'hợp với gia đình trẻ muốn nâng cấp trải nghiệm hằng ngày mà vẫn giữ sự ấm áp, tinh gọn và dễ sử dụng.',
  designPrinciples: [
    'Công nghệ được tích hợp kín đáo vào không gian.',
    'Ánh sáng đóng vai trò tạo cảm giác thư giãn.',
    'Tương phản giữa sứ trắng và vật liệu ấm tạo chiều sâu.',
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
  shortDescription:
    'Vật liệu đá ấm, kính trong và ánh sáng được kiểm soát tạo nên trải nghiệm phòng tắm mang ' +
    'tinh thần khách sạn cao cấp nhưng vẫn nhẹ nhàng.',
  conceptStory:
    'Serene Premium Suite lấy cảm hứng từ cảm giác yên tĩnh của những phòng tắm khách sạn cao cấp, ' +
    'nơi mỗi chi tiết được tổ chức để giảm bớt sự nhiễu thị giác. Bảng màu đá ấm và các bề mặt lớn ' +
    'tạo nền thống nhất, trong khi kính trong giữ sự kết nối giữa khu tắm và phần còn lại của căn phòng.\n\n' +
    'Thiết bị được lựa chọn theo hướng hình khối tinh gọn và tỷ lệ cân bằng, để chúng trở thành một ' +
    'phần của kiến trúc thay vì những vật thể đứng riêng lẻ. Ánh sáng gián tiếp được sử dụng để làm ' +
    'mềm bề mặt vật liệu và tạo chiều sâu vào buổi tối. Tổng thể hướng tới một phòng tắm thanh lịch, ' +
    'ổn định và có cảm giác nghỉ dưỡng dài lâu, thay vì chỉ tạo ấn tượng trong lần nhìn đầu tiên.',
  designPrinciples: [
    'Vật liệu lớn và ít đường chia giúp không gian sang hơn.',
    'Kính trong duy trì cảm giác mở và liền mạch.',
    'Ánh sáng gián tiếp làm nổi vật liệu thay vì trang trí quá mức.',
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
  shortDescription:
    'Một phòng tắm master rộng rãi với bồn tắm độc lập, khu tắm riêng và kết nối ánh sáng – ' +
    'thiên nhiên để tạo trải nghiệm nghỉ dưỡng tại nhà.',
  conceptStory:
    'Master Spa Retreat xem phòng tắm master như một không gian phục hồi năng lượng, không chỉ là ' +
    'nơi hoàn thành các chức năng vệ sinh hằng ngày. Bồn tắm độc lập được đặt ở vị trí trung tâm ' +
    'của trải nghiệm, hướng về nguồn sáng tự nhiên và khoảng nhìn rộng để tạo cảm giác mở và thư thái.\n\n' +
    'Khu tắm được tách riêng bằng kính trong, trong khi mặt bàn dài tạo một trục ngang ổn định cho ' +
    'toàn bộ bố cục. Gỗ, đá sáng và các chi tiết kim loại trung tính giữ cho không gian sang nhưng ' +
    'không nặng nề. Thay vì lấp đầy căn phòng bằng nhiều chi tiết trang trí, concept ưu tiên tỷ lệ, ' +
    'khoảng trống và ánh sáng — những yếu tố giúp phòng tắm mang tinh thần spa tại nhà, yên tĩnh và ' +
    'có chiều sâu.',
  designPrinciples: [
    'Bồn tắm là điểm nhìn chính, không phải bồn cầu.',
    'Kết nối ánh sáng tự nhiên làm tăng cảm giác nghỉ dưỡng.',
    'Khoảng trống và tỷ lệ quan trọng hơn số lượng đồ trang trí.',
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


/* ================================================================== PHASE 2 */

/**
 * Five more rooms, and a finding that matters more than the rooms.
 *
 * These scenes are furnished from a product palette this showroom does not
 * stock: wall-mounted brassware in black and bronze, concealed showers with
 * round heads, tall vessel mixers, basins cut straight into stone. The
 * catalogue is deck-mounted chrome, exposed columns with a visible riser,
 * square-headed concealed sets and separate ceramic bowls. Nearly every
 * fixture a reader would point at is a category away from anything on sale.
 *
 * So four of the five hold below the publication floor, and the notes below
 * record what each one would need. That is the useful output: not five rooms
 * forced live on loose matches, but a precise list of the four products that
 * would unlock them.
 */

const WALL_HUNG_WC = {
  brand: 'JOMOO',
  sku: '11413-2-211K',
  note:
    'Bồn cầu treo tường, két âm, thân trơn không vành, nắp D. Là bồn cầu treo tường duy nhất ' +
    'trong danh mục và khớp kiểu lắp đặt với thiết bị trong ảnh. Model chính xác không xác định được.',
};

const VESSEL_BASIN_OVAL = {
  brand: 'JOMOO',
  sku: 'P12663-1/01Z-1',
  note:
    'Chậu đặt bàn dáng bầu dục mềm, thành mỏng, không lỗ vòi, men trắng — khớp kiểu lắp đặt, ' +
    'dáng và tỷ lệ thấp rộng của chậu trong ảnh. Model chính xác không xác định được.',
};

/** Shared across all five: the shower never maps, and always for one reason. */
const SHOWER_NO_MATCH =
  'Bát sen tròn, van âm tường, chỉ thấy bát sen và tay sen — không có cần đứng lộ thiên. ' +
  'Danh mục có 5 cây sen lộ thiên bát tròn (khác kiểu lắp: có cần đứng và củ sen lộ ra) và 2 bộ ' +
  'âm tường (JOMOO P37272-445, 37311-636) nhưng cả hai đều dùng bát sen VUÔNG. Không bộ nào khớp.';

const WALL_FAUCET_NO_MATCH =
  'Vòi gắn tường. Toàn bộ vòi lavabo trong danh mục đều là loại đặt bàn — không có vòi gắn tường nào.';

/* -------------------------------------------------------------------- C06 */

const C06_ID = 'c06-serene-stone';

const c06: StorefrontConcept = {
  id: C06_ID,
  slug: 'serene-stone-spa',
  title: 'Serene Stone Spa',
  titleVi: 'Phòng tắm đá xám tĩnh lặng',
  shortDescription:
    'Sắc đá xám, ánh sáng tự nhiên và các thiết bị có đường nét gọn tạo nên một phòng tắm ' +
    'hiện đại, yên tĩnh và dễ sống mỗi ngày.',
  conceptStory:
    'Serene Stone Spa lấy sự cân bằng làm trọng tâm thay vì tạo ra một không gian quá nhiều điểm ' +
    'nhấn. Các bề mặt đá xám sáng được sử dụng liên tục để giữ tổng thể ổn định, trong khi ánh ' +
    'sáng tự nhiên từ cửa sổ lớn giúp vật liệu không trở nên lạnh hoặc nặng nề.\n\n' +
    'Khu lavabo, bồn cầu và khu tắm được tổ chức thành ba vùng rõ ràng nhưng vẫn liên kết bằng ' +
    'cùng một ngôn ngữ vật liệu. Gương tròn có ánh sáng viền tạo một điểm mềm giữa các mặt phẳng ' +
    'kiến trúc vuông vức, còn kính trong giúp khu tắm giữ được cảm giác mở. Concept hướng tới một ' +
    'phòng tắm hiện đại nhưng không phô trương — nơi sự thư giãn đến từ tỷ lệ, ánh sáng và trật tự thị giác.',
  designPrinciples: [
    'Một bảng vật liệu nhất quán giúp không gian giữ được sự tĩnh và liền mạch.',
    'Gương tròn tạo độ mềm giữa các hình khối kiến trúc thẳng và mạnh.',
    'Ánh sáng tự nhiên cân bằng sắc xám để căn phòng không trở nên lạnh.',
  ],
  canonicalImage: '/concepts/serene-modern-stone-spa-bathroom.webp',
  imageAlt:
    'Phòng tắm tông đá xám lạnh: gương tròn hắt sáng và chậu đặt bàn trên tủ đá bên trái, ' +
    'bồn cầu treo tường ở giữa, buồng tắm kính với thiết bị tông tối bên phải.',
  imageHash: 'fe00ff00ff00e140f50075e1',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'serene_modern_stone_spa_bathroom.png',
  style: 'MODERN_SPA',
  useCase: 'CALM_DAILY_RETREAT',
  areaBand: 'MEDIUM',
  budgetBand: 'MID_TO_PREMIUM',
  tone: 'COOL_NEUTRAL',
  publicationStatus: 'PUBLISHED_VERIFIED',
  tenantId: null,
  hotspots: [
    h(C06_ID, 1, {
      targetType: 'TOILET',
      ...p2(245, 222),
      bbox: b2(222, 203, 270, 245),
      catalogProductId: demoId(PHASE1_TENANT, WALL_HUNG_WC.brand, WALL_HUNG_WC.sku),
      ...WALL_HUNG_WC,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C06_ID, 2, {
      targetType: 'BASIN',
      ...p2(115, 163),
      bbox: b2(75, 150, 152, 176),
      catalogProductId: demoId(PHASE1_TENANT, VESSEL_BASIN_OVAL.brand, VESSEL_BASIN_OVAL.sku),
      ...VESSEL_BASIN_OVAL,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C06_ID, 3, {
      targetType: 'FAUCET',
      ...p2(118, 145),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        'Vòi đặt bàn THÂN CAO cho chậu đặt bàn, mạ chrome. INAX LFV-502SH đúng lớp sản phẩm ' +
        '(thân 268mm, vòi 238mm) nhưng ảnh của nó là bản vẽ nên audit gán NEEDS_REPLACEMENT và ' +
        'sản phẩm bị loại khỏi danh mục. LFV-6002S còn lại chỉ cao 151mm — vòi sẽ thấp hơn vành chậu.',
    }),
    h(C06_ID, 4, {
      targetType: 'SHOWER',
      ...p2(358, 140),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: SHOWER_NO_MATCH,
    }),
    h(C06_ID, 5, {
      targetType: 'MIRROR',
      ...p2(115, 85),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Danh mục tenant không có nhóm gương.',
    }),
  ],
};

/* -------------------------------------------------------------------- C07 */

const C07_ID = 'c07-monochrome';

const c07: StorefrontConcept = {
  id: C07_ID,
  slug: 'monochrome-architectural-bath',
  title: 'Monochrome Architectural Bath',
  titleVi: 'Phòng tắm đen – trắng kiến trúc',
  shortDescription:
    'Tương phản đen – trắng, mặt đá sáng và thiết bị tối màu tạo nên một không gian sắc nét, ' +
    'hiện đại và mang tính kiến trúc rõ ràng.',
  conceptStory:
    'Monochrome Architectural Bath sử dụng tương phản như một công cụ tổ chức không gian chứ không ' +
    'chỉ là lựa chọn màu sắc. Các bề mặt đá trắng tạo nền sáng và rộng, trong khi tủ lavabo, vòi, ' +
    'sen và những mảng tường tối được đặt có chủ đích để tạo nhịp và chiều sâu.\n\n' +
    'Khu lavabo đôi trở thành trục thị giác chính của căn phòng, được cân bằng bởi bồn cầu và khu ' +
    'tắm đặt về hai phía. Kính trong giữ sự kết nối giữa các vùng chức năng, giúp các chi tiết đen ' +
    'không chia nhỏ căn phòng. Concept phù hợp với người dùng muốn một phòng tắm có cá tính rõ ' +
    'nhưng vẫn giữ được sự kiểm soát, sạch sẽ và bền về thị giác.',
  designPrinciples: [
    'Tương phản được dùng để tổ chức không gian thay vì phủ đen toàn bộ căn phòng.',
    'Mặt đá sáng giữ cảm giác rộng và giúp thiết bị tối màu nổi bật có kiểm soát.',
    'Một trục lavabo mạnh tạo điểm nhìn chính cho toàn bộ bố cục.',
  ],
  canonicalImage: '/concepts/monochrome-marble-spa-bathroom.webp',
  imageAlt:
    'Phòng tắm đen trắng: tủ lavabo đen với hai chậu đặt bàn và vòi gắn tường màu đen, ' +
    'bồn cầu treo tường ở giữa, khu tắm kính với thiết bị đen bên phải.',
  imageHash: 'ffe8ff9cff8cc98cc99cc99c',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'monochrome_marble_spa_bathroom.png',
  style: 'MONOCHROME_CONTEMPORARY',
  useCase: 'DESIGN_STATEMENT',
  areaBand: 'MEDIUM_TO_LARGE',
  budgetBand: 'MID_TO_PREMIUM',
  tone: 'BLACK_WHITE',
  publicationStatus: 'PUBLISHED_VERIFIED',
  tenantId: null,
  hotspots: [
    h(C07_ID, 1, {
      targetType: 'TOILET',
      ...p2(252, 216),
      bbox: b2(232, 197, 275, 239),
      catalogProductId: demoId(PHASE1_TENANT, WALL_HUNG_WC.brand, WALL_HUNG_WC.sku),
      ...WALL_HUNG_WC,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C07_ID, 2, {
      targetType: 'BASIN',
      ...p2(73, 172),
      bbox: b2(57, 164, 95, 183),
      catalogProductId: demoId(PHASE1_TENANT, VESSEL_BASIN_OVAL.brand, VESSEL_BASIN_OVAL.sku),
      ...VESSEL_BASIN_OVAL,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C07_ID, 3, {
      targetType: 'BASIN',
      ...p2(157, 172),
      bbox: b2(140, 164, 178, 183),
      catalogProductId: demoId(PHASE1_TENANT, VESSEL_BASIN_OVAL.brand, VESSEL_BASIN_OVAL.sku),
      ...VESSEL_BASIN_OVAL,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note: `${VESSEL_BASIN_OVAL.note} Chậu thứ hai của mặt bàn đôi, cùng model.`,
    }),
    h(C07_ID, 4, {
      targetType: 'FAUCET',
      ...p2(90, 155),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: `${WALL_FAUCET_NO_MATCH} Thiết bị trong ảnh còn là màu ĐEN; danh mục không có vòi lavabo đen nào.`,
    }),
    h(C07_ID, 5, {
      targetType: 'SHOWER',
      ...p2(353, 150),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        `${SHOWER_NO_MATCH} Riêng cảnh này thiết bị còn là màu đen: JOMOO 37311-636 ghi "mạ đen" ` +
        'trong dữ liệu nhưng ảnh sản phẩm lại là chrome, nên bề mặt cũng không xác nhận được.',
    }),
    h(C07_ID, 6, {
      targetType: 'MIRROR',
      ...p2(125, 95),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Danh mục tenant không có nhóm gương.',
    }),
  ],
};

/* -------------------------------------------------------------------- C08 */

const C08_ID = 'c08-japandi';

const c08: StorefrontConcept = {
  id: C08_ID,
  slug: 'soft-japandi-retreat',
  title: 'Soft Japandi Retreat',
  titleVi: 'Phòng tắm Japandi nhẹ nhàng',
  shortDescription:
    'Gỗ sáng, vật liệu trung tính và ánh sáng mềm tạo nên một phòng tắm Japandi gần gũi, ' +
    'nhẹ nhàng và cân bằng trong sinh hoạt hàng ngày.',
  conceptStory:
    'Soft Japandi Retreat kết hợp sự giản dị của không gian Nhật Bản với độ ấm và tính dễ sống của ' +
    'phong cách Scandinavian. Gỗ sáng được dùng như một lớp vật liệu chính để cân bằng các bề mặt ' +
    'sứ và đá, trong khi bảng màu kem – trắng ấm giúp căn phòng giữ cảm giác nhẹ và tự nhiên.\n\n' +
    'Các thiết bị được sắp xếp thấp và gọn, tránh cảm giác phô diễn. Khu lavabo đóng vai trò trung ' +
    'tâm, còn khu tắm và bồn cầu được bố trí về hai phía để giữ sự rõ ràng trong lưu thông. Ánh sáng ' +
    'mềm và một lượng rất nhỏ cây xanh bổ sung cảm giác thư giãn mà không biến không gian thành một ' +
    'cảnh trang trí. Concept hướng tới sự ấm áp, tĩnh và dễ gắn bó lâu dài.',
  designPrinciples: [
    'Gỗ sáng làm mềm bề mặt sứ và đá, tạo cảm giác gần gũi hơn.',
    'Thiết bị được giữ thấp và đơn giản để giảm nhiễu thị giác.',
    'Ánh sáng mềm quan trọng hơn các chi tiết trang trí cầu kỳ.',
  ],
  canonicalImage: '/concepts/serene-japandi-spa-bathroom.webp',
  imageAlt:
    'Phòng tắm Japandi tông kem: tủ lavabo gỗ sáng với chậu tròn đặt bàn và gương bo tròn hắt sáng, ' +
    'khu tắm kính ở giữa, bồn cầu treo tường bên phải.',
  imageHash: '8601c600c980f880f885c8a4',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'serene_japandi_spa_bathroom.png',
  style: 'JAPANDI',
  useCase: 'RELAXED_HOME',
  areaBand: 'MEDIUM',
  budgetBand: 'MID',
  tone: 'LIGHT_WOOD_WARM_NEUTRAL',
  publicationStatus: 'PUBLISHED_VERIFIED',
  tenantId: null,
  hotspots: [
    h(C08_ID, 1, {
      targetType: 'TOILET',
      ...p2(378, 228),
      bbox: b2(340, 205, 420, 258),
      catalogProductId: demoId(PHASE1_TENANT, WALL_HUNG_WC.brand, WALL_HUNG_WC.sku),
      ...WALL_HUNG_WC,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C08_ID, 2, {
      targetType: 'BASIN',
      ...p2(162, 158),
      bbox: b2(143, 149, 185, 168),
      catalogProductId: demoId(PHASE1_TENANT, 'JOMOO', '12661-1/01K'),
      brand: 'JOMOO',
      sku: '12661-1/01K',
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
      note:
        'Chậu đặt bàn dáng tròn, thành trụ thẳng, vành mỏng — khớp kiểu lắp đặt và dáng. ' +
        'Khác biệt cần ghi: chậu trong ảnh là đá mờ tông kem, sản phẩm là sứ men trắng bóng. ' +
        'Cùng tông sáng nhưng khác chất liệu bề mặt.',
    }),
    h(C08_ID, 3, {
      targetType: 'FAUCET',
      ...p2(176, 142),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: `${WALL_FAUCET_NO_MATCH} Thiết bị trong ảnh hoàn thiện đồng xước.`,
    }),
    h(C08_ID, 4, {
      targetType: 'SHOWER',
      ...p2(276, 40),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: SHOWER_NO_MATCH,
    }),
    h(C08_ID, 5, {
      targetType: 'MIRROR',
      ...p2(170, 80),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Danh mục tenant không có nhóm gương.',
    }),
  ],
};

/* -------------------------------------------------------------------- C09 */

const C09_ID = 'c09-dark-hotel';

const c09: StorefrontConcept = {
  id: C09_ID,
  slug: 'dark-hotel-suite',
  title: 'Dark Hotel Suite',
  titleVi: 'Phòng tắm khách sạn tông tối',
  shortDescription:
    'Đá tối, ánh sáng gián tiếp và những đường nét kim loại tinh gọn tạo nên một phòng tắm ' +
    'khách sạn sang trọng, trầm và có chiều sâu.',
  conceptStory:
    'Dark Hotel Suite khai thác bảng màu sâu để tạo cảm giác riêng tư và cao cấp, nhưng tránh biến ' +
    'phòng tắm thành một không gian tối nặng nề. Đá charcoal và nâu được sử dụng trên các mặt phẳng ' +
    'lớn, trong khi ánh sáng gián tiếp chạy dọc tủ lavabo, gương và các hốc tường giúp vật liệu hiện ' +
    'lên theo từng lớp.\n\n' +
    'Thiết bị sứ sáng đóng vai trò cân bằng, tạo điểm nghỉ giữa những mảng tối. Khu tắm được tách ' +
    'bằng kính trong để giữ chiều sâu thị giác, còn mặt bàn dài tạo trục ngang giúp căn phòng có cảm ' +
    'giác rộng và ổn định hơn. Concept hướng tới tinh thần khách sạn hiện đại — sang trọng nhờ vật ' +
    'liệu, tỷ lệ và ánh sáng thay vì các chi tiết trang trí phô trương.',
  designPrinciples: [
    'Thiết bị sáng tạo điểm cân bằng trong bảng vật liệu tối.',
    'Ánh sáng gián tiếp làm rõ lớp vật liệu mà không phá vỡ cảm giác trầm.',
    'Các đường ngang dài giúp không gian tối vẫn giữ được cảm giác rộng.',
  ],
  canonicalImage: '/concepts/luxurious-modern-stone-spa-bathroom.webp',
  imageAlt:
    'Phòng tắm tông đá charcoal: mặt bàn đá tối với hai chậu khoét liền và vòi gắn tường ' +
    'hoàn thiện đồng, khu tắm kính tối ở giữa, bồn cầu treo tường bên phải.',
  imageHash: '7f847f040f04030c438c438c',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'luxurious_modern_stone_spa_bathroom.png',
  style: 'DARK_HOTEL_LUXURY',
  useCase: 'HOTEL_PREMIUM',
  areaBand: 'MEDIUM_TO_LARGE',
  budgetBand: 'PREMIUM',
  tone: 'CHARCOAL_BROWN',
  publicationStatus: 'QA_PENDING',
  qaNote:
    'Map được 1/6 thiết bị (ngưỡng 3) — thấp nhất trong mười concept. Chậu là loại khoét liền ' +
    'khối đá, vòi gắn tường hoàn thiện đồng, sen âm tường bát tròn: cả ba đều không có nhóm ' +
    'tương ứng trong danh mục.',
  tenantId: null,
  hotspots: [
    h(C09_ID, 1, {
      targetType: 'TOILET',
      ...p2(372, 220),
      bbox: b2(352, 198, 420, 252),
      catalogProductId: demoId(PHASE1_TENANT, WALL_HUNG_WC.brand, WALL_HUNG_WC.sku),
      ...WALL_HUNG_WC,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C09_ID, 2, {
      targetType: 'BASIN',
      ...p2(80, 172),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        'Chậu khoét liền khối vào mặt đá — cùng vật liệu, cùng tông, không có vành. Danh mục chỉ ' +
        'có chậu rời bằng sứ (đặt bàn / âm bàn / bán âm), không có chậu đá liền khối.',
    }),
    h(C09_ID, 3, {
      targetType: 'FAUCET',
      ...p2(68, 155),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: `${WALL_FAUCET_NO_MATCH} Thiết bị trong ảnh hoàn thiện đồng/vàng đồng — danh mục không có bề mặt này.`,
    }),
    h(C09_ID, 4, {
      targetType: 'SHOWER',
      ...p2(285, 100),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: SHOWER_NO_MATCH,
    }),
    h(C09_ID, 5, {
      targetType: 'MIRROR',
      ...p2(92, 80),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Danh mục tenant không có nhóm gương.',
    }),
  ],
};

/* -------------------------------------------------------------------- C10 */

const C10_ID = 'c10-coastal';

const c10: StorefrontConcept = {
  id: C10_ID,
  slug: 'coastal-blue-retreat',
  title: 'Coastal Blue Retreat',
  titleVi: 'Phòng tắm xanh xám hướng biển',
  shortDescription:
    'Xanh xám dịu, đá sáng và nguồn sáng lớn tạo nên một không gian thư giãn, thoáng và mát ' +
    'hơn so với các concept tông ấm truyền thống.',
  conceptStory:
    'Coastal Blue Retreat được phát triển như một lựa chọn đối lập với các bảng màu beige thường ' +
    'thấy trong phòng tắm cao cấp. Sắc xanh xám được sử dụng có kiểm soát tại tủ lavabo và các mặt ' +
    'phẳng phụ, kết hợp cùng đá sáng và kính trong để tạo cảm giác mát, nhẹ và thoáng.\n\n' +
    'Nguồn sáng lớn cùng khoảng nhìn mở trở thành một phần quan trọng của trải nghiệm, giúp không ' +
    'gian có cảm giác kết nối với môi trường bên ngoài. Thiết bị sứ trắng và các chi tiết kim loại ' +
    'trung tính giữ tổng thể tinh gọn, tránh biến sắc xanh thành một chủ đề trang trí quá rõ ràng. ' +
    'Concept phù hợp với người dùng yêu thích không gian sáng, hiện đại và có cảm giác nghỉ dưỡng ' +
    'nhưng không muốn đi theo hướng vàng – nâu truyền thống.',
  designPrinciples: [
    'Xanh xám tạo bản sắc riêng mà vẫn đủ trung tính để phối thiết bị.',
    'Ánh sáng và khoảng nhìn mở là thành phần chính của trải nghiệm không gian.',
    'Đá sáng và sứ trắng giữ bảng màu mát trở nên nhẹ và dễ sử dụng.',
  ],
  canonicalImage: '/concepts/coastal-minimalist-spa-bathroom.webp',
  imageAlt:
    'Phòng tắm tông xanh xám mát: tủ lavabo xanh xám với chậu oval đặt bàn và gương tròn hắt sáng, ' +
    'bồn cầu đặt sàn ở giữa, khu tắm kính nhìn ra biển bên phải.',
  imageHash: 'e07fb8330d030d032d232d23',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'coastal_minimalist_spa_bathroom.png',
  style: 'COASTAL_MINIMAL',
  useCase: 'BRIGHT_PREMIUM_HOME',
  areaBand: 'MEDIUM_TO_LARGE',
  budgetBand: 'MID_TO_PREMIUM',
  tone: 'COOL_BLUE_GRAY',
  publicationStatus: 'QA_PENDING',
  qaNote:
    'Map được 1/5 thiết bị (ngưỡng 3). Bồn cầu ở đây ĐẶT SÀN két âm — khác với bốn cảnh Phase 2 ' +
    'còn lại — nên bồn treo tường duy nhất của danh mục không dùng được. Thiếu thêm vòi thân cao ' +
    '(LFV-502SH, đang bị giữ lại) và sen âm tường bát tròn.',
  tenantId: null,
  hotspots: [
    h(C10_ID, 1, {
      targetType: 'BASIN',
      ...p2(85, 162),
      bbox: b2(52, 151, 120, 173),
      catalogProductId: demoId(PHASE1_TENANT, VESSEL_BASIN_OVAL.brand, VESSEL_BASIN_OVAL.sku),
      ...VESSEL_BASIN_OVAL,
      matchConfidence: 'CLOSE_VISUAL_MATCH',
      qaStatus: 'VERIFIED',
    }),
    h(C10_ID, 2, {
      targetType: 'TOILET',
      ...p2(222, 212),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        'Bồn cầu ĐẶT SÀN sát tường, két âm (nút xả trên tường), thân chạm sàn. Bồn cầu không két ' +
        'duy nhất trong danh mục là JOMOO 11413-2-211K loại treo tường — khác kiểu lắp đặt.',
    }),
    h(C10_ID, 3, {
      targetType: 'FAUCET',
      ...p2(73, 141),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note:
        'Vòi đặt bàn thân cao cho chậu đặt bàn, mạ chrome. Cùng nguyên nhân với C06: INAX ' +
        'LFV-502SH đúng loại nhưng bị audit ảnh giữ lại khỏi danh mục.',
    }),
    h(C10_ID, 4, {
      targetType: 'SHOWER',
      ...p2(280, 135),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: SHOWER_NO_MATCH,
    }),
    h(C10_ID, 5, {
      targetType: 'MIRROR',
      ...p2(55, 70),
      matchConfidence: 'GENERIC_FIXTURE',
      qaStatus: 'VERIFIED',
      note: 'Danh mục tenant không có nhóm gương.',
    }),
  ],
};

/* ============================================================ TENANT-OWNED */

/**
 * Golden Retreat — Bếp Tùng Đăng's own concept, and the only one here that
 * belongs to a single storefront (`tenantId`). It is invisible to every other
 * tenant and its slug carries the tenant so a later showroom's concepts can
 * never collide with it.
 *
 * It is also built the other way round from the library above. Those rooms
 * existed first and products were matched to them afterwards, which is why
 * their best claim is "gợi ý tương đồng". This scene was art-directed for four
 * products the showroom chose — one per zone — and supplied by the LivLab
 * team on 2026-10-18. The objects drawn are still illustrations, not those
 * SKUs, so each hotspot is `CURATED_SUGGESTION`: "sản phẩm gợi ý trong
 * concept", the showroom's suggestion for that position. Nothing on the page
 * may call it a render of the product.
 *
 * All four were checked on beptungdang.vn on 2026-10-18 (prices included);
 * the catalogue rows are the fixture's, so prices shown are the fixture's.
 * Coordinates were read on the 1448×1086 asset against a 5% grid, and the
 * shower point sits on the hand shower, not on the lit niche beside it.
 */
const TD01_ID = 'td01-golden-retreat';

const td01: StorefrontConcept = {
  id: TD01_ID,
  slug: 'tungdang-golden-retreat',
  title: 'Golden Retreat',
  titleVi: 'Phòng tắm master thư giãn',
  shortDescription:
    'Không gian phòng tắm master hiện đại với đá vân ấm, gỗ tự nhiên và ánh sáng dịu. Bốn vùng ' +
    'chức năng được tổ chức rõ ràng với lavabo đặt bàn, bồn cầu liền khối, bồn tắm thư giãn và ' +
    'khu sen tắm riêng biệt.',
  conceptStory:
    'Golden Retreat được xây dựng cho một phòng tắm master rộng rãi, nơi trải nghiệm thư giãn được ' +
    'đặt ngang hàng với tính thực dụng.\n\n' +
    'Không gian sử dụng bảng vật liệu ấm gồm đá vân tự nhiên, gỗ và ánh sáng gián tiếp để tạo cảm ' +
    'giác yên tĩnh nhưng vẫn hiện đại. Bố cục được chia thành bốn vùng chức năng rõ ràng: khu ' +
    'lavabo, khu vệ sinh, bồn tắm thư giãn và khu sen tắm kính riêng biệt.\n\n' +
    'Thay vì chỉ xem từng thiết bị riêng lẻ trong catalogue, người dùng có thể khám phá các sản phẩm ' +
    'gợi ý ngay trong bối cảnh của một phòng tắm hoàn chỉnh, sau đó xem thông tin sản phẩm, mức giá ' +
    'tham khảo và tiếp tục thêm sản phẩm vào báo giá hoặc Room Studio.',
  designPrinciples: [
    'Bốn vùng chức năng tách bạch: lavabo, vệ sinh, bồn tắm và sen tắm kính.',
    'Bảng vật liệu ấm — đá vân, gỗ tự nhiên, ánh sáng gián tiếp — giữ không gian yên tĩnh.',
    'Bồn tắm đặt giữa phòng, hướng ra khoảng sáng tự nhiên, là điểm nhìn chính.',
  ],
  canonicalImage: '/demo/tungdang/concepts/golden-retreat.webp',
  imageAlt:
    'Phòng tắm master tông đá ấm lúc hoàng hôn: lavabo đặt bàn dưới gương tròn bên trái, bồn cầu ' +
    'liền khối, bồn tắm đặt giữa phòng trước cửa kính và khu sen tắm kính bên phải.',
  // 96-bit difference hash (13×8 greyscale, left < right), per the field's doc.
  imageHash: 'a53bf6df1973967712c50db0',
  imageSourceType: 'LIVLAB_GENERATED',
  imageSourceId: 'golden-retreat.webp (LivLab, 2026-10-18)',
  style: 'WARM_LUXURY',
  useCase: 'MASTER_BATHROOM',
  areaBand: 'LARGE',
  budgetBand: 'PREMIUM',
  tone: 'WARM_STONE',
  publicationStatus: 'PUBLISHED_VERIFIED',
  qaNote: 'Bốn điểm kiểm tra trên trang chi tiết ở 1440×900 và 390px, ngày 2026-10-18.',
  tenantId: PHASE1_TENANT,
  presentation: {
    leadWithName: true,
    roomType: 'Master bathroom',
    styleLabel: 'Hiện đại cao cấp',
    areaLabel: '10–14 m²',
    budgetLabel: 'Cao cấp',
  },
  hotspots: [
    h(TD01_ID, 1, {
      targetType: 'BASIN',
      ...pct(195, 570),
      bbox: box(65, 543, 311, 602),
      catalogProductId: demoId(PHASE1_TENANT, 'JOMOO', '12703-1/01P'),
      brand: 'JOMOO',
      sku: '12703-1/01P',
      matchConfidence: 'CURATED_SUGGESTION',
      qaStatus: 'VERIFIED',
      // Up, not down: opening downward lands on the toilet beside it.
      popover: { x: 'right', y: 'up' },
      note: 'Chậu đặt bàn trắng dưới gương tròn. 445×445×200 mm theo trang sản phẩm.',
    }),
    h(TD01_ID, 2, {
      targetType: 'TOILET',
      ...pct(478, 657),
      bbox: box(384, 521, 572, 744),
      catalogProductId: demoId(PHASE1_TENANT, 'JOMOO', '11252-2/31KA-I011'),
      brand: 'JOMOO',
      sku: '11252-2/31KA-I011',
      matchConfidence: 'CURATED_SUGGESTION',
      qaStatus: 'VERIFIED',
      popover: { x: 'right', y: 'up' },
      note:
        'Bồn cầu liền khối giữa tủ lavabo và bồn tắm. Trang sản phẩm không ghi kích thước; ' +
        'bản vẽ thông số có, nhưng chú thích bằng tiếng Trung nên không chép số ra.',
    }),
    h(TD01_ID, 3, {
      targetType: 'BATHTUB',
      // On the tub's front, low and left enough that the toilet's and the
      // shower's previews both clear it.
      ...pct(782, 662),
      bbox: box(634, 548, 1000, 690),
      catalogProductId: demoId(PHASE1_TENANT, 'TOTO', 'PPY1560HPE#P/TVBF411'),
      brand: 'TOTO',
      sku: 'PPY1560HPE#P/TVBF411',
      matchConfidence: 'CURATED_SUGGESTION',
      qaStatus: 'VERIFIED',
      popover: { x: 'left', y: 'up' },
      note:
        'Bồn tắm giữa phòng. Bồn trong ảnh là bồn đặt sàn dáng bầu dục; sản phẩm gợi ý ghi ' +
        '1500×750×600 mm trên trang sản phẩm và có dáng khác — đây là gợi ý của showroom cho vị ' +
        'trí này, không phải bồn trong ảnh.',
    }),
    h(TD01_ID, 4, {
      targetType: 'SHOWER',
      ...pct(1339, 282),
      bbox: box(1225, 120, 1420, 650),
      catalogProductId: demoId(PHASE1_TENANT, 'JOMOO', '36437-477/1B-I011'),
      brand: 'JOMOO',
      sku: '36437-477/1B-I011',
      matchConfidence: 'CURATED_SUGGESTION',
      qaStatus: 'VERIFIED',
      popover: { x: 'left', y: 'down' },
      note: 'Sen cây trong khu kính: điểm đặt trên tay sen, không đặt trên hốc tường bên cạnh.',
    }),
  ],
};

/**
 * Reading order, set by how the rooms look rather than by when they were made.
 *
 * A library sorted by batch puts every warm stone room together and every
 * cool one after it, and a grid of near-identical thumbnails reads as one
 * concept photographed five times however different the rooms actually are.
 * The sequence alternates instead — light, cool, warm, dark — so two adjacent
 * cards never share a palette.
 *
 * Unpublished entries keep their slot. The grid renders the published subset
 * in this order, so a concept that clears its QA gap later appears where the
 * rhythm already expects it, and nothing has to be resorted by hand.
 */
export const CONCEPT_LIBRARY: StorefrontConcept[] = [
  // A tenant's own concept leads its storefront; every other tenant skips it.
  td01,
  c01, c07, c03, c10, c08, c04, c06, c09, c02, c05,
];
