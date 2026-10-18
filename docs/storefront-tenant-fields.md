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

## The experience layer

`TenantStorefrontConfig.experience` (`lib/storefront/tenantExperience.ts`) is
what lets two showrooms differ in more than a logo and a colour. It is plain
data in four parts, and no component branches on a tenant id:

| Part | What it controls |
|---|---|
| `theme` | Tokens emitted once as `--tenant-*` CSS variables: ink, accent-as-text (`accentInk`), brand panel, price and discount colours, radius, heading tracking, typeface. `--tenant-ui-*` drive Room Studio and the quote drawer, and are only emitted when set, so LivLab keeps its original colours as `var()` fallbacks. |
| `variants` | `header` (`editorial` / `retail`), `hero` (`editorial` / `commerce`), `categoryNav` (`stage` / `iconRail`), `productCard` (`editorial` / `priceLed`). Names describe a treatment, never a showroom. |
| `home` | `showcase` (LivLab's own homepage, unchanged) or `catalog`: the listed sections, in order, built from the tenant's catalogue and concept library by `CatalogHome`. |
| `copy`, `merchandising` | Customer-facing strings (hero, sections, quote, Room Studio) and the showroom's picks: featured product ids, the hero concept, a Room Studio capture. |

Plus `roomStudioCatalog` (`livlab` CSV or the `tenant` catalogue) and an optional
`roomStudioDemo`, opened with `/room-studio?demo=1`.

**A second showroom** is a new `TenantStorefrontConfig` with its own values —
for an architectural, editorial showroom: `variants` of `editorial` / `editorial`
/ `stage` / `editorial`, a `home.sections` list without `brands`, dark ink and an
ivory surface in `theme`, its own `font`, and copy that leads with collections
rather than prices. A new typeface is one registration in `tenantFonts.ts`.
Nothing is forked and no page is duplicated.

Persisting this later means one `Json` column (`experience`) validated against
the TypeScript type, plus the logo upload already listed above.
