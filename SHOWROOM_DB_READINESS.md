# Showroom Database Readiness

Last checked: 2026-10-18.

## Current configured database (read-only inspection)

| Contract | Status |
|---|---|
| V2 tables: Quote, QuoteLine, LeadActivity, ShowroomProductOffer | Present |
| V2 enums: LeadStage, QuoteStatus | Present |
| `QuoteLead.stage` | Present |
| `QuoteLead.requestCode` | Missing |
| `QuoteLead.normalizedPhone` | Missing |
| `QuoteLead.submissionKey` | Missing |
| `QuoteLead.sourceTenantId` | Missing |
| `Showroom.tenantKey` | Missing |
| `Showroom.workspaceKind` / WorkspaceKind enum | Missing |
| Explicit `workspace-demo-tungdang` row | Impossible until V3 is applied |

The database contains the existing Luxbath workspace only. Tùng Đăng must not be mapped onto it.

## Automated read-only check

```bash
npm run check:showroom-db
```

Exit codes:

- `0`: the complete V2 + V3 application contract exists.
- `2`: one or more required tables/columns are missing; JSON output lists them.
- Other non-zero: connectivity or query failure.

The checker performs only `information_schema` reads.

## Reviewed migration sequence

1. Create an isolated branch from the database used by the target Vercel environment.
2. Point a local/Preview environment at that branch.
3. Run `npm run check:showroom-db`.
4. If V2 is missing, apply `db/migrations/20261007_showroom_workspace_v2.sql` once.
5. Apply `db/migrations/20261018_showroom_workspace_v3.sql`.
6. Run the checker again; it must return `ready: true`.
7. Verify the new row has `tenantKey=tungdang` and `workspaceKind=DEMO`.
8. Assign an existing authorized demo account only in the isolated environment:

```bash
ALLOW_DEMO_WORKSPACE_CONFIG=1 \
DEMO_SHOWROOM_USER_EMAIL='authorized-user@example.invalid' \
npm run configure:tungdang-demo
```

The configuration script refuses to create a user, change roles, or move an account already owned by another showroom.

## V3 migration properties

- Transactional (`BEGIN`/`COMMIT`).
- Additive: no DROP, TRUNCATE, RENAME or destructive column alteration.
- Handles partial V3 states with conditional enum/column/index creation.
- Creates one configuration row with stable id `workspace-demo-tungdang`.
- Does not seed leads, quotes, customers, prices or charts.
- A conflicting `tenantKey` still fails safely instead of silently moving ownership.

## Production gate

Production migration is **not authorized by the application-code push request**. Before production application:

- Confirm the production database is the intended Neon branch.
- Confirm point-in-time restore/backup availability.
- Review the exact SQL again.
- Apply the exact tested SQL without edits.
- Run readiness and E2E checks before deploying code that selects V3 fields.
