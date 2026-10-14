# ENV-L01 — activation, recovery and release assessment

> Update — owner explicitly authorised merge and deployment for live testing on 14 October 2026. Production UI-R02 `6b2b82d` has now been integrated into this existing ENV branch without conflicts. Earlier pending-integration/no-authorisation statements below are historical. Native Android QA and the undiagnosed blackout remain post-deployment observations, accepted as outstanding by the owner's instruction; they are not claimed to have passed.

## Authorised release candidate

Combined UI-R02 + ENV: typecheck, 275/275 units, build and script syntax pass. Gzip JS 425.70 kB (includes current production UI). A fresh bounded actual-game WebGL2/SwiftShader smoke passes eight BOSLUST/garden phase checks, normal-mode guard, cloud-off lighting/puzzle-flag parity and High/portrait renderer checks; no page/console/GL/shader diagnostic errors. [Results/source fingerprints](evidence/release-integration-smoke.json). It starts the normal game via its real continue control with a disposable arrival-only save; no completed puzzle flags are set. Phase values are transient controller inputs. It does not replace a full walkthrough, UI interaction suite or phone test.

Fresh screenshot capture timed out after 30 seconds at the browser screenshot/compositor stage. The bounded retry made no screenshots and completed the same phase/light checks. The fresh browser executable was restored after the earlier workspace recovery. Historical approved sheets remain the visual review evidence; no new successful screenshot capture is claimed.

The original DEV-04D home timeout and F05 software touch timing qualification remain open. No assertions/input thresholds/save logic were altered. No full failing suite was repeated. Deployment uses the repository's existing default-branch Pages workflow after merge; verify its success and served bundle before calling this live.


Owner approved the painted cumulus and requested normal-game implementation and a release assessment. This branch enables that presentation; nothing merged or deployed by ENV-L01.

## Safe checkpoint and recovery — 14 October 2026

The remote `env-l01-lighting-skybox` checkpoint `0116c814de0bf4ad7dcc41d57f8374c1f2c37a3d` retained the approved sky, five reports, audit evidence and cumulus comparison sheets. Automated workspace maintenance removed the local checkout, uncommitted activation, supplementary captures/test outputs and local provenance branches. Library recovery search found no ENV-L01 backup. No ENV browser test was found running in the replacement environment. No original files were deliberately discarded.

Recovered the remote branch at its existing name, without creating a branch, rewriting history or touching production. Reconstructed the small activation from the recorded source diff/checkpoint. This is a reconstruction, not byte-for-byte recovery of the lost working tree. The unrelated dirty `FLW-S3-027_houten-bloemrozet.png` from the old workspace was also lost; its Git version is intact, but its unpublished bytes cannot be restored from the available checkpoint. No replacement was authored or included here. Lost `env-l01-normalcheck.mjs` and its raw captures were not recreated or claimed to have been preserved.

## Current implementation

Normal estate gameplay selects the existing approved four-phase sampler: daylight → golden afternoon → blue hour → late dusk. It compiles the painted cumulus/sun shader on the same dome at Low and High. Sky, world fill, sun direction, regional haze and practical gain follow one continuous puzzle-driven dusk value. The completion formula and smoothing are unchanged. Home does not use this estate environment.

Phase/baseline/component overrides remain limited to `review=lighting`, which uses temporary save storage. Normal gameplay ignores them. Cosmetic `clouds=0` disables clouds only; it does not change lighting or save state. Legacy calculations run only for the review baseline. No new geometry, textures, dynamic light slots, postprocessing or exposure increase.

A small regional calibration maintains woodland haze cooler than open haze in all four phases. The old sage anchor was warmer than the approved daytime haze. This correction changes the blue component of regional fog, keeping the original distance hierarchy and global phase palette. It is not compensation for the undiagnosed Android blackout.

The render-report download now includes existing frame statistics and counters. Frame statistics are wall-time samples over at most 240 real frames, not isolated GPU cost. Warm up at a fixed pose before comparison; do not interpret software-renderer timing as phone performance.

## Current validation and provenance

Reconstructed candidate: fresh lockfile `npm ci`, typecheck, **275/275 units**, build and script syntax checks pass. No dependency/schema/puzzle/input-threshold changes. Bundle `index-DyANIy-p.js`, SHA-256 `50a23590f450061d55f26ca918e6ff054667fbeca1d55c1bb7d9c8dff822f30c`, gzip **423.08 kB**. Current unit coverage includes normal-game override isolation, cosmetic cloud parity, finite lights/haze, transition continuity, regional hierarchy and sunset shadow extinction. Existing end-to-end assertions and timeouts remain unchanged; the suite runner can select a known suite for targeted runs.

Earlier activation results below are session checkpoint observations. Their local outputs were removed by maintenance and are **not independently recoverable evidence for this reconstructed build**:

