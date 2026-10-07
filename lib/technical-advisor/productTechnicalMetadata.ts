/**
 * Technical metadata for validation, and the honest accounting of where each
 * field came from.
 *
 * Three tiers, and the distinction is the whole point of this module:
 *
 *  1. CATALOGUE — dimensions actually stated in the verified product CSV.
 *  2. CURATED   — a small, explicitly listed demo set below. Only structural
 *                 facts that follow from what the product *is* (a wall-hung
 *                 basin mounts on a wall; a toilet needs a waste outlet).
 *  3. INFERRED  — placement guessed from the product's category name, because
 *                 `Product.mountType` exists in lib/types.ts but is populated
 *                 for no product in the catalogue.
 *
 * Rules downgrade confidence and add "cần kiểm tra" wording as they move down
 * that list. Nothing here invents a manufacturer clearance figure, a certified
 * dimension, or a code requirement — those genuinely do not exist in LivLab's
 * data yet, and saying so is more useful than a plausible number.
 */

import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { PlacementType } from '@/lib/room-studio/placementRules';

export type TechnicalPlacementType = 'FLOOR' | 'WALL' | 'COUNTERTOP' | 'CEILING' | 'SURFACE' | 'UNKNOWN';

export type MetadataOrigin = 'CATALOGUE' | 'CURATED_DEMO' | 'INFERRED' | 'MISSING';

export interface ClearanceSpec {
  /** Metres of free space the product's own data recommends. */
  front?: number;
  left?: number;
  right?: number;
  top?: number;
}

export interface PlumbingSpec {
  requiresColdWater?: boolean;
  requiresHotWater?: boolean;
  requiresDrain?: boolean;
  requiresToiletWaste?: boolean;
  /** Whether the outlet is expected in the wall or the floor, when known. */
  outlet?: 'wall' | 'floor';
}

export interface ProductTechnicalMetadata {
  /** Metres. Undefined means LivLab has no figure — never a fallback guess. */
  width?: number;
  depth?: number;
  height?: number;
  dimensionsOrigin: MetadataOrigin;

  placementType: TechnicalPlacementType;
  placementOrigin: MetadataOrigin;

  /** Surfaces this product may legitimately sit on, when known. */
  allowedSurfaces?: ('FLOOR' | 'WALL' | 'COUNTERTOP' | 'CEILING')[];

  recommendedClearance?: ClearanceSpec;
  clearanceOrigin: MetadataOrigin;

  plumbing?: PlumbingSpec;
  plumbingOrigin: MetadataOrigin;

  installationNotes?: string;
}

/**
 * Curated demo metadata — TEMPORARY, and deliberately small.
 *
 * Keyed by the product id used throughout LivLab. Every entry records only what
 * is structurally obvious from the product type itself. Clearance figures are
 * present for exactly two entries and are flagged CURATED_DEMO so the UI and
 * the Expert both describe them as LivLab reference figures, never as standards.
 *
 * When real manufacturer data arrives this map is replaced wholesale; nothing
 * else in the engine changes.
 */
export const CURATED_TECHNICAL_METADATA: Record<
  string,
  {
    placementType?: TechnicalPlacementType;
    allowedSurfaces?: ('FLOOR' | 'WALL' | 'COUNTERTOP' | 'CEILING')[];
    recommendedClearance?: ClearanceSpec;
    plumbing?: PlumbingSpec;
    installationNotes?: string;
  }
