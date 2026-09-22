/**
 * Surface -> Material system for Room Studio.
 *
 * A surface style is NOT a single label. Real bathroom selection separates
 * three independent decisions, and so does this model:
 *
 *   material (chất liệu)  — porcelain, marble, terrazzo, cement, wood-look, paint…
 *   color    (màu sắc)    — trắng, be, xám, navy, sage…
 *   finish   (hoàn thiện) — mờ, bóng, nhám
 *
 * Storing "Gạch be" as one string collapses all three and cannot scale: it
 * cannot answer "show me every porcelain in be", and it forces a new catalogue
 * entry for every material x colour x finish combination.
 *
 * `resolveSurfaceMaterial` composes the three catalogues back into a single
 * flat `SurfaceMaterial` render descriptor, which is the ONLY thing the 3D
 * layer ever sees. That keeps the scene, the texture cache and the procedural
 * drawing completely unaware of the refactor.
 *
 * MVP textures are generated procedurally onto a canvas rather than shipping
 * texture files, so the feature carries no new binary assets. `textureUrl` is
 * already part of the model so real scanned textures can replace `pattern`
 * per-material without touching any component.
 */

import * as THREE from 'three';

export type SurfaceId = 'floor' | 'walls';

export type MaterialPattern = 'tile' | 'large-slab' | 'terrazzo' | 'wood-plank' | 'concrete' | 'plain';

export type MaterialId =
  | 'ceramic'
  | 'porcelain'
  | 'stone-look'
  | 'marble'
  | 'terrazzo'
  | 'cement'
  | 'wood-look'
  | 'paint';

export type ColorId =
  | 'white'
  | 'cream'
  | 'beige'
  | 'light-grey'
  | 'grey'
  | 'dark-grey'
  | 'navy'
  | 'sage'
  | 'wood-brown'
  | 'black';

export type FinishId = 'matte' | 'gloss' | 'textured';

/** The structured selection stored in room state, one per surface. */
export interface SurfaceStyle {
  material: MaterialId;
  color: ColorId;
  finish: FinishId;
}

// ─── Catalogues ───────────────────────────────────────────────────────────────

export interface MaterialOption {
  id: MaterialId;
  name: string;
  /** One-line hint shown on hover; keeps the chips themselves short. */
  description: string;
  pattern: MaterialPattern;
  /** Real-world size of one repeat, in metres — a 30cm tile stays 30cm. */
  realWorldWidth: number;
  realWorldHeight: number;
  /** Before the finish modifier is applied. */
  baseRoughness: number;
  baseMetalness: number;
  /** Colours this material is actually sold in; first entry is its default. */
  colors: ColorId[];
  /** Finishes this material is actually sold in. */
  finishes: FinishId[];
  /**
   * Display order per surface. A surface missing from this map means the
   * material is simply not offered there — paint on a shower floor is not a
   * product LivLab should let a customer configure.
   */
  order: Partial<Record<SurfaceId, number>>;
  /** Reserved for real texture maps once LivLab has scanned finishes. */
  textureUrl?: string;
  normalMapUrl?: string;
}

