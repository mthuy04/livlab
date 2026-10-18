# Technical Audit — INAX L-293VFC (Reconstruction)

**Overall QA status: CONDITIONAL.** Geometry/file integrity passed, but visual fidelity remains a modeled approximation, not manufacturer's supplied CAD.

## Input evidence
- Customer-supplied product photograph, 750×750 pixels.
- Customer-supplied three-view installation and dimensions diagram, 750×736 pixels.
- INAX catalogue listing corroborates 500 × 450 × 155 mm and identifies model L-293V (EC/FC), ceramic white.
- Manufacturer CAD/3D Max download listings exist; **neither has been loaded or converted for this model**.

## Engineering dimensions and interpretation
| Property | Dimension | Source classification |
|---|---:|---|
| Basin width, X | 500 mm | VERIFIED (technical drawing) |
| Basin depth, Z | 450 mm | VERIFIED (technical drawing) |
| Basin height, Y | 155 mm | VERIFIED (drawing and manufacturer listing) |
| Single-tap configuration FC | Ø36 mm | VERIFIED drawing |
| Three-hole configuration EC | 3 × Ø30 mm | VERIFIED drawing; **not modeled** |
| Countertop cutout | 430 × 210 mm, R10 | VERIFIED installation guidance; **countertop not included** |
| Rear faucet platform and shelf profile | derived loosely from photograph/drawing | ESTIMATED |
| Inner bowl cross sections, ceramic thickness | approximate lofts | ESTIMATED |
| Overflow and drain detailed construction | illustrative | ESTIMATED |
| Faucet make/model and dimensions | not specified | ESTIMATED, not a verified INAX faucet model |

**Important:** countertop installation height 800 mm shown in drawing is a room installation dimension; it is **not** included in the GLB's product bounding box.

## Reconstruction
Ceramic model: mathematically parameterized rounded-rectangle outer walls + triangulated horizontal deck with real Ø36 mm top aperture + lofted inner bowl with smooth transitions down to drain. Basin ceramic body topology is watertight. A generic photo-matched single-lever chrome faucet is modeled as separately named meshes and included in `high` and `web`, but **not** in `basin_only`.

## Files validated after GLB export
| File | Meshes | Triangles | Size | Closed meshes | Measured basin W × D × H |
|---|---:|---:|---:|---:|---:|
| high | 12 | 8,026 | 172.9 KiB | 12/12 | 500.000 × 450.000 × 155.000 mm |
| web | 12 | 4,250 | 86.0 KiB | 12/12 | 500.000 × 450.000 × 155.000 mm |
| basin_only | 5 | 4,418 | 94.6 KiB | 5/5 | 500.000 × 450.000 × 155.000 mm |

Measurements were taken from a fresh reload of exported GLB files, not just from pre-export parameters. Discrepancy from the specified basin extents is under 0.001 mm at report rounding precision. Combined faucet + basin assembly total height is approximately **278.75 mm**; faucet height is an **estimate** and should not be considered a product specification.

## Material audit
- `Ceramic_AquaWhite`: glTF 2.0 PBR, white glazed ceramic; metallic=0, roughness=0.16.
- `Chrome_Polished`: chrome-like reflective metal; metallic=1, roughness=0.13.
- `Chrome_Satin`: slightly rougher drain/aerator metal; metallic=0.92, roughness=0.27.
- `Dark_Overflow`: dark holes / recessed details. Small red/blue tap lever indicators approximated from photo.
- PBR values are modeling choices, **not calibrated measured material properties**. Their rendered appearance depends on the viewer's IBL and tone mapping.

## Geometry / visual QA
- PASS: output .glb files can be parsed and geometry reconstructed with `trimesh`.
- PASS: all meshes closed/watertight at mesh level on reloaded files.
- PASS: no nonfinite vertex coordinates.
- PASS: basin bounding dimensions and Y-up orientation.
- PASS: five check renders generated from actual exported high-quality GLB (VTK/Phong; not a full PBR environment).
- CONDITIONAL: model lacks manufacturer's exact curvature, wall section details, and licensed source mesh.
- CONDITIONAL: no direct Babylon.js/Three.js browser runtime test in this execution environment.
- CONDITIONAL: the faucet is illustrative; actual product SKU may not include a faucet.

## Limitations and commercial-readiness
This reconstruction is suitable as an **interactive Room Studio prototype**, with correct overall basin dimensions. It is not sufficiently validated to advertise as an exact manufacturer-certified 3D product or to fabricate/engineer mounting holes. For commercial fidelity, source and import INAX CAD/3D Max after confirming usage rights; replace especially bowl curvature and faucet.

## Integration
- Units: meters, glTF Y-up.
- X: width, Y: up, Z: forward/front. Origin: lower rear-center of basin (X=0,Y=0,Z=0).
- Basin top at Y=0.155; place basin at the corresponding room countertop reference, respecting real installation conditions.
- Recommended GLB for LivLab: `L-293V_web.glb`. Remove `Faucet_*` nodes if buyer selects another faucet, or use the standalone `L-293V_basin_only.glb`.
- Do not apply blind non-uniform scaling.

Reference: https://www.inax.com.vn/product-category/155-spec-height-basin/
