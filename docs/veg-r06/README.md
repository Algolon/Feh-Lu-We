# VEG-R06 — grass fields and dirt paths

Local ground-surface review on top of the accepted R05 vegetation. Existing references give the direction: natural greens, soft painterly masses and readable earth paths. The change is procedural canvas albedo, using the game's existing material and world UV scale.

## Surface changes

Grass replaces the aligned bright dashes and large spots with low-contrast periodic colour fields and small curved brush fans in varying directions. The palette stays near the existing grass mean (#8fb35a), which the woodland terrain's vertex tints use for their colour compensation. The terrain's broad dry/lush zones and lighting remain active.

Dirt replaces conspicuous large circular blotches with restrained fine aggregate, subtle compacted-earth colour drift and short broken scuffs. It uses a 512×512 texture (previously 256×256), at the same world UV scale. This adds approximately 1 MiB of uncompressed RGBA mipmapped texture memory. The shared dirt material also supplies related earth surfaces and existing feathered path verges.

The fields interpolate a periodic lattice. Brush marks are sampled once and copied identically across intersected tile borders. Mipmaps, repeat wrapping, sRGB sampling and existing anisotropy remain in use. No new samplers, shaders, geometry, draw calls, positions or collision changes are introduced. Existing terrain vertex colours, path widths, junction ownership and verge geometry are retained.

`grass-compare.jpg` and `dirt-compare.jpg`: previous left / new right, one tile. `*-repeat.jpg`: three texture repeats each direction to inspect seams and repetition. In-game `previous-*` uses R05; `r06-*` adds this texture stage. Studio panels use the existing ground material profile; matched game cameras provide the controlled comparison at identical world positions.

## Runtime selection

Opt-in: `?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r06`. Omit `groundart` for the accepted R05 surface. Append `&multidraw=0` for instanced fallback. The default recovered style remains unchanged. This is a local checkpoint on the historical recovery base; later production-branch work has not been integrated or deployed.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r06-review.mjs` uses local port 5198. `GALLERY_ONLY=1` limits the run to texture panels. Tests of periodicity and mean albedo are in `tests/groundTexture.test.ts`; browser panel statistics also sample the painted canvas, including brush marks.

## Fresh validation

Typecheck, 311 unit tests, four unchanged budget-policy tests, production build and whitespace checks pass. The existing bundle-size warning remains. Under high host load, initial default test/browser runs timed out; the successful complete test run uses one worker and a 30-second per-test timeout. Product rendering thresholds were not changed. Tests verify periodic fields across positive/negative tile boundaries, opaque deterministic pixels, and the mean albedo needed by the terrain's tint calibration. Browser measurements of the complete painted texture also stay within three sRGB byte values of the target mean in every channel.

Twenty-eight game render records: six low-quality views and one high-quality sun-shadow control × R05/R06 × multi-draw/instanced. No recorded page exceptions, console errors, shader failures or WebGL errors. Draw calls and triangle counts are identical before/after for every sampled view in each render path. Placement inventories are also identical.

| View | R05 and R06 triangles | Calls multi / fallback |
| --- | ---: | ---: |
| dense | 455,580 | 59 / 119 |
| garden | 273,908 | 25 / 52 |
| boslust | 474,202 | 91 / 138 |
| woodland-east | 415,196 | 38 / 102 |
| ground-dense | 335,648 | 51 / 100 |
| ground-garden | 192,400 | 23 / 34 |

All six sampled low-quality views fit the unchanged 150-call / 750k-triangle ceiling. High-quality counts include shadow passes. Browser output does not establish physical-phone frame pacing, heat or shimmer performance; texture memory increases as described above. No fresh portrait or full puzzle-route walkthrough is claimed.
