'use client';

import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { createSurfaceTexture, type SurfaceMaterial } from '@/lib/room-studio/materials';

/**
 * Builds a texture for one surface and disposes it when the material or the
 * surface size changes. Without the cleanup, dragging a dimension input would
 * leak one GPU texture per keystroke.
 *
 * The underlying canvas is cached per material inside materials.ts, so this only
 * ever re-uploads pixels — it never redraws the pattern.
 */
export function useSurfaceTexture(
  material: SurfaceMaterial,
  surfaceWidth: number,
  surfaceHeight: number
): THREE.CanvasTexture | null {
  const texture = useMemo(
    () => createSurfaceTexture(material, surfaceWidth, surfaceHeight),
    [material, surfaceWidth, surfaceHeight]
  );

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}
