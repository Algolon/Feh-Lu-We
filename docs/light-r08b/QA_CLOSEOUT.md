# LIGHT-R08B — verified library surface lighting correction

**Status: technical + software visual PASS; owner/physical Android approval PENDING.**  
**Branch** `fix/light-r08b-library-light-surfaces` → base `lighting/r08-hall-library-prototype` (draft PR #124).  
**Full run:** https://github.com/Algolon/Feh-Lu-We/actions/runs/39118286789  
**Snapshot:** `a953c219e28a7f432eaaaa6c7a56b15a59140d7e`  
**No merge, no Pages publication.**

## Tests and evidence

- All **6/6 CI jobs PASS** — npm typecheck, **511/511 tests across 68 test files**, budget, production build, review ZIP, actual estate Chromium/SwiftShader Low landscape and High portrait A/B before/after.
- Real GL errors and browser/JS errors: **zero**.
- The old build's two unrelated translucent additive discs were identified at x/z plan coordinates:
  - `lamp.library`: radius **0.8 m**, y=**0.97m** = GF+0.82.
  - `lamp.libraryChandelier`: radius **2.6m**, y=**0.18m** = GF+0.03.
- After correction **both discs are absent**, and the other 16 registered `LightPatches` remain unchanged.
- The desk gets a soft *direct material response* bounded by x=72.52–73.84, plan z=97.84–100.16, y=GF+0.78..0.872, with brightest footprint near the actual banker's lamp. No independent extra THREE.PointLight is required.
- The library carpet keeps its original rug geometry, atlas UV/palette, and pattern. Only the library `mLib` rug material opts into the already authored `fabric` surface profile so the room's status-bound light reaches **the carpet triangles**, not an intersecting planar decal.

### A/B measurements — same build, same save, exact same pose and quality

On-minus-off change in central-screen luminance (8-bit units), other lights held fixed. Smaller here is a more credible *local* light contribution, not a reduction in lamp logical status.

| Pose / quality | Before | After |
|---|---:|---:|
| Banker desk, Low day | +30.60 | **+17.24** |
| Chandelier → rug, Low day | +33.39 | **+8.33** |
| Chandelier → rug close, Low day | +61.41 | **+11.43** |
| Chandelier → rug, High day | +39.96 | **+8.88** |
| Chandelier → rug close, High day | +61.66 | **+11.96** |
| Chandelier → rug, Low dark | +34.31 | **+9.25** |
| Chandelier → rug, High dark | +40.78 | **+9.69** |

### Renderer cost

Comparing the same camera view before/after at both profile settings:

- **Draw calls: unchanged** in the sampled library desk, rug, and overview shots (e.g. Low 84 / 146 / 134 and High 224 / 255).
- **Shader programs: unchanged** in the measured views (e.g. Low 127–132; High 134–139 by view), despite the localized rug material variant.
- **Triangles: 4 fewer** in most matched views because the old two fake patch planes are gone. This is not a meaningful performance uplift; GPU fragment time was not measured.
- Existing Low/High views sometimes exceed past estate PB01 guideline; no claim that project-wide budgets have been repaired.

## Visual review

The original patterned central rug had a broad nearly white/orange spot with an edge that visually intersected the crowned rug's triangles. With the correction, the carpet design is readable and consistent from multiple static views and the desktop no longer has a broad floating glow. The corrected rug is **darker** than the old decal; this is intentional removal of an artificial overbright pool. Owner needs to decide whether the revised warmth is desirable. Screenshots in `r08b-corrected-low-screenshots` / `r08b-corrected-high-screenshots` from Actions; matched original artifacts available from the same run.

The browser captures fixed viewpoints and lamp on/off modes, but **no actual physical Android walk test** has been run. Moving-camera/mobile video review remains a separate approval gate.

## Why not a separate physics engine?

A rigid-body engine (Rapier, Cannon) handles collisions and motion, not optical reflections, shadows, or global illumination. Three.js already offers:

- `SpotLight` with `castShadow`, configurable cone/penumbra and shadow map. A possible *optional* High-quality near-source accent; do not use it as the base light for always-on room sources.
- `MeshStandardMaterial.lightMap` and `aoMap` with secondary UV coordinates, for static **prebaked shadows and illumination** on true geometry. This is promising for multiple room lighting sources, but `OpaqueBatches` will need a UV2/texture-atlas strategy.
- `RectAreaLight` simulates luminous rectangular sources but **does not provide shadow maps** and requires PBR material support. It is not a drop-in replacement for the game's mostly Lambert/Phong surfaces.

**Recommended next step:** owner plays a separately published R08B review snapshot (or receives screenshot comparisons) and confirms rug detail and desk illumination. Only after this consider a **single shadowed SpotLight on High** A/B experiment. Continue with baked shadow/lightmap atlas design for scalability; do not introduce an unrelated physics engine or reintroduce player-relative dynamic pool dependency.

**Release policy:** PR #124 remains DRAFT. No default game merge/deploy, no silent changes to the existing `/light-r08/` preview.
