import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Normalised local copies of product imagery.
 *
 * `scripts/normalize_product_images.py` trims the empty margin around each
 * product, adds a little safe padding and writes a square WebP under
 * public/demo/manufacturers/{brand}/. The catalogue prefers that copy, which
 * is what removes the cream-stage-around-a-white-JPEG-around-a-small-product
 * nesting: once the margin is gone, one canvas holds one product.
 *
 * Only empty outer margin is cropped. No colour, geometry or marking on the
 * product itself is touched, and nothing is upscaled.
 */

export interface ImageAsset {
  localPath?: string;
  width?: number;
  height?: number;
  processing?: string[];
  trimMethod?: string;
  provenance?: {
    imageSourceUrl: string;
    assetOwner: string;
    sourceType: string;
    originalFormat: string;
    originalWidth: number;
    originalHeight: number;
    checkedAt: string;
  };
  error?: string;
}

let cache: Map<string, ImageAsset> | null = null;

export async function imageAssets(): Promise<Map<string, ImageAsset>> {
  if (cache) return cache;
  cache = new Map();
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'demo', 'image-assets.json'), 'utf8');
    const file = JSON.parse(raw) as { assets: Record<string, ImageAsset> };
    for (const [id, asset] of Object.entries(file.assets ?? {})) {
      if (asset.localPath) cache.set(id, asset);
    }
  } catch {
    // Not normalised yet: the catalogue uses the source image directly.
  }
  return cache;
}
