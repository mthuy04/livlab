/**
 * Turns a converted asset into a product customers can place.
 *
 *     npm run 3d:activate -- --sku AC-1017VRN
 *
 * This is the last gate before a real model reaches a storefront, so it is
 * built to refuse. It checks, in order: the SKU resolves, nothing blocks it,
 * the runtime GLB exists and parses, its bounding box still matches the
 * manufacturer's figures inside the pass threshold, its origin is where the
 * placement contract says, and — the part no command may decide — that all
 * seven QA flags are ALREADY true in the registry because a person looked at
 * the model and set them.
 *
 * It will not set those flags. A command that both asserts QA and acts on it
 * is not a gate, it is a formality with a progress bar.
 *
 * When everything passes it makes the two mechanical edits: `status: 'READY'`
 * and the runtime url. If it cannot make them safely it prints the exact patch
 * and changes nothing.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  resolveSku,
  runtimeDir,
  runtimeUrl,
  parseArgs,
  sha256,
  fmtBytes,
  activationRefusals,
  type GlbFacts,
} from './pipeline';
import { inspectGlb } from '../lib/glbMetrics.mjs';
import {
  QA_CHECKS,
  checkDimensions,
  performanceTargetFor,
} from '../../lib/room-studio/product3dAsset';

const REGISTRY_FILE = path.join(ROOT, 'lib/room-studio/product3dRegistry.ts');

const args = parseArgs(process.argv.slice(2));
if (typeof args.sku !== 'string') {
  console.error('cần --sku, ví dụ: npm run 3d:activate -- --sku AC-1017VRN');
  process.exit(2);
}

const asset = resolveSku(args.sku);
if (!asset) {
  console.error(`Không có bản ghi 3D nào cho SKU "${args.sku}".`);
  process.exit(1);
}

const note = (line: string) => console.log(`  ${line}`);

console.log(`${asset.brand} ${asset.sku} — kiểm tra điều kiện kích hoạt\n`);

/* ------------------------------------------------- read the file as it is */

const glbPath = path.join(runtimeDir(asset), 'runtime.glb');
const url = runtimeUrl(asset);

const facts: GlbFacts = { exists: existsSync(glbPath), inspected: false };

if (facts.exists) {
  const metrics = await inspectGlb(glbPath);
  facts.inspected = metrics.inspected;
  facts.error = metrics.error;
  if (metrics.inspected && metrics.bboxUnits) {
    // Measured here rather than read from the conversion report: the report
    // says what Blender believed it wrote, this says what will be served.
    facts.measuredMm = {
      width: Math.round(metrics.bboxUnits.x * 1000),
      depth: Math.round(metrics.bboxUnits.z * 1000),
      height: Math.round(metrics.bboxUnits.y * 1000),
    };
    facts.bboxMin = metrics.bboxMin ?? undefined;

    note(`GLB         ${path.relative(ROOT, glbPath)} · ${fmtBytes(metrics.fileSizeBytes)}`);
    note(`            ${metrics.triangleCount} tris · ${metrics.meshCount} mesh · ${metrics.materialCount} mat · ${metrics.textureCount} tex`);
    note(`sha256      ${sha256(glbPath).slice(0, 16)}…`);
    note(`đo lại      ${facts.measuredMm.width} × ${facts.measuredMm.depth} × ${facts.measuredMm.height} mm`);
    note(`hãng        ${asset.dimensionsMm.width} × ${asset.dimensionsMm.depth} × ${asset.dimensionsMm.height} mm`);

    const result = checkDimensions(asset.dimensionsMm, facts.measuredMm);
    for (const check of result.checks) note(`  ${check.axis.padEnd(7)} sai ${check.errorPct.toFixed(3)}%`);

    const target = performanceTargetFor(asset.placement.type);
    if (target) {
      const over =
        (metrics.triangleCount ?? 0) > target.triangles[1] || metrics.fileSizeBytes > target.maxBytes;
      // §27: reported, never a refusal. A correct mesh that is heavy is an
      // optimisation job, not a wrong model.
      note(`hiệu năng   ${over ? 'OPTIMIZATION_REQUIRED — vượt ngưỡng, vẫn cho kích hoạt' : 'trong ngưỡng'}`);
    }
  }
}

const refusals = activationRefusals(asset, facts);

console.log(`\nCỜ QA (${QA_CHECKS.filter((f) => asset.qa[f]).length}/${QA_CHECKS.length})`);
for (const flag of QA_CHECKS) console.log(`  [${asset.qa[flag] ? 'x' : ' '}] ${flag}`);

/* ------------------------------------------------------------- the verdict */

if (refusals.length) {
  console.log('\nTỪ CHỐI KÍCH HOẠT');
  for (const refusal of refusals) console.log(`  ✗ ${refusal}`);
  console.log(`\n${asset.sku} giữ nguyên ${asset.status}. Room Studio vẫn dùng khối đúng kích thước.`);
  process.exit(1);
}

/* ------------------------------------------------------------ the two edits */

const source = readFileSync(REGISTRY_FILE, 'utf8');

// Anchored on the record's own catalogue id so the edit cannot land in a
// neighbouring SKU. If either anchor has moved, nothing is written.
const recordStart = source.indexOf(`'${asset.catalogProductId}': {`);
if (recordStart === -1) {
  console.error(`\nKhông tìm thấy bản ghi '${asset.catalogProductId}' trong registry. Không sửa gì.`);
  process.exit(1);
}
const recordEnd = source.indexOf('\n  },', recordStart);
const record = source.slice(recordStart, recordEnd);

let updated = record;
let edits = 0;

if (/runtime: \{\},/.test(updated)) {
  updated = updated.replace(
    /runtime: \{\},/,
    `runtime: {\n      glbUrl: '${url}',\n      fileSizeBytes: ${existsSync(glbPath) ? readFileSync(glbPath).byteLength : 0},\n    },`
  );
  edits += 1;
}
if (/status: 'SOURCE_VERIFIED',/.test(updated)) {
  updated = updated.replace(/status: 'SOURCE_VERIFIED',/, "status: 'READY',");
  edits += 1;
}

if (edits < 2) {
  console.log('\nKhông sửa tự động được — bản ghi đã khác mẫu mong đợi. Patch cần áp bằng tay:');
  console.log(`  runtime: { glbUrl: '${url}', ... }`);
  console.log("  status: 'READY'");
  process.exit(1);
}

writeFileSync(REGISTRY_FILE, source.slice(0, recordStart) + updated + source.slice(recordEnd), 'utf8');

console.log('\nĐÃ KÍCH HOẠT');
console.log(`  ${asset.sku} → READY`);
console.log(`  runtime ${url}`);
console.log(`\nChạy lại để xác nhận: npm run 3d:audit`);
