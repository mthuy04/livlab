/**
 * Does this DWG contain 3D geometry, or is it a drawing of the product?
 *
 *     npm run 3d:inspect-dwg -- assets/3d/sources/toto/CAD_CS838D_Rv02.dwg
 *
 * Manufacturers file both under the same word. TOTO Vietnam publishes eight
 * files labelled "CAD" for products in this catalogue, and every one of them
 * is a dimensioned 2D elevation — useful to an installer, useless as geometry.
 * Telling them apart by file size or by the word "CAD" is guessing; this
 * counts the entities.
 *
 * `SOLID` is deliberately counted as 2D. In DWG it is a filled triangle or
 * quad, not a solid body — the 3D one is `3DSOLID`, and confusing the two is
 * the single easiest way to conclude a drawing is a model.
 *
 * Requires LibreDWG (`brew install libredwg`). Without it, say so rather than
 * fall back to a weaker test that might answer differently.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Entities that carry three-dimensional surface or volume. */
const THREE_D = new Set([
  '3DSOLID', 'BODY', 'REGION', 'MESH', 'POLYLINE_PFACE', 'POLYLINE_MESH',
  'POLYLINE_3D', '3DFACE', '_3DFACE', 'SURFACE', 'PLANESURFACE',
  'EXTRUDEDSURFACE', 'REVOLVEDSURFACE', 'SWEPTSURFACE', 'LOFTEDSURFACE',
  'NURBSURFACE',
]);

/** Entities that only ever describe a flat drawing. */
const TWO_D = new Set([
  'LINE', 'LWPOLYLINE', 'POLYLINE_2D', 'VERTEX_2D', 'ARC', 'CIRCLE', 'ELLIPSE',
  'SPLINE', 'POINT', 'SOLID', 'TRACE', 'HATCH', 'TEXT', 'MTEXT', 'ATTRIB',
  'ATTDEF', 'LEADER', 'MLEADER', 'INSERT', 'DIMENSION_LINEAR',
  'DIMENSION_ALIGNED', 'DIMENSION_ANG2LN', 'DIMENSION_RADIUS',
  'DIMENSION_DIAMETER', 'DIMENSION_ORDINATE',
]);

export interface DwgVerdict {
  file: string;
  readable: boolean;
  error?: string;
  version?: string;
  entityCounts: Record<string, number>;
  threeDCount: number;
  twoDCount: number;
  /** HAS_3D_GEOMETRY | TWO_D_DRAWING_ONLY | UNREADABLE */
  verdict: 'HAS_3D_GEOMETRY' | 'TWO_D_DRAWING_ONLY' | 'UNREADABLE';
}

export function inspectDwg(file: string): DwgVerdict {
  const base: DwgVerdict = {
    file,
    readable: false,
    entityCounts: {},
    threeDCount: 0,
    twoDCount: 0,
    verdict: 'UNREADABLE',
  };

  if (!existsSync(file)) return { ...base, error: 'FILE_NOT_FOUND' };

  const header = readFileSync(file).subarray(0, 6).toString('ascii');
  const version = /^AC\d{4}$/.test(header) ? header : undefined;
  if (!version) return { ...base, error: 'NOT_A_DWG: header is not ACxxxx' };

  const probe = spawnSync('dwgread', ['--version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    return { ...base, version, error: 'DWG_TOOLING_MISSING: cần `brew install libredwg`' };
  }

  const out = path.join(mkdtempSync(path.join(tmpdir(), 'dwg-')), 'out.json');
  const run = spawnSync('dwgread', ['-O', 'JSON', '-o', out, file], {
    encoding: 'utf8',
    timeout: 180_000,
  });
  if (!existsSync(out)) {
    return { ...base, version, error: `DWG_READ_FAILED: ${run.stderr?.slice(0, 200)}` };
  }

  let parsed: { OBJECTS?: Array<Record<string, unknown>> };
  try {
    parsed = JSON.parse(readFileSync(out, 'utf8'));
  } catch (err) {
    return { ...base, version, error: `DWG_JSON_UNPARSEABLE: ${String(err).slice(0, 120)}` };
  }

  const counts: Record<string, number> = {};
  for (const obj of parsed.OBJECTS ?? []) {
    const name = String(obj.entity ?? obj.object ?? '?').toUpperCase();
    counts[name] = (counts[name] ?? 0) + 1;
  }

  let threeDCount = 0;
  let twoDCount = 0;
  for (const [name, n] of Object.entries(counts)) {
    if (THREE_D.has(name)) threeDCount += n;
    else if (TWO_D.has(name)) twoDCount += n;
  }

  return {
    file,
    readable: true,
    version,
    entityCounts: counts,
    threeDCount,
    twoDCount,
    verdict: threeDCount > 0 ? 'HAS_3D_GEOMETRY' : 'TWO_D_DRAWING_ONLY',
  };
}

/* ----------------------------------------------------------------- cli */

if (process.argv[1]?.endsWith('inspect_dwg.mts')) {
  const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (files.length === 0) {
    console.error('dùng: npm run 3d:inspect-dwg -- <file.dwg> [...]');
    process.exit(2);
  }
  let anyThreeD = false;
  for (const file of files) {
    const v = inspectDwg(file);
    console.log(`\n${path.basename(file)}  [${v.version ?? '?'}]`);
    if (!v.readable) {
      console.log(`  ${v.error}`);
      continue;
    }
    const top = Object.entries(v.entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    for (const [name, n] of top) {
      const tag = THREE_D.has(name) ? ' <== 3D' : TWO_D.has(name) ? ' (2D)' : '';
      console.log(`    ${name.padEnd(22)} ${String(n).padStart(5)}${tag}`);
    }
    console.log(`  3D: ${v.threeDCount}   2D: ${v.twoDCount}   -> ${v.verdict}`);
    if (v.verdict === 'TWO_D_DRAWING_ONLY') {
      console.log('  Bản vẽ kỹ thuật 2D. Không dùng làm model được — SOURCE_NOT_3D.');
    }
    anyThreeD ||= v.verdict === 'HAS_3D_GEOMETRY';
  }
  process.exit(anyThreeD ? 0 : 1);
}
