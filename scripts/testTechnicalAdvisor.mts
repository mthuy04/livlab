/**
 * Unit tests for the Technical Advisor rule engine.
 *
 * Run with:  npm run test:technical
 *
 * Deliberately a plain script rather than a new test framework: the repository
 * has no test runner, and adding Jest or Vitest purely for this feature would
 * be a larger change than the feature itself. The rules are pure functions, so
 * a script is enough to exercise every branch — which is exactly why they were
 * written as pure functions.
 */

import { runTechnicalAdvisor } from '../lib/technical-advisor/engine';
import type {
  TechnicalContext,
  TechnicalProductEntry,
  TechnicalSeverity,
  TechnicalValidationResult,
  UtilityPoint,
} from '../lib/technical-advisor/types';
import type { ProductTechnicalMetadata } from '../lib/technical-advisor/productTechnicalMetadata';
import type { RoomStudioProduct } from '../lib/room-studio/productAdapter';
import type { PlacedProduct } from '../lib/room-studio/roomState';
import type { PlacementType, Vec3 } from '../lib/room-studio/placementRules';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ''}`);
  }
}

const ROOM = { length: 3, width: 2, height: 2.7 };

function entry(options: {
  id: string;
  name?: string;
  position: Vec3;
  rotationY?: number;
  placementType?: PlacementType;
  wall?: 'back' | 'left' | 'right';
  metadata?: Partial<ProductTechnicalMetadata>;
}): TechnicalProductEntry {
  const placed: PlacedProduct = {
    instanceId: options.id,
    productId: options.id,
    position: options.position,
    rotationY: options.rotationY ?? 0,
    placementType: options.placementType ?? 'floor',
    wall: options.wall,
  };
  const product = {
    id: options.id,
    name: options.name ?? options.id,
    category: 'test',
    normalizedCategory: 'toilet',
    placementType: options.placementType ?? 'floor',
    source: {},
  } as unknown as RoomStudioProduct;

  const metadata: ProductTechnicalMetadata = {
    width: 0.4,
    depth: 0.4,
    height: 0.8,
    dimensionsOrigin: 'CATALOGUE',
    placementType: 'FLOOR',
    placementOrigin: 'CURATED_DEMO',
    clearanceOrigin: 'MISSING',
    plumbingOrigin: 'MISSING',
    ...options.metadata,
  };

  return { placed, product, metadata };
}

function run(entries: TechnicalProductEntry[], utilityPoints: UtilityPoint[] = []): TechnicalValidationResult[] {
  const context: TechnicalContext = { room: ROOM, entries, utilityPoints };
  return runTechnicalAdvisor(context);
}

const find = (results: TechnicalValidationResult[], ruleId: string, instanceId?: string) =>
  results.find((r) => r.ruleId === ruleId && (!instanceId || r.affectedInstanceIds.includes(instanceId)));

const severityOf = (results: TechnicalValidationResult[], ruleId: string, instanceId?: string):
  | TechnicalSeverity
  | undefined => find(results, ruleId, instanceId)?.severity;

// ─── ROOM BOUNDS ──────────────────────────────────────────────────────────────
console.log('\nROOM BOUNDS');
{
  const inside = run([entry({ id: 'a', position: [0, 0.4, 0] })]);
  check('product fully inside room -> SUITABLE', severityOf(inside, 'room-bounds', 'a') === 'SUITABLE');

  // Room half-length is 1.5; a 0.4-wide product centred at 1.45 pokes out by 0.15.
  const outside = run([entry({ id: 'a', position: [1.45, 0.4, 0] })]);
  check('product partially outside -> VERIFY', severityOf(outside, 'room-bounds', 'a') === 'VERIFY');
  check(
    'breach message names the overshoot',
    (find(outside, 'room-bounds', 'a')?.message ?? '').includes('15 cm'),
    find(outside, 'room-bounds', 'a')?.message
  );

  // No dimensions at all: nothing is checkable, so the rule must decline.
  const noDims = run([
    entry({
      id: 'a',
      position: [0, 0.4, 0],
      metadata: { width: undefined, depth: undefined, height: undefined, dimensionsOrigin: 'MISSING' },
    }),
  ]);
  check('no dimensions at all -> VERIFY, never a pass', severityOf(noDims, 'room-bounds', 'a') === 'VERIFY');
  check('no dimensions at all -> MISSING_DATA reason', find(noDims, 'room-bounds', 'a')?.reason === 'MISSING_DATA');
  check('no dimensions at all -> dataSource UNKNOWN', find(noDims, 'room-bounds', 'a')?.dataSource === 'UNKNOWN');

  // Partially known: check what is knowable, and be explicit about the rest
  // rather than declining the whole check.
  const partial = run([
    entry({ id: 'a', position: [0, 0.4, 0], metadata: { width: undefined, dimensionsOrigin: 'MISSING' } }),
  ]);
  const partialFinding = find(partial, 'room-bounds', 'a');
  check('partial dimensions -> still checks the known axes', partialFinding?.severity === 'SUITABLE');
  check('partial dimensions -> flagged MISSING_DATA', partialFinding?.reason === 'MISSING_DATA');
  check('partial dimensions -> not claimed as measured geometry', partialFinding?.dataSource === 'UNKNOWN');
  check(
    'partial dimensions -> title says it is partial',
    (partialFinding?.title ?? '').includes('một phần'),
    partialFinding?.title
  );

  // A partially-known product that genuinely breaches on a KNOWN axis must
  // still be reported — partial checking must not become a free pass.
  const partialBreach = run([
    entry({
      id: 'a',
      position: [0, 2.5, 0],
      metadata: { width: undefined, depth: undefined, height: 0.8, dimensionsOrigin: 'MISSING' },
    }),
  ]);
  check(
    'partial dimensions still catch a breach on a known axis',
    severityOf(partialBreach, 'room-bounds', 'a') === 'VERIFY'
  );
}

// Rotation is the reason this rule exists separately from the drag clamp.
console.log('\nROOM BOUNDS — rotation awareness');
{
  // 1.2 wide x 0.3 deep, centred 0.55 from the right wall.
  // Unrotated: half-width 0.6 -> reaches 1.55 > 1.5, outside.
  const wide = { width: 1.2, depth: 0.3, height: 0.5 };
  const unrotated = run([entry({ id: 'a', position: [0.95, 0.25, 0], metadata: wide })]);
  check('wide product unrotated -> VERIFY', severityOf(unrotated, 'room-bounds', 'a') === 'VERIFY');

  // Rotated 90 degrees the same product is only 0.3 wide -> comfortably inside.
  const rotated = run([
    entry({ id: 'a', position: [0.95, 0.25, 0], rotationY: Math.PI / 2, metadata: wide }),
  ]);
  check('same product rotated 90 deg -> SUITABLE', severityOf(rotated, 'room-bounds', 'a') === 'SUITABLE');
}

// ─── COLLISION ────────────────────────────────────────────────────────────────
console.log('\nCOLLISION');
{
  const apart = run([
    entry({ id: 'a', position: [-1, 0.4, 0] }),
    entry({ id: 'b', position: [1, 0.4, 0] }),
  ]);
  check('separated products -> no collision finding', !find(apart, 'collision', 'a'));
  check('separated products -> summary SUITABLE', severityOf(apart, 'collision') === 'SUITABLE');

  const overlapping = run([
    entry({ id: 'a', position: [0, 0.4, 0] }),
    entry({ id: 'b', position: [0.05, 0.4, 0.05] }),
  ]);
  check('obvious overlap -> VERIFY', severityOf(overlapping, 'collision', 'a') === 'VERIFY');

  // Touching is normal (a basin on a vanity) and must not be reported.
  const touching = run([
    entry({ id: 'a', position: [0, 0.4, 0] }),
    entry({ id: 'b', position: [0.41, 0.4, 0] }),
  ]);
  check('products merely touching -> no collision', !find(touching, 'collision', 'a'));
}

// ─── CLEARANCE ────────────────────────────────────────────────────────────────
console.log('\nCLEARANCE');
{
  // Room half-width is 1.0. Product depth 0.4 centred at z=-0.5 -> front face at
  // -0.3, so 1.3m of run. Recommended 0.6 -> plenty.
  const roomy = run([
    entry({
      id: 'a',
      position: [0, 0.4, -0.5],
      metadata: { recommendedClearance: { front: 0.6 }, clearanceOrigin: 'CURATED_DEMO' },
    }),
  ]);
  check('enough space -> SUITABLE', severityOf(roomy, 'clearance', 'a') === 'SUITABLE');

  // Front face at 0.75, only 0.25m of run left.
  const tight = run([
    entry({
      id: 'a',
      position: [0, 0.4, 0.55],
      metadata: { recommendedClearance: { front: 0.6 }, clearanceOrigin: 'CURATED_DEMO' },
    }),
  ]);
  check('insufficient space -> OPTIMIZE', severityOf(tight, 'clearance', 'a') === 'OPTIMIZE');
  check(
    'insufficient space message quotes both figures',
    (find(tight, 'clearance', 'a')?.message ?? '').includes('60 cm')
  );

  const noRule = run([entry({ id: 'a', position: [0, 0.4, 0] })]);
  check('missing clearance data -> VERIFY, never assumed', severityOf(noRule, 'clearance', 'a') === 'VERIFY');
  check('missing clearance data -> dataSource UNKNOWN', find(noRule, 'clearance', 'a')?.dataSource === 'UNKNOWN');

  // Products lacking a clearance figure are reported once, not once each.
  const manyWithoutData = run([
    entry({ id: 'a', position: [-1, 0.4, 0] }),
    entry({ id: 'b', position: [0, 0.4, 0] }),
    entry({ id: 'c', position: [1, 0.4, 0] }),
  ]);
  const clearanceFindings = manyWithoutData.filter((r) => r.ruleId === 'clearance');
  check('missing clearance data aggregates into one finding', clearanceFindings.length === 1, clearanceFindings.length);
  check(
    'aggregated clearance finding still names every affected product',
    clearanceFindings[0]?.affectedInstanceIds.length === 3
  );
}

// ─── PLACEMENT SURFACE ────────────────────────────────────────────────────────
console.log('\nPLACEMENT SURFACE');
{
  const onFloor = run([entry({ id: 'a', position: [0, 0.4, 0] })]);
  check('floor product on the floor -> SUITABLE', severityOf(onFloor, 'placement-surface', 'a') === 'SUITABLE');

  const floating = run([entry({ id: 'a', position: [0, 1.2, 0] })]);
  check('floor product floating -> VERIFY', severityOf(floating, 'placement-surface', 'a') === 'VERIFY');

  // Back wall is z = -1. Product depth 0.1 centred at -0.95 sits flush.
  const onWall = run([
    entry({
      id: 'a',
      position: [0, 1.5, -0.95],
      placementType: 'wall',
      wall: 'back',
      metadata: { placementType: 'WALL', depth: 0.1, width: 0.6, height: 0.8 },
    }),
  ]);
  check('wall product against its wall -> SUITABLE', severityOf(onWall, 'placement-surface', 'a') === 'SUITABLE');

  const offWall = run([
    entry({
      id: 'a',
      position: [0, 1.5, 0.5],
      placementType: 'wall',
      wall: 'back',
      metadata: { placementType: 'WALL', depth: 0.1, width: 0.6, height: 0.8 },
    }),
  ]);
  check('wall product away from wall -> VERIFY', severityOf(offWall, 'placement-surface', 'a') === 'VERIFY');

  const unknownPlacement = run([
    entry({ id: 'a', position: [0, 0.4, 0], metadata: { placementType: 'UNKNOWN' } }),
  ]);
  check('unknown placement type -> VERIFY', severityOf(unknownPlacement, 'placement-surface', 'a') === 'VERIFY');

  // An inferred placement must not be presented as a confirmed pass.
  const inferred = run([
    entry({ id: 'a', position: [0, 0.4, 0], metadata: { placementOrigin: 'INFERRED' } }),
  ]);
  check('inferred placement -> VERIFY not SUITABLE', severityOf(inferred, 'placement-surface', 'a') === 'VERIFY');
  check('inferred placement -> reason INFERRED_DATA', find(inferred, 'placement-surface', 'a')?.reason === 'INFERRED_DATA');
}

// ─── PLUMBING ─────────────────────────────────────────────────────────────────
console.log('\nPLUMBING');
{
  const needsDrain = {
    plumbing: { requiresDrain: true },
    plumbingOrigin: 'CURATED_DEMO' as const,
  };

  const noPoints = run([entry({ id: 'a', position: [0, 0.4, 0], metadata: needsDrain })]);
  check('requires drain, no room data -> VERIFY', severityOf(noPoints, 'plumbing-point', 'a') === 'VERIFY');
  check('requires drain, no room data -> MISSING_DATA', find(noPoints, 'plumbing-point', 'a')?.reason === 'MISSING_DATA');
  check(
    'requires drain, no room data -> needs a human',
    find(noPoints, 'plumbing-point', 'a')?.requiresHumanVerification === true
  );

  const nearPoint: UtilityPoint = { id: 'p1', type: 'DRAIN', position: [0.2, 0, 0.1] };
  const near = run([entry({ id: 'a', position: [0, 0.4, 0], metadata: needsDrain })], [nearPoint]);
  check('drain point nearby -> SUITABLE', severityOf(near, 'plumbing-point', 'a') === 'SUITABLE');
  check('drain point nearby -> sourced from utility point', find(near, 'plumbing-point', 'a')?.dataSource === 'ROOM_UTILITY_POINT');

  const farPoint: UtilityPoint = { id: 'p1', type: 'DRAIN', position: [1.4, 0, 0.9] };
  const far = run([entry({ id: 'a', position: [-1.2, 0.4, -0.8] })].map((e) => ({
    ...e,
    metadata: { ...e.metadata, ...needsDrain },
  })), [farPoint]);
  check('drain point far away -> VERIFY, never "impossible"', severityOf(far, 'plumbing-point', 'a') === 'VERIFY');
  check(
    'far drain message avoids declaring it unusable',
    !(find(far, 'plumbing-point', 'a')?.message ?? '').includes('không thể')
  );

  const wrongType = run([entry({ id: 'a', position: [0, 0.4, 0], metadata: needsDrain })], [
    { id: 'p1', type: 'ELECTRICAL', position: [0.1, 0, 0.1] },
  ]);
  check('only an unrelated point declared -> VERIFY', severityOf(wrongType, 'plumbing-point', 'a') === 'VERIFY');

  const noRequirement = run([
    entry({ id: 'a', position: [0, 0.4, 0], metadata: { plumbing: {}, plumbingOrigin: 'CURATED_DEMO' } }),
  ]);
  check('metadata says nothing needed -> SUITABLE', severityOf(noRequirement, 'plumbing-point', 'a') === 'SUITABLE');

  const unknownPlumbing = run([entry({ id: 'a', position: [0, 0.4, 0] })]);
  check('no plumbing metadata -> VERIFY', severityOf(unknownPlumbing, 'plumbing-point', 'a') === 'VERIFY');
}

// ─── DATA COMPLETENESS ────────────────────────────────────────────────────────
console.log('\nDATA COMPLETENESS');
{
  const partial = run([entry({ id: 'a', position: [0, 0.4, 0] })]);
  check('missing plumbing metadata -> data incomplete VERIFY', severityOf(partial, 'technical-data') === 'VERIFY');

  const complete = run([
    entry({
      id: 'a',
      position: [0, 0.4, 0],
      metadata: { plumbing: { requiresDrain: true }, plumbingOrigin: 'CURATED_DEMO' },
    }),
  ]);
  check('full metadata -> data complete SUITABLE', severityOf(complete, 'technical-data') === 'SUITABLE');
}

// ─── ENGINE BEHAVIOUR ─────────────────────────────────────────────────────────
console.log('\nENGINE');
{
  const empty = run([]);
  check('empty room produces no crash', Array.isArray(empty));

  const mixed = run([
    entry({ id: 'a', position: [1.45, 0.4, 0] }),
    entry({ id: 'b', position: [-1, 0.4, 0] }),
  ]);
  const severities = mixed.map((r) => r.severity);
  const firstSuitable = severities.indexOf('SUITABLE');
  const lastVerify = severities.lastIndexOf('VERIFY');
  check(
    'findings sorted most actionable first',
    firstSuitable === -1 || lastVerify === -1 || lastVerify < firstSuitable,
    severities
  );

  const focused = runTechnicalAdvisor({
    room: ROOM,
    entries: [entry({ id: 'a', position: [0, 0.4, 0] }), entry({ id: 'b', position: [-1, 0.4, 0] })],
    utilityPoints: [],
    focusInstanceId: 'a',
  });
  check(
    'focus filters out other products',
    !focused.some((r) => r.ruleId === 'room-bounds' && r.affectedInstanceIds.includes('b'))
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
