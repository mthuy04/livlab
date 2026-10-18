# Giang Sơn Deployment Report

Status: **preview code ready; production release gated**

## Completed

- Dedicated `giangson` public-demo tenant and route.
- 57 product types, 5 verified SKU references and 8 category taxonomy.
- Architectural-commerce homepage, catalogue/detail pricing disclosure, concepts, Room/Material Studio estimate, retail RFQ and project RFQ UI.
- Isolated demo workspace mapping and additive migration prepared.
- Production build passed.
- Required screenshots and QA documents generated.

## Release gates still open

1. Business authorization/partnership and confirmation of current address/contact details.
2. Commercial image rights for any desired Trang Vàng photography.
3. Apply Workspace V3 and Giang Sơn migrations to a database branch.
4. Run persistence/tracking/formal-quote/workspace isolation E2E against that branch.
5. Obtain explicit approval before production migration or deployment.

No production migration, merge to main or Vercel deployment was performed by this implementation pass. The public-demo metadata remains noindex/nofollow.
