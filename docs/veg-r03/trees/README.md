# VEG-R03 — next tree families

The owner accepted the smoother oak trunk (`a0c1937`) and requested the next trees. This continuation refines all three beech and all three Scots pine variants and adds natural foliage colour variation to the three accepted birches. The earlier reference images and colour brief remain in `../references/` and `../oak/README.md`.

## Species changes

- **Beech:** a gently curved smooth grey leader, heavier rising forks, rounder/wider leaf groups, subtle cool bark mottling and fresh-green/deep-green/olive-with-ochre palettes. Its own smooth bark atlas is retained; oak furrows are not reused.
- **Scots pine:** a subtly curved tall trunk with denser longitudinal sampling and averaged UV seam normals, a separate subtle elongated-scale bark texture, warmer upper bark and three evergreen needle palettes. Its original open high crown, irregular branch whorls and dead stubs are retained and refined. Orange is confined to the bark; needles remain green.
- **Birch:** accepted stem, branches and crown geometry are preserved exactly; only coherent green, deeper green and yellow-green foliage palettes are added. No pink, cyan or white foliage.
- **Oak:** approved geometry and palettes are retained; the shared normal helper is extracted without altering the output. Regression tests compare all attributes between the oak-only and complete-tree selections.

All species retain lower trunk/root attachment rings through 1.6 m. Above that, beech/pine trunk curves change. Stem/branch junctions still consist of intersecting surfaces, not a claim of complete junction retopology. Bushes, fallen wood, stumps, ground plants and grass await their own art pass.

## Inspect

`beech-compare.jpg`, `pine-compare.jpg`, `birch-compare.jpg`: previous left/new right under matched studio light. `*-trunks.jpg` are close views; `*-palettes.jpg` show all three variants. The game frames compare `oak-r03-*` against `trees-r03-*`, so the baseline already includes the approved oak.

Opt-in preview: `?vegstyle=woodland-r02&treeart=trees-r03` (`&multidraw=0` for instanced fallback). The recovered style remains the default; `treeart=oak-r03` retains the oak-only study. This checkout still uses the historical recovery base; later default-branch work is not integrated. There is no push/merge/deployment in this art pass.

## Validation

Typecheck, 306 unit tests, four unchanged budget-policy tests and production build pass. The existing large-bundle warning remains. Three additional model checks cover approved-oak/birch preservation, beech/pine lower attachment rings, finite geometry/unit normals and stable foliage positions/colours at mid/far.

Twenty fresh game records: four low-quality poses plus one sun-shadow control × previous/new × multi-draw/instanced. No recorded page exceptions, console errors, shader failures or WebGL errors. Low-quality triangles match across rendering paths and placement inventories are identical.

| View | Previous triangles | New triangles | Change | Calls multi / fallback |
| --- | ---: | ---: | ---: | ---: |
| dense | 340,384 | 380,476 | +11.78% | 59 / 119 |
| garden | 192,544 | 211,090 | +9.63% | 25 / 52 |
| boslust | 378,718 | 414,572 | +9.47% | 91 / 138 |
| woodland-east | 292,938 | 328,094 | +12.00% | 38 / 102 |

All four sampled low-quality camera views fit the existing 150-call / 750k ceiling. Curved stems add geometry, and the original vegetation-renewal increase remains in addition to these incremental costs; passing the absolute ceiling does not waive relative-growth review. No budgets or assertions were relaxed. High-quality totals include shadow passes and conservative fallback shadow casters and are not compared with the low-quality camera ceiling.

The sampled BOSLUST sign and outdoor paths remain readable. No full puzzle-route walkthrough, physical-phone performance/heat/shimmer test or new portrait matrix is claimed.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r03-tree-review.mjs` uses local port 5195. `GALLERY_ONLY=1` bounds the run to model comparisons. The studio renders actual Three.js geometry/materials. Source hashes and check results are recorded in `validation.json`.
