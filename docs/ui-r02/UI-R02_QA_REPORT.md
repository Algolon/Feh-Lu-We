# UI-R02 — QA report

**Historical first-pilot results.** The owner's bound-notebook/copper-icon revision is now the current implementation. See [current revision QA and screenshots](UI-R02_BOOK_REVISION.md). The counts, tokens and implementation hashes below describe the earlier editorial version; they are not a claim that its full E2E matrix was rerun for the revision.

The bounded HUD/notebook pilot passes **85/85 focused UI browser checks**, **103/103 existing full-game E2E checks**, **267 unit tests**, typecheck and production build. The 70-step tutorial-to-finale route passes. Owner visual approval and direct comparison with the missing latest references remain open.

## Tested source and evidence provenance

- Production base: `ae2a036e783400355c8d137f24e16c33bb1a8323` on `ccr-75ef4113-kfkimm`, reverified unchanged before publication.
- Tested local implementation commit: `db389275f151d201bd62491ddc7d078b41ba42b3`.
- Published implementation commit: `a4aa4a77c9956e9804f2919fbe8119d335dc3fe8`.
- Their complete implementation trees are **identical**, SHA `ecf5e01c784e8f3c193408018f55366faba75769`. Publication used GitHub's Git-data API because shell push lacked authentication. No production ref was moved.
- Frozen JS/CSS build fingerprints and runtime source hashes are in [build-provenance.json](evidence/build-provenance.json); they were checked unchanged after the complete game regression. Subsequent commits add review documentation/evidence only. The local game's build label names the local implementation commit; this is not a different UI implementation.
- Three clean baseline captures came from a separate checkout of production. The final pilot matrix produced **35 real game screenshots**. [Capture metadata](evidence/captures.json) records viewport, pose, actual dusk, modal, target, recorded clues and image SHA-256.
- Eight review images (~1.96 MiB) provide compact evidence. Two are unaltered primary screenshots; the sheets add captions and arrange original captures at native size with JPEG re-encoding. [sheets.json](evidence/sheets.json) identifies every tile and source hash. Raw intermediate screenshots remain outside normal Git history and can be reproduced with the harness.

Node 24.19, repository-locked dependencies and Chromium headless shell revision 1194 with SwiftShader were used. Standard Chromium failed its preflight at `process_singleton_posix.cc:292`, `socket() failed: Operation not permitted (1)`. Headless shell succeeded. A Vite preview server and browser harness ran in the same process environment on localhost; all listed browser tests executed. No escalation or production deployment was used.

## Browser matrix

| Viewport | Checks and evidence |
| --- | --- |
| 852 × 393, touch landscape | BOSLUST exploration; notebook at the same pose; evidence, empty memories, discovered memory, map/back; real contextual action; selected item and toast; dark/bright backgrounds; simulated asymmetric safe areas |
| 640 × 360, touch landscape | Same exploration/notebook/action coverage; real tutorial coaching/checklist layout fixture |
| 1440 × 900, desktop | Same scene/overlays; notebook arrow/Home/End/Space navigation, focus wrapping, N/I/H/Escape paths; original inventory/pause/hint routes |
| 393 × 852, touch portrait | Fallback exploration, stacked notebook navigation, evidence scroll and interaction coverage |

Every active button and notebook summary in the focused UI-R02 matrix has a minimum 48px hit area. The tested layouts fit their viewport with no horizontal overflow. Long notebook content remains independently scrollable; the index and close control remain accessible. Background HUD controls become inert while one dialog owns focus, and world input resumes after close. Live action feedback is deliberately outside the inert background control groups.

The focused harness verifies that rendered evidence IDs are recorded IDs and that browsing changes no progression state. Real-time statistics and periodic pose saves are excluded from this assertion because they already run while reading; the existing F07 test independently verifies reading time versus paused time. Empty memories create no hidden-entry checklist. A real lake-bench inspection yields its memory with no solved badge. The existing map hides undiscovered basement/underground levels and keeps unknown landmarks as question marks.

**Fixture boundaries:** screenshot cameras are deliberately placed for repeatable views; this is not evidence of walking to those poses. BOSLUST uses the game's existing isolated review state. Dark-background capture initializes the existing dusk value to .95; the recorded captured value is in the metadata. Tutorial learned-look/movement flags are a layout fixture. The actual item-selection toast is extended to 12 seconds only during screenshot capture, because software rendering can outlast the original 3.6-second message. Production message content and timing are unchanged. The separate full E2E route walks and acts through the existing gameplay paths without these screenshot fixtures.

