/**
 * Locks the dev GLB pipeline harness, and locks it OUT of the storefront.
 *
 * Two jobs. The first is ordinary: the generated fixture must be the size it
 * claims, with the origin the ingestion contract specifies, or the harness is
 * testing the wrong thing. The second matters more: a synthetic mesh that
 * leaked into the catalogue would be exactly the failure the whole asset
 * pipeline exists to prevent — a customer shown geometry that is not the
 * product they are buying. Several of the tests below assert an absence, which
 * is the only kind of proof that is worth anything here.
 *
 * Run with:  npm run test:dev-glb
 */

import { existsSync } from 'node:fs';
import { inspectGlb, dimensionError } from './lib/glbMetrics.mjs';
import {
  createDevTestProduct,
  DEV_TEST_ASSET_ID,
  DEV_TEST_FIXTURE_MM,
  DEV_TEST_FIXTURE_URL,
} from '../lib/room-studio/devTestAsset';
import { getProduct3DAsset, allProduct3DAssets, hasReadyAssetForKeys } from '../lib/room-studio/product3dRegistry';
import { isRoomStudioReady, checkDimensions, DIMENSION_ERROR_PREFERRED_PCT } from '../lib/room-studio/product3dAsset';
import { getModelMetadata, hasSkuMasterModel } from '../lib/room-studio/modelMetadata';
import { availableProductModels, productModelMap } from '../lib/livlabProductModels';
import { getRealWorldSize, resolveModelScale } from '../lib/room-studio/assetResolver';
import { getDefaultPlacement, clampToRoom } from '../lib/room-studio/placementRules';
import { getRoomBounds } from '../lib/room-studio/roomGeometry';
import { isPlaceable } from '../lib/room-studio/productCapability';
import type { Product } from '../lib/types';

const GLB_PATH = 'public/dev-assets/3d/test-fixture.glb';
const ROOM = { length: 2, width: 1.6, height: 2.4 };

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

const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

/* ------------------------------------------------------- A. the file itself */

console.log('\nA. file kiem thu');

if (!existsSync(GLB_PATH)) {
  console.log(`  FAIL  thieu ${GLB_PATH} — chay: node scripts/build_dev_test_glb.mjs`);
  process.exit(1);
}

const metrics = await inspectGlb(GLB_PATH);
check('doc duoc GLB', metrics.inspected === true, metrics.error);

const actualMm = {
  width: Math.round(metrics.bboxUnits!.x * 1000),
  depth: Math.round(metrics.bboxUnits!.z * 1000),
  height: Math.round(metrics.bboxUnits!.y * 1000),
};

check(
  `bbox = ${DEV_TEST_FIXTURE_MM.width} x ${DEV_TEST_FIXTURE_MM.depth} x ${DEV_TEST_FIXTURE_MM.height} mm`,
  actualMm.width === DEV_TEST_FIXTURE_MM.width &&
    actualMm.depth === DEV_TEST_FIXTURE_MM.depth &&
    actualMm.height === DEV_TEST_FIXTURE_MM.height,
  actualMm
);

// §39: primitive QA geometry. A multi-MB fixture would mean something went
// badly wrong in the generator, and would also make the loading test lie.
check(`file nho (${metrics.fileSizeBytes} bytes < 64KB)`, metrics.fileSizeBytes < 64 * 1024, metrics.fileSizeBytes);
check(`it tam giac (${metrics.triangleCount} < 500)`, (metrics.triangleCount ?? 0) < 500, metrics.triangleCount);
check('khong co texture', metrics.textureCount === 0, metrics.textureCount);
check('co 2 vat lieu (§21)', metrics.materialCount === 2, metrics.materialCount);
check('mot scene, mot node', metrics.sceneCount === 1 && metrics.nodeCount === 1, {
  scenes: metrics.sceneCount,
  nodes: metrics.nodeCount,
});

/* ------------------------------------------- B. origin / axes / orientation */

