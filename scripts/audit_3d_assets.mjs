#!/usr/bin/env node
/**
 * Audits what 3D the catalogue actually has, and what this machine can do with
 * it. Writes data/demo/3d-asset-audit.json.
 *
 * Two questions, and the second is the one that usually gets assumed:
 *
 *   1. For every product, is there a geometry source — and is it geometry, or
 *      a specification sheet and a 2D drawing wearing the word "CAD"?
 *   2. Can this repository convert that source without a human and a licence?
 *
 * The tool probe is why this is a script rather than a table in a document. A
 * format's convertibility is a property of the machine, not of the format: the
 * same FBX converts automatically where Blender is installed and waits for a
 * person where it is not. Asking each time keeps the capability column honest.
 *
 *   node scripts/audit_3d_assets.mjs
 */

import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const exec = promisify(execFile);
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data/demo/3d-asset-audit.json');

/* ----------------------------------------------------------- tool probing */

const TOOLS = [
  { name: 'blender', probe: ['blender', ['--version']], unlocks: ['FBX', 'OBJ', 'DAE', '3DS', 'GLB', 'GLTF'] },
  { name: 'gltf-transform', probe: ['gltf-transform', ['--version']], unlocks: ['GLB', 'GLTF'] },
  { name: 'gltfpack', probe: ['gltfpack', ['-h']], unlocks: ['GLB', 'GLTF'] },
  { name: 'assimp', probe: ['assimp', ['version']], unlocks: ['FBX', 'OBJ', 'DAE', '3DS'] },
  { name: 'obj2gltf', probe: ['obj2gltf', ['--version']], unlocks: ['OBJ'] },
  { name: 'FBX2glTF', probe: ['FBX2glTF', ['--version']], unlocks: ['FBX'] },
];

async function probeTools() {
  const found = {};
  for (const t of TOOLS) {
    try {
      await exec(t.probe[0], t.probe[1], { timeout: 8000 });
      found[t.name] = true;
    } catch {
      found[t.name] = false;
    }
  }
  // A library dependency is not a CLI but still does real work on GLB.
  found['@gltf-transform/core'] = existsSync(path.join(ROOT, 'node_modules/@gltf-transform/core'));
  return found;
}

/**
 * What each source format can become here, given the tools actually present.
 *
 * MAX and RVT/RFA are never automatic: they need Autodesk software, and no
 * open-source converter reads them reliably. A 2D DWG is not "unsupported" —
 * it is a perfectly good drawing that simply has no geometry to place, which
 * is a different thing and gets its own verdict.
 */
function capabilityFor(format, tools) {
  const anyMeshConverter = tools.blender || tools.assimp || tools.FBX2glTF || tools.obj2gltf;
  switch (format) {
    case 'GLB':
    case 'GLTF':
      return 'DIRECT_WEB_READY';
    case 'FBX':
    case 'OBJ':
    case 'DAE':
    case '3DS':
      return anyMeshConverter ? 'AUTO_CONVERTIBLE' : 'MANUAL_EXPORT_REQUIRED';
    case 'SKP':
      return tools.blender ? 'CONVERSION_TOOL_REQUIRED' : 'MANUAL_EXPORT_REQUIRED';
    case 'MAX':
    case 'RVT':
    case 'RFA':
      return 'MANUAL_EXPORT_REQUIRED';
    case 'STEP':
    case 'IGES':
      return 'CONVERSION_TOOL_REQUIRED';
    case 'DWG_2D':
    case 'DXF_2D':
      return 'UNSUITABLE_FOR_ROOM_STUDIO_3D';
    case 'DWG':
    case 'DXF':
      return 'CONVERSION_TOOL_REQUIRED';
    default:
      return 'UNSUPPORTED';
  }
}

/* ------------------------------------------------------- source discovery */

