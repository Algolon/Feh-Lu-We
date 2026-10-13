# ENV-L01 — implementation notes

Isolated opt-in prototype. Normal gameplay retains legacy lighting; nothing merged or deployed.

## Files and boundaries

- `src/world/lightingPhases.ts`: four authorable palettes, bounded smooth sampler.
- `src/world/env.ts`: extends the existing dome/lights/fog updater; pilot tone mapping, shared sun direction, location fills, smooth phase sampling. Existing normal path retained. Review properties are ignored outside the lighting sandbox.
- `src/core/game.ts`: multiply existing practical gain by environment gain (always 1 in ordinary game); no change to solvedCount, dusk progression, audio value, puzzle state, culling or saves.
- `src/core/artflags.ts`, `src/main.ts`: add `review=lighting`, route to dedicated review UI.
- `src/ui/lightingReview.ts`: temporary state, four buttons/continuous slider, legacy comparison, quality/diagnostics and eight fixed poses. Uses existing review storage sandbox without changing state.ts or its schema. No ordinary HUD/notebook changes.
- `tests/env-l01.test.ts`: normal-path isolation, finite inputs, indoor/forest continuity at phase boundaries, sunset/shadow extinction, endpoint preservation.
- `scripts/env-l01-capture.mjs`: actual WebGL captures, component isolation and GPU-synchronized SOFTWARE render timings.
- `scripts/env-l01-qa.mjs`: build-hash guard, review controls/save isolation, existing suites sequentially under one server namespace.

No new meshes, point lights, texture images, GLB, postprocessing, HDRI or volumetrics. Thin procedural cloud detail was added after owner approval of the four-phase direction. Same dome topology. Zero additional draw calls expected on low; counters must establish that. High skips the negligible/zero sun shadow pass after sunset, so high/low differences diminish in the evening. This is intentional, not a downgrade of quality settings.

## Local review

Checkout this branch, install matching lockfile dependencies, `npm run build`, `npm run preview`. Open `/Feh-Lu-We/?review=lighting` on that preview. Optional `&phase=0.667&system=pilot` or `&system=baseline`. URLs on current production do not run this prototype. Use ENV-L01 button to expand controls. Compare at the same pose; select a location to reset the view. Quality changes retain the pose. Normal touch/mouse controls remain.

For real-device access, serve the preview to the owner's LAN using `--host 0.0.0.0` on a trusted machine. No hosted preview was deployed. Test both orientation/aspect and actual device DPR, because automated phone-sized frames are DPR 1 and do not emulate Android GPU/display behaviour.

Capture: `node scripts/env-l01-capture.mjs prototype /absolute/scratch/output`. Audit uses mode `audit` on a clean production build. CHROME can select an installed compatible Chromium. Each harness starts its own Vite preview in the same process namespace. Do not rebuild dist while a capture or suite is running.

Rollback: exit review to use ordinary game; remove the ENV-L01 commit(s) to remove the prototype. No persistent state migration needed. Before integration, reconcile artflags/main/game/env with active DEV-04D, UI-R01 and old VCP-01 PR #9; do not copy its older state/review implementations wholesale.

## Owner screenshot diagnosis extension

`lightingDiagnostics.ts` collects/downloads read-only render evidence from the sandbox. `lightingReview.ts` adds reversible surface-shader isolation; `env.ts` adds practical-only reference mode. Ordinary lighting and approved palettes remain unchanged. See [follow-up](ENV-L01_OWNER_SCREENSHOT_FOLLOWUP.md). These controls are available only in the isolated branch until it is integrated.

## Initial sky implementation continuation — 13 October 2026

User explicitly requested further development/implementation of the skyboxes. Extended the existing single dome rather than creating four meshes. `skyShader.ts` contains the shared shader; `ENV_SKY_REVIEW` compiles cloud/disc detail only for the lighting review. Normal gameplay excludes those computations. In the review's baseline mode the legacy sky expression remains selected; pilot mode uses the refined disc, restrained aureole and six inexpensive soft elliptical lobes grouped into three thin cloud bands. No texture/noise octaves/raymarch/time uniform; one existing sky draw.

`lightingPhases.ts` adds cloud colours/opacity to each existing palette. `env.ts` samples these with the same continuous phase as global light and fog; the displayed sun uses the existing directional light vector. `lightingReview.ts` exposes an optional cloud checkbox and `clouds=0` URL parameter. `lightingDiagnostics.ts` records that selection. Clouds default on in pilot review, are absent in baseline and ordinary gameplay, and do not alter world light, progression or saved state. No moon/stars added in this pass.

Reverified production/default `ccr-75ef4113-kfkimm` at `ae2a036e…`. Open UI-R02 PR #16 changes UI/CSS/icons, package/scripts and its docs; it has no direct file overlap with this continuation's sky/env/review files. Older VCP-01 PR #9 overlap with the initial ENV-L01 `artflags.ts` remains. No parallel branch was modified or imported; later unpushed edits cannot be excluded.

The stale dependency symlink's target had disappeared between sessions. Replaced that dangling link with a local `npm ci` matching the existing lockfile; no dependency or manifest change. Capture script `env-l01-skycheck.mjs` uses the real game, same loaded geometry for paired toggles, and pins room blend for still comparisons to exclude doorway-smoothing history. Initial strict comparison failed before that control; it did not demonstrate cloud-dependent world light. Final successful evidence is indexed separately; older suites/captures retain their original provenance.

## Cumulus revision from owner feedback

Owner requested more pronounced clouds, using an attached reference. Changes `skyShader.ts`, cloud-only fields in `lightingPhases.ts` and the review checkbox label (now simply “Wolken”); UI behaviour, environment updater, physical global-light values and gameplay are unchanged from the preceding tested prototype. Replaced six soft lobes with 21 compact polynomial billows in three local directional groups. Each puff returns a field and analytic gradient; combined gradients model painted relief. Derivative-based edge width keeps silhouettes legible without a hard pixel stair-step. Broad sky-key shading avoids deep internal contrast; phase-tinted tops and undersides stay coherent at dusk.

Same existing dome/pass. No texture/raymarch/noise octaves/weather clock/point light/geometry added. Normal-game cloud code remains compiled out. This changes pilot fragment work and cloud opacity, not world illumination. Exact new cloud parameters and trade-offs are in visual direction. The reference pixels were not copied into the public repo or runtime. Earlier soft-cloud sheets/results remain historical; new comparison and four-phase sheets are indexed separately. No parallel work imported; open PRs still #9/#15/#16, production remains `ae2a036e…` at check.
