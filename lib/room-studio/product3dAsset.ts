/**
 * What a LivLab 3D product asset is, and what it is allowed to claim.
 *
 * One real SKU, one verified master asset, reused by Product Detail, Concepts,
 * Room Studio and whatever comes after. The thing this file exists to prevent
 * is the shape the codebase was already in: a single 17MB `lavabo.glb` served
 * as the model for every basin in the catalogue, because the category had a
 * file and the product did not. A customer placing their chosen basin in a
 * room and seeing a different basin is a lie told in three dimensions.
 *
 * So there is no "has3D" boolean here. A manufacturer CAD is not a model, a
 * 3DS MAX file is not a model, a converted mesh nobody measured is not a
 * model, and a model of a product that merely resembles this one is not this
 * product. Each of those is a distinct state below, and only one of them
 * reaches a customer.
 */

/* ------------------------------------------------------------------ source */

/**
 * Where the geometry came from. Everything above OTHER_VERIFIED traces back to
 * the manufacturer or to someone the manufacturer authorised; a marketplace
 * download, a community SketchUp upload or an AI-reconstructed mesh is not on
 * this list and does not become a product asset.
 */
export type AssetSourceType =
  | 'MANUFACTURER_OFFICIAL'
  | 'MANUFACTURER_DEALER_PACKAGE'
  | 'SHOWROOM_AUTHORIZED'
  | 'MANUFACTURER_BIM_LIBRARY'
  | 'BIMOBJECT_MANUFACTURER'
  | 'AUTHORIZED_DISTRIBUTOR'
  | 'INTERNAL_CONVERSION'
  | 'OTHER_VERIFIED';

export type RightsStatus =
  | 'AUTHORIZED_SHOWROOM'
  | 'MANUFACTURER_PUBLIC'
  | 'MANUFACTURER_PROVIDED'
  | 'INTERNAL_DEMO_ONLY'
  | 'REVIEW_REQUIRED';

export type SourceFormat =
  | 'GLB' | 'GLTF'
  | 'FBX' | 'OBJ' | 'DAE' | '3DS'
  | 'SKP' | 'MAX'
  | 'DWG' | 'DXF'
  | 'RFA' | 'RVT'
  | 'STEP' | 'IGES'
  | 'ARCHIVE'
  | 'OTHER';

/**
 * What can actually be done with a source file *in this repository, today*.
 *
 * Deliberately a property of the environment rather than of the format: the
 * same FBX is AUTO_CONVERTIBLE on a machine with Blender and
 * MANUAL_EXPORT_REQUIRED on one without. `scripts/audit_3d_assets.mjs` probes
 * for the tools and reports what it finds, so this never drifts into wishful
 * thinking about a toolchain nobody installed.
 */
export type ConversionCapability =
  | 'DIRECT_WEB_READY'
  | 'AUTO_CONVERTIBLE'
  | 'CONVERSION_TOOL_REQUIRED'
  | 'MANUAL_EXPORT_REQUIRED'
  | 'UNSUITABLE_FOR_ROOM_STUDIO_3D'
  | 'UNSUPPORTED';

export interface AssetSource {
  type: AssetSourceType;
  url?: string;
  originalFileName: string;
  originalFormat: SourceFormat;
  checkedAt: string;
  rightsStatus: RightsStatus;
  /** How the file reached us — kept so provenance survives a hand-off. */
  retrievalMethod?: string;
  sourceHash?: string;
}

/* ---------------------------------------------------------------- identity */

/**
 * How the geometry relates to the commercial SKU.
 *
 * A commercial toilet SKU is frequently a bundle: a ceramic body, a seat, a
 * flush component, each with its own manufacturer code. TOTO's own spec sheet
 * for MS636DT8 names CW636DV and TC600VS alongside it. So a model whose
 * filename says CW636DV is not a mismatch — but the relationship has to be
 * written down and checked, not assumed from a family resemblance.
 */
