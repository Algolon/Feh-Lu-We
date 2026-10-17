# LIGHT-R06C — Current-production lighting integration review

**Status:** technically validated review candidate; **PRODUCTION HOLD**.  
**Target:** production `ccr-75ef4113-kfkimm` at **`2e2bab141adc7a0687f8a458981463a019cdc201`**.  
**Source:** reviewed LIGHT-R06B draft PR #110 (code `d2ddd83a`), ported without unrelated changes.  
**Original lighting issue:** #98. Complementary global-environment diagnostic: draft PR #113.

## Scope and integration

The 23 commits after the original R06B base changed the stairs/architecture and related QA, **not** `src/core/game.ts` or `src/world/estate.ts`; their pre-R06B file contents were byte-identical to current production before the port. LIGHT-R06C therefore retains all production updates while carrying only these lighting changes:

- `src/world/stableLighting.ts`: opt-in, source-status-controlled, spatially bound shader contribution from `fire.living` and `lamp.livingFloor`.
- `src/core/game.ts`: while pilot is active, these two sources no longer compete for the 3/4 dynamic `LightPool` slots; the other lamps are unchanged.
- `src/world/estate.ts`: install dedicated interior material variants before opaque aggregation.
- Test and QA scripts. No changes to vegetation, stairs, geometry, windows, puzzles or art assets.

**Normal game URLs are unchanged.** The pilot is only active with `?stableLiving=1`; `&noPoint=1` is a stricter demo disabling all pooled pointlights. These flags are for local branch previews, not links to the default GitHub Pages production deployment.

## Full validation against actual current production

Five-job GitHub Actions run **[39050422515](https://github.com/Algolon/Feh-Lu-We/actions/runs/39050422515)**: **PASS** for `npm ci`, typecheck, **499/499 Vitest tests** (66 files), 4/4 budget tests, production build, and four actual-scene comparisons:
- current production **Low / landscape**
- R06C candidate **Low / landscape**
- current production **High / portrait**
- R06C candidate **High / portrait**

The browser runs use the same stable render sequence, fixtures/save, camera positions and game phase, and force every pooled PointLight contribution to zero in both versions. **Browser/JS/WebGL errors: zero** across the four checks.

### Player in hallway: fireplace illuminates without waiting for a LightPool slot

| Identical world/camera position | Prod light ON-minus-OFF | R06C light ON-minus-OFF |
|---|---:|---:|
| Hall x=87, z=88.5, facing living — Low | +0.37 | **+10.92** |
| Hall x=90, z=88.5, facing living — Low | +0.06 | **+7.30** |
| Hall x=87, z=88.5 — High portrait | +0.29 | **+13.94** |
| Hall x=90, z=88.5 — High portrait | +0.15 | **+10.59** |

These values are the mean difference in 8-bit central ROI luminance between logically ON/OFF states; they demonstrate source-bound contribution rather than physically accurate radiometric illumination.

### Portals and wall separation

In the fixed-camera ablation test, R06C source ON/OFF produced **zero** ROI difference in:
- the hall looking *away* from the fireplace,
- the library behind its shut door and looking away,
- the upstairs guest room.

Outside front and kitchen differences were negligible and no greater than baseline simulation variation. This is evidence at the tested camera positions, **not** a proof of mathematically correct light occlusion across all walls/portals.

### Measured rendering cost

| Metric | Current production | R06C | R06C delta |
|---|---:|---:|---:|
| Pool budget | 3 Low / 4 High | unchanged | 0 |
| New meshes / triangles | 0 | 0 | **0** |
| Interior meshes using dedicated material | 0 | 11 | +11 |
| Cloned source materials | 0 | 7 | +7 |
| Other meshes' shaders changed | 0 | 0 (1,012 unaffected) | none |
| Draw calls, Low at x=87 hall view | 92 | 98 | **+6** |
| Draw calls, Low living middle | 85 | 90 | **+5** |
| Draw calls, High at x=87 hall view | 235 | 235 | **0** |
| Draw calls, High living middle | 228 | 228 | **0** |
| Compiled WebGL program variants | baseline | approx. +8 | **+8** |

High baseline already reaches ~1.5–1.6 million triangles and 220–240 draw calls at some viewpoints, exceeding provisional PB01 limits; R06C contributes **no triangle regression**. GPU fragment time on actual Android remains **unmeasured**. Do not claim mobile performance is proven merely because draw calls remain acceptable in Low.

## Art review

The candidate provides a distinct, warmer fireplace light on the west wall and mantel and some nearby timber. In the matched screenshots the warmth can become noticeably orange; ensure the owner likes this art direction and that the low-frequency authored emission retains believable surfaces. The current shader does not encode occluder shadows or a real baked UV2 lightmap. It is an architecture proof, not a full GI solution.

## Independent second cause: globally player-conditioned ambient

Diagnostic PR #113 proves that the single scene-wide sun, HemisphereLight and fog still change when the global `indoor` factor changes. This affects *outdoor↔indoor* transitions, but the route-scanning test finds **no false `out` classifications** across hall↔living, dining↔kitchen, hall↔library or living↔library. This is a separate R07 workstream and must not be hidden by the successful fixture-based R06C prototype.

## Release gate

**R06C engineering/functional prototype: PASS. Production release: HOLD until:**
1. Owner accepts matched screenshots and the warmth/detail balance.
2. A real Android low/high device test measures GPU frame time, memory, thermal behaviour, and sustained scene traversal.
3. A scalable authored room lightmap / surface mask contract is selected before extending to dozens of lights.
4. Remaining global ambient and room-culling transitions are investigated as separate issues.
5. A final rebase to the HEAD of production at release time and all tests rerun.

**No merge or production Pages deployment is requested or authorized by this report.**
