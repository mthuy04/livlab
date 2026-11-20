import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { createInitialRoomState, deserializeRoomState, serializeRoomState, setArchitecture } from '../lib/room-studio/roomState';
import { applyRoomOperations, type RoomOperation } from '../lib/room-studio/roomOperations';
import { createRoomHistory, redoRoom, undoRoom } from '../lib/room-studio/roomHistory';
import { previewRoomProposal, applyRoomProposal } from '../lib/room-studio/roomProposal';
import { roomStateRepositoryFor } from '../lib/room-studio/roomStateRepository';
import { defaultPartition, defaultWindow, doorGeometry, renderedWalls, WALLS, wallFrame, wallOpenings, type EntranceDoor, type ArchitecturalElement } from '../lib/room-studio/architecture';
import { glassPartitionRect, windowRect } from '../lib/room-studio/environment';
import { movePartition, partitionGeometry, partitionFits, windowGeometry } from '../lib/room-studio/glassGeometry';
import { surfaceGeometry } from '../lib/room-studio/wallMesh';
import { runTechnicalAdvisor } from '../lib/technical-advisor/engine';
import { glassArchitectureRule } from '../lib/technical-advisor/rules/glassArchitectureRule';
import type { TechnicalProductEntry } from '../lib/technical-advisor/types';
import { buildHandoffPackage } from '../lib/implementation/buildHandoffPackage';
import { describeHandoffElement, type LeadContextV1 } from '../lib/implementation/leadContext';
import { submitImplementationRequest } from '../lib/implementation/submitImplementationRequest';

const initial = createInitialRoomState(), room = { length: 4, width: 3, height: 2.7 };
const base = { ...initial, dimensions: room };
const win = defaultWindow(room, 'w');
const screen = { ...defaultPartition(room, 'p'), x: 0, z: 0, rotation: 0, length: 1.4, height: 2 };
const door: EntranceDoor = { id: 'd', type: 'entrance-door', wall: 'back', offset: .3, width: .9, height: 2, mechanism: 'hinged', hinge: 'left', swing: 'inward', open: false };
const find = (elements: ArchitecturalElement[], entries: TechnicalProductEntry[] = []) =>
  glassArchitectureRule.run({ room, elements, architecture: base.architecture, entries, utilityPoints: [] });
