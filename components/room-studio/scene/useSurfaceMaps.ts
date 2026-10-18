'use client';

import { useEffect, useMemo } from 'react';
import type { SurfaceMaterial } from '@/lib/room-studio/materials';
import { createSurfaceMaps, type SurfaceMaps } from '@/lib/room-studio/surfaceTextures';

/**
 * The colour, roughness and bump maps for one surface, disposed when the
 * material or the surface size changes. Without the cleanup, dragging a
 * dimension input would leak three GPU textures per keystroke.
 *
 * The canvases are cached per material inside surfaceTextures.ts, so a resize
 * only re-uploads pixels with a new repeat — it never redraws the pattern.
 */
export function useSurfaceMaps(
  material: SurfaceMaterial,
  surfaceWidth: number,
  surfaceHeight: number,
  resolution: number
): SurfaceMaps | null {
  const maps = useMemo(
    () => createSurfaceMaps(material, surfaceWidth, surfaceHeight, resolution),
    [material, surfaceWidth, surfaceHeight, resolution]
  );

  useEffect(() => {
    return () => {
      maps?.map.dispose();
      maps?.roughnessMap.dispose();
      maps?.bumpMap.dispose();
    };
  }, [maps]);

  return maps;
}
