# LivLab Smart Design Studio 2.0

## Approved P0 sequence · 20 November 2026

This section supersedes the 19 November planning draft preserved below. The first implementation covers the workspace baseline and shared transactions. Future milestone numbers in the archive refer to the earlier proposal.

| Milestone | Deliverable and acceptance boundary |
| --- | --- |
| P0.0 · Audit | Verify the local checkout, changes already present, state owners, persistence, technical coverage and baseline results. |
| P0.1 · Operations and transactions | Serializable product, finish, lighting, room-size and architecture commands. Atomic preview with revision, diff, deterministic findings, reference budget delta and explicit Apply. Bounded, session-only labelled undo and redo across room edits. |
| P0.2 · Flexible architecture | Persistent entrance doors, windows and shower partitions with stable IDs. Real wall openings, opening and entry geometry, selectable and draggable elements, numeric controls, and synchronized plan and perspective views. Preserve cutaway visibility. |
| P0.3 · Smart geometry tools | Compatible surface and wall snapping, alignment feedback, measured dimensions, footprint and clearance overlays, swing and shower-entry zones, optional advisory wet/dry regions. |
| P0.4 · Live validation | Extend the Advisor with architectural bounds, opening overlaps, partition, door-swing and shower-entry conflicts. Share geometry with the canvas and run lightweight active-object checks during drag. Verified metadata takes priority, followed by approved versioned guidance. Show what still needs verification. |
| P0.5 · Smart Fix | Generate up to three feasible, distinctly explained fixture moves, rotations, wall changes, affected-fixture moves or catalogue replacements. Rank deterministically, prioritize keeping the product and minimizing affected fixtures and displacement. Ghost preview, explicit Apply, exact undo. Keep room dimensions and openings fixed. |
| P0.6 · Live budget and quotation | Show committed and proposed reference ranges and unpriced counts. Enable mirroring only after explicit linking or saving. Key room lines by tenant, design and provenance. Exercise duplicate SKUs, quantity changes, replacement, undo and idempotent reconciliation with the existing basket and showroom handoff. |
| P0.7 · End-to-end QA | Run the 18 scenarios from the brief, legacy and tenant fixtures, responsive browser checks, technical and build suites. Measure actual validation, search and rendering costs separately. |

P1 Phase 1 now adds the three visual style packs to the existing R3F renderer, product pipeline and proposal history. P1 Phase 2 extends the same scene with a camera director and a first-person walkthrough.

### P1 Phase 1 · visual transformation

The Material tab offers Đá ấm, Trắng tối giản and Khách sạn hiện đại. A style proposal previews the walls, floor, architectural trim and lighting together. Apply creates one revision. Discard, Undo and Redo use the existing room transaction system.

RoomState v3 accepts an optional visual style ID and a list of manually overridden channels. Wall, floor and lighting edits override only their own channel. Reapplying a pack previews restoring its defaults. Legacy saves use their existing materials and light settings. Product references, transforms, opening geometry, technical metadata and quote contents are independent of the style operation.

The surfaces use full-wall UVs in metres and one local, losslessly encoded mineral map. The map contains travertine bedding, fine calcite fractures and stone grain. Metal frames retain the chosen graphite or ivory finish. Directional daylight uses the largest valid window and casts through its parametric opening. A hemisphere fill, local reflection panels and ceiling lights supply the other layers. The renderer blends surface weights, light and exposure on demand and observes reduced motion.

The [visual QA record](../../artifacts/room-studio-p11/QA.md) contains the same-room comparisons, device checks and measured performance.

### P1 Phase 2 · immersive experience

Room Studio has overview, orthographic plan, product focus, proposal focus and first-person walkthrough modes. Product and proposal framing uses the extents of the affected fixtures and architecture. The director retains the design camera position, target, projection and zoom for the return trip. Camera input stays outside the persisted design and its transaction history.

Walkthrough builds its collision world from the shared wall openings, door leaves, window sashes, shower panels and rotated fixture volumes. It uses a virtual standing body, admits movement through modeled open passages, and looks for an unoccupied spawn near the entrance. A legacy design starts from a free point within its original layout. Unknown product bounds or a room without a free spawn keep the editing views available with an explanation.

The [walkthrough QA record](../../artifacts/room-studio-p12/QA.md) includes desktop and touch interactions, collision tests, camera restoration, screenshots and frame measurements.

### Local baseline

Verified origin `mthuy04/livlab`, branch `main`, HEAD `4dd4fa2`. Existing user work included the untracked plan directory, artifacts and two images, plus a modified tracked TypeScript build cache. The production build was exercised in an isolated copy of the local tree. TypeScript was also run with incremental writes disabled.

| Area inspected | Finding at handover |
| --- | --- |
| Client, state and repository | One client hook owns serializable v1 room snapshots. The hook debounces repository writes to localStorage under the original LivLab key or a tenant suffix. Each pointer move previously changed the saved-room input. Starter rooms had their own single undo snapshot. |
| Scene and editing | RoomShell already cuts the left window out using a shape hole. The panel and window positions come from room dimensions and booleans. The front is open, other walls support camera cutaway. MiniFloorPlan supports fixture selection and placing a utility point. The R3F orthographic camera already supports product dragging. Architectural objects have no IDs or editable coordinates. |
| Geometry and technical data | Bounds, mounting, clearance, collision, plumbing and data-completeness rules are deterministic. The context counter participates in collisions. The clearance rule currently measures toward room +Z, including after fixture rotation. P0.3/P0.4 must verify directional geometry before drawing or promising rotated clearance zones. The legacy lighting and architecture parsers supply defaults. |
| Budget, quote and handoff | Reference totals track missing prices. The current Save Design action adds unique product IDs to the existing quote basket. Catalogue entries can carry tenant, source and price snapshots. Per-design mirroring and room-line reconciliation belong to P0.6. The handoff projects the committed room, products, budget and findings. |
| Test coverage | Existing script suites cover capabilities, catalogue and model metadata, starter rooms, placement geometry, tenant behaviour and the deterministic Advisor. The baseline had no general transaction or proposal tests. |

Baseline TypeScript and production build passed. Room Studio capability passed 70 checks, Technical Advisor 46, INAX reconstructions 144, concepts 66 and dev GLB 44. Showroom V3 passed. Plain Node execution of tenant SEO and showroom media failed to resolve `server-only`. Both can run with Next's bundled marker on `NODE_PATH` and the `react-server` condition. The conversion test requires permission to launch headless Blender. Full studio lint reported one existing React immutability error at `PlacedProductNode.tsx:438`.

### P0.1 ownership and compatibility

- `useRoomStudio` owns one committed snapshot in its history. Direct edits, successful proposal Apply and completed drags use the same transaction boundary. A new edit clears redo. Undo and redo advance a monotonic revision, even when a prior snapshot is restored.
- Operations resolve catalogue IDs through the active tenant, including per-instance model variants. Runtime payload validation rejects malformed commands and an invalid required command rejects its batch. Optional starter slots are resolved and disclosed before forming the required operations.
- The existing Advisor runs on both complete layouts in strict mode for proposals. A new VERIFY geometry finding blocks Apply. Reference clearance advisories and unresolved data remain visible. A selected issue must exist and resolve with evidence. The comparison accounts for findings that reuse one ID for both a violation and a pass.
- The scene can show a preview or a drag draft. Storage, reference budget, Expert context, quotation and showroom handoff consume the committed design. History holds at most 50 transactions. Pending previews and history expire with the session. The saved room schema stays at v1.
- The existing header hosts labelled undo/redo. Starter selection, size presets, demo links and architecture toggles use the review dialog. Direct manipulation remains available, including manual placements that need correction by the Advisor.

