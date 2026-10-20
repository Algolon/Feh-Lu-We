# FEH LU WE — ROCK-R01 / HeroBoulder_A01 calibration checkpoint

**Decision: ART REJECT — research prototype only.** Neither production-ready nor visually approved. Do not merge or deploy.

## Files
- `src/world/rockSculpt.ts` — standalone deterministic signed-field / marching-tetrahedra generator, authored polyhedral planes for core, shoulder and foreplate, restrained color and structural indents
- `src/dev/rockR01.ts` — independent interactive Three.js calibration scene with orbit, camera presets, studio/outdoor light, and mesh metrics
- `rock-r01.html` — root-level Vite review entry; not wired into the production estate
- `src/world/woodkit.ts`, `estateWoods.ts`, `vegbatch.ts`, `foliageStyle.ts` — **unchanged**

## Inspect
Run the existing repository's package installation, then `npm run dev` and open:
- `/rock-r01.html?light=studio&view=front`
- `/rock-r01.html?light=studio&view=opposite`
- `/rock-r01.html?light=studio&view=rear`
- `/rock-r01.html?light=studio&view=top`
- `/rock-r01.html?light=outdoor&view=front`
- `/rock-r01.html?light=studio&view=front&wire=1`

Options: `seed=37`, `step=0.12` by default. Drag to orbit, scroll to zoom.

## What has actually been tested
- Reviewed current existing rock/forest material and batching source on the source branch.
- TypeScript **syntax transpilation** using local TypeScript. This is **not** full repository typechecking.
- Ran the generator in a local JavaScript VM with lightweight mock Three classes only to inspect numeric geometry.
- `step=0.12`: **22,016 triangles**, numeric generation around **7.8 seconds**, local CPU test; AABB about **3.82 × 2.82 × 2.65 metres**, centered near the origin.
- `step=0.18`: **9,812 triangles**, numeric generation around **3.5 seconds**, local CPU test.
- No NaNs observed in those position/normal arrays.
- CPU/software triangle projections were generated for front/opposite/rear/top/outdoor; **they are not screenshots of Three.js, Blender, or browser rendering**.
- No WebGL screenshot, production build, browser runtime, mobile FPS, frame timing, instancing, collision or draw-call measurement has been performed.

## Why art is rejected
1. Overall mass still reads too much as several assembled, softly rounded blocks, rather than one convincing geological structure.
2. Intended large/medium plane hierarchy is not yet strong enough; continuous normals soften the authored faceting.
3. The inset front plate and cleavage do not yet resolve into an attractive, natural form from all angles.
4. Uniform volumetric sampling produces many triangles and long CPU build times without commensurate sculptural refinement.
5. Exact style comparison to the supplied A1 reference, via actual Three.js screenshots, is still pending.

## Architecture findings
Production `rockModel(seed)` in `woodkit.ts` uses roughly 11–14 jittered ellipsoid points, `ConvexGeometry`, creased normals, vertex colors and UVs. Estate rocks are currently instanced/batched via `PlantBatch` and `woodMats().rock`; keep both untouched. The new generator can make concave/recessed shapes, but that does not imply premium quality.

## Recommended next technical iteration
- Keep the authored control planes, but reduce over-smoothing of the junctions between the primary masses.
- Replace general-purpose tetrahedral sampling with targeted topology or an optimized surface extraction/retopology step.
- Establish three or four strong silhouette/control-plane targets from A1 **before** adding incidental weathering.
- Rework normals per geological plane, preserving distinct hard breaks and short softened bevel transitions.
- Capture actual browser screenshots at fixed views under both lighting rigs; reject if it still resembles primitive rounded blocks.
- Measure generation cost and submitted triangles before introducing batching or LOD.
- Remain in this isolated branch. Do not change production rock families, merge, deploy, or expand the library.
