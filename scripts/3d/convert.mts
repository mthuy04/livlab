/**
 * Runs one SKU through Blender and writes a report.
 *
 *     npm run 3d:convert -- --sku AC-1017VRN
 *
 * It resolves the source file, the official dimensions and the placement
 * contract from the registry, invokes `blender_convert_product.py` headless,
 * then measures the exported GLB with the SAME metric code the product audit
 * uses — because a conversion that reports its own success is not evidence.
 *
 * It never sets a product READY. The best outcome here is CONVERTED, and the
 * next status is QA_REQUIRED: dimensions and scale are arithmetic a machine
 * can settle, while identity, orientation, pivot, materials and performance
 * need a person to look at the thing.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  WORKSPACE,
  SUPPORTED_INPUT_FORMATS,
  findBlender,
  resolveSku,
  blockers,
  masterPath,
  reportPath,
  runtimeDir,
  runtimeUrl,
  sourceStem,
  parseArgs,
  fmtBytes,
  sha256,
} from './pipeline';
import { inspectGlb } from '../lib/glbMetrics.mjs';
import { performanceTargetFor } from '../../lib/room-studio/product3dAsset';

const args = parseArgs(process.argv.slice(2));
const skuArg = args.sku;

if (typeof skuArg !== 'string') {
  console.error('cần --sku, ví dụ: npm run 3d:convert -- --sku AC-1017VRN');
  process.exit(2);
}

const asset = resolveSku(skuArg);
if (!asset) {
  console.error(`Không có bản ghi 3D nào cho SKU "${skuArg}".`);
  process.exit(1);
}

/* ------------------------------------------------- refuse before spending */

const issues = blockers(asset);
if (issues.length) {
  console.error(`Không convert ${asset.sku}:`);
  for (const issue of issues) console.error(`  ⚠ ${issue}`);
  process.exit(1);
}

const stem = sourceStem(asset);
const source =
  SUPPORTED_INPUT_FORMATS.map((ext: string) => path.join(WORKSPACE.incoming, stem + ext)).find(existsSync) ??
  null;

if (!source) {
  console.error(`WAITING_FOR_REAL_FBX — không thấy ${stem}.fbx trong assets/3d/work/incoming/`);
  console.error('Gói bàn giao: assets/3d/handoff/inax/INAX-3D-EXPORT-HANDOFF.md');
  process.exit(1);
}

const blender = findBlender();
if (!blender) {
  console.error('BLENDER_RUNTIME_MISSING — có file nguồn nhưng không có Blender để chạy.');
  console.error('Cài Blender rồi chạy lại; hoặc đặt BLENDER_PATH trỏ tới binary.');
  process.exit(1);
}

/* --------------------------------------------------------------- convert */

const { width, depth, height } = asset.dimensionsMm;
const master = masterPath(asset);
const report = reportPath(asset);
mkdirSync(WORKSPACE.normalized, { recursive: true });
mkdirSync(WORKSPACE.reports, { recursive: true });

console.log(`${blender.version}`);
console.log(`${asset.brand} ${asset.sku} · ${width} × ${depth} × ${height} mm · ${asset.placement.type}`);
console.log(`nguồn: ${path.relative(ROOT, source)} (${fmtBytes(readFileSync(source).byteLength)})\n`);

const result = spawnSync(
  blender.path,
  [
    '--background',
    '--python', path.join(ROOT, 'scripts/3d/blender_convert_product.py'),
    '--',
    '--input', source,
    '--output', master,
    '--report', report,
    '--brand', asset.brand,
    '--sku', asset.sku,
    '--width-mm', String(width),
    '--depth-mm', String(depth),
    '--height-mm', String(height),
    '--placement', asset.placement.type,
    '--pivot', asset.placement.pivot,
  ],
  { stdio: 'inherit', encoding: 'utf8' }
);

if (!existsSync(report)) {
  console.error('\nBlender kết thúc mà không ghi báo cáo. Không coi đây là thành công.');
  process.exit(1);
}

const json = JSON.parse(readFileSync(report, 'utf8'));

if (result.status !== 0 || json.status !== 'CONVERTED') {
  console.error(`\nCONVERSION_FAILED · trạng thái ${json.status}`);
  for (const f of json.failures ?? []) console.error(`  ✗ ${f}`);
  for (const w of json.warnings ?? []) console.error(`  ⚠ ${w}`);
  process.exit(1);
}