export const MATERIALS: MaterialOption[] = [
  {
    id: 'porcelain',
    name: 'Porcelain',
    description: 'Gạch porcelain khổ lớn, hút nước thấp',
    pattern: 'tile',
    realWorldWidth: 0.6,
    realWorldHeight: 0.6,
    baseRoughness: 0.36,
    baseMetalness: 0.02,
    colors: ['beige', 'white', 'cream', 'light-grey', 'grey', 'dark-grey', 'black'],
    finishes: ['matte', 'gloss', 'textured'],
    order: { floor: 1, walls: 4 },
  },
  {
    id: 'stone-look',
    name: 'Vân đá',
    description: 'Bề mặt vân đá tự nhiên, khổ slab',
    pattern: 'large-slab',
    realWorldWidth: 1.2,
    realWorldHeight: 0.8,
    baseRoughness: 0.35,
    baseMetalness: 0.03,
    colors: ['white', 'cream', 'beige', 'light-grey', 'grey', 'dark-grey', 'black'],
    finishes: ['matte', 'textured', 'gloss'],
    order: { floor: 2, walls: 2 },
  },
  {
    id: 'terrazzo',
    name: 'Terrazzo',
    description: 'Đá mài cốt liệu, hạt phân bố đều',
    pattern: 'terrazzo',
    realWorldWidth: 0.6,
    realWorldHeight: 0.6,
    baseRoughness: 0.34,
    baseMetalness: 0.02,
    colors: ['cream', 'white', 'beige', 'light-grey', 'grey', 'sage'],
    finishes: ['matte', 'gloss', 'textured'],
    order: { floor: 3, walls: 6 },
  },
  {
    id: 'cement',
    name: 'Xi măng',
    description: 'Bề mặt xi măng / microcement liền mạch',
    pattern: 'concrete',
    realWorldWidth: 1,
    realWorldHeight: 1,
    baseRoughness: 0.62,
    baseMetalness: 0.0,
    colors: ['light-grey', 'grey', 'dark-grey', 'beige', 'white'],
    finishes: ['matte', 'textured'],
    order: { floor: 4, walls: 7 },
  },
  {
    id: 'wood-look',
    name: 'Gạch giả gỗ',
    description: 'Gạch vân gỗ dạng thanh, dùng được vùng ẩm',
    pattern: 'wood-plank',
    realWorldWidth: 1.2,
    realWorldHeight: 0.2,
    baseRoughness: 0.5,
    baseMetalness: 0.0,
    colors: ['wood-brown', 'beige', 'cream', 'grey', 'dark-grey'],
    finishes: ['matte', 'textured'],
    order: { floor: 5 },
  },
  {
    id: 'ceramic',
    name: 'Gạch men',
    description: 'Gạch men tiêu chuẩn, nhiều màu nhất',
    pattern: 'tile',
    realWorldWidth: 0.3,
    realWorldHeight: 0.3,
    baseRoughness: 0.4,
    baseMetalness: 0.02,
    colors: ['beige', 'white', 'cream', 'light-grey', 'grey', 'sage', 'navy', 'black'],
    finishes: ['matte', 'gloss', 'textured'],
    order: { floor: 6, walls: 3 },
  },
  {
    id: 'marble',
    name: 'Marble',
    description: 'Vân marble cao cấp, thường dùng cho tường',
    pattern: 'large-slab',
    realWorldWidth: 1.4,
    realWorldHeight: 1.0,
    baseRoughness: 0.26,
    baseMetalness: 0.04,
    colors: ['white', 'cream', 'light-grey', 'grey', 'dark-grey', 'navy', 'black'],
    finishes: ['gloss', 'matte'],
    order: { floor: 7, walls: 1 },
  },
  {
    id: 'paint',
    name: 'Sơn',
    description: 'Sơn chống ẩm — chỉ áp dụng cho tường',
    pattern: 'plain',
    realWorldWidth: 1,
    realWorldHeight: 1,
    baseRoughness: 0.85,
    baseMetalness: 0.0,
    colors: ['white', 'cream', 'beige', 'light-grey', 'grey', 'dark-grey', 'sage', 'navy'],
    finishes: ['matte', 'gloss'],
    order: { walls: 5 },
  },
];

export interface ColorOption {
  id: ColorId;
  name: string;
  hex: string;
  /** Darker tone — grout, veining and shadow on light colours. */
  shade: string;
  /** Lighter tone — used instead of `shade` on dark colours, where a darker
   *  vein would simply disappear. */
  tint: string;
  /** Dark colours flip to `tint` for their accent. */
  isDark?: boolean;
}

export const COLORS: ColorOption[] = [
  { id: 'white', name: 'Trắng', hex: '#F1EFE9', shade: '#D9D5CC', tint: '#FFFFFF' },
  { id: 'cream', name: 'Kem', hex: '#EDE4D3', shade: '#D2C4A9', tint: '#FBF5EA' },
  { id: 'beige', name: 'Be', hex: '#DCCDB4', shade: '#C0AE93', tint: '#F0E6D6' },
  { id: 'light-grey', name: 'Xám nhạt', hex: '#CFD4D7', shade: '#B0B7BB', tint: '#E9ECEE' },
  { id: 'grey', name: 'Xám', hex: '#9EA3A6', shade: '#83888B', tint: '#C3C8CB' },
  { id: 'dark-grey', name: 'Xám đậm', hex: '#5C6469', shade: '#454C50', tint: '#8A9298', isDark: true },
  { id: 'navy', name: 'Navy', hex: '#2F4356', shade: '#22313F', tint: '#5B7590', isDark: true },
  { id: 'sage', name: 'Sage', hex: '#A9B7A5', shade: '#8E9C8A', tint: '#CBD6C7' },
  { id: 'wood-brown', name: 'Nâu gỗ', hex: '#B98A5E', shade: '#8C6441', tint: '#D8AE87' },
  { id: 'black', name: 'Đen', hex: '#2B2D2F', shade: '#1A1C1D', tint: '#5A5E62', isDark: true },
];

