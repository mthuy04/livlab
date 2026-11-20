import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  STYLE_IDS,
  STYLE_PACKS,
  isStyleId,
  styledChannel,
  roomLighting,
  keyLightPosition,
} from '../lib/room-studio/stylePacks';
import {
  createInitialRoomState,
  addProduct,
  deserializeRoomState,
  serializeRoomState,
  setLighting,
  setSurfaceStyle,
} from '../lib/room-studio/roomState';
import { createRoomHistory, undoRoom, redoRoom } from '../lib/room-studio/roomHistory';
import { applyRoomProposal, previewRoomProposal } from '../lib/room-studio/roomProposal';
import { applyRoomOperations } from '../lib/room-studio/roomOperations';
import { normalizeSurfaceStyle } from '../lib/room-studio/materials';
import { surfaceGeometry } from '../lib/room-studio/wallMesh';
import { LIGHTING_PRESETS } from '../lib/room-studio/environment';
import { defaultWindow, defaultPartition } from '../lib/room-studio/architecture';
import { livlab3dLibraryProducts } from '../lib/room-studio/productAdapter';
import { reconcileRoomQuote } from '../lib/room-studio/roomQuote';
import { roomStateRepositoryFor } from '../lib/room-studio/roomStateRepository';
import { buildEntries, runTechnicalAdvisor } from '../lib/technical-advisor/engine';

const catalog = livlab3dLibraryProducts([]);
const resolve = (id: string) => catalog.find((p) => p.id === id);
const empty = createInitialRoomState();
const placed = addProduct(empty, catalog[0], { instanceId: 'catalogue-fixture' });
const room = {
  ...placed,
  quoteDesignId: 'my-room',
  elements: [
    defaultWindow(empty.dimensions, 'w'),
    {
      id: 'd',
      type: 'entrance-door' as const,
      wall: 'back' as const,
      offset: 0.2,
      width: 0.8,
      height: 2,
      mechanism: 'hinged' as const,
      hinge: 'left' as const,
      swing: 'outward' as const,
      open: false,
    },
    defaultPartition(empty.dimensions, 'p'),
  ],
};
const history = createRoomHistory(room);
const propose = (id: (typeof STYLE_IDS)[number]) =>
  previewRoomProposal(history, { label: id, source: 'style', operations: [{ op: 'style', id }] }, resolve);

