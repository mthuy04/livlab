#!/usr/bin/env node
/**
 * Builds the manual-export queue and the asset request the showroom can send
 * to its distributors. Writes data/demo/3d-manual-export-queue.json.
 *
 * The audit answers "what do we have" and the answer is nothing: no SKU in
 * this catalogue has a geometry source, and this machine has no converter
 * anyway. So the useful artefact is not a conversion plan — it is a list of
 * exactly which products to ask for, ranked, with the formats that are worth
 * receiving and the dimensions needed to check whatever comes back.
 *
 * Ranking is by what the pipeline can do with the asset once it arrives, not
 * by how nice the product is: appearing in a published concept means the model
 * has somewhere to be used, and an official specification sheet means its
 * scale can be verified rather than eyeballed.
 *
 *   node scripts/build_3d_request_queue.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data/demo/3d-manual-export-queue.json');

/**
 * Formats worth asking for, best first.
 *
 * The question the showroom usually gets asked is "do you have GLB", and the
 * answer is almost always no — GLB is a web runtime format and manufacturers
 * do not ship it. They ship what architects use. Asking for the architect
 * formats is how the request stops coming back empty.
 */
const REQUESTED_FORMATS = [
  { format: 'GLB / GLTF', note: 'Dùng được ngay, không cần chuyển đổi.' },
  { format: 'FBX', note: 'Chuyển sang GLB được, giữ vật liệu và phân cấp.' },
  { format: 'OBJ (+ MTL + texture)', note: 'Chuyển được; cần kèm file vật liệu và texture.' },
  { format: 'SKP (SketchUp)', note: 'Cần công cụ chuyển đổi; vẫn là nguồn tốt.' },
  { format: '3DS MAX (.max)', note: 'Cần 3ds Max để xuất ra FBX/OBJ. Vẫn nhận, sẽ nhờ bên có license xuất hộ.' },
  { format: 'RFA / RVT (Revit)', note: 'Cần Revit để xuất. Nhận để lưu nguồn.' },
  { format: 'STEP / IGES', note: 'Hình học CAD đặc; cần công cụ chuyển đổi.' },
  { format: 'DWG/DXF 3D', note: 'Chỉ hữu ích nếu là bản vẽ 3D. Bản vẽ 2D không dùng dựng phòng được.' },
];

const ALSO_REQUEST = [
  'Bảng thông số kích thước chính thức (dài × rộng × cao, mm) — để kiểm tra tỷ lệ model.',
  'Thông tin vật liệu / bề mặt hoàn thiện của từng mã (sứ trắng, chrome, mạ đen…).',
  'Bảng đối chiếu mã thương mại ↔ mã thân sứ / mã linh kiện, nếu có.',
  'Xác nhận quyền sử dụng file cho mục đích trưng bày trên website showroom.',
];

/** The message, in the words the showroom will actually forward. */
const REQUEST_MESSAGE_VI =
  'Anh/chị cho bên em xin các file 3D/CAD/BIM hãng đang cung cấp cho showroom đối với các model này. ' +
  'Các định dạng .max, .3ds, .fbx, .obj, .skp, .rfa, .dwg, .step, .glb đều sử dụng được; bên em sẽ chuẩn hóa ' +
  'sang GLB cho Room Studio. Nếu có file thông số/kích thước đi kèm thì cho bên em xin cùng để kiểm tra scale và model.';

