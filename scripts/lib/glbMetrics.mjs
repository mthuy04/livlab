/**
 * What a GLB actually contains, measured rather than declared.
 *
 * Lifted out of `audit_3d_assets.mjs` so the dev pipeline harness and the real
 * product audit report the same numbers from the same code. Two measuring
 * tapes eventually disagree, and the one that disagrees quietly is the one
 * that decides whether a product ships.
 */

import { stat } from 'node:fs/promises';

/**
 * Measures a GLB on disk.
 *
 * The bounding box is read from each primitive's POSITION accessor min/max and
 * is in the FILE's own units — the unit itself is unknown until a person says
 * so, which is exactly why scale is a separate QA check. Node transforms are
 * not applied, so an asset that carries its size in a node scale will measure
 * differently here than it renders; the ingestion contract requires transforms
 * baked, and this is one of the places that assumption is visible.
 */
export async function inspectGlb(absPath) {
  const { size } = await stat(absPath);
  /**
   * One shape whether it worked or not. A function that returns different
   * keys on failure forces every caller to re-derive which case it is, and
   * the caller that forgets reads `undefined` as a measurement.
   */
  const metrics = {
    fileSizeBytes: size,
    inspected: false,
    error: undefined,
    sceneCount: undefined,
    nodeCount: undefined,
    meshCount: undefined,
    primitiveCount: undefined,
    triangleCount: undefined,
    materialCount: undefined,
    textureCount: undefined,
    bboxUnits: undefined,
    bboxMin: undefined,
    bboxMax: undefined,
  };

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
    const finite = min.every(Number.isFinite);
    const bbox = finite
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
      /** Where the geometry sits relative to the file's origin. */
      bboxMin: finite ? min.map((v) => +v.toFixed(4)) : undefined,
      bboxMax: finite ? max.map((v) => +v.toFixed(4)) : undefined,
    };
  } catch (err) {
    return { ...metrics, inspected: false, error: String(err).slice(0, 200) };
  }
}

/**
 * Per-axis error against the figures the manufacturer published.
 *
 * The same formula the real pipeline uses (`checkDimensions` in
 * lib/room-studio/product3dAsset.ts): |actual − expected| / expected × 100.
 * Kept in both places because one is TypeScript inside the app and one is a
 * build script, and importing across that boundary for four lines of
 * arithmetic would be the more fragile choice. The tests assert they agree.
 */
export function dimensionError(expectedMm, actualMm) {
  const axes = ['width', 'depth', 'height'];
  const perAxis = {};
  let worst = 0;
  for (const axis of axes) {
    const expected = expectedMm[axis];
    const actual = actualMm[axis];
    if (!expected || actual === undefined) {
      perAxis[axis] = null;
      continue;
    }
    const pct = (Math.abs(actual - expected) / expected) * 100;
    perAxis[axis] = +pct.toFixed(3);
    worst = Math.max(worst, pct);
  }
  return { perAxis, worstPct: +worst.toFixed(3) };
}
