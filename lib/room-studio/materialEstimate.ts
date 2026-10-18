import type { RoomDimensions } from './roomGeometry';

export interface MaterialEstimate {
  surfaceAreaM2: number;
  wastagePercent: number;
  estimatedMaterialM2: number;
  boxCount: number | null;
}

/** Preliminary geometry only; wall openings are not modelled in V1. */
export function estimateSurfaceMaterial(
  surface: 'floor' | 'walls',
  dimensions: RoomDimensions,
  wastagePercent: number,
  coveragePerBoxM2?: number | null
): MaterialEstimate {
  const area = surface === 'floor'
    ? dimensions.length * dimensions.width
    : 2 * (dimensions.length + dimensions.width) * dimensions.height;
  const safeWaste = Math.min(30, Math.max(0, wastagePercent));
  const estimated = area * (1 + safeWaste / 100);
  return {
    surfaceAreaM2: Number(area.toFixed(2)),
    wastagePercent: safeWaste,
    estimatedMaterialM2: Number(estimated.toFixed(2)),
    boxCount: coveragePerBoxM2 && coveragePerBoxM2 > 0 ? Math.ceil(estimated / coveragePerBoxM2) : null,
  };
}
