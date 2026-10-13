# VFC-01 — measured performance

Fresh reconstructed run only. Broad timing controls record source revision 62e6ab7, before the final neutral/support draw-order correction. Their warmed player call/triangle totals match the current main matrix; exact probe counts remain attached to each row. Current selected-family measurements are separate in compare/selected.json. Chromium/SwiftShader, **not a physical phone**. Eight warm renders, then 30 synchronous renderer.render + one-pixel readPixels fences. Median and nearest-rank p95 include submission/synchronisation, omit full gameplay cadence, and must not be converted to a Samsung FPS forecast. No real-device results were fabricated.

Fixed 915×412 CSS, FOV 70, same player poses, afternoon/all-open memory sandbox. Referenced texture bytes are RGBA8-equivalent plus mip estimates (compressed textures use transcoded mip bytes), excluding driver bookkeeping, retained detached textures, render targets and images without dimensions. GeometryAttributeBytes sums unique vertex/index arrays, excluding instance/storage/driver buffers. Unique geometry triangle sums may include BatchedMesh allocation capacity, so local deltas are more reliable than treating that total as a precise authored inventory. Scene inventories are whole-world; calls/triangles are submitted work. Alpha/caster counts are proxies, not measured covered fragments or an exact active-caster census.

## Main matrix

| Variant | Camera | Camera calls / triangles | Source triangles | Geometry attributes MiB | Mesh / instanced / materials | Textures / MiB |
|---|---|---:|---:|---:|---:|---:|
| V0 | library-player | 93 / 286772 | 735863 | 83.37 | 754 / 43 / 132 | 76 / 41.96 |
| V0 | cottage-player | 94 / 199731 | 735863 | 83.37 | 754 / 43 / 132 | 76 / 41.96 |
| V1 | library-player | 103 / 286512 | 735863 | 83.37 | 766 / 43 / 138 | 87 / 60.62 |
| V1 | cottage-player | 95 / 199707 | 735863 | 83.37 | 766 / 43 / 138 | 87 / 60.62 |
| V2 | library-player | 94 / 292184 | 742607 | 84.22 | 756 / 43 / 132 | 76 / 41.96 |
| V2 | cottage-player | 95 / 201063 | 742607 | 84.22 | 756 / 43 / 132 | 76 / 41.96 |
| V3 | library-player | 104 / 291924 | 742607 | 84.22 | 768 / 43 / 138 | 87 / 60.62 |
| V3 | cottage-player | 96 / 201039 | 742607 | 84.22 | 768 / 43 / 138 | 87 / 60.62 |
| V4 | library-player | 104 / 291924 | 742607 | 84.22 | 768 / 43 / 138 | 87 / 60.62 |
| V4 | cottage-player | 97 / 201099 | 742607 | 84.22 | 768 / 43 / 138 | 87 / 60.62 |

V1 source topology equals V0; submitted reductions are batch/frustum partition effects. The craft increment is 6,744 unique source triangles. Camera counts include complete intersecting batches, not only visible pixels.

## DPR

| DPR | Camera | Buffer | Pixel ratio vs 1 | Median ms | p95 ms |
|---:|---|---|---:|---:|---:|
| 1 | library-player | 915×412 | 1.00 | 309.1 | 422.2 |
| 1 | cottage-player | 915×412 | 1.00 | 280.5 | 331.0 |
| 1.25 | library-player | 1143×515 | 1.56 | 364.0 | 568.5 |
| 1.25 | cottage-player | 1143×515 | 1.56 | 405.7 | 566.3 |
| 1.5 | library-player | 1372×618 | 2.25 | 505.5 | 666.5 |
| 1.5 | cottage-player | 1372×618 | 2.25 | 512.4 | 674.1 |
| 1.75 | library-player | 1601×721 | 3.06 | 747.4 | 1003.2 |
| 1.75 | cottage-player | 1601×721 | 3.06 | 695.0 | 849.9 |
| 1 | library-player | 915×412 | 1.00 | 333.4 | 451.8 |
| 1 | cottage-player | 915×412 | 1.00 | 296.3 | 386.4 |

The repeated DPR-1 rows are the start/end drift control. Pixel ratios are robust; this host showed substantial cross-case/load drift, so small timing differences cannot rank materials or devices.

## Controlled triangle probe

| Requested | Camera | Actual camera calls / triangles | Median ms | p95 ms |
|---:|---|---:|---:|---:|
| 250000 | library-player | 105 / 291928 | 317.4 | 429.9 |
| 350000 | library-player | 105 / 350064 | 377.1 | 484.8 |
| 500000 | library-player | 105 / 500582 | 406.9 | 498.9 |
| 700000 | library-player | 105 / 700532 | 439.8 | 564.0 |
| 250000 | cottage-player | 97 / 250023 | 312.4 | 508.4 |
| 350000 | cottage-player | 97 / 350097 | 364.6 | 434.7 |
| 500000 | cottage-player | 97 / 500577 | 348.3 | 454.4 |
| 700000 | cottage-player | 97 / 700039 | 212.9 | 297.1 |

One constant opaque Lambert rectangle, one additional draw, fixed coverage/material/normals/light/DPR, full regular-grid tessellation. Library 250k is unattainable; the actual value is recorded rather than forcing a label. This favourable coplanar probe does not represent every real asset/overdraw/shadow/state workload. The non-monotonic timings show why software survival is not a phone budget. Test 350k first on phone, 500k stress, 700k optional.

## Material / renderer controls