### P0.1 verification

| Check | Result |
| --- | --- |
| New foundation suite | 11 scenario groups passed. Includes atomic JSON batches, malformed payloads, selected issue resolution, missing evidence, compatible wall moves, replacement pricing, drag cancellation, bounded and branching history, stale Apply, all four starter layouts, legacy reload and isolated storage. Run with `npm run test:room-transactions`. |
| Existing suites | Technical Advisor 46, Room Studio capability 70, INAX reconstructions 144, concepts 66, dev GLB 44, tenant SEO 67, showroom media 25 and conversion pipeline 87 checks passed. Showroom V3 and the Python source-discovery suite also passed. |
| Execution environment | Node 22.20.0 on macOS arm64. For standalone tenant SEO and showroom media, use Next's bundled `server-only` marker via `NODE_PATH=./node_modules/next/dist/compiled` and Node's `--conditions=react-server`. Conversion used local headless Blender. Next's production build used its compiler socket and the existing Google Fonts download. |
| Static validation | TypeScript, targeted ESLint across the studio and Advisor, and the Next.js production build passed. The fixture pointer-down handler now reads the live camera controls when the gesture begins. This also cleared the baseline immutability lint error. |
| Browser | Headless Chromium on the local production build at 1440×900, 768×1024 and 390×844. Demo Preview/Discard/Apply, architecture toggle, keyboard and button history, native input undo protection and reload passed. A legacy fixture, a manual quote line and a separate tenant storage key were seeded. The latter two survived the flows intact. The desktop orthographic view also passed an actual pointer drag with unchanged storage before release and exact single-step Undo/Redo afterward. A separate run loaded the Tùng Đăng catalogue, applied its two-product demo, previewed a size preset, and exactly restored the previous Tùng Đăng snapshot with Undo. The LivLab storage key retained its original value. |
| Measured computation | 10 fixtures, one architecture flag proposal, 50 warmups and 500 measured runs using the production operation, Advisor and budget functions. Median 0.071 ms, p95 0.232 ms. This measures synchronous proposal construction in Node. Rendering and future candidate search require their own measurements. |

The pointer test exposed a label intercepting the fixture and a mesh obscuring the drag catcher plane. The scene now picks the fixture once and tracks the same pointer on its mathematical mounting plane through release or cancellation.

### File manifest

| Change | Files |
| --- | --- |
| Added transaction foundation | `lib/room-studio/roomOperations.ts`, `lib/room-studio/roomHistory.ts`, `lib/room-studio/roomProposal.ts`, `lib/technical-advisor/proposalGate.ts` |
| Added review UI and tests | `components/room-studio/RoomProposalDialog.tsx`, `scripts/testRoomTransactions.mts` |
| Updated room state and validation | `lib/room-studio/useRoomStudio.ts`, `lib/room-studio/roomState.ts`, `lib/room-studio/roomPresets.ts`, `lib/technical-advisor/engine.ts`, `lib/technical-advisor/useTechnicalAdvisor.ts`, `lib/technical-advisor/rules/collisionRule.ts` |
| Updated editor and gestures | `app/room-studio/RoomStudioClient.tsx`, `components/room-studio/WorkspaceHeader.tsx`, `components/room-studio/RoomPresetDialog.tsx`, `components/room-studio/RoomContextPanel.tsx`, `components/room-studio/RoomScene3D.tsx`, `components/room-studio/scene/DragPlane.tsx`, `components/room-studio/scene/PlacedProductNode.tsx` |
| Updated project files | `package.json` and this implementation plan |

### Preparation for P0.2

1. Capture v1 fixtures for all four window/partition flag combinations, all starter presets and each tenant key. Assert geometry parity with `windowRect` and `glassPartitionRect` at the original room size. Legacy rooms must have zero entrance doors.
2. Define stable element IDs and a wall-local coordinate convention for all four walls. Include the front wall for openings while retaining the current product-mounting wall contract. Use a versioned, idempotent migration and one authoritative element collection. Translate old flags at the read boundary.
3. Start with a single editable hinged entrance door through the whole stack. Add element add/update/remove commands, deterministic wall bounds and swing tests, a real wall opening and matching plan geometry. Wire selection, numeric changes and dragging through one preview/apply transaction. Test cancel, undo/redo, save/reload and cutaway. Extend the same path to windows and partitions. Implement a mechanism only when the geometry and validation support it.

### P0.2A · Editable hinged entrances

The Room tab now accepts a hinged entrance on any wall. The editor, measured SVG plan, orthographic and perspective views, and Advisor use the same wall frame. The offset runs from the wall's left end to the left jamb when viewed from inside the room. In plan, these axes run clockwise starting from the back-left corner. All stored lengths are metres. The editor displays centimetres.

- Schema v2 adds a serialized `elements` collection with stable IDs. A v1 snapshot migrates to zero doors and keeps its original tenant key, fixtures, dimensions, window and partition flags. The original open front stays visible until a front entrance is configured. This keeps product-mounting rules and existing designs compatible.
- The wall mesh omits triangles in each opening, including at floor level and at corners. Its UVs span the whole wall. Skirting stops at the jambs. The front surface and its door hardware follow camera cutaway. The generic door starts at an editable 80 × 200 cm. Its frame, handle and leaf illustrate the design.
- An `element.add`, `element.update` or `element.remove` command enters the existing P0.1 proposal gate. During a pointer gesture, a transient position drives both renderers. Release validates the draft. Apply creates one transaction. Storage, quote data and the showroom snapshot see the committed room.
- The Advisor checks opening bounds, intersections with other entrances, the fixed window and the niche, the opposite wall, and the full quarter-turn of the leaf against oriented fixture footprints at overlapping heights. The same sweep applies to visibly closed doors. Incomplete dimensions produce a verification finding. Physical hardware tolerances, exterior obstacles and building-code compliance require independent verification.

#### P0.2A verification

The existing 11 transaction, 46 Advisor, 70 capability and 144 reconstruction checks passed before and after the change. The 15 new test groups include real mesh raycasts on all four walls, both hinge hands and swing directions, room resizing, conflict rejection, exact history, tenant keys and all four legacy window/partition flag combinations. TypeScript, targeted ESLint and the isolated production build passed.

Three Chromium browser scenarios passed on the local production build. Desktop at 1440 × 900 and emulated touch at 390 × 844 exercised Preview, Discard, Apply, dragging, Undo, Redo, reload and removal. A separate legacy design blocked an inward swing against a catalogued TOTO fixture, accepted an outward swing and preserved a manual quote line and another tenant’s stored room. All three scenarios completed without uncaught page errors. To repeat, run `npm run test:entrance-doors` for deterministic checks and `node scripts/testEntranceDoorBrowser.mjs` for browser QA. Set `ROOM_QA_ORIGIN` to the server origin, `ROOM_QA_PLAYWRIGHT` to an installed Playwright Core module if needed, and `ROOM_QA_CHROMIUM` to the Chromium executable if it is outside Playwright's default cache. Screenshots go to [the P0.2A artifacts](../../artifacts/room-studio-p02a/).

A Node v22.20.0 microbenchmark exercised the door rule with four doors and twelve synthetic measured fixtures, after 500 warm-up runs. Across 40 batches of 100 calls, the median batch mean was 0.120 ms per room and the 95th-percentile batch mean was 0.241 ms. This measures CPU validation only.

#### P0.2A file manifest

