/** Offline P0.1 scenarios using the production catalogue adapter, rules and repository. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseCSV, mapCsvRowToProduct } from '../lib/importVerifiedProducts';
import { livlab3dLibraryProducts, toRoomStudioProduct, type RoomStudioProduct } from '../lib/room-studio/productAdapter';
import { anchoredPosition, applyRoomOperations, type RoomOperation } from '../lib/room-studio/roomOperations';
import { beginRoomDrag, commitRoom, createRoomHistory, endRoomDrag, HISTORY_LIMIT, redoRoom, undoRoom, updateRoomDrag } from '../lib/room-studio/roomHistory';
import { applyRoomProposal, previewRoomProposal, type ProposalRequest } from '../lib/room-studio/roomProposal';
import { buildStarterRoom, STARTER_ROOMS, starterRoomRequest } from '../lib/room-studio/roomPresets';
import { createInitialRoomState, deserializeRoomState, serializeRoomState, setLighting, setTargetBudget, updatePlacement } from '../lib/room-studio/roomState';
import { roomStateRepositoryFor } from '../lib/room-studio/roomStateRepository';

const base = createInitialRoomState();
const products = parseCSV(readFileSync('public/data/livlab-seed/livlab_verified_products_master.csv', 'utf8').trimStart())
  .map(mapCsvRowToProduct).map(toRoomStudioProduct);
const catalog = [...products, ...livlab3dLibraryProducts(products)];
const resolve = (id: string) => catalog.find(p => p.id === id);
const wc = resolve('llv-toi-toto-cs948dt8')!;
const other = resolve('llv-toi-inax-ac602vn')!;
const add: RoomOperation = { op: 'add', productId: wc.id, instanceId: 'A', atPoint: [0, 0, 0] };
const light: RoomOperation = { op: 'lighting', preset: 'warm' };
function operations(commands: RoomOperation[]) {
  const result = applyRoomOperations(base, commands, resolve);
  assert.ok(result.ok);
  return result.state;
}
const one = operations([add]);
const two = operations([add, { ...add, instanceId: 'B' }]);
const target = 'collision:A:B';
const move: RoomOperation = { op: 'move', instanceId: 'B', position: [0.85, two.placedProducts[1].position[1], 0] };
const repair: ProposalRequest = { source: 'smart-fix', label: 'Dời sản phẩm', intendedIssueId: target, operations: [move, light] };
const warm: ProposalRequest = { source: 'style', label: 'Ánh sáng ấm', operations: [light] };

test('atomic batches round trip through JSON and preserve their input', () => {
  const commands: RoomOperation[] = [add, light, { op: 'dimensions', dimensions: { length: 4, width: 3, height: 2.8 } },
    { op: 'surface', surface: 'floor', patch: { material: 'porcelain' } },
    { op: 'architecture', patch: { window: true } }, { op: 'rotate', instanceId: 'A', rotationY: Math.PI / 2 },
    { op: 'replace', instanceId: 'A', productId: other.id }];
  const unchanged = structuredClone(base);
  const after = operations(JSON.parse(JSON.stringify(commands)));
  assert.deepEqual(after, operations(commands));
  assert.deepEqual(base, unchanged);
  assert.equal(after.placedProducts[0].instanceId, 'A');
  assert.equal(after.placedProducts[0].productId, other.id);
  assert.equal(after.placedProducts[0].rotationY, Math.PI / 2);
  assert.equal(after.architecture?.window, true);
  assert.equal(operations([...commands, { op: 'remove', instanceId: 'A' }]).placedProducts.length, 0);
});

test('malformed or unsupported operations reject the entire batch at the failing operation', () => {
  const invalid: unknown[] = [null, { op: 'unknown' }, { op: 'add', instanceId: 'A', productId: wc.id },
    { op: 'move', instanceId: 'A', position: [0, Infinity, 1] }, { op: 'move', instanceId: 'A', position: [1] },
    { op: 'move', instanceId: 'A', position: [0, 0, 0], wall: 'left' }, { op: 'remove', instanceId: 'other' },
    { op: 'rotate', instanceId: 'A', rotationY: NaN }, { op: 'add', instanceId: 'B', productId: 'foreign-sku' },
    { op: 'replace', instanceId: 'A', productId: 'missing' }, { op: 'replace', instanceId: 'A', productId: 'llv-lav-toto-lt1705-xw' },
    { op: 'surface', surface: 'walls', patch: { material: 'typo' } }, { op: 'surface', surface: 'floor', patch: {} },
    { op: 'dimensions', dimensions: { length: 0, width: 4, height: 3 } }, { op: 'dimensions', dimensions: { length: 4, height: 3 } },
    { op: 'architecture', patch: { window: 7 } }, { op: 'architecture', patch: { door: true } },
    { op: 'lighting', preset: 'constructor' }, { op: 'lighting', preset: ['warm'] },
    { op: 'lighting', preset: 'warm', requiredField: 'ignored?' }];
  for (const payload of invalid) {
    const result = applyRoomOperations(base, [add, light, payload as RoomOperation], resolve);
    assert.equal(result.ok, false, JSON.stringify(payload));
    assert.ok(!result.ok && result.index === 2 && !('state' in result));
    assert.equal(base.placedProducts.length, 0);
    assert.equal(base.lighting, 'daylight');
  }
  assert.equal(applyRoomOperations(base, [], resolve).ok, false);
});

test('a complete gesture creates one exact transaction, cancelled or motionless gestures create none', () => {
  const initial = createRoomHistory(one);
  let h = beginRoomDrag(initial, 'A');
  for (let n = 1; n <= 100; n++) h = updateRoomDrag(h, 'A', s => updatePlacement(s, 'A', { position: [n / 100, 0.4, 0] }));
  assert.equal(h.current, one);
  assert.equal(h.past.length, 0);
  const cancel = endRoomDrag(h, true);
  assert.equal(cancel.current, one);
  assert.equal(cancel.revision, 0);
  const after = endRoomDrag(h);
  assert.equal(after.past.length, 1);
  assert.equal(after.current, h.drag?.draft);
  const undone = undoRoom(after);
  assert.equal(undone.current, one);
  assert.equal(redoRoom(undone).current, after.current);
  const noMovement = endRoomDrag(beginRoomDrag(undone, 'A'));
  assert.deepEqual(noMovement, undone);
  assert.equal(endRoomDrag(after), after);
});

test('history is bounded, labels survive redo, and branching drops the future', () => {
  let h = createRoomHistory(base);
  for (let i = 1; i <= HISTORY_LIMIT + 10; i++) h = commitRoom(h, 'Budget ' + i, setTargetBudget(h.current, i));
  assert.equal(h.past.length, HISTORY_LIMIT);
  for (let i = 0; i < HISTORY_LIMIT; i++) h = undoRoom(h);
  assert.equal(h.current.targetBudget, 10);
  assert.equal(undoRoom(h), h);
  assert.equal(h.future[0].label, 'Budget 11');
  h = redoRoom(h);
  h = commitRoom(h, 'Lighting', setLighting(h.current, 'studio'));
  assert.equal(h.future.length, 0);
  assert.equal(redoRoom(h), h);
});

test('selected issue must exist, be resolved and introduce no new blocking conflicts', () => {
  const h = createRoomHistory(two);
  const fixed = previewRoomProposal(h, repair, resolve);
  assert.ok(fixed.eligible, fixed.errors.join(', '));
  assert.equal(fixed.validation?.issueResolved, true);
  assert.ok(fixed.validation?.remaining.some(f => f.requiresHumanVerification));
  for (const intendedIssueId of ['unrelated', undefined]) {
    assert.equal(previewRoomProposal(h, { ...repair, intendedIssueId }, resolve).eligible, false);
  }
  assert.equal(previewRoomProposal(h, { ...repair, operations: [light] }, resolve).eligible, false);
  const outside = previewRoomProposal(h, { ...repair, operations: [{ ...move, position: [12, 0.4, 0] }] }, resolve);
  assert.equal(outside.eligible, false);
  assert.ok(outside.validation?.introduced.some(f => f.placementIssue === 'OUTSIDE_ROOM'));
  const offFloor = previewRoomProposal(createRoomHistory(one), { ...warm, operations: [{ ...move, instanceId: 'A', position: [0, 1, 0] }] }, resolve);
  assert.ok(offFloor.validation?.introduced.some(f => f.placementIssue === 'UNSUPPORTED_SURFACE'));
  const collide = previewRoomProposal(createRoomHistory(one), { ...warm, operations: [{ ...add, instanceId: 'B' }] }, resolve);
  assert.ok(collide.validation?.introduced.some(f => f.placementIssue === 'COLLISION'));
  assert.ok(previewRoomProposal(h, warm, resolve).eligible, 'pre-existing geometry issues can remain disclosed');
});

test('unknown data cannot prove the intended fix and missing references reject previews', () => {
  const unknown: RoomStudioProduct = { ...other, depth: undefined, priceMin: undefined, priceMax: undefined };
  const lookup = (id: string) => id === other.id ? unknown : resolve(id);
  const proposal = previewRoomProposal(createRoomHistory(two), { ...repair, operations: [{ op: 'replace', instanceId: 'B', productId: other.id }] }, lookup);
  assert.equal(proposal.eligible, false);
  assert.equal(proposal.validation?.issueResolved, false);
  assert.ok(proposal.findings.some(f => f.reason === 'MISSING_DATA'));
  assert.equal(proposal.budget?.difference, null);
  assert.equal(proposal.budget?.after.unpricedCount, 1);
  const orphan = { ...one, placedProducts: [{ ...one.placedProducts[0], productId: 'no-longer-listed' }] };
  assert.equal(previewRoomProposal(createRoomHistory(orphan), warm, resolve).eligible, false);
  const bad = previewRoomProposal(createRoomHistory(base), { ...warm, operations: [light, { op: 'remove', instanceId: 'missing' }] }, resolve);
  assert.equal(bad.preview, null);
  assert.equal(bad.eligible, false);
});

test('wall changes use the new wall orientation, mounting plane and current room bounds', () => {
  const shower = catalog.find(p => p.sku === 'BFV-70S' && p.reconstruction)!;
  const room = operations([{ op: 'add', productId: shower.id, instanceId: 'shower' }]);
  const placed = room.placedProducts[0];
  const position = anchoredPosition(room, { ...placed, wall: 'left' }, shower, [0, placed.position[1], 0]);
  const proposal = previewRoomProposal(createRoomHistory(room), {
    ...warm, operations: [{ op: 'move', instanceId: 'shower', wall: 'left', position }],
  }, resolve);
  assert.ok(proposal.eligible, proposal.errors.join(', '));
  assert.equal(proposal.preview?.placedProducts[0].rotationY, Math.PI / 2);
  assert.equal(proposal.preview?.placedProducts[0].wall, 'left');
  assert.deepEqual(proposal.preview?.placedProducts[0].position, position);
});

test('replacement shows the catalogue price delta and a failed validator closes the gate', () => {
  const request: ProposalRequest = { ...warm, operations: [{ op: 'replace', instanceId: 'A', productId: other.id }] };
  const h = createRoomHistory(one);
  const priced = previewRoomProposal(h, request, resolve);
  assert.ok(priced.eligible, priced.errors.join(', '));
  assert.deepEqual(priced.budget?.difference, { min: other.priceMin! - wc.priceMin!, max: other.priceMax! - wc.priceMax! });
  const failed = previewRoomProposal(h, warm, () => { throw new Error('catalogue unavailable'); });
  assert.equal(failed.eligible, false);
  assert.ok(failed.errors.length);
  assert.equal(h.current, one);
});

test('Apply requires the active revision and exactly the preview displayed; redo never re-runs it', () => {
  const h = createRoomHistory(two);
  const proposal = previewRoomProposal(h, repair, resolve);
  assert.equal(applyRoomProposal(h, proposal), h);
  const open = { ...h, proposal };
  const applied = applyRoomProposal(open, proposal);
  assert.equal(applied.current, proposal.preview);
  assert.equal(applied.past.length, 1);
  assert.equal(applied.past[0].label, repair.label);
  assert.equal(applied.proposal, null);
  assert.equal(applyRoomProposal(applied, proposal), applied);
  const undone = undoRoom(applied);
  assert.equal(undone.current, h.current);
  const stale = { ...undone, proposal };
  assert.equal(applyRoomProposal(stale, proposal), stale);
  assert.equal(redoRoom(undone).current, proposal.preview);
  const edited = commitRoom(open, 'Lighting', setLighting(h.current, 'studio'));
  assert.equal(applyRoomProposal(edited, proposal), edited);
  assert.equal(proposal.budget?.difference?.min, 0);
});

test('every existing starter previews the original layout and its toast can undo past later edits', () => {
  for (const preset of STARTER_ROOMS) {
    const h = createRoomHistory(setTargetBudget(one, 40_000_000));
    const request = starterRoomRequest(h.current, preset, catalog);
    const proposal = previewRoomProposal(h, request, resolve);
    assert.ok(proposal.eligible, preset.id + ' ' + proposal.errors.join(', '));
    const ids = request.operations.filter(cmd => cmd.op === 'add').map(cmd => cmd.instanceId);
    const layout = buildStarterRoom(h.current, preset, catalog, () => ids.shift()!);
    assert.deepEqual(proposal.preview, layout.state);
    const applied = applyRoomProposal({ ...h, proposal }, proposal);
    const changed = commitRoom(applied, 'Edit after preset', setTargetBudget(applied.current, 1));
    const restored = undoRoom(changed, applied.current);
    assert.equal(restored.current, h.current);
    assert.equal(undoRoom(restored, applied.current), restored);
    assert.equal(redoRoom(redoRoom(restored)).current, changed.current);
  }
});

test('v1 persistence contains committed data only and preserves the tenant boundary', async () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: {
    setItem: (key: string, value: string) => storage.set(key, value), getItem: (key: string) => storage.get(key) ?? null,
  } } });
  try {
    const legacy = { dimensions: one.dimensions, placedProducts: one.placedProducts, selectedMaterials: { floor: 'tile-beige' } };
    storage.set('livlab_room_studio_state_v1', JSON.stringify(legacy));
    const repo = roomStateRepositoryFor('livlab');
    const h = createRoomHistory((await repo.load())!);
    assert.equal(h.current.placedProducts.length, 1);
    assert.equal(h.current.architecture?.window, false);
    const proposal = previewRoomProposal(h, warm, resolve);
    const open = { ...h, proposal };
    await repo.save(open.current);
    assert.equal((await repo.load())?.lighting, 'daylight');
    const applied = applyRoomProposal(open, proposal);
    await repo.save(applied.current);
    assert.deepEqual(await repo.load(), deserializeRoomState(serializeRoomState(applied.current)));
    assert.ok(!storage.get('livlab_room_studio_state_v1')!.includes('proposal'));
    assert.equal(await roomStateRepositoryFor('tungdang').load(), null);
    await roomStateRepositoryFor('tungdang').save(base);
    assert.equal((await repo.load())?.lighting, 'warm');
    await repo.save(undoRoom(applied).current);
    assert.equal((await repo.load())?.lighting, 'daylight');
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
});
