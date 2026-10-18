# Giang Sơn UI QA

Date: 2026-10-18 · build mode: Next.js production server

## Desktop viewport results

| Viewport | Result |
| --- | --- |
| 1366 × 768 | Header + complete hero + trust strip visible; category heading below fold |
| 1440 × 900 | Balanced 42/58 composition; two price hotspots readable; category below fold |
| 1536 × 960 | Pass |
| 1656 × 895 | Pass |
| 1728 × 1117 | Pass |
| 1920 × 1080 | Pass |

Hero sizing uses the existing desktop calculation `100dvh - 107px` for utility/header chrome. The main row absorbs available height and the trust strip closes the first screen. Mobile uses natural content height.

## Mobile

Chrome device metrics were set to 390 × 844. Recorded values:

- `innerWidth = 390`
- `documentElement.scrollWidth = 390`
- no horizontal overflow
- category heading top = 1236.64px, after the naturally scrolling hero

CTA buttons stack, headline wraps, statistics remain readable and hotspots remain touch targets.

## Screenshots

- `docs/screenshots/giangson/home-1366x768.png`
- `docs/screenshots/giangson/home-1440x900.png`
- `docs/screenshots/giangson/home-1536x960.png`
- `docs/screenshots/giangson/home-1656x895.png`
- `docs/screenshots/giangson/home-1728x1117.png`
- `docs/screenshots/giangson/home-1920x1080.png`
- `docs/screenshots/giangson/home-390x844.png`
- `docs/screenshots/giangson/home-500x844.png`

## Accessibility/performance observations

- Hero image keeps a fixed 4:3 intrinsic ratio; supplied logo has intrinsic dimensions.
- Hotspots and CTA controls are links/buttons with accessible labels and focus behavior.
- Demo metadata is noindex/nofollow.
- No external Trang Vàng image is loaded by the storefront.
