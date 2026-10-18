/**
 * Procedural PBR maps for the room's floor and walls.
 *
 * One drawn canvas set per resolved material — colour, roughness and bump —
 * reused for every surface and every room size. The canvas holds a whole
 * number of tiles (or slabs, or planks) edge to edge, and every noise field is
 * periodic over the canvas, so the texture repeats without a seam and the
 * repeat count is the only thing a room size changes.
 *
 * Scale is real: `realWorldWidth` is the size of ONE tile, so a 60 × 60
 * porcelain is drawn 60 × 60 whatever the room. (The first version drew four
 * tiles per repeat, which made every tile half its stated size.)
 *
 * Grout is 3 mm, kept at least two pixels so it does not shimmer, recessed in
 * the bump map and rougher than the glaze in the roughness map. Variation
 * between tiles is a couple of percent: enough that a floor stops reading as a
 * printed grid, not enough to look like a different product.
 */

import * as THREE from 'three';
import type { SurfaceMaterial } from './materials';

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  /** Real-world size of the whole canvas, metres — the repeat unit. */
  unitWidth: number;
  unitHeight: number;
}

interface CanvasSet {
  color: HTMLCanvasElement;
  roughness: HTMLCanvasElement;
  bump: HTMLCanvasElement;
  unitWidth: number;
  unitHeight: number;
}

/** The three textures every surface of one material shares. */
interface BaseTextures {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  unitWidth: number;
  unitHeight: number;
}

const GROUT_M = 0.003;

/**
 * Drawn sets kept, most recent last. A customer browsing finishes visits many
 * combinations; each kept set holds three canvases in memory, so only the
 * last few are kept and an evicted one is redrawn if it comes back.
 */
const MAX_CACHED = 8;
const cache = new Map<string, BaseTextures>();

/* ------------------------------------------------------------------ noise */

