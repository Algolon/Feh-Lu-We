# VFC-01 — next work packages

Planning only, 14 October 2026. None of these packages is executed or automatically authorized by C01. Start with [closeout](VFC01_CLOSEOUT.md); do not restart VFC-01.

## Shared execution contract

This contract applies to every package below; its scope table narrows it further.

| Required field | Contract |
|---|---|
| Starting source/checkpoint | Read the C01 handover commit on `vfc01-visual-fidelity-calibration`, reverify remote/local HEAD and uncommitted work. Fixed evidence/source anchor: `106f68cf261bd2585fc783a7c683e22b04a459e4`; calibration base `ae2a036e783400355c8d137f24e16c33bb1a8323`. Preserve per-capture provenance, including broad-control revision `62e6ab7`; do not rebase research onto current production. |
| Dependencies | C01 completed, separate owner authorization for the chosen package and an explicitly assigned branch/single writer before repository writes. E01/E02 may continue sequentially on the existing evidence branch after re-verification. R/M/D record work must also receive an explicit branch assignment. |
| Evidence rules | Recover originals where possible; reproduce only the named missing paths from unchanged calibration source if authorized. Record actual source/tree, camera, visit order, FOV 70, 915×412 viewport, light/DPR/settings, timestamps, hashes, observed counts and deviations. Preserve original manifest and existing measurements. Newly reproduced bytes never inherit original hashes/timings. |
| Explicit exclusions | No estate-wide implementation, gameplay edits, new rendering standards/budgets, new research experiments, merge/deploy, production writes or wholesale branch integration. No concurrent media writers on one branch. No new branches/PRs until individually assigned. |
| Validation and done | Verify exact package paths, dimensions/decodes where relevant, provenance and comparison validity. Clearly record any irrecoverable asset or mismatch; never mark unavailable evidence complete. Stop on an operational failure, save a precise blocker and latest durable batch. |
| Commit/push checkpoint | Small ordinary commits and non-force push to the assigned branch; verify remote HEAD, paths, sizes and blob SHAs after every batch. A loose blob is not delivery. Include a compact package ledger/decision note, not a second full history. Final package done only when its artifacts are remotely reachable and checks/limitations are recorded. |
| Owner approval gate | Owner reviews evidence/decisions and explicitly chooses the next package. Evidence publication or an “ADOPT PRINCIPLE” review label does not authorize production development. Actual implementation requires a separate brief, branch and approval. |

Use bounded operations and stop at the package's deliverables. Prefer sequential files and small durable batches; do not repeat the large Base64/unattached-blob route. Do not rebuild lost temporary directories. Coordinate E01/M01 capture needs once rather than duplicating work.

## VFC-E01 — Dynamic LOD Evidence

Objective: restore the missing paired movement evidence. Four independent sessions; none depends on completion of another. Inputs: fixed source anchor, [LOD report](VFC01_VISIBILITY_LOD_REPORT.md), `combined-lod/sequences.json`, capture scripts and current availability. Use exact recorded poses/order, diagnostic flags and preceding camera history; preserve approach/retreat hysteresis. Four presentation frames/s, 915×412 content padded to 916×412 MP4, is not gameplay FPS. Validate deviations before drawing matched conclusions.

All paths below are relative to `docs/vfc01/combined-lod/`.