console.log('\nB. goc toa do va huong (§2, §14, §15)');

const [minX, minY, minZ] = metrics.bboxMin!;
const [maxX, maxY, maxZ] = metrics.bboxMax!;

check('day o Y = 0 (khong chim duoi san)', near(minY, 0, 1e-4), minY);
check('mat sau o Z = 0 (mat lap dat)', near(minZ, 0, 1e-4), minZ);
check('can giua theo X', near(minX, -maxX, 1e-4), { minX, maxX });
check('mat truoc o +Z', maxZ > 0 && near(maxZ, DEV_TEST_FIXTURE_MM.depth / 1000, 1e-4), maxZ);
check('cao len theo +Y', near(maxY, DEV_TEST_FIXTURE_MM.height / 1000, 1e-4), maxY);

/* ------------------------------------------------- C. the two error formulas */

console.log('\nC. cong thuc sai so (§12)');

const fromScript = dimensionError(DEV_TEST_FIXTURE_MM, actualMm);
const fromApp = checkDimensions(DEV_TEST_FIXTURE_MM, actualMm);

check('sai so = 0%', fromScript.worstPct === 0, fromScript);
// The build script and the app each own a copy of this arithmetic (one is an
// .mjs build tool, one is TypeScript in the bundle). They must agree, so the
// test compares them rather than trusting the comment that says they match.
check(
  'script va app tinh sai so giong nhau',
  near(fromScript.worstPct, fromApp.worstErrorPct ?? -1, 1e-6),
  { script: fromScript.worstPct, app: fromApp.worstErrorPct }
);
check('dat nguong uu tien', (fromApp.worstErrorPct ?? 99) <= DIMENSION_ERROR_PREFERRED_PCT);

// A mesh that is genuinely wrong must still be caught.
const wrong = checkDimensions(DEV_TEST_FIXTURE_MM, { width: 440, depth: 800, height: 600 });
check('lech 10% bi danh truot', wrong.passes === false, wrong.worstErrorPct);

/* ----------------------------------------- D. world units and runtime scale */

console.log('\nD. don vi the gioi (§13)');

const devProduct = createDevTestProduct();
const size = getRealWorldSize(devProduct);

check(
  'kich thuoc thuc = 0.4 x 0.8 x 0.6 m',
  near(size.width, 0.4) && near(size.depth, 0.8) && near(size.height, 0.6),
  size
);
check('duoc danh dau la day du ba chieu', size.exact === true);

// The renderer scales a loaded mesh so its LARGEST axis matches the product's
// largest real-world axis. A file already authored in metres must come out at
// exactly 1, or "1 unit = 1 metre" is not true of this pipeline.
const scale = resolveModelScale(devProduct, { x: 0.4, y: 0.6, z: 0.8 });
check('he so scale = 1.000000 (file da o don vi met)', near(scale, 1, 1e-9), scale);

// And the same mesh authored in millimetres must be rescued by the same path.
const asMillimetres = resolveModelScale(devProduct, { x: 400, y: 600, z: 800 });
check('file ve o mm van ra dung kich thuoc', near(asMillimetres, 0.001, 1e-9), asMillimetres);

/* --------------------------------------------- E. placement, pivot, rotation */

console.log('\nE. dat trong phong (§14, §16, §17)');

const placement = getDefaultPlacement({ dimensions: ROOM, size, placementType: 'floor' }, 'toilet', 0);
const bounds = getRoomBounds(ROOM);

const floorGap = placement.position[1] - size.height / 2;
check('day cham san (khong lo lung, khong lun)', near(floorGap, 0, 1e-9), floorGap);

const rearFace = placement.position[2] - size.depth / 2;
check('mat sau sat tuong trong (CLEARANCE 20mm)', near(rearFace - bounds.minZ, 0.02, 1e-9), rearFace - bounds.minZ);
check('khong xoay khi dat mac dinh', placement.rotationY === 0);

