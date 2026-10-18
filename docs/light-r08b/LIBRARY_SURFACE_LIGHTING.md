# LIGHT-R08B — Library lighting surface correction

**Scope:** review-only child PR of LIGHT-R08 #118. No ordinary production rollout; the separately published LIGHT-R08 browser preview stays unchanged until the owner accepts a new build.

## Actual observed issues
The owner supplied an Android screenshot of the library banker's lamp and a 16.8 s portrait gameplay recording showing jagged bright and dark polygons travelling over the patterned central rug as the camera moved.

### Root cause — not rigid-body physics
`LightPatches` in `src/interactions/world.ts` is an **InstancedMesh of flat, additive, transparent planes**. It is a cheap stylistic overlay, not a physically occluded light or contact shadow. It has no geometry-aware cutout and cannot decide which side of a table receives light.

- `lamp.library` previously registered a **0.8 m radius** patch at `GF+0.82`; the actual LIB-R02 desk is **1.3 m wide**, top at `GF+0.81`. The disc crossed the desk sides and created a glowing patch suspended alongside the desk.
- `lamp.libraryChandelier` previously registered a **2.6 m radius** disc at `GF+0.03`.
- The central library rug has a **crowned** geometry: in `rugGeo()`, its top varies around `0.012–0.025` above the geometry origin. `libraryR01Furniture()` places it at `GF+0.01`, so the top runs `GF+0.022–0.035`. The chandelier disc at `GF+0.03` passes *through the rug surface*, causing occlusion/polygon discontinuities. The exact world GF is **0.15 m**, not zero.

These are structural problems with geometry-independent decals, not evidence that the engine's existing lighting calculations are inherently broken.

## Implemented targeted fix
1. **No hovering additive planes.** The two problematic library `patch` parameters are conditionally omitted in `manor.ts` only when `R08_SURFACE_FIX` is enabled.
2. **Accurate tabletop footprint.** The existing banker's-lamp room-light shader no longer uses a broad 1.58 m spherical accent. It computes a bounded, downward-biased contribution on the real desktop, around x=72.52..73.84, z-plan 97.84..100.16, y around **GF+0.81**. The contribution is smoothly attenuated around the actual lamp and constrained by the desktop sides. Source intensity still tracks `lamp.library` and does not depend on the player or `LightPool` slots.
3. **Rug is real lit geometry.** The original rug atlas is preserved. Only `mLib` rug materials in the corrected preview use a distinct `surface('fabric')` variant so the fixed library room shader can illuminate **the actual rug triangles**, instead of shining a transparent disc through them. Other rugs/books and atlas materials remain untouched.
4. **Exact same-build comparison:** `?stableRooms=1&r08SurfaceFix=0` reproduces old rendering; `?stableRooms=1` enables the new corrections. This is only on the candidate branch: normal site and `/light-r08/` published snapshot retain their previous content.

## Existing native Three.js lighting vs external physics engines
Physics engines such as Rapier/Cannon model mechanical collisions. They do not provide a new optical shading pipeline for Three.js. Prefer **Three.js's built-in lighting** instead of adopting an unrelated new runtime dependency.

- **Short term (this PR):** use source-state-bound, room-clipped light contributions on actual *receiver surfaces*, preserving material albedo; eliminate transparent additive patches where they intersect or escape geometry.
- **Next shadow study:** one limited `THREE.SpotLight` with a small shadow map, shadow-enabled receiving mesh and occluder, on the *High* quality path only, measured on the real Android target. Keep the previously implemented source-state-bound base light active when the shadowed accent is culled/disabled so no room abruptly goes dark.
- **Scale-up path:** author/bake room lightmaps or ambient occlusion into static room geometry. Requires a confirmed UV2/light-map-atlas contract for `OpaqueBatches` before adoption, plus source-specific toggling and door-state treatment.
- **Avoid broad RectAreaLight rollout:** native `RectAreaLight` does not cast shadows and requires PBR materials. Feh Lu We still uses Lambert/Phong surfaces for a large part of the estate, and introducing dynamic PBR for every source would be a significant fidelity, draw-call and GPU performance change.
- **Never:** make base room illumination appear only when a player crosses a threshold or enters a scarce PointLight pool slot.

## QA gates
- `tests/light-r08b-library-surface.test.ts`: authored desk height, footprint and no light on floor/rug/wall.
- `scripts/light-r08b-library-qa.mjs`: actual estate at fixed camera poses, day and dark, separate desk/chandelier on/off, and structural check that the two fake patches are not registered in corrected mode; run in Low landscape and High portrait on both sides of the feature flag.
- A/B images: examine desk sides, rug pattern, spots of warmth, flicker while walking, and angle dependence. The corrected rug should retain some warm ambient but **never** show the former jagged glowing shapes.
- Track triangles, draw calls, shader variants, browser/GL errors.
- Real Android gameplay art and frame-time approval is a separate gate. CI's SwiftShader screenshots cannot prove phone GPU or thermal performance.

**Current decision:** maintain PR as draft pending complete visual and physical device review. No merge, no Pages deployment, no update to the existing stable LIGHT-R06D experience.
