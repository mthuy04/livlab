/**
 * The nine GLB models the LivLab project owner approved on 2026-11-20.
 *
 * Source: the "LivLab 9 GLB approved" pack — `catalogue_manifest.json`, the
 * three batch READMEs and the QA reports, copied unchanged to
 * assets/3d/work/reports/livlab-approved-glb-2026-11-20/. The files under
 * public/models/ are byte-for-byte the approved ones (sha256 below, re-checked
 * by `npm run test:inax-3d`); nothing here remeshes, rescales or re-axes them.
 *
 * What these are, in the pack's own words: independent reconstructions from
 * manufacturer dimensions and reference photography — not manufacturer CAD,
 * not manufacturer-approved. The outer size matches the manufacturer's figure;
 * inner details are estimates where the pack says so, and its confidence flag
 * and caveats travel with each model to every surface that shows it.
 *
 * Prices: the pack has none, by design. None is written here.
 *
 * Mounting heights are LivLab defaults inside a range the customer can change
 * — how high a mirror hangs is an installation choice, not a product fact.
 */
import type { ReconstructedModel } from './reconstructionRegistry';

const PACK = 'assets/3d/work/reports/livlab-approved-glb-2026-11-20';
const RECEIVED = '2026-11-20';

/** Recorded from the in-browser check of these exact files (see the pack folder). */
const RUNTIME_QA = {
  checkedAt: '2026-11-20T16:40:00.000Z',
  checkedWith: '/dev/room-studio-3d-qa · Chrome headless (SwiftShader) · đo hộp bao sau khi tải trong renderer Room Studio',
};

const ALL_CHECKS = {
  loads: true,
  boundsMatchFile: true,
  dimensionsMatchReference: true,
  originAndOrientation: true,
  mounting: true,
  materialsPbr: true,
  performance: true,
} as const;

const PROVENANCE = (from: string, report: string): ReconstructedModel['provenance'] => ({
  kind: 'LIVLAB_RECONSTRUCTION',
  reconstructedFrom: from,
  manufacturerCadUsed: false,
  packageStatus: 'CONDITIONAL',
  receivedAt: RECEIVED,
  auditReport: `${PACK}/${report}`,
});

const MIRROR_HEIGHT = {
  heightRef: 'CENTRE' as const,
  heightMm: {
    default: 1500,
    min: 1200,
    max: 1800,
    source: 'Mặc định của LivLab cho tâm gương; chỉnh theo lavabo và chiều cao người dùng.',
  },
  heightLabel: 'Cao độ tâm gương',
};

const NORMALS_NOTE =
  'File không kèm pháp tuyến đỉnh; Room Studio tính pháp tuyến có góc gấp 30° khi tải — không đỉnh nào dịch chuyển.';
const REFLECTION_NOTE = 'Mặt gương phản chiếu theo môi trường ánh sáng của cảnh; độ phản chiếu thật phụ thuộc trình hiển thị.';

const INAX_MR_CATALOGUE = {
  label: 'Catalogue phụ kiện INAX 2026 (PDF của hãng)',
  url: 'https://www.inax.com.vn/wp-content/uploads/2026/04/Cataogue_A5_Ver_042026.pdf',
  official: true,
};

