# Showroom API Matrix

All `/api/showroom/*` endpoints require an authenticated `ADMIN` or `SHOWROOM` session. SHOWROOM users are always scoped by `User.showroomId`; a payload cannot override it.

| Endpoint | Methods | Source of truth | Scope / public projection | Expected failures |
|---|---|---|---|---|
| `/api/quote` | POST | QuoteLead + QuoteItem | Server-resolved tenant workspace; idempotency key | 400 invalid, 409 idempotency conflict, 503 workspace/schema unavailable |
| `/api/quote/lookup` | POST | QuoteLead + issued Quote | Request code + normalized phone; excludes drafts/internal activity/staff | 400 invalid, 404 generic mismatch, 429 throttled, 503 schema unavailable |
| `/api/showroom/profile` | GET, PATCH | Showroom | Session showroom only; commercial fields allow-listed | 401, 403, 404, 409 unassigned, 503 schema |
| `/api/showroom/dashboard` | GET | QuoteLead, Quote, LeadActivity | Session showroom; 7/30/90/all | 401, 403, 503 |
| `/api/showroom/leads` | GET | QuoteLead | Server-side stage/type/search/code/date/uncontacted/overdue filters and totals | 401, 403, 503 |
| `/api/showroom/leads/[id]` | GET, PATCH | QuoteLead + items/quotes/activity | Owned lead only; enum values remain API values | 401, 403, 404, 503 |
| `/api/showroom/activities` | POST | LeadActivity + lead scheduling fields | Owned lead only; internal by default | 400, 401, 403, 503 |
| `/api/showroom/quotes` | GET, POST | Quote | Owned lead/showroom; code generated under advisory lock | 400, 401, 403, 503 |
| `/api/showroom/quotes/[id]` | GET, PATCH | Quote + QuoteLine | Server totals and validated status transitions | 400, 401, 403, 404, 503 |
| `/api/showroom/customers` | GET | Derived from QuoteLead | Normalized contact identity within session showroom | 401, 403, 503 |
| `/api/showroom/catalog` | GET, PATCH | Tenant fixture for DEMO; Product/Offer for LIVE | Tùng Đăng fixture is read-only; live offers are writable | 400, 401, 403, 409/503 config/schema |
| `/api/showroom/reports` | GET | QuoteLead, Quote | Persisted records only; no chart fixtures | 401, 403, 503 |
| `*/export` | GET | Same repositories as corresponding pages | Authenticated, scoped CSV | 401, 403, 503 |

## Error contract

- `400/422`: malformed or semantically invalid input.
- `401`: no valid session.
- `403`: authenticated but outside the owned showroom/resource.
- `404`: resource not found, or public quote lookup mismatch.
- `409`: assignment/idempotency/configuration conflict.
- `429`: public lookup attempt limit, with `Retry-After`.
- `503`: required database contract or workspace configuration is unavailable.
- `500`: unexpected error; response is generic and details remain server-side.

## Known infrastructure qualification

Public lookup throttling is bounded and process-local. It prevents accidental/single-instance hammering without storing customer identifiers. A shared edge or Redis limiter is still required for a strong global limit across multiple serverless instances.
