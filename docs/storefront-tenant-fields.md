# Storefront tenant fields

Phase 1 keeps tenant branding in configuration (`lib/storefront/tenantConfig.ts`)
rather than the database, because that phase was not allowed to migrate
production. This records what would need persisting when branding becomes
self-service, so the decision is made once rather than rediscovered.

## Already in the database

Read live by `resolveTenant()` from the `Showroom` record:

| Field | Used for |
|---|---|
| `name` | Header wordmark, footer, page titles |
| `phone`, `email`, `address` | Footer contact — each omitted when empty |

## Would need new columns

Additive and nullable, following the Workspace V2 precedent:

| Field | Type | Notes |
|---|---|---|
| `slug` | `String? @unique` | Subdomain / path segment for tenant resolution |
| `customDomain` | `String? @unique` | Maps a hostname to this showroom |
| `logoUrl` | `String?` | Falls back to the name as a wordmark |
| `accentColor` | `String?` | One colour, so a showroom cannot produce an unreadable storefront |
| `accentContrast` | `String?` | Text on the accent — stated, not guessed, so contrast stays a decision |
| `tagline` | `String?` | One line under the name in the footer |
| `features` | `Json?` | Which capabilities the storefront exposes |
| `catalogCategories` | `String[]` | Which part of the catalogue this tenant sells |
| `poweredByLivLab` | `Boolean @default(true)` | The quiet footer credit |

## Commercial, not storefront

Territory rules live with onboarding, not with presentation. A future
`exclusiveRadiusMeters` (or a richer territory model) belongs on the commercial
agreement, and the storefront should never read or enforce it. Nothing in
Phase 1 assumes either way.

## Still global, must become tenant-scoped

These are shared across all storefronts today. There is only one tenant in
production, so nothing leaks yet — but each is a prerequisite before a second
showroom goes live:

- `livlab_quote_items`, `livlab_saved_concepts`, `livlab_compare_items` —
  localStorage keys with no tenant prefix, so a customer moving between
  storefronts would carry a basket across brands.
- `GET /api/products` — returns the whole catalogue with no showroom filter.
  `TenantCatalogScope` already records the intent; nothing reads it yet.
