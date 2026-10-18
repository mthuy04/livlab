'use client';

import { useState } from 'react';

export type QualityTier = 'high' | 'low';

export interface RenderQuality {
  tier: QualityTier;
  dpr: [number, number];
  shadowMapSize: number;
  environmentResolution: number;
  /** Canvas width of the procedural floor and wall maps. */
  textureResolution: number;
}

export const QUALITY: Record<QualityTier, RenderQuality> = {
  high: { tier: 'high', dpr: [1, 1.75], shadowMapSize: 2048, environmentResolution: 256, textureResolution: 1024 },
  low: { tier: 'low', dpr: [1, 1.25], shadowMapSize: 1024, environmentResolution: 128, textureResolution: 512 },
};

/**
 * A first guess at what this device can draw, before a frame has run.
 *
 * Phones and small-core laptops start on the lighter tier: half the shadow
 * and texture resolution, a lower pixel ratio, the same geometry and the same
 * materials. The scene still looks like the same room, it just costs less.
 * `RoomScene3D` then watches the real frame rate and steps down if needed —
 * the guess is a starting point, not the decision.
 */
function initialTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const small = window.innerWidth < 768;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  const fewCores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
  return (coarse && small) || lowMemory || fewCores ? 'low' : 'high';
}

/**
 * Read once, when the scene mounts. Every caller renders the scene client-only
 * (it is imported with `ssr: false`), so the device can be asked directly.
 */
export function useRenderQuality(): [RenderQuality, (tier: QualityTier) => void] {
  const [tier, setTier] = useState<QualityTier>(initialTier);
  return [QUALITY[tier], setTier];
}
