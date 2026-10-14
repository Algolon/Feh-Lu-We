# GEO-R01 — Building Integrity Repair

- Branch: `geo-r01-building-integrity`
- Baseline: production `fe74db0b471d7816d840e6c223b92950adf5639f`
- State: PARTIAL — implementation complete; final browser validation and report in progress.
- Scope: building correctness around kitchen, service corridor, Copacabana Room and adjacent exterior; vegetation LOD excluded.

## Confirmed complete

- Applied owner-requested FLW-PDI-01 (Library document version 0.1); clean isolated clone, no other worktree or pre-existing changes.
- Inspected supplied `82159.mp4`; `82158.mp4` failed attachment delivery and has not been read.
- Reproduced disappearing interior at service doorway: wall-depth positions classify as outdoors and angular exterior-door culling hides `mIn`.
- Added localized threshold room ownership; completed 40 cm missing wing floor, ceiling and partition joins to existing manor wall at X108.
- Preserved visibility through closed transparent doors; movement and interaction occlusion remain physical.
- Normal-render before/after captures: `docs/geo-r01/before/` and `after/`.
- Typecheck, build and all 280 unit tests passed.

## Validation remaining

- Corrected focused browser harness to close doors away from the player's swept-leaf region; rerun `VALIDATE=1 node scripts/geo-r01-check.mjs docs/geo-r01/after`.
- Existing DEV-04A browser suite: 17 checks passed; final budget-reload navigation timed out. No page errors or construction warnings. Do not repeat full suite; recover only measurements if needed.
- Final report, evidence comparison, rendering costs, remote checkpoint verification.

## Dependencies and gates

- No PB01 branch was remote-visible at latest check; no budget files changed or new ceiling invented. Report actual counts; 250k is not a GEO-R01 gate.
- Production and all other featurebranches remain unchanged. Shared-file overlap with future visibility/vegetation work: `src/interactions/world.ts`, `src/world/estate.ts`.
- No merge or deployment authorized. Owner review and second-video coverage remain outstanding.
