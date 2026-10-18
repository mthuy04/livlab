/**
 * LivLab's reconstructed 3D models — real geometry for a real SKU, rebuilt by
 * LivLab from the manufacturer's reference photographs and dimension drawings.
 *
 * Kept apart from `product3dRegistry` on purpose. That registry is the
 * manufacturer-asset lifecycle: its READY gate means "the manufacturer's own
 * geometry, converted and measured", and nothing here may pass that gate or
 * earn `3D VERIFIED`. A reconstruction is a different, smaller claim — the
 * overall size, the orientation and the mounting are right and were measured
 * in the running renderer; the exact curves are an approximation — and it is
 * said in those words wherever the model is shown.
 *
 * Identity is exact: brand plus normalised SKU, never a category. An INAX
 * toilet model is never reachable from a JOMOO toilet, and a SKU the
 * reconstruction was not built from (L-293VEC, the three-hole variant) is not
 * an alias of the one it was (L-293VFC).
 *
 * Every number under `files` was measured from the GLB on disk and is
 * re-measured by `npm run test:inax-3d`; `runtimeQa` records the in-browser
 * check at /dev/room-studio-3d-qa (report in
 * assets/3d/work/reports/inax-reconstructions-2026-10-18/). A replaced file
 * fails the test before it can reach a room with someone else's numbers.
 */

import { normalizeSku } from '@/lib/storefront/catalogTypes';

/* ------------------------------------------------------------------ states */

/**
 * Where a product's 3D model is in its lifecycle, as Room Studio sees it.
 *
 * Only `3D_READY` is drawn as geometry. `QA_CONDITIONAL` means the runtime
 * check found something a person must accept first; the product keeps its
 * true-size volume until they do.
 */
export type AssetReadiness =
  | 'NO_MODEL'
  | 'ASSET_RECEIVED'
  | 'QA_PENDING'
  | 'QA_CONDITIONAL'
  | '3D_READY'
  | 'REJECTED';

export const READINESS_LABEL: Record<AssetReadiness, string> = {
  NO_MODEL: 'Chưa có mô hình 3D',
  ASSET_RECEIVED: 'Đã nhận file, chưa kiểm tra',
  QA_PENDING: 'Đang kiểm tra',
  QA_CONDITIONAL: 'Kiểm tra có điều kiện',
  '3D_READY': 'Đã kiểm tra trong Room Studio',
  REJECTED: 'Không đạt kiểm tra',
};

/* ----------------------------------------------------------------- records */

/** How the model meets the room. Each one is anchored by its own rule. */
export type ReconstructionMounting =
  /** Origin at the back of the base, on the floor; back against a wall. */
  | { kind: 'FLOOR'; wallGapMm: number; wallGapSource: string }
  /**
   * Origin on the wall plane, at the mixer's centre. The mixer's height is an
   * installation choice, not a property of the product, so it is configurable
   * within a range and never inferred from the floor.
   */
  | {
      kind: 'WALL_MIXER';
      mixerHeightMm: { default: number; min: number; max: number; source: string };
    }
  /** Origin at the underside of the basin, which rests on a countertop. */
  | {
      kind: 'COUNTERTOP';
      counterHeightMm: { default: number; min: number; max: number; source: string };
    };

export interface ReconstructionFile {
  url: string;
  bytes: number;
  sha256: string;
  triangles: number;
  meshes: number;
  /** Model space, metres, Y up, +Z out of the wall. Measured, not declared. */
  boundsM: { min: [number, number, number]; max: [number, number, number] };
  /** What a customer is told this variant contains. */
  label: string;
  /** Parts of this variant that are not the SKU (an illustrative faucet). */
  illustrativeParts?: string;
}

