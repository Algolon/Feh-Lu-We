# GRASS-R01 — isolated premium grass family calibration

**Status: SOURCE PROTOTYPE PREPARED / ART VALIDATION PENDING.** No screenshots from a running Three.js build and no device timings were produced in this session. Do **not** mark this artwork accepted or integrate it into production on the basis of this report.

## Verified current architecture

Inspected the repository's default branch `ccr-75ef4113-kfkimm` (20 Oct 2026), specifically:

- `src/world/woodkit.ts`: legacy `grassModel()` (four variants), plus the **actually selected** `referencePlantModel('grass', variant)` with 7–11 blades, three segmented folds, vertex-colour shading, double-sided triangles, and optional seed stems. The default `FULL_NATURE` flag selects this reference version.
- `src/world/boslustSample.ts`: `PlantBatch.add()` chooses the geometry factory, shares four geometry variants, and quantises near/mid distance fade by shrinking instances; `mat()` handles coordinates and instance transforms.
- `src/world/vegbatch.ts`: existing `BatchedMesh` multi-draw renderer with packed `InstancedMesh` fallback and per-instance frustum culling.
- `src/world/woodlandPlan.ts`: grass placement on verges and open ground, seeded placement, path exclusion and slight per-instance tint.
- `src/world/estateWoods.ts`: estate placement and rendering integration. **Not changed.**
- `src/world/foliageStyle.ts`: shared `FULL_NATURE` style selection. **Not changed.**

### Morphology diagnosis (code-level hypotheses, not screenshot findings)

1. 7–11 blades across the four active variants risks an open/spiky profile if clumps are scaled up to imply a dense meadow.
2. Three linear blade intervals provide limited scope for curving blade shoulders and apexes.
3. Variant-level palettes and base-to-tip gradients already exist; they should be improved, not reimplemented as independent random RGB values.
4. The current variant mapping includes a **seed-head clump at index 2**. The R01 morphology study instead has a *short ground-grass* variant at index 2. These semantics MUST be reconciled before any replacement or mapping into `woodlandPlan.ts`.
5. Existing distance fade is scale-based and quantised. It may expose shrink/pop artifacts against continuous dense meadow ground coverage; evidence is still needed.

## Isolated prototype

`src/reviews/grassR01Model.ts` contains four deterministic grass mesh families, using existing `mulberry32`, `twoSided`, `THREE.BufferGeometry`, vertex colours and the FrontSide foliage material contract. No canvas textures, alpha cards, separate asset format, wind shader or dependency.

| Variant | R01 meaning | Blades | Nominal height | Theoretical triangles per clump |
|---|---|---:|---:|---:|
| 0 | Medium lush meadow | 15 | 0.52 m | 480 |
| 1 | Tall wild grass | 13 | 0.76 m | 416 |
| 2 | Short ground grass | 12 | 0.29 m | 384 |
| 3 | Directional woodland | 13 | 0.57 m | 416 |

Nominal height is a design parameter, not the rendered tip elevation, which varies by root shape and droop. The triangle counts are computed from blades × 4 longitudinal segments × 4 front-face triangles per segment × 2 faces; actual submitted camera triangles depend on instances and culling.

Colour profiles: `meadow` (dark cool rooted green → natural medium green → yellow-green tips); `woodland` (muted brown-olive roots → warm ochre body → straw highlights). Root and tip palettes are spatially coherent within each clump; per-blade tone differences are restricted.

**Potential cost:** several R01 variants contain substantially more geometry than the active baseline. Do not infer mobile affordability from low draw-call count. No performance budget has been relaxed.

## Run local calibration without changing production

1. On the isolated branch: `npm ci`; `npm run typecheck`; `npm test -- tests/grassR01Prototype.test.ts`.
2. Start Vite with `npm run dev` (do not build/deploy Pages).
3. Open the following dev-only page on the same machine: `http://localhost:5173/grass-r01.html?palette=meadow&family=prototype&view=mid`.
4. Use the page controls to switch `palette=meadow|woodland`, `family=prototype|baseline`, and `view=close|mid|wide`. Each change reloads the fixture using the same deterministic scatter seed.
5. Repeat matched views with `?multidraw=0` for the instanced fallback. For a desktop woodland-shadow stress study add `&shadows=1`, noting this is **not** the mobile-low benchmark. Default is DPR 1 and shadows off.
6. Review at 390×844 and a representative landscape-mobile viewport and run the same paired test on the primary Android device once available.

The standalone fixture models an undulating ground with terrain-colour blending, a meandering bare path, rock-clearance buffers, coherent scatter patches, four prominent specimen clumps and optional woodland shadow proxies. It uses the **existing `makeVegBatch`**, not an alternate renderer. It does not use the production `PlantBatch` wrapper, so the current production range-shrink fade is **not** under test yet.

The Vite project has a fixed two-entry production bundle (main + family). `grass-r01.html` is deliberately **excluded** from that bundle, and no production import points to the R01 module.

## Acceptance checks and required evidence

Render and compare baseline/prototype at fixed viewport, camera and palette. Capture:

- Four individual clumps / near gameplay-height silhouette views
- Mid and wide lush-meadow coverage, especially soil-to-blade continuity and path edges
- Golden woodland palette under direct light and under shadow, including the optional shadow stress
- Rock-contact clearances, seed-stable repetition and colour noise
- Desktop multi-draw vs forced instanced-fallback comparisons
- Mobile viewport rendering, camera submitted triangles, draw calls, approximate frame pacing and (on physical device) sustained performance

Suggested files under `docs/grass-r01/evidence/`: `B1_clumps_meadow_close.png`, `M1_meadow_mid.png`, `M2_meadow_wide.png`, `W1_woodland_mid.png`, `W2_woodland_shadow.png`, `F1_mobile_viewport.png` plus a JSON or Markdown performance summary.

**Budget guard:** existing PB01 mobile-low ceiling is a **provisional 750,000 submitted camera triangles**, guidance **150 draw calls**, around 30 FPS with pacing analysis. No hardware validation of that ceiling exists. The fixture prints renderer calls and triangles and a rough browser FPS sample; it is not a certified device measurement or production-view benchmark. Compare absolute counts and deltas, not just counts of geometries or scene objects.

## Explicit stop / release gate

- Source prototype, fixture and deterministic geometry tests: created on isolated branch; **not yet run**.
- Static screenshots and actual visual comparison: **not captured**.
- Mobile GPU measurements / acceptance: **not run**.
- Shader wind, alternate LOD, terrain-wide coverage, `woodlandPlan.ts` integration and production grass replacement: **not attempted**.
- No merge or deployment requested or performed.

**Next action:** run `typecheck`, focused tests, start the dev-only fixture, capture identical before/after views and review aesthetics **before** any subsequent iteration. If silhouette/continuity/repetition fails, adjust only `src/reviews/grassR01Model.ts` and repeat; otherwise request approval to explore safe production integration or wind.
