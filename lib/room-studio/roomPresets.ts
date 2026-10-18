/**
 * Starting points for a room: an empty one, or a styled one already lit,
 * finished and furnished.
 *
 * A preset is data, not a scene. It names finishes, a light, the context to
 * draw, and product SLOTS — each slot lists the exact brand + SKU it would
 * like, in order, and takes the first one the active catalogue carries. A slot
 * none of its candidates fill is simply left empty and reported: a preset
 * never adds a product the showroom does not sell, never substitutes a
 * lookalike, and never sizes anything to fit.
 */

import { normalizeSku } from '@/lib/storefront/catalogTypes';
import type { RoomDimensions } from './roomGeometry';
import type { SurfaceStyle } from './materials';
import type { ArchitectureSettings, LightingPresetId } from './environment';
import type { RoomStudioProduct } from './productAdapter';
import * as ops from './roomState';
import type { RoomState } from './roomState';
import { isPlaceable } from './productCapability';
import { placementContextFor } from './mounting';
import { clampToRoom, type Vec3 } from './placementRules';

export type StarterRoomId = 'empty' | 'warm-stone' | 'minimal-white' | 'modern-hotel';

export interface PresetSlot {
  /** What the slot is for, in the customer's words. */
  role: string;
  candidates: Array<{ brand: string; sku: string }>;
  /** Floor point (x, z), metres from the room's centre. Placement rules clamp it. */
  at: [number, number];
  rotationY?: number;
  variant?: string;
}

export interface StarterRoomPreset {
  id: StarterRoomId;
  name: string;
  description: string;
  /** Absent: keep the room the customer already sized. */
  dimensions?: RoomDimensions;
  surfaces?: { floor: SurfaceStyle; walls: SurfaceStyle };
  lighting?: LightingPresetId;
  architecture?: Partial<ArchitectureSettings>;
  slots: PresetSlot[];
}

const INAX = (sku: string) => ({ brand: 'INAX', sku });

export const STARTER_ROOMS: StarterRoomPreset[] = [
  {
    id: 'empty',
    name: 'Phòng trống',
    description: 'Giữ kích thước hiện tại, bỏ mọi sản phẩm, tự bố trí từ đầu.',
    lighting: 'daylight',
    architecture: { niche: false, glassPartition: false, window: false },
    slots: [],
  },
  {
    id: 'warm-stone',
    name: 'Đá ấm',
    description: 'Porcelain be ấm, ánh sáng ấm, vách kính tắm mảnh.',
    dimensions: { length: 3.0, width: 2.0, height: 2.7 },
    surfaces: {
      floor: { material: 'stone-look', color: 'beige', finish: 'matte' },
      walls: { material: 'porcelain', color: 'cream', finish: 'matte' },
    },
    lighting: 'warm',
    architecture: { skirting: true, niche: true, glassPartition: true, window: false, basinCounter: true },
    slots: [
      {
        role: 'Lavabo',
        // A Tùng Đăng catalogue has no L-293V; its TOTO countertop basin is
        // the showroom's own product and is drawn as its true-size volume.
        candidates: [INAX('L-293V'), { brand: 'TOTO', sku: 'LT4715MTG17#CMW' }],
        at: [-0.95, -0.8],
      },
      { role: 'Bồn cầu', candidates: [INAX('AC-1017VRN'), INAX('AC-912VN')], at: [0.05, -0.6] },
      { role: 'Sen tắm', candidates: [INAX('BFV-70S')], at: [1.2, -1] },
    ],
  },
  {
    id: 'minimal-white',
    name: 'Trắng tối giản',
    description: 'Gạch trắng, ánh sáng trung tính, ít chi tiết.',
    dimensions: { length: 3.0, width: 2.0, height: 2.7 },
    surfaces: {
      floor: { material: 'porcelain', color: 'white', finish: 'matte' },
      walls: { material: 'ceramic', color: 'white', finish: 'gloss' },
    },
    lighting: 'daylight',
    architecture: { skirting: true, niche: false, glassPartition: false, window: true, basinCounter: true },
    slots: [
      { role: 'Lavabo', candidates: [INAX('L-293V'), { brand: 'TOTO', sku: 'LT4715MTG17#CMW' }], at: [-0.85, -0.8] },
      { role: 'Bồn cầu', candidates: [INAX('AC-912VN'), INAX('AC-1017VRN')], at: [0.35, -0.6] },
    ],
  },
  {
    id: 'modern-hotel',
    name: 'Khách sạn hiện đại',
    description: 'Phòng 4 × 3 m, mảng tối tương phản, có bồn tắm và khu tắm kính.',
    dimensions: { length: 4.0, width: 3.0, height: 2.8 },
    surfaces: {
      floor: { material: 'stone-look', color: 'light-grey', finish: 'matte' },
      walls: { material: 'porcelain', color: 'dark-grey', finish: 'matte' },
    },
    lighting: 'warm',
    architecture: { skirting: true, niche: true, glassPartition: true, window: false, basinCounter: true },
    slots: [
      {
        role: 'Bồn tắm',
        candidates: [INAX('BF-1656V'), { brand: 'TOTO', sku: 'PPY1560HPE#P/TVBF411' }],
        at: [-0.9, -1.1],
      },
      { role: 'Bồn cầu', candidates: [INAX('AC-1017VRN'), INAX('AC-912VN')], at: [0.5, -1.1] },
      // On the left wall, facing into the room: the back wall is the bath's.
      {
        role: 'Lavabo',
        candidates: [INAX('L-293V'), { brand: 'TOTO', sku: 'LT4715MTG17#CMW' }],
        at: [-1.8, 0.7],
        rotationY: Math.PI / 2,
      },
      { role: 'Sen tắm', candidates: [INAX('BFV-70S')], at: [1.7, -1.5] },
    ],
  },
];

