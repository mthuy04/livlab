import { LIGHTING_PRESETS, parseLighting, type LightingPreset } from './environment';
import { openingFitsWall, wallFrame, type ArchitecturalElement } from './architecture';
import type { SurfaceId, SurfaceStyle } from './materials';
import type { RoomDimensions } from './roomGeometry';

export type StylePackId = 'warm-stone' | 'minimal-white' | 'modern-hotel';
type Channel = SurfaceId | 'lighting';
export interface VisualStyle {
  id: StylePackId;
  overrides: Channel[];
}
export interface StyledSurface {
  selection: SurfaceStyle;
  base: string;
  mineral: string;
  slab: [number, number]; // face dimensions in room metres
  joint: number;
  roughness: number;
}
interface StylePack {
  name: string;
  description: string;
  floor: StyledSurface;
  walls: StyledSurface;
  trim: string;
  cabinet: string;
  lighting: LightingPreset;
}
export const STYLE_PACKS: Record<StylePackId, StylePack> = {
  'warm-stone': {
    name: 'Đá ấm',
    description: 'Travertine vân ngang · đá mài mờ',
    walls: {
      selection: { material: 'stone-look', color: 'cream', finish: 'matte' },
      base: '#d6c3aa',
      mineral: '#9e876d',
      slab: [1.4, 0.68],
      joint: 0.0025,
      roughness: 0.65,
    },
    floor: {
      selection: { material: 'stone-look', color: 'beige', finish: 'matte' },
      base: '#bcab95',
      mineral: '#968773',
      slab: [0.9, 0.6],
      joint: 0.003,
      roughness: 0.59,
    },
    cabinet: '#ab896b',
    trim: '#a99881',
    lighting: {
      ...LIGHTING_PRESETS.daylight,
      sky: '#fff6e8',
      ground: '#c3af97',
      hemisphereIntensity: 0.79,
      key: { color: '#fff2df', intensity: 2.25, position: [-3.5, 4.8, 3.1] },
      fill: { color: '#ecf1f4', intensity: 0.47 },
      exposure: 0.98,
      environmentIntensity: 0.82,
    },
  },
  'minimal-white': {
    name: 'Trắng tối giản',
    description: 'Sứ satin · tường trắng ngà',
    walls: {
      selection: { material: 'paint', color: 'white', finish: 'matte' },
      base: '#e5e2db',
      mineral: '#c2c0b7',
      slab: [1, 1],
      joint: 0,
      roughness: 0.82,
    },
    floor: {
      selection: { material: 'porcelain', color: 'cream', finish: 'matte' },
      base: '#d4d0c6',
      mineral: '#adaea6',
      slab: [0.9, 0.9],
      joint: 0.0018,
      roughness: 0.32,
    },
    cabinet: '#d1cec4',
    trim: '#c6c8c6',
    lighting: {
      ...LIGHTING_PRESETS.studio,
      sky: '#f6f8ff',
      ground: '#d7d5cd',
      hemisphereIntensity: 0.94,
      key: { color: '#fffdfa', intensity: 1.65, position: [-2.2, 5, 4.2] },
      fill: { color: '#f1f5ff', intensity: 0.58 },
      exposure: 0.93,
      environmentIntensity: 1.04,
    },
  },
  'modern-hotel': {
    name: 'Khách sạn hiện đại',
    description: 'Đá xám vân chỉ · kim loại satin',
    walls: {
      selection: { material: 'marble', color: 'dark-grey', finish: 'matte' },
      base: '#545759',
      mineral: '#a5a4a0',
      slab: [1.15, 2.35],
      joint: 0.0024,
      roughness: 0.36,
    },
    floor: {
      selection: { material: 'stone-look', color: 'grey', finish: 'matte' },
      base: '#82796e',
      mineral: '#615b56',
      slab: [1.2, 0.8],
      joint: 0.0025,
      roughness: 0.53,
    },
    cabinet: '#74685f',
    trim: '#888277',
    lighting: {
      ...LIGHTING_PRESETS.warm,
      sky: '#f2eeea',
      ground: '#b6a492',
      hemisphereIntensity: 0.68,
      key: { color: '#fff1df', intensity: 1.8, position: [2.6, 4.5, 2.5] },
      fill: { color: '#dae2ed', intensity: 0.37 },
      downlights: { color: '#fff1df', intensity: 0.95 },
      exposure: 0.98,
      environmentIntensity: 0.95,
    },
  },
};
export const STYLE_IDS = Object.keys(STYLE_PACKS) as StylePackId[];
export const isStyleId = (id: unknown): id is StylePackId =>
  typeof id === 'string' && Object.hasOwn(STYLE_PACKS, id);
export function parseVisualStyle(input: unknown): VisualStyle | undefined {
  if (!input || typeof input !== 'object' || !('id' in input) || !isStyleId(input.id)) return;
  const overrides = 'overrides' in input && Array.isArray(input.overrides) ? input.overrides : [];
  return {
    id: input.id,
    overrides: (['floor', 'walls', 'lighting'] as const).filter((key) => overrides.includes(key)),
  };
}
export function overrideChannel(style: VisualStyle | undefined, channel: Channel) {
  return style && !style.overrides.includes(channel)
    ? { visualStyle: { ...style, overrides: [...style.overrides, channel] } }
    : {};
}
export function styledChannel(style: VisualStyle | undefined, channel: Channel) {
  return style && !style.overrides.includes(channel) ? style.id : undefined;
}
export function roomLighting(style: VisualStyle | undefined, manual: unknown) {
  const id = styledChannel(style, 'lighting');
  return id ? STYLE_PACKS[id].lighting : LIGHTING_PRESETS[parseLighting(manual)];
}

/** Largest usable opening is the daylight source. Stable ID breaks equal-area ties. */
export function keyLightPosition(
  room: RoomDimensions,
  elements: readonly ArchitecturalElement[],
  lighting: LightingPreset
) {
  const span = Math.max(1, room.length / 3, room.width / 3);
  const [x, y, z] = lighting.key.position;
  const window = elements
    .filter((e) => e.type === 'window')
    .filter((e) => openingFitsWall(room, e))
    .sort((a, b) => b.width * b.height - a.width * a.height || a.id.localeCompare(b.id))[0];
  if (!window) return [x * span, y, z * span] as const;
  const frame = wallFrame(room, window.wall);
  const point = frame.point(window.offset + window.width / 2, -1.5 * span);
  return [point.x, room.height + 0.8 + window.sill * 0.45, point.z] as const;
}
