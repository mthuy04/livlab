# Giang Sơn E2E Report

## Automated checks

| Check | Result |
| --- | --- |
| `npm run test:giangson` | Pass — 57 types, 5 verified SKUs, 8 categories, pricing/source invariants, safe migration |
| `npm run test:showroom-v3` | Pass |
| `tsc --noEmit` | Pass |
| ESLint on all changed TypeScript/TSX files | Pass |
| `npm run build` | Pass with network access for Google Font retrieval |
| BOQ workbook formula-error scan | Pass, 0 matches |

The repository-wide lint command still fails on 102 pre-existing errors in legacy admin, visual-studio, seed and utility files. No new changed-file lint error remains.

The older Room Studio/concept scripts invoke `npx tsx`; `tsx` is not installed locally and the sandboxed run could not resolve npmjs.org. Their logic was not used as a release claim. Production build TypeScript validation and the new Giang Sơn integrity test passed.

## Browser scenarios

- Storefront entry `/s/giangson`: pass.
- Hero/data provenance display: pass.
- Exact SKU and category-level reference labeling: pass by rendered UI and static integrity check.
- Project RFQ form/manual rows/template: rendered and build-validated.
- Room Studio material estimate: formula unit-tested for floor/wall geometry; UI build-validated.
- Mobile 390px: no horizontal overflow.
- Tenant isolation: configuration, fixture selection and workspace mapping statically verified.

## Database-gated scenarios

Retail/project request persistence, public tracking and Giang Sơn Workspace inbox were not executed against the connected database because the required additive migrations are intentionally unapplied. These scenarios are mandatory on a database branch before deployment approval.
