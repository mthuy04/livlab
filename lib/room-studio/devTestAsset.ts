import type { RoomStudioProduct } from './productAdapter';

/**
 * The dev-only pipeline fixture. Not a product, and deliberately shaped so it
 * cannot become one.
 *
 * It exists to prove the runtime GLB path — load, measure, scale, orient,
 * place, select, rotate, dispose — before the first manufacturer FBX arrives,
 * so that when a real asset finally lands we are judging the asset and not the
 * loader.
 *
 * Three things keep it out of the storefront, and all three are checked by
 * `scripts/testDevGlbPipeline.mts`:
 *
 *   1. It is NOT in `product3dRegistry`, so `getProduct3DAsset()` cannot
 *      resolve it and `isRoomStudioReady()` can never be true for it.
 *   2. It carries no `sku` and no `brand`. There is nothing for the catalogue
 *      to match on, in either direction.
 *   3. `loadRoomStudioProducts()` never returns it — it is constructed here
 *      and imported only by the dev route, which is code-split away from the
 *      customer bundle.
 *
 * Its `capability` is `EXACT_DIMENSIONS`, which is the literal truth: we know
 * its size because we generated it, and it is not a verified product asset.
 * `VERIFIED_3D` requires a READY registry record and this will never have one.
 */

/** Matches `scripts/build_dev_test_glb.mjs`. Round numbers, no real SKU. */
export const DEV_TEST_FIXTURE_MM = { width: 400, depth: 800, height: 600 } as const;

/**
 * Hardcoded. There is no query parameter and no configuration hook that could
 * point the loader at an arbitrary URL — the harness must not become a way to
 * render whatever a link says.
 */
export const DEV_TEST_FIXTURE_URL = '/dev-assets/3d/test-fixture.glb';

/** A path that is certain not to exist, for the failure test (§24). */
export const DEV_TEST_MISSING_URL = '/dev-assets/3d/does-not-exist.glb';

export const DEV_TEST_ASSET_ID = 'dev-test-fixture';

/**
 * Built as a real `RoomStudioProduct` on purpose: the dev route then travels
 * exactly the same component path a product does — `PlacedProductNode` →
 * `useGLTF` → `resolveModelScale` → `getRealWorldSize` — rather than a parallel
 * one that could pass while the real path is broken.
 */
export function createDevTestProduct(modelUrl: string = DEV_TEST_FIXTURE_URL): RoomStudioProduct {
  return {
    id: DEV_TEST_ASSET_ID,
    // No sku, no brand, no slug: nothing a catalogue lookup could match.
    name: 'TEST FIXTURE — kiểm thử pipeline, không phải sản phẩm',
    category: 'TEST',
    normalizedCategory: 'toilet',
    width: DEV_TEST_FIXTURE_MM.width / 1000,
    depth: DEV_TEST_FIXTURE_MM.depth / 1000,
    height: DEV_TEST_FIXTURE_MM.height / 1000,
    dimensionsLabel: `${DEV_TEST_FIXTURE_MM.width} × ${DEV_TEST_FIXTURE_MM.depth} × ${DEV_TEST_FIXTURE_MM.height} mm`,
    model3dUrl: modelUrl,
    capability: 'EXACT_DIMENSIONS',
    placementType: 'floor',
    // `source` is the catalogue record a real product carries into the quote.
    // The fixture has none, and the dev route has no quote actions, so this is
    // a minimal stand-in that would fail loudly if anything tried to sell it.
    source: {
      id: DEV_TEST_ASSET_ID,
      name: 'TEST FIXTURE',
      category: 'TEST',
    } as RoomStudioProduct['source'],
  };
}