const gate = (operations: RoomOperation[], h = createRoomHistory(base)) => previewRoomProposal(h, { source: 'architecture', label: 'Kiến trúc', operations }, () => undefined);
const add = (element: ArchitecturalElement): RoomOperation => ({ op: 'element.add', element });
const approx = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} differs from ${b}`);
function fixture(x: number, z: number, y = .4): TechnicalProductEntry {
  return {
    placed: { instanceId: 'wc', position: [x, y, z], rotationY: .31, placementType: 'floor' }, product: { name: 'Measured fixture' },
    metadata: { dimensionsOrigin: 'CATALOGUE', width: .14, height: .2, depth: .22 }
  } as TechnicalProductEntry;
}

for (const wall of WALLS) test('cut wall and working casement on ' + wall, () => {
  const w = { ...win, wall, offset: 0, width: 1, sill: .8, height: .9 };
  const { frame } = doorGeometry(room, { ...door, wall });
  const centre = frame.point(frame.span / 2);
  const mesh = new Mesh(surfaceGeometry(frame.span, room.height, wallOpenings(room, { niche: false }, [w])),
    new MeshBasicMaterial({ side: DoubleSide }));
  mesh.rotation.y = frame.yaw; mesh.position.set(centre.x, room.height / 2, centre.z); mesh.updateMatrixWorld(true);
  function ray(u: number, h: number) {
    const a = frame.point(u, .8), b = frame.point(u);
    return new Raycaster(new Vector3(a.x, h, a.z), new Vector3(b.x - a.x, 0, b.z - a.z).normalize()).intersectObject(mesh).length;
  }
  assert.equal(ray(.4, 1.1), 0); assert.ok(ray(.4, .4) > 0 && ray(.4, 2) > 0 && ray(1.2, 1.1) > 0);
  const closed = windowGeometry(room, w);
  const open = windowGeometry(room, { ...w, mechanism: 'casement', open: true });
  assert.deepEqual(closed.sash.a, open.sash.a);
  const tip = wallFrame(room, wall).local(open.sash.b);
  approx(tip.depth, -(w.width - 2 * open.profile)); approx(tip.u, w.offset + open.profile);
  assert.deepEqual(gate([add(w)]).errors, []);
  assert.ok(renderedWalls([w]).includes(wall));
  mesh.geometry.dispose(); mesh.material.dispose();
});

test('window resizing, touching, stacking, competing openings and invalid syntax', () => {
  const w = { ...win, wall: 'back' as const, offset: .1, width: .8, sill: 1, height: .6 };
  const neighbour = { ...w, id: 'next', offset: .9 };
  assert.ok(gate([add(w), add(neighbour)]).eligible);
  assert.ok(gate([add(w), add({ ...neighbour, offset: .1, sill: 1.6 })]).eligible);
  for (const patch of [{ width: 0 }, { height: -.1 }, { offset: -.01 }, { sill: -.1 }, { sill: 2.4 }, { offset: 3.9 }])
    assert.equal(gate([add({ ...w, ...patch })]).eligible, false);
  assert.equal(gate([add(w), add({ ...neighbour, offset: .89 })]).eligible, false);
  assert.equal(gate([add(w), add(door)]).eligible, false);
  assert.ok(gate([add({ ...w, sill: 2.01, height: .4 }), add(door)]).eligible);
  assert.equal(applyRoomOperations(base, [add(w), add({ ...neighbour, wall: 'ceiling' } as unknown as ArchitecturalElement)], () => undefined).ok, false);
  assert.ok(find([w], [fixture(0, 0)]).length === 0);
  assert.equal(gate([add(w), add({ ...w, id: 'x', width: NaN })]).preview, null);
});

for (const rotation of [0, 45, 90, -90, 180]) test('partition rotation and bounded translation at ' + rotation + ' degrees', () => {
  const p = { ...screen, rotation };
  const g = partitionGeometry(p);
  approx(Math.hypot(g.span.a.x - g.span.b.x, g.span.a.z - g.span.b.z), p.length);
  approx((g.span.a.x + g.span.b.x) / 2, p.x);
  const moved = movePartition(room, p, 40, -40);
  assert.ok(partitionFits(room, moved));
  assert.equal(gate([add({ ...p, x: 3 })]).eligible, false);
  assert.ok(gate([add({ ...p, length: 1.6, height: 2.2 })]).eligible);
});

test('fixed glass versus a rotated known footprint, elevation and unknown metadata', () => {
  assert.ok(find([screen], [fixture(0, 0)]).some(f => f.placementIssue));
  assert.deepEqual(find([screen], [fixture(0, .3), fixture(0, 0, 2.5)]), []);
  const unknown = fixture(0, 0); delete unknown.metadata.depth;
  assert.equal(find([screen], [unknown])[0].reason, 'MISSING_DATA');
  for (const patch of [{ length: 0 }, { height: 3 }, { rotation: 181 }]) assert.equal(gate([add({ ...screen, ...patch })]).eligible, false);
});

for (const side of ['left', 'right'] as const) test('actual walk-in passage, hinged sweep and sliding travel on ' + side, () => {
  const p = { ...screen, entrySide: side }, sign = side === 'left' ? -1 : 1;
  const walk = { ...p, mechanism: 'walk-in' as const };
  const g = partitionGeometry(walk);
  assert.ok(g.entry && !g.leaf);
  approx(Math.hypot(g.entry.a.x - g.entry.b.x, g.entry.a.z - g.entry.b.z), p.length / 2);
  assert.match(find([walk], [fixture(sign * .35, 0)])[0].message, /lối vào/);
  assert.match(find([walk], [fixture(-sign * .35, 0)])[0].message, /tấm kính/);
  for (const swing of ['forward', 'reverse'] as const) {
    const hinged = { ...p, mechanism: 'hinged' as const, swing };
    const shut = partitionGeometry(hinged), opened = partitionGeometry({ ...hinged, open: true });
    assert.deepEqual(shut.leaf!.a, opened.leaf!.a);
    approx(opened.leaf!.b.z, swing === 'forward' ? .7 : -.7);
    const z = swing === 'forward' ? .35 : -.35;
    assert.match(find([hinged], [fixture(sign * .5, z)])[0].message, /vùng mở/);
    assert.deepEqual(find([hinged], [fixture(sign * .5, -z)]), []);
  }
  const slider = { ...p, mechanism: 'sliding' as const };
  const shut = partitionGeometry(slider), opened = partitionGeometry({ ...slider, open: true });
  approx(Math.abs(opened.leaf!.a.x - shut.leaf!.a.x), p.length / 2);
  assert.ok(Math.abs(opened.fixed.a.z - opened.leaf!.a.z) > 0);
  assert.ok(shut.travel && opened.entry);
  assert.deepEqual(find([slider], [fixture(sign * .35, .3)]), []);
  assert.ok(find([slider], [fixture(sign * .35, 0)]).some(f => f.placementIssue));
});

test('entrance and shower swing, partition pairs and clear mixed design', () => {
  const g = doorGeometry(room, door);
  const q = g.frame.point(g.pivot + .25, .25);
  assert.ok(find([door, { ...screen, x: q.x, z: q.z, length: .25 }]).some(f => f.id.includes('entrance')));
  assert.equal(gate([add(screen), add({ ...screen, id: 'p2', rotation: 90 })]).eligible, false);
  assert.ok(gate([add(door), add(win), add(screen)]).eligible);
  const report = runTechnicalAdvisor({ room, elements: [door, { ...screen, x: q.x, z: q.z, length: .25 }], entries: [], utilityPoints: [] });
  assert.deepEqual(report.filter(f => f.ruleId === 'glass-architecture'), find([door, { ...screen, x: q.x, z: q.z, length: .25 }]));
});

for (const version of [1, 2]) for (const window of [true, false]) for (const glassPartition of [true, false])
  test('legacy ' + version + ' with window=' + window + ' partition=' + glassPartition, () => {
    const data = { ...base, version, architecture: { ...base.architecture, window, glassPartition }, elements: version === 2 ? [door] : [] };
    const migrated = deserializeRoomState(data);
    assert.equal(migrated.elements.filter(e => e.type === 'window').length, Number(window));
    assert.equal(migrated.elements.filter(e => e.type === 'shower-partition').length, Number(glassPartition));
    assert.deepEqual(migrated.elements.filter(e => e.type === 'entrance-door'), version === 2 ? [door] : []);
    const w = migrated.elements.find(e => e.type === 'window'), p = migrated.elements.find(e => e.type === 'shower-partition');
    if (w) { const legacy = windowRect(room); approx(windowGeometry(room, w).centre.z, legacy.centreZ); approx(w.sill, legacy.sill); approx(w.width, legacy.width); }
    if (p) { const legacy = glassPartitionRect(room); const g = partitionGeometry(p); approx(g.span.a.z, -room.width / 2); approx(g.span.b.z, legacy.depth - room.width / 2); approx(p.x, legacy.x); approx(p.height, legacy.height); }
    assert.deepEqual(migrated.surfaceStyles, base.surfaceStyles);
    assert.deepEqual(deserializeRoomState(serializeRoomState(migrated)), migrated);
    assert.deepEqual(setArchitecture(migrated, { window, glassPartition }).elements, migrated.elements);
  });

test('existing explicit IDs take precedence, compatibility flags never resurrect a removed element', () => {
  const migrated = deserializeRoomState({ ...base, version: 2, elements: [{ ...door, id: 'window' }, win], architecture: { ...base.architecture, window: true, glassPartition: true } });
  assert.equal(migrated.elements.length, 3);
  const removed = applyRoomOperations(migrated, [{ op: 'element.remove', elementId: win.id }], () => undefined);
  assert.ok(removed.ok);
  const raw = { ...removed.state, architecture: { ...removed.state.architecture, window: true } };
  assert.equal(deserializeRoomState(raw).architecture?.window, false);
});

test('atomic preview, discard, undo/redo, reloaded edits, tenant isolation and committed handoff', async () => {
  const h = createRoomHistory(base), p = gate([add(win), add(screen)], h);
  assert.ok(p.eligible);
  const packet = (state: typeof base) => buildHandoffPackage({
    state, placedViews: [], findings: [], budget: { min: 0, max: 0, itemCount: 0, unpricedCount: 0 },
    requestType: 'TECHNICAL_CHECK', customerContact: { fullName: 'QA', phone: '' }
  });
  assert.equal(packet(h.current).room?.elements, undefined);
  assert.equal(applyRoomProposal(h, p), h);
  const applied = applyRoomProposal({ ...h, proposal: p }, p);
  assert.equal(applied.past.length, 1);
  assert.deepEqual(packet(applied.current).room?.elements, [win, screen]);
  assert.equal(undoRoom(applied).current, base);
  assert.equal(redoRoom(undoRoom(applied)).current, applied.current);
  assert.equal(applyRoomProposal({ ...applied, proposal: p }, p).revision, applied.revision);
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true, value: {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v),
      }
    }
  });
  try {
    const a = roomStateRepositoryFor('livlab'), b = roomStateRepositoryFor('tungdang');
    await a.save(applied.current); await b.save(base);
    const restored = createRoomHistory((await a.load())!);
    const changed = gate([{ op: 'element.update', element: { ...win, sill: .6 } }, { op: 'element.update', element: { ...screen, rotation: 40 } }], restored);
    assert.ok(changed.eligible);
    assert.deepEqual((await a.load())?.elements, [win, screen]);
    const edit = applyRoomProposal({ ...restored, proposal: changed }, changed);
    await a.save(edit.current);
    assert.deepEqual((await a.load())?.elements, edit.current.elements);
    assert.deepEqual((await b.load())?.elements, []);
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});


test('frame members at adjoining walls conflict only at overlapping elevations', () => {
  const a = { ...win, wall: 'back' as const, offset: 0, sill: 1 };
  const b = { ...door, wall: 'left' as const, offset: room.width - door.width };
  assert.equal(gate([add(a), add(b)]).eligible, false);
  assert.ok(gate([add({ ...a, offset: .12 }), add(b)]).eligible);
  assert.ok(gate([add({ ...a, sill: 2.1, height: .4 }), add(b)]).eligible);
});

test('the showroom request carries the committed architecture through preview, Apply, Undo and Redo', async t => {
  const deliveries: LeadContextV1[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    assert.equal(url, '/api/quote');
    assert.equal(init.method, 'POST');
    deliveries.push(JSON.parse(String(init.body)).context);
    return Response.json({ requestCode: 'QA', lead: { id: 'qa' } });
  });
  const initial = createRoomHistory({ ...base, elements: [door] });
  const slider = { ...screen, mechanism: 'sliding' as const, open: true };
  const casement = { ...win, mechanism: 'casement' as const, glazing: 'frosted' as const };
  const proposal = gate([add(casement), add(slider)], initial);
  assert.ok(proposal.eligible);
  const pending = { ...initial, proposal };
  const applied = applyRoomProposal(pending, proposal);
  const undone = undoRoom(applied);
  for (const history of [pending, applied, undone, redoRoom(undone), createRoomHistory(base)]) {
    await submitImplementationRequest(buildHandoffPackage({
      state: history.current, placedViews: [], findings: [], requestType: 'TECHNICAL_CHECK',
      budget: { min: 0, max: 0, itemCount: 0, unpricedCount: 0 }, customerContact: { fullName: 'QA', phone: '' },
    }));
  }
  const edited = [door, casement, slider];
  assert.deepEqual(deliveries.map(context => context.room?.elements), [[door], edited, [door], edited, undefined]);
  assert.match(describeHandoffElement(casement), /bậu .* cm · mở quay ra ngoài · kính mờ/);
  assert.match(describeHandoffElement(slider), /cửa trượt, lối vào bên phải/);
});

test('shrinking the room and editing already invalid imported geometry both leave the original intact', () => {
  const h = createRoomHistory({ ...base, elements: [{ ...win, sill: 2.8 }] });
  assert.equal(gate([{ op: 'element.update', element: { ...win, sill: 2.9 } }], h).eligible, false);
  assert.ok(gate([{ op: 'element.update', element: win }], h).eligible);
  const resize = gate([{ op: 'dimensions', dimensions: { ...room, height: 2 } }], createRoomHistory({ ...base, elements: [{ ...win, sill: 1.4 }] }));
  assert.equal(resize.eligible, false);
});