> = {
  // Two-piece floor-standing toilet: stands on the floor, needs a waste outlet.
  'llv-toi-inax-ac602vn': {
    placementType: 'FLOOR',
    allowedSurfaces: ['FLOOR'],
    plumbing: { requiresColdWater: true, requiresToiletWaste: true, outlet: 'floor' },
    recommendedClearance: { front: 0.6 },
    installationNotes: 'Bồn cầu đặt sàn, cần điểm xả và điểm cấp nước lạnh.',
  },
  'llv-toi-toto-cs948dt8': {
    placementType: 'FLOOR',
    allowedSurfaces: ['FLOOR'],
    plumbing: { requiresColdWater: true, requiresToiletWaste: true, outlet: 'floor' },
    recommendedClearance: { front: 0.6 },
    installationNotes: 'Bồn cầu đặt sàn, cần điểm xả và điểm cấp nước lạnh.',
  },
  // Countertop basin: sits on a vanity top, drains below.
  'llv-lav-toto-lt1705-xw': {
    placementType: 'COUNTERTOP',
    allowedSurfaces: ['COUNTERTOP'],
    plumbing: { requiresColdWater: true, requiresDrain: true },
    installationNotes: 'Chậu đặt bàn, cần mặt bàn đỡ và điểm thoát nước phía dưới.',
  },
  // Wall-hung basin: mounts on a wall, drains through it.
  'llv-lav-toto-lt300c': {
    placementType: 'WALL',
    allowedSurfaces: ['WALL'],
    plumbing: { requiresColdWater: true, requiresDrain: true, outlet: 'wall' },
    installationNotes: 'Chậu treo tường, cần tường đủ chịu lực và điểm thoát trên tường.',
  },
  // Shower column: wall-mounted, needs hot and cold.
  'llv-sho-inax-bfv615s8c': {
    placementType: 'WALL',
    allowedSurfaces: ['WALL'],
    plumbing: { requiresColdWater: true, requiresHotWater: true, outlet: 'wall' },
    installationNotes: 'Sen cây gắn tường, cần cả nước nóng và nước lạnh.',
  },
  // LED mirror: wall-mounted and powered.
  'llv-mir-gls-q21c85': {
    placementType: 'WALL',
    allowedSurfaces: ['WALL'],
    plumbing: {},
    installationNotes: 'Gương LED treo tường, cần điểm điện gần vị trí lắp.',
  },
};

/** Ids covered by the curated demo set, for the UI's "demo data" disclosure. */
export const CURATED_METADATA_IDS = Object.keys(CURATED_TECHNICAL_METADATA);

const PLACEMENT_MAP: Record<PlacementType, TechnicalPlacementType> = {
  floor: 'FLOOR',
  wall: 'WALL',
  counter: 'COUNTERTOP',
  ceiling: 'CEILING',
};

/**
 * Assembles the technical view of one product, recording the provenance of
 * every field so the rules can be honest about what they actually know.
 */
export function getProductTechnicalMetadata(product: RoomStudioProduct): ProductTechnicalMetadata {
  const curated = CURATED_TECHNICAL_METADATA[product.id];

  // Dimensions come only from the catalogue. The category fallback sizes that
  // let the 3D scene place an un-modelled product are NOT used here: they exist
  // to make a scene look right, not to answer "will it fit".
  const hasAnyDims = product.width !== undefined || product.depth !== undefined || product.height !== undefined;

  const placementType = curated?.placementType ?? PLACEMENT_MAP[product.placementType] ?? 'UNKNOWN';

  return {
    width: product.width,
    depth: product.depth,
    height: product.height,
    dimensionsOrigin: hasAnyDims ? 'CATALOGUE' : 'MISSING',

    placementType,
    // Without a curated entry, placement is a guess from the category name —
    // Product.mountType is declared in lib/types.ts but set for no product.
    placementOrigin: curated?.placementType ? 'CURATED_DEMO' : 'INFERRED',

    allowedSurfaces: curated?.allowedSurfaces,

    recommendedClearance: curated?.recommendedClearance,
    clearanceOrigin: curated?.recommendedClearance ? 'CURATED_DEMO' : 'MISSING',

    plumbing: curated?.plumbing,
    plumbingOrigin: curated?.plumbing ? 'CURATED_DEMO' : 'MISSING',

    installationNotes: curated?.installationNotes,
  };
}

/** True when the product has enough declared data for a full technical check. */
export function isTechnicalDataComplete(metadata: ProductTechnicalMetadata): boolean {
  return (
    metadata.dimensionsOrigin === 'CATALOGUE' &&
    metadata.width !== undefined &&
    metadata.depth !== undefined &&
    metadata.height !== undefined &&
    metadata.placementOrigin !== 'INFERRED' &&
    metadata.plumbingOrigin !== 'MISSING'
  );
}