async function main() {
  const audit = JSON.parse(await readFile(path.join(ROOT, 'data/demo/3d-asset-audit.json'), 'utf8'));
  const fixture = JSON.parse(await readFile(path.join(ROOT, 'data/demo/tungdang-sanitaryware.json'), 'utf8'));
  const conceptLib = await readFile(path.join(ROOT, 'lib/storefront/conceptLibrary.ts'), 'utf8');

  const conceptSkus = new Set([...conceptLib.matchAll(/sku: '([^']+)'/g)].map((m) => m[1]));
  const specSkus = new Set(audit.products.filter((p) => p.hasTechnicalSpec && p.sku).map((p) => p.sku));
  const urlBySku = new Map(audit.products.filter((p) => p.sku).map((p) => [p.sku, p.manufacturerProductUrl]));

  const CATEGORY_PRIORITY = { 'Bồn cầu': 3, Lavabo: 3, 'Sen tắm': 2, 'Vòi lavabo': 2, 'Bồn tắm': 1 };

  const queue = (fixture.products ?? [])
    .filter((p) => p.sku)
    .map((p) => {
      const inConcept = conceptSkus.has(p.sku);
      const hasSpec = specSkus.has(p.sku);
      const d = p.dimensions;
      const score =
        (inConcept ? 3 : 0) + (hasSpec ? 2 : 0) + (d ? 1 : 0) + (CATEGORY_PRIORITY[p.category] ?? 0);
      return {
        brand: p.brand,
        sku: p.sku,
        category: p.category,
        productName: p.name,
        manufacturerUrl: urlBySku.get(p.sku) ?? p.sourceUrl ?? null,
        // No source file exists to export from — this is a request, not a
        // conversion. Saying otherwise would put work in a queue that nobody
        // can start.
        sourceFile: null,
        sourceFormat: null,
        status: 'SOURCE_UNAVAILABLE',
        requiredTool: null,
        requestedOutput: 'FBX hoặc GLB (ưu tiên), kèm đơn vị đo và vật liệu',
        officialDimensionsMm: d
          ? { width: d.width, depth: d.length, height: d.height }
          : null,
        dimensionsKnown: Boolean(d),
        usedInPublishedConcept: inConcept,
        hasManufacturerSpecSheet: hasSpec,
        priority: score,
        notes: [
          inConcept ? 'Đang xuất hiện trong concept đã xuất bản.' : null,
          hasSpec ? 'Có thông số chính thức để đối chiếu kích thước.' : 'Chưa có thông số chính thức — cần xin kèm.',
          d ? null : 'Catalog chưa có kích thước.',
        ].filter(Boolean),
      };
    })
    .sort((a, b) => b.priority - a.priority || a.brand.localeCompare(b.brand));

  const pilot = queue.slice(0, 15);

  const report = {
    generatedAt: new Date().toISOString(),
    tenant: 'tungdang',
    summary: {
      catalogSkus: queue.length,
      withGeometrySource: 0,
      withManufacturerSpec: queue.filter((q) => q.hasManufacturerSpecSheet).length,
      usedInPublishedConcepts: queue.filter((q) => q.usedInPublishedConcept).length,
      pilotBatchSize: pilot.length,
    },
    requestedFormats: REQUESTED_FORMATS,
    alsoRequest: ALSO_REQUEST,
    requestMessageVi: REQUEST_MESSAGE_VI,
    pilotBatch: pilot,
    fullQueue: queue,
  };

  await writeFile(OUT, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`SKU trong catalog          : ${queue.length}`);
  console.log(`co nguon hinh hoc          : 0`);
  console.log(`co thong so chinh thuc     : ${report.summary.withManufacturerSpec}`);
  console.log(`dang dung trong concept    : ${report.summary.usedInPublishedConcepts}`);
  console.log(`\n=== LO THI DIEM (15 uu tien cao nhat) ===`);
  console.log(`${'diem'.padStart(4)} ${'hang'.padEnd(10)} ${'sku'.padEnd(20)} ${'nhom'.padEnd(11)} kichthuoc`);
  for (const q of pilot) {
    const dims = q.officialDimensionsMm
      ? `${q.officialDimensionsMm.width}×${q.officialDimensionsMm.depth}×${q.officialDimensionsMm.height}`
      : '—';
    console.log(`${String(q.priority).padStart(4)} ${q.brand.slice(0, 10).padEnd(10)} ${q.sku.slice(0, 20).padEnd(20)} ${q.category.slice(0, 11).padEnd(11)} ${dims}`);
  }
  console.log(`\nda ghi ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