/* ----------------------------------- measure the output independently §29 */

const metrics = await inspectGlb(master);
if (!metrics.inspected) {
  console.error(`\nGLB_INVALID — không đọc được file vừa xuất: ${metrics.error}`);
  process.exit(1);
}

const measuredMm = {
  width: Math.round(metrics.bboxUnits!.x * 1000),
  depth: Math.round(metrics.bboxUnits!.z * 1000),
  height: Math.round(metrics.bboxUnits!.y * 1000),
};

// The exporter's own report and an independent read of the file must agree.
// If they do not, something between Blender and disk changed the geometry and
// neither number can be trusted.
const disagreement = (['width', 'depth', 'height'] as const).filter(
  (axis) => Math.abs(measuredMm[axis] - (json.normalizedDimensionsMm?.[axis] ?? -1)) > 2
);
if (disagreement.length) {
  console.error(`\nREPORT_MISMATCH — Blender và bản đọc lại không khớp ở: ${disagreement.join(', ')}`);
  process.exit(1);
}

const target = performanceTargetFor(asset.placement.type);

/* ------------------------------------------------ stage the runtime copy */

// §27: master and runtime are separate concepts even when they are the same
// bytes today. Copying rather than symlinking keeps the published file
// independent of a workspace that is gitignored and may be cleared.
const outDir = runtimeDir(asset);
mkdirSync(outDir, { recursive: true });
const runtimeFile = path.join(outDir, 'runtime.glb');
copyFileSync(master, runtimeFile);

console.log('\n' + '─'.repeat(58));
console.log(`kích thước   ${measuredMm.width} × ${measuredMm.depth} × ${measuredMm.height} mm`);
console.log(`kỳ vọng      ${width} × ${depth} × ${height} mm`);
console.log(`sai số       ${JSON.stringify(json.dimensionErrorsPct)} → ${json.dimensionVerdict}`);
console.log(`hệ số scale  ${json.detectedScaleFactor}`);
console.log(`hướng        ${json.orientation?.resolved ? `${json.orientation.yawDegrees}° · trước +Z` : 'CHƯA XÁC ĐỊNH'}`);
console.log(`pivot        ${json.pivotApplied?.preset}`);
console.log(
  `metrics      ${metrics.triangleCount} tris · ${metrics.meshCount} mesh · ` +
    `${metrics.materialCount} mat · ${metrics.textureCount} tex · ${fmtBytes(metrics.fileSizeBytes)}`
);
if (target) {
  const [preferredTris, maxTris] = target.triangles;
  const tris = metrics.triangleCount ?? 0;
  const overTris = tris > maxTris;
  const overSize = metrics.fileSizeBytes > target.maxBytes;
  // §33: an exact manufacturer mesh is not rejected for being heavy on the
  // first pass. It is reported, and optimisation is a separate decision.
  console.log(
    `ngưỡng       ${preferredTris}–${maxTris} tris / ${fmtBytes(target.maxBytes)} → ` +
      (overTris || overSize
        ? 'VƯỢT — ghi nhận cơ hội tối ưu, không loại model vì nặng'
        : tris > preferredTris
          ? 'trong ngưỡng chấp nhận'
          : 'đạt mức ưu tiên')
  );
}
console.log(`master       ${path.relative(ROOT, master)}`);
console.log(`runtime      ${path.relative(ROOT, runtimeFile)}`);
console.log(`url          ${runtimeUrl(asset)}`);
console.log(`sha256       ${sha256(runtimeFile).slice(0, 16)}…`);

for (const w of json.warnings ?? []) console.log(`  ⚠ ${w}`);

console.log('\nĐỀ XUẤT CỜ QA (chỉ những gì đo được)');
for (const [flag, value] of Object.entries(json.proposedQaFlags ?? {})) {
  console.log(`  ${flag}: ${value}`);
}
console.log('CẦN NGƯỜI XÁC NHẬN');
for (const flag of json.manualQaRequired ?? []) console.log(`  ${flag}`);

console.log(`\ntrạng thái: CONVERTED → ${json.nextLifecycleStatus}`);
console.log('CHƯA READY. Xem model tại /dev/3d-assets rồi cập nhật registry bằng tay.');
