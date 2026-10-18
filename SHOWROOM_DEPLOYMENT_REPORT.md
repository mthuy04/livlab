# Showroom V3 Deployment Report

Last updated: 2026-10-18.

## GitHub / Vercel state

| Environment | Commit | Status | URL |
|---|---|---|---|
| GitHub `origin/main` | `59b150a405997608840730b3e82c03c2b9de6132` | Current main | `https://github.com/mthuy04/livlab/commit/59b150a405997608840730b3e82c03c2b9de6132` |
| Vercel Production | `59b150a` | Success | `https://livlab.vercel.app` |
| Feature branch | `f6e5d89b386bde59d530761c1dffa7d9576ceb32` plus this follow-up | V3 implementation | `feat/room-studio-inax-3d` |
| Vercel Preview | `f6e5d89` | Build success; SSO protected | `https://livlab-7kqsdt0cb-mthuy04s-projects.vercel.app` |

Production branch mapping is consistent with GitHub deployments: pushes to `main` produce Production deployments; the feature branch produces Preview deployments.

## Release decision

**HOLD — do not integrate or push V3 to `main` yet.**

Reason: the target database lacks the V3 contract. Shipping the generated Prisma client first would cause P2022 errors on routes that select new Showroom/QuoteLead fields. This is the release safety gate explicitly required by the master prompt.

The GitHub/Vercel application push does not authorize production database DDL. No production migration was run.

## Safe promotion procedure

1. Create an isolated Neon branch from the production database.
2. Apply the reviewed V3 SQL and run `npm run check:showroom-db` until ready.
3. Configure an existing authorized Tùng Đăng demo SHOWROOM account.
4. Point a Vercel Preview at the isolated branch.
5. Run authenticated API, E2E and responsive screenshot QA.
6. Confirm backup/PITR and approve the exact production SQL.
7. Apply the exact migration to production.
8. Re-run readiness against production.
9. Merge the verified feature branch into current `main` without force push/reset.
10. Confirm the Production deployment SHA and repeat smoke tests.

## Verified public links today

- Tùng Đăng storefront: `https://livlab.vercel.app/s/tungdang` (public; redirects through tenant cookie to `/`).
- Generic showroom management: `https://livlab.vercel.app/showroom` (authentication required).

The following production URLs are routes but are **not yet verified as a Tùng Đăng-owned workspace**, so they must not be advertised as working Tùng Đăng management links yet:

- `https://livlab.vercel.app/showroom`
- `https://livlab.vercel.app/showroom/leads`
- `https://livlab.vercel.app/showroom/quotes`
- `https://livlab.vercel.app/showroom/customers`
- `https://livlab.vercel.app/showroom/catalog`
- `https://livlab.vercel.app/showroom/reports`
- `https://livlab.vercel.app/showroom/settings`
