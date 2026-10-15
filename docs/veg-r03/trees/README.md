# VEG-R03 — next tree families

The owner accepted the smoother oak trunk (`a0c1937`) and requested the next trees. This continuation refines all three beech and all three Scots pine variants and adds natural foliage colour variation to the three accepted birches. The earlier reference images and colour brief remain in `../references/` and `../oak/README.md`.

## Species changes

- **Beech:** a gently curved smooth grey leader, heavier rising forks, rounder/wider leaf groups, subtle cool bark mottling and fresh-green/deep-green/olive-with-ochre palettes. The latest relief correction uses broad geometric folds plus growth-aligned procedural bump shading; the old stretched smooth atlas column is not sampled.
- **Scots pine:** a subtly curved tall trunk with denser longitudinal sampling and averaged UV seam normals, a separate subtle elongated-scale bark texture, warmer upper bark and three evergreen needle palettes. Its original open high crown, irregular branch whorls and dead stubs are retained and refined. Orange is confined to the bark; needles remain green.
- **Birch:** accepted stem, branches and crown geometry are preserved exactly; only coherent green, deeper green and yellow-green foliage palettes are added. No pink, cyan or white foliage.
- **Oak:** approved geometry and palettes are retained; the shared normal helper is extracted without altering the output. Regression tests compare all attributes between the oak-only and complete-tree selections.

Oak and pine retain their low attachment rings through 1.6 m; birch geometry stays unchanged. The later beech relief pass preserves the grounded root footprint below .2 m, with sculpted folds above it as requested. Beech/pine upper trunk curves change. Stem/branch junctions still consist of intersecting surfaces, not a claim of complete junction retopology. Bushes, fallen wood, stumps, ground plants and grass await their own art pass.

## Inspect

`beech-compare.jpg`, `pine-compare.jpg`, `birch-compare.jpg`: previous left/new right under matched studio light. `*-trunks.jpg` are close views; `*-palettes.jpg` show all three variants. The game frames compare `oak-r03-*` against `trees-r03-*`, so the baseline already includes the approved oak.

Opt-in preview: `?vegstyle=woodland-r02&treeart=trees-r03` (`&multidraw=0` for instanced fallback). The recovered style remains the default; `treeart=oak-r03` retains the oak-only study. This checkout still uses the historical recovery base; later default-branch work is not integrated. There is no push/merge/deployment in this art pass.

## Validation

Typecheck, 306 unit tests, four unchanged budget-policy tests and production build pass. The existing large-bundle warning remains. Three additional model checks cover approved-oak/birch preservation, beech/pine lower attachment rings, finite geometry/unit normals and stable foliage positions/colours at mid/far.

Twenty fresh game records: four low-quality poses plus one sun-shadow control × previous/new × multi-draw/instanced. No recorded page exceptions, console errors, shader failures or WebGL errors. Low-quality triangles match across rendering paths and placement inventories are identical.

| View | Previous triangles | New triangles | Change | Calls multi / fallback |
| --- | ---: | ---: | ---: | ---: |
| dense | 340,384 | 398,430 | +17.05% | 59 / 119 |
| garden | 192,544 | 213,554 | +10.91% | 25 / 52 |
| boslust | 378,718 | 424,298 | +12.04% | 91 / 138 |
| woodland-east | 292,938 | 348,032 | +18.81% | 38 / 102 |

All four sampled low-quality camera views fit the existing 150-call / 750k ceiling. Curved stems add geometry, and the original vegetation-renewal increase remains in addition to these incremental costs; passing the absolute ceiling does not waive relative-growth review. No budgets or assertions were relaxed. High-quality totals include shadow passes and conservative fallback shadow casters and are not compared with the low-quality camera ceiling.

The sampled BOSLUST sign and outdoor paths remain readable. No full puzzle-route walkthrough, physical-phone performance/heat/shimmer test or new portrait matrix is claimed.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r03-tree-review.mjs` uses local port 5195. `GALLERY_ONLY=1` bounds the run to model comparisons. The studio renders actual Three.js geometry/materials. Source hashes and check results are recorded in `validation.json`.


## Beech bark correction after visual feedback

The owner identified that the updated stem still appeared to stretch the initial bark texture. The beech model now marks its wood separately and the shared material shades it from continuous three-dimensional model-local positions, rather than sampling the original smooth atlas strip. Soft broad mottling and fine shallow-looking tonal grain stay at a fixed model-space scale, including across stem/fork surfaces. This is colour shading, not added geometric relief or junction retopology.

That historical colour-only correction added no texture, geometry or material draw group; it is superseded by the relief pass below. It preserves the accepted shape, foliage and other species. The shared shader has a separate program key for the new bark path. Fragment cost has not been benchmarked on a physical phone.

`beech-before-bark-fix.jpg` preserves the preceding studio comparison. In the regenerated `beech-trunks.jpg`, the right-hand tree has the new bark. The left-hand reference is the older recovered tree, as in the original review script; it is not the immediately preceding curved-beech geometry.


## Sculpted beech relief — 16 October 2026

The owner rejected the flat result and supplied a sculpted-tree reference (`../references/05-sculpted-relief.png`). The beech now uses broad geometric flutes in the trunk and major forks, with extra circumferential samples on near/mid branches. Displacement is limited by each tube's radius (up to 5.5 cm on the thick stem, proportionally smaller at branch tips). It grows from .2–1 m above the grounded root footprint. The regression check intentionally now protects the beech's grounded roots, rather than requiring an unchanged surface all the way to 1.6 m; the requested relief changes that surface. Other species' constraints are unchanged.

Finer grooves use growth-aligned procedural height/bump shading. They react to directional light, run along branches instead of cutting vertically across them, and fade from 24–48 m to reduce distant fine-pattern noise. Broad pigment mottling remains continuous in model-local space. This combines real shape with normal detail, not just painted colour. Fine bump grooves do not create shadow geometry; the broad geometric folds do. Junctions remain intersecting surfaces rather than fully retopologized unions.

`beech-before-relief.jpg` preserves the rejected flat pass. `beech-relief.jpg` shows the updated model under raking light; the right-hand model is the new candidate, the left-hand model the older recovered reference. `beech-trunks.jpg` shows normal studio lighting. The other species and all foliage retain their previous art.

Fresh typecheck, 306 tests and production build pass. Fresh game/shader measurements are in `results.json` and `validation.json`. Added geometry is accounted for in the updated table; fragment cost and shimmer still require physical-phone validation. No material draw groups or textures were added by this pass.

The fine groove contrast and bump contribution are filtered by projected pattern footprint as well as distance, to reduce unresolved stripes on thin branches. Physical-device movement still needs review.
