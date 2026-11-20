import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCSV, mapCsvRowToProduct } from '../lib/importVerifiedProducts';
import { toRoomStudioProduct } from '../lib/room-studio/productAdapter';
import { test } from 'node:test';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { elementsForFlags, doorGeometry, renderedWalls, wallCutaway, wallFrame, wallOpenings, WALLS, type EntranceDoor } from '../lib/room-studio/architecture';
import { glassPartitionRect, parseArchitecture, windowRect } from '../lib/room-studio/environment';
import { solidWallRects, surfaceGeometry } from '../lib/room-studio/wallMesh';
import { createInitialRoomState, deserializeRoomState, serializeRoomState } from '../lib/room-studio/roomState';
import { applyRoomOperations, type RoomOperation } from '../lib/room-studio/roomOperations';
import { applyRoomProposal, previewRoomProposal } from '../lib/room-studio/roomProposal';
import { createRoomHistory, undoRoom, redoRoom } from '../lib/room-studio/roomHistory';
import { roomStateRepositoryFor } from '../lib/room-studio/roomStateRepository';
import { entranceDoorRule } from '../lib/technical-advisor/rules/entranceDoorRule';
import type { TechnicalProductEntry } from '../lib/technical-advisor/types';

const base = createInitialRoomState();
const room = { length: 4, width: 3, height: 2.7 };
const arch = { ...parseArchitecture(base.architecture), niche: false, window: false };
const sample: EntranceDoor = { id: 'A', type: 'entrance-door', wall: 'back', offset: 0.3, width: 0.9, height: 2.1,
  mechanism: 'hinged', hinge: 'left', swing: 'inward', open: true };
const near = (a: number, b: number) => assert.ok(Math.abs(a-b) < 1e-8, a + ' ≠ ' + b);
const run = (doors: EntranceDoor[], entries: TechnicalProductEntry[] = [], settings = arch) =>
  entranceDoorRule.run({ room, entries, architecture: settings, elements: elementsForFlags(room,doors,settings), utilityPoints: [] });
const resolve = () => undefined;
const initial = createRoomHistory({ ...base, dimensions: room, architecture: arch });
const preview = (op: RoomOperation, h = initial) => previewRoomProposal(h, { source: 'architecture', label: 'Cửa ra vào', operations: [op] }, resolve);

for (const wall of WALLS) test('shared plan, leaf, swing and actual wall triangles on ' + wall, () => {
  const frame = wallFrame(room, wall);
  for (const hinge of ['left', 'right'] as const) for (const swing of ['inward', 'outward'] as const) {
    const door = { ...sample, wall, hinge, swing };
    const g = doorGeometry(room, door);
    const opened = frame.local(g.tip(Math.PI / 2)), closed = frame.local(g.tip(0));
    near(frame.local(g.hinge).depth, 0);
    near(frame.local(g.hinge).u, door.offset + (hinge === 'left' ? g.jamb : door.width - g.jamb));
    near(closed.u - g.pivot, (hinge === 'left' ? 1 : -1) * g.radius);
    near(opened.depth, (swing === 'inward' ? 1 : -1) * g.radius);
    near(closed.depth, 0); near(opened.u, g.pivot);
    assert.deepEqual(g.arc.at(-1), g.tip(Math.PI / 2));
    const centre = frame.point(frame.span / 2);
    const mesh = new Mesh(surfaceGeometry(frame.span, room.height, wallOpenings(room, arch, [door])), new MeshBasicMaterial());
    mesh.position.set(centre.x, room.height/2, centre.z);
    mesh.rotation.y = frame.yaw; mesh.updateMatrixWorld(true);
    const hits = (u: number, y: number) => {
      const p = frame.point(u, 1), q = frame.point(u, 0);
      return new Raycaster(new Vector3(p.x,y,p.z), new Vector3(q.x-p.x,0,q.z-p.z)).intersectObject(mesh).length;
    };
    assert.equal(hits(door.offset + door.width / 2, 1), 0);
    assert.ok(hits(door.offset/2, 1) > 0 && hits(door.offset + door.width/2, 2.4) > 0);
    mesh.geometry.dispose(); mesh.material.dispose();
    assert.deepEqual(run([door]), []);
  }
});

