/**
 * The room around the products: light and architectural context.
 *
 * Plain data, stored with the room, so a saved design reopens in the light it
 * was planned in. Nothing here is a product: a niche, a glass screen or the
 * counter a basin rests on is context for judging the products, never a line
 * in the quote, and each one can be switched off.
 */

/* --------------------------------------------------------------- lighting */

export type LightingPresetId = 'daylight' | 'warm' | 'studio';

export interface LightingPreset {
  id: LightingPresetId;
  name: string;
  description: string;
  /** Sky and ground colours of the hemisphere fill. */
  sky: string;
  ground: string;
  hemisphereIntensity: number;
  /** The sun / key light through the open side of the room. */
  key: { color: string; intensity: number; position: [number, number, number] };
  /** A soft fill from the opposite side, so nothing reads as a void. */
  fill: { color: string; intensity: number };
  /** Ceiling downlights, drawn when the ceiling is shown. */
  downlights: { color: string; intensity: number };
  /** Strength of the reflected environment on every material. */
  environmentIntensity: number;
  /** Colour of the light panels inside the reflected environment. */
  environmentTint: string;
  exposure: number;
}

/**
 * Three looks, kept physically plausible rather than stylised: white stays
 * white under `studio`, and `warm` is a residential 3000K-ish cast, not amber.
 */
export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPreset> = {
  daylight: {
    id: 'daylight',
    name: 'Ánh sáng ban ngày',
    description: 'Trung tính, như phòng có cửa sổ',
    sky: '#F4F7FA',
    ground: '#D9D4CB',
    hemisphereIntensity: 0.75,
    key: { color: '#FFF8EE', intensity: 1.55, position: [3.2, 5.2, 4.4] },
    fill: { color: '#E8EEF4', intensity: 0.35 },
    downlights: { color: '#FFF4E3', intensity: 0.0 },
    environmentIntensity: 0.85,
    environmentTint: '#FFFFFF',
    exposure: 1.0,
  },
  warm: {
    id: 'warm',
    name: 'Ánh sáng ấm',
    description: 'Đèn trần ấm, không gian thư giãn',
    sky: '#FBEFE0',
    ground: '#CDBBA4',
    hemisphereIntensity: 0.55,
    key: { color: '#FFE2BD', intensity: 1.05, position: [2.6, 4.6, 3.6] },
    fill: { color: '#F5DCC0', intensity: 0.3 },
    downlights: { color: '#FFD9A8', intensity: 0.9 },
    environmentIntensity: 0.7,
    environmentTint: '#FFE6C7',
    exposure: 0.98,
  },
  studio: {
    id: 'studio',
    name: 'Ánh sáng studio',
    description: 'Đều và trung tính, để so bề mặt',
    sky: '#FFFFFF',
    ground: '#E3E3E3',
    hemisphereIntensity: 0.95,
    key: { color: '#FFFFFF', intensity: 1.15, position: [2.8, 6, 3.4] },
    fill: { color: '#FFFFFF', intensity: 0.55 },
    downlights: { color: '#FFFFFF', intensity: 0.0 },
    environmentIntensity: 1.0,
    environmentTint: '#FFFFFF',
    exposure: 1.02,
  },
};

export const DEFAULT_LIGHTING: LightingPresetId = 'daylight';

export function parseLighting(value: unknown): LightingPresetId {
  return typeof value === 'string' && value in LIGHTING_PRESETS ? (value as LightingPresetId) : DEFAULT_LIGHTING;
}

/* ----------------------------------------------------------- architecture */

export interface ArchitectureSettings {
  /** A slim skirting line where the walls meet the floor. */
  skirting: boolean;
  /** A lit niche recessed into the back wall. */
  niche: boolean;
  /** A framed glass screen marking a shower zone at the right of the back wall. */
  glassPartition: boolean;
  /** A window opening in the left wall, with daylight behind it. */
  window: boolean;
  /** Draw a stone counter under countertop basins that have nothing under them. */
  basinCounter: boolean;
  /**
   * Fade the walls between the camera and the room, so orbiting never puts a
   * wall in front of the products. Off draws every wall solid.
   */
  cutaway: boolean;
}

