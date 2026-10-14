/**
 * Locks the conversion pipeline's contract.
 *
 * None of this can test Blender — Blender is not installed, and these tests
 * must keep passing whether it is or not. What they CAN test is everything
 * that decides whether a conversion should be attempted, what it is judged
 * against, and what may follow it. Those are the decisions that turn a bad
 * file into a published product, and they are all pure functions.
 *
 * Run with:  npm run test:3d-pipeline
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  SUPPORTED_INPUT_FORMATS,
  blockers,
  resolveSku,
  runtimeUrl,
  sourceStem,
  masterPath,
  reportPath,
  WORKSPACE,
} from './3d/pipeline';
import { allProduct3DAssets } from '../lib/room-studio/product3dRegistry';
import {
  isRoomStudioReady,
  performanceTargetFor,
  PERFORMANCE_CATEGORY_FOR_PLACEMENT,
  QA_CHECKS,
} from '../lib/room-studio/product3dAsset';
import { needsDimensionReview, DIMENSION_REVIEW_REQUIRED } from '../lib/room-studio/dimensionReview';
import { availableProductModels } from '../lib/livlabProductModels';

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

/* ------------------------------------------------------- A. the six records */

console.log('\nA. sau INAX record (§65)');

const assets = allProduct3DAssets();
const skus = assets.map((a) => a.sku).sort();
check(
  'dung sau SKU, khong thieu khong thua',
  JSON.stringify(skus) ===
    JSON.stringify(['AC-1008VRN', 'AC-1017VRN', 'AC-1035VN', 'AC-1135VN', 'AC-2700VN', 'AC-4005VN']),
  skus
);
check('tat ca con o SOURCE_VERIFIED', assets.every((a) => a.status === 'SOURCE_VERIFIED'));
check('khong asset nao co glbUrl', assets.every((a) => !a.runtime.glbUrl));
check('READY = 0', assets.filter(isRoomStudioReady).length === 0);
check(
  'moi asset deu co du ba chieu cua hang',
  assets.every((a) => a.dimensionsMm.width && a.dimensionsMm.depth && a.dimensionsMm.height)
);

// §66: the two SKUs whose 3D section exists but carries no file must not have
// crept into the registry as if a source had been found.
check(
  'AC-912VN va AC-900VRN-2 KHONG nam trong registry (§66)',
  !skus.includes('AC-912VN') && !skus.includes('AC-900VRN-2'),
  skus
);
const audit = JSON.parse(readFileSync('data/demo/manufacturer-3d-source-audit.json', 'utf8'));
const unavailable = (audit.activeCatalog ?? []).filter((e: { sku: string }) =>
  ['AC-912VN', 'AC-900VRN-2'].includes(e.sku)
);
check(
  'ho van duoc ghi nhan la "co muc 3D nhung khong co file"',
  unavailable.length === 2 &&
    unavailable.every((e: { rows: Array<{ sectionType: string; present: boolean }> }) =>
      e.rows.some((r) => r.sectionType === 'THREE_D' && r.present === false)
    ),
  unavailable.length
);

/* ------------------------------------------------- B. what blocks a convert */

console.log('\nB. dieu kien chan (§67)');

const pilot = resolveSku('AC-1017VRN');
check('tra cuu SKU hoat dong', pilot !== null);
check('AC-1017VRN khong bi chan', blockers(pilot!).length === 0, blockers(pilot!));

// §67: the disputed row must be refused by the same gate, for a stated reason.
check('BFV-655T-8C nam trong danh sach can xac minh', needsDimensionReview('BFV-655T-8C'));
check('khong phan biet hoa thuong', needsDimensionReview('bfv-655t-8c'));
check('SKU binh thuong khong bi gan co', !needsDimensionReview('AC-1017VRN'));
check(
  'ly do duoc viet ra, khong chi la mot co',
  DIMENSION_REVIEW_REQUIRED.every((r) => r.reason.length > 40 && r.resolution.length > 20)
);
// The catalogue value is recorded verbatim — the point is that nothing here
// corrects it.
check(
  'gia tri danh muc duoc chep nguyen, khong sua',
  DIMENSION_REVIEW_REQUIRED[0].catalogueValue === '575 x 1176 x 450 mm'
);

