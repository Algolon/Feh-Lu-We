# UI-R02 — Bound notebook revision

The owner requested a more notebook-like panel, a visible world margin and copper/gold icons, based on the notebook image displayed in the conversation. This revision implements that direction in the real game, on the existing dedicated UI feature branch.

## Result and scope

- A bounded green cover, layered paper edge, light binding marks, warm page, leaf masthead and gold active tab replace the initial editorial side index. The world remains visible around the notebook.
- Draden, Aanwijzingen, Herinneringen and the existing Kaart route remain available. Counts and completion badges come from real game state, not the reference's examples. Long evidence and threads scroll within the page; navigation and close stay visible.
- HUD icons are gold, notebook icons copper, with a darker copper active-tab icon for contrast. Full-color illustrated item icons and puzzle symbols are preserved.
- Desktop arrow/Home/End/Space navigation, touch targets, Escape/back, focus containment, one focused overlay, one contextual action and one selected item retain their existing behavior.
- No world, lighting, level geometry, puzzle logic, content, input or save-state file was changed. Inventory, pause/settings and puzzle interfaces have not been expanded.

Runtime revision: `src/ui/ui.ts`, `src/ui/icons.ts`, `src/ui/woodland.css`. QA revision: `scripts/e2e-ui-r02.mjs`; report and real screenshot evidence under this directory. The new checks verify visible world margins, containment and warm metal icon colors; the existing state/navigation checks remain intact.

## Validation

| Check | Current result |
| --- | --- |
| Typecheck / production build | Pass; existing chunk-size warning |
| Unit tests | 267/267 pass |
| Focused UI-R02 matrix | 93/93 pass; 35 actual screenshots |
| Existing regression / walkthrough / save / touch suites | 34/34 pass, including the 70-step tutorial-to-finale route |
| Existing DEV-01 mobile / hints compatibility | 7/7 pass |
| Source / build fingerprint and whitespace checks | Pass |

The current focused browser run captures 35 real game screenshots at 852 × 393 and 640 × 360 touch landscape, 1440 × 900 desktop and 393 × 852 touch portrait. The screenshots include BOSLUST exploration/notebook at the same camera, contextual interaction, actual selected-item feedback, recorded evidence, memories, map/back, bright/dark backgrounds and asymmetric safe-area simulation. All tested button/summary targets are at least 48px and layouts have no horizontal overflow.

| Viewport | Actual book bounds | Minimum side margin | Top/bottom margin |
| --- | --- | --- | --- |
| 852 × 393 | 745 × 303 | 53px | 45px |
| 640 × 360 | 579 × 276 | 30px | 42px |
| 1440 × 900 | 1000 × 700 | 220px | 100px |
| 393 × 852 | 339 × 679 | 27px | 87px |

The existing full 103-check E2E matrix passed for the earlier editorial implementation; those results are historical and are not counted as a rerun of every suite for this revision. The current revision reruns the existing regression, walkthrough, save and touch suites, plus DEV-01 mobile/hints compatibility. No existing regression assertion was weakened.

## Reproduction and source identity

```sh
npm ci
npm test
npm run typecheck
npm run build
E2E_OUT=scripts/out/ui-r02-book npm run e2e:ui-r02
E2E_ONLY=regressions,walkthrough,saveChecks,touchChecks E2E_OUT=scripts/out/ui-r02-book-regression node scripts/with-preview.mjs e2e.mjs
DEV01_ONLY=mobile,hints E2E_OUT=scripts/out/ui-r02-book-dev01 node scripts/with-preview.mjs e2e-dev01.mjs
```

Production `ccr-75ef4113-kfkimm` was reverified at `ae2a036e783400355c8d137f24e16c33bb1a8323`. Locally tested implementation commit: `a91453a07f186c2d28000ec09d111c4bc8aafa03`. The published implementation tree must match local tree `dcb14e4299983113d2838757cea9ad8029a79b00`; exact source/build hashes and publication identity are in [build provenance](evidence/book/build-provenance.json). Documentation/evidence commits change no runtime source or tested bundle.

Node 24.19, locked dependencies and Chromium headless shell 1194 are used. Three.js still renders the actual WebGL scene with SwiftShader. This sandbox's GPU compositor repeated 2D layers outside their DOM bounds; the focused capture harness now uses software 2D composition to avoid that renderer artifact. No screenshot pixels or production renderer code were edited. Software-renderer timings are not phone performance measurements.

Screenshot camera placement, forced dusk phase and extended screenshot-only toast hold retain the [documented fixture boundaries](UI-R02_QA_REPORT.md#browser-matrix). The walkthrough suite separately exercises real game progression. Sparse checkout initially omitted atlas/reference test inputs; restoring the tracked files allowed all unit tests to execute. There is no unresolved test failure from those missing local inputs.

## Readability and review gate

Calculated sRGB token contrast: main ink/paper 11.60:1, secondary ink/darker paper edge 4.77:1, copper icon/darker edge 4.35:1, active-tab text/gold 6.70:1 and active-tab icon/gold 3.93:1. Secondary ink was darkened during QA. These calculations support the token choices; they are not a physical-display or screen-reader audit.

Short landscape viewports show fewer thread rows and require scrolling; the readable text and persistent controls take priority. Production Draden's existing next-step guidance is retained. Undiscovered evidence and memories are not added, and the reference's completed threads are not fabricated.

The current ENV-L01 #15 and craft #9 changed-file lists were rechecked; neither overlaps the revision's three runtime files. Recheck contrast after integrating future environment lighting changes.

Physical Android/iPhone font appearance, display contrast and thumb comfort remain to be reviewed. The original HUD-free BOSLUST attachment remains unavailable for direct source-image comparison; the implementation uses the verified production scene. Owner visual approval is required before expanding the overhaul or merging. No production ref or deployment is changed.