export interface ReconstructedModel {
  id: string;
  brand: string;
  sku: string;
  /** Normalised SKUs this geometry is exactly. The first is canonical. */
  normalizedSkus: string[];
  name: string;
  /** Room Studio's normalised category. */
  category: 'toilet' | 'bathtub' | 'shower' | 'lavabo';
  /** Display category for the LivLab library, in the CSV's vocabulary. */
  catalogueCategory: string;
  subCategory: string;
  /** The manufacturer's figures the reconstruction was built to, in mm. */
  referenceDimensionsMm: Record<string, number>;
  /** Envelope the scene occupies — width (X) × depth (Z) × height (Y), mm. */
  envelopeLabel: string;
  /** Only when the reconstruction's own audit names the page. */
  manufacturerPage?: string;
  mounting: ReconstructionMounting;
  files: { web: ReconstructionFile; high?: ReconstructionFile; basin_only?: ReconstructionFile };
  /** What Room Studio draws by default. */
  defaultVariant: 'web' | 'basin_only';
  /** Variants a customer may switch to in the room. */
  roomVariants: Array<'web' | 'basin_only'>;
  thumbnailUrl: string;
  technical: {
    plumbing: {
      requiresColdWater?: boolean;
      requiresHotWater?: boolean;
      requiresDrain?: boolean;
      requiresToiletWaste?: boolean;
      outlet?: 'floor' | 'wall';
    };
    /** LivLab heuristic, not a manufacturer requirement. Said as such. */
    heuristicFrontClearanceM?: number;
    /** Drawing references kept for the installer. Not modelled geometry. */
    drawingNotes: string[];
  };
  provenance: {
    kind: 'LIVLAB_RECONSTRUCTION';
    reconstructedFrom: string;
    manufacturerCadUsed: false;
    packageStatus: 'CONDITIONAL';
    receivedAt: string;
    auditReport: string;
  };
  runtimeQa: {
    readiness: AssetReadiness;
    checkedAt?: string;
    checkedWith?: string;
    /** Measured by the renderer, mm, width × depth × height. */
    measuredMm?: { width: number; depth: number; height: number };
    worstErrorPct?: number;
    checks: {
      loads: boolean;
      boundsMatchFile: boolean;
      dimensionsMatchReference: boolean;
      originAndOrientation: boolean;
      mounting: boolean;
      materialsPbr: boolean;
      performance: boolean;
    };
    /** Accepted conditions, in the words a customer is shown. */
    conditions: string[];
  };
}

const REPORT = 'assets/3d/work/reports/inax-reconstructions-2026-10-18';

const RECONSTRUCTION_NOTE =
  'Mô hình 3D LivLab tái tạo từ ảnh và bản vẽ kích thước của hãng: đúng kích thước tổng thể, ' +
  'hướng đặt và cách lắp; đường cong chi tiết là gần đúng. Không phải file 3D chính hãng.';

/**
 * The five models received on 2026-10-18.
 *
 * `runtimeQa` is the result of /dev/room-studio-3d-qa run in Chrome against
 * these exact files; see the report folder for the measurements and screens.
 */