export type AssetRelationType =
  | 'EXACT_PRODUCT'
  | 'COMMERCIAL_COMBINATION'
  | 'CERAMIC_BODY'
  | 'SEAT_COMPONENT'
  | 'FAUCET_COMPONENT'
  | 'SHOWER_COMPONENT'
  | 'VERIFIED_COMPONENT';

export interface AssetIdentity {
  relationType: AssetRelationType;
  /** Manufacturer's own model code, when it differs from the commercial SKU. */
  manufacturerModel?: string;
  componentSkus?: string[];
  /** Why this relationship holds. Internal; never rendered. */
  note?: string;
}

/* --------------------------------------------------------------- placement */

/**
 * How the object meets the room. Drives anchoring, not appearance.
 *
 * Finer than Room Studio's current four-way floor/wall/counter/ceiling, and
 * deliberately so: a wall-hung toilet and a floor toilet are both "a toilet"
 * to the catalogue and two different anchoring problems to the scene.
 */
export type PlacementType =
  | 'FLOOR_TOILET' | 'WALL_HUNG_TOILET'
  | 'COUNTERTOP_BASIN' | 'UNDERCOUNTER_BASIN' | 'SEMI_COUNTER_BASIN' | 'WALL_HUNG_BASIN'
  | 'DECK_FAUCET' | 'WALL_FAUCET'
  | 'EXPOSED_SHOWER' | 'CONCEALED_SHOWER' | 'SHOWER_COLUMN'
  | 'FREESTANDING_BATHTUB' | 'BUILT_IN_BATHTUB'
  | 'WALL_MIRROR' | 'MIRROR_CABINET'
  | 'FLOOR_VANITY' | 'WALL_HUNG_VANITY'
  | 'ACCESSORY_WALL' | 'ACCESSORY_FLOOR';

/**
 * Where the asset's origin sits on the object.
 *
 * An exporter's idea of the origin is wherever the modeller left it, which is
 * why a model can arrive 20 metres from zero or pivoting about its own nose.
 * Every asset is normalised to one of these before it is READY, so the scene
 * can anchor by rule instead of by per-model nudging.
 */
export type PivotPreset =
  | 'BACK_CENTER_FLOOR'
  | 'BOTTOM_CENTER'
  | 'WALL_CONNECTION_CENTER'
  | 'TOP_CENTER'
  | 'CENTER';

/** The pivot each placement is normalised to. One rule per placement, no exceptions. */
export const PIVOT_FOR_PLACEMENT: Record<PlacementType, PivotPreset> = {
  FLOOR_TOILET: 'BACK_CENTER_FLOOR',
  WALL_HUNG_TOILET: 'WALL_CONNECTION_CENTER',
  COUNTERTOP_BASIN: 'BOTTOM_CENTER',
  UNDERCOUNTER_BASIN: 'TOP_CENTER',
  SEMI_COUNTER_BASIN: 'BOTTOM_CENTER',
  WALL_HUNG_BASIN: 'WALL_CONNECTION_CENTER',
  DECK_FAUCET: 'BOTTOM_CENTER',
  WALL_FAUCET: 'WALL_CONNECTION_CENTER',
  EXPOSED_SHOWER: 'WALL_CONNECTION_CENTER',
  CONCEALED_SHOWER: 'WALL_CONNECTION_CENTER',
  SHOWER_COLUMN: 'WALL_CONNECTION_CENTER',
  FREESTANDING_BATHTUB: 'BOTTOM_CENTER',
  BUILT_IN_BATHTUB: 'BOTTOM_CENTER',
  WALL_MIRROR: 'WALL_CONNECTION_CENTER',
  MIRROR_CABINET: 'WALL_CONNECTION_CENTER',
  FLOOR_VANITY: 'BACK_CENTER_FLOOR',
  WALL_HUNG_VANITY: 'WALL_CONNECTION_CENTER',
  ACCESSORY_WALL: 'WALL_CONNECTION_CENTER',
  ACCESSORY_FLOOR: 'BOTTOM_CENTER',
};

