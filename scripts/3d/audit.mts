/**
 * Lifecycle counts for every registered 3D asset.
 *
 *     npm run 3d:audit
 *
 * The question it answers is "what may a customer actually be shown", so it
 * reports the READY gate rather than the status field alone: a record can say
 * READY and still fail `isRoomStudioReady` if a QA flag or the glb url is
 * missing, and the gate is what the storefront reads.
 */

import { existsSync } from 'node:fs';
import { allProduct3DAssets } from '../../lib/room-studio/product3dRegistry';
import { isRoomStudioReady, QA_CHECKS } from '../../lib/room-studio/product3dAsset';
import { DIMENSION_REVIEW_REQUIRED } from '../../lib/room-studio/dimensionReview';
import { availableProductModels } from '../../lib/livlabProductModels';
import { reportPath, masterPath, runtimeUrl, ROOT } from './pipeline';
import path from 'node:path';

const assets = allProduct3DAssets();
const byStatus = new Map<string, number>();
for (const a of assets) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);

console.log('TRẠNG THÁI');
for (const [status, count] of [...byStatus.entries()].sort()) {
  console.log(`  ${status.padEnd(20)} ${count}`);
}

const ready = assets.filter(isRoomStudioReady);
console.log(`\nCỔNG READY (isRoomStudioReady): ${ready.length} / ${assets.length}`);

console.log('\nTỪNG ASSET');
for (const asset of assets) {
  const done = QA_CHECKS.filter((c) => asset.qa[c]).length;
  const hasReport = existsSync(reportPath(asset));
  const hasMaster = existsSync(masterPath(asset));
  const hasRuntime = existsSync(path.join(ROOT, 'public', runtimeUrl(asset).replace(/^\//, '')));
  console.log(
    `  ${asset.sku.padEnd(12)} ${asset.status.padEnd(18)} QA ${done}/${QA_CHECKS.length}  ` +
      `glb=${asset.runtime.glbUrl ?? '-'}  ready=${isRoomStudioReady(asset)}`
  );
  const artefacts = [
    hasReport ? 'report' : null,
    hasMaster ? 'master' : null,
    hasRuntime ? 'runtime' : null,
  ].filter(Boolean);
  if (artefacts.length) console.log(`               có: ${artefacts.join(', ')}`);
}

if (DIMENSION_REVIEW_REQUIRED.length) {
  console.log('\nDỮ LIỆU KÍCH THƯỚC CẦN XÁC MINH (không được READY khi chưa giải quyết)');
  for (const review of DIMENSION_REVIEW_REQUIRED) {
    console.log(`  ${review.brand} ${review.sku}: ${review.catalogueValue}`);
    console.log(`    ${review.reason}`);
  }
}

const generic = Object.entries(availableProductModels).filter(([, on]) => on);
console.log(
  `\nModel dùng chung: ${generic.length === 0 ? 'tất cả đã tắt' : `BẬT — ${generic.map(([k]) => k).join(', ')}`}`
);
