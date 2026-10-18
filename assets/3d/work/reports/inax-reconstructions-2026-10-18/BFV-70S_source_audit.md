# BFV-70S — 3D reconstruction & QA report

**Status: CONDITIONAL — approximate visual product reconstruction, not manufacturer CAD.**

## Sources & verification

- Reference render and engineering drawing provided by user.
- Matched manufacturer SKU: [INAX BFV-70S](https://www.inax.com.vn/products/shower/bfv-70s/).
- Manufacturer states body is brass coated with Chromium/Nickel.
- Drawn dimensions: overhead head Ø203 mm; riser-to-head reach 350 mm; upper slider 720 ± 5 mm above mixer; mixer-to-spray-face height max 1397 mm; connector G1/2; supply center spacing 150 ± 20 mm.

## Coordinate frame

- X left/right; Y up; Z away from wall (front). In meters.
- Origin (0,0,0): wall plane behind the center of the mixer at mixer height. Mounted products can extend below origin.

## Geometry

- Cylinder mixer bar with two rear wall flanges, main riser with rounded bends, wall mounting bracket, handheld wand and hose, overhead rain disc and spray nozzles.
- GEOMETRIC ASSUMPTIONS: pipe diameters, flange sizes, mixer width, bend radii, rain disc edge profile, nozzle count and handheld geometries visually estimated. This file cannot be used for fabrication.

## GLB reload checks

- **BFV-70S_high.glb** — 0.70 MB, 26 meshes, 38,812 triangles; W/H/D extents = 294.00/1638.53/523.50 mm, watertight all = True.
- **BFV-70S_web.glb** — 0.32 MB, 25 meshes, 17,140 triangles; W/H/D extents = 294.00/1638.05/523.50 mm, watertight all = True.

## Dimensional QA (geometry inputs, not bounding box)

- Rain head diameter: 2 × 101.5 = 203 mm (verified).
- Reach from riser tube center z=72 mm to rainhead center z=422 mm: 350 mm (verified).
- Rain head spray face: y=1.397 m relative to mixer y=0, with nozzles projecting roughly 3.4 mm lower (reference 1397 mm applies to face, not extreme jets).
- Slider bracket center at y=0.720 m (verified nominal 720±5).
- Mixer wall water feeds centered at x=±75 mm: spacing 150 mm (nominal).

## Materials

- Chromium/Nickel plated brass represented by metallic chrome glTF 2.0 PBR materials; no calibrated texture reference.
- Dark spray elastomer and hose satin reflection estimated visually.
- Preview PNGs are made from GLB geometry using VTK lighting; they **do not show actual PBR environment reflections**. Chrome finish should be checked with an HDRI/neutral scene in Babylon.js.

## Runtime validation & limitations

- GLB serialization/reload tested by Trimesh; independent browser render **not tested**.
- Some optional details represented as simplified solid geometry; manufacturer DWG/3ds Max not imported.
- Mesh contact intersections between grouped visible pieces are intentional at fittings; no collision avoidance guarantees.
- Not certified for plumbing installation / industrial manufacturing.

## LivLab integration

- Use BFV-70S_web.glb for multi-object room scenes, high for close-ups.
- Wall placement: set origin on wall plane Z=0 at the mixer bar height. Align front of model to face room (+Z).
- Mixer height needs to be set by Room Studio (for example 0.9–1.0 m above floor) rather than assumed in GLB.
