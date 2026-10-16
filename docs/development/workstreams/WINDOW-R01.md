# WINDOW-R01 — real billiard glazing pilot
Production base: `76f410a31cc80e2617267bd3693e52aa9f55ae96` on `ccr-75ef4113-kfkimm`.
Review branch: `window-r01-billiard-glazing-pilot` (no merge or deployment planned).

## Scope
- The existing glass `door.billiardOut` gets the same `seeThrough: true` portal setting as `door.kitchenBack`. Original glass collider, visual-only collision exception, animation and save state remain.
- The specific north-facing billiard window at X88 / Z109.8 is opt-in. Remove the opaque wall material and interior plaster *only inside the aperture*, while preserving the exterior stone surround, sash, bars, sill and interior trim. Add one pane inset in the 40 cm wall, modest translucent glass material, painted jamb returns and a solid collision/picking barrier.
- Room portal culling may traverse this *one* window only if its actual aperture is in camera range/cone and a sampled ray makes it through the wall. Adjacent old windows remain opaque. Outside-to-inside is capped at 25 m; inside-to-outside at 40 m. The existing outdoor woodland view cone and region limits remain applicable.
- No realtime reflection, refraction, planar render target, camera duplication or full-house through-window render override.

## Review gates
1. Typecheck, all unit tests and release build.
2. Fixed-pose before/after gameplay screenshots from the biljartkamer and the north garden: door closed, opening, open and closing; day/night, mobile low and desktop high; both directions through the pilot pane. Confirm correct window glass tint and depth without empty sky or false white panels.
3. View transitions: center, oblique, behind the neighbouring solid wall and from adjacent rooms. Record flicker/false positives and check that furniture/vegetation only render when actually in view.
4. Collision: can't walk or pick objects through glass; line of sight through opaque wall must still be blocked. Verify neighbouring windows and all other gameplay remain unchanged.
5. Compare the same poses/settings with baseline: actual camera draw calls + triangles, shadows, render buffer/DPR and GL errors. Mobile-low guidelines remain 150 draw calls and the provisional 750k submitted triangles. Run sustained frame pacing on the owner's Android before claiming stable device FPS.

This commit is an implementation candidate, not device or screenshot validation. Do not roll it out to every window until the pilot passes.
