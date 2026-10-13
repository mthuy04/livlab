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
export const CONCEPT_LIBRARY: StorefrontConcept[] = [c01, c03, c04, c02, c05];
