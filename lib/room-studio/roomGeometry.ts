/**
 * Deterministic room geometry for Room Studio.
 *
 * The room is ALWAYS derived from length x width x height in meters — never from
 * AI, never from a photo. One Three.js unit = one meter, everywhere.
 *
 * Axis convention used by every Room Studio module:
 *   x -> length (left/right),  y -> height (up),  z -> width (front/back)
 * The room is centred on the origin, so the floor spans
 *   x in [-length/2, +length/2],  z in [-width/2, +width/2],  y in [0, height].
 * The front wall (z = +width/2) is intentionally left open so the customer can
 * see inside.
 */

export interface RoomDimensions {
  /** metres, along x */
  length: number;
  /** metres, along z */
  width: number;
  /** metres, along y */
  height: number;
}

export type RoomDimensionKey = keyof RoomDimensions;

export interface DimensionLimit {
  min: number;
  max: number;
  default: number;
  /** Vietnamese label shown in the form. */
  label: string;
}

/**
 * Sensible residential-bathroom bounds. Deliberately generous at the top end so
 * a master bathroom still fits, but tight enough that a typo (18 instead of 1.8)
 * is caught rather than silently producing an unusable scene.
 */
export const DIMENSION_LIMITS: Record<RoomDimensionKey, DimensionLimit> = {
  length: { min: 1.0, max: 8.0, default: 3.0, label: 'Chiều dài' },
  width: { min: 1.0, max: 8.0, default: 2.0, label: 'Chiều rộng' },
  height: { min: 2.0, max: 4.0, default: 2.7, label: 'Chiều cao' },
};

export const DEFAULT_DIMENSIONS: RoomDimensions = {
  length: DIMENSION_LIMITS.length.default,
  width: DIMENSION_LIMITS.width.default,
  height: DIMENSION_LIMITS.height.default,
};

export type DimensionErrors = Partial<Record<RoomDimensionKey, string>>;

/**
 * Validates one field and returns a friendly Vietnamese message, or undefined
 * when the value is acceptable. Kept separate from clamping: the form shows the
 * message while the user is still typing, and only commits clamped values to
 * the 3D scene.
 */
export function validateDimension(key: RoomDimensionKey, value: number): string | undefined {
  const { min, max, label } = DIMENSION_LIMITS[key];
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `Vui lòng nhập ${label.toLowerCase()} của phòng.`;
  }
  if (value <= 0) {
    return `${label} phải lớn hơn 0 mét.`;
  }
  if (value < min) {
    return `${label} tối thiểu ${min}m để phòng còn dùng được.`;
  }
  if (value > max) {
    return `${label} tối đa ${max}m. Nếu phòng lớn hơn, hãy liên hệ showroom để được tư vấn riêng.`;
  }
  return undefined;
}

export function validateDimensions(dimensions: RoomDimensions): DimensionErrors {
  const errors: DimensionErrors = {};
  (Object.keys(DIMENSION_LIMITS) as RoomDimensionKey[]).forEach((key) => {
    const message = validateDimension(key, dimensions[key]);
    if (message) errors[key] = message;
  });
  return errors;
}

export function clampDimension(key: RoomDimensionKey, value: number): number {
  const { min, max, default: fallback } = DIMENSION_LIMITS[key];
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function clampDimensions(dimensions: Partial<RoomDimensions>): RoomDimensions {
  return {
    length: clampDimension('length', dimensions.length ?? DEFAULT_DIMENSIONS.length),
    width: clampDimension('width', dimensions.width ?? DEFAULT_DIMENSIONS.width),
    height: clampDimension('height', dimensions.height ?? DEFAULT_DIMENSIONS.height),
  };
}

export function getFloorArea(dimensions: RoomDimensions): number {
  return dimensions.length * dimensions.width;
}

export function getVolume(dimensions: RoomDimensions): number {
  return dimensions.length * dimensions.width * dimensions.height;
}

/** Half-extents of the room, the form every bounds check actually wants. */
export function getRoomBounds(dimensions: RoomDimensions) {
  return {
    minX: -dimensions.length / 2,
    maxX: dimensions.length / 2,
    minY: 0,
    maxY: dimensions.height,
    minZ: -dimensions.width / 2,
    maxZ: dimensions.width / 2,
  };
}

/**
 * Single source of truth for the "good angle" framing, shared by the Canvas's
 * initial camera and the reset-view button so they can never drift apart.
 * Scales with the room so a 1m closet and a 6m master bathroom both fill frame.
 */
export function getDefaultCameraFraming(dimensions: RoomDimensions) {
  const { length, width, height } = dimensions;
  const span = Math.max(length, width);
  return {
    // Slightly off-axis and just above eye level, pulled back far enough to see
    // all three walls but close enough that the room fills the frame.
    position: [length * 0.45, height * 0.85, width * 0.5 + span * 0.9] as [number, number, number],
    target: [0, height * 0.42, 0] as [number, number, number],
    /** Keeps the user from zooming inside a wall or flying to orbit. */
    minDistance: 0.8,
    maxDistance: span * 4 + 4,
  };
}
