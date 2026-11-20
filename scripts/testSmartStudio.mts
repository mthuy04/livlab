import assert from 'node:assert/strict';
import { test } from 'node:test';
import Module, { createRequire } from 'node:module';
import { TENANTS } from '../lib/storefront/tenantConfig';
import { readFileSync } from 'node:fs';
import { parseCSV, mapCsvRowToProduct } from '../lib/importVerifiedProducts';
import { toRoomStudioProduct, livlab3dLibraryProducts } from '../lib/room-studio/productAdapter';
import { applyRoomOperations } from '../lib/room-studio/roomOperations';
import { createInitialRoomState } from '../lib/room-studio/roomState';
import { createRoomHistory, undoRoom, redoRoom } from '../lib/room-studio/roomHistory';
import { applyRoomProposal, previewRoomProposal } from '../lib/room-studio/roomProposal';
import { buildEntries, runTechnicalAdvisor } from '../lib/technical-advisor/engine';
import { frontSpace, footprintGap, intersection, area } from '../lib/technical-advisor/spatialGeometry';
import { snapPlacement } from '../lib/room-studio/snapPlacement';
import { smartFix } from '../lib/room-studio/smartFix';
import { reconcileRoomQuote, quoteLineKey } from '../lib/room-studio/roomQuote';
import {
  getQuoteItems,
  saveQuoteItems,
  removeQuoteItem,
  addQuoteItem,
  updateQuoteItemQty,
} from '../lib/storage';

const catalog = parseCSV(
  readFileSync('public/data/livlab-seed/livlab_verified_products_master.csv', 'utf8').trimStart()
)
  .map(mapCsvRowToProduct)
  .map(toRoomStudioProduct);
catalog.push(...livlab3dLibraryProducts(catalog));
const resolve = (id: string) => catalog.find((p) => p.id === id);
const wc = resolve('llv-toi-toto-cs948dt8')!,
  other = resolve('llv-toi-inax-ac602vn')!;
const batch = applyRoomOperations(
  createInitialRoomState(),
  ['A', 'B'].map((instanceId) => ({ op: 'add', instanceId, productId: wc.id, atPoint: [0, 0, 0] })),
  resolve
);
assert.ok(batch.ok);
const state = batch.state,
  views = state.placedProducts.map((placed) => ({ placed, product: wc }));
