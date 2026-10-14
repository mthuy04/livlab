/**
 * What is waiting in the conversion workspace.
 *
 *     npm run 3d:incoming
 *
 * Lists files, says which registered SKU each one belongs to, and shows the
 * dimensions it would be judged against. Nothing is processed: a file that
 * matched no SKU is reported as unmatched rather than attached to the nearest
 * guess, because an FBX converted against the wrong spec sheet passes QA.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  WORKSPACE,
  listIncoming,
  findBlender,
  blockers,
  fmtBytes,
  SUPPORTED_INPUT_FORMATS,
  sourceStem,
  ROOT,
} from './pipeline';
import { allProduct3DAssets } from '../../lib/room-studio/product3dRegistry';

const blender = findBlender();
console.log(
  blender
    ? `Blender: ${blender.version}  (${blender.path})`
    : 'Blender: KHÔNG CÓ — BLENDER_RUNTIME_MISSING. Chuẩn bị được, convert thì chưa.'
);
console.log(`Workspace: ${path.relative(ROOT, WORKSPACE.incoming)}/\n`);

const files = listIncoming();

if (files.length === 0) {
  console.log('Chưa có file nào trong incoming/.\n');
  console.log('Đang chờ (theo thứ tự ưu tiên trong handoff):');
  for (const asset of allProduct3DAssets()) {
    const { width, depth, height } = asset.dimensionsMm;
    console.log(
      `  ${sourceStem(asset)}.fbx`.padEnd(42) +
        `${asset.sku.padEnd(12)} ${width} × ${depth} × ${height} mm`
    );
  }
  console.log(`\nĐịnh dạng nhận: ${SUPPORTED_INPUT_FORMATS.join(', ')}`);
  console.log('Gói bàn giao: assets/3d/handoff/inax/INAX-3D-EXPORT-HANDOFF.md');
  process.exit(0);
}

let ready = 0;
for (const entry of files) {
  const head = `${entry.file}  ${fmtBytes(entry.sizeBytes)}`;
  if (!entry.supported) {
    console.log(`  ✗ ${head}\n      UNSUPPORTED_INPUT_FORMAT (${entry.ext || 'không có đuôi'})`);
    continue;
  }
  if (!entry.asset) {
    console.log(
      `  ? ${head}\n      Không khớp SKU nào. Tên file phải đúng dạng ` +
        `<brand>_<sku>_source${entry.ext}`
    );
    continue;
  }

  const { width, depth, height } = entry.asset.dimensionsMm;
  const issues = blockers(entry.asset);
  const converted = existsSync(
    path.join(WORKSPACE.reports, `${entry.asset.brand.toLowerCase()}_${entry.asset.sku.toLowerCase()}.json`)
  );

  console.log(`  ${issues.length === 0 ? '✓' : '!'} ${head}`);
  console.log(`      ${entry.asset.brand} ${entry.asset.sku} · ${width} × ${depth} × ${height} mm · ${entry.asset.placement.type}`);
  console.log(`      trạng thái hiện tại: ${entry.asset.status}${converted ? ' · đã có báo cáo convert' : ''}`);
  for (const issue of issues) console.log(`      ⚠ ${issue}`);
  if (issues.length === 0) {
    ready += 1;
    console.log(`      chạy: npm run 3d:convert -- --sku ${entry.asset.sku}`);
  }
}

console.log(`\n${files.length} file · ${ready} sẵn sàng convert`);
if (ready > 0 && !blender) {
  console.log('Nhưng Blender chưa có, nên chưa convert được. Xem BLENDER_RUNTIME_MISSING.');
}
