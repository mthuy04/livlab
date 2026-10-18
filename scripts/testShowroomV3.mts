import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const phoneModule = await import(new URL('../lib/contact/normalizePhone.ts', import.meta.url).href);
const limiterModule = await import(new URL('../lib/security/publicLookupRateLimiter.ts', import.meta.url).href);
const { normalizePhone, isPlausiblePhone } = phoneModule;
const { checkPublicLookupRateLimit } = limiterModule;

assert.equal(normalizePhone('090 123 45 67'), '0901234567');
assert.equal(normalizePhone('+84 901-234-567'), '0901234567');
assert.equal(isPlausiblePhone('0901234567'), true);
assert.equal(isPlausiblePhone('abc'), false);

const rateKey = `showroom-v3-test-${Date.now()}`;
assert.deepEqual(checkPublicLookupRateLimit(rateKey), { allowed: true });
assert.equal(checkPublicLookupRateLimit(rateKey).allowed, false);

const tenantConfig = await readFile(new URL('../lib/storefront/tenantConfig.ts', import.meta.url), 'utf8');
assert.match(tenantConfig, /requestWorkspace:\s*\{\s*showroomId:\s*'workspace-demo-tungdang',\s*kind:\s*'DEMO'\s*\}/);
assert.match(tenantConfig, /publicDemo:\s*true/);

const migration = await readFile(new URL('../db/migrations/20261018_showroom_workspace_v3.sql', import.meta.url), 'utf8');
const statements = migration
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n');
assert.equal(/\b(DROP|TRUNCATE|RENAME)\b/i.test(statements), false);
assert.match(statements, /workspace-demo-tungdang/);
assert.match(statements, /WorkspaceKind/);

console.log('Showroom V3 unit checks passed.');