| Change | Files |
| --- | --- |
| Added shared geometry and rule | `lib/room-studio/architecture.ts`, `lib/room-studio/wallMesh.ts`, `lib/technical-advisor/rules/entranceDoorRule.ts` |
| Added editor and rendering | `components/room-studio/panels/EntranceDoorEditor.tsx`, `components/room-studio/DoorPlanLayer.tsx`, `components/room-studio/scene/EntranceDoorNode.tsx` |
| Added QA | `scripts/testEntranceDoors.mts`, `scripts/testEntranceDoorBrowser.mjs`, `artifacts/room-studio-p02a/*.png` |
| Extended studio | `app/room-studio/RoomStudioClient.tsx`, `components/room-studio/MiniFloorPlan.tsx`, `components/room-studio/panels/RoomTab.tsx`, `components/room-studio/RoomScene3D.tsx`, `components/room-studio/scene/RoomShell.tsx`, `components/room-studio/scene/PlacedProductNode.tsx` |
| Extended state and proposals | `lib/room-studio/roomState.ts`, `lib/room-studio/useRoomStudio.ts`, `lib/room-studio/roomOperations.ts`, `lib/room-studio/roomProposal.ts`, `lib/room-studio/environment.ts` |
| Extended validation consumers | `lib/technical-advisor/types.ts`, `lib/technical-advisor/engine.ts`, `lib/technical-advisor/useTechnicalAdvisor.ts`, `lib/room-studio/placementStatus.ts`, `lib/room-studio/expertContextBuilder.ts`, `lib/implementation/types.ts`, `lib/implementation/buildHandoffPackage.ts` |
| Updated project files | `package.json` and this implementation plan |

#### P0.2B handoff

After door review, introduce a window variant with wall, offset, size and sill. Use the existing `windowRect` as the migration fixture for flag-enabled rooms. Give each migrated opening one stable ID and one geometry owner so toggling or reloading cannot cut the wall twice. Reuse the element commands, wall mesher, opening intersection check and transaction UI. Leave the partition flag readable until its own migration.

### P0.2B · Editable windows and shower partitions

The Room tab now edits entrances, windows and shower screens in the same panel. Select an element on the measured plan or in the element list. Drag it with a pointer or touch, use the endpoint handle to rotate a screen, or enter centimetres and degrees directly. Both views show the draft. Apply accepts one transaction. Discard, undo, redo and stale-preview protection use the P0.1 history. The showroom package reads committed elements.

| Element | Supported configuration and geometry |
| --- | --- |
| Window | Any of the four walls, distance from the wall's left end to the first jamb, width, height, sill, three glass finishes and two frame finishes. Fixed glazing and a left-hinged, outward-opening casement have measured frames. An open casement turns 90°. The parametric wall surface and plan both omit the opening. Several openings can share a wall. A configured front wall follows the existing cutaway. |
| Fixed screen | Freestanding centre in room X/Z, rotation, length, height and clear, frosted or tinted glass. |
| Walk-in screen | One fixed half and one open half. The user chooses the entry end. The plan and scene display the modeled passage. |
| Hinged shower door | One fixed half and one opening leaf. The entry end chooses the hinge jamb. The leaf swings 90° in either direction. Validation includes the swept area even when the door is shown closed. |
| Sliding screen | A second panel travels on an offset parallel track and parks behind the fixed panel. Entry end controls the travel direction. The occupied track and passage take part in validation. |

Windows reuse the door wall frame and segmented wall mesh. Freestanding screens store their centre in room metres and their clockwise angle in plan degrees. Both renderers and the Advisor read the same segments, sweeps and opening dimensions. The Advisor checks opening elevation and overlap, frame corners, screen bounds, measured fixture footprints at overlapping heights, modeled passages, door swings and sliding travel. Incomplete fixture dimensions retain a verification finding. Entry markings describe the modeled opening. Site approach space, exterior casement obstacles and manufacturer-specific hardware require independent measurements.

Schema v3 stores the three element types in one collection. For v1 and v2 rooms, each enabled legacy flag becomes one element using the original window or partition rectangle. Fixed legacy windows retain their daylight backing. Existing IDs take precedence, disabled elements stay absent, and subsequent reloads use the stored collection. Preset commands still accept the old flags. The tenant keys and product placement format are unchanged.

#### P0.2B file manifest

| Change | Paths from the repository root |
| --- | --- |
| New geometry and validation | `lib/room-studio/glassGeometry.ts`, `lib/technical-advisor/architectureGeometry.ts`, `lib/technical-advisor/rules/glassArchitectureRule.ts` |
| New rendering and QA | `components/room-studio/scene/GlassArchitecture.tsx`, `scripts/testGlassArchitecture.mts`, `scripts/testGlassArchitectureBrowser.mjs`, `artifacts/room-studio-p02b/*.png` |
| Generalized door components | `components/room-studio/DoorPlanLayer.tsx` became `components/room-studio/ArchitecturePlanLayer.tsx`. `components/room-studio/panels/EntranceDoorEditor.tsx` became `components/room-studio/panels/ArchitectureEditor.tsx`. |
| Updated state and operations | `lib/room-studio/architecture.ts`, `lib/room-studio/roomState.ts`, `lib/room-studio/roomOperations.ts`, `lib/room-studio/roomProposal.ts`, `lib/room-studio/placementStatus.ts` |
| Updated Advisor | `lib/technical-advisor/engine.ts`, `lib/technical-advisor/types.ts`, `lib/technical-advisor/rules/entranceDoorRule.ts` |
| Completed showroom handoff | `lib/implementation/leadContext.ts` includes the committed elements in the outgoing lead context. `app/showroom/leads/[id]/page.tsx` displays their dimensions, placements and mechanisms in the existing room section. |
| Updated editor and scene | `app/room-studio/RoomStudioClient.tsx`, `components/room-studio/MiniFloorPlan.tsx`, `components/room-studio/RoomScene3D.tsx`, `components/room-studio/panels/RoomTab.tsx`, `components/room-studio/scene/EntranceDoorNode.tsx`, `components/room-studio/scene/PlacedProductNode.tsx`, `components/room-studio/scene/RoomShell.tsx` |
| Updated checks and plan | `scripts/testEntranceDoors.mts`, `scripts/testEntranceDoorBrowser.mjs`, `package.json`, `docs/smart-design-studio-2.0/IMPLEMENTATION_PLAN.md` |

#### P0.2B verification

The dependency baseline passed on the incoming working tree, including a production build and all three entrance-door browser scenarios. All three door scenarios passed again against the P0.2B build, including the migrated fixture conflict, the existing manual quote item and the separate tenant room. The initial deterministic run passed 26 glass architecture groups, 15 entrance-door groups, 11 transaction groups, 46 Advisor checks, 70 Room Studio capability checks and 144 INAX reconstruction checks.

Recovery verification followed the committed elements through the actual showroom request serializer. It found that the lead projection dropped the elements after the local handoff package was built. The projection now carries each complete element, and the showroom lead reads it from its existing tenant-scoped room snapshot. A 27th test intercepts the outgoing request and compares the payload during preview, after Apply, after Undo and Redo, and for an empty design. The existing suites and Showroom V3 also passed. TypeScript and targeted ESLint passed. The default production build passed on retry after an initial Turbopack error parsing the existing Inter web font.

Run `npm run test:glass-architecture` for the deterministic tests and `node scripts/testGlassArchitectureBrowser.mjs` against a local production server for responsive interaction QA. The browser harness uses the same origin, Playwright and Chromium environment variables as the entrance-door suite. [P0.2B screenshots](../../artifacts/room-studio-p02b/)

