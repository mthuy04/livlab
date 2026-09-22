/**
 * Technical Advisor — the deterministic validation layer inside Room Studio.
 *
 * The contract that makes this feature trustworthy: NOTHING here calls an LLM.
 * Rules are pure functions over geometry and declared product data. LivLab
 * Expert may later *explain* a result, but it can never produce or overturn one.
 *
 * The other load-bearing idea is that UNKNOWN is a first-class outcome. When
 * LivLab has no data for a check, the rule says so plainly rather than assuming
 * a value — a fabricated clearance figure is worse than an honest "cần kiểm tra".
 */

import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { PlacedProduct } from '@/lib/room-studio/roomState';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import type { ProductTechnicalMetadata } from './productTechnicalMetadata';

/** User-facing severity. Three levels only — see the UI copy in the panel. */
export type TechnicalSeverity =
  /** ✅ Phù hợp — checked against real data and fine. */
  | 'SUITABLE'
  /** 💡 Có thể tối ưu — works, but something could be better. */
  | 'OPTIMIZE'
  /** ⚠️ Cần kiểm tra — either a real problem, or LivLab cannot tell. */
  | 'VERIFY';

export type TechnicalCategory =
  | 'ROOM_BOUNDS'
  | 'COLLISION'
  | 'CLEARANCE'
  | 'PLACEMENT_SURFACE'
  | 'PLUMBING'
  | 'DATA_COMPLETENESS';

/**
 * Where the finding came from. Lets LivLab Expert tell a measured fact from a
 * heuristic, and lets the UI explain why something is uncertain.
 */
export type TechnicalDataSource =
  /** Declared on the product record (catalogue or curated metadata). */
  | 'PRODUCT_METADATA'
  /** Derived from room dimensions and placement geometry. */
  | 'ROOM_GEOMETRY'
  /** From a utility point the customer declared. */
  | 'ROOM_UTILITY_POINT'
  /** A LivLab heuristic, not a manufacturer or code figure. */
  | 'LIVLAB_RULE'
  /** The check could not run because data is missing. */
  | 'UNKNOWN';

/**
 * How much weight the finding deserves. Deliberately three words, not a
 * percentage: a fabricated "87% confident" would be exactly the kind of false
 * precision this feature exists to avoid.
 */
export type TechnicalConfidence =
  /** Pure geometry over known dimensions. */
  | 'HIGH'
  /** Geometry over partly assumed dimensions, or a LivLab heuristic. */
  | 'MEDIUM'
  /** Incomplete data; the finding is a prompt to check, not a conclusion. */
  | 'LOW';

/** Why a rule could not reach a definite answer. */
export type TechnicalReason = 'MISSING_DATA' | 'INFERRED_DATA' | 'OUT_OF_SCOPE';

export interface TechnicalValidationResult {
  /** Unique per finding, stable across re-runs so React keys stay put. */
  id: string;
  ruleId: string;
  category: TechnicalCategory;
  severity: TechnicalSeverity;
  /** Short Vietnamese heading, consumer language. */
  title: string;
  /** One or two plain Vietnamese sentences. No jargon. */
  message: string;
  /** Instance ids this finding is about; empty for room-level findings. */
  affectedInstanceIds: string[];
  dataSource: TechnicalDataSource;
  confidence: TechnicalConfidence;
  /** True when a showroom or technician must confirm before installation. */
  requiresHumanVerification: boolean;
  /** Present when the rule could not conclude. */
  reason?: TechnicalReason;
  /** Optional next step, shown as a hint under the message. */
  suggestedAction?: string;
}

/** A water/drain/electrical point the customer has told LivLab about. */
export type UtilityPointType =
  | 'COLD_WATER'
  | 'HOT_WATER'
  | 'DRAIN'
  | 'TOILET_WASTE'
  | 'ELECTRICAL'
  | 'UNKNOWN';

export interface UtilityPoint {
  id: string;
  type: UtilityPointType;
  /** Metres, same room frame as placed products (centre origin, y up). */
  position: [number, number, number];
  /** Which wall it sits on, when it is a wall outlet rather than a floor one. */
  wall?: 'back' | 'left' | 'right';
  label?: string;
}

/** One product as the engine sees it: placement + catalogue + technical data. */
export interface TechnicalProductEntry {
  placed: PlacedProduct;
  product: RoomStudioProduct;
  metadata: ProductTechnicalMetadata;
}

export interface TechnicalContext {
  room: RoomDimensions;
  entries: TechnicalProductEntry[];
  /** Optional and manual. LivLab never infers these from a photo. */
  utilityPoints: UtilityPoint[];
  /** Restricts the run to one product, for the selected-product panel. */
  focusInstanceId?: string;
}

/**
 * A rule is a pure function. No React, no Three.js objects, no I/O — which is
 * what makes the whole engine testable from a plain script.
 */
export interface TechnicalRule {
  id: string;
  category: TechnicalCategory;
  run(context: TechnicalContext): TechnicalValidationResult[];
}

/** Counts for the room-level summary chip. */
export interface TechnicalSummary {
  suitable: number;
  optimize: number;
  verify: number;
  total: number;
}
