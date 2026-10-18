# INAX AC-912VN — Reconstruction and GLB QA report

**Status: CONDITIONAL — web visualization prototype, not manufacturer-certified CAD.**

## 1. Input references and identification

- User-supplied photograph (white floor-standing ceramic toilet, right-side flush lever).
- User-supplied three-view drawing labeled **AC-912VN (1.2021)**.
- User-supplied exploded assembly view labeling **CF-602VS/BW1** soft-close seat.
- INAX Vietnam manufacturer's 2026 catalogue supports D721 × W372 × H680 mm.
- Manufacturer product page lists Aqua Ceramic and soft-close seat; note that a secondary description table on that web page conflicts with the principal description/drawing. The attached drawing + 2026 catalogue control this model's dimensions.

## 2. Dimensional verification

| Dimension | Target (mm) | GLB high (mm, after reload) | GLB web (mm, after reload) | Status |
|---|---:|---:|---:|---|
| Width (X) | 372 | 372.000 | 372.000 | PASS — nominal bounds |
| Height (Y) | 680 | 680.000 | 680.000 | PASS — nominal bounds |
| Depth (Z) | 721 | 721.000 | 721.000 | PASS — nominal bounds |
| Seat height | 390 | 390.000 (top cover) | 390.000 (top cover) | Estimated interpretation of the 390 drawing line |
| Drain offset from wall | 305 | not modeled | not modeled | Drawing reference only; not geometry-verified |
| Rear wall gap | 15 | annotation only | annotation only | Drawing installation context; not part of product mesh |

The 305mm wastewater outlet is a **site connection** dimension, not a visible pipe on the provided product photo; it is recorded as metadata rather than fabricating plumbing geometry. Do not treat the model as a plumbing-installation CAD.

## 3. Geometry approach

- Bowl/body: smooth vertical loft with silhouette stations derived from side view and perspective photo.
- Bowl interior: recess and closed solids, generally hidden beneath the closed seat lid.
- Cistern: tapered rounded-rectangle loft with separate lid and a subtle thin seam.
- Seat: separately modeled CF-602VS-style annular seat, white closed cover, thin shadow gasket.
- Lever: approximate chrome side paddle and mount.
- All 9 output component meshes are topologically watertight after GLB reload.
- A one-piece appearance is approximated using overlapping cistern and bowl meshes; the mesh is **not** a true Boolean-fused watertight manufacturing solid.

## 4. Materials

All visual materials are embedded as glTF PBR parameters. No external texture references.

| Surface | Base color estimate | Metallic | Roughness | Meaning |
|---|---|---:|---:|---|
| Ceramic body | (245,245,244) | 0.0 | 0.17 | Glossy Aqua Ceramic approximation |
| Tank lid | (247,247,246) | 0.0 | 0.19 | White ceramic |
| Closed seat cover | (249,249,247) | 0.0 | 0.30 | White polymer |
| Seat ring | (245,246,245) | 0.0 | 0.29 | White polymer |
| Gap edge | (191,194,195) | 0.0 | 0.60 | Shadow line |
| Flush lever | (208,210,213) | 0.92 | 0.19 | Chrome-like reflection |

Color and physical roughness are visually estimated and not measured from calibrated samples. Preview images use VTK Phong lighting and therefore do **not** verify real-time PBR reflection strength. Three.js/Babylon.js should use an environment map and appropriate neutral studio illumination.

## 5. GLB technical QA

- Export: GLB / glTF 2.0, meters, +Y up, +Z forward, X horizontal.
- Root origin (0,0,0): rear-center at floor plane. This origin is fixed without nonuniform scale correction.
- Both assets exported, re-imported with Trimesh; all 9 meshes watertight, finite, and correctly bounded.
- Visual previews of high asset rendered with VTK from actual exported geometry: perspective, front, side, top, rear.
- Native Babylon.js browser runtime: **not tested**. A glTF parser re-import is not proof of browser rendering.
- Source reconstruction does not use the original manufacturer's CAD, and exact curved profiles remain unverified.

## 6. Accuracy limitations and acceptance

**PASS** — correct product class, exterior recognizable, known overall dimensions, seated-height interpretation, separate components, stored PBR materials, glTF reload, web file-size target.

**CONDITIONAL** — exact tank-to-body blend, lid/toilet foot curvature, internal outlet and hidden plumbing, trim/gasket detail and reflection under real-world lighting. The reference image is a single perspective view, so back and bottom are only approximate. Source mesh is not mechanically precise.

**UNTESTED** — Babylon.js on end-user hardware, cross-browser appearance, manufacturer asset licensing, print/manufacturing suitability.

**Recommendation:** Use `AC-912VN_web.glb` as a placeholder/visual asset in LivLab Room Studio, not a claim of exact original manufacturer geometry. If INAX CAD/MAX file is obtained in a convertible format and the license allows use, replace this approximation with the OEM mesh and retain the same dimension/orientation QA gates.
