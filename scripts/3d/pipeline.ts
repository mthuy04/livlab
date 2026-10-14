/**
 * Shared plumbing for the 3D conversion commands.
 *
 * Everything here reads from `lib/room-studio/product3dRegistry` rather than
 * from a table of its own. The official dimensions a conversion is judged
 * against must be the same numbers the app judges the asset by — two copies
 * would eventually disagree, and the disagreement would surface as an asset
 * that passed conversion QA and fails in the room.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { allProduct3DAssets, getProduct3DAssetBySku } from '../../lib/room-studio/product3dRegistry';
import { needsDimensionReview, dimensionReviewFor } from '../../lib/room-studio/dimensionReview';
import type { Product3DAsset } from '../../lib/room-studio/product3dAsset';

export const ROOT = process.cwd();

export const WORKSPACE = {
  incoming: path.join(ROOT, 'assets/3d/work/incoming'),
  normalized: path.join(ROOT, 'assets/3d/work/normalized'),
  reports: path.join(ROOT, 'assets/3d/work/reports'),
  screenshots: path.join(ROOT, 'assets/3d/work/screenshots'),
} as const;

/** §12: what the Blender importer will actually accept. */
export const SUPPORTED_INPUT_FORMATS = ['.fbx', '.obj', '.gltf', '.glb'] as const;

/**
 * Where Blender might be. Checked in order; the first that answers
 * `--version` wins. Nothing is installed by any of these commands.
 */
const BLENDER_CANDIDATES = [
  process.env.BLENDER_PATH,
  '/Applications/Blender.app/Contents/MacOS/Blender',
  '/usr/local/bin/blender',
  '/opt/homebrew/bin/blender',
  'blender',
].filter((p): p is string => Boolean(p));

export interface BlenderInfo {
  path: string;
  version: string;
}

export function findBlender(): BlenderInfo | null {
  for (const candidate of BLENDER_CANDIDATES) {
    try {
      const result = spawnSync(candidate, ['--version'], { encoding: 'utf8', timeout: 20_000 });
      if (result.status === 0 && result.stdout) {
        const version = result.stdout.split('\n')[0].trim();
        return { path: candidate, version };
      }
    } catch {
      /* try the next one */
    }
  }
  return null;
}

/** The lowercase stem a source file for this SKU is expected to use. */
export function sourceStem(asset: Product3DAsset): string {
  return `${asset.brand.toLowerCase()}_${asset.sku.toLowerCase()}_source`;
}

export function runtimeDir(asset: Product3DAsset, version = 1): string {
  return path.join(
    ROOT,
    'public/assets/3d',
    asset.brand.toLowerCase(),
    asset.sku.toLowerCase(),
    `v${version}`
  );
}

/**
 * §71: the runtime url carries a version segment.
 *
 * A GLB replaced at the same url is a GLB that some browsers keep serving from
 * cache after the geometry changed. Versioning the path is cheaper than
 * explaining why one customer sees last month's model.
 */
export function runtimeUrl(asset: Product3DAsset, version = 1): string {
  return `/assets/3d/${asset.brand.toLowerCase()}/${asset.sku.toLowerCase()}/v${version}/runtime.glb`;
}

export function masterPath(asset: Product3DAsset): string {
  return path.join(WORKSPACE.normalized, `${sourceStem(asset)}_master.glb`);
}

export function reportPath(asset: Product3DAsset): string {
  return path.join(WORKSPACE.reports, `${asset.brand.toLowerCase()}_${asset.sku.toLowerCase()}.json`);
}

export interface IncomingFile {
  file: string;
  absPath: string;
  ext: string;
  sizeBytes: number;
  /** The registry asset whose expected stem this filename matches, if any. */
  asset: Product3DAsset | null;
  supported: boolean;
}

/** §61: what is sitting in `incoming/`, and which SKU each file belongs to. */
export function listIncoming(): IncomingFile[] {
  if (!existsSync(WORKSPACE.incoming)) return [];
  const assets = allProduct3DAssets();

  return readdirSync(WORKSPACE.incoming)
    .filter((f) => !f.startsWith('.'))
    .map((file) => {
      const absPath = path.join(WORKSPACE.incoming, file);
      const ext = path.extname(file).toLowerCase();
      const stem = path.basename(file, ext).toLowerCase();
      // Matched on the expected stem, not on a fuzzy SKU search: a file called
      // `toilet_final_v2.fbx` must stay unmatched rather than be attached to
      // whichever SKU it resembles most.
      const asset = assets.find((a) => sourceStem(a) === stem) ?? null;
      return {
        file,
        absPath,
        ext,
        sizeBytes: statSync(absPath).size,
        asset,
        supported: (SUPPORTED_INPUT_FORMATS as readonly string[]).includes(ext),
      };
    })
    .sort((a, b) => a.file.localeCompare(b.file));
}

export function resolveSku(sku: string): Product3DAsset | null {
  const normalized = sku.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const assets = allProduct3DAssets();
  return (
    assets.find((a) => a.normalizedSku === normalized) ??
    getProduct3DAssetBySku('INAX', normalized) ??
    null
  );
}

/**
 * Reasons this SKU must not be converted or activated yet, independent of any
 * file. Checked before Blender runs, because spending a conversion on a SKU
 * whose target dimensions are disputed produces a confident wrong answer.
 */
export function blockers(asset: Product3DAsset): string[] {
  const out: string[] = [];

  const { width, depth, height } = asset.dimensionsMm;
  if (!width || !depth || !height) {
    out.push('MISSING_OFFICIAL_DIMENSIONS: không có đủ ba chiều của hãng để đối chiếu.');
  }

  if (needsDimensionReview(asset.sku)) {
    const review = dimensionReviewFor(asset.sku)!;
    out.push(`DIMENSION_REVIEW_REQUIRED: ${review.catalogueValue} — ${review.reason}`);
  }

  if (!asset.qa.identityVerified) {
    out.push('IDENTITY_NOT_VERIFIED: chưa xác nhận file này đúng là SKU này.');
  }

  return out;
}

export function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function parseArgs(argv: string[]): Record<string, string | true> {
  const args: Record<string, string | true> = {};
  let key: string | null = null;
  for (const token of argv) {
    if (token.startsWith('--')) {
      key = token.slice(2);
      args[key] = true;
    } else if (key) {
      args[key] = token;
      key = null;
    }
  }
  return args;
}

export const fmtBytes = (n: number) =>
  n >= 1_048_576 ? `${(n / 1_048_576).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`;
