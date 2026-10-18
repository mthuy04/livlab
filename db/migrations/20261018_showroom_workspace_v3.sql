-- ============================================================================
-- LivLab Showroom Workspace V3 — additive manual migration
--
-- Depends on: 20261007_showroom_workspace_v2.sql
-- Do not run `prisma migrate deploy` or `prisma db push` against production.
-- Apply this reviewed file first to a Neon branch as described in README.md.
-- ============================================================================

BEGIN;

CREATE TYPE "WorkspaceKind" AS ENUM ('LIVE', 'DEMO');

ALTER TABLE "Showroom"
  ADD COLUMN "tenantKey" TEXT,
  ADD COLUMN "workspaceKind" "WorkspaceKind" NOT NULL DEFAULT 'LIVE';

ALTER TABLE "QuoteLead"
  ADD COLUMN "requestCode" TEXT,
  ADD COLUMN "normalizedPhone" TEXT,
  ADD COLUMN "sourceTenantId" TEXT,
  ADD COLUMN "submissionKey" TEXT;

CREATE UNIQUE INDEX "Showroom_tenantKey_key" ON "Showroom"("tenantKey");
CREATE UNIQUE INDEX "QuoteLead_requestCode_key" ON "QuoteLead"("requestCode");
CREATE UNIQUE INDEX "QuoteLead_submissionKey_key" ON "QuoteLead"("submissionKey");
CREATE INDEX "QuoteLead_requestCode_normalizedPhone_idx" ON "QuoteLead"("requestCode", "normalizedPhone");
CREATE INDEX "QuoteLead_sourceTenantId_createdAt_idx" ON "QuoteLead"("sourceTenantId", "createdAt");

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
  "tenantKey" = EXCLUDED."tenantKey",
  "workspaceKind" = EXCLUDED."workspaceKind",
  "updatedAt" = CURRENT_TIMESTAMP;

COMMIT;
