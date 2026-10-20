# ROCK-R01 — A01-R03 Authored Planar Hero Boulder

**ART REJECT — experimental calibration only; do not merge or deploy.**

## Purpose and architectural reset

The user's new Fortnite-inspired references demand pronounced angular planes, clear silhouettes and clean stylized geometry rather than the clay-like signed field used in R01/R02. R03 discards the implicit-field/marching-tetrahedra construction in favor of hand-authored convex plane clips.

**The production rock generator and the existing estate vegetation, materials, batching and collisions are all unchanged.** New files only.

## Implemented

- `src/world/rockSculptR03Core.ts`: deterministic pure TypeScript clipping/face construction, one deliberate primary monolith plus an overlapping lower frontal slab; slanted crown, large side bevels, directional planes, restrained local face relief and linear-space vertex colors.
- `src/world/rockSculptR03.ts`: isolated Three.js BufferGeometry and non-metallic material adapter. No GLB or Blender exports.
- `src/dev/rockR03.ts` and `rock-r03.html`: Vite-only camera review scene (studio/outdoor; front/opposite/side/rear/top; wireframe).
- `src/world/rockSculptR03Core.test.ts`: checks for deterministic geometry, finite and nondegenerate triangles, bounds, simple detail levels and seeded variation.

## Measurements (local Node 22, development workstation)

- Refined R03: **230 triangles**, two individually closed/watertight and outward-wound convex components, one render mesh.
- Main: 146 triangles; front slab: 84 triangles.
- Generation: **approximately 4.4–4.6 ms** from local Node runs, not measured on an Android device.
- Sample bounding box: x = -1.76…1.66 m, y = -0.16…2.529 m, z = -1.10…1.75 m.
- Compared with R02's 11,860 triangles, the triangle count for this prototype is approximately 98% lower. This is a geometric comparison, NOT a measured mobile speed-up.
- Pure core passed standalone strict TypeScript typecheck with no-unused-locals.
- Direct Node numerical tests passed determinism, bounds, finite attributes and outward winding.
- Independent Trimesh checks on both components passed watertightness, positive volume and consistent winding.
- Seven PNGs were rendered off-browser using VTK from actual R03 triangle data. Renders are part of the session checkpoint, not automatically committed to GitHub.

## Not validated

- The calibration page has NOT been run in the actual Three.js browser renderer in this execution environment (no installed Three.js/Vite dependencies and network not available).
- Repository-wide `npm run typecheck`, Vitest suite, build, Playwright screenshots and physical Android benchmarks have NOT run.
- No measured draw calls or frame timing; no production integration, collider implementation, new variants, merge or deploy.
- The two closed components overlap; no manifold boolean union of the whole boulder was attempted. The game collision shape still requires separate evaluation.

## Visual assessment against user-supplied references

**Improved:**
- Broad hard facets and angular silhouette explicitly designed instead of smoothed generated lobes.
- More readable large-form construction; two structural masses replace the initial multi-block assembly.
- Drastic geometry simplification while preserving authored polygonal surfaces.

**Still falls short:**
- The front central seam/void remains too large and geometrically abrupt.
- Several secondary inset faces read like cut-out panels; premium handcrafted fracture shaping is still missing.
- Broad rear and side faces resemble a primitive wedge instead of an authored, weathered geological surface.
- No natural-ground integration or actual in-engine material evaluation yet.

**Gate: ART REJECT.** Do not expand the rock family. R04 should focus on a single unified geological main silhouette, a naturally narrowing seam, and 2–3 selected medium facets that follow rock stress structure rather than concentric inset panels. Maintain R03's planar construction and low geometry cost.
