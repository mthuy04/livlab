/**
 * Locks what Room Studio may claim about a product.
 *
 * Production showed `3D` on products that had no 3D model at all. The badge
 * was keyed off `model3dUrl`, that field was filled from a category stand-in,
 * and one 16MB basin was therefore announced as the 3D model of every basin in
 * the catalogue. The rule is now one function, and these tests exist so the
 * next person who adds a badge has to come past them.
 *
 * Run with:  npm run test:room-studio
 */

import { readFileSync } from 'node:fs';
import { parseDimensionsToMeters, toRoomStudioProduct } from '../lib/room-studio/productAdapter';
import {
  deriveCapability,
  hasCompleteDimensions,
  isPlaceable,
  isSurfaceMaterial,
  CAPABILITY_BADGE,
} from '../lib/room-studio/productCapability';
import { allProduct3DAssets, findProduct3DAssetForKeys } from '../lib/room-studio/product3dRegistry';
import { isRoomStudioReady, QA_CHECKS } from '../lib/room-studio/product3dAsset';
import { availableProductModels } from '../lib/livlabProductModels';
import type { Product3DAsset } from '../lib/room-studio/product3dAsset';
import type { Product } from '../lib/types';

/** Every QA flag set the same way, so a test states only what it varies. */
const qaFlags = (value: boolean): Product3DAsset['qa'] =>
  Object.fromEntries(QA_CHECKS.map((c) => [c, value])) as unknown as Product3DAsset['qa'];

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

/* --------------------------------------------------------- dimension parsing */

console.log('\nđọc chuỗi kích thước');
{
  const clean = parseDimensionsToMeters('550 x 380 x 125 mm');
  check('ba số đọc đủ ba trục', clean.width === 0.55 && clean.depth === 0.38 && clean.height === 0.125, clean);

  const two = parseDimensionsToMeters('500 x 430 mm');
  check('hai số thì không có chiều cao', two.width === 0.5 && two.depth === 0.43 && two.height === undefined, two);

  // The regression. Two measurements in one field, and the old parser took the
  // first three numbers: a 400×400mm face with a 295mm cutout became a
  // 400×400×295 box that is no dimension of the real product.
  const heater = parseDimensionsToMeters('Bề mặt 40 x 40 cm; lỗ khoét 29.5 x 29.5 cm');
  check('bốn số trở lên = không đọc được', !hasCompleteDimensions(heater), heater);

  const drain = parseDimensionsToMeters('Mặt 100 x 75 x 100mm; bề mặt 120 x 120mm');
  check('năm số = không đọc được', !hasCompleteDimensions(drain), drain);

  check('"Theo model" = không có kích thước', !hasCompleteDimensions(parseDimensionsToMeters('Theo model')));
  check('cm đổi đúng', parseDimensionsToMeters('60 x 40 x 20 cm').width === 0.6);
}

/* -------------------------------------------------------------- badge rules */