const MODELS: ReconstructedModel[] = [
  {
    id: 'inax-ac-1017vrn-recon',
    brand: 'INAX',
    sku: 'AC-1017VRN',
    normalizedSkus: ['AC1017VRN'],
    name: 'Bồn cầu 1 khối INAX AC-1017VRN',
    category: 'toilet',
    catalogueCategory: 'Bồn cầu',
    subCategory: 'Bồn cầu 1 khối',
    referenceDimensionsMm: { width: 400, depth: 805, height: 588 },
    envelopeLabel: '400 x 805 x 588 mm',
    manufacturerPage: 'https://www.inax.com.vn/products/toilet/ac-1017vrn/',
    mounting: {
      kind: 'FLOOR',
      wallGapMm: 20,
      wallGapSource: 'Mặc định của LivLab; bản vẽ không ghi khe hở sau.',
    },
    files: {
      web: {
        url: '/models/inax/AC-1017VRN/AC-1017VRN_web.glb',
        bytes: 986172,
        sha256: '47312ea6768a72c90dea1d1a8dd4dd6ebdd7d9f454fb1324540812b2473e8620',
        triangles: 57264,
        meshes: 9,
        boundsM: { min: [-0.2, 0, 0], max: [0.2, 0.588, 0.805] },
        label: 'Bồn cầu',
      },
      high: {
        url: '/models/inax/AC-1017VRN/AC-1017VRN_high.glb',
        bytes: 2720036,
        sha256: '06e4702eccd3a6ad968012559df01665ec1d1548fd4abf00e397543a59a3dbad',
        triangles: 150692,
        meshes: 9,
        boundsM: { min: [-0.2, 0, 0], max: [0.2, 0.588, 0.805] },
        label: 'Bồn cầu (chi tiết cao)',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/AC-1017VRN/preview.png',
    technical: {
      plumbing: { requiresColdWater: true, requiresToiletWaste: true, outlet: 'floor' },
      heuristicFrontClearanceM: 0.6,
      drawingNotes: ['Tâm thoát sàn cách tường 300 mm (bản vẽ, không mô hình hoá).'],
    },
    provenance: {
      kind: 'LIVLAB_RECONSTRUCTION',
      reconstructedFrom: 'Ảnh sản phẩm và bản vẽ ba hình chiếu của hãng',
      manufacturerCadUsed: false,
      packageStatus: 'CONDITIONAL',
      receivedAt: '2026-10-18',
      auditReport: `${REPORT}/AC-1017VRN_source_audit.md`,
    },
    runtimeQa: {
      readiness: '3D_READY',
      checkedAt: '2026-10-18T13:02:06.291Z',
      checkedWith: '/dev/room-studio-3d-qa · Chrome · ANGLE Metal (Apple M1)',
      measuredMm: { width: 400, depth: 805, height: 588 },
      worstErrorPct: 1.5e-06,
      checks: {
        loads: true,
        boundsMatchFile: true,
        dimensionsMatchReference: true,
        originAndOrientation: true,
        mounting: true,
        materialsPbr: true,
        performance: true,
      },
      conditions: [
        'File không kèm pháp tuyến đỉnh; Room Studio tính pháp tuyến có góc gấp 30° khi tải — không đỉnh nào dịch chuyển, kích thước đo lại không đổi.',
      ],
    },
  },
  {
    id: 'inax-ac-912vn-recon',
    brand: 'INAX',
    sku: 'AC-912VN',
    normalizedSkus: ['AC912VN'],
    name: 'Bồn cầu 1 khối INAX AC-912VN',
    category: 'toilet',
    catalogueCategory: 'Bồn cầu',
    subCategory: 'Bồn cầu 1 khối',
    referenceDimensionsMm: { width: 372, depth: 721, height: 680 },
    envelopeLabel: '372 x 721 x 680 mm',
    mounting: {
      kind: 'FLOOR',
      wallGapMm: 15,
      wallGapSource: 'Khe hở sau 15 mm theo bản vẽ lắp đặt AC-912VN (1.2021).',
    },
    files: {
      web: {
        url: '/models/inax/AC-912VN/AC-912VN_web.glb',
        bytes: 257220,
        sha256: 'bed8e666dfc6d0e2fef9dc59193faa70ada5dde0b32fa7560becea15658f7a01',
        triangles: 13876,
        meshes: 9,
        boundsM: { min: [-0.186, 0, 0], max: [0.186, 0.68, 0.721] },
        label: 'Bồn cầu',
      },
      high: {
        url: '/models/inax/AC-912VN/AC-912VN_high.glb',
        bytes: 685200,
        sha256: '659b76ea067510988bb4f866340d35f4ea5b07df50a9f1bb999a826fa17cf3ed',
        triangles: 37652,
        meshes: 9,
        boundsM: { min: [-0.186, 0, 0], max: [0.186, 0.68, 0.721] },
        label: 'Bồn cầu (chi tiết cao)',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/AC-912VN/preview.png',
    technical: {
      plumbing: { requiresColdWater: true, requiresToiletWaste: true, outlet: 'floor' },
      heuristicFrontClearanceM: 0.6,
      drawingNotes: ['Tâm thoát sàn cách tường 305 mm (bản vẽ, không mô hình hoá).'],
    },
    provenance: {
      kind: 'LIVLAB_RECONSTRUCTION',
      reconstructedFrom: 'Ảnh sản phẩm, bản vẽ AC-912VN (1.2021) và catalogue INAX 2026',
      manufacturerCadUsed: false,
      packageStatus: 'CONDITIONAL',
      receivedAt: '2026-10-18',
      auditReport: `${REPORT}/AC-912VN_source_audit.md`,
    },
    runtimeQa: {
      readiness: '3D_READY',
      checkedAt: '2026-10-18T13:02:06.291Z',
      checkedWith: '/dev/room-studio-3d-qa · Chrome · ANGLE Metal (Apple M1)',
      measuredMm: { width: 372, depth: 721, height: 680 },
      worstErrorPct: 2.4e-06,
      checks: {
        loads: true,
        boundsMatchFile: true,
        dimensionsMatchReference: true,
        originAndOrientation: true,
        mounting: true,
        materialsPbr: true,
        performance: true,
      },
      conditions: [
        'File không kèm pháp tuyến đỉnh; Room Studio tính pháp tuyến có góc gấp 30° khi tải — không đỉnh nào dịch chuyển, kích thước đo lại không đổi.',
      ],
    },
  },
  {
    id: 'inax-bf-1656v-recon',
    brand: 'INAX',
    sku: 'BF-1656V',
    normalizedSkus: ['BF1656V'],
    name: 'Bồn tắm đặt sàn INAX BF-1656V',
    category: 'bathtub',
    catalogueCategory: 'Bồn tắm',
    subCategory: 'Bồn tắm đặt sàn',
    referenceDimensionsMm: { length: 1600, width: 800, height: 560 },
    envelopeLabel: '1600 x 800 x 560 mm',
    manufacturerPage: 'https://www.inax.com.vn/vi/products/bathtub/bon-tam-dat-san-bf-1656v/',
    mounting: {
      kind: 'FLOOR',
      wallGapMm: 20,
      wallGapSource: 'Mặc định của LivLab; bồn đặt sàn có thể kéo ra xa tường.',
    },
    files: {
      web: {
        url: '/models/inax/BF-1656V/BF-1656V_web.glb',
        bytes: 237904,
        sha256: '27b27fbd5654aacf51952b57dc59be1cb70c0967135ef9aaccf7e502c5102cec',
        triangles: 13012,
        meshes: 6,
        boundsM: { min: [-0.8, 0, 0], max: [0.8, 0.56, 0.8] },
        label: 'Bồn tắm',
      },
      high: {
        url: '/models/inax/BF-1656V/BF-1656V_high.glb',
        bytes: 723984,
        sha256: '8f6cb46abb1cad7134da0f1d4b032cecd37544dc70f0b836c4b7ff8a0454f713',
        triangles: 40016,
        meshes: 6,
        boundsM: { min: [-0.8, 0, 0], max: [0.8, 0.56, 0.8] },
        label: 'Bồn tắm (chi tiết cao)',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/BF-1656V/preview.png',
    technical: {
      plumbing: { requiresColdWater: true, requiresHotWater: true, requiresDrain: true, outlet: 'floor' },
      heuristicFrontClearanceM: 0.6,
      drawingNotes: ['Ống thoát Ø48 mm (bản vẽ). Chất liệu acrylic trắng.'],
    },
    provenance: {
      kind: 'LIVLAB_RECONSTRUCTION',
      reconstructedFrom: 'Ảnh sản phẩm và bản vẽ kích thước của hãng',
      manufacturerCadUsed: false,
      packageStatus: 'CONDITIONAL',
      receivedAt: '2026-10-18',
      auditReport: `${REPORT}/BF-1656V_source_audit.md`,
    },
    runtimeQa: {
      readiness: '3D_READY',
      checkedAt: '2026-10-18T13:02:06.291Z',
      checkedWith: '/dev/room-studio-3d-qa · Chrome · ANGLE Metal (Apple M1)',
      measuredMm: { width: 1600, depth: 800, height: 560 },
      worstErrorPct: 1.5e-06,
      checks: {
        loads: true,
        boundsMatchFile: true,
        dimensionsMatchReference: true,
        originAndOrientation: true,
        mounting: true,
        materialsPbr: true,
        performance: true,
      },
      conditions: [
        'File không kèm pháp tuyến đỉnh; Room Studio tính pháp tuyến có góc gấp 30° khi tải — không đỉnh nào dịch chuyển, kích thước đo lại không đổi.',
      ],
    },
  },
  {
    id: 'inax-bfv-70s-recon',
    brand: 'INAX',
    sku: 'BFV-70S',
    normalizedSkus: ['BFV70S'],
    name: 'Sen cây nóng lạnh INAX BFV-70S',
    category: 'shower',
    catalogueCategory: 'Sen tắm',
    subCategory: 'Sen cây nóng lạnh',
    referenceDimensionsMm: {
      rainheadDiameter: 203,
      riserToRainheadCentre: 350,
      mixerToSlider: 720,
      mixerToRainheadMax: 1397,
    },
    envelopeLabel: '294 x 524 x 1638 mm (bao ngoài mô hình)',
    manufacturerPage: 'https://www.inax.com.vn/products/shower/bfv-70s/',
    mounting: {
      kind: 'WALL_MIXER',
      mixerHeightMm: {
        default: 1000,
        min: 800,
        max: 1200,
        source: 'Cao độ bộ trộn là lựa chọn lắp đặt; 1000 mm là mặc định của LivLab.',
      },
    },
    files: {
      web: {
        url: '/models/inax/BFV-70S/BFV-70S_web.glb',
        bytes: 315864,
        sha256: '41b9091454f8c44bfcda50578c327627edcc05d0834615f8b092a9d49193d9f0',
        triangles: 17140,
        meshes: 25,
        boundsM: { min: [-0.147, -0.092079, 0], max: [0.147, 1.545969, 0.5235] },
        label: 'Sen cây',
      },
      high: {
        url: '/models/inax/BFV-70S/BFV-70S_high.glb',
        bytes: 696800,
        sha256: '65b6d16651f54a113efa19e01453917de3d06b6eb30595ff8e08e10f6ceb6437',
        triangles: 38812,
        meshes: 26,
        boundsM: { min: [-0.147, -0.092332, 0], max: [0.147, 1.5462, 0.5235] },
        label: 'Sen cây (chi tiết cao)',
      },
    },
    defaultVariant: 'web',
    roomVariants: ['web'],
    thumbnailUrl: '/models/inax/BFV-70S/preview.png',
    technical: {
      plumbing: { requiresColdWater: true, requiresHotWater: true, outlet: 'wall' },
      drawingNotes: [
        'Khoảng cách tâm hai đường cấp 150 ± 20 mm, ren G1/2 (bản vẽ).',
        'Bát sen Ø203 mm; tâm ống đứng tới tâm bát sen 350 mm (bản vẽ).',
      ],
    },
    provenance: {
      kind: 'LIVLAB_RECONSTRUCTION',
      reconstructedFrom: 'Ảnh sản phẩm và bản vẽ kỹ thuật của hãng',
      manufacturerCadUsed: false,
      packageStatus: 'CONDITIONAL',
      receivedAt: '2026-10-18',
      auditReport: `${REPORT}/BFV-70S_source_audit.md`,
    },
    runtimeQa: {
      readiness: '3D_READY',
      checkedAt: '2026-10-18T13:02:06.291Z',
      checkedWith: '/dev/room-studio-3d-qa · Chrome · ANGLE Metal (Apple M1)',
      measuredMm: { width: 294, depth: 523.5, height: 1638.05 },
      worstErrorPct: 4.8e-06,
      checks: {
        loads: true,
        boundsMatchFile: true,
        dimensionsMatchReference: true,
        originAndOrientation: true,
        mounting: true,
        materialsPbr: true,
        performance: true,
      },
      conditions: [
        'File không kèm pháp tuyến đỉnh; Room Studio tính pháp tuyến có góc gấp 30° khi tải — không đỉnh nào dịch chuyển, kích thước đo lại không đổi.',
        'Không có hộp kích thước trên thông số hãng; đã đối chiếu tầm vươn bát sen (350 mm + Ø203/2) với chiều sâu đo được. Cao độ mặt bát sen 1397 mm không đo được bằng hộp bao.',
      ],
    },
  },
  {
    id: 'inax-l-293v-recon',
    brand: 'INAX',
    sku: 'L-293V',
    // FC is the single tap-hole configuration this geometry was built with.
    // EC (three holes) is the same body with a different deck and is NOT an
    // alias: its holes are not in the model.
    normalizedSkus: ['L293V', 'L293VFC'],
    name: 'Lavabo đặt bàn INAX L-293VFC',
    category: 'lavabo',
    catalogueCategory: 'Lavabo',
    subCategory: 'Lavabo đặt bàn',
    referenceDimensionsMm: { width: 500, depth: 450, height: 155 },
    envelopeLabel: '500 x 450 x 155 mm',
    mounting: {
      kind: 'COUNTERTOP',
      counterHeightMm: {
        default: 800,
        min: 700,
        max: 950,
        source: 'Mặt bàn cao 800 mm theo bản vẽ lắp đặt L-293V.',
      },
    },
    files: {
      web: {
        url: '/models/inax/L-293V/L-293V_web.glb',
        bytes: 88036,
        sha256: '8c4fbed3b369ab0f592dee4e6f9a1f37fe4d9df34ead9b393fbf04df09e8b971',
        triangles: 4250,
        meshes: 12,
        boundsM: { min: [-0.25, 0, 0], max: [0.25, 0.27875, 0.45] },
        label: 'Chậu kèm vòi minh hoạ',
        illustrativeParts: 'Vòi trong bản này chỉ để minh hoạ, không phải một mã vòi INAX đã xác minh.',
      },
      high: {
        url: '/models/inax/L-293V/L-293V_high.glb',
        bytes: 177004,
        sha256: '1736168c91dc4a7eaae26259019de11d3a0ba79d5a04ad679e3a170ba6a5b3fc',
        triangles: 8026,
        meshes: 12,
        boundsM: { min: [-0.25, 0, 0], max: [0.25, 0.27875, 0.45] },
        label: 'Chậu kèm vòi minh hoạ (chi tiết cao)',
        illustrativeParts: 'Vòi trong bản này chỉ để minh hoạ, không phải một mã vòi INAX đã xác minh.',
      },
      basin_only: {
        url: '/models/inax/L-293V/L-293V_basin_only.glb',
        bytes: 96848,
        sha256: '64ae379472168a63b0919dee534c728154aaa797d233b93b84f17f7753997493',
        triangles: 4418,
        meshes: 5,
        boundsM: { min: [-0.25, 0, 0], max: [0.25, 0.155, 0.45] },
        label: 'Chỉ chậu',
      },
    },
    defaultVariant: 'basin_only',
    roomVariants: ['basin_only', 'web'],
    thumbnailUrl: '/models/inax/L-293V/preview.png',
    technical: {
      plumbing: { requiresColdWater: true, requiresDrain: true },
      heuristicFrontClearanceM: 0.7,
      drawingNotes: [
        'Lỗ khoét mặt bàn 430 × 210 mm, R10 (bản vẽ).',
        'Bản FC một lỗ vòi Ø36 mm; bản EC ba lỗ không có trong mô hình.',
      ],
    },
    provenance: {
      kind: 'LIVLAB_RECONSTRUCTION',
      reconstructedFrom: 'Ảnh sản phẩm, bản vẽ lắp đặt và catalogue INAX',
      manufacturerCadUsed: false,
      packageStatus: 'CONDITIONAL',
      receivedAt: '2026-10-18',
      auditReport: `${REPORT}/L-293V_source_audit.md`,
    },
    runtimeQa: {
      readiness: '3D_READY',
      checkedAt: '2026-10-18T13:02:06.291Z',
      checkedWith: '/dev/room-studio-3d-qa · Chrome · ANGLE Metal (Apple M1)',
      measuredMm: { width: 500, depth: 450, height: 155 },
      worstErrorPct: 2.6e-06,
      checks: {
        loads: true,
        boundsMatchFile: true,
        dimensionsMatchReference: true,
        originAndOrientation: true,
        mounting: true,
        materialsPbr: true,
        performance: true,
      },
      conditions: [
        'File không kèm pháp tuyến đỉnh; Room Studio tính pháp tuyến có góc gấp 30° khi tải — không đỉnh nào dịch chuyển, kích thước đo lại không đổi.',
        'Bản kèm vòi chỉ dùng khi khách chọn; vòi là minh hoạ, không phải mã vòi INAX đã xác minh.',
      ],
    },
  },
];

export const RECONSTRUCTION_DISCLOSURE = RECONSTRUCTION_NOTE;

/* ----------------------------------------------------------------- lookup */

const BY_KEY = new Map<string, ReconstructedModel>();
for (const model of MODELS) {
  for (const sku of model.normalizedSkus) BY_KEY.set(`${model.brand.toUpperCase()}::${sku}`, model);
}

/**
 * The reconstruction for exactly this brand and SKU, or null.
 *
 * Both halves are required. A SKU alone is not unique across manufacturers,
 * and a brand alone is a category guess — the thing this whole layer refuses.
 */
export function findReconstruction(
  brand: string | null | undefined,
  sku: string | null | undefined
): ReconstructedModel | null {
  if (!brand || !sku) return null;
  return BY_KEY.get(`${brand.trim().toUpperCase()}::${normalizeSku(sku)}`) ?? null;
}

export function allReconstructions(): ReconstructedModel[] {
  return MODELS;
}

/** Drawn as geometry only once the runtime check passed with nothing outstanding. */
export function canRenderReconstruction(model: ReconstructedModel | null | undefined): boolean {
  if (!model) return false;
  return model.runtimeQa.readiness === '3D_READY' && Object.values(model.runtimeQa.checks).every(Boolean);
}

export type ReconstructionVariant = keyof ReconstructedModel['files'];

export function variantFile(model: ReconstructedModel, variant?: string | null): ReconstructionFile {
  const key = (variant && model.roomVariants.includes(variant as 'web' | 'basin_only')
    ? variant
    : model.defaultVariant) as ReconstructionVariant;
  return model.files[key] ?? model.files.web;
}

/** Width (X), depth (Z), height (Y) of a variant's envelope, metres. */
export function envelopeOf(file: ReconstructionFile): { width: number; depth: number; height: number } {
  const [minX, minY, minZ] = file.boundsM.min;
  const [maxX, maxY, maxZ] = file.boundsM.max;
  return { width: maxX - minX, depth: maxZ - minZ, height: maxY - minY };
}

/**
 * Where the model's origin sits relative to the centre of its envelope, metres.
 *
 * The scene stores every product by the centre of its box. Mounting rules are
 * written against the model's own origin (the mixer centre, the back of the
 * base), so this is the one translation between the two.
 */
export function originFromCentre(file: ReconstructionFile): [number, number, number] {
  return [
    -(file.boundsM.min[0] + file.boundsM.max[0]) / 2,
    -(file.boundsM.min[1] + file.boundsM.max[1]) / 2,
    -(file.boundsM.min[2] + file.boundsM.max[2]) / 2,
  ];
}