test('corner, invalid dimensions, bounds, jambs and incompatible openings', () => {
  assert.deepEqual(run([{ ...sample, offset: 0 }]), []);
  assert.deepEqual(run([{ ...sample, offset: 3.1 }]), []);
  for (const patch of [{ offset: -0.01 }, { offset: 3.11 }, { height: 3 }, { height: 0 }, { width: -1 }, { width: 0 }]) {
    assert.equal(preview({ op: 'element.add', element: { ...sample, ...patch } }).eligible, false);
  }
  for (const patch of [{ hinge: ['left'] }, { swing: ['inward'] }, { hinge: 'far' }, { mechanism: 'sliding' }, { offset: NaN }, { pivot: 1 }, { open: 1 }]) {
    assert.equal(applyRoomOperations(base, [{ op: 'element.add', element: { ...sample, ...patch } } as RoomOperation], resolve).ok, false);
  }
  const second = { ...sample, id: 'B' };
  assert.equal(run([sample, second]).length, 1);
  assert.deepEqual(run([sample, second]), run([second, sample]));
  assert.deepEqual(run([sample, { ...second, offset: sample.offset + sample.width }]), []);
  assert.ok(run([{ ...sample, wall: 'left', offset: 1 }], [], { ...arch, window: true }).some(f => f.message.includes('cửa sổ')));
  assert.ok(run([{ ...sample, offset: 3 }], [], { ...arch, niche: true }).some(f => f.message.includes('hốc tường')));
  const solids = solidWallRects(4, 2.7, wallOpenings(room, arch, [{ ...sample, offset: 0 }]));
  assert.equal(solids.some(r => r.x === 0 && r.y === 0), false);
});

test('cutaway retains the open legacy front and distinguishes each exterior half-space', () => {
  assert.deepEqual(renderedWalls([]), ['back','right','left']);
  assert.deepEqual(renderedWalls([{ ...sample, wall: 'front' }]), WALLS);
  for (const w of WALLS) {
    const f = wallFrame(room, w);
    assert.equal(wallCutaway(f, f.point(1, -1), true), true);
    assert.equal(wallCutaway(f, { x: 0, z: 0 }, true), false);
    assert.equal(wallCutaway(f, f.point(1,-1), false), false);
  }
});

test('sector against rotated fixture, exact arc, boundary, missing dimensions and height', () => {
  for (const wall of WALLS) for (const hinge of ['left','right'] as const) for (const swing of ['inward','outward'] as const) {
    const d = { ...sample, wall, hinge, swing, open: false };
    const g = doorGeometry(room, d);
    const entry = (u: number, v: number, y = 0.4, width: number | undefined = 0.05) => {
      const p = g.frame.point(g.pivot + u*g.hand,v*g.inward);
      return { placed: { instanceId: 'fixture', position: [p.x,y,p.z], rotationY: 0.77, placementType: 'floor' },
        product: { name: 'Fixture' }, metadata: { dimensionsOrigin: 'CATALOGUE', width, depth: 0.05, height: 0.3 } } as TechnicalProductEntry;
    };
    assert.equal(run([d],[entry(.2,.2)])[0]?.placementIssue, 'DOOR_SWING');
    assert.deepEqual(run([d],[entry(.75,.75),entry(-.2,.2),entry(.2,.2,2.5)]), []);
    const missing = entry(.2,.2); delete missing.metadata.width;
    assert.equal(run([d],[missing])[0]?.reason, 'MISSING_DATA');
    assert.equal(run([d],[missing])[0]?.placementIssue, undefined);
  }
});

test('atomic commands, dimension revalidation, stale draft, discard and exact undo and redo', () => {
  const add: RoomOperation = { op: 'element.add', element: sample };
  const p = preview(add);
  assert.ok(p.eligible && p.preview);
  assert.equal(initial.current.elements.length, 0);
  assert.equal(initial.past.length, 0);
  assert.equal(applyRoomProposal(initial,p), initial);
  const h = applyRoomProposal({ ...initial, proposal: p },p);
  assert.equal(h.past.length, 1);
  assert.deepEqual(h.current.elements,[sample]);
  const shorter = preview({ op: 'dimensions', dimensions: { ...room, height: 2 } }, h);
  assert.equal(shorter.eligible, false);
  const changed = preview({ op: 'element.update', element: { ...sample, offset: .65, hinge: 'right', swing: 'outward' } },h);
  const h2 = applyRoomProposal({ ...h, proposal: changed }, changed);
  assert.equal(h2.past.length,2);
  assert.equal(undoRoom(h2).current,h.current);
  assert.equal(redoRoom(undoRoom(h2)).current,h2.current);
  assert.equal(applyRoomProposal({ ...h2, proposal: p },p).revision,h2.revision);
  assert.equal(applyRoomOperations(h.current,[{ op:'element.remove',elementId:'A' },{ op:'element.update',element:sample }],resolve).ok,false);
  assert.equal(applyRoomOperations(h.current,[add],resolve).ok,false);
  const remove = preview({ op:'element.remove',elementId:'A' },h);
  assert.deepEqual(remove.preview?.elements,[]);
  assert.equal(undoRoom(applyRoomProposal({ ...h, proposal: remove },remove)).current,h.current);
});

