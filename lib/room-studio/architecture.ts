import { nicheRect, glassPartitionRect, windowRect, type ArchitectureSettings } from './environment';
import type { RoomDimensions } from './roomGeometry';

export const ENTRANCE_FRAME_DEPTH = 0.07;
export const WALLS = ['back', 'right', 'front', 'left'] as const;
export type RoomWall = typeof WALLS[number];
export const WALL_LABEL: Record<RoomWall, string> = { back: 'Tường sau', right: 'Tường phải', front: 'Tường trước', left: 'Tường trái' };

/** Offset is measured from the left end of the wall to the left jamb, facing the wall from inside. */
export interface EntranceDoor {
  id: string;
  type: 'entrance-door';
  wall: RoomWall;
  offset: number;
  width: number;
  height: number;
  mechanism: 'hinged';
  hinge: 'left' | 'right';
  swing: 'inward' | 'outward';
  open: boolean;
}
export type Glazing = 'clear' | 'frosted' | 'tinted';
export interface RoomWindow {
  id: string;
  type: 'window';
  wall: RoomWall;
  offset: number;
  width: number;
  height: number;
  sill: number;
  glazing: Glazing;
  frame: 'graphite' | 'ivory';
  /** The previous fixed window drew daylight immediately outside its glazing. */
  daylightBackdrop?: true;
  mechanism: 'fixed' | 'casement';
  open: boolean;
}
export interface ShowerPartition {
  id: string;
  type: 'shower-partition';
  /** Centre of the installation span, in room metres. Rotation is clockwise in plan, in degrees. */
  x: number;
  z: number;
  rotation: number;
  length: number;
  height: number;
  glazing: Glazing;
  mechanism: 'fixed' | 'walk-in' | 'hinged' | 'sliding';
  entrySide: 'left' | 'right';
  swing: 'forward' | 'reverse';
  open: boolean;
}
export type WallElement = EntranceDoor | RoomWindow;
export type ArchitecturalElement = WallElement | ShowerPartition;
export const ELEMENT_LABEL = { 'entrance-door': 'Cửa ra vào', window: 'Cửa sổ', 'shower-partition': 'Vách kính' };
export const isWallElement = (el: ArchitecturalElement): el is WallElement => el.type !== 'shower-partition';
export type PlanPoint = { x: number; z: number };

export function isArchitecturalElement(value: unknown): value is ArchitecturalElement {
  if (!value || typeof value !== 'object') return false;
  const d = value as Record<string, unknown>;
  if (typeof d.id !== 'string' || !d.id.trim() || typeof d.open !== 'boolean') return false;
  const only = (fields: string[]) => Object.keys(d).every(k => ['type', 'id', 'open', 'mechanism', ...fields].includes(k));
  const glass = ['clear', 'frosted', 'tinted'].some(value => value === d.glazing);
  if (d.type === 'shower-partition') {
    return glass && [d.x, d.z, d.rotation, d.length, d.height].every(Number.isFinite) &&
      ['fixed', 'walk-in', 'hinged', 'sliding'].some(m => m === d.mechanism) &&
      (!d.open || d.mechanism === 'hinged' || d.mechanism === 'sliding') &&
      (d.entrySide === 'left' || d.entrySide === 'right') && (d.swing === 'forward' || d.swing === 'reverse') &&
      only(['x', 'z', 'rotation', 'length', 'height', 'glazing', 'entrySide', 'swing']);
  }
  const wallFields = ['wall', 'offset', 'width', 'height'];
  if (!WALLS.includes(d.wall as RoomWall) || ![d.offset, d.width, d.height].every(Number.isFinite)) return false;
  if (d.type === 'window') return glass && Number.isFinite(d.sill) &&
    (d.mechanism === 'casement' || (d.mechanism === 'fixed' && !d.open)) && (d.frame === 'graphite' || d.frame === 'ivory') &&
    (d.daylightBackdrop === undefined || d.daylightBackdrop === true) && only([...wallFields, 'sill', 'frame', 'glazing', 'daylightBackdrop']);
  return d.type === 'entrance-door' && d.mechanism === 'hinged' &&
    (d.hinge === 'left' || d.hinge === 'right') && (d.swing === 'inward' || d.swing === 'outward') &&
    only([...wallFields, 'hinge', 'swing']);
}

/** Local X increases clockwise around the perimeter. Positive depth is indoors. */
export function wallFrame(room: RoomDimensions, wall: RoomWall) {
  const x = room.length / 2, z = room.width / 2;
  const frames = {
    back:  [-x, -z, 1, 0, room.length, 0],
    right: [x, -z, 0, 1, room.width, -Math.PI / 2],
    front: [x, z, -1, 0, room.length, Math.PI],
    left:  [-x, z, 0, -1, room.width, Math.PI / 2],
  };
  const [ox, oz, tx, tz, span, yaw] = frames[wall];
  return { span, yaw,
    point: (u: number, depth = 0): PlanPoint => ({ x: ox + u * tx - depth * tz, z: oz + u * tz + depth * tx }),
    local: (p: PlanPoint) => ({ u: (p.x - ox) * tx + (p.z - oz) * tz, depth: -(p.x - ox) * tz + (p.z - oz) * tx }),
  };
}

