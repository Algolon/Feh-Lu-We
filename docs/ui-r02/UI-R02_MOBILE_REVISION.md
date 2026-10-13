# UI-R02 — Mobile navigation and beige-gold controls

The owner's latest feedback is implemented: left categories in mobile landscape; portrait category-to-page/back navigation; bottom-right sprint and equipped-item controls; a marked objective beside Hint; and beige-gold UI colors. The notebook stays bounded over the real game. The visible conversation image informed the direction; unavailable attachment `image-gen-1(6).png` was not read.

## Behavior and scope

- Mobile landscape keeps a 160px category column beside the independently scrolling page. Names and actual counts wrap without abbreviations.
- Portrait opens the category index. Choosing Draden, Aanwijzingen or Herinneringen opens a full-width reading pane and hides the index. The sticky Categorieën button returns to the index and restores focus. Rotation retains the selected content and adapts the layout. Map discovery filters and back navigation are preserved.
- The real objective follows Hint with a diamond marker and compact translucent backing. The home packing checklist flows beneath it. HUD controls, lines, reticle and movement cue use beige-gold/ink colors; original item pictures and puzzle symbols retain their colors.
- The mobile sprint toggle works with a second thumb while the joystick is held, feeds the existing running speed, and does not move the player by itself. It resets on overlays, blur, hide and resize. Shift and analogue joystick running remain available.
- The persistent item button opens the original inventory with empty hands. A selected item shows its original picture and keeps tap-to-deselect behavior. One selected item, one contextual action and one focused overlay are retained.

No puzzle rule, save/progression behavior, world, geometry or lighting change is included. Inventory, pause/settings and puzzle interfaces are not redesigned. Draden's existing guidance and observation-only clue/memory filters remain intact; no reference example counts or completions are inserted.

## Current validation

| Check | Current result |
| --- | --- |
| TypeScript | Pass |
| Unit tests | 267 / 267 pass |
| Production build | Pass; existing chunk-size warning |
| UI browser matrix | [121 / 121 pass](evidence/mobile/ui-results.json) |
| Existing gameplay / save / touch regressions | [34 / 34 pass](evidence/mobile/regression-results.json) |
| DEV-01 mobile / hints regressions | [7 / 7 pass](evidence/mobile/dev01-results.json) |

38 fresh actual browser captures were generated. The review includes 16 unaltered JPGs (1,213,581 bytes; 1.16 MiB), with hashes and viewport provenance. See the [current screenshot gallery](README.md) and [image manifest](evidence/mobile/images.json).

The matrix covers 852 × 393 and 640 × 360 touch landscape, 1440 × 900 desktop, and 393 × 852 touch portrait. It checks two-finger sprint input, reset/no autonomous movement, empty/selected item actions, objective placement, category/page/back flow, sticky back visibility after scrolling, rotation and focus, 48px targets, overflow, safe-area simulation, observation filters and keyboard/escape/map paths.

Existing game regression assertions are unchanged. Earlier 103-check full-matrix and top-tab book results are historical; the table reports suites rerun for this exact mobile revision. Early development corrected the finger-release fixture, removed overflowing open-card margins, and restored focus when rotation hides the focused control.

## Interruption recovery and source identity

Workspace maintenance removed the checkout, untracked review documents, temporary captures, and the last pending test-run outputs after the Work usage-limit interruption. No surviving preview/test harness was found. PR #16 and its prior evidence were preserved.

The saved GitHub implementation checkpoint `3fa06f254016856ff7b8b46b61dc396ba5ee1c0b` was recovered. The final rotation fixes were restored and the complete Git tree verified identical to the former local checkpoint `eb50e8eefaa0f09e5d8ee4bce381b85eff535599`: `fcf287fdd0fb3f8ab3fd857ca76ee511f6f9e535`. Recovered implementation commit `18c78489c682f11dad0080d0ea9002e89c40f231` is now saved on the same UI feature branch. No completed implementation was duplicated, new feature branch created, or prior work overwritten.

The missing final-run results were not assumed successful. The current build, all listed checks and captures were regenerated from that recovered source. Hashes and publication identity are in [build provenance](evidence/mobile/build-provenance.json).

Production baseline remains `ccr-75ef4113-kfkimm` at `ae2a036e783400355c8d137f24e16c33bb1a8323`. Node 24.19 and locked dependencies were used. Chromium headless shell 1194 renders actual Three.js WebGL via SwiftShader; software 2D composition avoids the sandbox's earlier capture-layer artifact. No screenshot pixels or production renderer were edited.

```sh
npm ci
npm test
npm run typecheck
npm run build
E2E_OUT=scripts/out/ui-r02-mobile-final npm run e2e:ui-r02
E2E_ONLY=regressions,walkthrough,saveChecks,touchChecks E2E_OUT=scripts/out/ui-r02-mobile-regression node scripts/with-preview.mjs e2e.mjs
DEV01_ONLY=mobile,hints E2E_OUT=scripts/out/ui-r02-mobile-dev01 node scripts/with-preview.mjs e2e-dev01.mjs
```

The default UI run covers all four profiles. `UI_R02_ONLY` is an optional development filter and is not used for the final run. Browser touch events exercise the two-finger controls; a dispatched blur is a lifecycle fixture. Rotation resizes the same portrait session. Existing camera placement, isolated review state, dusk forcing and screenshot-only extended toast hold retain the [documented fixture boundaries](UI-R02_QA_REPORT.md#browser-matrix); they are not a claimed walkthrough. The separate gameplay suite exercises the tutorial-to-finale route; its [70-step trace](evidence/mobile/walkthrough-steps.txt) is included.

## Changed files and remaining review

- `src/ui/ui.ts`: category flow, back/focus handling, marked objective, persistent item and multi-pointer sprint control.
- `src/ui/woodland.css`, `src/ui/icons.ts`: shared palette, silhouettes, marker/run/back glyphs and responsive layout.
- `src/player/input.ts`: temporary shortcut feeding the existing run amount and lifecycle reset; movement speed model is unchanged.
- `src/core/game.ts`: two startup HUD/input wiring lines. ENV-L01 #15 edits a distinct update-loop hunk near line 683; no hunk overlap was found.
- `scripts/e2e-ui-r02.mjs`: meaningful new-control/navigation checks and actual captures.
- `docs/ui-r02/`: current review, QA, provenance and screenshots; historical evidence retained.

Calculated token contrast: HUD text over white through the 88% backing 9.51:1; objective text at its 70% edge 5.02:1; beige-gold icons on HUD backing 7.80:1; notebook ink/paper 11.60:1; secondary ink/darker page edge 4.77:1; active-tab text/beige-gold 7.47:1. These are token calculations, not physical-display measurements.

Long evidence/threads still require scrolling in compact landscape. Physical Android/iPhone font, display and thumb-comfort review remains pending. Draft PR for visual approval; production is unchanged. Expansion to other interfaces remains gated by review.
