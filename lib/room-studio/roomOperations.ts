/** Commands are JSON data. Resolve every SKU against the active storefront. */
import { isArchitecturalElement, type ArchitecturalElement } from './architecture';
import * as room from './roomState';
import type { PlacedProduct, RoomState } from './roomState';
import type { RoomStudioProduct } from './productAdapter';
import { isPlaceable } from './productCapability';
import { clampToRoom, type Vec3, type WallId } from './placementRules';
import { placementContextFor } from './mounting';
import { validateDimensions, type RoomDimensions } from './roomGeometry';
import { DEFAULT_ARCHITECTURE, LIGHTING_PRESETS, type ArchitectureSettings, type LightingPresetId } from './environment';
import type { SurfaceId, SurfaceStyle } from './materials';

import { STYLE_PACKS, isStyleId, type StylePackId } from './stylePacks';

export type ResolveProduct = (productId: string, variant?: string) => RoomStudioProduct | undefined;
export type RoomOperation =
  | { op: 'add'; productId: string; instanceId: string; atPoint?: Vec3; rotationY?: number; variant?: string }
  | { op: 'remove'; instanceId: string }
  | { op: 'move'; instanceId: string; position: Vec3; wall?: WallId }
  | { op: 'rotate'; instanceId: string; rotationY: number }
  | { op: 'replace'; instanceId: string; productId: string }
  | { op: 'surface'; surface: SurfaceId; patch: Partial<SurfaceStyle> }
  | { op: 'lighting'; preset: LightingPresetId }
  | { op: 'dimensions'; dimensions: RoomDimensions }
  | { op: 'element.add'; element: ArchitecturalElement }
  | { op: 'element.update'; element: ArchitecturalElement }
  | { op: 'element.remove'; elementId: string }
  | { op: 'architecture'; patch: Partial<ArchitectureSettings> }
  | { op: 'style'; id: StylePackId }
  | { op: 'reset' };

