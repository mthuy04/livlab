import type {
  AssetRejectionReason,
  DimensionsMm,
  PlacementType,
  PivotPreset,
  Product3DAsset,
} from './product3dAsset';
import { DIMENSION_ERROR_MAX_PCT, PIVOT_FOR_PLACEMENT, checkDimensions } from './product3dAsset';

/**
 * What happens to an exported FBX between arriving and being placeable.
 *
 * Written before the first file exists, on purpose. The six INAX sources are
 * `.max` and have to be exported by someone with 3ds Max; when the FBX comes
 * back, the question "what do we do with it" should already have one answer
 * rather than six improvised ones. Nothing here installs or invokes a
 * converter — `NORMALISATION_STEPS` is the contract, and the runner that
 * executes it arrives with Blender in the next task.
 *
 * The rule the whole file is arranged around: the exporter preserves, LivLab
 * normalises. An operator who straightens the model or scales it until it
 * looks right has destroyed the only evidence that the geometry is the right
 * size, because the check is the mesh against the manufacturer's figures and
 * a corrected mesh always passes.
 */

/** Where files live at each stage. Source is never overwritten by its output. */
export const INGESTION_PATHS = {
  /** Manufacturer originals, and the handoff asking for an export of them. */
  handoff: 'assets/3d/handoff/<brand>/<sku>/',
  /** FBX as received. Kept so a bad conversion can be redone from the input. */
  received: 'assets/3d/received/<brand>/<sku>/',
  /** Working files. Gitignored; reproducible from `received`. */
  workspace: 'assets/3d/workspace/<brand>/<sku>/',
  /** The reviewed runtime asset, and the only one the app ever serves. */
  runtime: 'public/assets/3d/<brand>/<sku>/',
} as const;

/** `inax_ac-1017vrn_source.fbx` → `inax_ac-1017vrn_master.glb`. */
export function runtimeFileName(brand: string, sku: string): string {
  return `${brand.toLowerCase()}_${sku.toLowerCase()}_master.glb`;
}

export function runtimeUrl(brand: string, sku: string): string {
  return `/assets/3d/${brand.toLowerCase()}/${sku.toLowerCase()}/${runtimeFileName(brand, sku)}`;
}

/* ------------------------------------------------------------- axis + pivot */

/**
 * Room Studio's convention, read off the scene rather than assumed.
 *
 * `PlacedProductNode` builds its volumes as `boxGeometry [width, height,
 * depth]`, and `placementRules` seats a back-wall product at `minZ + depth/2`
 * with no rotation. So the room is Y-up, the back wall is at −Z, and a product
 * standing against it faces +Z. Every imported asset is turned to match this
 * before anything else is measured.
 */
export const AXIS_CONVENTION = {
  up: '+Y',
  forward: '+Z',
  right: '+X',
  /** The face that meets the wall, opposite `forward`. */
  installationFace: '-Z',
  worldUnit: '1 unit = 1 metre',
} as const;

export const PILOT_PLACEMENT: PlacementType = 'FLOOR_TOILET';
export const PILOT_PIVOT: PivotPreset = PIVOT_FOR_PLACEMENT.FLOOR_TOILET; // BACK_CENTER_FLOOR

/* ------------------------------------------------------------ unit handling */

/**
 * The factor that turns the FBX's units into metres.
 *
 * An FBX states its unit badly or not at all, which is why the handoff asks
 * the operator to write it down. When they have, this is a lookup; when they
 * have not, `inferUnitScale` guesses from the size and the guess is recorded
 * as a guess.
 */
export const UNIT_TO_METRES: Record<string, number> = {
  millimeters: 0.001,
  centimeters: 0.01,
  meters: 1,
  inches: 0.0254,
};

/**
 * Infers the unit when the exporter did not state one.
 *
 * Only legitimate because the expected size is known: a toilet is roughly
 * 0.8m deep, so a mesh measuring 800 of something is in millimetres and one
 * measuring 0.8 is in metres. The ratio has to land near a power of ten — a
 * mesh that is 3.7× too big is not a unit problem and must not be "fixed" by
 * one.
 */
export function inferUnitScale(
  measuredLargest: number,
  officialLargestMm: number
): { scale: number; confident: boolean; note: string } {
  if (!(measuredLargest > 0) || !(officialLargestMm > 0)) {
    return { scale: 1, confident: false, note: 'Thiếu số đo để suy ra đơn vị.' };
  }
  const targetMetres = officialLargestMm / 1000;
  const raw = targetMetres / measuredLargest;

  for (const candidate of [1, 0.001, 0.01, 0.0254, 100, 1000]) {
    if (Math.abs(raw - candidate) / candidate < 0.02) {
      return { scale: candidate, confident: true, note: `Khớp hệ số đơn vị ${candidate}.` };
    }
  }
  return {
    scale: raw,
    confident: false,
    note: `Tỷ lệ ${raw.toFixed(4)} không khớp hệ số đơn vị nào — có thể model sai, không phải đơn vị sai.`,
  };
}

/**
 * Whether a size difference may be corrected by scaling at all.
 *
 * One factor for all three axes is a unit conversion and is fine. Three
 * different factors mean the mesh is a different shape from the product, and
 * stretching each axis until the numbers agree would produce a model that
 * measures correctly and is wrong — the most expensive kind of wrong, because
 * nothing downstream can detect it.
 */
