# VFC-01 — verified production audit

Production/default branch `ccr-75ef4113-kfkimm`, verified on GitHub: **ae2a036e783400355c8d137f24e16c33bb1a8323**. Dedicated branch `vfc01-visual-fidelity-calibration`. No DEV-04D feature branch or other experiment is merged. Existing tracked production source remains unchanged.

The initial workspace was removed by automated maintenance before its upload completed. This delivery is a reconstructed, freshly captured experiment. [Recovery provenance](VFC01_RECOVERY_STATUS.md) retains the old results as historical notes only. The current matrix and timings must not be conflated with that lost implementation.

## Exactly two zones

**Library:** plaster, timber cases/floor/table, upholstery/rug, books/small props, brass/ceramic, trim, fixtures and double-height/portal sightlines. Its already developed joinery tests diminishing returns and stresses batching; it is not chosen merely for an easy visual win.

**Portugal cottage + terrace:** plaster, cobalt paint, timber canopy, tile paving, terracotta roof, pale stone, outdoor furniture, vegetation, sun and atmospheric depth. Its bounded structural support system and long sightlines test both material reading and visible range loss. No estate redesign.

Owner references inspected in the initial run were Made by Hand `82044.jpg` / `82050.jpg` and FLW `81492.png`. They informed construction, directional grain, material separation and tactile hierarchy. They are not republished or copied as assets. ART-01 remains Crafted Stylized European Woodland Manor, with painterly simplification and authored warmth.

## Renderer

`src/core/game.ts`: Three.js r186.1 WebGLRenderer, WebGL2 required, high-performance preference. Antialias is chosen at context creation from quality; changing quality later cannot change AA. ACESFilmicToneMapping, exposure 1.15; Neutral is an existing optional control. Output is Three's sRGB default. Low caps DPR at 1 and disables shadows; high caps at 1.5. Coarse pointer defaults low in `state.ts`.

High uses PCFShadowMap, 1024² sun map on coarse pointer / 2048² desktop, shadow camera ±28m, near 1/far 160, bias −0.0006, normalBias 0.04. LightPool supplies three low/four high point lights, ranks fixtures using rooms/view/LOS and smoothly changes indoor contribution. The lab fixes three lights, tests AA in fresh high-quality contexts (four fixture pool lights) and explicitly enables 1024² sun shadows independently of quality. Thus the AA control includes a quality-context/light-pool change; matched V0/V3 crisp comparisons hold it constant.

`env.ts`: shader sky dome, directional sun, hemisphere fill, linear fog and progress-driven afternoon/evening. Open haze 16–165m; woodland 7–102m; inside 40–220m. This experiment does not change the sky/dusk design or the separate ENV-L01 track.

## Geometry and render organisation

`kit.ts` Batcher transforms non-indexed parts, applies vertex tint and optional baked AO, and merges by material UUID/chunk/shadow flag. Room chunks carry tags. Submitted camera triangles include full intersecting batches, not only triangles contributing visible pixels. Outdoor chunks/portal windows reduce unrelated work.

`artkit.ts` / `furniture.ts` already have soft boxes, turned profiles, mouldings, tapered legs, aprons/stretchers, directional UV helpers and authored occlusion. Production is not just primitive boxes. Planar faces retain face normals; shaped parts use generated smooth normals. No general weighted-normal or artist-authored GLB furniture pipeline is wired in.

Vegetation uses BatchedMesh with WEBGL_multi_draw when available, otherwise per-geometry InstancedMesh with per-instance frustum culling and conservative shadow coverage. `?multidraw=0` remains an existing diagnostic; browser name alone does not establish device support.

## Materials and textures

Kit families primarily use MeshLambertMaterial; Basic supplies glow/unlit graphics. Art kit uses Lambert timber/paint/stone/upholstery and Phong brass (shininess 38) / ceramic (70). Other props, sky, water, fire and contact/light patches use additional Phong/Basic/Shader families. Runtime inventories, rather than constructor counts, are recorded in baseline and matrix JSON.

`surfaces.ts` extends shared shader chunks with broad world-space value/hue breakup. This is macro colour variation, not directional wood grain. Foliage omits some lookups to reduce fragment work. The lab does not globally replace these materials.

`textures.ts` uses seeded CanvasTextures, generally 128–512 px, repeated sRGB colour, mipmaps and anisotropy 4. `artkit.ts` has 256×128 neutral grain, 64² weave, ashlar/rug swatches. D2 wall art uses a shared WebP atlas. WebP/PNG TextureLoader imagery exists. Production does not currently use KTX2/Basis; compatible Three loader/decoder modules are available.

## Visibility — actual paths

`src/interactions/world.ts`: dynamic top-level roots get a hard centre-distance cutoff `max(authored cullDist, 16 + 25 × bounding radius)`, with room ownership from tags/probes/samples. Culled roots also stop being pickable. Game calls culling every 0.12s.

Room graph visibility keeps two portal steps outdoors / three inside, open-door cone/LOS tests and outdoor portal windows. Static regions use nearest bounding-sphere distance. Manor far 130m, cottage 75m, conservatory 95m, Wickerman 40m; many interiors have outside allowances around 30m, cottageIn 25m plus near/in-view doorway checks. Retain this intelligent occlusion.

Legacy Vegetation still has direct 26m crown LOD, 42m small cutoff and 105m far cutoff. Current woodland TreeBatches already uses near/mid/far/xfar bands at **16/26/48m with 3m hysteresis**, 115m tree cutoff / 50m bush cutoff. Updates after 0.3m movement or portal-window change. PlantBatch shrinks over its last 4m in 12 quantised steps, after 0.25m movement. Therefore a claim that all vegetation currently hard-pops would be false.

## Fresh baseline evidence

The unchanged **actual production main/Game entry** is captured separately in `baseline/production-*.webp`, through its existing memory-only review mode. Matrix V0 uses the same production content through the isolated lab. All doors open in the sandbox, low/no AA/no shadows, reduced motion, afternoon, FOV 70, **915×412 CSS/DPR 1**. Fixed poses are in `config.ts` / `scripts/vfc01-cameras.mjs`.

| Camera | Calls | Camera triangles |
|---|---:|---:|
| Library player | 93 | 286,772 |
| Library medium | 127 | 328,224 |
| Library craft | 45 | 270,956 |
| Cottage player | 94 | 199,731 |
| Cottage medium | 52 | 122,502 |
| Cottage craft | 58 | 139,449 |

All six counts exactly reproduce the initial production audit. The first Library pose needs the same fixture warm-up as the lab; after matching it, its baseline and V0 decoded pixels agree. Some other frames differ by tiny raster/light-history values (cottage player RGB MAE ~0.0055/255), not camera/layout changes. Main variant comparisons use the lab's identical warm-up procedure. These all-open representative views are not a closed-door budget guarantee or an estate maximum.

Baseline source sum is 735,863 unique geometry triangles, not instance-expanded visible work. Referenced textures estimate ~41.96 MiB using the current RGBA8-equivalent accounting. The historical 250k guide is already exceeded in production Library; it is not an immutable engine limit.
