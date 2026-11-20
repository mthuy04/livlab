# Room Studio · P1 visual QA

The production Room Studio rendered the same 3.50 × 2.55 × 2.65 m room for all three overviews. The fixture set comprised the local INAX L-293V basin, AC-912VN toilet and BFV-70S shower models. The window, niche, screen and product transforms stayed fixed. The switcher thumbnails are crops of those renders.

| Style | Overview | Detail |
| --- | --- | --- |
| Đá ấm | [Travertine walls and matte floor](warm-stone-overview.png) | [Vanity and bedding detail](vanity-focus.png) |
| Trắng tối giản | [Ivory plaster and satin porcelain](minimal-white-overview.png) | [Shower and clear screen](shower-focus.png) |
| Khách sạn hiện đại | [Charcoal calcite and taupe floor](modern-hotel-overview.png) | [Glass edge and chrome](glass-metal-focus.png) |

[Side-by-side comparison](style-comparison.jpg) · [Switcher](style-switcher.png) · [Proposal](style-proposal.png) · [After reload](saved-style.png) · [High tier](modern-hotel-high.png) · [Low tier](modern-hotel-low.png) · [Tablet](tablet-styles.png) · [Mobile](mobile-styles.png)

## Verification

| Check | Result |
| --- | --- |
| Style definitions, atomic proposals, exact history, override precedence, preserved geometry, quote/budget invariance, legacy and tenant saves, window light and continuous wall UVs | 8 passed |
| Smart Studio, glass architecture, entrance doors and room transactions | 11, 27, 15 and 11 passed |
| Technical Advisor, Room Studio capability, INAX reconstructions and tenant SEO | 46, 70, 144 and 67 passed |
| Showroom V3 unit checks | Passed |
| TypeScript and targeted ESLint | Passed |
| Next.js production build | Passed with 101/101 prerender tasks |
| Browser fixtures | 1440 × 900 desktop, 768 × 1024 touch tablet, 390 × 844 touch mobile with reduced motion. The high/low comparison used matching desktop viewports. |

The browser suite exercises keyboard previews, explicit Apply, Discard, Undo/Redo, save/reload and rapid previews. It compares the committed product list, architecture and basket throughout. A separate controls scenario changes the floor and lighting after applying a pack and checks both overrides after reload.

## Measured rendering

The primary run used Chromium 159, ANGLE Metal and an Apple M1. On the high-tier desktop fixture, clicks reached the first recorded WebGL draw in 7 ms for Warm Stone, 4 ms for Minimal White and 4 ms for Modern Hotel. The median interval between draws during those transitions was 17 ms. Measurements start with the local model and mineral assets loaded. Draw submission timing excludes display scanout.

After each of three six-preview batches, WebGL instrumentation counted 19 live textures, 305 buffers and 18 programs. These are resource counts for this scene. Browser and GPU memory in bytes was not measured. [Desktop measurements](desktop-qa.json) · [Repeat-switch resources](resource-sample.json)

The supplementary SwiftShader run recorded 2,460 ms to the first Warm Stone draw, followed by 9 ms and 15 ms for the next styles. Software rendering stepped down to the lighter tier. Its resource counts also stabilized. Chromium reported screenshot readback stalls on SwiftShader. Both backends reported the existing Three.Clock dependency deprecation. The style scenarios check for shader failures, context loss and invalid WebGL operations. [Software-renderer measurements](swiftshader/desktop-qa.json)

Touch QA uses browser emulation. Physical iOS and Android devices remain unverified. The lighting uses direct shadows, a hemisphere fill and local reflections. Diffuse interreflection and glass refraction are approximations.

## Implementation map

- Style definitions and override precedence live in `lib/room-studio/stylePacks.ts`. State serialization, operation application, preview validation and stable placement views extend `roomState.ts`, `roomOperations.ts`, `roomProposal.ts` and `useRoomStudio.ts`.
- The panel and proposal wiring live in `components/room-studio/panels/StyleSwitcher.tsx` and `app/room-studio/RoomStudioClient.tsx`.
- `RoomScene3D.tsx` integrates the render tiers, light rig and environment fallback. The scene components `RoomShell.tsx`, `StyledSurfaceMaterial.tsx`, `SceneLighting.tsx`, `GlassArchitecture.tsx` and `PlacedProductNode.tsx` render the finishes, glass, daylight and under-basin architecture.
- `scripts/buildRoomMineralMap.py` reproduces the local linear-data mineral texture. It runs offline. The deployed application serves the texture and three preview images from `public/room-studio/styles/`.
- `scripts/testRoomStyles.mts`, `scripts/testRoomStylesBrowser.mjs`, the package test script and the updated implementation plan cover verification and maintenance.

The existing orbit, focus, plan cameras and wall coordinate system are available for Phase 2. A camera director, navigation body and collision checks for moving through openings remain separate work.
