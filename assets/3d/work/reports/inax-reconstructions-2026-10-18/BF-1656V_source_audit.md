# 3D Reconstruction Audit — INAX BF-1656V

## Reference and provenance
- Input: product perspective photo and technical dimensional drawing, supplied by user.
- Official INAX: https://www.inax.com.vn/vi/products/bathtub/bon-tam-dat-san-bf-1656v/
- Manufacturer CAD/3D Max is listed on the official product page, but was **not obtained or imported**.
- Geometric reconstruction is custom-parametric lofting, **not original manufacturer CAD**.

## Verified reference specifications
- Overall: 1600 mm long (X) × 800 mm deep (Z) × 560 mm high (Y).
- Installation drawing height 540–560 mm; visual model uses the maximum height, 560 mm.
- Upper contour reference: 1370 mm length, 670 mm width; lower internal width 520 mm shown in drawing.
- Outer base reference: 1360 mm length, 700 mm width.
- Ø48 mm is the *drainage pipe dimension*, not the visible drain-ring diameter.
- Material: **white Acrylic**, not glazed ceramic.

## Modeled geometry
- One continuous acrylic shell: outer tapered hull, broad smooth upper rim, inward sloping basin, recessed floor.
- Separate PBR chrome drain ring, drain center, overflow hardware, and understated anti-slip pads.
- Material starting point: acrylic baseColor RGBA [249,248,246,255], metallic 0, roughness 0.18.
- Do not interpret material parameters as physically measured values; appearance depends on environment lights.

## Exported file checks (reopened GLB)
| File | Size (bytes) | Triangles | Meshes | X length (mm) | Y height (mm) | Z width (mm) | Max absolute error (mm) |
|---|---:|---:|---:|---:|---:|---:|---:|
| BF-1656V_high.glb | 723984 | 40016 | 6 | 1600.0 | 560.0 | 800.0 | 0.000 |
| BF-1656V_web.glb | 237904 | 13012 | 6 | 1600.0 | 560.0 | 800.0 | 0.000 |

## Quality status: CONDITIONAL
- GLBs successfully exported/reimported; dimensions in meters and Y-up coordinate convention validated.
- Geometry watertightness is reported for each component in the JSON manifest.
- Image previews are rendered from reimported GLB meshes using VTK with simplified Phong lighting, **not a Babylon.js PBR runtime test**.
- Some internals, corners, side wall thickness, hardware, and molded anti-slip marks are estimates.
- The dimensional pass **does not prove exact manufacturer surface fidelity**.
- Before a certified commercial catalogue release, obtain manufacturer's CAD/3D Max and confirm terms of reuse.
