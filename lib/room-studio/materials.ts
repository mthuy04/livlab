/**
 * Surface -> Material system for Room Studio.
 *
 * Deliberately NOT modelled as a "tile selector": a surface (floor / walls) is
 * assigned a Material, and a Material can be a tile, a stone, a wood-look plank,
 * a paint or a panel. Adding a new finish family later means adding entries
 * here, not changing the scene.
 *
 * MVP materials are generated procedurally onto a canvas rather than shipping
 * texture files, so the feature carries no new binary assets. `textureUrl` is
 * already part of the model so real scanned textures can replace `pattern`
 * per-material without touching any component.
 */

import * as THREE from 'three';

export type SurfaceId = 'floor' | 'walls';

export type MaterialPattern = 'tile' | 'large-slab' | 'terrazzo' | 'wood-plank' | 'plain';

export interface SurfaceMaterial {
  id: string;
  name: string;
  /** Family shown as a filter chip; keeps the door open for paint/panel later. */
  family: 'Đá' | 'Gạch' | 'Terrazzo' | 'Vân gỗ' | 'Sơn';
  /** Dominant colour, also the swatch colour and the fallback when no texture. */
  baseColor: string;
  /** Grout / vein colour used by the procedural pattern. */
  accentColor: string;
  pattern: MaterialPattern;
  /** Real-world size of one repeat, in metres. Drives texture.repeat. */
  realWorldWidth: number;
  realWorldHeight: number;
  roughness: number;
  metalness: number;
  /** Reserved for real texture maps once LivLab has scanned finishes. */
  textureUrl?: string;
  normalMapUrl?: string;
  thumbnailUrl?: string;
  /** Surfaces this finish is offered for. Most work on both. */
  appliesTo?: SurfaceId[];
}

export const MATERIAL_LIBRARY: SurfaceMaterial[] = [
  {
    id: 'stone-white',
    name: 'Đá trắng',
    family: 'Đá',
    baseColor: '#F1EFE9',
    accentColor: '#D9D5CC',
    pattern: 'large-slab',
    realWorldWidth: 0.9,
    realWorldHeight: 0.9,
    roughness: 0.32,
    metalness: 0.02,
  },
  {
    id: 'tile-beige',
    name: 'Gạch be',
    family: 'Gạch',
    baseColor: '#DCCDB4',
    accentColor: '#C0AE93',
    pattern: 'tile',
    realWorldWidth: 0.3,
    realWorldHeight: 0.3,
    roughness: 0.4,
    metalness: 0.02,
  },
  {
    id: 'stone-grey',
    name: 'Đá xám',
    family: 'Đá',
    baseColor: '#9EA3A6',
    accentColor: '#83888B',
    pattern: 'large-slab',
    realWorldWidth: 1.2,
    realWorldHeight: 0.8,
    roughness: 0.35,
    metalness: 0.03,
  },
  {
    id: 'terrazzo-light',
    name: 'Terrazzo sáng',
    family: 'Terrazzo',
    baseColor: '#EDE8DF',
    accentColor: '#8C8478',
    pattern: 'terrazzo',
    realWorldWidth: 0.6,
    realWorldHeight: 0.6,
    roughness: 0.3,
    metalness: 0.02,
  },
  {
    id: 'wood-warm',
    name: 'Gạch vân gỗ',
    family: 'Vân gỗ',
    baseColor: '#B98A5E',
    accentColor: '#8C6441',
    pattern: 'wood-plank',
    realWorldWidth: 1.2,
    realWorldHeight: 0.2,
    roughness: 0.5,
    metalness: 0.0,
  },
  {
    id: 'tile-sage',
    name: 'Gạch xanh sage',
    family: 'Gạch',
    baseColor: '#A9B7A5',
    accentColor: '#8E9C8A',
    pattern: 'tile',
    realWorldWidth: 0.3,
    realWorldHeight: 0.3,
    roughness: 0.4,
    metalness: 0.02,
  },
  {
    id: 'tile-navy',
    name: 'Gạch navy',
    family: 'Gạch',
    baseColor: '#2F4356',
    accentColor: '#22313F',
    pattern: 'tile',
    realWorldWidth: 0.2,
    realWorldHeight: 0.2,
    roughness: 0.38,
    metalness: 0.04,
  },
  {
    id: 'paint-ivory',
    name: 'Sơn ngà',
    family: 'Sơn',
    baseColor: '#F2ECE0',
    accentColor: '#F2ECE0',
    pattern: 'plain',
    realWorldWidth: 1,
    realWorldHeight: 1,
    roughness: 0.85,
    metalness: 0.0,
    appliesTo: ['walls'],
  },
];

