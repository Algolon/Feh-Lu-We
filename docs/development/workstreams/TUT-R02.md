# TUT-R02 — complete home-scene asset quality pass

- Branch: `tut-r02-home-scene`
- Base: current production `5ca306da6a32f33b4c93c90ace3556e2787c67d4` (TUT-R01 + PB01 merged).
- Scope: the remaining weak asset families throughout the home/tutorial scene, with the owner-supplied entrance screenshot as the primary defect evidence.
- State: IMPLEMENTED AND VALIDATED — prepared for draft PR and owner visual review.
- Gate: owner visual review before a new production merge/deployment.

## Current implementation

- Turned timber coat stand, supported pegs, visible hangers and two fully shaped coats (body, shoulders, sleeves, collar, cuffs, pockets, buttons).
- Boot pair with tapered/rounded outsole footprint, leather upper/ankle shaft, padded collar, recessed opening, tongue, eyelets, laces and pull tab.
- Both home lamps have built bases/bodies/stems, shade rims/harps/finials and pleated shades that follow existing on/off state.
- A printed, bound calendar illustrates the existing `mem.home.calendar` text without inventing a date/code.
- A dish/handle candle holder, shaped wax top and drips; existing wick/flame position and lighting behavior retained.
- Individual shaped houseplant leaves on visible stems, replacing use of outdoor shrub crown chunks in the two home pots.
- Home ceiling beams have softened edges; one instanced neutral contact-occlusion layer grounds room furniture and entrance props.
- R01 table items, key, cabinet and art remain present.

## Asset review of the entire scene

| Family | Decision and reason |
| --- | --- |
| Kapstok / jassen / schoenen | Rebuilt: original models were a bare pole and rectangular blocks; neither use nor material read. |
| Kalender | Rebuilt: blank card replaced with a physical printed planning page and existing memory wording. |
| Kaars | Rebuilt: readable holder, wax and top; flame alignment unchanged. |
| Tafel- en vloerlamp | Rebuilt locally: original cylinders/poles/shades lacked assembled construction. |
| Kamerplanten | Rebuilt locally: foliage is an authored houseplant silhouette, not a small outdoor shrub. |
| Balken / contactgronding | Refined across the room; no layout or light/palette redesign. |
| Tafel, beide stoelen, fauteuil, boekenkast, kleed | Existing joinery/upholstery/book/rug families already have shaped construction and materials; kept and included in room review, with contact grounding added. |
| Dressoir, lade, sleutel, startinventaris, schilderijen | Owner-approved R01 assets retained and regression checked. |
| Deur, raamwerk, plinten, vloer, plafond | Existing construction retained; full-room/threshold captures and original exit route verify fit. No shared architecture edits. |

## Final validation and render comparison

- Final typecheck and production build passed (existing large-chunk warning); 275 existing unit tests passed on the final implementation.
- Eight final browser checks passed after all geometry revisions: wall-art clearance; original calendar memory; lamp toggling; all four pickups; candle lighting/extinguishing; key-gated departure; drawer open/close/reopen and key pickup; exit to estate. No page or HTTP errors.
- All 16 final captures inspected across portrait/landscape; corrected rectangular soles and flat shade presentation after the first inspection.
- Eight fixed cameras × two viewport shapes, 709×1260 and 1260×709 at DPR 1, same lighting, quality and item state. Baseline completed before code edits.
- Reproduce with `node scripts/tut-r02-review.mjs before|after`; use `REVIEW_ROOT` to point at the baseline checkout.
- Before/after evidence: [review index](tut-r02/README.md).

| View | Calls before → after | Triangles before → after |
| --- | ---: | ---: |
| table-portrait | 23 → 27 | 15,607 → 26,607 |
| window-portrait | 11 → 12 | 8,346 → 18,504 |
| room-portrait | 29 → 32 | 16,199 → 27,213 |
| entrance-portrait | 11 → 13 | 8,402 → 20,128 |
| boots-portrait | 11 → 13 | 8,402 → 20,128 |
| calendar-portrait | 10 → 13 | 8,354 → 19,306 |
| lamp-portrait | 15 → 17 | 11,158 → 20,840 |
| drawer-portrait | 15 → 15 | 11,210 → 19,112 |
| table-landscape | 24 → 28 | 15,679 → 27,143 |
| window-landscape | 12 → 13 | 12,308 → 22,466 |
| room-landscape | 30 → 35 | 20,161 → 32,231 |
| entrance-landscape | 12 → 15 | 8,426 → 20,346 |
| boots-landscape | 11 → 13 | 8,402 → 20,128 |
| calendar-landscape | 10 → 14 | 8,354 → 20,874 |
| lamp-landscape | 17 → 20 | 11,242 → 21,548 |
| drawer-landscape | 18 → 20 | 11,282 → 20,964 |

Max revised view: 35 calls / 32,231 triangles. Max matched increase: +5 calls / +12,520 triangles. This home slice is comfortably under the existing call guide and current PB01 750k provisional ceiling; that does not establish physical-phone performance. No global budget or baseline allowance was changed.

Revised JS gzip: 430.84 KB; previously recorded R01 build: 427.33 KB. The approximately 3.51 KB difference is a cross-build reference, not a new paired baseline build. One new 384×480 runtime canvas calendar texture; no externally downloaded asset, imagegen replacement or new dependency. Most new geometry is merged into the existing home/shared-material batches; contact occlusion is one instanced layer.

## Isolation and contracts

Runtime files: only `src/world/home.ts` and new `src/world/homeDressing.ts`. Existing artkit, shared furniture, interactions, estate, vegetation, sky, UI and budget policy are unchanged. Original stand/plant collision footprints, route, item IDs, save schema and memory content are retained. New entry clothes/boots are decorative; no new interaction or puzzle promise.

References remain `STYLE_TARGET` R2/R3 construction/material principles and the approved FLW palette. Third-party original reference pixels are not claimed as re-inspected. Owner screenshot was inspected from its supplied local copy.

Rendering uses Chromium headless shell/SwiftShader. Captures/counters prove rendered geometry, not physical-phone frame times or owner art approval.

## Next safe action

Publish this isolated featurebranch and draft PR after the latest production/parallel check. The owner reviews the concrete rendered result before a new production merge/deployment. Preserve the first local checkpoint dec33d3 and this final follow-up; do not restart on the merged R01 branch.

## Pre-publication integration check

Production reverified at `5ca306d`; this branch contains that integrated TUT-R01/PB01 baseline. Current SKY-C01 `3d978223`, VEG-R01 `5a6df261` and GEO-R01 `142bd7c7` have zero changed-file overlap with this workstream. The previous VFC/VCP branches have no home file changes in their inspected workstreams. No other branch/checkouts modified. Current inspected refs may change later; repeat integration checks before a future approved merge.

CLI Git push credentials were unavailable in the preceding R01 work. Publish the equivalent final tree through the authenticated GitHub connector, verify the tree against local HEAD and record the remote checkpoint in the draft PR. No forced ref update or production write is part of this task.
