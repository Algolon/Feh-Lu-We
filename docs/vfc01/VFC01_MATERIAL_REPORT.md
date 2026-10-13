# VFC-01 — materials, textures and compression

This is the fresh reconstructed experiment. The lost initial source/results remain historical only in the recovery note. The current six-family runtime swatches are authored procedural code, not copies of the unavailable initial image library.

## Curated scope

Timber, plaster, limestone, paving tile, fabric, paint. Wood is neutral/tintable for oak/dark furniture use. Existing roof terracotta, cobalt cottage identity, brass/ceramic, artwork atlas, glass, foliage and unlit graphics remain. No green-metal family or photographic realism is forced into these scenes.

`materials.ts` builds seeded CanvasTextures: timber 512/1024 base; other bases and data maps 512. Base colour sRGB, data maps linear, repeat/mips, anisotropy 4 control. Mild normals only timber/tile/limestone; Standard roughness maps only timber/tile, using G of a packed swatch. Extra AO/metal channels are not enabled merely because they exist. No displacement/parallax.

V1 has the same source topology as V0. Local timber V follows the longest construction axis before placement, swatch 0.55m across / 1.5m along grain. End faces use a planar approximation, not a full end-grain authoring solution. Other families use isotropic face projection: plaster 2.5m, tile 1m, limestone/paint 1.8m, fabric 0.25m. An initial universal grain-axis rule stretched tiles; it was corrected and all affected main captures rerun. Curved/hero shapes still need intentional unwrapping rather than a universal projection rule.

## Normal-distance assessment

**OBSERVED:** grain follows the canopy posts/structural members; the selected front standing view makes the support and grain logic legible. Library material-only changes are modest against crowded books/existing joinery. 512/no-normal retains useful timber identity at these player distances.

**OBSERVED — failed family:** the authored plaster swatch creates visible coordinated wave/band patterns in the player frame. This is neither tactile plaster nor useful painterly simplification. **REJECT that swatch.** Full V3 carries this deliberately visible failed component and is not a rollout candidate. Additional paint/fabric maps give insufficient distance value in this sample.

**REFINED:** `selected=1` limits the material change to timber/tile/limestone, preserving production plaster/paint/fabric; Phong, timber 512, normals off, DPR 1 or 1.25. It is the successful-family follow-up, not an estate-wide replacement. Compare selected-equal against V0 at DPR 1 before crediting geometry/materials; selected-crisp adds the independent pixel change. Three fixed player/front views are measured, including a grounded front pose `(25,4,150)`, FOV 70, eye height 1.65.

Normal/roughness detail and 1024 texture information do not justify universal map bundles. Standard has no demonstrated broad player-eye advantage here. Reflective hero surfaces were not subjected to a genuine matched-material test, so selected Standard remains a hypothesis worth evaluating, not an adoption claim.

## Referenced texture accounting

RGBA8-equivalent + mip estimates across scene references, not actual live driver allocation or just visible textures. Detached retained maps, render targets and unknown image dimensions are excluded.

| Configuration | Estimated MiB |
|---|---:|
| Production V0 | 41.96 |
| Full curated Standard / 1024 timber / selected data maps | 60.62 |
| Phong / 1024 / selected normals | 57.96 |
| Standard / normals off | 56.62 |
| Standard / timber 512 | 56.62 |
| All-family Phong / 512 / normals off | 49.96 |
| Selected timber/tile/limestone Phong / 512 / normals off | **45.96** |

The selected follow-up is +4MiB (~9.5%), versus +18.66MiB (~44.5%) for the full mapped pilot. Download for runtime Canvas swatches is code rather than raster files, but CPU generation/upload/startup are not free; these were not profiled on a phone. An approved production authoring pipeline should prefer small offline-derived assets when that avoids startup work.

## External source and provenance

One external compression probe: [Wood Table 001](https://polyhaven.com/a/wood_table_001), [Poly Haven CC0](https://polyhaven.com/license), license/title rechecked on 2026-10-13. The original 2k JPEG was downloaded on 2026-10-13 in the initial run, graded grayscale/exposure/contrast/low-pass and encoded as 1024 ETC1S with full mips. Raw source was removed by workspace maintenance; the exact immutable KTX blob was recovered from GitHub SHA `68fbcb22b3485526a3e36663ff8efdca1d212957`.

Fresh WebP baseline is a **lossless BC7 decoded GPU round-trip of that KTX2**, not the original uncompressed source. `public/vfc01/materials/manifest.json` records source URL/license/date/hash/modifications/final files. No 4k/8k/raw library enters Git. Source JPEG URL from the initial run: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/wood_table_001/wood_table_001_diff_2k.jpg`.

## Bounded KTX2 test

[Three KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html), r186 matching decoder, lazy import, detectSupport. The decoder is a small experimental static copy; its default bundled URLs are also emitted by Vite. An approved migration should use the bundled URLs and remove the redundant static copy, pin compatible versions and preserve Three/Basis licensing (MIT integration / Apache 2.0 Basis).

| Same decoded content | Download bytes | Referenced GPU mip estimate/observed block bytes |
|---|---:|---:|
| Lossless WebP round-trip, 1024 | 324,630 | 5,592,405 (~5.33MiB RGBA+mips) |
| ETC1S KTX2, 1024 | 186,190 | **1,398,128 (~1.33MiB)** |

Both views select BC7/BPTC enum 36492, eleven mips. Fresh local loader/worker observations are in `compare/ktx.json`; they include setup and local cache effects, not mobile network predictions. Decoder is ~585kB raw before compression/caching. The swap retains old resources until context/world disposal; referenced-memory improvement is not proof that live allocation immediately dropped.

The WebP baseline is deliberately lossless after decoding, so this download comparison is favourable to KTX2 and **cannot establish an advantage over a well-graded lossy production WebP**. The original encoding loss cannot be evaluated without its source; no original-source fidelity claim or current UASTC comparison is made. The initial UASTC notes are historical and excluded from current conclusions.

**SELECTIVE / DEFER migration:** loader/storage benefit works on this software BC7 target. Before adopting: test owner Samsung/iPhone ASTC/ETC2/other formats, visible quality at normal/close distances, cold/warm total delivery/transcode/upload, fallback/error handling and actual texture pressure across a small useful family. No immediate estate conversion.

## Proposed standards and decisions

- **ADOPT authoring principle:** grain direction, construction scale, controlled local value, sRGB/data-map separation, mip/distance QA.
- **SELECTIVE:** authored base-colour families; 512 default for small tiling surfaces, 1024 for a proven large/hero need. 2048 **DEFER**, not justified by this run.
- Proposed density: 128–256 texels/m ordinary architecture, 256–512 selected furniture faces, then approve at player distance. The timber swatch is anisotropic (~341 along / 931 across at 512); normalise future unwraps rather than turning that mismatch into a universal standard.
- **REJECT:** current banded plaster, global Standard/PBR conversion, all-map bundles and photographic noise.
- **DEFER:** ordinary micro-normal maps, weighted normals and additional paint/fabric maps without a visible distance return.
- **SELECTIVE hypothesis:** Standard where roughness/highlight response is visibly useful (painted metal, ceramic, stone or selected timber), subject to a genuine matched surface/device test.
- **SELECTIVE / DEFER:** KTX2 when GPU storage pressure and enough asset reuse amortise its loader/decoder complexity.