export interface FinishOption {
  id: FinishId;
  name: string;
  /** Multipliers applied to the material's base PBR values. */
  roughnessScale: number;
  metalnessScale: number;
  /** Textured floors are the anti-slip option; the UI says so explicitly. */
  antiSlip?: boolean;
}

export const FINISHES: FinishOption[] = [
  { id: 'matte', name: 'Mờ', roughnessScale: 1.15, metalnessScale: 0.6 },
  { id: 'gloss', name: 'Bóng', roughnessScale: 0.42, metalnessScale: 1.8 },
  { id: 'textured', name: 'Nhám', roughnessScale: 1.4, metalnessScale: 0.3, antiSlip: true },
];

/**
 * Finish ordering is surface-specific because the safe/likely choice differs:
 * a floor wants mờ or nhám (chống trơn) first and bóng last, a wall is the
 * opposite.
 */
const FINISH_ORDER: Record<SurfaceId, FinishId[]> = {
  floor: ['matte', 'textured', 'gloss'],
  walls: ['matte', 'gloss', 'textured'],
};

// ─── Resolved render descriptor ───────────────────────────────────────────────

/**
 * The flattened material the 3D layer consumes. Produced only by
 * `resolveSurfaceMaterial` — nothing constructs one by hand.
 */
export interface SurfaceMaterial {
  /** Deterministic `${material}-${color}-${finish}`; also the texture cache key. */
  id: string;
  /** Display-only summary, e.g. "Porcelain · Be · Mờ". */
  name: string;
  style: SurfaceStyle;
  materialName: string;
  colorName: string;
  finishName: string;
  /** Dominant colour, also the swatch colour and the fallback when no texture. */
  baseColor: string;
  /** Grout / vein colour used by the procedural pattern. */
  accentColor: string;
  pattern: MaterialPattern;
  realWorldWidth: number;
  realWorldHeight: number;
  roughness: number;
  metalness: number;
  textureUrl?: string;
  normalMapUrl?: string;
}

export const DEFAULT_SURFACE_STYLES: Record<SurfaceId, SurfaceStyle> = {
  floor: { material: 'ceramic', color: 'beige', finish: 'matte' },
  walls: { material: 'stone-look', color: 'white', finish: 'matte' },
};

export function getMaterialOption(id: MaterialId | string | undefined): MaterialOption {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
}

export function getColorOption(id: ColorId | string | undefined): ColorOption {
  return COLORS.find((c) => c.id === id) ?? COLORS[0];
}

export function getFinishOption(id: FinishId | string | undefined): FinishOption {
  return FINISHES.find((f) => f.id === id) ?? FINISHES[0];
}

/** Materials offered for a surface, in that surface's priority order. */
export function getMaterialsForSurface(surface: SurfaceId): MaterialOption[] {
  return MATERIALS.filter((m) => m.order[surface] !== undefined).sort(
    (a, b) => (a.order[surface] as number) - (b.order[surface] as number)
  );
}

/** Colours offered for a material, in the catalogue's own priority order. */
export function getColorsForMaterial(materialId: MaterialId): ColorOption[] {
  return getMaterialOption(materialId).colors.map(getColorOption);
}

/** Finishes offered for a material, ranked for the surface being finished. */
export function getFinishesForMaterial(materialId: MaterialId, surface: SurfaceId): FinishOption[] {
  const offered = getMaterialOption(materialId).finishes;
  const rank = FINISH_ORDER[surface];
  return offered
    .slice()
    .sort((a, b) => rank.indexOf(a) - rank.indexOf(b))
    .map(getFinishOption);
}

/**
 * Snaps a (possibly stale or partial) selection onto something the catalogue
 * actually sells for this surface. This is what makes "switch material" safe:
 * picking Gạch giả gỗ while Navy is selected lands on Nâu gỗ instead of an
 * impossible combination.
 */