const fakeBlocked = blockers({
  ...pilot!,
  sku: 'BFV-655T-8C',
  qa: { ...pilot!.qa },
});
check('asset co SKU dang tranh chap thi bi chan', fakeBlocked.some((b) => b.startsWith('DIMENSION_REVIEW_REQUIRED')), fakeBlocked);

const noIdentity = blockers({ ...pilot!, qa: { ...pilot!.qa, identityVerified: false } });
check('chua xac minh danh tinh thi bi chan', noIdentity.some((b) => b.startsWith('IDENTITY_NOT_VERIFIED')));

const noDims = blockers({ ...pilot!, dimensionsMm: { width: 400 } });
check('thieu kich thuoc hang thi bi chan', noDims.some((b) => b.startsWith('MISSING_OFFICIAL_DIMENSIONS')));

/* ------------------------------------------------------------ C. the paths */

console.log('\nC. duong dan va dinh dang (§8, §71)');

check('ten file nguon dung quy uoc', sourceStem(pilot!) === 'inax_ac-1017vrn_source');
check(
  'url runtime co so phien ban (§71)',
  runtimeUrl(pilot!) === '/assets/3d/inax/ac-1017vrn/v1/runtime.glb',
  runtimeUrl(pilot!)
);
check('phien ban sau doi url', runtimeUrl(pilot!, 2).includes('/v2/'), runtimeUrl(pilot!, 2));
check(
  'dinh dang nhan dung bon loai (§12)',
  JSON.stringify([...SUPPORTED_INPUT_FORMATS]) === JSON.stringify(['.fbx', '.obj', '.gltf', '.glb'])
);
check('master nam trong workspace, khong nam trong public', masterPath(pilot!).includes('assets/3d/work/normalized'));
check('bao cao nam trong reports', reportPath(pilot!).includes('assets/3d/work/reports'));

// §74: raw sources must not be committable.
const ignore = readFileSync('.gitignore', 'utf8');
check('incoming/ bi gitignore', ignore.includes('assets/3d/work/incoming/'));
check('normalized/ bi gitignore', ignore.includes('assets/3d/work/normalized/'));
check('reports/ KHONG bi gitignore', !ignore.includes('assets/3d/work/reports/'));

/* ----------------------------------------------------- D. performance gates */

console.log('\nD. nguong hieu nang (§33)');

const toiletTarget = performanceTargetFor('FLOOR_TOILET');
check('FLOOR_TOILET -> ngan sach TOILET', PERFORMANCE_CATEGORY_FOR_PLACEMENT.FLOOR_TOILET === 'TOILET');
check('toilet: 20k-60k tam giac', JSON.stringify(toiletTarget?.triangles) === '[20000,60000]', toiletTarget);
check('toilet: toi da 3MB', toiletTarget?.maxBytes === 3_000_000, toiletTarget?.maxBytes);
check(
  'moi placement type deu co ngan sach',
  Object.keys(PERFORMANCE_CATEGORY_FOR_PLACEMENT).every((p) => performanceTargetFor(p as never) !== null)
);

/* ------------------------------------------------------- E. the state today */

console.log('\nE. trang thai hom nay (§81, §82)');

check('workspace incoming/ ton tai', existsSync(WORKSPACE.incoming));
check('workspace reports/ ton tai', existsSync(WORKSPACE.reports));
check(
  'chua co file nguon nao cho pilot — WAITING_FOR_REAL_FBX',
  !SUPPORTED_INPUT_FORMATS.some((ext) => existsSync(path.join(WORKSPACE.incoming, sourceStem(pilot!) + ext)))
);
check('chua co master GLB', !existsSync(masterPath(pilot!)));
check(
  'chua co runtime GLB trong public',
  !existsSync(path.join('public', runtimeUrl(pilot!).replace(/^\//, '')))
);
check('khong co model dung chung nao duoc bat', Object.values(availableProductModels).every((v) => v === false));
check('bo bay co QA van nguyen ven', QA_CHECKS.length === 7);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