const fields: Record<RoomOperation['op'], string[]> = {
  add: ['productId', 'instanceId', 'atPoint', 'rotationY', 'variant'],
  remove: ['instanceId'], move: ['instanceId', 'position', 'wall'],
  rotate: ['instanceId', 'rotationY'], replace: ['instanceId', 'productId'],
  surface: ['surface', 'patch'], lighting: ['preset'], dimensions: ['dimensions'],
  'element.add': ['element'], 'element.update': ['element'], 'element.remove': ['elementId'],
  architecture: ['patch'], style: ['id'], reset: [],
};

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function id(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function vector(value: unknown): value is Vec3 {
  return Array.isArray(value) && value.length === 3 && Array.from(value).every(Number.isFinite);
}

export function anchoredPosition(state: RoomState, placed: PlacedProduct, product: RoomStudioProduct, point: Vec3) {
  return clampToRoom(point, { ...placementContextFor(product, state.dimensions, placed), placementType: placed.placementType });
}

export function rotatePlacement(state: RoomState, placed: PlacedProduct, product: RoomStudioProduct, rotationY: number) {
  const position = anchoredPosition(state, { ...placed, rotationY }, product, placed.position);
  return room.updatePlacement(state, placed.instanceId, { rotationY, position });
}

function applyOne(state: RoomState, command: RoomOperation, resolve: ResolveProduct): RoomState | string {
  const invalid = 'Dữ liệu thao tác không hợp lệ.';
  if (!object(command) || typeof command.op !== 'string' || !Object.hasOwn(fields, command.op)) return invalid;
  if (Object.keys(command).some(key => key !== 'op' && !fields[command.op].includes(key))) return invalid;

  switch (command.op) {
    case 'element.add':
    case 'element.update': {
      const el = command.element;
      if (!isArchitecturalElement(el)) return invalid;
      const existing = state.elements.find(e => e.id === el.id);
      if (command.op === 'element.add') return existing ? invalid : room.withElements(state, [...state.elements, { ...el }]);
      if (!existing || existing.type !== el.type) return invalid;
      return room.withElements(state, state.elements.map(e => e.id === el.id ? { ...el } : e));
    }
    case 'element.remove':
      if (!id(command.elementId) || !state.elements.some(e => e.id === command.elementId)) return invalid;
      return room.withElements(state, state.elements.filter(e => e.id !== command.elementId));
    case 'reset': return { ...room.createInitialRoomState(), ...(state.quoteDesignId ? { quoteDesignId: state.quoteDesignId } : {}) };
    case 'architecture': {
      const { patch } = command;
      if (!object(patch) || !Object.keys(patch).length ||
          !Object.entries(patch).every(([k, v]) => Object.hasOwn(DEFAULT_ARCHITECTURE, k) && typeof v === 'boolean')) return invalid;
      return room.setArchitecture(state, patch);
    }
    case 'dimensions': {
      const d = command.dimensions;
      if (!object(d) || Object.keys(d).length !== 3 || ![d.length, d.width, d.height].every(Number.isFinite) ||
          Object.keys(validateDimensions(d)).length) return invalid;
      return room.reflowPlacements(room.setDimensions(state, d), resolve);
    }
    case 'style': {
      if (!isStyleId(command.id)) return invalid;
      const pack = STYLE_PACKS[command.id];
      return {
        ...state,
        visualStyle: { id: command.id, overrides: [] },
        lighting: pack.lighting.id,
        surfaceStyles: { floor: { ...pack.floor.selection }, walls: { ...pack.walls.selection } },
      };
    }
    case 'lighting':
      if (typeof command.preset !== 'string' || !Object.hasOwn(LIGHTING_PRESETS, command.preset)) return invalid;
      return room.setLighting(state, command.preset);
    case 'surface': {
      const { patch, surface } = command;
      if (!['floor', 'walls'].includes(surface) || !object(patch) || !Object.keys(patch).length) return invalid;
      const result = room.setSurfaceStyle(state, surface, patch);
      const style = result.surfaceStyles[surface];
      if (Object.entries(patch).some(([k, v]) => !Object.hasOwn(style, k) || style[k as keyof SurfaceStyle] !== v)) return invalid;
      return result;
    }
  }

  if (!id(command.instanceId)) return invalid;
  const index = state.placedProducts.findIndex(p => p.instanceId === command.instanceId);
  if (command.op === 'add') {
    if (index >= 0 || !id(command.productId) || (command.atPoint !== undefined && !vector(command.atPoint)) ||
        (command.rotationY !== undefined && !Number.isFinite(command.rotationY))) return invalid;
    const product = resolve(command.productId, command.variant);
    if (!product || !isPlaceable(product.capability)) return 'Sản phẩm không thể đặt từ danh mục hiện tại.';
    if (command.variant !== undefined && !product.reconstruction?.variants.some(v => v.id === command.variant)) return invalid;
    let next = room.addProduct(state, product, command);
    if (next === state) return 'Sản phẩm không vừa phòng.';
    if (command.rotationY !== undefined && next.placedProducts.at(-1)?.rotationY !== command.rotationY) {
      return 'Không thể đặt sản phẩm theo hướng đã chọn.';
    }
    if (command.variant) next = room.updatePlacement(next, command.instanceId, { variant: command.variant });
    return next;
  }

  const placed = state.placedProducts[index];
  if (!placed) return 'Sản phẩm không còn trong phòng.';
  if (command.op === 'remove') return room.removeProduct(state, placed.instanceId);
  const product = resolve(placed.productId, placed.variant);
  if (!product) return 'Không tìm thấy sản phẩm trong danh mục hiện tại.';
  switch (command.op) {
    case 'move': {
      if (!vector(command.position)) return invalid;
      if (command.wall === undefined) return room.updatePlacement(state, placed.instanceId, { position: [...command.position] });
      if (placed.placementType !== 'wall' || !['back', 'left', 'right'].includes(command.wall)) return invalid;
      const rotationY = { back: 0, left: Math.PI / 2, right: -Math.PI / 2 }[command.wall];
      return room.updatePlacement(state, placed.instanceId, { position: [...command.position], wall: command.wall, rotationY });
    }
    case 'rotate': {
      if (!Number.isFinite(command.rotationY) || placed.placementType === 'wall') return invalid;
      return rotatePlacement(state, placed, product, command.rotationY);
    }
    case 'replace': {
      if (!id(command.productId)) return invalid;
      const replacement = resolve(command.productId);
      if (!replacement || !isPlaceable(replacement.capability) || replacement.placementType !== placed.placementType ||
          replacement.normalizedCategory !== product.normalizedCategory) return 'Sản phẩm thay thế không phù hợp với vị trí này.';
      const added = room.addProduct(state, replacement, { instanceId: placed.instanceId, rotationY: placed.rotationY });
      if (added === state) return 'Sản phẩm thay thế không vừa phòng.';
      const next = { ...added.placedProducts[added.placedProducts.length - 1], wall: placed.wall };
      if (next.placementType === 'wall') next.rotationY = placed.rotationY;
      next.position = anchoredPosition(state, next, replacement, placed.position);
      return { ...state, placedProducts: state.placedProducts.map((p, i) => i === index ? next : p) };
    }
  }
}

export type OperationResult =
  | { ok: true; state: RoomState }
  | { ok: false; index: number; message: string };

/** Failure never exposes the partially edited state. */
export function applyRoomOperations(base: RoomState, commands: readonly RoomOperation[], resolve: ResolveProduct): OperationResult {
  if (!Array.isArray(commands) || !commands.length) return { ok: false, index: -1, message: 'Chưa có thao tác.' };
  let state = base;
  for (const [index, command] of commands.entries()) {
    const result = applyOne(state, command, resolve);
    if (typeof result === 'string') return { ok: false, index, message: result };
    state = result;
  }
  return { ok: true, state };
}
