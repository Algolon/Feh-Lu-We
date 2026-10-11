# VCP-01 baseline audit

Source: `Algolon/Feh-Lu-We`, production `ccr-75ef4113-kfkimm` at **3e09c982dcc5c1d1f5790cd818ba949e88fb2323**, verified by `git ls-remote` and clean clone on 2026-10-11 UTC. New branch: `vcp01-library-codex`. Neither proposed craftsmanship branch existed; all DEV-04 and Claude branches left untouched. GitHub open-PR search returned none. No experimental code imported. Pages deploys only the default branch; no deployment changes planned.

## Audit before behaviour changes

Read the requested artkit, kit, surfaces, furniture, dressing, manor, roomdefs, artflags, game, capture/E2E tooling, STYLE_TARGET, INTERIOR_SAMPLE, DEV03 audit and DEV04B report. Older blockout criticism is historical: current tables already have softened tops, tapered legs and aprons; upholstery already has crowned cushions, rolled arms, piping, raked backs and turned feet. Retain these production paths.

Library: double-height `library` / `libGallery`; ground floor 0.15 m. Reading table centre (80.6,101.2), width 1.1, depth 2.2, top 0.81 above floor. East drawer `library.desk`, centre (80.96,0.83,101.2), yaw π/2, unchanged 0.9 × 0.12 × 0.6. Globe (82.4,108.2), collision radius 0.3, height 1.25. Wing chair (74.4,105.4), yaw π/2, 1.0 × 0.9 collider. Study globe (96.2,82.0) stays original.

## Globe source

Exact recovered PNG accessed read-only at historical recovery commit `93206ddbbe03d244438b2ecd97d8284d9f76687f`, path `docs/reference/flw/provenance/recovered/UNASSIGNED_00e56549d519d423.png`. SHA-256 **00e56549d519d423e631ce8f451afa784299ecc5119bd93601ebf7957830c366** matches current SOURCE_INDEX and archive records; 1536 × 1024, 2,394,037 bytes. Inspected actual front, rear, side and detail views. Not copied into this branch. It is the original supplementary `Vintage_wereldbol_reference_UNASSIGNED.png`, not an approved inventory asset. Its embedded FLW-S3-023 label is invalid and conveys no identity or gameplay authority.

Observed source: parchment cartography, muted green land, flat brass meridian band on polar bearings, turned short walnut stem and stepped circular base. It has no wooden horizon ring or tripod. Adapt proportion to the existing floor prop footprint; do not claim exact reproduction or approved fidelity.

## Bounded decision record

1. Globe: sphere with native spherical UVs, small original procedural cartography (not a copy of the reference image), flat-section meridian, polar bearings, lathed pedestal/base. Keep all supports continuous. No map text/clues.
2. Reading table: stronger but restrained leg/joint silhouette, profiled top edge and breadboard ends; keep top, drawer and collider dimensions unchanged. No new tabletop objects.
3. Wing chair: refine the existing upholstery builder with opt-in sculpted wing/back proportions; retain estate family, fabric colour and footprint.
4. Reuse Asm, existing material families/UVs/baked occlusion and ContactShadows. No shared engine retune, shelving work, puzzle or save changes.
5. Extend existing in-memory review entry, with same-pose switching; pilot requires `review=library-craft`. Original remains default.

## Baseline validation and evidence

Before asset edits: typecheck passed; 218 unit tests passed; production build passed (existing large-chunk warning). Untouched build copied outside Git for verification. Capture harness is tooling only, running this untouched build at 844 × 390, DPR 1, low quality. All lit material types, including Phong, are replaced in clay; coloured transparent/shader effects and point lights are removed. Matched neutral illumination uses existing materials. Camera and renderer records accompany the frames.

Rendered baseline inspected: the globe close-up shows raised land pieces and a glossy blue sphere; thin splayed legs leave weak support transitions. Table near: very slender legs and a thin top edge; the drawer and catalogue remain clearly visible. Seating near: existing upholstery is coherent but its rectangular ears/back dominate the silhouette. Wide view: library composition already works; no shelving/architectural changes justified.

Eight viewpoints × standard/neutral/clay captured from the untouched production build in `frames/production/`. Wide: 60 calls / 189,038 triangles; table: 52 / 185,006; alternate: 80 / 236,168. All eight within guides. Baseline DEV-04B: 9/9 passed, 130 interaction IDs, 21 checkpoints, schema 4. These facts precede the pilot build; the baseline binary was preserved in `/tmp/vcp-production-dist` during implementation.

## Subsequent owner direction / production movement

On 2026-10-11 the owner supplied `81891.jpg` (1280 × 853), SHA-256 `15ad835ff83883453e398669aa8b944bd096c5a1030c3d42a4e2e0cfefb525a3`, and explicitly selected it for the library instead. Actual image inspected. Visible design: four turned timber legs, broad wooden horizon ring, brass meridian, crossed lower rails and turned centre support. Its embedded `FLW-RSV-020` title does not automatically rewrite the independent inventory/recovery registers. This pilot follows the owner's supplied design instruction. Earlier pedestal globe retained as an unplaced variant for a future room.

A later read-only production check resolved `ccr-75ef4113-kfkimm` to `f26e5637a677a49dcdd2eadca3b49224de364652` (merged DEV-04D D1/D1-R/D2). VCP-01 still starts from the originally verified SHA, and has not overwritten or imported that work. Reconciliation and new-baseline regression are outstanding before integration.

The first audit's 60/189,038 wide-view counters were stale-frame readings. Final explicit-render baseline counters are 58/201,558; see the quality report and machine records. The correction does not alter the untouched-baseline provenance.