const EXT_FORMAT = {
  '.glb': 'GLB', '.gltf': 'GLTF', '.fbx': 'FBX', '.obj': 'OBJ', '.dae': 'DAE',
  '.3ds': '3DS', '.skp': 'SKP', '.max': 'MAX', '.dwg': 'DWG', '.dxf': 'DXF',
  '.rfa': 'RFA', '.rvt': 'RVT', '.step': 'STEP', '.stp': 'STEP', '.iges': 'IGES', '.igs': 'IGES',
  '.zip': 'ARCHIVE', '.rar': 'ARCHIVE', '.7z': 'ARCHIVE',
};

/**
 * Manufacturer files that carry geometry, separated from the ones that do not.
 *
 * The label the manufacturer gives the file is evidence. TOTO ships a .dwg
 * under the heading "Bản vẽ 2D" — a 2D drawing — so it is recorded as
 * DWG_2D and never counted as a 3D source, however much the word CAD invites
 * it. A DWG with no such label stays DWG, because it might hold geometry and
 * a person should look.
 */
function classifyManufacturerFile(file) {
  const url = String(file.sourceUrl || '');
  const ext = path.extname(url.split('?')[0]).toLowerCase();
  const format = EXT_FORMAT[ext] ?? (ext === '.pdf' ? 'PDF' : 'OTHER');
  const label = `${file.label || ''} ${file.type || ''}`.toLowerCase();
  const says2d = label.includes('2d') || label.includes('bản vẽ 2d');
  if ((format === 'DWG' || format === 'DXF') && says2d) return `${format}_2D`;
  return format;
}

const GEOMETRY_FORMATS = new Set([
  'GLB', 'GLTF', 'FBX', 'OBJ', 'DAE', '3DS', 'SKP', 'MAX', 'RFA', 'RVT', 'STEP', 'IGES', 'DWG', 'DXF',
]);

/* ----------------------------------------------------------- GLB metrics */

/**
 * Measures an existing GLB. Uses @gltf-transform when it is installed and
 * falls back to the file size alone when it is not, because a smaller report
 * is better than an invented one.
 */
async function inspectGlb(absPath, tools) {
  const { size } = await stat(absPath);
  const metrics = { fileSizeBytes: size };
  if (!tools['@gltf-transform/core']) return { ...metrics, inspected: false };

  try {
    const { NodeIO } = await import('@gltf-transform/core');
    const doc = await new NodeIO().read(absPath);
    const root = doc.getRoot();

    let triangles = 0;
    let primitives = 0;
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        primitives += 1;
        const indices = prim.getIndices();
        const position = prim.getAttribute('POSITION');
        const count = indices ? indices.getCount() : position ? position.getCount() : 0;
        triangles += Math.floor(count / 3);
      }
    }

    // Bounding box in the file's own units; the unit itself is unknown until a
    // person says so, which is exactly why scale is a separate QA check.
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION');
        if (!pos) continue;
        const pmin = pos.getMin([0, 0, 0]);
        const pmax = pos.getMax([0, 0, 0]);
        min = min.map((v, i) => Math.min(v, pmin[i]));
        max = max.map((v, i) => Math.max(v, pmax[i]));
      }
    }
    const bbox = min.every(Number.isFinite)
      ? { x: +(max[0] - min[0]).toFixed(4), y: +(max[1] - min[1]).toFixed(4), z: +(max[2] - min[2]).toFixed(4) }
      : undefined;

    return {
      ...metrics,
      inspected: true,
      sceneCount: root.listScenes().length,
      nodeCount: root.listNodes().length,
      meshCount: root.listMeshes().length,
      primitiveCount: primitives,
      triangleCount: triangles,
      materialCount: root.listMaterials().length,
      textureCount: root.listTextures().length,
      bboxUnits: bbox,
    };
  } catch (err) {
    return { ...metrics, inspected: false, error: String(err).slice(0, 200) };
  }
}

