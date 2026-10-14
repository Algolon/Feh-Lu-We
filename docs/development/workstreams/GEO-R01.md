# GEO-R01 — Building Integrity Repair

- Branch: `geo-r01-building-integrity`
- Baseline: production `fe74db0b471d7816d840e6c223b92950adf5639f`
- State: PARTIAL COVERAGE — available-video repairs and validation complete; second video unavailable.
- Last durable code checkpoint: `252caaeaa07d19a4c1605e8490165b4fa697ea08` (GitHub route); final evidence checkpoint is the commit containing this record.
- Scope: building correctness around kitchen, service corridor, Copacabana Room and adjacent exterior; vegetation LOD excluded.

## Confirmed complete

- Applied owner-requested FLW-PDI-01 (Library document version 0.1); clean isolated clone, no other worktree or pre-existing changes.
- Inspected supplied `82159.mp4`; `82158.mp4` failed attachment delivery and has not been read.
- Reproduced disappearing interior at service doorway: wall-depth positions classify as outdoors and angular exterior-door culling hides `mIn`.
- Added localized threshold room ownership; completed 40 cm missing wing floor, ceiling and partition joins to existing manor wall at X108.
- Preserved visibility through closed transparent doors; movement and interaction occlusion remain physical.
- Normal-render before/after captures: `docs/geo-r01/before/` and `after/`.
- Typecheck, build and all 281 unit tests passed.
- Final focused browser validation: 48/48 passed, including 324 camera variants, structural ray probes, open crossings both ways and closed collision.
- Existing reference rendering measurements recovered on baseline and final repair; 13/14 unchanged. Conservatory deck rises to 170 calls / 307,740 triangles as visible corridor content is restored. Maximum focused view: 331,722 triangles. Deck draw-call and relative-growth deviations are unapproved and require owner review before integration.
- Final report and comparisons: `docs/geo-r01/REPORT.md`, `comparison.jpg`, `render-costs.md`, `provenance.json`.

## Validation limits / next safe action

- Existing DEV-04A suite: 17 checks passed against initial repair; final budget-reload navigation timed out. No page errors or construction warnings. Measurement recovered separately; do not claim the entire broad suite passed.
- Re-upload and inspect `82158.mp4`, then reproduce only additional building defects if present. Physical-device/owner review is pending.
- CLI push lacked credentials; remote code and evidence are stored through connected GitHub. Local and remote commit histories can differ; verify identical file trees and preserve both checkpoints.

## Dependencies and gates

- PB01 appeared during closeout at `e298649515e80af914da2f3f6fbf51f0ba11f809`: provisional 750k camera triangles, unchanged 150 calls, device validation pending. Read-only inspection; no budget files changed. All measured triangles fit; conservatory deck exceeds calls by 20 and independent 8% relative growth review guard. No exception approved; 250k is not a GEO-R01 gate.
- Production and all other featurebranches remain unchanged. Shared-file overlap with future visibility/vegetation work: `src/interactions/world.ts`, `src/world/estate.ts`.
- No merge or deployment authorized. Owner review and second-video coverage remain outstanding.