console.log('\nquy tắc nhãn năng lực');
{
  const base: Product3DAsset = {
    id: 'test',
    catalogProductId: 'demo:t:X:Y',
    brand: 'X',
    sku: 'Y',
    normalizedSku: 'Y',
    source: {
      type: 'MANUFACTURER_OFFICIAL',
      url: 'https://example.test/y',
      originalFileName: 'y.glb',
      originalFormat: 'GLB',
      checkedAt: '2026-01-01T00:00:00Z',
      rightsStatus: 'MANUFACTURER_PUBLIC',
    },
    identity: { relationType: 'EXACT_PRODUCT' },
    dimensionsMm: { width: 400, depth: 805, height: 588 },
    placement: { type: 'FLOOR_TOILET', pivot: 'BACK_CENTER_FLOOR', defaultRotation: [0, 0, 0] },
    runtime: {},
    status: 'SOURCE_VERIFIED',
    qa: qaFlags(false),
    assetVersion: 1,
  };

  const full = { width: 0.4, depth: 0.805, height: 0.588 };

  check('không có asset + đủ ba chiều -> ĐÚNG KÍCH THƯỚC', deriveCapability(null, full) === 'EXACT_DIMENSIONS');
  check('không có asset + thiếu chiều -> không đặt được', deriveCapability(null, { width: 0.4 }) === 'NO_DIMENSIONS');

  // §95: a verified .max source is a verified source. It is not a model.
  const sourceOnly = { ...base, qa: { ...base.qa, identityVerified: true, dimensionsVerified: true } };
  check('nguồn .max đã xác minh KHÔNG thành 3D VERIFIED', deriveCapability(sourceOnly, {}) === 'EXACT_DIMENSIONS');

  // Status READY with QA flags unset must not pass, and neither must every QA
  // flag set while the status says the asset is still in review.
  const readyNoQa = { ...base, status: 'READY' as const, runtime: { glbUrl: '/a.glb' } };
  check('READY nhưng chưa đủ QA -> không phải 3D VERIFIED', deriveCapability(readyNoQa, full) !== 'VERIFIED_3D');

  const qaNoReady = {
    ...base,
    runtime: { glbUrl: '/a.glb' },
    qa: qaFlags(true),
  };
  check('đủ QA nhưng chưa READY -> không phải 3D VERIFIED', deriveCapability(qaNoReady, full) !== 'VERIFIED_3D');

  const readyFull = { ...qaNoReady, status: 'READY' as const };
  check('READY + đủ QA + có GLB -> 3D VERIFIED', deriveCapability(readyFull, full) === 'VERIFIED_3D');

  const noGlb = { ...readyFull, runtime: {} };
  check('READY + đủ QA nhưng không có GLB -> không phải 3D VERIFIED', deriveCapability(noGlb, full) !== 'VERIFIED_3D');

  check('nhãn 3D VERIFIED đúng chữ', CAPABILITY_BADGE.VERIFIED_3D?.label === '3D VERIFIED');
  check('nhãn ĐÚNG KÍCH THƯỚC đúng chữ', CAPABILITY_BADGE.EXACT_DIMENSIONS?.label === 'ĐÚNG KÍCH THƯỚC');
  check('không có nhãn nào chứa chữ "3D" đơn lẻ',
    Object.values(CAPABILITY_BADGE).every((b) => b === null || b.label !== '3D'));
  check('không có nhãn cho sản phẩm thiếu kích thước', CAPABILITY_BADGE.NO_DIMENSIONS === null);
  check('không đặt được thì không placeable', !isPlaceable('NO_DIMENSIONS') && isPlaceable('EXACT_DIMENSIONS'));
  check('gạch là vật liệu bề mặt, không phải vật thể', isSurfaceMaterial('tile') && !isSurfaceMaterial('toilet'));
}

/* ------------------------------------------------- registry state right now */

console.log('\ntrạng thái thật của registry');
{
  const assets = allProduct3DAssets();
  const ready = assets.filter(isRoomStudioReady);
  check(`registry có ${assets.length} asset, READY = ${ready.length}`, true);
  // §69: with zero READY assets, nothing in the UI may show 3D VERIFIED.
  check('hiện tại không asset nào READY', ready.length === 0, ready.map((a) => a.sku));

  // §68: the generic shared model must stay unreachable.
  check('không category nào trả model dùng chung',
    Object.values(availableProductModels).every((v) => v === false), availableProductModels);
}

/* ------------------------------------------------ the real catalogue, parsed */

console.log('\ndanh mục thật (CSV seed)');
{
  const text = readFileSync('public/data/livlab-seed/livlab_verified_products_master.csv', 'utf8').replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const head = rows[0];
  const records = rows.slice(1).filter((r) => r.length > 5)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])) as unknown as Product);

  const products = records.map(toRoomStudioProduct);
  const placeable = products.filter((p) => isPlaceable(p.capability) && !isSurfaceMaterial(p.normalizedCategory));
  const verified3d = products.filter((p) => p.capability === 'VERIFIED_3D');

  console.log(`  ${products.length} sản phẩm · ${placeable.length} đặt được · ${verified3d.length} có model 3D`);
  check('không sản phẩm nào được gắn 3D VERIFIED', verified3d.length === 0, verified3d.map((p) => p.sku));
  check('có sản phẩm đặt được', placeable.length > 0);
  check('mọi sản phẩm đặt được đều có đủ ba chiều',
    placeable.every((p) => p.width !== undefined && p.depth !== undefined && p.height !== undefined),
    placeable.filter((p) => p.height === undefined).map((p) => p.sku));
  check('không sản phẩm nào trỏ tới model dùng chung',
    products.every((p) => !p.model3dUrl), products.filter((p) => p.model3dUrl).map((p) => p.sku));
  check('đèn sưởi âm trần H4B không đặt được (chuỗi kích thước mơ hồ)',
    !placeable.some((p) => p.sku === 'H4B'));
  check('phụ kiện treo tường, không nằm sàn',
    products.filter((p) => p.normalizedCategory === 'accessory').every((p) => p.placementType === 'wall'));

  // Every registry SKU should either be absent from this catalogue or resolve
  // to exactly one record. A SKU that resolves to two is the collision case.
  for (const asset of allProduct3DAssets()) {
    const matches = products.filter((p) => p.normalizedSku === asset.normalizedSku);
    check(`${asset.sku}: khớp 0 hoặc 1 dòng danh mục`, matches.length <= 1, matches.map((m) => m.id));
  }
  check('tra registry theo SKU không khớp sai',
    findProduct3DAssetForKeys('KHONGTONTAI') === null);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
