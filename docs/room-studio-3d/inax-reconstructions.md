# INAX reconstructions in Room Studio (2026-10-18)

Five LivLab **reconstructions** (not manufacturer CAD, not INAX-certified) of
AC-1017VRN, AC-912VN, BF-1656V, BFV-70S and L-293V(FC). Source package:
`LivLab_INAX_5_Products_FULL.zip`; provenance and per-SKU source audits are in
`assets/3d/work/reports/inax-reconstructions-2026-10-18/`.

## Where things live
- Files: `public/models/inax/<SKU>/` (sha256 checked against the package manifest).
- Registry: `lib/room-studio/reconstructionRegistry.ts`. It is separate from the
  manufacturer registry, so the manufacturer READY gate is unchanged. Lookup
  is by exact brand + SKU; FC is an alias of L-293V, EC is not (its three tap
  holes are not modelled).
- Capability `PROTOTYPE_3D`, badge "3D TÁI TẠO".
- Mounting: `lib/room-studio/mounting.ts`. Fit: `fitInRoom` in `placementRules.ts`.
- Runtime QA: `/dev/room-studio-3d-qa`, output in `runtime-qa.json`.

## Per-SKU runtime QA (Chrome, ANGLE Metal, Apple M1)
| SKU / variant | Measured W×D×H mm | Tris | Mounting | Catalogue presence |
|---|---|---|---|---|
| AC-1017VRN web | 400 × 805 × 588 | 57 264 | floor, 20 mm wall gap (LivLab default) | Tùng Đăng fixture; LivLab library entry |
| AC-912VN web | 372 × 721 × 680 | 13 876 | floor, 15 mm wall gap (drawing) | Tùng Đăng fixture; LivLab library entry |
| BF-1656V web | 1600 × 800 × 560 | 13 012 | floor, 20 mm | Tùng Đăng fixture (market price, added 2026-10-19 for the demo); LivLab library entry |
| BFV-70S web | 294 × 523.5 × 1638 (envelope) | 17 140 | wall, mixer 1000 mm (800–1200) | Tùng Đăng fixture (market price, added 2026-10-19 for the demo); LivLab library entry |
| L-293V basin_only | 500 × 450 × 155 | 4 418 | countertop 800 mm (700–950) | Tùng Đăng fixture (market price, added 2026-10-19 for the demo); LivLab library entry |
| L-293V web (illustrative tap) | 500 × 450 × 278.75 | 4 250 | countertop | variant switch |

Renderer scale is exactly 1 and the worst dimension error is 4.8e-6 %. All seven
checks pass (loads, bounds, reference dimensions, origin/orientation, mounting,
PBR, performance). LivLab library entries (`livlab-3d-<sku>`) carry no price
("Liên hệ"), stock or seller. Tùng Đăng activates only SKUs present in its
fixture, at the fixture's prices.

## Environment
- Procedural PBR floor and wall maps (true tile scale, 3 mm grout).
- Skirting, niche, glass partition, window, basin counter and cutaway walls.
- Lighting presets: daylight, warm, studio. A local Lightformer environment (no CDN). Fitted shadow camera.
- Perspective and plan (orthographic) views, plus "Vừa phòng" and "Xem sản phẩm".
- Starter rooms (Empty, Warm Stone, Minimal White, Modern Hotel) with confirm and undo.
- Status outline: valid / clearance / collision / outside / unsupported surface.
- Quality tiers (high/low) with a PerformanceMonitor step-down. Recovers from WebGL context loss.
- Room state is stored per tenant.

## Known limitations
- Every GLB lacks some or all vertex normals. Creased normals (30°) are derived at load, and no vertex moves.
- BFV-70S has no manufacturer bounding box; the rain-head face height (1397 mm) cannot be measured from bounds.
- The L-293V tap is illustrative, not a verified INAX tap code.
- No ambient occlusion. Mobile was emulated, not measured on a real device.
- Screenshots in `qa/inax-2026-10-18/` were taken against the dev server (the Next issue badge is visible).