const context = { room: state.dimensions, entries: buildEntries(views), utilityPoints: [] };
test('ranked repairs repeat exactly, resolve their finding, preview atomically and undo precisely', () => {
  const issue = runTechnicalAdvisor(context).find((f) => f.placementIssue === 'COLLISION')!;
  const fixes = smartFix(state, issue, catalog, resolve);
  assert.ok(fixes.length > 0 && fixes.length <= 3);
  assert.deepEqual(
    fixes.map((f) => f.operations),
    smartFix(state, issue, catalog, resolve).map((f) => f.operations)
  );
  for (const f of fixes) {
    assert.ok(f.eligible && f.validation?.issueResolved);
    assert.equal(f.validation!.introduced.length, 0);
    const h = createRoomHistory(state),
      p = previewRoomProposal(h, f, resolve);
    const next = applyRoomProposal({ ...h, proposal: p }, p);
    assert.equal(next.past.length, 1);
    assert.deepEqual(undoRoom(next).current, state);
    assert.deepEqual(redoRoom(undoRoom(next)).current, next.current);
  }
  assert.deepEqual(smartFix(state, { ...issue, affectedInstanceIds: [] }, catalog, resolve), []);
});
test('projection respects yaw, measured obstacles and missing figures', () => {
  const entry = { ...context.entries[0], placed: { ...views[0].placed, rotationY: Math.PI / 2 } };
  const result = frontSpace({ ...context, entries: [entry] }, entry)!;
  assert.ok(
    Math.abs(result.available - (state.dimensions.length / 2 - entry.placed.position[0] - wc.depth! / 2)) <
      1e-7
  );
  const obstacle = {
    ...context.entries[1],
    placed: {
      ...views[1].placed,
      position: [
        entry.placed.position[0] + wc.depth! + 0.1,
        entry.placed.position[1],
        entry.placed.position[2],
      ] as [number, number, number],
      rotationY: Math.PI / 2,
    },
  };
  assert.ok(Math.abs(frontSpace({ ...context, entries: [entry, obstacle] }, entry)!.available - 0.1) < 1e-8);
  assert.deepEqual(
    frontSpace(context, { ...entry, metadata: { ...entry.metadata, recommendedClearance: undefined } })!.zone,
    []
  );
  const square = [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 1, z: 1 },
      { x: 0, z: 1 },
    ],
    shifted = square.map((p) => ({ ...p, x: p.x + 1.4 }));
  assert.equal(area(intersection(square, shifted)), 0);
  assert.ok(Math.abs(footprintGap(square, shifted).distance - 0.4) < 1e-8);
});
test('threshold applies in world space, aligning centres without altering mounting height', () => {
  const [x, y, z] = views[1].placed.position;
  assert.deepEqual(snapPlacement(state, views, views[0], [x + 0.02, y, z + 0.2], 0.03).position, [
    x,
    y,
    z + 0.2,
  ]);
  assert.equal(snapPlacement(state, views, views[0], [x + 0.02, y, z + 0.2], 0.005).position[0], x + 0.02);
});
test('room quote reconciliation preserves manual, product-page, other-design and foreign rows', () => {
  const once = reconcileRoomQuote([], 'livlab', 'a', [wc], 'initial');
  const manual = { ...once[0], roomDesignId: undefined, sourceContext: undefined, quantity: 7 };
  const page = { ...manual, sourceContext: 'PRODUCT_DETAIL' };
  const foreign = { ...once[0], tenantId: 'other' };
  const previous = [manual, page, foreign, { ...once[0], roomDesignId: 'b' }, ...once];
  const next = reconcileRoomQuote(previous, 'livlab', 'a', [wc, wc, other], 'later');
  assert.deepEqual(next.slice(0, 4), previous.slice(0, 4));
  assert.equal(next[4].quantity, 2);
  assert.equal(next[4].addedAt, 'initial');
  assert.equal(reconcileRoomQuote(next, 'livlab', 'a', [wc, wc, other], 'again'), next);
  const interleaved = [next[4], manual, next[5], page, foreign];
  assert.equal(reconcileRoomQuote(interleaved, 'livlab', 'a', [wc, wc, other], 'again'), interleaved);
  const unpriced = { ...other, priceMin: undefined, priceMax: undefined };
  assert.equal(reconcileRoomQuote(next, 'livlab', 'a', [unpriced], 'later').at(-1)?.unpriced, true);
  assert.deepEqual(reconcileRoomQuote(next, 'livlab', 'a', [], 'later'), previous.slice(0, 4));
  const values = new Map<string, string>();
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    values.set('livlab_quote_items', JSON.stringify([manual, foreign]));
    saveQuoteItems(next.filter((i) => i !== foreign));
    assert.deepEqual(getQuoteItems('other'), JSON.parse(JSON.stringify([foreign])));
    addQuoteItem(manual);
    updateQuoteItemQty(quoteLineKey(next[4]), 3);
    removeQuoteItem(quoteLineKey(page));
    assert.equal(getQuoteItems().find((i) => quoteLineKey(i) === quoteLineKey(manual))?.quantity, 8);
    assert.equal(getQuoteItems().find((i) => quoteLineKey(i) === quoteLineKey(next[4]))?.quantity, 3);
    assert.deepEqual(getQuoteItems('other'), JSON.parse(JSON.stringify([foreign])));
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('replacing an oversize fixture requires a compatible catalogue entry with known dimensions', () => {
  const oversized = { ...wc, width: 4, depth: 4 };
  const resolveLarge = (id: string) => (id === oversized.id ? oversized : resolve(id));
  const room = {
    ...state,
    elements: [],
    placedProducts: [state.placedProducts[0]],
    targetBudget: 100_000_000,
  };
  const issue = runTechnicalAdvisor({
    room: room.dimensions,
    entries: buildEntries([{ placed: room.placedProducts[0], product: oversized }]),
    utilityPoints: [],
  }).find((f) => f.placementIssue === 'OUTSIDE_ROOM')!;
  assert.ok(issue);
  assert.deepEqual(smartFix(room, issue, [oversized], resolveLarge), []);
  const fixes = smartFix(room, issue, [oversized, other], resolveLarge);
  assert.ok(fixes.length);
  assert.ok(
    fixes.every(
      (p) =>
        p.operations.some((op) => op.op === 'replace' && op.productId === other.id) && p.budget?.difference
    )
  );
});

test('a wall fixture can change mounting wall when its current wall is all opening', () => {
  const shower = catalog.find((p) => p.sku === 'BFV-70S' && p.reconstruction)!;
  const initial = createInitialRoomState();
  const batch = applyRoomOperations(
    initial,
    [{ op: 'add', productId: shower.id, instanceId: 'shower' }],
    resolve
  );
  assert.ok(batch.ok);
  const placed = { ...batch.state.placedProducts[0], wall: 'back' as const };
  const room = {
    ...batch.state,
    placedProducts: [placed],
    elements: [
      {
        type: 'window' as const,
        id: 'opening',
        wall: 'back' as const,
        offset: 0,
        width: initial.dimensions.length,
        height: initial.dimensions.height,
        sill: 0,
        mechanism: 'fixed' as const,
        glazing: 'clear' as const,
        frame: 'ivory' as const,
        open: false,
      },
    ],
  };
  const issue = runTechnicalAdvisor({
    room: room.dimensions,
    entries: buildEntries([{ placed, product: shower }]),
    elements: room.elements,
    utilityPoints: [],
  }).find((f) => f.id.startsWith('mount-opening:'))!;
  assert.ok(issue);
  const repairs = smartFix(room, issue, [shower], resolve);
  assert.ok(
    repairs.some((p) => p.operations.some((op) => op.op === 'move' && op.wall && op.wall !== 'back'))
  );
});

test('verified clearance blocks new violations while unmeasured objects keep a clear-looking layout unverified', () => {
  const verified = { ...wc, source: { ...wc.source, verifiedFrontClearanceM: 0.4 } };
  const placed = state.placedProducts[0];
  const room = { ...state, elements: [], placedProducts: [placed] };
  const preview = previewRoomProposal(
    createRoomHistory(room),
    {
      source: 'smart-fix',
      label: 'test',
      intendedIssueId: 'none',
      operations: [
        {
          op: 'move',
          instanceId: placed.instanceId,
          position: [0, placed.position[1], room.dimensions.width / 2 - wc.depth! / 2],
        },
      ],
    },
    () => verified
  );
  assert.ok(preview.validation?.introduced.some((f) => f.placementIssue === 'CLEARANCE'));
  const entries = buildEntries([
    { placed, product: verified },
    { placed: state.placedProducts[1], product: { ...other, depth: undefined } },
  ]);
  assert.ok(
    runTechnicalAdvisor({ ...context, entries }).some(
      (f) => f.id === 'clearance:' + placed.instanceId && f.reason === 'MISSING_DATA'
    )
  );
});

test('resetting a linked room clears just its products and history restores design identity', () => {
  const room = { ...state, quoteDesignId: 'linked' };
  const history = createRoomHistory(room);
  const p = previewRoomProposal(
    history,
    { source: 'demo', label: 'reset', operations: [{ op: 'reset' }] },
    resolve
  );
  assert.ok(p.eligible);
  assert.equal(p.preview?.quoteDesignId, 'linked');
  const changed = applyRoomProposal({ ...history, proposal: p }, p);
  assert.equal(changed.current.placedProducts.length, 0);
  assert.equal(undoRoom(changed).previous, changed.current);
  assert.equal(undoRoom(changed).current, room);
});

test('a narrow room can require splitting the separation between both fixtures', () => {
  const square = { ...wc, width: 0.66, depth: 0.66 };
  const room = { ...state, elements: [], dimensions: { length: 1.4, width: 1, height: 2.7 } };
  const entries = buildEntries(room.placedProducts.map((placed) => ({ placed, product: square })));
  const issue = runTechnicalAdvisor({ ...context, room: room.dimensions, entries }).find(
    (f) => f.placementIssue === 'COLLISION'
  )!;
  const options = smartFix(room, issue, [square], () => square);
  assert.ok(options.length);
  assert.ok(options.every((p) => p.operations.length === 2 && p.validation?.issueResolved));
});
test('Smart Fix can clear a front-space obstruction by rotating in place', () => {
  const room = {
    ...state,
    elements: [],
    placedProducts: [
      { ...state.placedProducts[0], position: [0, wc.height! / 2, 0.6] as [number, number, number] },
    ],
  };
  const entries = buildEntries(room.placedProducts.map((placed) => ({ placed, product: wc })));
  const issue = runTechnicalAdvisor({ ...context, room: room.dimensions, entries }).find(
    (f) => f.placementIssue === 'CLEARANCE'
  )!;
  assert.ok(smartFix(room, issue, [wc], resolve).some((p) => p.operations.some((op) => op.op === 'rotate')));
});

test('showroom transaction retains separate manual and linked lines, canonical prices and unknown estimates', async () => {
  const require = createRequire(import.meta.url);
  const restore: Array<() => void> = [];
  // Substitute just the two I/O boundaries of the real public quote service.
  function substitute(path: string, exports: unknown) {
    const key = require.resolve(path);
    const prior = require.cache[key];
    const stub = new Module(key);
    stub.exports = exports;
    stub.loaded = true;
    require.cache[key] = stub;
    restore.push(() => {
      if (prior) require.cache[key] = prior;
      else delete require.cache[key];
    });
  }
  type Lead = {
    sourceTenantId: string;
    estimatedValue: number | null;
    budgetFit: string;
    contextJson: {
      unpricedCount: number;
      catalogLines: Array<{ roomDesignId?: string; priceSnapshot: number | null }>;
    };
    items: { create: Array<{ priceMin: number | null; quantity: number }> };
  };
  const leads: Lead[] = [];
  const tx = {
    $executeRaw: async () => 0,
    quoteLead: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async ({ data }: { data: Lead }) => {
        leads.push(data);
        return { id: 'test', requestCode: 'test' };
      },
    },
  };
  const servicePath = require.resolve('../lib/showroom/publicQuoteService');
  try {
    substitute('../lib/prisma', {
      prisma: { quoteLead: tx.quoteLead, $transaction: (run: (t: typeof tx) => unknown) => run(tx) },
    });
    substitute('../lib/storefront/catalog', {
      getCatalog: async () => ({
        products: [{ id: wc.id, catalogProductId: 'fixture', showroomPrice: 120, referencePrice: 150 }],
      }),
    });
    const { createPublicQuoteRequest } =
      require(servicePath) as typeof import('../lib/showroom/publicQuoteService');
    const roomLine = {
      productId: wc.id,
      sourceContext: 'ROOM_DESIGN',
      roomDesignId: 'design-a',
      tenantId: 'livlab',
      priceMin: 1,
      quantity: 2,
    };
    const payload = {
      customerName: 'Local QA',
      phone: '0900000000',
      budgetMax: 1000,
      items: [
        { productId: wc.id, quantity: 1 },
        roomLine,
        { productId: 'unknown', unpriced: true, priceMin: 0, priceMax: 0 },
      ],
    };
    await createPublicQuoteRequest(TENANTS.livlab, payload);
    const lead = leads[0];
    assert.equal(lead.sourceTenantId, 'livlab');
    assert.deepEqual(
      lead.contextJson.catalogLines.map((l) => l.roomDesignId),
      [undefined, 'design-a', undefined]
    );
    assert.deepEqual(
      lead.items.create.map((l) => [l.quantity, l.priceMin]),
      [
        [1, 120],
        [2, 120],
        [1, null],
      ]
    );
    assert.equal(lead.contextJson.unpricedCount, 1);
    assert.equal(lead.budgetFit, 'UNKNOWN');
    await createPublicQuoteRequest(TENANTS.livlab, { ...payload, items: [payload.items[2]] });
    assert.equal(leads[1].estimatedValue, null);
    await assert.rejects(
      createPublicQuoteRequest(TENANTS.livlab, { ...payload, items: [{ ...roomLine, tenantId: 'foreign' }] }),
      { code: 'TENANT_MISMATCH' }
    );
    assert.equal(leads.length, 2);
  } finally {
    delete require.cache[servicePath];
    restore.reverse().forEach((fn) => fn());
  }
});