| Subpackage | Exact scope / expected artifacts | Evaluation / validation / definition of done |
|---|---|---|
| **E01-A — Architecture continuity** | `V3-architecture.mp4`, `V4-architecture.mp4`; each variant's `architecture-{0,7,14}.webp` (2 clips + 6 frames); brief architecture findings/ledger | Compare the sampled 86–90m cutoff and V4 silhouette through 105m, keeping room/portal rules. Validate both directions, equal settings/count provenance and six boundary frames. Done when all eight files and qualified conclusions are remote verified. |
| **E01-B — Hero-object continuity** | `V3-hero.mp4`, `V4-hero.mp4`; each variant's `hero-{0,10,20}.webp` (2 clips + 6 frames); hero findings/ledger | Same relocated diagnostic lantern in both variants; distinguish distance loss from occlusion. Evaluate disappearance/landmark continuity around 30m through the recorded 58m ray. Done when eight files and matched diagnostic limitations are verified. |
| **E01-C — Vegetation continuity** | Preserve/verify existing `V3-vegetation.mp4` (blob `acdfca49a7b90d327869817dbc3272026695afeb`, 1,426,084 bytes); recover/reproduce only missing `V4-vegetation.mp4`; both variants' `vegetation-{0,13,26}.webp` (1 missing clip + 6 frames); provenance/findings ledger | Reconcile existing V3 video against expected hash/sequence provenance without replacing it silently. Compare native 16/26/48m bands, popping and 3m hysteresis. Done when both clips are a defensible matched pair, seven missing files are durable and limitations are explicit; otherwise record the provenance blocker. No production vegetation changes. |
| **E01-D — Small-object transitions** | `V3-small.mp4`, `V4-small.mp4`; each variant's `small-{0,11,22}.webp` (2 clips + 6 frames); micro-fade disposition/ledger | Evaluate the existing diagnostic hard-cut versus projected fade/re-entry, temporal noise and orientation limitation. Preserve the refined near leg and original settings. Done when eight files and a qualified evaluation of the already deferred experiment are verified. No new fade implementation or tuning. |

Each subpackage inherits the shared dependencies/exclusions/checkpoint/gate. Upload each MP4 separately and then at most three matching stills per batch, adjusted downward for payload reliability. Verify every remote batch before continuing. Per-subpackage approval: owner accepts or defers its continuity evidence; phone review is still needed for movement judgement and shipping policy.

**Copyable task pattern:** “Execute only VFC-E01-[A/B/C/D] as defined in `VFC01_NEXT_WORK_PACKAGES.md`, from the verified C01 branch state. Preserve unchanged calibration source/provenance, publish small verified batches, record findings/blockers, stop. No production work or other evidence classes.”

## VFC-E02 — Supplementary Comparison Evidence

Objective: restore or explicitly disposition **40 supporting images**. Inputs: fixed source anchor, original/current manifests, `compare/ktx.json`, `compare/sweeps.json`, reports and recovery provenance. The precise 71-path missing list is in [UPLOAD_AVAILABILITY.json](UPLOAD_AVAILABILITY.json). Recovery is not permission to add controls or new benchmarks.

| Subpackage | Exact scope / artifacts | Dependencies, validation and done |
|---|---|---|
| **E02-A — Format and texture controls** | Four `compare/ktx-{etc1s,webp}-{library-player,cottage-player}.webp`; compact control disposition | Existing ETC1S/decoded WebP assets and unchanged format script. Validate settings/dimensions/hash/source and retain original load measurements separately. All four restored or individually marked unresolved/dispositioned with claim impact; remote verified. Original-source fidelity is still unavailable. |
| **E02-B1 — DPR/drift controls** | Ten `compare/sweeps/{baseline,dpr-1,dpr-1.25,dpr-1.5,dpr-1.75}-{library-player,cottage-player}.webp`; disposition note | Match each original sweep row/source and camera history, including drift control. Do not attach new timing. Ten restored or individually dispositioned, remote verified. |
| **E02-B2 — Shadow/quality controls** | Ten `compare/sweeps/{MSAA,baseline-crisp,crisp,cropped-shadow,shadow}-{library-player,cottage-player}.webp`; disposition note | Match quality context/light counts and shadow settings; MSAA is not an isolated AA-only control. Ten restored or individually dispositioned, remote verified. |
| **E02-B3 — Material candidates** | Ten `compare/sweeps/{material-lambert,material-phong,no-normal,timber512,candidate}-{library-player,cottage-player}.webp`; disposition note | Preserve shader/texture/normal flags and historical-source distinction. Ten restored or individually dispositioned, remote verified. |
| **E02-B4 — Surface/oblique controls** | Six `compare/sweeps/{anisotropy1,flat-normals,neutral-tone}-{library-player,cottage-player}.webp`; disposition note | Same topology, lighting and oblique camera; flag confounds explicitly. Six restored or individually dispositioned, remote verified. |

