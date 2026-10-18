# Audit — LivLab × Bếp Tùng Đăng Showroom V3

Audit date: 2026-10-18 (Asia/Ho_Chi_Minh)

## Source and deployment identity

- Working branch: `feat/room-studio-inax-3d`
- Audited HEAD before this follow-up: `f6e5d89b386bde59d530761c1dffa7d9576ceb32`
- `origin/main`: `59b150a405997608840730b3e82c03c2b9de6132`
- Vercel Production deployment: commit `59b150a`, status `success`, domain `livlab.vercel.app`
- Vercel Preview deployment: commit `f6e5d89`, status `success`, URL `livlab-7kqsdt0cb-mthuy04s-projects.vercel.app`
- The Preview is protected by Vercel Authentication. An unauthenticated request is redirected to Vercel SSO, so it cannot be used as public QA evidence.
- The repository is not locally linked through `.vercel/`, and no `VERCEL_TOKEN` is available in the shell.

The feature branch contains two commits not on `main`: the INAX Room Studio update and Showroom Workspace V3. Production therefore does not yet contain the V3 workspace implementation.

## Confirmed findings

| Severity | Observed symptom / reproduction | Root cause | Affected area | Fix / verification |
|---|---|---|---|---|
| P0 | V3 Preview shows migration-unavailable states and quote APIs return `MIGRATION_PENDING`. Run `npm run check:showroom-db`. | The configured PostgreSQL database has V2 tables/enums, but lacks six V3 columns and `WorkspaceKind`. | Prisma schema, quote submission/lookup, profile/catalog workspace mapping | V3 SQL remains approval-gated. The read-only checker reports the exact missing contract. |
| P0 | Tùng Đăng requests cannot be assigned to a legitimate Tùng Đăng inbox. | Database has only `sr-luxbath-1`; no `workspace-demo-tungdang` and no authorized user assigned to it. | Tenant mapping, auth, all showroom APIs | V3 migration creates an explicit DEMO workspace. A separately gated script assigns only an existing authorized SHOWROOM user and refuses to move users from another showroom. |
| P0 | Deploying feature code before V3 migration would make unrelated Prisma queries fail with P2022 because generated selects include new Showroom fields. | Application schema is ahead of the target database. | Products, profile, quote APIs | Release order is migration on an isolated branch, E2E, then production migration, then code. Main push is blocked until this gate passes. |
| P0 | Desktop can retain the mobile overlay after opening at a narrow width then resizing. Drawer did not lock body scroll or restore focus. | Desktop sidebar and mobile drawer existed simultaneously without a resize guard or focus lifecycle. | `app/showroom/layout.tsx`, `showroom.css` | Mobile overlay is hidden at `>=1024px`; body scroll locks while open; Escape/backdrop/nav close it; focus enters and returns to the menu trigger. |
| P0 | Public request tracking was disconnected across browser sessions. | Legacy tracking read local browser state while submission wrote PostgreSQL. | `/api/quote`, `/track-quote` | Server lookup by request code + normalized phone is authoritative. Draft quotes and internal activity are excluded. Runtime pre-migration behavior is a clear 503 rather than fake success. |
| P1 | Lookup endpoint could be brute-forced. | No attempt throttle. | `/api/quote/lookup` | Added bounded, privacy-preserving per-process throttling with 429 and `Retry-After`. A distributed limiter remains recommended for multi-instance production. |
| P1 | Stage filtering after a limited query produced incorrect totals/pages. Search omitted request code. | Derived legacy stage was filtered in memory after `take`. | `listLeads`, leads API | Stage + legacy fallback are now expressed in the database where clause; totals use the same predicate; request-code/date/uncontacted/overdue filters are server-side. |
| P1 | Dashboard “business rhythm” compared requests to contacts, not issued formal quotations; no “All” period. | Wrong series and incomplete filter contract. | Dashboard repository/API/UI | Trend now uses persisted `Quote.sentAt`; 7/30/90/all are supported; KPI copy matches the approved specification. |
| P1 | Workspace branding looked generic and hid demo status. | Layout only used the Showroom name and an invented text tile. | Showroom shell/profile | The approved local Tùng Đăng logo is used when `tenantKey=tungdang`; the workspace shows an explicit Demo badge and Powered by LivLab identity. |
| P1 | Catalogue source differs between Tùng Đăng fixture and relational Product/Offer records. | Public demo products do not have valid Product foreign keys. | `/api/showroom/catalog` | Demo catalogue uses the approved tenant fixture and is explicitly read-only; live workspaces keep DB-backed commercial offers. No fake join is created. |
| P2 | Full-repository lint fails. | 107 pre-existing errors exist in legacy admin, seed and helper files outside this delivery. | Repository baseline | All V3 files touched in this execution pass targeted ESLint. Full lint remains a documented release-quality debt rather than being hidden. |

## Data safety conclusions

- Read-only database inspection found one showroom (`sr-luxbath-1`), one assigned user and existing lead records.
- No production/staging data was inserted, updated, deleted or reset during this audit.
- No database URL, password or token is recorded in this file.
- The Tùng Đăng workspace must not reuse or rename Luxbath.
- `prisma migrate deploy`, `prisma db push`, destructive seeds and resets remain prohibited for this database.

## Remaining release blockers

1. An authorized Neon branch (or equivalent isolated clone) is required.
2. Apply V2 only if the target branch lacks it, then apply the reviewed V3 SQL.
3. Configure an existing demo SHOWROOM account using the gated script.
4. Run the complete persisted request → quote → tracking E2E against that branch.
5. Perform authenticated browser QA and capture the required application screenshots.
6. Only after those gates pass may the feature be integrated into `main` and promoted to production.
