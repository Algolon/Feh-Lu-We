# TUT-R01 — start-room refresh

- Branch: `tut-r01-start-room`
- Production baseline: `fe74db0b471d7816d840e6c223b92950adf5639f`
- State: IMPLEMENTED AND VALIDATED — owner visual review and remote publication pending.
- Scope: home/tutorial table props, drawer presentation, wall art and window/wainscot fit.
- Approval gate: owner visual review before production merge/deployment (FLW-PDI-01 §7).

## Confirmed complete

- New connected flashlight with reflector/lens, ribbed grip and switch; canvas travel case with straps, clasps and an open handle; match sleeve/tray/strikers/emblem; bound notebook with covers/pages/spine/elastic/bookmark; folded invitation and wax seal.
- Cabinet constructed around an empty drawer cavity; increased drawer extension and turned the existing approved key sideways to show its complete silhouette above green felt.
- Reused FLW-D2-002 and FLW-D2-007 in existing atlas/frame families. Moved the north-wall painting away from its window.
- Lowered home wainscot below the sill and completed the lower sash locally.
- Eight matched baseline and eight revised screenshots, portrait and landscape, in `tut-r01/before/` and `tut-r01/after/`.
- Typecheck and production build passed on the final hit-area implementation. All 275 existing unit tests passed; those tests predate the home-only hit-area refinement.
- Six targeted browser checks passed through real movement, reticle selection and action paths: wall-art clearance; all four table pickups; candle lighting/extinguishing; key-gated departure; drawer open/close/reopen and key pickup; departure to the estate. No page errors or HTTP errors recorded.

## Validation and comparison

The initial gameplay attempt found overlapping legacy pickup hitboxes: aiming at the torch selected matches. Home-only hit areas were fitted to the actual prop silhouettes, then the final tutorial run passed. The failure is resolved; `tut-r01/after/results.json` contains the successful run.

Same camera, viewport, quality, game lighting and item state; 709×1260 portrait and 1260×709 landscape, DPR 1. Browser screenshots used Chromium headless shell with SwiftShader. Full Chromium failed on a denied singleton socket; the headless shell worked. Vite and browser share one process environment because independent command sessions do not share localhost.

| View | Before calls | After calls | Before triangles | After triangles |
| --- | ---: | ---: | ---: | ---: |
| table-portrait | 22 | 23 | 9,186 | 15,607 |
| window-portrait | 12 | 11 | 6,462 | 8,346 |
| room-portrait | 27 | 29 | 9,774 | 16,199 |
| drawer-portrait | 16 | 15 | 9,326 | 11,210 |
| table-landscape | 23 | 24 | 9,258 | 15,679 |
| window-landscape | 13 | 12 | 10,424 | 12,308 |
| room-landscape | 28 | 30 | 13,736 | 20,161 |
| drawer-landscape | 19 | 18 | 9,398 | 11,282 |

Maximum increase in matched captures: +2 calls and +6,425 triangles. The artwork uses an existing atlas and the props use existing shared materials; no new texture asset or shader. These home measurements do not replace the PB01 budget decision and do not validate physical-phone FPS.

Visual inspection: flashlight head/barrel are connected and recognisable from the table approach; case handle has open space and hardware; matchbox label/strikers read; notebook cover is visible; full brass key silhouette clears the front lip; paintings occupy solid wall; all three windows have a complete lower sash with the wood panels below their sills. This is agent inspection, not owner approval. Other basic decorative objects (coat rack, boots, calendar, candle) remain outside this iteration.

## Reference basis and limits

- `docs/art-refresh/STYLE_TARGET.md` §2: original R2 construction grammar and R3 interior shape/material/grounding principles. Original third-party image attachments are absent from the checkout; this iteration used their preserved written analysis, not a claimed reinspection of those pixels.
- `docs/design/v0.2/ART_BIBLE.md`: warm vakwerk / crafted stylized European woodland manor; purposeful construction and recognisable first-person silhouettes.
- Existing FLW-D2 artwork inspected and reused without creating replacement art.
- No global material/light/tonemapping, estate/culling, vegetation, budget-policy or UI changes. Shared `arch.ts`, `furniture.ts`, `d2props.ts` and interaction builders are unchanged.
- Item IDs, pickup effects, puzzle content and save schema retained. Travel case remains decor as in the original home.
- SwiftShader screenshots/counters are render evidence, not physical-phone performance or owner art approval.

## Checkpoint and publication gate

- Local checkpoint `1cce5dc` preserved the implementation and the earlier review evidence. Final validation/results are in the subsequent completion commit.
- Push to `origin/tut-r01-start-room` was blocked by automatic approval review: publication of the newly authored source/scripts/docs/images to the public GitHub destination needs explicit user authorization. No alternative push route was attempted; no remote branch or PR creation is claimed.
- Production remote was verified at the baseline `fe74db0`; parallel VFC/UI/environment branches were inspected read-only at startup.
- A private recovery patch captures all unsynced source, script and text evidence changes relative to the baseline. Browser images stay in the local Git checkout; they can be reproduced by the review harness.
- Current production, feature refs and checkout cleanliness must be reverified before any later push/integration.

## Next safe action

Owner explicitly authorized push to `Algolon/Feh-Lu-We` and draft-PR creation on 14 October 2026, requesting a parallel-work conflict check first. Publish this existing branch, verify the remote HEAD and review paths, then wait for owner visual approval before merge/deployment. Do not recreate the implementation or start another branch.

## Pre-publication integration check — 14 October 2026

- Working tree was clean, local validated checkpoint `a4e57ea`; production still `fe74db0b471d7816d840e6c223b92950adf5639f`.
- No remote TUT-R01 branch or open TUT-R01 PR existed at the check.
- Changed paths compared against current GEO-R01 (`142bd7c`), PB01 (`faf5c5d`), SKY-C01 (`331ac62`), VFC01 (`8b2e6d3`), VCP01 (`e043993`): zero file overlap.
- GEO-R01 changes `src/interactions/props.ts` only to register see-through glass colliders. Its `World` changes concern portal visibility. No drawer/pickup API or home behavior change was found in that diff.
- PB01 changes budget policy and related docs/harnesses, including source reference documents read by this workstream; TUT-R01 does not modify those files or adopt a competing budget.
- SKY-C01 changes cloud/environment/review modules; home has its own lighting and no sky prototype dependency.
- ENV-L01 and the older Claude branch are behind production; no new ahead changes appeared in their comparisons.
- No featurebranch was merged/rebased into TUT-R01, no production write, no other local checkout edit. These checks establish compatibility of the inspected refs, not a guarantee against future edits or combined runtime validation.
- Review entry: [matched before/after images](tut-r01/README.md).
