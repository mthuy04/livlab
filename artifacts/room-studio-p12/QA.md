# Room Studio · Camera Director and walkthrough

Verified on 20 November 2026 from the local working tree based on `398c13b`. The final production build and camera browser run included the nine catalogue models imported during the work.

## Customer workflow

| Action | Verified behavior |
| --- | --- |
| Toàn cảnh / Mặt bằng | The room fits in the perspective overview and the orthographic plan. The plan supports panning and zooming. |
| Tập trung / Đề xuất | Focus frames the selected fixture or the affected geometry of a proposal. Moving an opening uses its old and proposed bounds. |
| Tham quan 3D | The camera enters at a clear point near the entrance. Rooms without a door search their existing floor area for a safe start. A room with unresolved fixture bounds or no free point displays the reason the tour is unavailable. |
| Move and look | WASD, arrow keys or the on-screen directional pad move relative to horizontal facing. Pointer or touch drag turns the view. Obstacles permit sliding along a free direction. |
| Exit | Escape or the exit button restores the design camera, including a panned and zoomed plan. Editing, product nudging and undo work again. The test compares the stored design and quotation before and after navigation. |

The director uses a short camera glide for compatible shots. It covers a projection change or obstructed route with a fade and swaps the actual camera. Reduced motion switches directly. Walkthrough uses a standing visitor with a 1.60 m eye height and a 0.18 m collision radius. The entrance threshold extends 0.65 m beyond an open doorway. Exterior navigation and crouching are outside this implementation.

## Browser evidence

Chromium 159.0.8154.6 ran the local production build with ANGLE Metal on an Apple M1. All three layouts used the same 3.50 × 2.55 × 2.65 m Warm Stone bathroom, with one hinged entrance, one window, a fixed shower screen, an L-293V basin with cabinet, an AC-912VN toilet and a BFV-70S shower. The test sampled the active Three.js camera and the intervals between actual rendered frames. Tablet and phone used Chromium touch emulation. The phone also used reduced motion.

| Viewport | Movement samples | Median frame | 95th percentile | Warm geometry / texture / program counts |
| --- | ---: | ---: | ---: | --- |
| Desktop · 1440 × 900 | 108 | 16.7 ms | 16.9 ms | 114 / 15 / 22 |
| Tablet · 768 × 1024 | 33 | 16.7 ms | 17.7 ms | 111 / 15 / 20 |
| Phone · 390 × 844 | 32 | 16.6 ms | 17.0 ms | 110 / 15 / 20 |

On desktop, continued forward input at the toilet advanced the camera about 0.02 mm as the substep solver settled at contact. Touch rotation and walking both changed the recorded pose. Three additional enter/exit cycles on each viewport returned to the same warm resource counts and the same 28 monitored DOM listeners. The browser harness recorded zero page errors. Physical iOS and Android frame times and long-session memory behavior remain unmeasured.

| View | Captures |
| --- | --- |
| Design cameras | [Overview](overview.png) · [Floor plan](floor-plan.png) · [Product focus](product-focus.png) · [Proposal focus](proposal-focus.png) |
| First person | [Entrance](entrance.png) · [Vanity](vanity.png) · [Shower](shower.png) · [Blocked at the fixture](fixture-collision.png) |
| Touch controls | [Tablet](tablet-controls.png) · [Phone](mobile-controls.png) |
| Raw measurements | [Desktop](desktop.json) · [Tablet](tablet.json) · [Phone](mobile.json) |

## Regression results

| Suite | Passed |
| --- | ---: |
| Camera, spawn, input and collision | 14 |
| Style and lighting | 8 |
| Smart Studio, Smart Fix and quotation | 11 |
| Glass architecture | 27 |
| Entrance doors | 15 |
| Room transactions | 11 |
| Room Studio capability | 70 |
| Technical Advisor | 46 |
| Catalogue reconstructions | 216 |
| Tenant routing and isolation | 67 |
| **Total** | **485** |

Showroom V3 also passed. TypeScript and targeted ESLint exited successfully. The Next.js production build completed all 101 prerender tasks. The tenant suite used Next.js's bundled `server-only` marker with the `react-server` resolution condition. The reconstruction tests checked the original models and the expanded library, including the world-space bounds of two GLBs with documented node transforms.

Earlier browser regressions on the Phase 2 implementation covered desktop Smart Fix and quote protection, product drag, window and partition edits, desktop and mobile entrance-door editing and style controls. The final integrated browser run repeated the camera and walkthrough scenarios at all three sizes. The isolated geometry benchmark completed 20,000 movement steps in 35.03 ms on this host, around 1.75 microseconds per step in that specific scene.

## Implementation files

| Area | Created or modified paths relative to the repository root |
| --- | --- |
| Camera and collision | Added `lib/room-studio/cameraDirector.ts`, `walkthrough.ts` and `walkInput.ts` in the same directory. Updated `lib/room-studio/architecture.ts` to share the entrance-leaf thickness. |
| Scene and controls | Added `components/room-studio/scene/WalkthroughOverlay.tsx`. Updated `RoomCameraControls.tsx`, `RoomShell.tsx`, `EntranceDoorNode.tsx` and `PlacedProductNode.tsx` in that directory. Integrated the controls in `components/room-studio/RoomScene3D.tsx` and `app/room-studio/RoomStudioClient.tsx`. |
| Tests | Added `scripts/testRoomCamera.mts` and `scripts/testRoomCameraBrowser.mjs`. Updated the toolbar selectors in `scripts/testEntranceDoorBrowser.mjs`, `scripts/testGlassArchitectureBrowser.mjs` and `scripts/testSmartStudioBrowser.mjs`. |
| Catalogue QA compatibility | Updated mounting checks in `app/dev/room-studio-3d-qa/ReconstructionQaClient.tsx` and file-transform, bounds and library membership assertions in `scripts/testInaxReconstructions.mts`. |
| Wiring and evidence | Updated `package.json`, `package-lock.json` and `docs/smart-design-studio-2.0/IMPLEMENTATION_PLAN.md`. Browser evidence is alongside this record. |

The collision solver uses the shared geometry of walls, jambs, open or closed leaves, and individual fixed, walk-in, hinged and sliding glass panels. Fixtures use their oriented placement envelopes, so contact can occur before a curved ceramic surface. Camera navigation adds no persisted room fields. The camera director and navigation tests are ready for the next phase. Physical-device testing remains a release follow-up.
