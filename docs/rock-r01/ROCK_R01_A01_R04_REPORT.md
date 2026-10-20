# FEH LU WE — ROCK-R01 A01-R04: planar hero-boulder sculpt refinement

**Status: REVIEW READY / ART APPROVAL PENDING. This is not a production asset.**
**Repository:** Algolon/Feh-Lu-We
**Branch:** art/rock-r01-geological-assets
**Base for this iteration:** R03 checkpoint 01245669a37a21a2231485ef984da4a140dc7a1c

## Objective and result
Continue the user's positively received R03 direction. Preserve planar, Fortnite-inspired shape readability, while tightening the front-junction geometry and improving the large/medium plane hierarchy without returning to R01/R02's rounded volumetric modeling.

### What changed
1. Broadened the main rock, changed crown and shoulder slopes, and added asymmetric authored plane cuts.
2. Moved the frontal slab's back deeper into the primary mass, reducing the detached/void impression.
3. Replaced inset "picture frame" facets with limited, directional off-centre triangular folds on carefully selected large *front-facing* faces.
4. Removed the harsh starburst facets explored on the rear during the working iteration. The published version leaves the rear intentionally calmer.
5. Preserved a simple, deterministic TypeScript polyhedral half-space clipper. Every new element is isolated from production rocks and batching.

## Source
- `src/world/rockSculptR04Core.ts`: editable, deterministic geometry construction.
- `src/world/rockSculptR04.ts`: isolated Three.js BufferGeometry/vertex-color material adapter.
- `src/world/rockSculptR04Core.test.ts`: numerical invariants, determinism, manifold edge assertions.
- `src/dev/rockR04.ts`, `rock-r04.html`: Vite studio/outdoor orbit preview; no production entrypoint or import.
- `docs/rock-r01/ROCK_R01_A01_R04_REPORT.md`: this report.

## Verified technical evidence
Numerical evaluation on local Node 22 and strict standalone TypeScript checking:
- **R04 refined:** 128 triangles total; main component 84, front slab 44.
- **R04 primary:** 112 triangles, but bounding box changes slightly (at most approx 1.6 cm); no LOD rollout is authorised.
- **R03 refined comparison:** 230 triangles; R04 is around 44% lower. This does NOT imply equivalent performance savings in a real game.
- Measured one-off local generation around 3.7–4.3 ms. Not benchmarked on Android.
- Approximate geometry bounds: X -1.95…1.78 m, Y -0.18…2.464 m, Z -1.29…1.74 m.
- Two individually watertight components with correct outward winding and positive volume, validated via Trimesh; components overlap rather than being boolean-unioned into one manifold.
- Standalone TypeScript `tsc --noEmit --strict --noUnusedLocals` passed on the local sculpt core.
- Seven diagnostic PNG images: studio front/opposite/side/rear/top, outdoor front/opposite. Generated with VTK using actual R04 triangle/vertex-color data.
- The previously noted rear-facing triangular starburst artifact was observed, rejected and removed in the final checkpoint.

## Validation limits
- R04 was **not actually rendered in Three.js/WebGL** in this session (Vite and Three.js dependencies are not locally present).
- Repository-wide npm/Vitest/build/E2E, real device FPS and draw-call measures have not run. The new Vitest tests are authored but not run within the repository.
- No collision integration, UV material parity, instance batching or on-terrain placement was done; these remain later tasks.
- A component that is individually manifold does not establish that the overlapping two-solid assembly is one watertight Boolean union.

## Art assessment against R03 and latest user's Fortnite-inspired images
**Better:** broad horizontal composition instead of tall monolithic stack, asymmetric roofline, larger readable planes, and front buttress that penetrates the main rock. Surface remains deliberately hard-edged rather than rounded clay.
**Still weaker than references:** rear is simpler/flatter than a premium hero asset; the central notch remains a strongly geometric wedge; facets and crevices are still too sparse for the polished handcrafted woodland quality of the approved concept sheet.
**Decision:** present R04 for feedback as a research/art calibration checkpoint, not as accepted final style. Do not expand the library until a visual review of actual Three.js renders confirms the direction.

## Manual review
When dependencies are available in the Feh Lu We clone:
```sh
npm install
npm run typecheck
npm test
npm run dev
```
Visit `/rock-r04.html?view=front&light=studio` and the alternate view/light links in the page. Capture browser evidence and compare side-by-side to the art reference before any production integration.

**No merge, deployment or existing production-rock change was made.**
