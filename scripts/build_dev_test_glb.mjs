#!/usr/bin/env node
/**
 * Generates the dev-only pipeline test fixture.
 *
 * This is NOT a product. It is three boxes with round numbers, made to prove
 * that a GLB travelling the real runtime path comes out the right size, the
 * right way round and sitting on the floor — before the first manufacturer FBX
 * arrives and we have to tell the difference between a bad conversion and a
 * bad loader.
 *
 * Authored to the ingestion contract in lib/room-studio/fbxIngestion.ts:
 *
 *   units      metres (1 unit = 1 metre)
 *   up         +Y
 *   forward    +Z          (the open side of the room)
 *   rear       -Z          (the installation face, against the wall)
 *   origin     BACK_CENTER_FLOOR — x centred, y on the floor, z at the rear
 *
 * So in local coordinates the geometry occupies x ∈ [-0.2, 0.2],
 * y ∈ [0, 0.6], z ∈ [0, 0.8]: nothing below the floor, nothing behind the
 * installation face. An asset that measures otherwise did not follow the
 * contract, and this file is the reference for what following it looks like.
 *
 *   node scripts/build_dev_test_glb.mjs
 */

import { Document, NodeIO } from '@gltf-transform/core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { inspectGlb, dimensionError } from './lib/glbMetrics.mjs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public/dev-assets/3d/test-fixture.glb');

/** Deliberately round, and deliberately NOT any real SKU's figures. */
export const TEST_FIXTURE_MM = { width: 400, depth: 800, height: 600 };

/**
 * Three boxes, in local metres. Asymmetric on purpose: if the model is loaded
 * backwards, or rotated, you can see it without measuring anything.
 *
 *   rear block   full height, narrow, hard against the installation face
 *   body         full width, low, the bulk of the volume
 *   front marker a small nub that reaches the front face and nothing else does
 */
const PARTS = [
  { name: 'rear-block', material: 'body', min: [-0.14, 0.0, 0.0], max: [0.14, 0.6, 0.15] },
  { name: 'body', material: 'body', min: [-0.2, 0.0, 0.15], max: [0.2, 0.35, 0.72] },
  { name: 'front-marker', material: 'marker', min: [-0.05, 0.08, 0.72], max: [0.05, 0.18, 0.8] },
];

/** 24 vertices so each face gets its own normal; flat shading, no smoothing. */
function boxGeometry(min, max) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const faces = [
    { n: [0, 0, 1], v: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] }, // front +Z
    { n: [0, 0, -1], v: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]] }, // rear -Z
    { n: [1, 0, 0], v: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]] }, // right +X
    { n: [-1, 0, 0], v: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] }, // left -X
    { n: [0, 1, 0], v: [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]] }, // top +Y
    { n: [0, -1, 0], v: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] }, // bottom -Y
  ];

  const positions = [];
  const normals = [];
  const indices = [];
  faces.forEach((face, f) => {
    face.v.forEach((vertex) => {
      positions.push(...vertex);
      normals.push(...face.n);
    });
    const base = f * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  return { positions, normals, indices };
}

/** Merges several boxes into one primitive's buffers. */
function mergeBoxes(boxes) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (const box of boxes) {
    const offset = positions.length / 3;
    const geo = boxGeometry(box.min, box.max);
    positions.push(...geo.positions);
    normals.push(...geo.normals);
    indices.push(...geo.indices.map((i) => i + offset));
  }
  return { positions, normals, indices };
}

async function main() {
  const doc = new Document();
  doc.createBuffer();

  // Two materials, so GLB material import is exercised rather than assumed.
  // Neutral and obviously synthetic: nothing here should read as sanitaryware.
  const materials = {
    body: doc
      .createMaterial('TEST_body')
      .setBaseColorFactor([0.906, 0.906, 0.898, 1])
      .setRoughnessFactor(0.85)
      .setMetallicFactor(0),
    marker: doc
      .createMaterial('TEST_marker_front')
      .setBaseColorFactor([0.42, 0.45, 0.48, 1])
      .setRoughnessFactor(0.6)
      .setMetallicFactor(0),
  };

  const mesh = doc.createMesh('TEST_FIXTURE');

  for (const materialKey of ['body', 'marker']) {
    const boxes = PARTS.filter((p) => p.material === materialKey);
    if (boxes.length === 0) continue;
    const { positions, normals, indices } = mergeBoxes(boxes);

    const position = doc
      .createAccessor(`POSITION_${materialKey}`)
      .setType('VEC3')
      .setArray(new Float32Array(positions));
    const normal = doc
      .createAccessor(`NORMAL_${materialKey}`)
      .setType('VEC3')
      .setArray(new Float32Array(normals));
    const index = doc
      .createAccessor(`INDEX_${materialKey}`)
      .setType('SCALAR')
      .setArray(new Uint16Array(indices));

    const prim = doc
      .createPrimitive()
      .setAttribute('POSITION', position)
      .setAttribute('NORMAL', normal)
      .setIndices(index)
      .setMaterial(materials[materialKey]);
    mesh.addPrimitive(prim);
  }

  // One node, identity transform. Size lives in the vertices, never in a node
  // scale — a loader that ignores node transforms must still measure 0.4 × 0.8
  // × 0.6, and the ingestion contract requires the same of real assets.
  const node = doc.createNode('TEST_FIXTURE').setMesh(mesh);
  doc.createScene('TEST_SCENE').addChild(node);

  await mkdir(path.dirname(OUT), { recursive: true });
  await new NodeIO().write(OUT, doc);

  const metrics = await inspectGlb(OUT);
  const actualMm = {
    width: Math.round(metrics.bboxUnits.x * 1000),
    depth: Math.round(metrics.bboxUnits.z * 1000),
    height: Math.round(metrics.bboxUnits.y * 1000),
  };
  const error = dimensionError(TEST_FIXTURE_MM, actualMm);

  console.log(`wrote ${path.relative(ROOT, OUT)}`);
  console.log(`  ${metrics.fileSizeBytes} bytes · ${metrics.triangleCount} tris · ` +
    `${metrics.meshCount} mesh · ${metrics.primitiveCount} prim · ` +
    `${metrics.materialCount} mat · ${metrics.textureCount} tex`);
  console.log(`  bbox   ${actualMm.width} × ${actualMm.depth} × ${actualMm.height} mm (W × D × H)`);
  console.log(`  origin min=[${metrics.bboxMin}] max=[${metrics.bboxMax}]`);
  console.log(`  error  W ${error.perAxis.width}% · D ${error.perAxis.depth}% · H ${error.perAxis.height}%`);

  if (error.worstPct > 0.001) {
    console.error(`\nFAIL: generated geometry is ${error.worstPct}% off its own spec.`);
    process.exit(1);
  }
  if (metrics.bboxMin[1] !== 0 || metrics.bboxMin[2] !== 0) {
    console.error('\nFAIL: origin is not BACK_CENTER_FLOOR (y and z minima must be 0).');
    process.exit(1);
  }
  console.log('\nok — matches its spec exactly, origin at back-center-floor.');
}

main();