## Regression and build results

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 22 files, 267 tests pass |
| `npm run build` | Pass; existing >1200 kB chunk warning remains |
| `npm run e2e:ui-r02` | 85/85 pass; 35 screenshots; no browser/asset errors |
| Existing `scripts/e2e.mjs` via preview wrapper | 103/103 pass; full 70-step tutorial → finale; save/migration/backup/restore, touch, overlay, lighting, collision, review isolation and rendering checks pass |
| Existing DEV-01 mobile/hints suites | 7/7 pass; existing experimental notebook, mobile overlays and optional hints remain compatible |
| `git diff --check` | Pass |
| Runtime source / build fingerprint check | Pass; no source/bundle changes during final validation |

[Focused UI results](evidence/ui-results.json) · [Full game results](evidence/regression-results.json) · [Renderer counters](evidence/render-metrics.json)

No existing regression assertion was changed to obtain these results. Earlier development passes exposed a too-broad whole-state comparison in the new UI harness; it was corrected to test progression rather than expected elapsed-time updates. The actual source changes were validated again after the tutorial message/checklist flow fix.

## Readability and mobile feasibility

The screenshot review supports a smaller HUD footprint, explicit action labeling, restrained selected-item feedback and a more coherent notebook hierarchy. In compact landscape, long content requires scrolling; the side index has its own scroll when needed. This pilot prioritizes readable real evidence rather than adding unowned illustrations or speculative associations from the concept sheet.

Calculated sRGB token contrast ratios:

| Combination | Ratio |
| --- | --- |
| HUD text on 88%-opaque charcoal over a pure white environment | 10.28:1 |
| Notebook ink on paper | 11.09:1 |
| Secondary notebook ink on paper | 4.89:1 |
| Selected-tab pale text on forest | 10.45:1 |

These are design-token calculations, not a screen-reader audit or a physical-display measurement. Focus outlines, keyboard tab state, native details controls, inert background controls, preserved status messages and reduced motion are implemented and exercised where described above.

The existing render check sampled nine normal game views. Low quality measured **30–132 draw calls**, at most **237,879 triangles**; BOSLUST cut measured **87 / 217,412**. High quality measured **41–161 calls**, at most **391,046 triangles**. All sampled assertions pass. No world mesh, light, material, postprocess or draw-call path was added. These counters are not FPS, thermals, overdraw or an estate-wide physical-phone guarantee.

Build payload change versus the clean production build: CSS 17.13 → 25.93 kB (gzip 4.63 → 6.46 kB); JS 1,348.58 → 1,351.65 kB (gzip 417.69 → 418.82 kB). No new dependency, downloaded font or texture.

## Remaining review gates

1. Owner visual review of quietness, editorial hierarchy, paper treatment, chrome icons and notebook size.
2. Re-upload the unavailable five references and compare the latest BOSLUST W2 concepts/original scene directly. The pilot used the earlier recovered W2 references; final concept fidelity is not claimed.
3. Physical Android/iPhone check of font fallback, display contrast, touch comfort, native browser chrome/safe areas and portrait/landscape transitions. Simulated asymmetric insets were tested; a physical notch was not.
4. Coordinate with ENV-L01/DEV-04D before integration. Their current open PR changed-file lists do not overlap this UI runtime scope; repeat contrast captures after future lighting integration.

The pre-existing Draden next-step guidance remains an explicit content constraint. Inventory, pause/settings and puzzle interface redesign stays deferred. No merge or production deployment.

## Reproduce

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run e2e:ui-r02
E2E_OUT=scripts/out/ui-r02-regression node scripts/with-preview.mjs e2e.mjs
DEV01_ONLY=mobile,hints E2E_OUT=scripts/out/ui-r02-dev01 node scripts/with-preview.mjs e2e-dev01.mjs
```

Set `CHROME=/path/to/installed/chrome` when necessary. The wrapper starts the preview server, selects the available local headless shell (or Playwright's normal executable path) and supplies the base URL to the unchanged existing harnesses. To reproduce baseline images, copy `ui-r02-baseline.mjs` and `with-preview.mjs` into a clean production checkout, build it and run `node scripts/with-preview.mjs ui-r02-baseline.mjs`. Evidence sheet packaging uses Pillow: `python3 scripts/ui-r02-sheets.py BASELINE_CAPTURE_DIR`.

For manual normal-game review: `npm run dev`, start/continue a game, use N or notebook access. The existing `?review=boslust` route offers temporary sandbox progress for inspection; its developer comparison toolbar is removed only by the capture harness. No new review/save namespace was introduced by this UI pilot.