Desktop, tablet and mobile Chromium passed select, move, rotate by handle, numeric edits, invalid placement, discard, apply, undo, redo, removal and save/reload. The desktop run also dropped a catalogue fixture on the canvas, dragged it inside the room in orthographic view, and undid that drag. Each run checked for uncaught page errors. The figures below are one pointer event per element per viewport, measured until the first animation-frame sample showing the new SVG coordinates. Chromium used SwiftShader, with touch emulation on tablet and mobile.

| Viewport | Window drag | Walk-in screen drag |
| --- | ---: | ---: |
| Desktop 1440 × 900 | 63.9 ms | 267.4 ms |
| Tablet 768 × 1024 | 60.9 ms | 446.7 ms |
| Mobile 390 × 844 | 26.3 ms | 98.4 ms |

The screen took longer to update in all three samples. Physical device latency and sustained frame rate remain unmeasured. Screenshot comparisons cover [the wall opening](../../artifacts/room-studio-p02b/desktop-window-opening.png), [invalid sill feedback](../../artifacts/room-studio-p02b/desktop-invalid-sill.png), [hinged travel](../../artifacts/room-studio-p02b/desktop-hinged-plan.png), [sliding travel](../../artifacts/room-studio-p02b/desktop-sliding-plan.png), [undo](../../artifacts/room-studio-p02b/desktop-after-undo.png), [redo](../../artifacts/room-studio-p02b/desktop-after-redo.png) and [restored rotation](../../artifacts/room-studio-p02b/desktop-restored-rotation.png).

The recovery run captured [26 fresh screenshots](../../artifacts/room-studio-p02b/verification-KhC1eZ/) and passed all three responsive glass workflows and all three entrance-door browser scenarios. On desktop it also compared pixels inside the actual 3D canvas for the graphite and ivory window finishes and for both opening mechanisms. The window's gold selection marker now covers only the top frame rail, leaving the selected finish visible.

#### P0.3 readiness

P0.3 can consume the existing wall frames, measured openings, oriented fixture footprints, shower-entry segments, swing sectors and revision-bound proposals. Start with compatible wall and surface snapping on the existing fixture drag path. Convert the desired screen distance to room distance through the active camera and measure pointer feedback on physical hardware. Reuse these same shapes for dimension labels and optional overlays. Check rotated directional clearance against verified product data before marking a clearance zone.

### P0.3–P0.7 implementation and verification

| Milestone | Delivered in the local working tree |
| --- | --- |
| P0.3 | Fixture dragging projects eight screen pixels into room metres and uses the existing mounting constraints. Users can toggle snapping, centimetre measurements and planning zones in the Room tab. The scene draws fixture footprints, measured gaps, front clearance, door sweeps and shower entry. Wet/dry regions require a shower and a partition that defines the dividing line. |
| P0.4 | Product intersections use oriented footprint clipping with a vertical overlap test. The Advisor also checks mounting openings and measures the whole front edge of a rotated fixture against room boundaries, fixtures and glass. Dragging runs geometry checks on the draft and shows the contextual finding before release. Missing dimensions and manufacturer requirements retain verification status. |
| P0.5 | The Technical panel searches for up to three repairs in a local worker. Search considers translations, rotation, compatible wall changes, moving a second fixture and compatible catalogue replacements. A paired search can split the required separation between fixtures. Every alternative must clear the selected finding and pass the existing atomic proposal gate. Preview shows the old volume, proposed position, remaining findings and budget change. |
| P0.6 | Save explicitly links a tenant-scoped design ID to its quote lines. Product-page, manual and other design lines keep their own identities. Committed replacement, removal, reset and history operations reconcile linked quantities. The previous, current and proposed ranges expose unpriced items. The showroom request preserves provenance and unknown prices. |
| P0.7 | The production bundle, TypeScript, geometry and history suites passed. Chromium exercised desktop, tablet and mobile. Fixture pointer events are coalesced and the 3D scene renders on demand. |

#### Verification record

The automated runs passed 11 smart geometry, search, budget and quote scenario groups, 27 glass groups, 15 door groups, 11 transaction groups, 46 Technical Advisor checks, 70 Room Studio capability checks, 144 INAX checks and 67 tenant checks. Showroom V3 passed separately. Targeted ESLint reported zero errors and two existing image-element warnings in the quote components. The default production build generated all 101 static pages in an isolated copy of the local tree.

Nine Chromium scenarios passed. They covered real mouse dragging into a door swing, a warning before release, explicit linking, preview isolation, Apply, Undo, Redo, reload, a catalogue replacement with a budget delta, and preservation of a manual line for the same product. Architecture scenarios covered window and partition movement, hinged and sliding leaves, legacy doors and cutaway visibility. The wet/dry overlay test checked both advisory labels and a measured 60 cm entrance on a 120 cm walk-in installation. A separate test exercised the public quote service through transaction creation using an in-memory database and catalogue. [Screenshots and verification logs](../../artifacts/room-studio-p07/)

| Viewport | P0.2B partition drag | Integrated partition drag | Integrated window drag |
| --- | ---: | ---: | ---: |
| 1440 × 900 | 267.4 ms | 16.2 ms | 16.8 ms |
| 768 × 1024 | 446.7 ms | 16.6 ms | 77.8 ms |
| 390 × 844 | 98.4 ms | 16.6 ms | 22.6 ms |

Each sample measures pointer movement to the first changed SVG path in headless Chromium with software WebGL. Tablet window feedback varied across runs and exceeded its earlier 60.9 ms sample. Physical GPU performance and sustained frame rates remain unmeasured. On a two-fixture collision scene, Node measurements after ten warm-ups gave median/p95 times of 0.025/0.092 ms for focused geometry validation and 0.021/0.061 ms for the full Advisor across 500 executions each. Smart Fix search took 3.758/6.131 ms across 40 executions, excluding browser worker startup and rendering.

P1 can reuse the revision-bound transaction and proposal gate, committed budget and isolated room quote link. Smart Fix uses a bounded search, so it can report no feasible candidate. Clearance coverage depends on the available catalogue data. Mobile evidence covers Chromium touch emulation. End-to-end writes to a live showroom database and physical iOS/Android rendering remain release-environment checks.

### Interaction references reviewed

RoomSketcher's synchronized plan and Live 3D, Fixtuur's dimension-first placement, and Roca's structural layout step informed the decision to extend the current panel and canvas. [RoomSketcher](https://help.roomsketcher.com/hc/en-us/articles/213187689-What-is-Live-3D) · [Fixtuur](https://www.fixtuur.com/resources/how-to-guides/how-to-use-3d-room-planner) · [Roca](https://www.roca.es/configurador-de-banos-3d)