for (const window of [true,false]) for (const glassPartition of [true,false]) {
  test('idempotent v1 migration with window=' + window + ' partition=' + glassPartition, () => {
    const fixture = { ...base, version: 1, dimensions:room, elements:undefined, architecture:{ ...arch,window,glassPartition },
      placedProducts:[{ instanceId:'saved',productId:'fixture',position:[0,.4,.2],rotationY:0,placementType:'floor' }] };
    const migrated = deserializeRoomState(fixture);
    assert.equal(migrated.version,3);
    assert.deepEqual(migrated.elements.filter(e => e.type === 'entrance-door'),[]);
    assert.deepEqual(JSON.parse(JSON.stringify(migrated.placedProducts)),fixture.placedProducts);
    assert.deepEqual(migrated.dimensions,room);
    assert.deepEqual(migrated.architecture,fixture.architecture);
    assert.deepEqual(windowRect(migrated.dimensions),windowRect(room));
    assert.deepEqual(glassPartitionRect(migrated.dimensions),glassPartitionRect(room));
    assert.deepEqual(deserializeRoomState(serializeRoomState(migrated)),migrated);
  });
}

test('save and reload committed door only, retain original tenant storage boundary', async () => {
  const storage = new Map<string,string>();
  Object.defineProperty(globalThis,'window',{ configurable:true,value:{ localStorage:{
    getItem:(k:string) => storage.get(k) ?? null, setItem:(k:string,v:string) => storage.set(k,v),
  } } });
  try {
    const primary = roomStateRepositoryFor('livlab'), other = roomStateRepositoryFor('tungdang');
    const p = preview({ op:'element.add',element:sample });
    await primary.save(initial.current);
    assert.deepEqual((await primary.load())?.elements,[]);
    const h = applyRoomProposal({ ...initial,proposal:p },p);
    await primary.save(h.current);
    assert.deepEqual((await primary.load())?.elements,[sample]);
    assert.equal(await other.load(),null);
    await other.save(initial.current);
    assert.deepEqual((await primary.load())?.elements,[sample]);
    assert.deepEqual(deserializeRoomState({ ...h.current,elements:[sample, { id:'broken' }, sample] }).elements,[sample]);
  } finally { Reflect.deleteProperty(globalThis,'window'); }
});


test('proposal gate blocks a surveyed fixture in the full swing of a closed entrance', () => {
  const products = parseCSV(readFileSync('public/data/livlab-seed/livlab_verified_products_master.csv', 'utf8').trimStart())
    .map(mapCsvRowToProduct).map(toRoomStudioProduct);
  const wc = products.find(p => p.id === 'llv-toi-toto-cs948dt8')!;
  const catalog = (id: string) => products.find(p => p.id === id);
  const g = doorGeometry(room, sample);
  const p = g.frame.point(g.pivot + 0.3, 0.38);
  const populated = applyRoomOperations(initial.current, [
    { op: 'add', productId: wc.id, instanceId: 'wc', atPoint: [p.x, 0, p.z] },
  ], catalog);
  assert.ok(populated.ok);
  const h = createRoomHistory(populated.state);
  const draft = (swing: EntranceDoor['swing']) => previewRoomProposal(h, {
    source: 'architecture', label: 'Cửa',
    operations: [{ op: 'element.add', element: { ...sample, swing, open: false } }],
  }, catalog);
  const blocked = draft('inward');
  assert.equal(blocked.eligible, false);
  assert.deepEqual(blocked.validation?.introduced.map(f => f.affectedInstanceIds), [['wc']]);
  assert.equal(blocked.validation?.introduced[0].placementIssue, 'DOOR_SWING');
  assert.equal(draft('outward').eligible, true);
  assert.equal(h.current.elements.length, 0);
});

test('opposite wall, legacy window toggle and shortened wall are gated against the same openings', () => {
  assert.ok(run([{ ...sample, width: 3.6 }]).some(f => f.id.includes('opposite')));
  const door = { ...sample, wall: 'left' as const, offset: 1.6 };
  const added = preview({ op: 'element.add', element: door });
  assert.ok(added.eligible);
  const h = applyRoomProposal({ ...initial, proposal: added }, added);
  const withWindow = preview({ op: 'architecture', patch: { window: true } }, h);
  assert.ok(withWindow.errors.some(m => m.includes('cửa sổ')));
  assert.equal(withWindow.eligible, false);
  const resized = preview({ op: 'dimensions', dimensions: { ...room, width: 2 } }, h);
  assert.equal(resized.eligible, false);
  assert.deepEqual(h.current.elements, [door]);
});
