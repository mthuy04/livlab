-- ============================================================================
-- LivLab Showroom Workspace V3 — additive manual migration
--
-- Depends on: 20261007_showroom_workspace_v2.sql
-- Do not run `prisma migrate deploy` or `prisma db push` against production.
-- Apply this reviewed file first to a Neon branch as described in README.md.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceKind') THEN
    CREATE TYPE "WorkspaceKind" AS ENUM ('LIVE', 'DEMO');
  END IF;
END;
$$;

ALTER TABLE "Showroom"
  ADD COLUMN IF NOT EXISTS "tenantKey" TEXT,
  ADD COLUMN IF NOT EXISTS "workspaceKind" "WorkspaceKind" NOT NULL DEFAULT 'LIVE';

ALTER TABLE "QuoteLead"
  ADD COLUMN IF NOT EXISTS "requestCode" TEXT,
  ADD COLUMN IF NOT EXISTS "normalizedPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceTenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "submissionKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Showroom_tenantKey_key" ON "Showroom"("tenantKey");
CREATE UNIQUE INDEX IF NOT EXISTS "QuoteLead_requestCode_key" ON "QuoteLead"("requestCode");
CREATE UNIQUE INDEX IF NOT EXISTS "QuoteLead_submissionKey_key" ON "QuoteLead"("submissionKey");
CREATE INDEX IF NOT EXISTS "QuoteLead_requestCode_normalizedPhone_idx" ON "QuoteLead"("requestCode", "normalizedPhone");
CREATE INDEX IF NOT EXISTS "QuoteLead_sourceTenantId_createdAt_idx" ON "QuoteLead"("sourceTenantId", "createdAt");

-- Configuration row, not operational seed data. The stable id and tenantKey
-- make the Tùng Đăng public demo route explicit; it can never fall through to
-- a live showroom selected by table order.
INSERT INTO "Showroom" (
  "id", "name", "status", "tenantKey", "workspaceKind", "createdAt", "updatedAt"
) VALUES (
  'workspace-demo-tungdang',
  'Bếp Tùng Đăng — Demo Workspace',
  'ACTIVE',
  'tungdang',
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