E02-A and each B batch are independently executable. Prefer 6–12 images per session but publish smaller verified batches (normally ≤3 files) based on actual payload. Every image needs a path-level disposition: recovered original / reproduced with explicit provenance / unresolved / owner-approved waiver. A waiver does not make the original 201-file package complete. Agent identification of a supplementary image does not itself waive it.

| Missing control purpose | Essential to accept which claim? | Supplementary to what can be reviewed now? |
|---|---|---|
| Both KTX formats / both views | Essential for the specific round-trip appearance comparison; insufficient for missing original-source fidelity or phone format readiness | Recorded download/transcoded-byte accounting; static construction/selected-family review |
| Baseline + DPR 1/1.25 | Essential for independently accepting the historical sweep's own visual attribution | Nine available selected frames already permit initial equal-DPR vs 1.25 review |
| DPR 1.5/1.75 | Essential if choosing those higher-DPR options; phone evidence also required | Not required to judge current DPR 1/1.25 selected candidate |
| MSAA + matched crisp baseline/candidate | Essential for quality-context comparison; cannot establish a pure AA win | Not required for current shadows-off candidate |
| Shadow/cropped-shadow | Essential to accept that configuration or verify artifact mitigation | Existing report can justify keeping adoption deferred |
| Lambert/Phong/no-normal/timber512/candidate | Essential for broad shader/normal/texture-size ranking | Available selected Phong-512/no-normal frames support bounded initial review, not universal superiority |
| Anisotropy1/flat-normals/neutral-tone | Essential to accept a specific anisotropy/custom-normal/tone rule | Supplementary to construction/silhouette selection; leave unproved rules deferred |

Per-batch gate: owner accepts the restored controls or explicitly dispositions omissions; essential omissions keep the associated claim deferred. No blanket waiver or new rendering standard.

**Copyable task:** “Execute only VFC-E02-A or one named E02-B1/B2/B3/B4 batch from the C01 plan. Restore/disposition only its enumerated paths, preserve historical measurements/source, verify small remote batches and record each omission's claim impact. Stop; no new experiments.”

## VFC-R01 — Owner Visual Review

- **Objective/dependencies/start:** C01 complete and separate authorization; current main/selected evidence is sufficient to begin. Use its fixed source, [viewer](index.html), [recommendation](VFC01_RECOMMENDATION.md) and explicit limitations. No need to await all E01/E02.
- **Exact scope/artifacts:** a short review protocol plus `VFC01_OWNER_VISUAL_DECISIONS.md`, recording owner responses with evidence links, build/DPR, benefit/cost/confidence and dependent missing controls. Start at cottage-front, then cottage-player and Library-player at normal display/player-eye scale; compare V2 geometry versus V1 materials with clay/neutral controls, selected equal-DPR versus DPR 1.25, complexity/rendering costs and ART-01 coherence.
- **Decisions now/later:** now: selective construction/UV/material principles, modest Library versus stronger terrace gain, rejection/defer of broad plaster. Later: moving continuity/micro fades after relevant E01, device/DPR/thermal suitability after M01, control-specific claims after essential E02. Never infer all LOD quality from stills.
- **Validation/done/checkpoint/gate:** every decision is owner-supplied and labeled **ADOPT PRINCIPLE / TEST FURTHER / DEFER / REJECT**, with unresolved dependencies. An agent may prepare protocol but cannot fabricate owner judgement. Commit/push the protocol and then the actual decision record as meaningful checkpoints; owner confirms it. Production implementation and new experiments excluded.

**Copyable task:** “Execute only VFC-R01. Prepare the bounded current-evidence review, collect actual owner decisions on player-eye construction/materials/equal DPR versus 1.25 and ART-01, record dependencies and costs, save the decision record, stop. Do not recover media or implement selections.”

