# Giang Sơn Digital Showroom V1 — Architecture Audit

Date: 2026-10-18

## Existing platform reused

- Next.js 16 App Router with async route params and the existing tenant preview entry `/s/[slug]`.
- Tenant resolution, CSS tokens, header/footer variants and catalog-home composition.
- Tenant-scoped catalogue adapter, concepts resolver, Room Studio, quote basket, public request tracking and seven-page Showroom Workspace.
- PostgreSQL/Prisma persistence for leads, quote items, activities and formal quotes.

The implementation adds `giangson` to the configuration-driven tenant registry. It does not fork the application or change the LivLab/Tùng Đăng routes.

## Tenant boundaries

| Boundary | Giang Sơn implementation |
| --- | --- |
| Public route | `/s/giangson` sets the public-demo tenant cookie and redirects to the selected route |
| Catalogue | `data/demo/giangson-catalog.json`, selected only for tenant id `giangson` |
| Request inbox | `workspace-demo-giangson`, `WorkspaceKind.DEMO` |
| Concepts | Shared LivLab scenes, re-resolved to an explicit Giang Sơn recommendation map |
| Browser storage | Existing tenant-aware saved/compare stores; unscoped legacy catalogue sync is disabled for showroom tenants |
| SEO | Public demo is `noindex, nofollow` until business approval |

## Data path

1. The CSV source is normalized into 57 `PRODUCT_TYPE` records.
2. Five independently verified examples are separate `VERIFIED_SKU` records.
3. `getCatalog()` selects the fixture by tenant id and preserves record type, verification status, rights note and price provenance.
4. Homepage, catalogue, concepts, detail pages, Room Studio and quote basket consume the same normalized `CatalogProduct` shape.
5. Quote submission re-resolves catalogue identities server-side and stores price type, unit, source and whether the price was a showroom offer.

## Critical findings

- The 57 source rows are product/service types, not 57 commercial SKUs.
- The 62 gallery URLs have no confirmed commercial-reuse permission. They are retained only as research evidence and are not hotlinked or copied into the storefront.
- The current database has not received Workspace V3 or the Giang Sơn V1 migration. Public RFQ persistence therefore remains release-gated until the reviewed additive migrations are applied to a database branch and then production with approval.
- Project BOQ file upload is intentionally unavailable because no durable private file store and access policy is configured. Manual BOQ entry and a safe downloadable `.xlsx` template are implemented.
- Existing GLB assets are not relabelled as Giang Sơn products. Exact SKU placement remains disabled when no matching authored model exists.

## Release shape

The code is safe as a preview/demo tenant. Production request intake requires `db/migrations/20261018_showroom_workspace_v3.sql` followed by `db/migrations/20261018_giangson_showroom_v1.sql`. No production database command was run.
