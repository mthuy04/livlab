import { rotatedHalfExtents } from './placementRules';
import { createRoomHistory } from './roomHistory';
import { previewRoomProposal, type RoomProposal } from './roomProposal';
import { anchoredPosition, type RoomOperation } from './roomOperations';
import type { RoomState, PlacedProduct } from './roomState';
import type { RoomStudioProduct } from './productAdapter';
import type { TechnicalValidationResult } from '../technical-advisor/types';
import { getProductTechnicalMetadata } from '../technical-advisor/productTechnicalMetadata';
import { isPlaceable } from './productCapability';
import type { Vec3 } from './placementRules';

interface Candidate {
  ops: RoomOperation[];
  kind: string;
  distance: number;
  replacement: boolean;
  affected: number;
  priceChange: number;
  aesthetic: number;
}
const compare = (a: Candidate, b: Candidate) =>
  Number(a.replacement) - Number(b.replacement) ||
  a.affected - b.affected ||
  a.distance - b.distance ||
  a.priceChange - b.priceChange ||
  a.aesthetic - b.aesthetic ||
  JSON.stringify(a.ops).localeCompare(JSON.stringify(b.ops), 'en');
export function smartFix(
  state: RoomState,
  issue: TechnicalValidationResult,
  products: RoomStudioProduct[],
  resolve: (id: string, variant?: string) => RoomStudioProduct | undefined
): RoomProposal[] {
  if (!issue.placementIssue || !issue.affectedInstanceIds.length) return [];
  const h = createRoomHistory(state),
    candidates: Candidate[] = [],
    seen = new Set<string>();
  const related = new Set(issue.affectedInstanceIds);
  const push = (
    ops: RoomOperation[],
    kind: string,
    distance: number,
    replacement = false,
    aesthetic = 0,
    priceChange = 0
  ) => {
    const key = JSON.stringify(ops);
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push({
        ops,
        kind,
        distance,
        replacement,
        priceChange,
        affected: new Set(ops.flatMap((op) => ('instanceId' in op ? [op.instanceId] : []))).size,
        aesthetic,
      });
    }
  };
  const layouts = state.placedProducts.filter((p) => related.has(p.instanceId));
  // A clearance finding names the fixture whose usable space is obstructed.
  if (issue.placementIssue === 'CLEARANCE')
    layouts.push(...state.placedProducts.filter((p) => !related.has(p.instanceId)));
  for (const placed of layouts) {
    const id = placed.instanceId,
      p = resolve(placed.productId, placed.variant);
    if (!p?.width || !p.depth || !p.height) continue;
    const [x, y, z] = placed.position;
    function moves(
      target: PlacedProduct,
      product: RoomStudioProduct,
      kind: string,
      wall?: 'back' | 'left' | 'right'
    ) {
      for (const step of [
        0.05,
        0.1,
        0.2,
        0.35,
        0.5,
        0.75,
        1,
        1.5,
        2,
        Math.max(state.dimensions.length, state.dimensions.width),
      ])
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
          [0, 0],
        ]) {
          const point: Vec3 = [x + dx * step, y, z + dz * step];
          const position = anchoredPosition(state, target, product, point);
          const distance = Math.hypot(position[0] - x, position[2] - z, position[1] - y);
          if (distance < 1e-6 && !wall) continue;
          push([{ op: 'move', instanceId: id, position, ...(wall ? { wall } : {}) }], kind, distance);
        }
    }
    moves(placed, p, related.has(id) ? 'Di chuyển' : 'Dời vật cản');
    if (placed.placementType === 'wall') {
      const meta = getProductTechnicalMetadata(p);
      if (meta.placementType === 'WALL' && meta.placementOrigin !== 'INFERRED') {
        for (const wall of ['back', 'left', 'right'] as const)
          if (wall !== placed.wall) {
            const rotationY = { back: 0, left: Math.PI / 2, right: -Math.PI / 2 }[wall];
            moves({ ...placed, wall, rotationY }, p, 'Chuyển tường', wall);
          }
      }
    } else
      for (const turn of [Math.PI / 2, -Math.PI / 2, Math.PI]) {
        const rotationY = placed.rotationY + turn;
        push(
          [{ op: 'rotate', instanceId: id, rotationY }],
          'Xoay',
          (Math.abs(turn) * Math.min(p.width, p.depth)) / 2
        );
      }
    if (!related.has(id)) continue;
    const meta = getProductTechnicalMetadata(p);
    for (const alt of products) {
      if (
        alt.id === p.id ||
        !isPlaceable(alt.capability) ||
        alt.placementType !== p.placementType ||
        alt.normalizedCategory !== p.normalizedCategory ||
        !alt.width ||
        !alt.height ||
        !alt.depth
      )
        continue;
      const am = getProductTechnicalMetadata(alt);
      if (
        am.placementOrigin === 'INFERRED' ||
        meta.placementOrigin === 'INFERRED' ||
        am.placementType !== meta.placementType
      )
        continue;
      const op: RoomOperation = { op: 'replace', instanceId: id, productId: alt.id };
      const preferences = state.stylePreferences ?? [];
      const styleMatches = [alt.source.style, ...(alt.source.compatibleStyles ?? [])];
      const visualChanges = [
        p.source.finish && p.source.finish !== alt.source.finish,
        p.source.color && p.source.color !== alt.source.color,
        preferences.length && !preferences.some((style) => styleMatches.includes(style)),
      ].filter(Boolean).length;
      const cost = alt.priceMax ?? alt.priceMin;
      push(
        [op],
        'Thay sản phẩm',
        0,
        true,
        visualChanges,
        cost === undefined ? Infinity : Math.max(0, cost - (p.priceMax ?? p.priceMin ?? 0))
      );
    }
  }
  // Start at the actual footprint edges as well as sampling the room. A narrow
  // room may have enough space to separate two fixtures only if both move.
  if (issue.placementIssue === 'COLLISION' && layouts.length === 2) {
    const pair = layouts.flatMap((placed) => {
      const product = resolve(placed.productId, placed.variant);
      if (!product?.width || !product.depth || !product.height) return [];
      const extent = rotatedHalfExtents(
        { width: product.width, depth: product.depth },
        placed.rotationY
      );
      return [{ placed, product, extent }];
    });
    if (pair.length === 2)
      for (const axis of [0, 2] as const) {
        const half = axis === 0 ? 'halfX' : 'halfZ';
        const required = pair[0].extent[half] + pair[1].extent[half];
        for (const sign of [-1, 1]) {
          const displacement =
            required - sign * (pair[1].placed.position[axis] - pair[0].placed.position[axis]);
          if (displacement <= 0) continue;
          for (const share of [0, 0.25, 0.5, 0.75, 1]) {
            let distance = 0;
            const operations: RoomOperation[] = [];
            pair.forEach(({ placed, product }, index) => {
              const target: Vec3 = [...placed.position];
              target[axis] += sign * displacement * (index === 0 ? -share : 1 - share);
              const position = anchoredPosition(state, placed, product, target);
              const delta = Math.hypot(...position.map((v, i) => v - placed.position[i]));
              if (delta > 1e-6) {
                distance += delta;
                operations.push({ op: 'move', instanceId: placed.instanceId, position });
              }
            });
            if (operations.length)
              push(operations, operations.length === 2 ? 'Dời hai thiết bị' : 'Di chuyển', distance);
          }
        }
      }
  }
  candidates.sort(compare);
  if (layouts.length > 1) {
    const first = candidates.filter((c) => c.ops.length === 1 && c.ops[0].op === 'move');
    const options = layouts
      .slice(0, 3)
      .map((p) =>
        first.filter((c) => 'instanceId' in c.ops[0] && c.ops[0].instanceId === p.instanceId).slice(0, 12)
      );
    for (const [i, list] of options.entries())
      for (const other of options.slice(i + 1))
        for (const a of list)
          for (const b of other) push([...a.ops, ...b.ops], 'Dời hai thiết bị', a.distance + b.distance);
    candidates.sort(compare);
  }
  const choices: RoomProposal[] = [],
    kinds = new Set<string>(),
    alternatives: RoomProposal[] = [];
  let tier = '';
  function appendAlternatives() {
    choices.push(...alternatives.splice(0, 3 - choices.length));
  }
  for (const c of candidates) {
    const nextTier = Number(c.replacement) + '/' + c.affected;
    if (tier && nextTier !== tier) appendAlternatives();
    if (choices.length === 3) break;
    tier = nextTier;
    const move = c.ops.find((op) => op.op === 'move');
    const original = move && state.placedProducts.find((v) => v.instanceId === move.instanceId);
    const direction =
      move && original
        ? [
            Math.sign(move.position[0] - original.position[0]),
            Math.sign(move.position[2] - original.position[2]),
          ].join(',')
        : '';
    const key = c.kind + ':' + (move?.instanceId ?? '') + ':' + (move?.wall ?? direction);
    if (kinds.has(key) && alternatives.length >= 3) continue;
    const proposal = previewRoomProposal(
      h,
      {
        source: 'smart-fix',
        label: c.kind,
        operations: c.ops,
        intendedIssueId: issue.id,
        notes: [issue.message],
      },
      resolve
    );
    if (!proposal.eligible || !proposal.validation?.issueResolved) continue;
    if (
      c.replacement &&
      state.targetBudget &&
      (!proposal.budget?.difference ||
        proposal.budget.after.max > Math.max(state.targetBudget, proposal.budget.before.max))
    )
      continue;
    if (!kinds.has(key)) {
      choices.push(proposal);
      kinds.add(key);
    } else alternatives.push(proposal);
    if (choices.length === 3) break;
  }
  return [...choices, ...alternatives].slice(0, 3);
}