async function findGlbFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await findGlbFiles(full, acc);
    else if (/\.(glb|gltf)$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

/* -------------------------------------------------------------------- run */

async function main() {
  const tools = await probeTools();

  const enrichment = JSON.parse(
    await readFile(path.join(ROOT, 'data/demo/manufacturer-enrichment.json'), 'utf8')
  );
  const fixture = JSON.parse(
    await readFile(path.join(ROOT, 'data/demo/tungdang-sanitaryware.json'), 'utf8')
  );

  const products = [];
  const formatTally = {};

  for (const [key, record] of Object.entries(enrichment.products ?? {})) {
    const files = record.files ?? [];
    const classified = files.map((f) => ({
      type: f.type,
      label: f.label,
      format: classifyManufacturerFile(f),
      sourceUrl: f.sourceUrl,
      sourceSection: f.sourceSection,
    }));

    for (const f of classified) formatTally[f.format] = (formatTally[f.format] ?? 0) + 1;

    const geometry = classified.filter((f) => GEOMETRY_FORMATS.has(f.format));
    products.push({
      key,
      brand: record.brand ?? null,
      sku: record.sku ?? null,
      officialSku: record.officialSku ?? null,
      manufacturerProductUrl: record.manufacturerProductUrl ?? null,
      fileCount: classified.length,
      files: classified,
      geometrySourceCount: geometry.length,
      geometryFormats: [...new Set(geometry.map((f) => f.format))],
      conversionCapability: geometry.length
        ? [...new Set(geometry.map((f) => capabilityFor(f.format, tools)))]
        : [],
      // Having a spec sheet is what makes dimension QA possible later, so it is
      // worth counting even though it is not geometry.
      hasTechnicalSpec: classified.some((f) => f.type === 'TECHNICAL_SPEC'),
      status: geometry.length ? 'SOURCE_DISCOVERED' : 'SOURCE_UNAVAILABLE',
    });
  }

  const glbFiles = await findGlbFiles(path.join(ROOT, 'public'));
  const runtimeAssets = [];
  for (const file of glbFiles) {
    runtimeAssets.push({
      path: '/' + path.relative(path.join(ROOT, 'public'), file).split(path.sep).join('/'),
      ...(await inspectGlb(file, tools)),
    });
  }

  const withGeometry = products.filter((p) => p.geometrySourceCount > 0);
  const report = {
    generatedAt: new Date().toISOString(),
    tenant: 'tungdang',
    tools,
    formatSupport: Object.fromEntries(
      ['GLB', 'GLTF', 'FBX', 'OBJ', 'DAE', '3DS', 'SKP', 'MAX', 'DWG', 'DWG_2D', 'DXF', 'RFA', 'RVT', 'STEP', 'IGES']
        .map((f) => [f, capabilityFor(f, tools)])
    ),
    summary: {
      catalogProducts: (fixture.products ?? []).length,
      enrichedProducts: products.length,
      productsWithGeometrySource: withGeometry.length,
      productsWithTechnicalSpec: products.filter((p) => p.hasTechnicalSpec).length,
      manufacturerFileFormats: formatTally,
      runtimeGlbCount: runtimeAssets.length,
      registeredAssets: 0,
      readyAssets: 0,
    },
    runtimeAssets,
    products,
  };

  await writeFile(OUT, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`tools:`);
  for (const [k, v] of Object.entries(tools)) console.log(`  ${v ? 'co ' : '-- '} ${k}`);
  console.log(`\nsan pham duoc lam giau       : ${products.length}`);
  console.log(`co nguon hinh hoc 3D         : ${withGeometry.length}`);
  console.log(`co thong so ky thuat         : ${report.summary.productsWithTechnicalSpec}`);
  console.log(`dinh dang file tu hang       : ${JSON.stringify(formatTally)}`);
  console.log(`GLB trong public/            : ${runtimeAssets.length}`);
  for (const a of runtimeAssets) {
    const mb = (a.fileSizeBytes / 1_048_576).toFixed(1);
    console.log(`  ${a.path}  ${mb}MB  tris=${a.triangleCount ?? '?'}  mats=${a.materialCount ?? '?'}  texs=${a.textureCount ?? '?'}`);
  }
  console.log(`\nda ghi ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
