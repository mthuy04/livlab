import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('../data/demo/giangson-catalog.json', import.meta.url), 'utf8'));
const gallery = JSON.parse(await readFile(new URL('../data/demo/giangson-gallery-references.json', import.meta.url), 'utf8'));
const types = fixture.products.filter((product: { recordType: string }) => product.recordType === 'PRODUCT_TYPE');
const skus = fixture.products.filter((product: { recordType: string }) => product.recordType === 'VERIFIED_SKU');
assert.equal(types.length, 57);
assert.equal(skus.length, 5);
assert.equal(new Set(fixture.products.map((product: { category: string }) => product.category)).size, 8);
assert.ok(types.every((product: { sku: unknown; showroomPrice: unknown }) => product.sku === null && product.showroomPrice === null));
assert.ok(skus.every((product: { sku: unknown; marketReferencePrice: number; priceSourceUrl: string; priceType: string }) =>
  product.sku && product.marketReferencePrice > 0 && product.priceSourceUrl.startsWith('https://') && product.priceType === 'MARKET_REFERENCE'
));
assert.ok(fixture.products.every((product: { primaryImage: string }) => !product.primaryImage.includes('trangvangvietnam.com')));
assert.equal(gallery.images.length, 62);
assert.ok(gallery.images.every((image: { rightsStatus: string }) => image.rightsStatus === 'UNVERIFIED_FOR_COMMERCIAL_REUSE'));

const tenantConfig = await readFile(new URL('../lib/storefront/tenantConfig.ts', import.meta.url), 'utf8');
assert.match(tenantConfig, /id:\s*'giangson'/);
assert.match(tenantConfig, /workspace-demo-giangson/);
assert.match(tenantConfig, /publicDemo:\s*true/);
assert.match(tenantConfig, /0395 279 360/);

const migration = await readFile(new URL('../db/migrations/20261018_giangson_showroom_v1.sql', import.meta.url), 'utf8');
const statements = migration.split('\n').filter((line) => !line.trimStart().startsWith('--')).join('\n');
assert.equal(/\b(DROP|TRUNCATE|RENAME)\b/i.test(statements), false);
assert.match(statements, /RETAIL_RFQ/);
assert.match(statements, /PROJECT_RFQ/);

const surfaceEstimate = (kind: 'floor' | 'walls', l: number, w: number, h: number, waste: number) => {
  const area = kind === 'floor' ? l * w : 2 * (l + w) * h;
  return { area, estimated: Number((area * (1 + waste / 100)).toFixed(2)) };
};
assert.deepEqual(surfaceEstimate('floor', 3, 2, 2.7, 10), { area: 6, estimated: 6.6 });
assert.deepEqual(surfaceEstimate('walls', 3, 2, 2.7, 10), { area: 27, estimated: 29.7 });

console.log('Giang Sơn showroom V1 integrity checks passed.');
