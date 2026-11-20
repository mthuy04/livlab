import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Vector3, PerspectiveCamera } from 'three';
import { WalkInput } from '../lib/room-studio/walkInput';
import { buildWalkWorld, hit, walkDelta, walkMove, walkSpawn } from '../lib/room-studio/walkthrough';
import {
  affectedIds,
  focusShot,
  glideShot,
  overviewShot,
  planZoom,
  subjectBounds,
} from '../lib/room-studio/cameraDirector';
import {
  wallFrame,
  defaultWindow,
  type EntranceDoor,
  type ShowerPartition,
} from '../lib/room-studio/architecture';
import { DEFAULT_CAMERA_FOV } from '../lib/room-studio/roomGeometry';
import { buildEntries } from '../lib/technical-advisor/engine';
import { livlab3dLibraryProducts } from '../lib/room-studio/productAdapter';
import type { PlacedProduct } from '../lib/room-studio/roomState';

const room = { length: 4, width: 3, height: 2.7 };
const empty = buildWalkWorld(room, [], [], false);
const door: EntranceDoor = {
  id: 'entry',
  type: 'entrance-door',
  wall: 'front',
  height: 2.1,
  width: 1,
  offset: 1.5,
  hinge: 'left',
  swing: 'inward',
  open: true,
  mechanism: 'hinged',
};
const screen: ShowerPartition = {
  id: 'glass',
  type: 'shower-partition',
  x: 0,
  z: 0,
  length: 2,
  height: 2,
  rotation: 0,
  glazing: 'clear',
  entrySide: 'left',
  mechanism: 'sliding',
  swing: 'forward',
  open: false,
};
const product = livlab3dLibraryProducts([]).find((p) => p.placementType === 'counter')!;
const placement: PlacedProduct = {
  productId: product.id,
  instanceId: 'fixture',
  position: [-0.9, 0.84, -0.7],
  rotationY: Math.PI / 3,
  placementType: 'counter',
};
const entries = buildEntries([{ product, placed: placement }]);
test('overview contains all room corners and an orthographic plan fits a portrait or landscape canvas', () => {
  for (const r of [room, { length: 8, width: 2, height: 4 }, { length: 1, width: 1, height: 2 }])
    for (const [w, h] of [
      [390, 844],
      [1440, 900],
      [768, 1024],
    ]) {
      const s = overviewShot(r, w / h),
        cam = new PerspectiveCamera(DEFAULT_CAMERA_FOV, w / h, 0.05, 80);
      cam.position.copy(s.eye);
      cam.lookAt(s.target);
      cam.updateMatrixWorld();
      for (const x of [-1, 1])
        for (const z of [-1, 1])
          for (const y of [0, r.height]) {
            const p = new Vector3((x * r.length) / 2, y, (z * r.width) / 2).project(cam);
            assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1);
          }
      const zoom = planZoom(r, w, h);
      assert.ok(zoom * r.width < h && zoom * r.length < w);
    }
});
test('product and proposal focus include rotated counter and both old/new coordinates', () => {
  const before = buildWalkWorld(room, [door], entries, true);
  const after = buildWalkWorld(
    room,
    [{ ...door, wall: 'back' }],
    buildEntries([{ product, placed: { ...placement, position: [0.7, 0.84, 0] } }]),
    true
  );
  const ids = affectedIds([
    { op: 'move', instanceId: 'fixture', position: [0.7, 0.84, 0] },
    { op: 'element.update', element: door },
  ]);
  const bounds = subjectBounds(ids, before, after)!;
  assert.ok(bounds.min.z <= -1.49 && bounds.max.z >= 1.49);
  const productBox = subjectBounds(new Set(['fixture']), after)!;
  const focus = focusShot(productBox, after, 0.65, new Vector3(0, 0, 1));
  assert.ok(
    focus.target.distanceTo(productBox.min) < 1 &&
      !hit(after, focus.eye, 0.1, focus.eye.y - 0.1, focus.eye.y + 0.1)
  );
  assert.equal(subjectBounds(new Set(['missing']), after), undefined);
});
test('interpolated shots use the short azimuth arc; interruption starts from the actual intermediate pose', () => {
  const target = new Vector3();
  const a = { eye: new Vector3(-0.01, 1, -2), target },
    b = { eye: new Vector3(0.01, 1, -2), target };
  const mid = glideShot(a, b, 0.5);
  assert.ok(mid.eye.z < -1.99);
  assert.ok(glideShot(mid, overviewShot(room, 1), 0).eye.distanceTo(mid.eye) < 1e-8);
  assert.ok(glideShot(a, b, 1).eye.distanceTo(b.eye) < 1e-8);
});
test('entrance spawn uses all four wall frames and faces inward', () => {
  for (const wall of ['back', 'right', 'front', 'left'] as const) {
    const d = { ...door, wall, offset: 0.8 },
      w = buildWalkWorld(room, [d], [], false),
      p = walkSpawn(w)!;
    assert.equal(p.entrance, d.id);
    assert.equal(hit(w, p), null);
    const frame = wallFrame(room, wall),
      v = walkDelta(p.yaw, 0, 1, 0.1);
    assert.ok(frame.local({ x: p.x + v.x, z: p.z + v.z }).depth > frame.local(p).depth);
  }
});
test('legacy fallback searches for an unoccupied point and fails closed when there is no space or no dimensions', () => {
  const p = walkSpawn(empty)!;
  assert.equal(p.entrance, null);
  const w = buildWalkWorld(
    room,
    [],
    buildEntries([{ product, placed: { ...placement, position: [p.x, 0.8, p.z] } }]),
    true
  );
  assert.ok(hit(w, p));
  assert.ok(!hit(w, walkSpawn(w)!));
  assert.equal(walkSpawn({ ...w, unknown: ['missing'] }), null);
  const crowded = buildWalkWorld(
    { length: 1, width: 1, height: 2 },
    [
      { ...screen, length: 1, z: 0 },
      { ...screen, id: 'a', length: 1, z: 0.32 },
      { ...screen, id: 'b', length: 1, z: -0.32 },
    ],
    [],
    false
  );
  assert.equal(walkSpawn(crowded), null);
});
test('normalized motion is horizontal, heading relative and independent of frame partition', () => {
  assert.ok(Math.abs(walkDelta(Math.PI / 2, 0, 1, 1).x + 1) < 1e-8);
  const v = walkDelta(0.5, 1, 1, 0.5);
  assert.ok(Math.abs(Math.hypot(v.x, v.z) - 0.5) < 1e-8);
  let p = { x: 0, z: 0 };
  for (let i = 0; i < 30; i++) p = walkMove(empty, p, v.x / 30, v.z / 30);
  assert.ok(Math.abs(p.x - v.x) < 1e-8);
});
test('all walls, including the cutaway front, stop a high speed step and allow tangential sliding', () => {
  for (const [dx, dz] of [
    [30, 0],
    [-30, 0],
    [0, 30],
    [0, -30],
  ]) {
    const p = walkMove(empty, { x: 0, z: 0 }, dx, dz);
    assert.ok(p.blocked && Math.abs(p.x) < 2 && Math.abs(p.z) < 1.5);
  }
  const slide = walkMove(empty, { x: 1.75, z: 0 }, 0.5, -0.8);
  assert.ok(slide.blocked && slide.z < -0.7);
});
test('only a clear, sufficiently wide and tall open doorway permits walking onto its threshold', () => {
  for (const [open, width, height, passes] of [
    [false, 1, 2.1, false],
    [true, 0.36, 2.1, false],
    [true, 1, 1.6, false],
    [true, 1, 2.1, true],
  ] as const) {
    const w = buildWalkWorld(room, [{ ...door, open, width, height, offset: 2 - width / 2 }], [], false);
    const p = walkMove(w, { x: 0, z: 1 }, 0, 5);
    assert.equal(p.z > 1.5, passes);
    assert.ok(p.z <= 2.15);
    if (passes) assert.ok(walkMove(w, p, 0, -1).z < 1.5);
  }
});
test('a casement or a sill cannot become an exit', () => {
  const w = buildWalkWorld(
    room,
    [
      {
        ...defaultWindow(room, 'win'),
        wall: 'front',
        offset: 1.5,
        width: 1,
        sill: 0.8,
        mechanism: 'casement',
        open: true,
      },
    ],
    [],
    false
  );
  assert.ok(walkMove(w, { x: 0, z: 0 }, 0, 5).z < 1.5);
});
test('fixed, walk-in, hinged and sliding screens collide at their actual panel positions', () => {
  for (const mechanism of ['fixed', 'walk-in', 'hinged', 'sliding'] as const)
    for (const open of [false, true]) {
      const w = buildWalkWorld(room, [{ ...screen, mechanism, open }], [], false);
      const left = walkMove(w, { x: -0.5, z: -0.7 }, 0, 1.4);
      assert.equal(left.z > 0, mechanism === 'walk-in' || (mechanism !== 'fixed' && open));
      assert.ok(walkMove(w, { x: 0.5, z: -0.7 }, 0, 1.4).z < 0);
      if (mechanism === 'hinged' && open) assert.ok(hit(w, { x: -0.99, z: 0.6 }));
    }
});
test('a rotated basin and cabinet block the visitor; a sufficiently high fixture is passable', () => {
  const w = buildWalkWorld(room, [], entries, true);
  assert.equal(w.solids.filter((s) => s.id === 'fixture').length, 3);
  assert.equal(hit(w, { x: -0.9, z: -0.7 })?.id, 'fixture');
  const high = buildWalkWorld(
    room,
    [],
    buildEntries([{ product, placed: { ...placement, position: [-0.9, 2.4, -0.7] } }]),
    false
  );
  assert.equal(hit(high, { x: -0.9, z: -0.7 }), null);
});
test('thin rotated glass stops high-speed motion and allows sliding along its diagonal', () => {
  const w = buildWalkWorld(room, [{ ...screen, mechanism: 'fixed', rotation: 45 }], [], false);
  const p = walkMove(w, { x: -0.6, z: 0.4 }, 1, 0);
  assert.ok(p.blocked && p.z > 0.4 && !hit(w, p));
  const rush = walkMove(w, { x: -0.6, z: 0.6 }, 5, -5);
  assert.ok(rush.x < rush.z);
});
const bench = buildWalkWorld(room, [door, screen, defaultWindow(room, 'win')], entries, true);
const then = performance.now();
for (let i = 0; i < 20000; i++) walkMove(bench, { x: 0, z: 0.22 }, 0.018, -0.02);
console.log('20000 collision steps (ms)', (performance.now() - then).toFixed(2));

