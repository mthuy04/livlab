# LIVLAB — 9 APPROVED GLBs / CLAUDE INTEGRATION PACK

This pack contains exactly **nine latest-version GLB files**, approved by the project owner for visual review. It deliberately **excludes old Phase1 draft geometry**. These models were independently reconstructed using public reference photography/specifications and are **not OEM CAD assets**; do not claim 90% accuracy or manufacturer approval.

## Layout
- `glb/` — 9 GLB 2.0 files, one per SKU.
- `catalogue_manifest.json` / `.csv` — imported SKU metadata, dimensions, paths, manufacturer sources, provenance, warnings. **Price is null by design**: verify current commercial price from authorized source, do not fabricate.
- `previews/` — product previews rendered from the actual GLB, plus contact sheets.
- `source-docs/` — original README and metadata for each of 3 versioned batches; source URLs and technical limitations.
- `qa/validation_9_glbs.json` — GLB header and binary size, SHA256, reloaded scene envelope dimensions.
- `CLAUDE_IMPLEMENTATION_PROMPT.md` — integration brief for the local LivLab repository.

## Product catalogue integration rules
1. Existing public `/s/tungdang` storefront content is a *separate source* from these 9 new 3D models. Do not assume the 9 already exist in its DB.
2. Inspect actual code/database; import EVERY valid public product from `/s/tungdang` into the canonical public Products browsing experience with deduplication, keeping tenant ownership/price/inventory isolation intact. Preserve old URLs and store-specific views.
3. Import these nine GLBs by `brand + SKU` idempotently, independent of storefront import. 3D model URLs must be reachable by Next.js static public assets or the app's existing approved asset serving pipeline.
4. Model metadata is a data source, NOT a promise of OEM fidelity. Technical dimensions are product envelope; pigtail, hangers, wall clearance may remain estimated. See `source-docs/`.
5. If prices aren't independently verified, show *Liên hệ báo giá* / *Giá đang cập nhật* (not 0 VND).
6. For room placement: Y-up meters, +Z generally forward, wall-mounted assets and an inset floor drain are different. Avoid creating floating/exposed underfloor trap on top of finished floor.
7. Chrome/mirror PBR needs environment lighting. The LED mesh only carries emissive material; a separate controllable light is needed for illumination spill.
8. Existing bathroom equipment, quote state, undo/redo, multi-tenant isolation must not regress. Do not auto add any new SKU to user's design or quote.
9. Original manufacturer images are NOT bundled; please honor website/media usage permissions.

## Important blockers/ambiguities
- `INAX KF-546V` has conflicting manufacturer/catalogue dimension ordering. This GLB matches the previous accepted reconstruction. Mark the technical spec as provisional; do not present as verified shop drawing.
- `INAX PBFV-600` has assumed underfloor depth mapping and provisional trap geometry. Not a construction/MEP installation CAD.
- The `Roca A851693513` manufacturer URL in original metadata was a placeholder, so `manufacturerUrl` may be null. Find the canonical real Roca product page, do not link to a fabricated URL.
- Rendered product *preview PNGs* are model QA images, not photos supplied by manufacturers.
- No local repository files are changed by this pack. Claude must integrate into the user's own LivLab workspace.