| Case | Camera | Camera calls / triangles | Shadow calls / triangles | Total calls / triangles | Texture MiB | Median ms | p95 ms |
|---|---|---:|---:|---:|---:|---:|---:|
| baseline | library-player | 93 / 286772 | 0 / 0 | 93 / 286772 | 41.96 | 297.7 | 389.6 |
| baseline | cottage-player | 94 / 199731 | 0 / 0 | 94 / 199731 | 41.96 | 315.9 | 409.5 |
| material-lambert | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 57.96 | 194.3 | 325.9 |
| material-lambert | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 57.96 | 223.0 | 454.1 |
| material-phong | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 57.96 | 217.5 | 404.2 |
| material-phong | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 57.96 | 200.4 | 307.0 |
| no-normal | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 56.62 | 220.5 | 294.0 |
| no-normal | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 56.62 | 197.3 | 269.6 |
| timber512 | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 56.62 | 240.4 | 437.6 |
| timber512 | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 56.62 | 212.3 | 246.6 |
| candidate | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 49.96 | 365.6 | 579.2 |
| candidate | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 49.96 | 276.7 | 384.5 |
| anisotropy1 | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 60.62 | 179.9 | 445.6 |
| anisotropy1 | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 60.62 | 241.8 | 393.5 |
| flat-normals | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 60.62 | 309.8 | 459.6 |
| flat-normals | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 60.62 | 376.4 | 605.7 |
| MSAA | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 60.62 | 891.5 | 1277.6 |
| MSAA | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 60.62 | 1071.0 | 1308.0 |
| shadow | library-player | 104 / 291924 | 64 / 293168 | 168 / 585092 | 60.62 | 656.4 | 1166.4 |
| shadow | cottage-player | 96 / 201039 | 19 / 86247 | 115 / 287286 | 60.62 | 387.9 | 605.2 |
| crisp | library-player | 104 / 291924 | 64 / 293168 | 168 / 585092 | 60.62 | 1777.2 | 2517.6 |
| crisp | cottage-player | 96 / 201039 | 19 / 86247 | 115 / 287286 | 60.62 | 1005.8 | 1726.6 |
| baseline-crisp | library-player | 93 / 286772 | 58 / 287756 | 151 / 574528 | 41.96 | 1279.5 | 2515.8 |
| baseline-crisp | cottage-player | 94 / 199731 | 17 / 84915 | 111 / 284646 | 41.96 | 1362.0 | 2002.9 |
| cropped-shadow | library-player | 104 / 291924 | 61 / 291248 | 165 / 583172 | 60.62 | 1818.5 | 2926.2 |
| cropped-shadow | cottage-player | 96 / 201039 | 17 / 49338 | 113 / 250377 | 60.62 | 1353.8 | 1782.7 |
| neutral-tone | library-player | 104 / 291924 | 0 / 0 | 104 / 291924 | 60.62 | 323.6 | 431.1 |
| neutral-tone | cottage-player | 96 / 201039 | 0 / 0 | 96 / 201039 | 60.62 | 403.1 | 616.3 |

AA fresh contexts use the existing high-quality constructor, which also yields four fixture pool lights versus three in ordinary low. Therefore the MSAA row is a **quality-context control**, not a pure AA-only cost. V0/V3 crisp controls use identical settings/light count. DPR and triangle sweeps stay in the same low/three-light world. Low shadow-off views have zero active shadow maps; shadow controls use one 1024² sun map. Camera and shadow submissions are tracked separately by wrapping shadowMap.render.

Do not sum triangle/draw/pixel/texture costs into one universal cap. Higher DPR multiplies raster/fragment work; Standard/data maps add shader/bandwidth work; shadows submit additional caster geometry; foliage alpha/instances introduce different cost from the regular panel. This run does not separately measure GPU vertex/fragment/texture timing; counts and workload proxies isolate controlled changes, not a full hardware profiler.

## Phone decision boundary

Historical ~150 draw calls / ~250k visible triangles remain engineering guides, not engine limits. Production Library medium already submits 328,224 triangles. Recommend owner testing near 350k, then 500k stress, without altering permanent DEV-04D budgets. Report camera and shadow totals separately; do not silently reinterpret 150 total calls as 150 camera calls plus unlimited shadow work. DPR 1 fallback, 1.25 first candidate, 1.5 selective; 1.75 is 3.06× pixels and not a general default. Physical cadence/p95/thermal/format tests are pending; see VFC01_PHONE_PROTOCOL.md.

## Current-source selected-family follow-up

Same source after final support/neutral corrections; 8 warm / 30 fenced renders. Counts and byte estimates are useful, timings remain host-sensitive. DPR-1.25 cottage medians below DPR-1 demonstrate drift, not a speed gain from resolution.

| Case | View | Camera calls / triangles | DPR | Texture MiB | Median ms | p95 ms |
|---|---|---:|---:|---:|---:|---:|
| baseline | library-player | 93 / 286772 | 1 | 41.96 | 258.6 | 360.2 |
| baseline | cottage-player | 94 / 199731 | 1 | 41.96 | 274.9 | 327.8 |
| baseline | cottage-front | 51 / 116664 | 1 | 41.96 | 240.1 | 314.6 |
| selected-equal | library-player | 97 / 291936 | 1 | 45.96 | 287.0 | 360.2 |
| selected-equal | cottage-player | 94 / 201039 | 1 | 45.96 | 263.2 | 328.1 |
| selected-equal | cottage-front | 52 / 117996 | 1 | 45.96 | 284.2 | 376.9 |
| selected-crisp | library-player | 97 / 291936 | 1.25 | 45.96 | 342.4 | 444.9 |
| selected-crisp | cottage-player | 94 / 201039 | 1.25 | 45.96 | 203.7 | 372.7 |
| selected-crisp | cottage-front | 52 / 117996 | 1.25 | 45.96 | 214.3 | 231.9 |