export function axisScaleFactors(
  official: Required<DimensionsMm>,
  measuredMm: Required<DimensionsMm>
): { factors: { width: number; depth: number; height: number }; uniform: boolean; spreadPct: number } {
  const factors = {
    width: official.width / measuredMm.width,
    depth: official.depth / measuredMm.depth,
    height: official.height / measuredMm.height,
  };
  const values = Object.values(factors);
  const spreadPct = ((Math.max(...values) - Math.min(...values)) / Math.min(...values)) * 100;
  return { factors, uniform: spreadPct <= 2, spreadPct };
}

/* ---------------------------------------------------------------- the steps */

export interface NormalisationStep {
  id: string;
  title: string;
  detail: string;
}

/**
 * The pipeline, in order. Each step is one thing that can be gone back to when
 * the result looks wrong, which is the reason it is a list and not a function.
 */
export const NORMALISATION_STEPS: NormalisationStep[] = [
  { id: 'import', title: 'Nhập FBX', detail: 'Đọc file như nhận được. Không sửa gì trước khi đo.' },
  { id: 'unit', title: 'Xác định đơn vị', detail: 'Dùng đơn vị người export ghi lại; nếu không có, suy ra qua inferUnitScale và đánh dấu là suy đoán.' },
  { id: 'scale', title: 'Chuẩn hoá về mét', detail: 'Một hệ số duy nhất cho cả ba trục. Ba hệ số khác nhau là DIMENSION_MISMATCH, không phải việc cần scale.' },
  { id: 'cleanup', title: 'Dọn hình học thừa', detail: 'Bỏ camera, đèn, phông, helper. Giữ mọi chi tiết thuộc sản phẩm thật.' },
  { id: 'orientation', title: 'Xoay về chuẩn', detail: `Mặt trước hướng ${AXIS_CONVENTION.forward}, trên là ${AXIS_CONVENTION.up}.` },
  { id: 'pivot', title: 'Đặt pivot', detail: 'FLOOR_TOILET → BACK_CENTER_FLOOR: tâm ngang, đáy chạm sàn, mặt sau là mặt lắp.' },
  { id: 'materials', title: 'Chuẩn hoá vật liệu', detail: 'Về PBR. Chrome phải là kim loại, không phải nhựa xám. Không ép màu sứ trắng thành be.' },
  { id: 'export', title: 'Xuất GLB', detail: `Ghi vào ${INGESTION_PATHS.runtime}.` },
  { id: 'optimise', title: 'Tối ưu', detail: 'Giảm tam giác và texture trong ngưỡng danh mục, không làm vỡ đường cong vành sứ.' },
  { id: 'validate', title: 'Kiểm tính hợp lệ glTF', detail: 'Buffer thiếu, texture thiếu, transform NaN, scene rỗng → loại.' },
  { id: 'dimensionQa', title: 'Đối chiếu kích thước', detail: `Bbox so với số liệu hãng, từng trục. Vượt ${DIMENSION_ERROR_MAX_PCT}% là loại.` },
  { id: 'placementQa', title: 'Kiểm đặt trong phòng', detail: 'Đặt vào phòng 3×4×2.6m: không lơ lửng, không lún sàn, không quay lưng ra ngoài.' },
];

/* ------------------------------------------------------------------ verdict */

export interface IngestionCheck {
  assetId: string;
  sku: string;
  unitScaleApplied: number | null;
  unitInferred: boolean;
  dimensionErrorPct: number | null;
  rejectionReasons: AssetRejectionReason[];
  canProceed: boolean;
}

/**
 * Judges one converted mesh against its record.
 *
 * Returns reasons rather than a boolean: "failed" tells the next person
 * nothing, and the difference between a unit that could not be inferred and a
 * mesh that is genuinely the wrong shape decides whether the fix is a question
 * to the exporter or a rejection of the file.
 */
export function evaluateConversion(
  asset: Product3DAsset,
  measuredMm: Required<DimensionsMm> | null,
  statedUnit?: keyof typeof UNIT_TO_METRES
): IngestionCheck {
  const reasons: AssetRejectionReason[] = [];

  if (!measuredMm) {
    return {
      assetId: asset.id,
      sku: asset.sku,
      unitScaleApplied: null,
      unitInferred: false,
      dimensionErrorPct: null,
      rejectionReasons: ['BROKEN_GEOMETRY'],
      canProceed: false,
    };
  }

  const official = asset.dimensionsMm;
  const complete = official.width && official.depth && official.height;
  if (!complete) {
    // Without the manufacturer's figures there is nothing to check against,
    // and a mesh that validates only against itself validates nothing.
    reasons.push('DIMENSION_MISMATCH');
    return {
      assetId: asset.id, sku: asset.sku, unitScaleApplied: null, unitInferred: false,
      dimensionErrorPct: null, rejectionReasons: reasons, canProceed: false,
    };
  }

  const { uniform, spreadPct } = axisScaleFactors(
    official as Required<DimensionsMm>,
    measuredMm
  );
  if (!uniform) reasons.push('DIMENSION_MISMATCH');

  const { worstErrorPct } = checkDimensions(official, measuredMm);
  if (worstErrorPct !== null && worstErrorPct > DIMENSION_ERROR_MAX_PCT && uniform) {
    reasons.push('DIMENSION_MISMATCH');
  }

  const unitScale = statedUnit ? UNIT_TO_METRES[statedUnit] : null;

  return {
    assetId: asset.id,
    sku: asset.sku,
    unitScaleApplied: unitScale,
    unitInferred: !statedUnit,
    dimensionErrorPct: worstErrorPct,
    rejectionReasons: reasons,
    canProceed: reasons.length === 0 && spreadPct <= 2,
  };
}
