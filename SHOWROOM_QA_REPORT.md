# Showroom V3 QA Report

Run date: 2026-10-18.

## Completed checks

| Check | Result |
|---|---|
| `npx prisma validate` | PASS |
| `npx tsc --noEmit --incremental false` | PASS |
| Targeted ESLint for all files changed in this execution | PASS |
| `git diff --check` | PASS |
| V3 SQL destructive-token check | PASS (no destructive statement) |
| Production build before this follow-up (`npm run build`) | PASS, 90 routes |
| Final follow-up build | Application compilation reached Next optimization; sandbox build failed only because Google Fonts DNS/network was unavailable. Escalated retry approval timed out. TypeScript and targeted lint remain PASS. |
| Production storefront with tenant cookie | PASS; Tùng Đăng branding returned |
| Production `/showroom` unauthenticated guard | PASS; redirects to `/login?next=%2Fshowroom` |
| Preview deployment metadata | PASS; commit `f6e5d89`, Vercel status success |
| Preview public accessibility | BLOCKED by Vercel Authentication / SSO |
| Database readiness checker | EXPECTED FAIL; exact six missing V3 columns reported |
| Quote invalid-input smoke test | PASS; HTTP 400 |
| Quote create/lookup before migration | PASS fail-safe; HTTP 503 `MIGRATION_PENDING` |

The repository-wide `npm run lint` is not green: 107 errors and 129 warnings predate this delivery in legacy admin pages, seed scripts and helpers. No new V3 lint errors remain.

## Responsive behavior implemented

- Desktop sidebar is a persistent 250px flex column at `>=1024px` and participates in layout.
- Mobile/tablet uses one overlay drawer only.
- Overlay is forcibly hidden when resizing into desktop.
- Escape, backdrop and navigation close the drawer.
- Body scroll is locked while the drawer is open.
- Keyboard focus enters the drawer and is restored to its trigger.

## Browser QA status

Required authenticated screenshot evidence is not complete.

- The provided Preview is behind Vercel SSO.
- The current session has no Vercel token/link and no authorized Tùng Đăng demo account.
- The configured database lacks V3 and therefore cannot render populated Tùng Đăng pages truthfully.
- The Codex in-app browser runtime was unavailable in the earlier local QA attempt.

No standalone prototype screenshot is presented as integration evidence. Existing `artifacts/tungdang-hero-*` images concern the storefront hero, not the seven authenticated workspace pages.

## E2E scenario status

| Segment | Status |
|---|---|
| Storefront catalogue and Room Studio code paths | Build-verified |
| Persist request and return stable YC code | Code-complete, blocked by V3 database |
| Fresh-browser server lookup | Code-complete, blocked by V3 database |
| Authorized Tùng Đăng inbox | Blocked: workspace/account not configured in DB |
| Create/edit/send formal quote | Code-complete on V2 repository; not verified for Tùng Đăng |
| Draft hidden / sent quote public | Projection verified by code; persisted E2E blocked |
| Dashboard/report reconciliation | Server-derived; persisted Tùng Đăng E2E blocked |
| Cross-showroom isolation | Guarded in code; two-workspace E2E blocked |

## Seven-page completion status

| Route | Status | Notes |
|---|---|---|
| `/showroom` | PARTIAL | V3 UI and persisted metrics are implemented, including 7/30/90/all and formal-quote trend. Authenticated Tùng Đăng data QA is blocked by V3 DB readiness. |
| `/showroom/leads` | PARTIAL | Server filtering, exact totals, drawer, stage/note/quote actions are implemented. Full Room Studio material/technical projection and persisted E2E remain to be proven. |
| `/showroom/quotes` | PARTIAL | Draft/edit/send/accept/reject/expire lifecycle and server totals exist. Tùng Đăng persisted lifecycle QA is blocked. |
| `/showroom/customers` | PARTIAL | Customer aggregation is database-derived and scoped; authenticated Tùng Đăng detail QA is blocked. |
| `/showroom/catalog` | PARTIAL | Correct Tùng Đăng fixture adapter works in explicit read-only demo mode. Persisted demo price overrides require a separate keyed offer model and are not falsely advertised. |
| `/showroom/reports` | PARTIAL | Metrics use persisted leads/quotes and exports exist. Time-filtered report/export reconciliation and Tùng Đăng data QA remain. |
| `/showroom/settings` | PARTIAL | Profile update, storefront identity and demo/live badge are implemented. The target workspace/account do not exist until V3 is configured. |

No route is marked DONE until it passes authenticated testing against the isolated Tùng Đăng workspace.

## Required next QA run

After applying V3 to an isolated branch and assigning an authorized account, execute the 22-step scenario in the master prompt and capture all seven pages at 1536×960, 1440×900, 1366×768, 1024×768 and 390×844.