// §17: every quarter turn keeps the product inside the room and on the floor.
for (const turns of [0, 1, 2, 3]) {
  const footprintZ = turns % 2 === 0 ? size.depth : size.width;
  const clamped = clampToRoom(placement.position, { dimensions: ROOM, size, placementType: 'floor' });
  const insideZ =
    clamped[2] - footprintZ / 2 >= bounds.minZ - 1e-9 && clamped[2] + footprintZ / 2 <= bounds.maxZ + 1e-9;
  check(`xoay ${turns * 90}°: van trong phong, van tren san`, insideZ && near(clamped[1], size.height / 2, 1e-9));
}

/* ------------------------------- F. the fixture is not, and cannot be, a product */

console.log('\nF. khong phai san pham (§8, §27, §41)');

check('registry khong co id cua fixture', getProduct3DAsset(DEV_TEST_ASSET_ID) === null);
check('fixture khong co SKU', devProduct.sku === undefined);
check('fixture khong co brand', devProduct.brand === undefined);
check('fixture khong co normalizedSku', devProduct.normalizedSku === undefined);
check(
  'khong co asset nao tro toi file dev',
  allProduct3DAssets().every((a) => a.runtime.glbUrl !== DEV_TEST_FIXTURE_URL),
  allProduct3DAssets().map((a) => a.runtime.glbUrl)
);
check(
  'khong khoa nao cua fixture mo duoc cong READY',
  !hasReadyAssetForKeys(DEV_TEST_ASSET_ID, 'test-fixture', 'TESTFIXTURE'),
);
check('hasSkuMasterModel tu choi fixture', hasSkuMasterModel(DEV_TEST_ASSET_ID) === false);
check(
  'fixture khong bao gio duoc gan 3D VERIFIED',
  devProduct.capability !== 'VERIFIED_3D',
  devProduct.capability
);
check('nhung van dat duoc vao phong (co kich thuoc that)', isPlaceable(devProduct.capability));

/* ------------------------- G. the catalogue cannot reach the dev mesh either */

console.log('\nG. danh muc khong voi toi mesh dev (§29, §41)');

// A catalogue product resolves its model only through `getModelMetadata`.
// Feed it the shapes a real row takes and prove none of them comes back
// holding the dev URL — including a row that deliberately imitates the
// fixture's id, which is the nearest thing to an attack this surface has.
const candidates: Array<Partial<Product>> = [
  { id: 'llv-toilet-inax-ac-1017vrn', sku: 'AC-1017VRN', category: 'Bồn cầu' },
  { id: DEV_TEST_ASSET_ID, sku: DEV_TEST_ASSET_ID, category: 'Bồn cầu' },
  { id: 'llv-lavabo-toto-lt1705', sku: 'LT1705#XW', category: 'Lavabo' },
  { id: 'x', sku: 'x', category: 'Sen tắm' },
];
for (const candidate of candidates) {
  const meta = getModelMetadata(candidate as Product, 'toilet');
  check(
    `getModelMetadata(${candidate.id}) khong tra ve file dev`,
    meta.model3dUrl !== DEV_TEST_FIXTURE_URL,
    meta.model3dUrl
  );
}

check(
  'khong san pham danh muc nao co model3dUrl',
  candidates.every((c) => getModelMetadata(c as Product, 'toilet').model3dUrl === undefined)
);

/* ---------------------------- H. the gates the whole storefront depends on */

console.log('\nH. cong READY van dong (§27)');

const ready = allProduct3DAssets().filter(isRoomStudioReady);
check(`READY = 0 (dang co ${allProduct3DAssets().length} asset)`, ready.length === 0, ready.map((a) => a.sku));

// §68 / §29: the shared generic model must stay unreachable.
check(
  'khong category nao bat model dung chung',
  Object.values(availableProductModels).every((v) => v === false),
  availableProductModels
);
check(
  'lavabo.glb van nam trong ban do nhung bi tat',
  productModelMap.lavabo !== undefined && availableProductModels.lavabo === false
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
