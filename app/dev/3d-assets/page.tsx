import type { Metadata } from 'next';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { allProduct3DAssets } from '@/lib/room-studio/product3dRegistry';
import { isRoomStudioReady, QA_CHECKS, checkDimensions, performanceTargetFor } from '@/lib/room-studio/product3dAsset';
import { DIMENSION_REVIEW_REQUIRED } from '@/lib/room-studio/dimensionReview';
import { DEV_TEST_FIXTURE_MM, DEV_TEST_FIXTURE_URL } from '@/lib/room-studio/devTestAsset';
import AssetQaClient, { type AssetRow } from './AssetQaClient';

export const metadata: Metadata = {
  title: '3D asset QA (dev)',
  robots: { index: false, follow: false },
};

/** Never prerendered: it reads whatever GLBs happen to be on disk right now. */
export const dynamic = 'force-dynamic';

/**
 * Inspection bench for converted 3D assets.
 *
 * Deliberately NOT the Room Studio scene. That route answers "does this sit
 * correctly in a bathroom"; this one answers "what did we actually get" —
 * neutral ground, neutral light, no tiles to flatter the model with. A
 * manufacturer mesh that only looks right in a styled room is a mesh whose
 * problems are being hidden by the room.
 *
 * Measurement happens here, on the server, with the same `inspectGlb` the
 * conversion command and the product audit use.
 */
export default async function Asset3DQaPage() {
  const { inspectGlb } = await import('../../../scripts/lib/glbMetrics.mjs');
  const root = process.cwd();

  const rows: AssetRow[] = [];

  for (const asset of allProduct3DAssets()) {
    const url = asset.runtime.glbUrl ?? null;
    const abs = url ? path.join(root, 'public', url.replace(/^\//, '')) : null;
    const metrics = abs && existsSync(abs) ? await inspectGlb(abs) : null;

    const measuredMm =
      metrics?.inspected && metrics.bboxUnits
        ? {
            width: Math.round(metrics.bboxUnits.x * 1000),
            depth: Math.round(metrics.bboxUnits.z * 1000),
            height: Math.round(metrics.bboxUnits.y * 1000),
          }
        : null;

    const dimension = measuredMm ? checkDimensions(asset.dimensionsMm, measuredMm) : null;
    const target = performanceTargetFor(asset.placement.type);

    rows.push({
      id: asset.id,
      kind: 'PRODUCT',
      brand: asset.brand,
      sku: asset.sku,
      status: asset.status,
      relationType: asset.identity.relationType,
      sourceFormat: asset.source.originalFormat,
      sourceFile: asset.source.originalFileName ?? null,
      sourceUrl: asset.source.url ?? '',
      placement: asset.placement.type,
      pivot: asset.placement.pivot,
      officialMm: {
        width: asset.dimensionsMm.width ?? null,
        depth: asset.dimensionsMm.depth ?? null,
        height: asset.dimensionsMm.height ?? null,
      },
      glbUrl: url,
      measuredMm,
      dimensionChecks:
        dimension?.checks.map((c) => ({ axis: c.axis, modelMm: c.modelMm, officialMm: c.officialMm, errorPct: c.errorPct })) ??
        null,
      worstErrorPct: dimension?.worstErrorPct ?? null,
      metrics: metrics?.inspected
        ? {
            fileSizeBytes: metrics.fileSizeBytes,
            triangleCount: metrics.triangleCount ?? 0,
            meshCount: metrics.meshCount ?? 0,
            materialCount: metrics.materialCount ?? 0,
            textureCount: metrics.textureCount ?? 0,
            bboxMin: metrics.bboxMin ?? null,
          }
        : null,
      performanceTarget: target ? { triangles: target.triangles, maxBytes: target.maxBytes } : null,
      qa: Object.fromEntries(QA_CHECKS.map((c) => [c, asset.qa[c]])) as Record<string, boolean>,
      ready: isRoomStudioReady(asset),
      note: asset.note ?? null,
    });
  }

  /**
   * The synthetic fixture is listed so the bench has something to load while
   * no product does — and listed as its own kind, with no brand and no SKU, so
   * it can never be mistaken for one of the rows above it.
   */
  const fixtureAbs = path.join(root, 'public', DEV_TEST_FIXTURE_URL.replace(/^\//, ''));
  if (existsSync(fixtureAbs)) {
    const metrics = await inspectGlb(fixtureAbs);
    const measuredMm = metrics.inspected && metrics.bboxUnits
      ? {
          width: Math.round(metrics.bboxUnits.x * 1000),
          depth: Math.round(metrics.bboxUnits.z * 1000),
          height: Math.round(metrics.bboxUnits.y * 1000),
        }
      : null;
    const dimension = measuredMm ? checkDimensions(DEV_TEST_FIXTURE_MM, measuredMm) : null;

    rows.push({
      id: 'dev-test-fixture',
      kind: 'SYNTHETIC',
      brand: '—',
      sku: '—',
      status: 'DEV_FIXTURE',
      relationType: 'NOT_A_PRODUCT',
      sourceFormat: 'GLB',
      sourceFile: 'scripts/3d/../build_dev_test_glb.mjs',
      sourceUrl: '',
      placement: 'FLOOR_TOILET',
      pivot: 'BACK_CENTER_FLOOR',
      officialMm: DEV_TEST_FIXTURE_MM,
      glbUrl: DEV_TEST_FIXTURE_URL,
      measuredMm,
      dimensionChecks:
        dimension?.checks.map((c) => ({ axis: c.axis, modelMm: c.modelMm, officialMm: c.officialMm, errorPct: c.errorPct })) ??
        null,
      worstErrorPct: dimension?.worstErrorPct ?? null,
      metrics: metrics.inspected
        ? {
            fileSizeBytes: metrics.fileSizeBytes,
            triangleCount: metrics.triangleCount ?? 0,
            meshCount: metrics.meshCount ?? 0,
            materialCount: metrics.materialCount ?? 0,
            textureCount: metrics.textureCount ?? 0,
            bboxMin: metrics.bboxMin ?? null,
          }
        : null,
      performanceTarget: null,
      qa: Object.fromEntries(QA_CHECKS.map((c) => [c, false])) as Record<string, boolean>,
      ready: false,
      note: 'Hình học tổng hợp để kiểm thử pipeline. Không phải sản phẩm, không gắn SKU, không bao giờ READY.',
    });
  }

  return (
    <AssetQaClient
      rows={rows}
      qaChecks={[...QA_CHECKS]}
      dimensionReviews={DIMENSION_REVIEW_REQUIRED}
    />
  );
}