export const DEFAULT_ARCHITECTURE: ArchitectureSettings = {
  skirting: true,
  niche: false,
  glassPartition: false,
  window: false,
  basinCounter: true,
  cutaway: true,
};

export const ARCHITECTURE_LABEL: Record<keyof ArchitectureSettings, { name: string; note: string }> = {
  skirting: { name: 'Len chân tường', note: 'Đường chuyển tiếp giữa sàn và tường' },
  niche: { name: 'Hốc tường', note: 'Hốc âm tường có đèn, ở tường trong' },
  glassPartition: { name: 'Vách kính tắm', note: 'Vách kính khung mảnh, bên phải tường trong' },
  window: { name: 'Cửa sổ', note: 'Ô cửa lấy sáng ở tường trái' },
  basinCounter: { name: 'Bệ đặt chậu', note: 'Mặt đá minh hoạ dưới lavabo đặt bàn' },
  cutaway: { name: 'Tự làm mờ tường chắn', note: 'Tường quay về phía camera được làm mờ' },
};

export function parseArchitecture(value: unknown): ArchitectureSettings {
  const out = { ...DEFAULT_ARCHITECTURE };
  if (!value || typeof value !== 'object') return out;
  for (const key of Object.keys(out) as Array<keyof ArchitectureSettings>) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === 'boolean') out[key] = v;
  }
  return out;
}

/* --------------------------------------------------------- architecture geometry */

/**
 * The context counter drawn under a countertop basin: a 40 mm stone top over
 * a 420 mm floating cabinet, 100 mm wider than the basin each side. Shared by
 * the scene that draws it and the collision rule that must not let a toilet
 * slide under it — context is not a product, but it still takes up room.
 */
export const BASIN_COUNTER = { top: 0.04, cabinet: 0.42, sideMargin: 0.1, minWidth: 0.6, back: 0.02, front: 0.05 };

/** The counter's footprint and height in the basin's own frame, metres. */
export function basinCounterExtent(basin: { width: number; depth: number; height: number }) {
  const width = Math.max(BASIN_COUNTER.minWidth, basin.width + BASIN_COUNTER.sideMargin * 2);
  const back = -basin.depth / 2 - BASIN_COUNTER.back;
  const front = basin.depth / 2 + BASIN_COUNTER.front;
  const below = BASIN_COUNTER.top + BASIN_COUNTER.cabinet;
  return { width, back, front, depth: front - back, below };
}

/**
 * Where the context pieces sit, in room coordinates, metres. Derived from the
 * room so they move with it; nothing here is stored.
 */
export function nicheRect(room: { length: number; width: number; height: number }) {
  const width = 0.3;
  const glass = glassPartitionRect(room);
  return {
    width,
    height: 0.42,
    depth: 0.1,
    // Inside the shower zone, against its screen, so a shower column placed
    // at the zone's far end stays clear of it. Shelf height for bottles.
    centreX: Math.min(glass.x + 0.24, room.length / 2 - width / 2 - 0.05),
    centreY: Math.min(1.25, room.height - 0.5),
  };
}

export function windowRect(room: { length: number; width: number; height: number }) {
  const width = Math.min(1.0, room.width * 0.45);
  return {
    width,
    height: Math.min(1.1, room.height * 0.4),
    // Centre along the left wall (z), sill high enough for privacy.
    centreZ: -room.width * 0.05,
    sill: Math.min(1.25, room.height - 1.3),
  };
}

export function glassPartitionRect(room: { length: number; width: number; height: number }) {
  const depth = Math.min(0.9, room.width * 0.55);
  return {
    // Shower zone: the last 0.9m of the back wall, screened on its left side.
    x: room.length / 2 - Math.min(0.9, room.length * 0.32),
    depth,
    height: Math.min(2.0, room.height - 0.1),
  };
}
