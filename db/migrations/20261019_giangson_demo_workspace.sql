-- ============================================================================
-- LivLab — Giang Sơn demo workspace (configuration row only)
--
-- Depends on: 20261018_showroom_workspace_v3.sql (tenantKey, workspaceKind).
-- Gives the public Giang Sơn demo storefront an owned inbox for the quote
-- requests it collects, exactly as the V3 migration did for Tùng Đăng. No
-- leads, quotes, prices or users are written.
-- ============================================================================

BEGIN;

INSERT INTO "Showroom" (
  "id", "name", "phone", "address", "status", "tenantKey", "workspaceKind", "createdAt", "updatedAt"
) VALUES (
  'workspace-demo-giangson',
  'Giang Sơn Việt Nam — Demo Workspace',
  '0395 279 360',
  'Số 240 Hồ Tùng Mậu, P. Phú Diễn, Q. Bắc Từ Liêm, Hà Nội',
  'ACTIVE',
  'giangson',
  'DEMO',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "tenantKey" = EXCLUDED."tenantKey",
  "workspaceKind" = EXCLUDED."workspaceKind",
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "Showroom"."workspaceKind" = 'DEMO' OR "Showroom"."tenantKey" IS NULL;

COMMIT;