export function getStarterRoom(id: string): StarterRoomPreset | undefined {
  return STARTER_ROOMS.find((p) => p.id === id);
}

/** The catalogue product a slot resolves to, by exact brand + SKU, or null. */
export function resolveSlot(slot: PresetSlot, products: RoomStudioProduct[]): RoomStudioProduct | null {
  for (const candidate of slot.candidates) {
    const sku = normalizeSku(candidate.sku);
    const match = products.find(
      (p) =>
        (p.brand ?? '').toUpperCase() === candidate.brand.toUpperCase() &&
        normalizeSku(p.sku) === sku &&
        isPlaceable(p.capability)
    );
    if (match) return match;
  }
  return null;
}

export interface StarterRoomResult {
  state: RoomState;
  placed: Array<{ role: string; product: RoomStudioProduct; instanceId: string }>;
  /** Slots nothing in the active catalogue could fill. */
  skipped: string[];
}

/**
 * Builds the room a preset describes, from `base`.
 *
 * Measurements of the room, the customer's budget, style tags, declared
 * plumbing points and reference photo are kept — a preset changes the look
 * and the products, not what the customer told us about their own room.
 */
export function buildStarterRoom(
  base: RoomState,
  preset: StarterRoomPreset,
  products: RoomStudioProduct[],
  makeId: (productId: string) => string = ops.createInstanceId
): StarterRoomResult {
  let next = ops.clearProducts(base);
  if (preset.dimensions) next = ops.setDimensions(next, preset.dimensions);
  if (preset.surfaces) {
    next = ops.setSurfaceStyle(next, 'floor', preset.surfaces.floor);
    next = ops.setSurfaceStyle(next, 'walls', preset.surfaces.walls);
  }
  if (preset.lighting) next = ops.setLighting(next, preset.lighting);
  if (preset.architecture) next = ops.setArchitecture(next, preset.architecture);

  const placed: StarterRoomResult['placed'] = [];
  const skipped: string[] = [];
  for (const slot of preset.slots) {
    const product = resolveSlot(slot, products);
    if (!product) {
      skipped.push(slot.role);
      continue;
    }
    const instanceId = makeId(product.id);
    const before = next.placedProducts.length;
    // Placed first by the product's own rules — floor products keep their
    // wall gap, a shower its mixer height, a basin its counter — then slid to
    // the slot. A slot pressed against the back wall keeps the rule's gap
    // rather than overriding it with a point drawn on a plan.
    next = ops.addProduct(next, product, { instanceId, rotationY: slot.rotationY });
    if (next.placedProducts.length === before) {
      skipped.push(slot.role);
      continue;
    }
    const placedNow = next.placedProducts[next.placedProducts.length - 1];
    const ctx = { ...placementContextFor(product, next.dimensions, placedNow), placementType: placedNow.placementType };
    const z = slot.at[1] < placedNow.position[2] + 0.05 ? placedNow.position[2] : slot.at[1];
    const target: Vec3 = [slot.at[0], placedNow.position[1], z];
    next = ops.updatePlacement(next, instanceId, { position: clampToRoom(target, ctx) });
    if (slot.variant) next = ops.updatePlacement(next, instanceId, { variant: slot.variant });
    placed.push({ role: slot.role, product, instanceId });
  }
  return { state: next, placed, skipped };
}