export function openingFitsWall(room: RoomDimensions, door: WallElement) {
  const eps = 1e-8;
  return door.width > 0 && door.height > 0 && (door.type === 'window' ? door.sill >= 0 && door.sill + door.height <= room.height + eps : door.height <= room.height + eps) &&
    door.offset >= -eps && door.offset + door.width <= wallFrame(room, door.wall).span + eps;
}

export function doorGeometry(room: RoomDimensions, door: EntranceDoor) {
  const frame = wallFrame(room, door.wall);
  const jamb = Math.min(0.035, Math.max(0, door.width / 8), Math.max(0, door.height / 8));
  const radius = Math.max(0, door.width - 2 * jamb);
  const hand = door.hinge === 'left' ? 1 : -1;
  const inward = door.swing === 'inward' ? 1 : -1;
  const pivot = door.offset + (hand === 1 ? jamb : door.width - jamb);
  return { ...hingedGeometry(frame, pivot, hand, inward, radius), frame, jamb, leafHeight: door.height - jamb };
}

export function hingedGeometry(frame: Pick<ReturnType<typeof wallFrame>, 'point' | 'local'>, pivot: number, hand: number, inward: number, radius: number) {
  const hinge = frame.point(pivot);
  const tip = (angle: number) => frame.point(pivot + hand * radius * Math.cos(angle), inward * radius * Math.sin(angle));
  return { frame, pivot, hand, inward, radius, hinge, tip,
    arc: Array.from({ length: 25 }, (_, i) => tip(Math.PI / 2 * i / 24)) };
}

export interface WallOpening { id: string; wall: RoomWall; x: number; y: number; width: number; height: number }
export function wallOpenings(room: RoomDimensions, settings: Pick<ArchitectureSettings, 'niche'>, elements: readonly ArchitecturalElement[]): WallOpening[] {
  const openings = elements.filter(isWallElement).map(d => ({ id: (d.type === 'window' ? 'window/' : 'door/') + d.id,
    wall: d.wall, x: d.offset, y: d.type === 'window' ? d.sill : 0, width: d.width, height: d.height }));
  if (settings.niche) {
    const n = nicheRect(room);
    openings.push({ id: 'niche', wall: 'back', x: room.length / 2 + n.centreX - n.width / 2, y: n.centreY - n.height / 2, width: n.width, height: n.height });
  }
  return openings;
}

/** Keep the original three-sided shell until a customer configures the front wall. */
export function renderedWalls(elements: readonly ArchitecturalElement[]) {
  return WALLS.filter(w => w !== 'front' || elements.some(d => isWallElement(d) && d.wall === 'front'));
}
export function wallCutaway(frame: ReturnType<typeof wallFrame>, camera: PlanPoint, enabled: boolean) {
  return enabled && frame.local(camera).depth < 0;
}


export function defaultWindow(room: RoomDimensions, id: string): RoomWindow {
  const w = windowRect(room);
  return { id, type: 'window', wall: 'left', offset: room.width / 2 - w.centreZ - w.width / 2,
    width: w.width, height: w.height, sill: w.sill, glazing: 'clear', frame: 'graphite', mechanism: 'fixed', open: false };
}
export function defaultPartition(room: RoomDimensions, id: string): ShowerPartition {
  const g = glassPartitionRect(room);
  return { id, type: 'shower-partition', x: g.x, z: (g.depth - room.width) / 2, rotation: 90,
    length: g.depth, height: g.height, glazing: 'clear', mechanism: 'fixed', entrySide: 'right', swing: 'forward', open: false };
}

/** Accept boolean commands from existing presets at their boundary. Elements own all geometry. */
export function elementsForFlags(room: RoomDimensions, elements: ArchitecturalElement[], patch: Partial<ArchitectureSettings>) {
  let next = elements;
  for (const [flag, type, create] of [
    ['window', 'window', defaultWindow], ['glassPartition', 'shower-partition', defaultPartition],
  ] as const) {
    if (patch[flag] === false) next = next.filter(e => e.type !== type);
    if (patch[flag] === true && !next.some(e => e.type === type)) {
      let id: string = type;
      for (let n = 2; next.some(e => e.id === id); n++) id = type + '-' + n;
      const element = create(room,id);
      next = [...next, element.type === 'window' ? { ...element, daylightBackdrop:true } : element];
    }
  }
  return next;
}
