#!/usr/bin/env node
// Read-only material inspector for AR pitch prep. Prints each GLB's materials
// (name, baseColorFactor, roughnessFactor, metalnessFactor) so a human can
// review PBR values before touching any asset — does not modify files.
// Usage: node scripts/inspectGlbMaterials.mjs [dir] (default: public/models)

import { readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { NodeIO } from '@gltf-transform/core';

const rootDir = process.argv[2] || 'public/models';

function findGlbFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      results.push(...findGlbFiles(fullPath));
    } else if (extname(entry).toLowerCase() === '.glb') {
      results.push(fullPath);
    }
  }
  return results;
}

const io = new NodeIO();
const glbFiles = findGlbFiles(rootDir);

if (glbFiles.length === 0) {
  console.log(`No .glb files found under ${rootDir}`);
  process.exit(0);
}

for (const filePath of glbFiles) {
  const document = await io.read(filePath);
  const materials = document.getRoot().listMaterials();

  console.log(`\n${relative('.', filePath)} (${materials.length} material${materials.length === 1 ? '' : 's'})`);
  materials.forEach((material, idx) => {
    const [r, g, b, a] = material.getBaseColorFactor();
    console.log(
      `  [${idx}] name="${material.getName() || '(unnamed)'}" ` +
      `baseColorFactor=[${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}, ${a.toFixed(3)}] ` +
      `roughnessFactor=${material.getRoughnessFactor().toFixed(3)} ` +
      `metalnessFactor=${material.getMetallicFactor().toFixed(3)}`
    );
  });
}