export function normalizeSurfaceStyle(surface: SurfaceId, style: Partial<SurfaceStyle>): SurfaceStyle {
  const fallback = DEFAULT_SURFACE_STYLES[surface];
  const available = getMaterialsForSurface(surface);

  const material =
    available.find((m) => m.id === style.material) ?? available.find((m) => m.id === fallback.material) ?? available[0];

  const color = material.colors.includes(style.color as ColorId) ? (style.color as ColorId) : material.colors[0];

  const ranked = getFinishesForMaterial(material.id, surface);
  const finish = ranked.some((f) => f.id === style.finish) ? (style.finish as FinishId) : ranked[0].id;

  return { material: material.id, color, finish };
}

/** Display-only summary label, e.g. "Marble · Trắng · Bóng". */
export function describeSurfaceStyle(style: SurfaceStyle): string {
  return [getMaterialOption(style.material).name, getColorOption(style.color).name, getFinishOption(style.finish).name]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Resolved materials are cached so repeated resolution returns the SAME object
 * identity. `useSurfaceTexture` memoises on the material reference, so a fresh
 * object on every render would rebuild a GPU texture every frame.
 */
const resolvedCache = new Map<string, SurfaceMaterial>();

export function resolveSurfaceMaterial(style: SurfaceStyle): SurfaceMaterial {
  const key = `${style.material}-${style.color}-${style.finish}`;
  const cached = resolvedCache.get(key);
  if (cached) return cached;

  const material = getMaterialOption(style.material);
  const color = getColorOption(style.color);
  const finish = getFinishOption(style.finish);

  const resolved: SurfaceMaterial = {
    id: key,
    name: describeSurfaceStyle(style),
    style,
    materialName: material.name,
    colorName: color.name,
    finishName: finish.name,
    baseColor: color.hex,
    // Paint and cement are single-tone by nature; giving them a contrasting
    // accent would draw grout lines onto a surface that has none.
    accentColor: material.pattern === 'plain' ? color.hex : color.isDark ? color.tint : color.shade,
    pattern: material.pattern,
    realWorldWidth: material.realWorldWidth,
    realWorldHeight: material.realWorldHeight,
    roughness: clamp01(material.baseRoughness * finish.roughnessScale),
    metalness: clamp01(material.baseMetalness * finish.metalnessScale),
    textureUrl: material.textureUrl,
    normalMapUrl: material.normalMapUrl,
  };

  resolvedCache.set(key, resolved);
  return resolved;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Pre-refactor snapshots stored one mixed id per surface. Mapping them here
 * means a saved room keeps rendering exactly as it did, and the customer's
 * choice is simply re-expressed in the structured model.
 */
export const LEGACY_MATERIAL_STYLES: Record<string, SurfaceStyle> = {
  'stone-white': { material: 'stone-look', color: 'white', finish: 'matte' },
  'tile-beige': { material: 'ceramic', color: 'beige', finish: 'matte' },
  'stone-grey': { material: 'stone-look', color: 'grey', finish: 'matte' },
  'terrazzo-light': { material: 'terrazzo', color: 'cream', finish: 'matte' },
  'wood-warm': { material: 'wood-look', color: 'wood-brown', finish: 'matte' },
  'tile-sage': { material: 'ceramic', color: 'sage', finish: 'matte' },
  'tile-navy': { material: 'ceramic', color: 'navy', finish: 'gloss' },
  'paint-ivory': { material: 'paint', color: 'cream', finish: 'matte' },
};

// ─── Procedural textures ──────────────────────────────────────────────────────

/**
 * One drawn canvas per resolved material, reused for every surface and every
 * room size. Changing a room dimension only changes `texture.repeat`, so
 * geometry and pixels are never redrawn for a resize — which is what keeps
 * dragging the dimension inputs smooth.
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
    case 'concrete': {
      // Seamless microcement: soft clouding, no seams and no grout lines.
      const rand = seededRandom(53);
      ctx.fillStyle = material.accentColor;
      for (let i = 0; i < 70; i++) {
        ctx.globalAlpha = 0.04 + rand() * 0.06;
        const r = 18 + rand() * 46;
        ctx.beginPath();
        ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
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