export interface AssetPlacement {
  type: PlacementType;
  pivot: PivotPreset;
  /** Radians, applied after import normalisation. */
  defaultRotation: [number, number, number];
  wallOffsetMm?: number;
  floorOffsetMm?: number;
}

/* ----------------------------------------------------------------- runtime */

/**
 * Room Studio works in metres: one world unit is one metre, so a 490mm-wide
 * basin is 0.49 units across. Manufacturer dimensions arrive in millimetres
 * and are converted here rather than wherever someone happens to need them.
 */
export const MM_PER_WORLD_UNIT = 1000;
export const mmToWorld = (mm: number): number => mm / MM_PER_WORLD_UNIT;

export interface DimensionsMm {
  width?: number;
  depth?: number;
  height?: number;
}

export interface AssetRuntime {
  glbUrl?: string;
  fileSizeBytes?: number;
  triangleCount?: number;
  meshCount?: number;
  materialCount?: number;
  textureCount?: number;
  /** Measured from the exported GLB, in millimetres, for comparison with spec. */
  bboxMm?: Required<DimensionsMm>;
  runtimeHash?: string;
}

/* ------------------------------------------------------------------ status */

/**
 * The lifecycle, spelled out.
 *
 * Collapsing this to a boolean is what produced the generic-basin bug: "there
 * is a file" and "this product has a verified model" became the same question,
 * and the answer to the easy one was used for the hard one.
 */
export type Product3DAssetStatus =
  | 'SOURCE_DISCOVERED'
  | 'SOURCE_VERIFIED'
  | 'SOURCE_DOWNLOADED'
  | 'CONVERSION_PENDING'
  | 'MANUAL_EXPORT_REQUIRED'
  | 'CONVERTING'
  | 'CONVERTED'
  | 'QA_REQUIRED'
  | 'READY'
  | 'REJECTED'
  | 'SOURCE_UNAVAILABLE';

/** Why an asset was rejected. "FAILED" tells the next person nothing. */
export type AssetRejectionReason =
  | 'SKU_MISMATCH'
  | 'UNVERIFIED_COMPONENT'
  | 'DIMENSION_MISMATCH'
  | 'BROKEN_GEOMETRY'
  | 'WRONG_FINISH'
  | 'MATERIAL_FAILURE'
  | 'MISSING_TEXTURE'
  | 'UNSUPPORTED_SOURCE_FORMAT'
  | 'EXCESSIVE_FILE_SIZE'
  | 'BAD_PIVOT'
  | 'BAD_ORIENTATION'
  | 'CORRUPT_GLTF'
  | 'RIGHTS_REVIEW_REQUIRED';

/**
 * Every check that has to pass. All seven, or the asset is not READY.
 *
 * `dimensionsVerified` means the official figures are on file;
 * `scaleVerified` means the exported mesh was measured against them. They are
 * separate because having a spec sheet and having checked the mesh against it
 * are different pieces of work, and only the second one catches a model
 * authored in centimetres.
 */
export interface AssetQa {
  identityVerified: boolean;
  dimensionsVerified: boolean;
  scaleVerified: boolean;
  pivotVerified: boolean;
  orientationVerified: boolean;
  materialsVerified: boolean;
  performanceVerified: boolean;
  /** Set when status is REJECTED. */
  rejectionReasons?: AssetRejectionReason[];
  reviewedBy?: string;
  reviewedAt?: string;
}

export const QA_CHECKS: Array<keyof Omit<AssetQa, 'rejectionReasons' | 'reviewedBy' | 'reviewedAt'>> = [
  'identityVerified',
  'dimensionsVerified',
  'scaleVerified',
  'pivotVerified',
  'orientationVerified',
  'materialsVerified',
  'performanceVerified',
];

