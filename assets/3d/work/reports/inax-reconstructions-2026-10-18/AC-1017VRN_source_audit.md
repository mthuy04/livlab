# AC-1017VRN — v4 GLB geometry and materials audit

## Sources
- User-provided three-view dimension drawing (top, side, front).
- User-provided product photo.
- INAX manufacturer's product page: https://www.inax.com.vn/products/toilet/ac-1017vrn/

## Verified product information
| Requirement | Source | Output check | Status |
|---|---|---|---|
| Total depth 805 mm | Drawing / INAX | 805 mm | PASS (outer bounds) |
| Total width 400 mm | Drawing / INAX | 400 mm | PASS (outer bounds) |
| Total height 588 mm | Drawing / INAX | 588 mm | PASS (outer bounds) |
| White product | INAX and photo | Neutral white PBR materials assigned | PASS (approximate perceived colour) |
| Aqua Ceramic glazed surface | INAX | White dielectric, roughness 0.16–0.17, optional clearcoat 0.36 / 0.12 | MATERIAL SIMULATION |
| White soft-close seat | INAX | Polymer-like neutral white, roughness 0.32 | MATERIAL SIMULATION |
| Chrome side lever | Photo / INAX | Metallic chrome, metallic 0.88, roughness 0.18 | VISUAL APPROXIMATION |
| Floor drain center 300 mm from rear | Drawing | 300 mm datum documented, not an underside plumbing cutout | REFERENCE ONLY |
| Height at front seat/bowl approx 380 mm | Drawing | Model lid underside / rim around 382–390 mm | APPROXIMATION |
| Internal siphon, hinges, underside | Not supplied in sufficient detail | Not modeled | EXCLUDED |

## GLB technical audit
- GLB 2.0, binary, self-contained, no external textures required.
- Both outputs use meters and **Y-up** glTF coordinate convention; model front faces -Z.
- World axis extent: width X=0.400 m, height Y=0.588 m, depth Z=0.805 m.
- Origin: horizontal center of rear wall plane, floor level (x=0, y=0, z=0); front extends to Z=-0.805 m.
- Separate 9 mesh nodes, seven material slots, no animation.
- Major components: ceramic body, ceramic cistern, cover, fine seam, seat lid, underseat, gasket and side flush handle.
- All individual mesh components checked watertight.
- Main asset: 150,692 triangles, approx 2.6 MB.
- Lite asset: 57,264 triangles, approx 1.0 MB.
- PBR properties are explicit; environment lighting will affect perceived gloss/whiteness.

## Changes from v3
1. Rebalanced the cistern dimensions and replaced the excessively thick dark tank belt with a 2.6 mm porcelain-tone line.
2. Reduced seat rim shadow from a wide, high-contrast band to a thin narrow gasket.
3. Rounded the seat front profile and corrected its slope and the ceramic support underneath it.
4. Assigned neutral white glaze, off-white seat polymer, and chrome lever instead of rendering-only colours.
5. Added glTF `KHR_materials_clearcoat` for ceramic to better mimic glazed enamel; Babylon.js supports the extension.
6. Rebuilt assets without arbitrary final global scaling; explicitly validated bounding dimensions.

## Limitations / next recommended step
**This model is not an official INAX 3D file nor dimensional CAD.** It is a visual approximation of the manufacturer model built from user supplied data. Exact curves, fillets, underside plumbing, inner siphon, and fittings cannot be verified to production tolerances. For catalogue/commerce-grade matching, obtain the **official 3D Max file**, linked under Downloads -> 3D Max Files on INAX's official AC-1017VRN product page, then convert/optimize it to GLB. INAX also links a CAD file from the same page.