function hash(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Value noise periodic over `period` lattice cells, so it tiles. */
function periodicNoise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const wrap = (v: number) => ((v % period) + period) % period;
  const a = hash(wrap(xi), wrap(yi), seed);
  const b = hash(wrap(xi + 1), wrap(yi), seed);
  const c = hash(wrap(xi), wrap(yi + 1), seed);
  const d = hash(wrap(xi + 1), wrap(yi + 1), seed);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractal noise over the unit square [0,1)², periodic at the edges. */
function fbm(u: number, v: number, base: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = base;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * periodicNoise(u * freq, v * freq, freq, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* --------------------------------------------------------------- patterns */

interface Layout {
  /** Tiles across and down the canvas. */
  cols: number;
  rows: number;
  /** Grout drawn between cells. */
  grout: boolean;
  /** Offset alternate rows by half a cell (planks, running bond). */
  stagger: boolean;
}

function layoutFor(material: SurfaceMaterial): Layout {
  switch (material.pattern) {
    case 'tile':
      return { cols: 4, rows: 4, grout: true, stagger: false };
    case 'large-slab':
      return { cols: 2, rows: 2, grout: true, stagger: false };
    case 'wood-plank':
      return { cols: 2, rows: 6, grout: true, stagger: true };
    case 'terrazzo':
      return { cols: 2, rows: 2, grout: true, stagger: false };
    case 'concrete':
    case 'plain':
    default:
      return { cols: 1, rows: 1, grout: false, stagger: false };
  }
}

function drawSet(material: SurfaceMaterial, size: number): CanvasSet {
  const layout = layoutFor(material);
  const unitWidth = material.realWorldWidth * layout.cols;
  const unitHeight = material.realWorldHeight * layout.rows;
  const W = size;
  const H = Math.max(64, Math.round((size * unitHeight) / unitWidth / 4) * 4);
  const pxPerM = W / unitWidth;
  const grout = layout.grout ? Math.max(2, Math.round(GROUT_M * pxPerM)) : 0;

  const make = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };
  const color = make();
  const roughness = make();
  const bump = make();
  const cctx = color.getContext('2d');
  const rctx = roughness.getContext('2d');
  const bctx = bump.getContext('2d');
  if (!cctx || !rctx || !bctx) return { color, roughness, bump, unitWidth, unitHeight };

  const cImg = cctx.createImageData(W, H);
  const rImg = rctx.createImageData(W, H);
  const bImg = bctx.createImageData(W, H);
  const base = hexToRgb(material.baseColor);
  const accent = hexToRgb(material.accentColor);
  const groutColor = material.pattern === 'wood-plank'
    ? accent.map((c) => c * 0.82)
    : accent.map((c, i) => c * 0.6 + base[i] * 0.4);
  const baseRough = material.roughness;
  const cellW = W / layout.cols;
  const cellH = H / layout.rows;
  const seed = Array.from(material.id).reduce((a, ch) => a + ch.charCodeAt(0), 0);

  for (let y = 0; y < H; y++) {
    const row = Math.floor(y / cellH);
    const shift = layout.stagger && row % 2 === 1 ? cellW / 2 : 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const u = x / W;
      const v = y / H;
      const sx = (x + shift) % W;
      const col = Math.floor(sx / cellW);
      const lx = sx - col * cellW;
      const ly = y - row * cellH;
      const inGrout =
        grout > 0 && (lx < grout / 2 || lx >= cellW - grout / 2 || ly < grout / 2 || ly >= cellH - grout / 2);

      // Per-tile tone: one value per cell, so a tile reads as one piece.
      const tileTone = (hash(col, row, seed) - 0.5) * 0.05;
      let r = base[0];
      let g = base[1];
      let b = base[2];
      let rough = baseRough;

      switch (material.pattern) {
        case 'large-slab': {
          // Stone / marble veining from ridged noise: the mid-level contours of
          // a fractal field meander and branch the way real veins do, where a
          // sine band repeats and reads as printed waves. Marble (glossier)
          // gets crisper, stronger veins than a matte stone look.
          const marble = material.roughness < 0.3;
          const n1 = fbm(u, v, 2, 5, seed);
          const n2 = fbm(u, v, 5, 4, seed + 31);
          const ridge1 = 1 - Math.abs(n1 * 2 - 1);
          const ridge2 = 1 - Math.abs(n2 * 2 - 1);
          const vein = Math.pow(ridge1, marble ? 28 : 22) * (marble ? 0.75 : 0.22) + Math.pow(ridge2, 40) * (marble ? 0.25 : 0.12);
          const cloud = (fbm(u, v, 3, 4, seed + 5) - 0.5) * (marble ? 0.07 : 0.1);
          const t = Math.min(1, vein);
          r = r * (1 + cloud) * (1 - t) + accent[0] * t;
          g = g * (1 + cloud) * (1 - t) + accent[1] * t;
          b = b * (1 + cloud) * (1 - t) + accent[2] * t;
          rough = baseRough * (1 + cloud * 0.6);
          break;
        }
        case 'terrazzo': {
          const n = hash(Math.floor(x / 3), Math.floor(y / 3), seed + 9);
          if (n > 0.82) {
            const k = n > 0.93 ? accent : [255, 255, 255];
            const t = 0.55;
            r = r * (1 - t) + k[0] * t;
            g = g * (1 - t) + k[1] * t;
            b = b * (1 - t) + k[2] * t;
          }
          break;
        }
        case 'wood-plank': {
          const grain = Math.sin((v * layout.rows * 22 + fbm(u, v, 4, 3, seed) * 8) * Math.PI);
          const t = 0.08 + 0.06 * grain;
          r = r * (1 - t) + accent[0] * t;
          g = g * (1 - t) + accent[1] * t;
          b = b * (1 - t) + accent[2] * t;
          break;
        }
        case 'concrete': {
          const cloud = (fbm(u, v, 4, 5, seed) - 0.5) * 0.16;
          r *= 1 + cloud;
          g *= 1 + cloud;
          b *= 1 + cloud;
          rough = baseRough * (1 + cloud);
          break;
        }
        case 'tile':
        case 'plain':
        default: {
          // Glazed body: a faint mottle, nothing that reads as a pattern.
          const mottle = (fbm(u, v, 8, 3, seed) - 0.5) * 0.035;
          r *= 1 + mottle;
          g *= 1 + mottle;
          b *= 1 + mottle;
          break;
        }
      }

      if (inGrout) {
        r = groutColor[0];
        g = groutColor[1];
        b = groutColor[2];
        rough = 0.92;
      } else {
        r *= 1 + tileTone;
        g *= 1 + tileTone;
        b *= 1 + tileTone;
      }

      cImg.data[i] = Math.max(0, Math.min(255, r));
      cImg.data[i + 1] = Math.max(0, Math.min(255, g));
      cImg.data[i + 2] = Math.max(0, Math.min(255, b));
      cImg.data[i + 3] = 255;

      const rv = Math.max(0, Math.min(255, rough * 255));
      rImg.data[i] = rv;
      rImg.data[i + 1] = rv;
      rImg.data[i + 2] = rv;
      rImg.data[i + 3] = 255;

      // Grout recessed; a bevel of one pixel each side reads as a tile edge.
      const bv = inGrout ? 40 : 255;
      bImg.data[i] = bv;
      bImg.data[i + 1] = bv;
      bImg.data[i + 2] = bv;
      bImg.data[i + 3] = 255;
    }
  }
  cctx.putImageData(cImg, 0, 0);
  rctx.putImageData(rImg, 0, 0);
  bctx.putImageData(bImg, 0, 0);
  return { color, roughness, bump, unitWidth, unitHeight };
}

/**
 * Textures for one surface of `surfaceWidth` × `surfaceHeight` metres.
 *
 * `resolution` is the canvas width in pixels: 1024 on a desktop, 512 where the
 * renderer has asked for a lighter scene.
 */
function baseTextures(material: SurfaceMaterial, resolution: number): BaseTextures {
  const key = `${material.id}@${resolution}`;
  const hit = cache.get(key);
  if (hit) {
    // Re-insert: Map keeps insertion order, so the oldest entry is first.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const set = drawSet(material, resolution);
  const wrap = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const base: BaseTextures = {
    map: wrap(set.color, true),
    roughnessMap: wrap(set.roughness, false),
    bumpMap: wrap(set.bump, false),
    unitWidth: set.unitWidth,
    unitHeight: set.unitHeight,
  };
  cache.set(key, base);
  while (cache.size > MAX_CACHED) {
    const [oldKey, old] = cache.entries().next().value as [string, BaseTextures];
    cache.delete(oldKey);
    old.map.dispose();
    old.roughnessMap.dispose();
    old.bumpMap.dispose();
  }
  return base;
}

/**
 * Textures for one surface of `surfaceWidth` × `surfaceHeight` metres.
 *
 * Each returned texture is a clone of the material's shared base, and a clone
 * shares its image source: the renderer uploads each material's three
 * canvases to the GPU once, however many walls use it and however often the
 * room is resized. Only `repeat` — a uniform, not an upload — differs per
 * surface. Re-uploading twelve 1024px maps on every keystroke in the size
 * fields was enough to lose the WebGL context in a constrained browser.
 */
export function createSurfaceMaps(
  material: SurfaceMaterial,
  surfaceWidth: number,
  surfaceHeight: number,
  resolution = 1024
): SurfaceMaps | null {
  if (typeof document === 'undefined') return null;
  const base = baseTextures(material, resolution);
  const repeatX = Math.max(surfaceWidth / base.unitWidth, 0.05);
  const repeatY = Math.max(surfaceHeight / base.unitHeight, 0.05);
  const surface = (t: THREE.CanvasTexture) => {
    const c = t.clone();
    c.repeat.set(repeatX, repeatY);
    return c;
  };
  return {
    map: surface(base.map),
    roughnessMap: surface(base.roughnessMap),
    bumpMap: surface(base.bumpMap),
    unitWidth: base.unitWidth,
    unitHeight: base.unitHeight,
  };
}