export const APPROVED_GLB_MODELS: ReconstructedModel[] = [
  /* ------------------------------------------------------------ mirrors */
  {
    id: 'inax-kf-6075var-recon',
    brand: 'INAX',
    sku: 'KF-6075VAR',
    normalizedSkus: ['KF6075VAR'],
    name: 'Gương phòng tắm vòm không khung INAX KF-6075VAR',
    category: 'mirror',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Gương phòng tắm',
    referenceDimensionsMm: { width: 610, height: 760, depth: 5 },
    envelopeLabel: '610 x 5 x 760 mm',
    manufacturerPage: 'https://www.inax.com.vn/vi/products/accessories/guong-treo-tuong-nha-tam-kf-6075var/',
    mirrorFace: { materialName: 'MIRROR_FACE__SILVERED_GLASS__ENVIRONMENT_REQUIRED' },
    mounting: { kind: 'WALL', ...MIRROR_HEIGHT },
    files: {
      web: {
        url: '/models/inax/KF-6075VAR/INAX_KF-6075VAR.glb',
        bytes: 28548,
        sha256: '38e14e68ba0a3a0766e0f857e5659a255b0753be38062bb726f0d783800a4df5',
        triangles: 1368,
        meshes: 5,
        boundsM: { min: [-0.305, 0, 0], max: [0.305, 0.76, 0.005] },
        label: 'Gương',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/KF-6075VAR/INAX_KF-6075VAR.png',
    listing: {
      summary:
        'Gương treo tường không khung, đỉnh vòm thấp, kính tráng bạc với lớp bảo vệ chống ẩm mốc phía sau. Kích thước ngoài 610 × 760 × 5 mm theo thông số INAX.',
      material: 'Kính tráng bạc',
      finish: 'Không khung, mặt sau chống ẩm mốc',
      color: null,
      dimensionsMm: { width: 610, height: 760, depth: 5 },
      documents: [
        {
          label: 'Bản vẽ kích thước (trang đại lý)',
          url: 'https://hailinh.com.vn/guong-nha-tam-inax/guong-inax-kf-6075var-116.html',
          official: false,
        },
      ],
      technicalConfidence: 'DIMENSIONS VERIFIED; VISUAL/CAD FIDELITY PARTIALLY INFERRED',
      caveats: [
        'Kích thước ngoài theo thông số hãng; vai vòm khoảng 639 mm lấy từ bản vẽ do bên thứ ba đăng lại.',
        'Vát cạnh kính (~0,5 mm) là ước lượng; kẹp treo chưa được dựng vì chưa có CAD hãng.',
      ],
      sourceNotes: ['glass edge bevel approximately 0.5 mm', 'mounting clips omitted pending true CAD'],
      previewIsRender: true,
    },
    technical: { plumbing: {}, drawingNotes: [] },
    provenance: PROVENANCE('Thông số kích thước của hãng và ảnh tham chiếu', 'LivLab_Mirror_GLb_v3_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 610, depth: 5, height: 760 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [NORMALS_NOTE, REFLECTION_NOTE],
    },
  },
  {
    id: 'inax-kf-6090va-recon',
    brand: 'INAX',
    sku: 'KF-6090VA',
    normalizedSkus: ['KF6090VA'],
    name: 'Gương phòng tắm chữ nhật không khung INAX KF-6090VA',
    category: 'mirror',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Gương phòng tắm',
    referenceDimensionsMm: { width: 610, height: 910, depth: 5 },
    envelopeLabel: '610 x 5 x 910 mm',
    manufacturerPage: 'https://www.inax.com.vn/vi/products/accessories/guong-treo-tuong-nha-tam-kf-6090va/',
    mirrorFace: { materialName: 'MIRROR_FACE__SILVERED_GLASS__ENVIRONMENT_REQUIRED' },
    mounting: { kind: 'WALL', ...MIRROR_HEIGHT },
    files: {
      web: {
        url: '/models/inax/KF-6090VA/INAX_KF-6090VA.glb',
        bytes: 9080,
        sha256: '21149a6023769460e7ddaae765a90ff5ef362b08cbb31c72a395bf0476b1176d',
        triangles: 288,
        meshes: 5,
        boundsM: { min: [-0.305, 0, 0], max: [0.305, 0.91, 0.005] },
        label: 'Gương',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/KF-6090VA/INAX_KF-6090VA.png',
    listing: {
      summary:
        'Gương treo tường không khung dáng chữ nhật đứng, góc bo rất nhỏ, kính tráng bạc với lớp bảo vệ chống ẩm mốc phía sau. Kích thước ngoài 610 × 910 × 5 mm theo thông số INAX.',
      material: 'Kính tráng bạc',
      finish: 'Không khung, mặt sau chống ẩm mốc',
      color: null,
      dimensionsMm: { width: 610, height: 910, depth: 5 },
      documents: [
        { label: 'Bản vẽ kích thước (trang đại lý)', url: 'https://www.tdm.vn/guong-lavabo-inax-kf-6090va.html', official: false },
      ],
      technicalConfidence: 'DIMENSIONS VERIFIED; VISUAL/CAD FIDELITY PARTIALLY INFERRED',
      caveats: [
        'Kích thước ngoài theo thông số hãng; khoảng cách móc treo 510 mm lấy từ sơ đồ lắp đặt của bên thứ ba.',
        'Bán kính góc kính (~1,3 mm) là ước lượng; kẹp treo chưa được dựng vì chưa có CAD hãng.',
      ],
      sourceNotes: ['glass corner radius approximately 1.3 mm', 'mounting clips omitted pending true CAD'],
      previewIsRender: true,
    },
    technical: { plumbing: {}, drawingNotes: ['Khoảng cách móc treo ngang 510 mm (sơ đồ của bên thứ ba, không mô hình hoá).'] },
    provenance: PROVENANCE('Thông số kích thước của hãng và ảnh tham chiếu', 'LivLab_Mirror_GLb_v3_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 610, depth: 5, height: 910 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [NORMALS_NOTE, REFLECTION_NOTE],
    },
  },
  {
    id: 'kohler-k-30638-cpl-recon',
    brand: 'Kohler',
    sku: 'K-30638-CPL',
    normalizedSkus: ['K30638CPL'],
    name: 'Gương vòm khung kim loại Kohler Essential K-30638-CPL, chrome bóng',
    category: 'mirror',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Gương phòng tắm',
    referenceDimensionsMm: { width: 508, height: 813, depth: 35 },
    envelopeLabel: '508 x 35 x 813 mm',
    manufacturerPage:
      'https://www.kohler.com/en/products/mirrors-and-medicine-cabinets/shop-mirrors-and-medicine-cabinets/essential-20-x-32-arched-framed-mirror-30638?skuId=30638-CPL',
    mirrorFace: { materialName: 'MIRROR_FACE__SILVERED_GLASS__ENVIRONMENT_REQUIRED' },
    mounting: { kind: 'WALL', ...MIRROR_HEIGHT },
    files: {
      web: {
        url: '/models/kohler/K-30638-CPL/KOHLER_K-30638-CPL.glb',
        bytes: 51652,
        sha256: '38d95534860b5565912265cd8f6b7cf1c62b46783cc0ceadeaa0921e4c1c0035',
        triangles: 2547,
        meshes: 9,
        boundsM: { min: [-0.254, 0, 0], max: [0.254, 0.813, 0.035] },
        label: 'Gương',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/kohler/K-30638-CPL/KOHLER_K-30638-CPL.png',
    listing: {
      summary:
        'Gương đỉnh vòm bán nguyệt, hai cạnh đứng, khung kim loại hoàn thiện chrome bóng (CPL). Kích thước ngoài 508 × 813 × 35 mm theo thông số Kohler.',
      material: 'Khung kim loại, kính tráng gương',
      finish: 'Chrome bóng (CPL)',
      color: null,
      dimensionsMm: { width: 508, height: 813, depth: 35 },
      documents: [
        {
          label: 'Thông số kỹ thuật K-30638 (PDF của Kohler)',
          url: 'https://techcomm.kohler.com/techcomm/pdf/K-30638_spec_US-CA_Kohler_en.pdf',
          official: true,
        },
      ],
      technicalConfidence: 'DIMENSIONS VERIFIED; VISUAL/CAD FIDELITY PARTIALLY INFERRED',
      caveats: [
        'Kích thước ngoài theo thông số Kohler; thanh treo phía sau dựng gần đúng theo bản vẽ (cách đỉnh khoảng 233 mm).',
        'Bản rộng viền khung trước (~7 mm) và độ lùi mặt kính (~4,2 mm) là ước lượng; chưa có CAD hãng.',
      ],
      sourceNotes: ['front bezel approximately 7 mm wide', 'glass face inset 4.2 mm from front'],
      previewIsRender: true,
    },
    technical: { plumbing: {}, drawingNotes: ['Thanh treo cách đỉnh vòm khoảng 233 mm (bản vẽ của hãng).'] },
    provenance: PROVENANCE('Thông số và bản vẽ của Kohler, ảnh tham chiếu', 'LivLab_Mirror_GLb_v3_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 508, depth: 35, height: 813 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [NORMALS_NOTE, REFLECTION_NOTE],
    },
  },
  {
    id: 'roca-a812401000-recon',
    brand: 'Roca',
    sku: 'A812401000',
    normalizedSkus: ['A812401000'],
    name: 'Gương tròn đèn LED viền Roca Luna Ambient 800 mm A812401000',
    category: 'mirror',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Gương đèn LED',
    referenceDimensionsMm: { width: 800, height: 800, depth: 25 },
    envelopeLabel: '800 x 25 x 800 mm',
    manufacturerPage: 'https://www.uk.roca.com/products/round-mirror-perimeter-lighting-colour-temperature-3000k-812401000',
    mirrorFace: { materialName: 'MIRROR__NEUTRAL_SILVERED_REFLECTOR__ENVIRONMENT_REQUIRED' },
    mounting: { kind: 'WALL', ...MIRROR_HEIGHT },
    files: {
      web: {
        url: '/models/roca/A812401000/Roca_A812401000.glb',
        bytes: 76952,
        sha256: 'e6a2b081e0fd2459f5a1fe2bb841ccc41c4519ec599b7fb70f0a42ea1b9abce9',
        triangles: 4224,
        meshes: 11,
        boundsM: { min: [-0.4, 0, 0], max: [0.4, 0.8, 0.025] },
        label: 'Gương đèn LED',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/roca/A812401000/Roca_A812401000_iso.png',
    emissive: { materialName: 'LED_ON__3000K_PERIMETER_DIFFUSER', colorTemperatureK: 3000, powerW: 13 },
    listing: {
      summary:
        'Gương tròn đường kính 800 mm, đèn LED viền 13 W ánh sáng 3000 K, cấp bảo vệ IP44 theo thông số Roca. Kích thước ngoài 800 × 800 × 25 mm.',
      material: 'Kính tráng bạc, đèn LED viền',
      finish: null,
      color: null,
      dimensionsMm: { width: 800, height: 800, depth: 25 },
      documents: [],
      technicalConfidence: 'PRODUCT_ACCURATE_ENVELOPE__INNER_DETAILS_ESTIMATED',
      caveats: [
        'Đèn LED 13 W, 3000 K, IP44 là thông số của hãng — mô hình 3D không chứng nhận an toàn điện.',
        'Mã này không có chức năng chống mờ, nên mô hình không dựng.',
        'Tỷ lệ bộ khuếch tán, bộ nguồn và giá treo là ước lượng; vòng sáng phía trước là diễn giải hình ảnh, không phải CAD hãng.',
        'Ánh sáng hắt lên tường trong Room Studio là đèn của cảnh, bật/tắt được — file chỉ mang vật liệu phát sáng.',
      ],
      sourceNotes: [
        '13 W perimeter LED, 3000 K, IP44 - manufacturer specs, not safety certified by mesh',
        'No demister specified for this SKU, none modeled',
        'Mirror surface uses silver-like PBR; live reflection depends on renderer',
        'LED diffuser/driver/mount proportions are estimates; front ~8.4mm emissive ring is a visual interpretation, not OEM CAD',
        'LED emissive is controlled by named material; light spill on wall requires Room Studio spot/area light',
      ],
      previewIsRender: true,
    },
    technical: { plumbing: {}, drawingNotes: ['Cần điểm điện gần vị trí lắp (đèn LED 13 W theo hãng).'] },
    provenance: PROVENANCE('Thông số của Roca và ảnh tham chiếu', 'LivLab_Batch3_GLb_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 800, depth: 25, height: 800 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [
        NORMALS_NOTE,
        REFLECTION_NOTE,
        'Ánh sáng hắt lên tường là đèn của Room Studio đặt trước gương, không phải dữ liệu quang học của hãng.',
      ],
    },
  },

  /* -------------------------------------------------------- accessories */
  {
    id: 'inax-kf-545vw-recon',
    brand: 'INAX',
    sku: 'KF-545VW',
    normalizedSkus: ['KF545VW'],
    name: 'Thanh treo khăn đôi INAX KF-545VW, dòng MR',
    category: 'accessory',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Thanh treo khăn',
    referenceDimensionsMm: { width: 620, height: 22, depth: 110 },
    envelopeLabel: '620 x 110 x 22 mm',
    manufacturerPage: 'https://www.inax.com.vn/products/accessories/kf-545vw/',
    mounting: {
      kind: 'WALL',
      heightRef: 'CENTRE',
      heightMm: { default: 1100, min: 800, max: 1600, source: 'Mặc định của LivLab; chỉnh theo vị trí sử dụng.' },
      heightLabel: 'Cao độ thanh treo',
    },
    files: {
      web: {
        url: '/models/inax/KF-545VW/INAX_KF-545VW.glb',
        bytes: 109852,
        sha256: 'a8025a8de384f772336145f9b2820b36a67ac64e4bb1fb1f73e8a0c2f88b08de',
        triangles: 8928,
        meshes: 12,
        boundsM: { min: [-0.31, 0, 0], max: [0.31, 0.022, 0.11] },
        label: 'Thanh treo khăn',
        nodeTransforms: 'TRANSLATE_AND_FIT',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/KF-545VW/INAX_KF-545VW.png',
    listing: {
      summary:
        'Thanh treo khăn đôi dòng MR, hoàn thiện crôm–niken bóng. Thông số INAX 2026: rộng 620 mm, cao 22 mm, nhô khỏi tường 110 mm.',
      material: null,
      finish: 'Crôm–niken bóng',
      color: null,
      dimensionsMm: { width: 620, height: 22, depth: 110 },
      documents: [INAX_MR_CATALOGUE],
      technicalConfidence: 'PARTIALLY_ESTIMATED',
      caveats: [
        'Thông số INAX 2026 ghi rộng 620 × cao 22 × sâu 110 mm (cao 22 mm hiểu theo phương đứng); một số đại lý ghi rộng 660 mm.',
        'Bán kính ống và khoảng cách hai thanh suy ra từ ảnh sản phẩm — cần đối chiếu CAD.',
      ],
      sourceNotes: [
        'OEM 2026 W620, H22 assumed vertical, D110 wall projection; other retailer listings W660. Tube radii and rail spacing inferred from product photo; verify CAD.',
      ],
      previewIsRender: true,
    },
    technical: { plumbing: {}, drawingNotes: [] },
    provenance: PROVENANCE('Catalogue INAX 2026 và ảnh sản phẩm', 'LivLab_Accessory_GLb_v2_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 620, depth: 110, height: 22 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [
        NORMALS_NOTE,
        'File đặt các chi tiết bằng phép dịch node và hệ số co giãn khớp kích thước dưới 2%, không xoay; hộp bao ghi theo toạ độ thế giới.',
      ],
    },
  },
  {
    id: 'inax-kf-546v-recon',
    brand: 'INAX',
    sku: 'KF-546V',
    normalizedSkus: ['KF546V'],
    name: 'Lô giấy vệ sinh có nắp INAX KF-546V, dòng MR',
    category: 'accessory',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Lô giấy vệ sinh',
    referenceDimensionsMm: { width: 147.9, height: 150.2, depth: 88.8 },
    envelopeLabel: '147,9 x 88,8 x 150,2 mm',
    manufacturerPage: 'https://www.inax.com.vn/products/accessories/kf-546v/',
    mounting: {
      kind: 'WALL',
      heightRef: 'CENTRE',
      heightMm: { default: 700, min: 550, max: 900, source: 'Mặc định của LivLab; chỉnh theo vị trí bồn cầu.' },
      heightLabel: 'Cao độ lô giấy',
    },
    files: {
      web: {
        url: '/models/inax/KF-546V/INAX_KF-546V.glb',
        bytes: 654160,
        sha256: '1c6c667d0eec437a82cb8d6512b8d031693b0cfd8aae69a76486c5f505c188a1',
        triangles: 36508,
        meshes: 7,
        boundsM: { min: [-0.07395, 0, 0], max: [0.07395, 0.1502, 0.0888] },
        label: 'Lô giấy vệ sinh',
        nodeTransforms: 'TRANSLATE_AND_FIT',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/KF-546V/INAX_KF-546V.png',
    listing: {
      summary:
        'Lô giấy vệ sinh dòng MR có nắp che dập cong, hoàn thiện crôm bóng. Kích thước theo catalogue INAX 2026: rộng 147,9 × cao 150,2 × sâu 88,8 mm — thông số tạm thời.',
      material: null,
      finish: 'Crôm bóng',
      color: null,
      dimensionsMm: { width: 147.9, height: 150.2, depth: 88.8 },
      documents: [INAX_MR_CATALOGUE],
      technicalConfidence: 'PROVISIONAL_REQUIRES_CAD',
      caveats: [
        'Thông số tạm thời: catalogue INAX 2026 ghi sâu 88,8 × rộng 147,9 × cao 150,2 mm, còn trang sản phẩm chính thức ghi sâu 155 × cao 120 × rộng 145 mm. Mô hình theo catalogue 2026.',
        'Độ cong nắp, trục lô giấy và chi tiết bắt vít là ước lượng cho đến khi có CAD — không dùng làm bản vẽ thi công.',
      ],
      sourceNotes: [
        '2026 catalogue D88.8 W147.9 H150.2; alternate official product page labels D155 H120 W145. Protective stamped chrome cover visible in Taiwan INAX catalogue; exact panel curvature, roll spindle and mount details are estimated until CAD is obtained.',
      ],
      previewIsRender: true,
    },
    technical: { plumbing: {}, drawingNotes: [] },
    provenance: PROVENANCE('Catalogue INAX 2026 và ảnh catalogue INAX Đài Loan', 'LivLab_Accessory_GLb_v2_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 147.9, depth: 88.8, height: 150.2 },
      worstErrorPct: 0,
      checks: { ...ALL_CHECKS, performance: false },
      waived: {
        performance:
          '36.508 tam giác, vượt ngưỡng 20.000 của LivLab cho phụ kiện (654 KB, dưới ngưỡng 1 MB). Chủ dự án duyệt file nguyên bản ngày 2026-11-20 và yêu cầu không chỉnh mô hình.',
      },
      conditions: [
        'Lưới dày hơn ngưỡng hiệu năng cho phụ kiện (36.508 tam giác so với 20.000); vẫn hiển thị vì là file nguyên bản đã được duyệt.',
        NORMALS_NOTE,
        'File đặt các chi tiết bằng phép dịch node và hệ số co giãn khớp kích thước dưới 2%, không xoay; hộp bao ghi theo toạ độ thế giới.',
        'Kích thước là thông số tạm thời: hai nguồn chính thức của INAX ghi khác nhau.',
      ],
    },
  },
  {
    id: 'inax-kf-541v-recon',
    brand: 'INAX',
    sku: 'KF-541V',
    normalizedSkus: ['KF541V'],
    name: 'Móc áo INAX KF-541V, dòng MR',
    category: 'accessory',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Móc áo',
    referenceDimensionsMm: { width: 22, height: 40, depth: 50 },
    envelopeLabel: '22 x 50 x 40 mm',
    manufacturerPage: 'https://www.inax.com.vn/vi/product-category/40-spec-depth-accessories/',
    mounting: {
      kind: 'WALL',
      heightRef: 'CENTRE',
      heightMm: { default: 1700, min: 1300, max: 1900, source: 'Mặc định của LivLab; chỉnh theo vị trí sử dụng.' },
      heightLabel: 'Cao độ móc',
    },
    files: {
      web: {
        url: '/models/inax/KF-541V/INAX_KF-541V.glb',
        bytes: 87384,
        sha256: '43bf8a42311776b76914f4ca6183ed3df29bb2504fbc8880046fced698a09e61',
        triangles: 4960,
        meshes: 5,
        boundsM: { min: [-0.011, 0, 0], max: [0.011, 0.04, 0.05] },
        label: 'Móc áo',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/KF-541V/INAX_KF-541V.png',
    listing: {
      summary:
        'Móc áo trụ tròn dòng MR có chốt giữ hướng lên, hoàn thiện crôm bóng. Kích thước theo catalogue INAX 2026: rộng 22 × cao 40 × sâu 50 mm.',
      material: null,
      finish: 'Crôm bóng',
      color: null,
      dimensionsMm: { width: 22, height: 40, depth: 50 },
      documents: [INAX_MR_CATALOGUE],
      technicalConfidence: 'PARTIALLY_ESTIMATED',
      caveats: [
        'Catalogue INAX 2026 và catalogue Đài Loan ghi sâu 50 × rộng 22 × cao 40 mm; trang tiếng Việt chính thức ghi sâu 40 × cao 50 mm theo thứ tự trục khác.',
        'Các kích thước nhỏ không nhìn thấy được suy ra từ ảnh tham chiếu.',
      ],
      sourceNotes: [
        '2026 INAX catalogue and Taiwan catalogue use D50 W22 H40; official VN HTML currently labels D40 H50 W22 in conflicting axis order. Chrome cylindrical hook with small upright retention peg; small unseen dimensions inferred from reference photos.',
      ],
      previewIsRender: true,
    },
    technical: { plumbing: {}, drawingNotes: [] },
    provenance: PROVENANCE('Catalogue INAX 2026 và ảnh tham chiếu', 'LivLab_Accessory_GLb_v2_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 22, depth: 50, height: 40 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [NORMALS_NOTE],
    },
  },

  /* ------------------------------------------------------------- vanity */
  {
    id: 'roca-a851693513-recon',
    brand: 'Roca',
    sku: 'A851693513',
    normalizedSkus: ['A851693513'],
    name: 'Tủ lavabo treo tường hai ngăn kéo kèm chậu Fineceramic Roca Ona Unik A851693513, xanh lá mờ',
    category: 'vanity',
    catalogueCategory: 'Lavabo',
    subCategory: 'Tủ lavabo treo tường',
    referenceDimensionsMm: { width: 1000, height: 645, depth: 460 },
    envelopeLabel: '1000 x 460 x 645 mm',
    // Verified 2026-11-20: Roca UK's page for this unit lists Ref A851693513.
    // The pack's own link was a truncated placeholder and is not used.
    manufacturerPage: 'https://www.uk.roca.com/products/unik-base-unit-two-drawers-basin-851693...',
    mounting: {
      kind: 'WALL',
      heightRef: 'TOP',
      heightMm: { default: 850, min: 780, max: 920, source: 'Mặc định của LivLab cho mặt chậu; chỉnh theo người dùng.' },
      heightLabel: 'Cao mặt chậu',
    },
    files: {
      web: {
        url: '/models/roca/A851693513/Roca_A851693513.glb',
        bytes: 459524,
        sha256: '014575daac50bd440f3474d2b4664d64fdf90a8519a9f47a16688f93480c1498',
        triangles: 25140,
        meshes: 19,
        boundsM: { min: [-0.5, 0, 0], max: [0.5, 0.645, 0.46] },
        label: 'Tủ và chậu',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/roca/A851693513/Roca_A851693513_iso.png',
    listing: {
      summary:
        'Tủ lavabo treo tường dòng Ona Unik, hai ngăn kéo đóng êm, thân MDF màu xanh lá mờ (513 Matt Green), chậu liền khối Fineceramic trắng với một lỗ vòi ở giữa. Kích thước ngoài 1000 × 460 × 645 mm theo Roca. Không kèm vòi.',
      material: 'Tủ MDF, chậu Fineceramic',
      finish: 'Xanh lá mờ (513 Matt Green)',
      color: 'Xanh lá mờ',
      dimensionsMm: { width: 1000, height: 645, depth: 460 },
      documents: [
        {
          label: 'Phiếu thông số A851693513 (PDF, nhà phân phối)',
          url: 'https://peralba.com/pdfs/ROCA851693513/ficha_ROCA851693513.pdf',
          official: false,
        },
      ],
      technicalConfidence: 'PRODUCT_ACCURATE_ENVELOPE__BOWL_INTERIOR_ESTIMATED',
      caveats: [
        'Gồm tủ và chậu; vòi không thuộc mã này nên không có trong mô hình.',
        'Kích thước ngoài theo Roca 1000 × 460 × 645 mm; bề rộng thân ngăn kéo lấy gần đúng từ bản vẽ 985 mm.',
        'Mặt cong lòng chậu, độ sâu và vị trí lỗ vòi là ước lượng vì chưa có CAD hãng; màu xanh của tủ lấy mẫu từ ảnh.',
      ],
      sourceNotes: [
        'Matt Green MDF structure, white Fineceramic integrated basin, center faucet hole, two soft-close drawers',
        'Includes basin and cabinet only; faucet is not part of the SKU and is intentionally absent',
        'Outer size per Roca 1000x460x645, internal width of drawer body approximated from 985mm drawing',
        'Bowl curved surface, exact depth and tap-hole placement inferred because no manufacturer CAD model obtained',
      ],
      previewIsRender: true,
    },
    technical: {
      plumbing: { requiresColdWater: true, requiresDrain: true, outlet: 'wall' },
      drawingNotes: ['Một lỗ vòi ở giữa chậu; vòi chọn riêng.'],
    },
    provenance: PROVENANCE('Thông số và bản vẽ của Roca, ảnh tham chiếu', 'LivLab_Batch3_GLb_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 1000, depth: 460, height: 645 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [NORMALS_NOTE, 'Lòng chậu và vị trí lỗ vòi là ước lượng; không kèm vòi.'],
    },
  },

  /* -------------------------------------------------------- floor drain */
  {
    id: 'inax-pbfv-600-recon',
    brand: 'INAX',
    sku: 'PBFV-600',
    normalizedSkus: ['PBFV600'],
    name: 'Thoát sàn dạng dài INAX PBFV-600, 600 mm',
    category: 'accessory',
    catalogueCategory: 'Gương & phụ kiện',
    subCategory: 'Thoát sàn',
    referenceDimensionsMm: { width: 600, depth: 126, height: 101 },
    envelopeLabel: '600 x 126 x 101 mm (âm sàn)',
    manufacturerPage: 'https://www.inax.com.vn/products/accessories/pbfv-600/',
    mounting: { kind: 'FLOOR_INSET', insetDepthMm: 101 },
    files: {
      web: {
        url: '/models/inax/PBFV-600/INAX_PBFV-600.glb',
        bytes: 37816,
        sha256: '01dea0490028419c0e8e6cbaca5b715acfc88926101dc6da06eaf3df5f329df2',
        triangles: 708,
        meshes: 59,
        boundsM: { min: [-0.3, -0.101, -0.063], max: [0.3, 0, 0.063] },
        label: 'Thoát sàn',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/PBFV-600/INAX_PBFV-600_iso.png',
    listing: {
      summary:
        'Thoát sàn dạng dài 600 mm bằng đồng thau mạ niken–crôm bóng, nắp có khe thoát thật. Mặt thoát 600 × 126 mm, phần thân âm sàn sâu 101 mm.',
      material: 'Đồng thau',
      finish: 'Mạ niken–crôm bóng',
      color: null,
      dimensionsMm: { width: 600, height: 101, depth: 126 },
      documents: [],
      technicalConfidence: 'TOP_GEOMETRY_VISUALLY_RECONSTRUCTED__TRAP_APPROX',
      caveats: [
        'Mặt thoát 600 × 126 mm; độ sâu 101 mm của hãng được hiểu là chiều sâu phần thân dưới sàn.',
        'Bước và số khe nắp lấy gần đúng từ ảnh; bẫy mùi và độ dày nắp là xấp xỉ hình ảnh — không thay được bản vẽ lắp đặt cấp thoát nước.',
      ],
      sourceNotes: [
        'Top footprint 600x126mm, stated manufacturer Depth=101mm mapped to underfloor vertical depth',
        'Grate has actual open slots; pitch/count approximate from visual reference',
        'Underfloor trap and grate thickness are visual approximations, not a plumbing shop drawing; cannot substitute for installation CAD',
        'Fits inside floor plane with top at Y=0 and body Y=-101mm',
      ],
      previewIsRender: true,
    },
    technical: {
      plumbing: { requiresDrain: true, outlet: 'floor' },
      drawingNotes: ['Đặt âm sàn: mặt nắp ngang mặt sàn hoàn thiện, thân sâu 101 mm (xấp xỉ).'],
    },
    provenance: PROVENANCE('Thông số của INAX và ảnh tham chiếu', 'LivLab_Batch3_GLb_README_VI.md'),
    runtimeQa: {
      readiness: '3D_READY',
      ...RUNTIME_QA,
      measuredMm: { width: 600, depth: 126, height: 101 },
      worstErrorPct: 0,
      checks: ALL_CHECKS,
      conditions: [
        NORMALS_NOTE,
        'Đặt âm sàn: mặt nắp ngang sàn hoàn thiện; phần thân và bẫy mùi nằm dưới sàn, không hiển thị trên mặt sàn.',
      ],
    },
  },
];