test('exactly three normalized packs with finite physically bounded surface and lighting parameters', () => {
  assert.deepEqual(STYLE_IDS, ['warm-stone', 'minimal-white', 'modern-hotel']);
  assert.equal(isStyleId('__proto__'), false);
  for (const pack of Object.values(STYLE_PACKS)) {
    for (const role of ['floor', 'walls'] as const) {
      const spec = pack[role];
      assert.deepEqual(normalizeSurfaceStyle(role, spec.selection), spec.selection);
      assert.ok(
        spec.slab.every((m) => m > 0) && spec.joint >= 0 && spec.roughness > 0 && spec.roughness <= 1
      );
      assert.match(spec.base, /^#[0-9a-f]{6}$/i);
    }
    assert.ok(
      pack.lighting.exposure > 0 && pack.lighting.key.intensity > 0 && pack.lighting.environmentIntensity > 0
    );
  }
});
test('every preview preserves all geometry, technical findings, quote provenance, budget and the committed snapshot', () => {
  const original = structuredClone(room);
  const basket = reconcileRoomQuote([], 'livlab', 'my-room', [catalog[0]], 'before');
  const findings = runTechnicalAdvisor({
    room: room.dimensions,
    elements: room.elements,
    architecture: room.architecture,
    utilityPoints: [],
    entries: buildEntries([{ placed: room.placedProducts[0], product: catalog[0] }]),
    counterSupport: true,
  });
  for (const id of STYLE_IDS) {
    const p = propose(id);
    assert.ok(p.eligible, p.errors.join(','));
    assert.deepEqual(p.findings, findings);
    assert.deepEqual(p.budget?.before, p.budget?.after);
    assert.equal(p.validation?.introduced.length, 0);
    for (const k of [
      'placedProducts',
      'dimensions',
      'elements',
      'architecture',
      'utilityPoints',
      'quoteDesignId',
    ] as const)
      assert.equal(p.preview![k], room[k]);
    assert.equal(
      reconcileRoomQuote(
        basket,
        'livlab',
        'my-room',
        p.preview!.placedProducts.map((v) => resolve(v.productId)!),
        'after'
      ),
      basket
    );
  }
  assert.deepEqual(room, original);
});
test('rapid replacements, discard, atomic apply, stale preview protection and exact history', () => {
  const previews = STYLE_IDS.map(propose),
    last = previews[2];
  const active = { ...history, proposal: last };
  assert.equal(applyRoomProposal(active, previews[0]), active);
  const discarded = { ...active, proposal: null };
  assert.equal(applyRoomProposal(discarded, last).current, room);
  const next = applyRoomProposal(active, last);
  assert.equal(next.past.length, 1);
  assert.equal(next.current.visualStyle?.id, 'modern-hotel');
  assert.equal(undoRoom(next).current, room);
  assert.equal(redoRoom(undoRoom(next)).current, next.current);
});
test('manual overrides win per channel, including reselecting the same light, and reapplying resets overrides', () => {
  const styled = propose('warm-stone').preview!;
  const custom = setLighting(
    setSurfaceStyle(styled, 'walls', { material: 'paint', color: 'sage', finish: 'matte' }),
    'daylight'
  );
  assert.deepEqual(roomLighting(custom.visualStyle, custom.lighting), LIGHTING_PRESETS.daylight);
  assert.equal(styledChannel(custom.visualStyle, 'floor'), 'warm-stone');
  assert.equal(styledChannel(custom.visualStyle, 'walls'), undefined);
  assert.equal(custom.surfaceStyles.walls.color, 'sage');
  const restored = applyRoomOperations(custom, [{ op: 'style', id: 'warm-stone' }], resolve);
  assert.ok(restored.ok);
  assert.deepEqual(restored.state, styled);
});
test('additive v3 persistence keeps manual overrides and safely parses legacy or unknown styles', () => {
  const legacy = deserializeRoomState({ ...empty, lighting: 'warm' });
  assert.equal(legacy.visualStyle, undefined);
  assert.equal(legacy.lighting, 'warm');
  const styled = setLighting(propose('modern-hotel').preview!, 'studio');
  const reload = deserializeRoomState(JSON.parse(JSON.stringify(serializeRoomState(styled))));
  assert.deepEqual(reload.visualStyle, styled.visualStyle);
  assert.deepEqual(reload.surfaceStyles, styled.surfaceStyles);
  assert.deepEqual(deserializeRoomState(serializeRoomState(reload)), reload);
  assert.equal(deserializeRoomState({ ...empty, visualStyle: { id: 'bad' } }).visualStyle, undefined);
});
test('tenant storage isolates style and appearance-only changes work for unavailable legacy SKUs', async () => {
  const db = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: { setItem: (k: string, v: string) => db.set(k, v), getItem: (k: string) => db.get(k) },
    },
  });
  try {
    const a = roomStateRepositoryFor('a'),
      b = roomStateRepositoryFor('b');
    await a.save(propose('warm-stone').preview!);
    await b.save(propose('modern-hotel').preview!);
    assert.equal((await a.load())?.visualStyle?.id, 'warm-stone');
    assert.equal((await b.load())?.visualStyle?.id, 'modern-hotel');
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
  const p = previewRoomProposal(
    history,
    { source: 'style', label: 'finish', operations: [{ op: 'style', id: 'minimal-white' }] },
    () => undefined
  );
  assert.ok(p.eligible);
  assert.equal(p.budget?.after.unpricedCount, 1);
});
test('window light follows the largest valid opening on every wall and falls back without windows', () => {
  const light = STYLE_PACKS['warm-stone'].lighting;
  const w = defaultWindow(room.dimensions, 'w');
  for (const wall of ['left', 'right', 'back', 'front'] as const) {
    const pos = keyLightPosition(room.dimensions, [{ ...w, wall }], light);
    assert.ok(
      wall === 'left'
        ? pos[0] < -room.dimensions.length / 2
        : wall === 'right'
        ? pos[0] > room.dimensions.length / 2
        : wall === 'back'
        ? pos[2] < -room.dimensions.width / 2
        : pos[2] > room.dimensions.width / 2
    );
  }
  assert.deepEqual(
    keyLightPosition(room.dimensions, [{ ...w, width: 100 }], light),
    keyLightPosition(room.dimensions, [], light)
  );
});

test('metric surface coordinates remain continuous across jambs and room sizes', () => {
  for (const [width, height] of [[2.6, 2.4], [4.8, 3.1]]) {
    const geometry = surfaceGeometry(width, height, [
      { x: 0.22, y: 0, width: 0.78, height: 2.05 },
      { x: 1.2, y: 0.95, width: 0.8, height: 0.85 },
    ]);
    const uv = geometry.getAttribute('uv');
    const position = geometry.getAttribute('position');
    assert.ok(position.count > 4);
    for (let i = 0; i < position.count; i++) {
      assert.ok(Math.abs(uv.getX(i) * width - (position.getX(i) + width / 2)) < 1e-6);
      assert.ok(Math.abs(uv.getY(i) * height - (position.getY(i) + height / 2)) < 1e-6);
    }
    geometry.dispose();
  }
});
