import { wallFrame, isWallElement } from './architecture';
import { partitionGeometry } from './glassGeometry';
import { anchoredPosition } from './roomOperations';
import type { RoomState, PlacedProduct } from './roomState';
import type { RoomStudioProduct } from './productAdapter';
import type { Vec3 } from './placementRules';

export interface SnapView {
  placed: PlacedProduct;
  product: RoomStudioProduct;
}
export function snapPlacement(
  room: RoomState,
  views: SnapView[],
  active: SnapView,
  raw: Vec3,
  tolerance: number
) {
  const { placed, product } = active;
  const position = anchoredPosition(room, placed, product, raw);
  const labels = new Set<string>();
  const declared = product.source?.mountType;
  if (declared && declared !== placed.placementType) return { position, labels: [] };
  if (!product.width || !product.depth || tolerance <= 0) return { position, labels: [] };
  const extent = (view: SnapView, axis: 0 | 2) => {
    const c = Math.abs(Math.cos(view.placed.rotationY)),
      s = Math.abs(Math.sin(view.placed.rotationY));
    return (
      ((axis === 0 ? c : s) * (view.product.width ?? 0) + (axis === 0 ? s : c) * (view.product.depth ?? 0)) /
      2
    );
  };
  for (const axis of [0, 2] as const) {
    if (
      placed.placementType === 'wall' &&
      (axis === 2
        ? placed.wall === 'back' || !placed.wall
        : placed.wall === 'left' || placed.wall === 'right')
    )
      continue;
    const half = extent(active, axis),
      limit = (axis === 0 ? room.dimensions.length : room.dimensions.width) / 2;
    let best = tolerance,
      value = position[axis],
      label = '';
    function offer(target: number, name: string) {
      const distance = Math.abs(target - position[axis]);
      if (distance < best && Math.abs(target) + half <= limit + 1e-7) {
        best = distance;
        value = target;
        label = name;
      }
    }
    offer(-limit + half, 'Sát tường');
    offer(limit - half, axis === 2 ? 'Mép phòng' : 'Sát tường');
    for (const v of views) {
      if (v.placed.instanceId === placed.instanceId || !v.product.width || !v.product.depth) continue;
      const p = v.placed.position[axis],
        h = extent(v, axis);
      offer(p, 'Thẳng tâm');
      offer(p + h + half, 'Thẳng mép');
      offer(p - h - half, 'Thẳng mép');
    }
    const key = axis === 0 ? 'x' : 'z';
    for (const el of room.elements) {
      if (isWallElement(el)) {
        const f = wallFrame(room.dimensions, el.wall);
        for (const u of [el.offset, el.offset + el.width]) {
          const v = f.point(u)[key];
          offer(v + half, 'Mép ô mở');
          offer(v - half, 'Mép ô mở');
        }
      } else {
        const { span } = partitionGeometry(el);
        for (const p of [span.a, span.b]) {
          offer(p[key] - half, 'Mép vách kính');
          offer(p[key] + half, 'Mép vách kính');
        }
      }
    }
    position[axis] = value;
    if (label) labels.add(label);
  }
  const final = anchoredPosition(room, placed, product, position);
  if (placed.placementType === 'wall') labels.add('Trên tường');
  else if (placed.placementType === 'counter') labels.add('Trên bàn');
  return { position: final, labels: [...labels] };
}