export const DEFAULT_FLOOR_MATERIAL_ID = 'tile-beige';
export const DEFAULT_WALL_MATERIAL_ID = 'stone-white';

export function getMaterialById(id: string | undefined): SurfaceMaterial {
  return (
    MATERIAL_LIBRARY.find((m) => m.id === id) ??
    MATERIAL_LIBRARY.find((m) => m.id === DEFAULT_FLOOR_MATERIAL_ID) ??
    MATERIAL_LIBRARY[0]
  );
}

export function getMaterialsForSurface(surface: SurfaceId): SurfaceMaterial[] {
  return MATERIAL_LIBRARY.filter((m) => !m.appliesTo || m.appliesTo.includes(surface));
}

/**
 * One drawn canvas per material, reused for every surface and every room size.
 * Changing a room dimension only changes `texture.repeat`, so geometry and
 * pixels are never redrawn for a resize — which is what keeps dragging the
 * dimension inputs smooth.
 */
const canvasCache = new Map<string, HTMLCanvasElement>();

/** Deterministic PRNG so terrazzo speckles don't reshuffle on every render. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function drawMaterialCanvas(material: SurfaceMaterial): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = material.baseColor;
  ctx.fillRect(0, 0, size, size);

  switch (material.pattern) {
    case 'tile': {
      // Four cells per repeat, so one repeat unit reads as a run of tiles.
      const cell = size / 2;
      ctx.strokeStyle = material.accentColor;
      ctx.lineWidth = 5;
      for (let i = 0; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size);
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size, i * cell);
        ctx.stroke();
      }
      break;
    }
    case 'large-slab': {
      // A single slab per repeat with soft veining.
      ctx.strokeStyle = material.accentColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, size, size);
      const rand = seededRandom(7);
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 2;
      for (let v = 0; v < 5; v++) {
        ctx.beginPath();
        let x = rand() * size;
        ctx.moveTo(x, 0);
        for (let y = 0; y <= size; y += 32) {
          x += (rand() - 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'terrazzo': {
      const rand = seededRandom(19);
      for (let i = 0; i < 260; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 1.5 + rand() * 4;
        ctx.globalAlpha = 0.35 + rand() * 0.4;
        ctx.fillStyle = rand() > 0.5 ? material.accentColor : '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (0.6 + rand() * 0.7), rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'wood-plank': {
      const rand = seededRandom(31);
      ctx.strokeStyle = material.accentColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 26; g++) {
        const y = rand() * size;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size * 0.3, y + (rand() - 0.5) * 12, size * 0.7, y + (rand() - 0.5) * 12, size, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Plank seam at the repeat boundary.
      ctx.strokeStyle = material.accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, size - 2);
      ctx.lineTo(size, size - 2);
      ctx.stroke();
      break;
    }
    case 'plain':
    default:
      break;
  }

  return canvas;
}

/**
 * Builds a texture for one surface. `surfaceWidth`/`surfaceHeight` are the real
 * metre dimensions of the plane, so the finish keeps its real-world size no
 * matter how big the room is — a 30cm tile stays 30cm.
 *
 * Callers own the returned texture and must dispose it (see useSurfaceTexture).
 * Returns null during SSR, where `document` does not exist.
 */
export function createSurfaceTexture(
  material: SurfaceMaterial,
  surfaceWidth: number,
  surfaceHeight: number
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  let canvas = canvasCache.get(material.id);
  if (!canvas) {
    canvas = drawMaterialCanvas(material);
    canvasCache.set(material.id, canvas);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    Math.max(surfaceWidth / material.realWorldWidth, 0.05),
    Math.max(surfaceHeight / material.realWorldHeight, 0.05)
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
