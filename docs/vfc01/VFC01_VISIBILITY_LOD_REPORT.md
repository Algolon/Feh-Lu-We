# VFC-01 — visibility and LOD

**Evidence availability at C01:** the sequence descriptions below retain the reconstructed research record, not a complete remote media delivery. Only V3 vegetation MP4 is committed; seven MP4s and all 24 keyframes remain missing. Proposed decision labels below are research recommendations, not owner approval. See [closeout and limitations](VFC01_CLOSEOUT.md).

Fresh evidence: **172 deterministic approach/retreat steps**, eight videos, exact boundary keyframes. Same camera/FOV/DPR between V3 and V4. Video plays at four presentation frames/s, not gameplay FPS. Fixed-height unobstructed rays are not collision-walk recordings.

## Production paths

Legacy vegetation has hard 26/42/105m changes. Estate TreeBatches already has four geometry levels at 16/26/48m with 3m hysteresis, 115m tree range/50m bush range. PlantBatch already shrinks in its last 4m. Dynamic roots use size/authored centre-distance limits and room ownership; static architecture regions use nearest-sphere range, including cottage 75m. Room graph, portal windows and LOS are retained.

## Four class probes

**Large vegetation:** a cottage-adjacent tree group, same native skeleton/material/LOD in both variants. The sequences show near/mid/far/xfar transitions with different approach/retreat thresholds. V4 retains that working system; no new near/mid quality gain is claimed. Silhouette/clump/shading changes still need owner phone judgement. This sample does not justify replacing all legacy vegetation cutoffs globally.

**Hero fixture:** original cottage entry lantern temporarily relocated to the same unobstructed terrace post in **both** variants (`hero-test=1`). Its original sightline is blocked by the door/room boundary; treating that occlusion as popping would be misleading. V3 turns the fixture off at its 30m centre limit (visible at 29, off at 30+); V4 keeps this inexpensive full mesh through 58m, with room rules first. No proxy is added in the fresh reconstruction. A historical 100→84 triangle proxy was rejected in the lost run; that is retained as historical provenance, not a fresh measured proxy benchmark.

**Architecture:** lake/estate sightline toward the cottage. V3 region loses the cottage between sampled 86 and 90m because the 75m rule uses sphere-nearest distance. V4 stays on through 105m; a faint but coherent roof/wall silhouette remains in the full frame. There is no need for a blanket furniture/vegetation range increase to fix this architectural defect. Architecture visibility still obeys the original room/portal set.

**Micro-decoration:** same added diagnostic horizontal card (`lodtest=1`) in both variants, with an authored 24m hard-cut control equivalent to the production mechanism. It is not an existing production prop or a verified estate-wide cutoff. V3 cuts off at 24m centre distance. V4 uses projected height: off below 1.5px / re-entry above 2.5px, alpha-hash fade over 1.5–4px. In the refined ray it re-enters around 10m, fades toward 16m and ends by 20m on retreat. The initial approach stopped at 16m and never reached the re-entry size; it was an inadequate test and was replaced with a 6m near leg. Do not approve this method purely from counts: temporal noise, shimmer and abrupt re-entry at the upper hysteresis threshold need phone assessment.

Extra craft members follow the same parent chunk visibility, so they do not float when the native cottage region is off. Ordinary main captures do not add/move the diagnostic card/hero fixture.

## Proposed classes

| Class | Near / medium / far / off | Hysteresis / acceptance |
|---|---|---|
| Architecture | Preserve visible envelope/silhouette; simplify only where appropriate | Room/portal/frustum first; no range-only disappearance in open sightlines |
| Hero landmarks | Full → meaningful silhouette proxy → long-distance silhouette → fog/occlusion off | Matched silhouette/materials; 10–15% range margin as a starting test |
| Furniture/hero small props | Room visibility first; retain cheap full mesh | Distance only after a meaningful visual end; tiny proxies often poor value |
| Large vegetation | Existing full → mid → far → xfar → off | Retain 3m around existing bands; evaluate both directions |
| Small vegetation | Simpler forms and early inconspicuous end | Existing final shrink/fade is a useful base; assess density/overdraw |
| Micro-decoration | Projected fade → off | Pilot 1.5px off / 2.5px re-entry; temporal phone review |

V4's Infinity architecture limit is a lab test of the visibility principle, not a ready estate-wide policy. Use actual projected visibility/fog/occlusion and preserved landmark silhouettes in production. These private-field adapters must become typed, reviewed interfaces before integration.

## Decisions

- **ADOPT principle:** retire range-only loss of architecture/important landmarks that remain geometrically visible; retain room/portal culling.
- **SELECTIVE:** room-first full meshes for inexpensive important props. **DEFER this micro-card fade:** it is tiny/foreshortened, its projected-height proxy ignores orientation, and it re-enters at partially faded opacity. Use a screen-bound test before adopting the concept elsewhere.
- **ADOPT retention:** existing four-band trees + 3m hysteresis; do not discard a working system because older paths hard-pop.
- **DEFER:** improved far proxies/impostors and migration of legacy vegetation until matched-silhouette/overdraw/device evidence exists.
- **REJECT:** one universal cutoff or LOD approval based only on triangle reduction.

Phone checklist: approach, reverse, turn and cross open/closed portals. Judge silhouette stability, material/value jumps and whether the ending is visible during play. No physical results have been fabricated.
