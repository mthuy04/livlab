import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * What the catalogue knows about each product's photograph.
 *
 * `scripts/audit_catalog_images.py` opens every asset the storefront exposes
 * and measures it — how white the ring around the product is, how much colour
 * or ink sits in that ring, how large the file is — then files a status. This
 * module reads that report so the catalogue can act on it: swap in a cleaner
 * sibling, fall back to a placeholder, or keep a product out of the demo grid
 * rather than put a dealer's phone number in front of a customer.
 *
 * Nothing here edits an image. A watermark is never painted out; a bad asset
 * is replaced, withheld, or named as a data-quality issue.
 */

export type ImageStatus =
  | 'CLEAN'
  | 'ACCEPTABLE'
  | 'LOW_RESOLUTION'
  | 'PROMOTIONAL'
  | 'WATERMARKED'
  | 'WRONG_TENANT_BRANDING'
  | 'MISSING'
  | 'NEEDS_REPLACEMENT';

/** Statuses that must not appear as a product's one image in the grid. */
export const REJECTED_STATUSES: ImageStatus[] = [
  'PROMOTIONAL',
  'WATERMARKED',
  'WRONG_TENANT_BRANDING',
  'NEEDS_REPLACEMENT',
  'MISSING',
];

export interface ImageVerdict {
  status: ImageStatus;
  /** A cleaner sibling the audit found and the catalogue should use instead. */
  replacementImage?: string;
  /** What the primary scored before the replacement was substituted. */
  originalStatus?: ImageStatus;
  width?: number;
  height?: number;
  imageSourceType?: string;
  imageSourceHost?: string;
}

interface AuditFile {
  tenants: Record<
    string,
    {
      products: {
        id: string;
        status: ImageStatus;
        replacementImage?: string;
        originalStatus?: ImageStatus;
        width?: number;
        height?: number;
        imageSourceType?: string;
        imageSourceHost?: string;
      }[];
    }
  >;
}

let cache: Map<string, Map<string, ImageVerdict>> | null = null;

async function load(): Promise<Map<string, Map<string, ImageVerdict>>> {
  if (cache) return cache;
  cache = new Map();
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'demo', 'image-audit.json'), 'utf8');
    const audit = JSON.parse(raw) as AuditFile;
    for (const [tenantId, data] of Object.entries(audit.tenants)) {
      const byProduct = new Map<string, ImageVerdict>();
      for (const row of data.products) {
        byProduct.set(row.id, {
          status: row.status,
          replacementImage: row.replacementImage,
          originalStatus: row.originalStatus,
          width: row.width,
          height: row.height,
          imageSourceType: row.imageSourceType,
          imageSourceHost: row.imageSourceHost,
        });
      }
      cache.set(tenantId, byProduct);
    }
  } catch {
    // No report yet: the catalogue shows everything and says nothing about it.
  }
  return cache;
}

export async function imageVerdicts(tenantId: string): Promise<Map<string, ImageVerdict>> {
  return (await load()).get(tenantId) ?? new Map();
}

export const isRejected = (status: ImageStatus): boolean => REJECTED_STATUSES.includes(status);
