# Oak reference study — VEG-R03

The owner supplied four references and requested tree trunks and branches first, then bushes, timber/stumps, plants and grass. Requested colours: predominantly green/dark green, with restrained ochre/orange. Pink and fantasy cyan/white are excluded from the tree palette. The supplied images are preserved in `../references/`.

## Implemented first species

All three oak variants have heavier ascending forks, a taller crown, a shared smooth S-bend/twist above 1.6 m, restrained ridge/moss shading and a dedicated long-furrow bark texture. Their lower structural trunk geometry and root footprint remain on the accepted attachment surface; branch placement and fuller upper crowns change. The existing shader/material batches are retained. One additional 256×512 bark texture is used by the preview. Crown colour is baked into vertex colours, so warm foliage does not recolour the bark and adds no material groups.

Three palettes: fresh green, deep green, and olive with upper/outer ochre and muted orange groups. Whole sprays share a hue; no random per-leaf rainbow. The group colour is identical across LODs. Birch, beech, pine, bushes, plants and dead wood retain their recovered models in this study.

`compare.jpg` and `trunks.jpg` show recovered left/candidate right under the same light. `palettes.jpg` shows all three candidate variants. Matched game views are named `recovered-*` and `oak-r03-*`.

## Preview and scope

The existing recovered style remains the default. The candidate is selected with `?vegstyle=woodland-r02&treeart=oak-r03`; append `&multidraw=0` for fallback. Base checkpoint: `ed6ad93`, on the historical recovery base. Current production-branch updates are not integrated. The historical recovery manifest describes its original checkpoint; this study has its own source hashes in `validation.json`.

## Checks

Typecheck, all 303 unit tests, the four unchanged budget-policy tests and production build pass (existing bundle-size warning). The two added model tests check lower-trunk compatibility, finite/bounded geometry, stable mid/far position and colour, and distinct palettes. The flow correction increases longitudinal trunk/branch sampling; foliage topology is unchanged.

Twelve fresh game render records: three poses × recovered/candidate × multi-draw/instanced. No recorded page errors, console errors, shader failures or WebGL errors. Placement inventories match and candidate low-quality camera triangles match between rendering paths.

| View | Recovered triangles | Candidate triangles | Candidate calls multi / fallback |
| --- | ---: | ---: | ---: |
| dense | 309,354 | 340,384 | 59 / 119 |
| garden | 185,216 | 192,544 | 25 / 52 |
| boslust | 351,322 | 378,718 | 91 / 138 |

All three sampled candidate views fit the existing 150-call / 750k ceiling. This is a small comparison matrix, not an estate-wide, portrait, full puzzle-route or physical-phone acceptance test. No budget threshold was changed. Crown silhouettes changed, so sign/clue visibility still needs a complete route review before activation.

Reproduce with `CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r03-oak-review.mjs` (port 5194). `GALLERY_ONLY=1` renders the model comparisons only.

## Next art passes

Review the oak form and colour grouping, then refine beech with smoother grey bark and its own rounded branching; pine with a taller trunk, warm upper bark and evergreen needle shelves; keep birch as the accepted style anchor and add restrained green/yellow variation. After the tree pass, continue with bushes, logs/stumps, ground plants and grass, with each family judged in the actual game.


## Focused bark-flow correction

Owner feedback identified broken flow on the main trunk. The correction adds longitudinal samples through the S-bend and primary forks, eases the bend over a longer interval, averages normals across coincident UV seam vertices, makes the painted grooves periodic in both texture directions, and removes gutter cropping from the dedicated repeating oak bark tile. This addresses angular interpolation and visible repeat/lighting seams. The fork still consists of intersecting trunk/branch surfaces; this is not a claim of a fully retopologized junction.

`before-flow-fix.jpg` preserves the previous trunk comparison. `trunks.jpg` is the corrected comparison (recovered left/corrected right). The lower trunk/attachment regression check and all 303 tests pass. More samples add geometry, so the latest game counts below supersede the earlier claim of unchanged model cost. Physical-device tests remain outstanding.
