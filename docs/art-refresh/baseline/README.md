# Art refresh — baseline captures (before any art change)

Build: commit `14fece9` (iteration 3, unchanged), production build served by `vite preview`.
Script: [`scripts/art-baseline.mjs`](../../../scripts/art-baseline.mjs) — `node scripts/art-baseline.mjs docs/art-refresh/baseline`.
Exact poses, look-at targets and per-shot metrics: [`poses.json`](poses.json).

## Settings (so later comparisons use the same frame)
| Setting | Value |
|---|---|
| Viewport | 844 × 390 CSS px (landscape phone), device scale 1 |
| Quality | `low` = the phone default (`pointer: coarse`): no shadow maps, pixel ratio capped at 1, no MSAA, 3 pooled point lights |
| FOV | 68° vertical (landscape), eye height 1.65 m |
| Save state | fresh estate start (essentials, front door open, living-room fire lit by default), dusk ≈ 0 (afternoon) |
| HUD | hidden for these frames (`#hud`, `#stick`, `#toast`); on a phone the HUD covers the top 60 px and the joystick zone |
| Renderer | Chromium 141 + SwiftShader (software WebGL 2). Image content matches a GPU render of the same scene; **frame rate here is meaningless**. Draw calls / triangles come from three.js and are renderer-independent. |

Each pose is captured three times:
- `NN-name.jpg` — the game as shipped.
- `NN-name-neutral.jpg` — fog off, white sky/ground fill (×2.0), white sun (×1.6), exposure 1.0; fixture lights unchanged.
- `NN-name-clay.jpg` — neutral lighting **and** one matte grey material on every lit surface (no textures, no vertex or
  instance colours). Fixture glows, flames and the sky keep their materials. Shape and silhouette only.

## Shots and metrics (phone quality)
| # | Shot | What it covers | Calls | Triangles |
|---|---|---|---|---|
| 01 | [hearth-wide](01-hearth-wide.jpg) · [neutral](01-hearth-wide-neutral.jpg) · [clay](01-hearth-wide-clay.jpg) | living room, hearth, sofa, armchairs | 92 | 179 k |
| 02 | [mantel-front](02-mantel-front.jpg) · [clay](02-mantel-front-clay.jpg) | mantel row (puzzle evidence) at ~2.8 m | 112 | 157 k |
| 03 | [mantel-near](03-mantel-near.jpg) · [clay](03-mantel-near-clay.jpg) | mantel objects at ~1.2 m | 93 | 156 k |
| 04 | [armchair-near](04-armchair-near.jpg) · [clay](04-armchair-near-clay.jpg) | armchair at ~1.8 m, looking down | 90 | 173 k |
| 05 | [library-wide](05-library-wide.jpg) · [clay](05-library-wide-clay.jpg) | library, stacks, gallery, reading table | 43 | 53 k |
| 06 | [library-table-near](06-library-table-near.jpg) · [clay](06-library-table-near-clay.jpg) | catalogue table + chairs at ~2.4 m | 41 | 51 k |
| 07 | [bookshelf-near](07-bookshelf-near.jpg) · [clay](07-bookshelf-near-clay.jpg) | bookshelf + lectern at ~2 m | 17 | 48 k |
| 08 | [manor-forecourt](08-manor-forecourt.jpg) · [clay](08-manor-forecourt-clay.jpg) | main facade from the forecourt | 139 | 141 k |
| 09 | [manor-porch-near](09-manor-porch-near.jpg) · [clay](09-manor-porch-near-clay.jpg) | porch, columns, front door at ~4 m | 124 | 125 k |
| 10 | [woodland-path](10-woodland-path.jpg) · [neutral](10-woodland-path-neutral.jpg) · [clay](10-woodland-path-clay.jpg) | forest path toward the shed | 82 | 148 k |
| 11 | [southern-loop](11-southern-loop.jpg) · [clay](11-southern-loop-clay.jpg) | southern loop toward the fork | 121 | 202 k |
| 12 | [path-edge-near](12-path-edge-near.jpg) · [clay](12-path-edge-near-clay.jpg) | path edge and undergrowth, looking down | 127 | 202 k |
| 13 | [boslust-fork](13-boslust-fork.jpg) · [clay](13-boslust-fork-clay.jpg) | fork signpost, first view of the cut | 136 | 211 k |
| 14 | [boslust-cut](14-boslust-cut.jpg) · [neutral](14-boslust-cut-neutral.jpg) · [clay](14-boslust-cut-clay.jpg) | the cut and the BOSLUST headwall | 139 | 216 k |
| 15 | [boslust-door-near](15-boslust-door-near.jpg) · [clay](15-boslust-door-near-clay.jpg) | door, sign, tablet, lock at ~2.8 m | **154** | 222 k |

