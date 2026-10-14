# FLW-PB01 — mobile development performance budget

**PROVISIONAL DEVELOPMENT BUDGET: 750,000 submitted camera triangles per frame/view.**
**DEVICE-VALIDATED BUDGET: none; DEVICE VALIDATION PENDING.** Effective for development on `pb01-mobile-development-budget`, based on production `fe74db0b471d7816d840e6c223b92950adf5639f` (14 October 2026); becomes the production policy only after owner-authorized integration. Central checks import `scripts/performance-budget.mjs`.

## Scope and choice

The ceiling applies to camera submissions at mobile **low** quality (current DPR cap 1, shadows off, three pooled lights), including instanced geometry and complete intersecting batches, across movement and changing visibility/door states. It is an authoring ceiling, not permission to fill every view or a guaranteed phone capability. Existing goal: **about 30 FPS or better** (33.3 ms frame interval); median alone is insufficient—report p95/p99 pacing and sustained slowdowns. No automatic vegetation-distance, LOD, material, DPR or renderer changes follow from this policy.

| Candidate | Relative to old 250k | Decision |
|---|---:|---|
| 500,000 | 2× | Plausible but only 1.52× VFC's 328,224-triangle Library medium view; less room for simultaneous authored detail and sightlines. |
| **750,000** | **3×** | Chosen engineering allowance: 2.29× that already observed camera workload, sufficient development room while keeping a bounded ceiling. |
| 1,000,000 | 4× | More development room but no representative physical-device evidence at this density; 33% more geometry than the chosen allowance. Defer pending measurements. |
| 2,000,000 | 8× | No additional workload/device justification; not adopted. |

This choice is **policy judgment with low confidence in actual device capacity**, not a calculated GPU maximum. 350k is not supported as a necessary limit: VFC already reports 328k in existing production, and no physical cadence evidence establishes 350k as a boundary. A 750k view implies 22.5 million submitted camera triangles/second at 30 FPS by arithmetic, not measured throughput. Fragment cost, batching, visibility, shaders, memory and thermals can dominate before that ceiling.

## Evidence, without importing VFC runtime

Read-only VFC source: branch `vfc01-visual-fidelity-calibration`, verified remote `8b2e6d30a48c79b9d4cafca9bd20174c39726026`; `docs/vfc01/VFC01_BASELINE_AUDIT.md` and `VFC01_PERFORMANCE_REPORT.md`. Production audit was older `ae2a036`; low Library player/medium camera counts were 286,772 / 328,224, whole-world unique geometry about 735,863 triangles and referenced texture estimate 41.96 MiB. Whole-world geometry (including batch capacity in some inventories) is **not** submitted camera geometry and is not capped at 750k.

VFC DPR 1.5 used 2.25× DPR-1 pixels; a Library shadow control added 293,168 caster triangles / 64 calls to 291,924 camera triangles / 104 calls. These cost decompositions motivate separate reporting. VFC's 500k/700k probe was one regularly tessellated opaque plane on SwiftShader with non-monotonic fenced timings: it proves neither representative scene capacity nor Samsung FPS. Rejected Portugal/Library candidates remain rejected; no VFC code/assets or measurements are rewritten or merged.

Primary references, consulted 14 October 2026:

- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer): renderer counters, frame reset and drawing-buffer pixel ratio. Checked against project's installed r186 source; default reset occurs before shadow rendering, so `info.render` includes camera plus active shadow work. Low disables shadows and therefore provides camera-only counts.
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): batch draws, smaller back buffers and explicit memory budgeting; WebGL has no portable total-VRAM query.
- [Arm GPU content optimization guide](https://support.arm.com/documentation/102643/0100/Overview): distinguish CPU, vertex and fragment bottlenecks. None of these sources prescribes 750k or a universal mobile triangle ceiling.

## Independent costs and regression rules

- Camera: submitted triangles per view, min/median/max during movement, camera draw calls. Low draw-call guide **150 remains unchanged**, including the original documented suite-specific call exceptions. High/desktop's separate existing 270-call / 450k combined-pass check remains unchanged; it is outside this mobile-low policy.
- Shadows: report caster triangles/calls and number/type/resolution of passes separately, then camera-plus-shadow totals. Low has zero shadow passes. Never reinterpret 150 calls as 150 camera calls plus unlimited shadow calls.
- Renderpixels: CSS viewport, actual drawing-buffer dimensions, actual renderer DPR, antialias and quality/light settings. DPR multiplies pixel work quadratically; native device DPR is not the actual rendering DPR.
- Memory: geometry/texture object counts plus estimated unique vertex/index and texture bytes where available; record render-target/instance-buffer omissions. Object counts and JS heap are not VRAM byte measurements.
- Regression: compare matched production and candidate views, door/lighting/LOD history and settings. Publish absolute counts and deltas. Existing A/C checks retain 8%/2% triangle growth review allowances, now **independent of the ceiling**; they apply against actual baseline counts instead of treating 250k as a floor. Other local batch/asset budgets and functional checks stay intact.
- Explained growth: a deliberate quality increment may exceed a relative guard only after its workload, reason, before/after counts and frame/device evidence (or explicitly pending device validation) are recorded and its baseline/allowance change is separately reviewed. Spare absolute budget alone does not waive regression review. No hidden “under 250k remains under” condition applies.
- Exceptions: any absolute overshoot remains a failure unless a named, time-bounded per-view exception is explicitly approved with baseline/build, actual maximum, cause and follow-up. No new absolute triangle exceptions are introduced here; do not raise thresholds to hide a failing test.
- Revision: reconsider 750k after representative sustained device runs, or when DPR/shadows/shader/vegetation workloads change materially. A validated result names exact device/browser/build/settings/views; one Samsung never validates universal mobile capacity.

## One remaining device-validation step

Run the PB01 build locally/on a private test URL (no production deployment needed) on the primary Samsung. Record **actual** device model, OS/browser versions, build SHA, battery/power-saving state, ambient/device warmth, CSS viewport, drawing buffer/DPR, quality and multi-draw support. Use low, landscape, DPR cap 1, default lights/shadows and fixed door/time state; do not change settings during the run. Open `?debug=1` for existing median FPS/p95 and counts.

Warm up for 2 minutes, then move continuously for **10 minutes**: 0–3 min Library (doors fixed), 3–6 min shed/BOSLUST woodland, 6–10 min garden→manor/conservatory long view. Walk/turn repeatedly, return to each view, record debug values every 30s and first-vs-final minute pacing; note pauses, temperature sensation/throttling, context loss and visible stalls. Remote DevTools may collect rAF intervals for p95/p99, frames >50ms/>100ms and memory estimates; debugger overhead must be recorded. A run of today's lighter scene validates only its observed counts. To validate **750k**, repeat the same run using a reversible isolated fixture of representative authored geometry near 750k at fixed materials/coverage/calls; a tessellated plane or SwiftShader does not qualify. Until such measured workload passes around 30 FPS with stable warmed pacing, retain **DEVICE VALIDATION PENDING**.

## PB01 bounded validation — 14 October 2026

Step 1 published before validation as `e298649515e80af914da2f3f6fbf51f0ba11f809` (tree `a6ce63e07ccc282d8e238ce1e151181575c485ad`, identical to local commit `25199f4`; connector commit metadata differs because CLI push credentials were absent). Typecheck and production build passed; existing large-chunk warning retained. `npm run test:budget`: four targeted policy tests passed (boundary/invalid input, unchanged draw calls, independent relative guards and no hidden 250k condition across the five suites); modified suite syntax checks passed. Functional assertions were not changed; full historical browser regression was not run.

One browser attempt completed within a 180s cap using installed Chromium 141 headless/SwiftShader, 915×412 CSS and buffer, DPR 1, low, shadows off, coarse pointer, multi-draw supported, front/conservatory west doors open. Existing fixed-step autopilot/collision movement plus camera turns produced eight short samples per view. Runtime source is current production's exact source except a budget **comment** in `estateWoods.ts`; therefore this measures the production baseline workload directly, with no candidate scene delta. It is not an estate maximum or a sustained pacing test.

| View | Camera triangle min–max | Max camera calls | Shadow geometry/passes | Result |
|---|---:|---:|---:|---|
| Library interior | 194,948–213,410 | 62 | 0 / 0 | Within PB01 |
| Shed-area woodland | 157,749–170,395 | 42 | 0 / 0 | Within PB01 |
| Garden→manor/conservatory long view | 207,591–215,441 | 139 | 0 / 0 | Within PB01 |

All three: no page/asset errors, no reported shader failures, GL error 0; actual poses, buffer, UA, renderer, multi-draw and memory inventory/attribute-byte estimates in [views.json](pb01/views.json). No Samsung observations, GPU throughput, thermal or FPS claim. A near-ceiling representative hardware load test was not practical here because only a software GPU was available; VFC's favourable-plane software sweep was not repeated. **750k remains provisional and unchanged.** Final central guards retain `golfSpur`'s original named +2-call constraint; no draw-call relaxation accompanies retirement of its old triangle ceiling.
