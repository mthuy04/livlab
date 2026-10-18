-- LivLab × Giang Sơn V1 — additive migration.
-- Review and apply to a database branch first. Do not run against production
-- without explicit approval and a successful backup/rollback rehearsal.

BEGIN;

ALTER TYPE "LeadRequestType" ADD VALUE IF NOT EXISTS 'RETAIL_RFQ';
ALTER TYPE "LeadRequestType" ADD VALUE IF NOT EXISTS 'PROJECT_RFQ';

INSERT INTO "Showroom" (
  "id", "name", "phone", "status", "tenantKey", "workspaceKind", "createdAt", "updatedAt"
) VALUES (
  'workspace-demo-giangson',
  'Giang Sơn — Demo Workspace',
  '0395 279 360',
  'ACTIVE',
  'giangson',
  'DEMO',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "phone" = EXCLUDED."phone",
  "tenantKey" = EXCLUDED."tenantKey",
  "workspaceKind" = EXCLUDED."workspaceKind",
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "Showroom"."workspaceKind" = 'DEMO' OR "Showroom"."tenantKey" IS NULL;

COMMIT;