Every pose has all three variants; the table links the most useful ones.

**Measurement notes.** Repeating poses 01, 10 and 15 twice each and sampling at 0.3/1/2.5/5 s gave identical numbers
(92/179 k, 82/148 k, 154/222 k). An earlier exploratory run of the same script differed for four poses (e.g. 01 gave
140 calls / 158 k); the cause was not established, so any before/after comparison must take at least two runs.
**Pose 15 exceeds the 150-call phone budget** that the iteration-3 validation reported as met in its own (different)
poses: the BOSLUST approach is already at the limit before any art is added.

## What the frames show (visual evidence)
Observed directly in the captures above. Interpretation and proposals are in [`../STYLE_TARGET.md`](../STYLE_TARGET.md).

- **Neutral ≈ game.** The neutral-light frames are almost indistinguishable from the shipped frames (01, 10, 14).
  At phone quality the light is a strong uniform fill (hemisphere ×1.6 + unshadowed sun ×2.4); atmosphere is not
  hiding anything, but light also does almost nothing to model form. Shape reads from colour and texture alone.
- **Furniture (01, 04, 06).** In clay the armchair is a notched cube; the sofa is three slabs; the coffee table is
  a plank on four sticks; cushions are coloured boxes that intersect the back. Nothing sits *on* the floor: no
  shadow, no darkening, no feet or plinth detail at the contact line.
- **Hearth (01–03).** The chimney breast is one flat slab; jambs, lintel and shelf are plain boxes with no moulding,
  no shadow under the shelf and no depth to the opening. The fire's floor glow is a bright disc that reads as a
  spotlight decal (very visible in clay). The mantel objects are the most crafted things in the room (lathe vase,
  clock, feather) and read well at 1.2 m; the pinecone reads as a spiky blob.
- **Library (05–07).** Book rows give the bookshelves genuine structure, so this room holds up best. The free-standing
  stacks are featureless slabs seen end-on; chairs are stick-and-plank; the chandelier is a spiky ring. The table
  lamp's floor glow is a hard-edged disc.
- **Manor (08, 09).** The facade is a flat box: windows are flush emissive rectangles with no reveal, sill or frame
  depth; no plinth course, no string course with shadow, no quoins; the porch roof is a thin dark slab on two
  columns; the left chimney appears to grow out of a dormer rather than the roof mass. Cypresses are plain cones; the hedge is a row of flattened
  pebbles; the forecourt bed's "flowers" are faceted gems.
- **Woodland (10–12).** Trunks are straight, barely tapered cylinders that stop abruptly under the crown; no roots,
  no branches. Crowns are clusters of the same faceted blob. Pines are three stacked cones with visible gaps. Ferns
  read as flat green discs ("lily pads"). Grass tufts are sparse spikes. In clay the path disappears completely: it
  is colour on a flat sheet, with no edge, verge, stones or change of level.
- **BOSLUST (13–15).** The cut walls are 1 m blocks stepping up like crenellations, each capped with a flat moss disc;
  the headwall is a flat stone rectangle; the "roots" over the parapet are straight sticks; the hill is a smooth dome
  with no rock showing anywhere, so the cut does not look carved out of anything. The door, sign and tablet read
  clearly at 2.8 m (good for the puzzle), but the frame is three planks.
- **Colour (sampled pixels).** Greens lose almost all blue on screen: the lawn displays around `#508d10`, hill
  grass and crowns near `#222207`–`#285901`. Source check: surfaces multiply a coloured texture by a coloured vertex
  tint (lawn: grass texture base `#8fb35a` × vertex colour `#9cc05e` ≈ `#578621` *before* lighting), which compounds
  saturation when both are saturated in the same hue (step-2 correction: not literally "squared"); strong fill light and ACES tone mapping at exposure 1.15 then push foliage toward acid green
  in light and near-black olive in shade. The authored hex values in `ART_DIRECTION.md` are therefore not what the
  player sees, and the woods read as uniformly vivid green.