- Initial activation: full tutorial→finale route (70 steps/31 clues), main **102/103**, only the previously known F05 tap timing failure; DEV-04C **21/22** (regional haze coolness), DEV-04D **17/18** (home load timeout).
- Haze calibration retry: DEV-04D **18/18**, home diagnostic showed world/state/stored scene `home`; DEV-04C still failed a small sequential coolness difference. Final regional calibration passed that hierarchy check. A parallel browser run then timed out on reload; the later serialized DEV-04C run completed successfully. Its summary was inspected before the workspace loss. No new full main suite is claimed for that final fog calibration.
- 20 normal-game captures covered four phases at BOSLUST/garden, late woodland/manor/hall/living/darker room, portrait and mobile High endpoints. Normal/review light values matched; no reported GL/shader/page errors. First BOSLUST startup triangles differed by 698 with identical calls/light values, consistent with previously observed LOD history. Do not describe identical geometry counters or publish fabricated replacement screenshots.

Published pre-activation capture sheets and JSON remain available as historical evidence. They show the owner-approved review appearance, not fresh renders of this reconstruction. The browser executable was also removed; no fresh browser capture or full E2E was attempted during this bounded recovery.

## DEV-04D timeout — bounded finding, still open

OBSERVED in the earlier session: the home-world test waited 120 seconds; a later targeted repeat passed all 18 checks. The first failure had no captured world/storage diagnosis. CONFIRMED from source: the suite opens two pages sharing localStorage; the first game remains active while the second writes a home save. `Game.saveSoon()` schedules a save after 300 ms and `saveNow()` writes while running. INFERRED: shared storage/background saving could explain loading the wrong scene; software/browser scheduling could also contribute. Neither cause was proven for the failed run. No ENV-induced save regression is established, and absence of a reproducible fault is not proof of a harmless environment failure.

Only diagnostic logging is added before the original `world.id === 'home'` wait. That wait, timeout and all contract assertions are retained. No save logic was changed. Stop further diagnosis here; next useful evidence is the diagnostic JSON on recurrence in a hardware-backed run. Do not repeat the full suite without a new hypothesis. This remains an open validation qualification, not a green gate concealed by a looser assertion.

## Production and parallel work

Production/default has advanced from our base `ae2a036e783400355c8d137f24e16c33bb1a8323` to **`6b2b82d95fc761390b9275c94ee363f37a25f6bf`**, merging UI-R02 #16. ENV remains on its own historical base. UI-R02 changes `src/core/game.ts` (run-control wiring); ENV also changes that file (review/fixture integration). The inspected hunks are separate, but joint integration and touch/UI regression remain required. No integration was silently performed. Older VCP-01 #9 `artflags.ts` overlap and unpublished DEV-04D/VFC changes remain potential integration concerns.

## Release recommendation

**Ready for owner review and integration; not yet cleared for production.** Remaining prerequisites:

1. Integrate/reconcile the new production/UI-R02 base on this existing branch, preserving both changes; rerun required checks on that combined candidate. Record the unresolved home timeout if it recurs, without relaxing assertions.
2. A short real Android check, Low primary/High secondary, portrait/landscape, especially blue hour/late dusk at BOSLUST, woodland and garden plus indoor fixtures. Confirm walkable routes and clues remain readable without torch, no black surfaces/light-pool jumps, and normal touch interactions work.
3. Compare baseline, approved clouds on/off at the same phase/pose/quality/DPR after ≥240 visible warm-up frames; record median FPS/p95, device/Chrome/build and repeat after 5–10 minutes walking to assess heat/frame pacing. No native FPS/thermal result exists yet. Counters alone do not measure sky fragment cost.
4. Explicit owner go-live approval after those results; then use the existing default-branch Pages workflow and verify the deployed build.

Local phone review: `npm ci`, `npm run build`, `npm run preview -- --host 0.0.0.0`; on the same trusted Wi-Fi open `http://<machine-LAN-IP>:4173/Feh-Lu-We/?review=lighting&debug=1`. This sandbox preserves the normal save. Test High after a runtime toggle and a fresh startup because antialiasing is constructed initially. Download the render report if blackout recurs. No hosted test deployment has been made.

The original Android blackout cleared after reload, remains unreproduced and undiagnosed, and is not this change's demonstrated repair. Native recurrence stays a separate investigation. No calendar promise before integration/device checks. The approved visual needs no further aesthetic redesign to reach that gate.

Existing Pages workflow runs typecheck/unit/build on branch pushes; deploy runs only on default. Branch publication does not deploy. Rollback after an authorised release: revert ENV changes and redeploy via that workflow, with no save migration. `clouds=0` is a cloud-only fallback, not full rollback.
