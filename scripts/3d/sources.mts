/**
 * What geometry we actually hold, per brand.
 *
 *     npm run 3d:sources
 *
 * Reads `data/3d/manufacturer-sources.json`, which records files that were
 * fetched and inspected — not formats a manufacturer might publish. A source
 * that was never downloaded and opened is a lead, and leads do not belong in
 * an inventory.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fmtBytes } from './pipeline';

const FILE = 'data/3d/manufacturer-sources.json';

if (!existsSync(FILE)) {
  console.error(`Chưa có ${FILE}.`);
  process.exit(1);
}

interface SourceRecord {
  brand: string;
  sku: string;
  sourceFormat: string;
  sourceStatus: string;
  rejectionReason?: string | null;
  blocker?: string | null;
  sourceSizeBytes?: number | null;
  identityConfidence: string;
  geometryInspection?: { verdict: string; threeDEntities: number; twoDEntities: number } | null;
  notes?: string;
}

const data = JSON.parse(readFileSync(FILE, 'utf8')) as { records: SourceRecord[] };
const records = data.records ?? [];

const byBrand = new Map<string, SourceRecord[]>();
for (const r of records) byBrand.set(r.brand, [...(byBrand.get(r.brand) ?? []), r]);

for (const [brand, list] of [...byBrand.entries()].sort()) {
  console.log(`\n${brand}  (${list.length})`);
  for (const r of list) {
    const blocker = r.rejectionReason ?? r.blocker ?? '';
    console.log(
      `  ${r.sku.padEnd(13)} ${r.sourceFormat.padEnd(5)} ${r.sourceStatus.padEnd(16)} ` +
        `${r.sourceSizeBytes ? fmtBytes(r.sourceSizeBytes).padStart(9) : '        -'}  ${blocker}`
    );
    if (r.geometryInspection) {
      const g = r.geometryInspection;
      console.log(`                3D ${g.threeDEntities} / 2D ${g.twoDEntities} -> ${g.verdict}`);
    }
  }
}

/* ------------------------------------------------------------ the summary */

const counts = new Map<string, number>();
const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);
for (const r of records) bump(r.rejectionReason ?? r.blocker ?? r.sourceStatus);

console.log('\nTỔNG');
console.log(`  nguồn đã ghi nhận      ${records.length}`);
console.log(`  đã tải về và mở kiểm   ${records.filter((r) => r.sourceSizeBytes).length}`);
console.log(`  dùng được làm model    ${records.filter((r) => r.geometryInspection?.verdict === 'HAS_3D_GEOMETRY').length}`);
console.log('\nCHẶN Ở ĐÂU');
for (const [reason, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${reason.padEnd(24)} ${n}`);
}
