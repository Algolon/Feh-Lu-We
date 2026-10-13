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

No new meshes, point lights, texture images, GLB, postprocessing, HDRI, clouds or volumetrics. Same dome topology. Zero additional draw calls expected on low; counters must establish that. High skips the negligible/zero sun shadow pass after sunset, so high/low differences diminish in the evening. This is intentional, not a downgrade of quality settings.

## Local review

Checkout this branch, install matching lockfile dependencies, `npm run build`, `npm run preview`. Open `/Feh-Lu-We/?review=lighting` on that preview. Optional `&phase=0.667&system=pilot` or `&system=baseline`. URLs on current production do not run this prototype. Use ENV-L01 button to expand controls. Compare at the same pose; select a location to reset the view. Quality changes retain the pose. Normal touch/mouse controls remain.

For real-device access, serve the preview to the owner's LAN using `--host 0.0.0.0` on a trusted machine. No hosted preview was deployed. Test both orientation/aspect and actual device DPR, because automated phone-sized frames are DPR 1 and do not emulate Android GPU/display behaviour.

Capture: `node scripts/env-l01-capture.mjs prototype /absolute/scratch/output`. Audit uses mode `audit` on a clean production build. CHROME can select an installed compatible Chromium. Each harness starts its own Vite preview in the same process namespace. Do not rebuild dist while a capture or suite is running.

Rollback: exit review to use ordinary game; remove the ENV-L01 commit(s) to remove the prototype. No persistent state migration needed. Before integration, reconcile artflags/main/game/env with active DEV-04D, UI-R01 and old VCP-01 PR #9; do not copy its older state/review implementations wholesale.

## Owner screenshot diagnosis extension

`lightingDiagnostics.ts` collects/downloads read-only render evidence from the sandbox. `lightingReview.ts` adds reversible surface-shader isolation; `env.ts` adds practical-only reference mode. Ordinary lighting and approved palettes remain unchanged. See [follow-up](ENV-L01_OWNER_SCREENSHOT_FOLLOWUP.md). These controls are available only in the isolated branch until it is integrated.
