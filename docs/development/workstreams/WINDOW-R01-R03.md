# WINDOW-R01-R03 — seamless billiard plaster wall (fix opdracht)

**Status:** candidate fix on `window-r01-billiard-glazing-pilot` / draft PR #63. Do not merge or deploy without owner review. Production and other facade windows are out of scope.

## Defect
The new physical billiard-window aperture slices the north facade (and its thin interior plaster skin) into multiple rectangular boxes. They sit flush, but vertical bright/dark panels remain visible on the interior wall in the owner's 16 October screenshot. This reads as mismatched wall pieces rather than one continuous masonry/plaster surface.

## Verified root cause
1. `src/world/kit.ts` `Batcher.add` applies deterministic **per-added-part vertex-color jitter** with default `jitter=0.04`. Before the window, a whole wall face had one tint; aperture slicing produces multiple independent tints.
2. `boxGeo` assigns UV coordinates **relative to each box's local start**, so the plaster texture resets at every split, accentuating the bands.
3. These are rendering/material-coordinate defects. Wall collision, glazing placement and visibility culling are not the cause and must remain unchanged.

## Fix contract
- For **walls with an explicitly opt-in transparent window only**, supply every opaque box segment to the existing batcher with `jitter:0`. No procedural tint changes across segments.
- On broad wall faces, derive U from the global along-wall coordinate (plan X for axis X walls, plan Z for axis Z walls), V from world height, divided by the wall's existing repeat scale. Opposite faces and pieces thus sample the same coordinates at shared edges. Do not change local UV on narrow end faces; existing textures remain shared.
- Leave normal opaque-window walls and their deliberately painterly per-part variation untouched; no additional draw calls or materials; no arbitrary seam-cover geometry.
- Keep the single outer sash/pane, inset depth, plaster jamb reveals, interior wooden window board, glass collision, doorway state, and selective visibility unchanged.

## Acceptance tests
1. Static unit tests: adjoining cut panel vertices map to equal UV coordinates across seams on both wall orientations; every cut piece receives exactly the same vertex tint.
2. `npm run typecheck`, `npm test`, `npm run build`.
3. Existing WINDOW-R01 browser fixed poses (head-on and oblique; inside/outside; door open/closed; low/high); GL error 0 and physically solid but visually clear window.
4. Examine new **actual screenshots** for vertical wall colour bands to the sides of the window and compare with the previous R02 screenshots, not the simulated model or a mockup.
5. Confirm representative render cost and original regions do not regress. No assertion about physical Samsung FPS from the software renderer.

## Rollout gate
Close as an isolated R03 patch on draft PR #63 for owner approval. No merge/deployment, no rollout to all estate windows.
