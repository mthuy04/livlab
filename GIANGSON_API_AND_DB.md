# Giang Sơn API and Database Notes

## Public request API

Both retail and project flows use `POST /api/quote`. The server resolves the active tenant and its configured workspace; the client cannot select a destination showroom.

- Retail request type: `RETAIL_RFQ`
- Project request type: `PROJECT_RFQ`
- Idempotency: `Idempotency-Key` / `submissionKey`
- Customer tracking: existing request code plus normalized phone lookup
- Catalogue lines: re-resolved server-side by id/canonical id
- Provenance snapshot: price type, unit, source name/URL, checked date and official-offer boolean
- Project BOQ: exact decimal quantity/unit/specification rows are retained in `contextJson`; legacy quote-item quantity remains an integer compatibility field.

## Project RFQ limitations

The project form supports manual BOQ rows and a downloadable Excel template. File upload is explicitly disabled because the repository has no persistent private object storage, virus scanning, content validation or signed-access implementation. The UI states this limitation rather than simulating an upload.

## Additive migration

`db/migrations/20261018_giangson_showroom_v1.sql`:

- Adds enum values `RETAIL_RFQ` and `PROJECT_RFQ`.
- Upserts the isolated demo workspace `workspace-demo-giangson` / tenant key `giangson`.
- Contains no drop, truncate or rename operation.

Prerequisite: `db/migrations/20261018_showroom_workspace_v3.sql`.

## Production safety

No migration was applied to the connected production database. Apply and verify on a Neon/database branch first, exercise retail RFQ, project RFQ, tracking and workspace isolation, then request explicit production approval.