/* ------------------------------------------------------------------- asset */

export interface Product3DAsset {
  id: string;
  /** The canonical storefront identity — the same one /products and quote use. */
  catalogProductId: string;
  brand: string;
  sku: string;
  normalizedSku: string;

  source: AssetSource;
  identity: AssetIdentity;
  /** From the manufacturer's spec sheet. Never measured off the mesh. */
  dimensionsMm: DimensionsMm;
  placement: AssetPlacement;
  runtime: AssetRuntime;

  status: Product3DAssetStatus;
  qa: AssetQa;

  assetVersion: number;
  sourceRevision?: string;
  convertedAt?: string;
  /** Internal note. Never rendered to a customer. */
  note?: string;
}

/* -------------------------------------------------------------------- gate */

/**
 * The only question Room Studio and Product Detail are allowed to ask.
 *
 * READY *and* all seven checks: the status alone is not enough, because a
 * status is something a person types and a check is something a person did.
 */
export function isRoomStudioReady(asset: Product3DAsset | null | undefined): boolean {
  if (!asset) return false;
  if (asset.status !== 'READY') return false;
  if (!asset.runtime.glbUrl) return false;
  return QA_CHECKS.every((check) => asset.qa[check]);
}

/**
 * Per-axis error between the exported mesh and the manufacturer's figures.
 *
 * The mesh is checked against the spec, never the other way round: a bounding
 * box tells you what was exported, not what the product measures. Axes the
 * spec omits are skipped rather than scored against a guess.
 */
export interface DimensionCheck {
  axis: 'width' | 'depth' | 'height';
  officialMm: number;
  modelMm: number;
  errorPct: number;
}

export const DIMENSION_ERROR_PREFERRED_PCT = 2;
export const DIMENSION_ERROR_MAX_PCT = 5;

export function checkDimensions(
  official: DimensionsMm,
  measured: DimensionsMm | undefined
): { checks: DimensionCheck[]; worstErrorPct: number | null; passes: boolean } {
  if (!measured) return { checks: [], worstErrorPct: null, passes: false };

  const checks: DimensionCheck[] = [];
  (['width', 'depth', 'height'] as const).forEach((axis) => {
    const o = official[axis];
    const m = measured[axis];
    if (!o || !m || o <= 0) return;
    checks.push({ axis, officialMm: o, modelMm: m, errorPct: (Math.abs(m - o) / o) * 100 });
  });

  if (checks.length === 0) return { checks, worstErrorPct: null, passes: false };
  const worst = Math.max(...checks.map((c) => c.errorPct));
  return { checks, worstErrorPct: worst, passes: worst <= DIMENSION_ERROR_MAX_PCT };
}

/**
 * Size and triangle budgets per category.
 *
 * Targets, not rejection limits — a smart toilet with a control panel is
 * legitimately heavier than a soap dish. The audit reports what exceeds them
 * rather than failing it, because the judgement about whether a 4MB basin is
 * worth it belongs to a person looking at the basin.
 */
export const PERFORMANCE_TARGETS: Record<string, { maxBytes: number; triangles: [number, number] }> = {
  ACCESSORY: { maxBytes: 1_000_000, triangles: [5_000, 20_000] },
  FAUCET: { maxBytes: 2_000_000, triangles: [10_000, 40_000] },
  BASIN: { maxBytes: 3_000_000, triangles: [10_000, 40_000] },
  TOILET: { maxBytes: 3_000_000, triangles: [20_000, 60_000] },
  SMART_TOILET: { maxBytes: 5_000_000, triangles: [30_000, 100_000] },
  SHOWER: { maxBytes: 5_000_000, triangles: [20_000, 80_000] },
  BATHTUB: { maxBytes: 5_000_000, triangles: [20_000, 60_000] },
  VANITY: { maxBytes: 5_000_000, triangles: [20_000, 60_000] },
};
