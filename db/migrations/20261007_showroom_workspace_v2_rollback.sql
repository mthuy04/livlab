-- ============================================================================
-- ROLLBACK for 20261007_showroom_workspace_v2.sql
--
-- Safe because the forward migration was purely additive: everything dropped
-- here was created by it. No column, table or row that existed before the
-- release is touched.
--
-- Only run this if the new tables must genuinely be removed. Because the
-- forward migration is backward-compatible, the OLD CODE RUNS FINE AGAINST THE
-- MIGRATED DATABASE — so reverting the code is almost always the right
-- recovery, and this file is not needed.
--
-- Dropping the Quote tables destroys any quotations created since the release.
-- Check for them first:
--   SELECT count(*) FROM "Quote";  SELECT count(*) FROM "LeadActivity";
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS "QuoteLine";
DROP TABLE IF EXISTS "Quote";
DROP TABLE IF EXISTS "LeadActivity";
DROP TABLE IF EXISTS "ShowroomProductOffer";

ALTER TABLE "QuoteLead"
  DROP COLUMN IF EXISTS "requestType",
  DROP COLUMN IF EXISTS "stage",
  DROP COLUMN IF EXISTS "nextActionType",
  DROP COLUMN IF EXISTS "nextActionAt",
  DROP COLUMN IF EXISTS "nextActionNote",
  DROP COLUMN IF EXISTS "assignedToId",
  DROP COLUMN IF EXISTS "firstContactAt",
  DROP COLUMN IF EXISTS "contextJson";

DROP TYPE IF EXISTS "LeadStage";
DROP TYPE IF EXISTS "LeadRequestType";
DROP TYPE IF EXISTS "QuoteStatus";
DROP TYPE IF EXISTS "LeadActivityType";
DROP TYPE IF EXISTS "LeadNextActionType";
DROP TYPE IF EXISTS "QuoteLineType";
DROP TYPE IF EXISTS "OfferAvailability";

COMMIT;