test('keyboard and touch input cancel cleanly and idle time cannot become a movement step', () => {
  const input = new WalkInput();
  let requests = 0;
  input.connect(() => {
    requests++;
  });
  assert.equal(input.press('Space'), false);
  input.press('KeyW');
  input.press('right');
  input.look(40, -7);
  const frame = input.read(35, performance.now());
  assert.deepEqual([frame.forward, frame.side, frame.dx, frame.dy], [1, 1, 40, -7]);
  assert.ok(frame.elapsed < 0.1);
  input.release('right');
  assert.equal(input.read(0.016, performance.now()).side, 0);
  input.clear();
  const idle = input.read(1, performance.now());
  assert.deepEqual([idle.side, idle.forward, idle.dx, idle.dy], [0, 0, 0, 0]);
  input.connect(null);
  input.look(5, 1);
  assert.equal(requests, 3);
});

test('varying frame steps converge on the same contact without creeping through it', () => {
  const w = buildWalkWorld(room, [{ ...screen, mechanism: 'fixed' }], [], false);
  const first = walkMove(w, { x: 0, z: 0.7 }, 0, -0.9);
  const next = walkMove(w, first, 0, -0.013);
  assert.ok(first.blocked && next.blocked && !hit(w, next));
  assert.ok(Math.abs(next.z - first.z) < 0.0002);
});