Victorian Plumbing links the measured room to its product summary. ViSoft documents placement in 2D or 3D, and Coohom documents inserting architectural openings. These are interaction references for subsequent slices. [Victorian Plumbing](https://www.victorianplumbing.co.uk/bathroom-ideas-and-inspiration/bathroom-layout-planner) · [ViSoft](https://faq.visoft.de/visoft-premium-2026/) · [Coohom](https://www.coohom.com/helpcenter/floor-plan-design-basics)

<details>
<summary>Archived planning draft · 19 November 2026</summary>

# LivLab Smart Design Studio 2.0 — Audit and Implementation Plan

Status: **for review — no implementation has started.**
Prepared: 19 Nov 2026, on `main` at `4dd4fa2`.

This plan covers three phases:

- **P0 — Smart Design MVP:** real-time collision and clearance visualisation, Smart Fix, Preview / Apply / Undo, and live budget and quote sync.
- **P1 — Premium 3D Experience:** instant style switching, synchronised materials and lighting, first-person walkthrough, and smooth camera transitions.
- **P2 — AI Design Copilot:** Vietnamese requests turned into structured layouts, routed through the existing Gemini Expert, validated deterministically, and applied through Preview / Apply / Undo.

**AR Preview is out of scope for 2.0.** No AR features, AR routes, AR dependencies, USDZ generation or device-specific AR code will be added.

The repository already contains `@google/model-viewer` and an optional `Product.usdzUrl` field, used only by `app/small-bathroom-combo`. Nothing in this plan touches them. The existing GLB / reconstruction pipeline and every 3D model path stay as they are.

---

## 1. Audit — what Room Studio already has

### 1.1 Architecture map

| Layer | Where | What it gives 2.0 |
|---|---|---|
| Page and composition | `app/room-studio/page.tsx`, `RoomStudioClient.tsx` (704 lines) | One client root that wires state, advisor, budget, quote and Expert. All new UI hangs off it. |
| Room state | `lib/room-studio/roomState.ts` | `RoomState` is **plain serialisable data** with **pure operations** (`addProduct`, `updatePlacement`, `setSurfaceStyle`, `setLighting`, `setArchitecture`, …). This is the foundation that makes preview and undo cheap. |
| State hook | `lib/room-studio/useRoomStudio.ts` | `useState<RoomState>` with debounced persistence. There is **one-level undo for starter rooms only** (`beforePresetRef`, `undoStarterRoom`). There is no general history. |
| Persistence | `roomStateRepository.ts` | localStorage behind a repository interface (load / save / clear), tenant-scoped. |
| Placement rules | `placementRules.ts`, `mounting.ts`, `roomGeometry.ts` | Default placement, `clampToRoom`, `fitInRoom` (tries rotations), `footprintsOverlap`, wall and counter heights. These are reusable as the placement solver for Smart Fix and the Copilot. |
| Technical Advisor | `lib/technical-advisor/*` (1,544 lines) | A **deterministic** rule engine with no LLM: `roomBounds`, `placementSurface`, `collision`, `clearance`, `plumbingPoint`, `technicalData`. It has three severities (SUITABLE / OPTIMIZE / VERIFY), provenance, confidence, and `placementIssue` for geometry problems. Thresholds live in `config.ts`; 46 tests pass. |
| Placement status | `placementStatus.ts` | Reduces findings to one status per instance, which colours the 3D outline (green / amber / red). This is partial real-time feedback. |
| 3D scene | `components/room-studio/RoomScene3D.tsx`, `scene/*` | R3F 9 / three 0.184 / drei 10. It has the room shell, procedural surface maps, three lighting presets, `OrbitControls`, an orthographic plan view, an eased re-frame and focus (0.45 s lerp), a drag plane, a GLB cache, `PerformanceMonitor` and two quality tiers. |
| Products | `productAdapter.ts`, `productCapability.ts`, `product3dRegistry.ts`, `reconstructionRegistry.ts` | Capability tiers: VERIFIED_3D / PROTOTYPE_3D / EXACT_DIMENSIONS / NO_DIMENSIONS. Only the first three can be placed. Products carry a normalised category, size, price range, model variants and a quote entry. |
| Budget | `budgetCalculator.ts`, `lib/budget/getBudgetFit.ts`, `BudgetTargetCard.tsx` | A live min / max reference range over placed products, an unpriced count and fit against a target budget. |
| Quote | `lib/context/QuoteContext.tsx` | One basket, de-duplicated per product. Room Studio feeds it with "add to quote" per product and "Lưu thiết kế" for all placed products. Quote items already carry `sourceContext` and `priceSnapshot`. |
| Showroom handoff | `lib/implementation/*`, `components/room-studio/implementation/*` | A serialisable snapshot (room, products, budget, technical findings) sent with an implementation or quote request. |
| Styles | `roomPresets.ts` (STARTER_ROOMS), `materials.ts`, `environment.ts` | Starter rooms bundle size, finishes, lighting, architecture **and products**, and replace the room. Materials are structured as material × colour × finish per surface. Lighting presets are daylight / warm / studio. |
| LivLab Expert | `lib/ai/expert/*`, `app/api/ai/expert/route.ts`, `components/room-studio/expert/*` | Gemini via `@google/genai`, server-only key, JSON `responseSchema`, and **candidates computed deterministically before the model**, so the model can only pick from LivLab's own list. One call per message and a rate limiter. When Gemini is missing or over quota it returns a status message (`not-configured` / `quota` / `unavailable`); it has no rule-based chat fallback. Context already includes room, budget and Technical Advisor findings. Actions: add to room / add to quote / view product. |

### 1.2 Gaps against the 2.0 scope

| Scope item | What exists | What is missing |
|---|---|---|
| Real-time collision visualisation | Outline colour per instance (advisor run deferred via `useDeferredValue`) | Overlap volume highlight; per-frame feedback **during** a drag (today it settles about 250 ms later); a reason label in the scene. |
| Real-time clearance visualisation | `clearance` rule runs only where metadata states a figure. Today that is **2 curated toilets and the reconstructions' heuristic figures**. | A drawn clearance zone in front of each fixture; **clearance data for most products** (see decision D1). |
| Smart Fix | — | A placement search (move / rotate / wall swap), product alternatives (same role, fits, priced), a deterministic ranking, and a UI. |
| Preview / Apply / Undo | Starter-room one-shot undo only | A general history (undo / redo, grouped transactions); a **proposal layer** (preview state rendered as a ghost, never persisted until applied); a diff summary. |
| Live budget and quote sync | Live budget; manual add to quote | A budget delta for proposals; room-sourced quote lines that follow swaps and removals without touching lines added elsewhere (decision D2). |
| Instant style switching | Starter rooms (replace everything, including products) | **Style packs** that change finishes, lighting and architecture only, and keep products and dimensions — instantly, previewable and undoable. |
| Synchronised materials and lighting | Lighting presets and procedural maps are separate choices | Each style pack carries a coherent material, lighting and exposure set; transitions blend rather than pop. |
| First-person walkthrough | — | An eye-height camera, look and move on desktop and touch, collision with walls and products, enter and exit transitions. |
| Smooth camera transitions | An eased re-frame and focus in `RoomCameraControls` | One camera director: named shots (overview, plan, focus, walkthrough entry and exit), the same easing everywhere, reduced motion respected. |
| Copilot (Vietnamese requests to layout) | The Expert recommends products only; actions are add to room / add to quote | A structured **design-plan schema** (operations), a server route, an operation compiler, advisor gating, and preview / apply / undo. |

### 1.3 Constraints carried into every phase

- **The Technical Advisor stays the only judge of fit.** No model output, Smart Fix candidate or Copilot plan is applied without passing it.
- **Unknown stays unknown.** Missing data is reported, never assumed. Heuristic figures are labelled "tham khảo của LivLab" and never presented as a standard or code.
- **Prices are references only.** The showroom confirms the final quote; no fabricated prices, discounts or stock.
- **Nothing is applied silently.** Every automated change goes through Preview, then Apply, and is undoable.
- **Design, product data, quote workflow and tenant isolation are preserved.** The LivLab, Tùng Đăng and Giang Sơn Room Studio catalogues keep working.
- **No new runtime dependency is required** for P0 to P2 (see §6).

---

## 2. Cross-cutting foundations (built first, used by P0, P1 and P2)

### F1 — Room operations (`lib/room-studio/roomOps.ts`, new)

A typed, serialisable description of every change, compiled onto the existing pure operations:

```ts
type RoomOp =
  | { op: 'add'; productId: string; at?: Vec3; wall?: WallId; rotationY?: number; instanceId: string }
  | { op: 'remove'; instanceId: string }
  | { op: 'move'; instanceId: string; position: Vec3; rotationY?: number; wall?: WallId }
  | { op: 'replace'; instanceId: string; productId: string }   // keeps the position where it fits
  | { op: 'surface'; surface: SurfaceId; style: Partial<SurfaceStyle> }
  | { op: 'lighting'; preset: LightingPresetId }
  | { op: 'architecture'; patch: Partial<ArchitectureSettings> }
  | { op: 'dimensions'; dimensions: RoomDimensions };

applyOps(state, ops, resolveProduct): { state; skipped: Array<{ op; reason }> }
```

Smart Fix, style packs and the Copilot all produce `RoomOp[]`. That means one compiler, one validator and one history format.

### F2 — History (`lib/room-studio/roomHistory.ts`, new)

- An undo / redo stack of `RoomState` snapshots. Snapshots are immutable, so entries share structure and cost little.
- **Transactions:** a drag, a Smart Fix apply or a Copilot plan is **one** entry.
- Labelled entries (for example "Áp dụng Smart Fix: dời bồn cầu 20 cm"), so the UI can say what Undo will undo.
- Depth 50, session only. History is not persisted (decision D6).
- The existing starter-room undo becomes an ordinary history entry, so its behaviour is preserved and generalised.
- Keyboard shortcuts: ⌘/Ctrl+Z, ⇧⌘Z / Ctrl+Y. They are ignored while typing in inputs.
- Integration: `useRoomStudio` wraps `setState` in `commit(label, updater)`, and the existing callbacks keep their signatures.

### F3 — Proposals (preview layer) (`lib/room-studio/proposal.ts`, `useProposal.ts`, new)

- A `Proposal` holds `{ id, source: 'SMART_FIX' | 'STYLE' | 'COPILOT', label, ops, preview: RoomState, findings, budgetDelta, diff }`.
- While a proposal is open, the scene renders `preview`:
  - changed products as ghosts (translucent, with an outline in the accent colour);
  - removed products dimmed;
  - moved products with a short dashed path.
- **The saved room is untouched**, and persistence ignores the preview.
- **Apply** commits `ops` as one history entry. **Discard** closes the preview. Both are reachable from the keyboard.
- The Technical Advisor runs on `preview` (pure, local). A proposal whose findings include a new VERIFY-level **geometry** issue (outside the room, collision or unsupported surface) cannot be applied. The UI says why.

### F4 — Validation gate (`lib/technical-advisor/gate.ts`, new)

```ts
compareFindings(before, after) => { resolved, introduced, unchanged, applicable: boolean }
```

- `applicable` is false when `after` introduces a geometry `placementIssue` that `before` did not have.
- Missing-data findings never block. They are shown as "cần kiểm tra".
- The gate is pure and deterministic, and it is shared by Smart Fix, style packs and the Copilot.

---

## 3. P0 — Smart Design MVP

### P0.1 Real-time collision and clearance visualisation

**Design**

- **During a drag:** a lightweight per-frame check for the dragged item only. It is the same AABB maths as the collision and bounds rules, reused from `technical-advisor/geometry.ts`, at O(n) per frame. It sets the outline and overlay state instantly. The full advisor still settles afterwards as it does today.
- **Collision overlay:** the overlap box is drawn as a translucent red volume, and the other product is outlined. A small in-scene label (drei `Html`) gives the short reason, for example "Chồng lên bồn cầu 6 cm".
- **Clearance overlay:** for each product with a clearance figure, a floor rectangle is drawn in front of it (rotated with the product) — amber when intruded on, faint green when clear. The overlay can be shown for the selected product only, or for all products ("Hiện vùng thao tác").
- Overlays are off in plan view by default and toggle on. They obey the existing render-quality tier.

**Data (decision D1)**

- Today most placeable products have **no** clearance figure, so they will show no zone.
- Proposal: a **LivLab reference clearance table by Room Studio category**, in `technical-advisor/config.ts`. For example: bồn cầu front 0.60 m, lavabo front 0.70 m, shower column front 0.80 m, bathtub side 0.70 m.
- Every value is labelled `LIVLAB_RULE` / "tham khảo của LivLab", never a code.
- Product-level metadata keeps priority over the table.
- **The owner must approve the numbers before they ship.**

**Files**

- `scene/CollisionOverlay.tsx` (new), `scene/ClearanceZone.tsx` (new), `lib/technical-advisor/liveCheck.ts` (new).
- Small hooks into `PlacedProductNode.tsx` and `RoomScene3D.tsx`, and one toggle in `CommandBar.tsx` or `TechnicalTab.tsx`.

**Acceptance**

- While dragging, the outline colour and overlap volume update on the same frame.
- At 60 fps on the high tier with 10 products, no frame takes more than 4 ms of check time.
- With metadata or the approved table, each fixture shows its zone. A product without a figure shows none, and the panel says so in one aggregated line, as today.
- Findings in the panel and the colours in the scene never disagree (same source).

**Tests:** `scripts/testLiveCheck.mts` covers live check against engine parity for 200 random placements, rotations of 0 / 90 / 180 / 270°, and touch-but-not-collide tolerances.

### P0.2 Smart Fix (placement and product alternatives)

**Engine** (`lib/smart-fix/*`, new — pure, no React, no LLM)

1. **Trigger.** A finding with a `placementIssue` (COLLISION, OUTSIDE_ROOM, UNSUPPORTED_SURFACE, CLEARANCE) on an instance, or the user pressing "Smart Fix" on a product.
2. **Placement candidates.** Search near the current spot:
   - nudges on a grid (5 / 10 / 20 / 40 cm);
   - rotations of 0 / 90 / 180 / 270°, for floor items only and only where the product allows;
   - the same wall, other walls, or corners for wall items, through `mounting.ts`;
   - "move the other product" when that is cheaper.
   Every candidate goes through `clampToRoom` and `fitInRoom`.
3. **Alternative candidates.** Products in the same Room Studio role (normalised category) that:
   - can be placed (capability is not NO_DIMENSIONS);
   - are smaller in the dimension that conflicts;
   - have a price;
   - respect the target budget when one is set.
   Sorted by closeness to the current product (size, then price), at most 5.
4. **Scoring (deterministic, documented in `smartFixConfig.ts`).**
   - Must pass the gate: no new geometry issues, and the original issue resolved.
   - Then ranked by fewest moved products, smallest move distance, smallest price change, and keeping style coherence (same brand and finish family where possible).
   - Ties are broken by product id, so results are stable across runs.
5. **Output.** Up to three proposals:
   - "Dời vị trí" (move);
   - "Xoay / đổi tường" (rotate or change wall);
   - "Đổi sản phẩm phù hợp" (alternative).
   Each shows its diff, its budget delta and the findings it resolves.

**UI**

- A "Smart Fix" button on `SelectedProductToolbar` and on each actionable `TechnicalFindingRow`.
- Hovering or focusing a proposal opens its preview (F3). Apply and Undo go through F2.
- With no valid proposal, the honest message is: "Chưa tìm được cách sửa tự động — thử đổi kích thước phòng hoặc bỏ bớt sản phẩm."

**Acceptance**

- For every fixture in the scenario test set (see Tests), a resolvable conflict yields at least one proposal, and every proposal passes the gate.
- Proposals never change room dimensions or surfaces, and never add products the user did not have, except as a one-for-one alternative.
- Apply plus Undo restores the exact previous `RoomState` (deep-equal).
- Computing proposals takes under 50 ms for a room of 10 products (desktop high tier).

**Tests**

- `scripts/testSmartFix.mts`: 30+ scenarios — toilet against vanity, shower column off-wall, a basin with no counter, a product outside the room after a resize, and a room too small for any alternative. It checks determinism (same input, same output), gate compliance and the budget-respect rule.

### P0.3 Preview, Apply, Undo

Delivered by F2 and F3, plus:

- A **history UI**: Undo and Redo buttons in `WorkspaceHeader` with a tooltip naming the step; a toast after each apply with "Hoàn tác".
- A **diff summary component** (`ProposalDiff.tsx`): moved, replaced, added and removed items, in plain Vietnamese with distances in cm.
- **Mobile:** the preview sheet sits over the canvas, with Apply and Discard as large touch targets.

**Acceptance**

- Every automated change (Smart Fix, style pack, Copilot) is previewable before it is applied.
- Undo and redo are exact for 50 steps.
- A drag is one undo step.
- Reloading the page restores the last applied room; the preview and history are not restored, by design (D6).

**Tests:** `scripts/testRoomHistory.mts` covers transactions, redo invalidation after a new commit, depth cap, and that starter-room undo still behaves as today.

### P0.4 Live budget and quotation synchronisation

**Budget**

- A proposal shows `before → after` and the delta (with unpriced items counted, never shown as 0).
- `BudgetTargetCard` updates in the same frame as Apply.

**Quote sync (decision D2)**

- Room-sourced quote lines get `sourceContext: 'ROOM_STUDIO'` and a list of `roomInstanceIds`.
- **Mirror mode** (proposed default): while the customer has saved the design to the basket ("Lưu thiết kế"), room-sourced lines follow the room:
  - a replace swaps the line;
  - a remove decreases its quantity;
  - an add appears as a new room line.
  A banner says "Giỏ báo giá đang đồng bộ với thiết kế".
- Lines added from product pages or elsewhere are **never** changed by the room.
- The alternative is **explicit mode**: after a change, show "Cập nhật giỏ báo giá?" and update only on confirmation.

**Files:** `lib/context/QuoteContext.tsx` (additive: provenance fields and a `syncRoomLines(lines)` method), `lib/room-studio/quoteSync.ts` (new, pure diffing), `RoomStudioClient.tsx`.

**Acceptance**

- After Smart Fix replaces product A with B in a synced room, the basket shows B instead of A with the right quantity.
- Manually added lines are unchanged.
- The handoff package (`buildHandoffPackage`) reflects the applied room only.

**Tests:** `scripts/testQuoteSync.mts` covers the add / replace / remove matrix, mixed manual and room lines, quantity merging for duplicate SKUs, and idempotency.

---

## 4. P1 — Premium 3D Experience

### P1.1 Instant bathroom style switching

**Style packs** (`lib/room-studio/stylePacks.ts`, new): `{ id, name, description, surfaces, lighting, architecture, exposure }`, with **no products and no dimensions**.

- They derive from the existing starter-room looks: Đá ấm, Trắng tối giản, Khách sạn hiện đại, and up to three more for the owner to approve (D5).
- Applying a pack is a `RoomOp[]` (`surface`, `lighting`, `architecture`) that goes through Preview, Apply and Undo.
- **Instant:** procedural surface textures for every pack are pre-generated on idle (`requestIdleCallback`), so switching does not rebuild canvases on click.
- The picker is a horizontal strip of thumbnails with a hover / focus preview.
- Starter rooms stay as they are. Packs are a separate, non-destructive control.

**Acceptance:** switching takes under 100 ms to the first changed frame on the high tier with no texture flash; products and dimensions are untouched; one undo step per switch.

### P1.2 Synchronised materials and lighting

- Each pack carries a lighting preset, plus a tone-mapping exposure and an environment intensity tuned with its materials. For example, warm stone gets warm light and slightly lower exposure.
- On switch, light colour, intensity and exposure **interpolate over about 400 ms** instead of popping (in `SceneLighting.tsx`). Reduced motion makes the change instant.
- Material roughness and finish per pack go through the existing `SurfaceStyle` (material × colour × finish). No new material system is introduced.
- **Optional:** a small local HDR environment (under 300 KB) for reflections on gloss finishes, loaded by `drei <Environment files=…>` from `/public`, never a remote preset. This needs owner approval for payload size (D7).

**Acceptance:** for each pack, the floor, walls and sanitaryware render without blown highlights or crushed shadows (QA screenshots per pack, both tiers); the transition shows no visible stepping.

### P1.3 First-person walkthrough

**Mode** (`scene/WalkthroughControls.tsx`, new): the camera sits at eye height (1.60 m, adjustable from 1.45 to 1.75 m) inside the room.

- **Desktop:** drag to look (no pointer lock by default, so the cursor stays available); WASD / arrow keys to walk; Shift to walk slower; Esc to exit.
- **Touch:** one-finger drag to look; an on-screen joystick to walk (bottom left, 44 px+ targets).
- **Collision:** the camera is kept 0.25 m from walls and clamped against product AABBs (reusing `geometry.ts`), so the user cannot walk through fixtures. No physics engine is needed.
- **Entry:** from the overview, the camera flies to the door side of the room and lowers to eye height (P1.4). **Exit:** it returns to the previous orbit shot.
- Product selection is disabled while walking, to avoid accidental drags. A hint bar lists the controls.
- Render quality: the same tier. Shadows and contact shadows stay; the far plane is tightened to the room.

**Acceptance**

- 60 fps on the high tier and at least 30 fps on the low tier in a 3 × 2 m room with 6 products.
- The user can never leave the room or enter a fixture's footprint.
- Exit returns to the exact previous orbit target and distance.
- Keyboard-only use works: enter, walk, look with Q / E or the arrow keys, exit.

**Tests:** `scripts/testWalkthroughBounds.mts` covers the movement clamp against walls and footprints for random paths and rotated products.

### P1.4 Smooth camera transitions

- A **camera director** (`scene/cameraDirector.ts` plus integration in `RoomCameraControls.tsx`) owns every move: overview, plan, focus on product, walkthrough enter and exit, and "fit to proposal" when a preview opens.
- Easing: one curve (ease-in-out cubic). Durations scale with distance (0.35–0.8 s). Moves are interruptible: user input cancels the tween.
- The perspective-to-plan transition cross-fades the camera rather than jumping.
- Reduced motion makes every move a cut.

**Acceptance:** no jumps; user input during a move takes over immediately; the same easing everywhere; the existing reset, focus and plan behaviours keep working.

---

## 5. P2 — AI Design Copilot

### P2.1 Flow

```
User (Vietnamese) ──► /api/ai/copilot (server)
   1. Deterministic context: room, placed products, budget, findings,
      style packs, and candidates per role that FIT this room and budget
      (reusing expertTools + placementRules + the Smart Fix alternatives logic)
   2. Gemini (existing provider, JSON responseSchema) returns a DesignPlan:
      { summary, ops: [ {op:'add', role, candidateId, zone}, {op:'replace', instanceId, candidateId},
        {op:'move', instanceId, zone}, {op:'style', packId}, {op:'remove', instanceId} ],
        questions?: [...] }    // every id must come from the candidate list
   3. Server re-validates ids against candidates; drops anything else
──► Client
   4. Plan compiler: zones ("cạnh cửa sổ", "tường sau", "góc phải") → coordinates
      through placementRules (deterministic), giving RoomOp[]
   5. applyOps on a copy → Technical Advisor → gate (F4)
   6. If the gate fails: Smart Fix tries to repair (bounded); if still failing,
      show the plan as "cần chỉnh" with the blocking findings, Apply disabled
   7. Preview (F3) → Apply (one history entry) / Discard → Undo
```

### P2.2 Key design choices

- **The model never sets coordinates or prices.**
  - It chooses roles, candidate ids, zones from a fixed vocabulary, and style packs.
  - Geometry comes from LivLab's placement rules, and fit comes from the Technical Advisor.
  - This is the same principle as today's Expert, where candidates come before the model.
- **One Gemini call per request.** The existing rate limiter and the `not-configured`, `quota` and `unavailable` statuses are reused.
- **Fallback.** Without Gemini, a rule-based parser handles a fixed set of intents ("đổi phong cách …", "thêm bồn tắm", "giảm ngân sách xuống … triệu", "dời bồn cầu sang trái") and says plainly when it cannot.
- **Integration with the Expert.** The Copilot is a mode in the existing Expert panel ("Thiết kế giúp tôi"). It shares:
  - the composer, message list and nudges;
  - the provider, rate limiter, catalogue loader and system-prompt conventions.
- **Vietnamese first.**
  - The schema descriptions and zone vocabulary are in Vietnamese.
  - Replies are short; any figure cites its source (catalogue, room geometry or LivLab reference).
- **Privacy.** The model receives only the room snapshot and product facts — no contact data. Requests are not stored beyond the existing analytics events (`analytics` hooks, no new PII).

### P2.3 Files

- `app/api/ai/copilot/route.ts` (new): Node runtime, the existing rate limiter, the same `GEMINI_API_KEY` and model.
- `lib/ai/copilot/designPlanSchema.ts`, `copilotContext.ts`, `copilotService.ts`, `ruleBasedCopilot.ts` (new).
- `lib/room-studio/planCompiler.ts`, `zones.ts` (new).
- `components/room-studio/expert/CopilotPlanCard.tsx` (new). Small changes to `LivLabExpertPanel.tsx` and `useLivLabExpert.ts`.

### P2.4 Acceptance

Test set: 20 Vietnamese prompts, including style, add, replace, move, budget, impossible and ambiguous requests.

- Every returned plan contains only catalogue ids from the candidate list.
- No plan is applied without Preview.
- No applied plan introduces a geometry VERIFY finding.
- Ambiguous requests produce a clarifying question instead of a guess.
- Impossible requests (a bathtub in a 1.6 m² room) produce an honest refusal with the reason.
- With Gemini disabled, the rule-based intents still work and others get "chưa hỗ trợ".
- p95 latency for one request is under 6 s on the configured model; the UI shows progress and the request can be cancelled.

**Tests**

- `scripts/testCopilotPlan.mts`: schema validation, id whitelisting, zone compiler determinism, the gate, and the Smart Fix repair path.
- The model call is mocked with recorded fixtures, so the test is offline and deterministic.
- An optional live smoke test (`COPILOT_LIVE=1`) runs the 20 prompts against Gemini and reports, never asserts on wording.

---

## 6. Dependencies, performance and security

- **New runtime dependencies: none required.**
  - R3F / drei already provide `Html`, `Environment`, `KeyboardControls` and `PointerLockControls` (if ever wanted).
  - `@google/genai` is already in place.
  - `zod` is not installed. Plan validation will use hand-written guards, as `expertContext.ts` already does, rather than adding it. Adding it is an option if the team prefers (D8).
- **No AR / XR packages.** `@google/model-viewer` stays as it is and unused by Room Studio.
- **Performance budgets**
  - Advisor full run under 2 ms for 10 products.
  - Live check under 4 ms per frame.
  - Smart Fix under 50 ms.
  - Style switch first frame under 100 ms.
  - Walkthrough 60 / 30 fps (high / low tier).
  - Copilot UI shows progress within 100 ms.
- **Bundle:** new 3D overlays and the walkthrough are lazy-loaded inside the Room Studio route only. The storefront homepage is unaffected.
- **Security:** the Gemini key stays server-only (the existing guard throws on client import); the Copilot route reuses the rate limit; inputs are length-capped; output is re-validated server-side and client-side.

---

## 7. Test and QA strategy

- **Unit and scenario tests** follow the repository's convention: `scripts/test*.mts` check-scripts run with `tsx`, plus `npm run test:*` entries.
  - New: `testLiveCheck`, `testSmartFix`, `testRoomHistory`, `testQuoteSync`, `testStylePacks`, `testWalkthroughBounds`, `testCopilotPlan`.
  - The existing suites must stay green: `testTechnicalAdvisor` (46), `testRoomStudioCapability`, `testInaxReconstructions`, `testConceptLibrary`, `testTenantSeo`, `testShowroomMedia`, `testShowroomV3`.
- **Browser QA:** scripted headless runs, the same approach used for the homepage work, at 1536×960, 1440×900, 768×1024 and 390×844.
  - Flows: drag into collision, Smart Fix preview, apply, undo; style switch; walkthrough enter, walk, exit; Copilot plan preview and apply.
  - Each flow produces screenshots and console-error checks.
- **Tenant regression:** LivLab, Tùng Đăng (`/s/tungdang`) and Giang Sơn Room Studio each load, place a product, run the advisor and add to quote.
- **Release gate per phase:**
  - type-check, lint (changed files) and production build all pass;
  - all suites green;
  - the QA screenshots are reviewed by the owner;
  - no change outside the Room Studio route and its libraries, except the additive `QuoteContext` fields.

---

## 8. Decisions needed before implementation

| # | Decision | Recommendation |
|---|---|---|
| D1 | Clearance figures for products without metadata | Approve a **LivLab reference table by category**, labelled "tham khảo của LivLab"; product metadata wins. Without it, clearance zones appear on only a handful of products. |
| D2 | Quote sync policy | **Mirror mode** for room-sourced lines after "Lưu thiết kế"; never touch other lines. |
| D3 | Smart Fix scope | Placement plus same-role alternatives only. It never resizes the room or adds new product types. |
| D4 | Walkthrough on phones | Ship on desktop and tablet in P1; phones get it if the low tier holds 30 fps in QA, otherwise later. |
| D5 | Style packs | Start with the three existing looks, and the owner picks up to three more. |
| D6 | History persistence | Session-only undo / redo; the applied room persists as today. |
| D7 | HDR environment map | Optional; only a local file of 300 KB or less, if the owner accepts the payload. |
| D8 | Schema validation library | Keep hand-written guards (no new dependency) unless the team prefers `zod`. |
| D9 | Copilot without Gemini | A rule-based subset plus an honest "chưa hỗ trợ"; no silent degradation. |

---

## 9. Sequencing

| Order | Work | Size | Depends on |
|---|---|---|---|
| 1 | F1 room operations, F2 history, F4 gate | M | — |
| 2 | F3 proposals plus ghost rendering in the scene | M | 1 |
| 3 | P0.1 live check, collision overlay, clearance zones (needs D1) | M | — |
| 4 | P0.2 Smart Fix engine and UI | L | 1–3 |
| 5 | P0.4 budget delta and quote sync (needs D2) | M | 1–2 |
| — | **P0 review and release gate** | | |
| 6 | P1.4 camera director | M | — |
| 7 | P1.1 / P1.2 style packs and synchronised lighting | M | 1–2, 6 |
| 8 | P1.3 walkthrough | L | 6 |
| — | **P1 review and release gate** | | |
| 9 | P2 schema, context, server route and fallback | M | 1–4 |
| 10 | P2 plan compiler, zones, gate and repair, plan card UI | L | 9 |
| — | **P2 review and release gate** | | |

Steps 3 and 6 can run in parallel with 1–2 because they touch different files. Everything else follows the dependencies above.

---

## 10. Non-goals for 2.0

- AR Preview, USDZ generation, WebXR, Quick Look, or any device-specific AR path.
- Changes to the storefront homepage, product data, catalogue import or the showroom dashboard.
- Server-side room storage (localStorage remains, behind the existing repository).
- Physics simulation, photoreal path tracing, or any claim of building-code compliance.

</details>