## VFC-M01 — Real-Phone Performance and Fidelity

- **Objective/dependencies/start:** test R01-selected candidates on the actual owner device using [VFC01_PHONE_PROTOCOL.md](VFC01_PHONE_PROTOCOL.md). Coordinate relevant E01 movement needs; require its evidence before signing off dependent dynamic claims. Agent environment preparation is separate from owner-device observations.
- **Exact scope/artifacts:** compact test/run ledger and owner exports/observations in `phone-results/`, plus a findings note. Minimum DPR 1.0 versus 1.25 on Library/cottage player cameras; RAF frame pacing/p95, sustained load, thermal state, GPU/device/browser identity, geometry and shadow costs, texture/load implications, movement visibility/LOD and ordinary-distance readability. Additional existing protocol controls only if needed for selected findings.
- **Provenance/exclusions:** record exact commit/build, renderer, device, viewport, power/temperature and settings for every run. Original VFC base and newer production ENV-L01 lighting are separate datasets; never silently compare across them. SwiftShader/emulation results stay in a software category. No new phone budget, production change or fabricated device measurement.
- **Validation/done/checkpoint/gate:** owner completes uninterrupted samples and sustained movement, exports actual data and documents interruptions/confounds; missing owner data stays pending. Commit/push preparation before handoff, then each coherent returned dataset with remote verification. Done when selected candidates have adequate device evidence and qualified limitations; owner approves readiness for D01, not rollout.

**Copyable task:** “Execute only VFC-M01 for R01-selected candidates using the existing phone protocol. Prepare an isolated versioned build/test handoff, collect actual owner-device evidence separately from software results, compare DPR 1/1.25 and sustained fidelity/cost, save findings, stop. No production/budget change.”

## VFC-D01 — Adoption and DEV-04D Planning

- **Objective/dependencies/start:** separate explicit authorization required. Read R01 owner decisions, required M01 evidence, relevant E01/E02 findings and the then-current production/DEV-04D baseline. Inspect production read-only; do not rebase the evidence branch. Missing essential evidence blocks its technique's adoption recommendation.
- **Exact scope/artifacts:** `VFC01_ADOPTION_BRIEF.md` with selected construction techniques, material/UV rules, shadow/DPR questions, selective class-specific LOD work, evidence-supported proposed budgets, rejected techniques, integration risks, estimated effort and a small implementation sequence.
- **Exclusions:** no development, source changes, budget enactment, DEV-04D modifications, implementation branch creation, merge/deployment. Private-field adapters and bulk experimental public assets are not to be wholesale integrated.
- **Validation/done/checkpoint/gate:** trace each proposed integration to approved visual/device evidence and current baseline compatibility; distinguish proven principles from remaining tests. Commit/push the scoped brief on the assigned planning branch and remote verify. Done when the owner reviews a concrete bounded brief; actual implementation requires new authorization and its own scoped branch from then-current production.

**Copyable task:** “After explicit authorization, execute only VFC-D01. Reconcile approved R01/M01 and necessary E01/E02 findings with current production/DEV-04D, produce a scoped adoption brief with costs/risks/dependencies and excluded techniques, save it, stop. No implementation.”

## Priority and dependency model

1. C01 closeout.
2. R01 initial visual review of available evidence — smallest valuable next step.
3. E01-A/B/C/D and E02-A/B1/B2/B3/B4 according to review needs; independent scopes but sequential writes on a shared evidence branch.
4. M01 selected real-phone tests, coordinated with relevant E01; do not delay unrelated stationary device tests for unrelated missing controls.
5. D01 only when authorized and its relevant visual/device/control dependencies are satisfied.

R01 can defer a technique without recovering every supporting image. R01 cannot approve dynamic continuity from static frames. M01 cannot turn software measurements into hardware evidence. D01 cannot authorize itself or start implementation. Future production work, if approved, receives a separate single-writer scope/branch from the then-current production baseline. Research recovery and rollout remain separate workstreams.
