/**
 * The QA sheet for one SKU.
 *
 *     npm run 3d:qa -- --sku AC-1017VRN
 *
 * Everything a person needs in front of them before deciding whether an asset
 * may go READY, and nothing that decides it for them. The numeric checks are
 * computed here; the five judgements that need eyes are listed unticked.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  resolveSku,
  masterPath,
  reportPath,
  runtimeDir,
  blockers,
  parseArgs,
  fmtBytes,
  sha256,
} from './pipeline';
import { inspectGlb } from '../lib/glbMetrics.mjs';
import {
  QA_CHECKS,
  checkDimensions,
  isRoomStudioReady,
  performanceTargetFor,
  DIMENSION_ERROR_PREFERRED_PCT,
  DIMENSION_ERROR_MAX_PCT,
} from '../../lib/room-studio/product3dAsset';

const args = parseArgs(process.argv.slice(2));
if (typeof args.sku !== 'string') {
  console.error('cần --sku, ví dụ: npm run 3d:qa -- --sku AC-1017VRN');
  process.exit(2);
}

const asset = resolveSku(args.sku);
if (!asset) {
  console.error(`Không có bản ghi 3D nào cho SKU "${args.sku}".`);
  process.exit(1);
}

const { width, depth, height } = asset.dimensionsMm;

console.log(`${asset.brand} ${asset.sku}`);
console.log(`  trạng thái       ${asset.status}`);
console.log(`  quan hệ nguồn    ${asset.identity.relationType}`);
console.log(`  nguồn            ${asset.source.originalFormat} · ${asset.source.originalFileName}`);
console.log(`  trang hãng       ${asset.source.url}`);
console.log(`  kích thước hãng  ${width} × ${depth} × ${height} mm (W × D × H)`);
console.log(`  đặt              ${asset.placement.type} · pivot ${asset.placement.pivot}`);

const issues = blockers(asset);
if (issues.length) {
  console.log('\nCHẶN');
  for (const issue of issues) console.log(`  ⚠ ${issue}`);
}

/* -------------------------------------------------------- conversion state */

const report = reportPath(asset);
const master = masterPath(asset);
const runtime = path.join(runtimeDir(asset), 'runtime.glb');

console.log('\nFILE');
console.log(`  báo cáo   ${existsSync(report) ? path.relative(ROOT, report) : '— chưa convert'}`);
console.log(`  master    ${existsSync(master) ? path.relative(ROOT, master) : '— chưa có'}`);
console.log(`  runtime   ${existsSync(runtime) ? path.relative(ROOT, runtime) : '— chưa có'}`);

const inspectable = existsSync(runtime) ? runtime : existsSync(master) ? master : null;

if (!inspectable) {
  console.log('\nChưa có GLB để đo. WAITING_FOR_REAL_FBX.');
} else {
  const metrics = await inspectGlb(inspectable);
  if (!metrics.inspected) {
    console.log(`\nGLB_INVALID: ${metrics.error}`);
  } else {
    const measured = {
      width: Math.round(metrics.bboxUnits!.x * 1000),
      depth: Math.round(metrics.bboxUnits!.z * 1000),
      height: Math.round(metrics.bboxUnits!.y * 1000),
    };
    const result = checkDimensions(asset.dimensionsMm, measured);

    console.log(`\nĐO ĐƯỢC (${path.basename(inspectable)})`);
    console.log(`  bbox      ${measured.width} × ${measured.depth} × ${measured.height} mm`);
    for (const check of result.checks) {
      console.log(
        `  ${check.axis.padEnd(7)} ${check.modelMm} / ${check.officialMm} mm · sai ${check.errorPct.toFixed(3)}%`
      );
    }
    const worst = result.worstErrorPct ?? 0;
    const verdict =
      worst <= DIMENSION_ERROR_PREFERRED_PCT ? 'PASS' : worst <= DIMENSION_ERROR_MAX_PCT ? 'REVIEW' : 'FAIL';
    console.log(`  kết luận  ${verdict} (ngưỡng ${DIMENSION_ERROR_PREFERRED_PCT}% / ${DIMENSION_ERROR_MAX_PCT}%)`);

    // §20: back-center-floor means the geometry sits on, and behind, nothing.
    const [, minY, minZ] = metrics.bboxMin!;
    console.log(`  gốc toạ độ minY=${minY} minZ=${minZ} ${Math.abs(minY) < 1e-3 && Math.abs(minZ) < 1e-3 ? '· back-center-floor ✓' : '· KHÔNG ở back-center-floor'}`);

    const target = performanceTargetFor(asset.placement.type);
    console.log(
      `  metrics   ${metrics.triangleCount} tris · ${metrics.meshCount} mesh · ` +
        `${metrics.materialCount} mat · ${metrics.textureCount} tex · ${fmtBytes(metrics.fileSizeBytes)}`
    );
    if (target) {
      console.log(
        `  ngưỡng    ${target.triangles[0]}–${target.triangles[1]} tris / ${fmtBytes(target.maxBytes)}`
      );
    }
    console.log(`  sha256    ${sha256(inspectable).slice(0, 16)}…`);
  }
}

if (existsSync(report)) {
  const json = JSON.parse(readFileSync(report, 'utf8'));
  if (json.warnings?.length) {
    console.log('\nCẢNH BÁO TỪ CONVERT');
    for (const w of json.warnings) console.log(`  ⚠ ${w}`);
  }
}

/* --------------------------------------------------------------- the gate */

console.log('\nCỜ QA (7 mục — READY cần đủ cả 7)');
for (const flag of QA_CHECKS) {
  console.log(`  [${asset.qa[flag] ? 'x' : ' '}] ${flag}`);
}

console.log('\nNGƯỜI PHẢI TỰ XÁC NHẬN, KHÔNG MÁY NÀO THAY ĐƯỢC');
for (const line of [
  'đúng sản phẩm này, không phải model cùng họ',
  'hình dáng khớp ảnh catalogue của hãng',
  'hướng: mặt trước ra phòng, mặt sau áp tường',
  'pivot: đứng trên sàn, không lơ lửng, không lún',
  'vật liệu: sứ trắng không vàng/bóng gương, mạ vẫn ra kim loại',
  'đủ bộ phận: thân, nắp, két, nút xả',
  'không có mảnh rác hình học, không mặt lật',
  'chạy mượt trong Room Studio thật',
]) {
  console.log(`  [ ] ${line}`);
}

console.log(`\nisRoomStudioReady: ${isRoomStudioReady(asset)}`);
console.log(existsSync(runtime) ? 'Xem model: /dev/3d-assets' : 'Chưa có gì để xem.');
