# FEH LU WE — ROCK-R01 / A01-R02 geological calibration

**Decision: ART REJECT.** This branch is an experimental sculpt study. Not approved for merge, deployment or reuse across the estate.

## Source architecture

- New isolated TypeScript core: `src/world/rockSculptR02Core.ts` (no Three.js required to evaluate).
- `src/world/rockSculptR02.ts` is a narrow Three.js adapter with indexed geometry and authored per-vertex color/normal attributes.
- `src/dev/rockR02.ts` + `rock-r02.html`: separate Vite/Three.js browser calibration scene, not referenced by production.
- `src/world/rockSculptR02Core.test.ts` adds targeted Vitest unit tests. These were authored but have **not** been run with Vitest here because the repository's npm dependencies could not be installed in this environment.
- Production `woodkit.ts`, `estateWoods.ts`, `vegbatch.ts`, `foliageStyle.ts`, and the existing `rockModel(seed)` are unchanged.

R02 sculpts a central authored plane hull plus two interlocking geological masses, and adds shallow structural cutting grooves. It replaces the old convex-only limitation in a *separate* prototype, not in production. The field triangulation is deterministic; morphology does not come primarily from noise.

## Geometrical tests (actual executed source)

Node.js ran the TypeScript core as transpiled JavaScript, outside Three.js. `tsc --strict --noEmit --target ES2022` passed for the self-contained core.

| Mesh step | Triangles | Unique positions after weld | Watertight | Winding consistent | CPU generation |
| --- | ---: | ---: | --- | --- | ---: |
| 0.16 m (review default) | 11,860 | 5,932 | Yes | Yes | ~199 ms |
| 0.20 m (experimental coarse) | 7,844 | 3,924 | Yes | **No** | ~139 ms |

Default AABB: **3.37 × 2.87 × 2.91 m**; local bottom at **y = −0.12 m**. One connected component. The default mesh positions and normals are finite. Source seed variation and fracture depth are active.

**Important:** The coarse mesh has inconsistent triangle winding under topology analysis. This variant is NOT an accepted LOD. The default mesh uses unindexed polygonization in its core and an adapter that deduplicates vertex attributes. GPU performance of the adapter remains untested.

The earlier R01 numeric result was about 22,016 triangles, so R02 default reduces triangles by ~46%. Generation timings are single observed local CPU times; they are not benchmarks and not mobile data. No runtime allocation, draw-call or FPS measurements have been performed.

## Rendering evidence

`r02-studio-{front,opposite,rear,side,top}.png` and `r02-outdoor-{front,opposite}.png` are actual 3D GPU rasterized mesh projections using **VTK**, evaluated from the TypeScript output. They are NOT Blender renders, Three.js renders or captures from the live estate. Calibration scene source is present but its WebGL execution was not available for testing here (no local Three.js/node_modules; npm registry DNS unavailable).

## Artistic review

- **Improved:** asymmetry, one integrated water-tight stone mass, more deliberate front plate and rear shoulder, more legible core facets. Concave cuts now represent actual geometry rather than shading-only grooves.
- **Still rejected:** some transitions between the three structural regions read as a procedural assembly, the large facets are sometimes overly flat and elsewhere too softly rounded, and cleavage shapes look artificial from oblique views. The VTK material preview remains too neutral and does not convincingly match the polished painterly blue-grey treatment of the A1 reference.
- There is no demonstrated premium final multi-angle quality; do not label this asset production-ready.

## Suggested R03 before acceptance

Prioritize silhouette and secondary geological planes before adding stone texture/noise. Re-author the fractured contact between the front plate and rear mass; introduce controlled planar bevel surfaces at the major edges; repair coarse LOD winding; capture actual Three.js screenshots from browser at matching camera poses; verify mobile memory and triangle submissions. Stop at single hero until art approval.

## Reproduce

With the Feh Lu We repo dependencies installed, visit `http://localhost:5173/rock-r02.html` after `npm run dev`. Use query parameters for `view=front|opposite|rear|side|top`, `light=studio|outdoor`, `wire=1`, `seed=37`, `step=0.16`. The standalone core also runs without Three.js, for example via the included offline generation script in the accompanying local checkpoint.

No production assets replaced, no merge, no deploy.
