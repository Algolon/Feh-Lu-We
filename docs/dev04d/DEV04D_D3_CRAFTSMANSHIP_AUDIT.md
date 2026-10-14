> **FLW-PB01 budget authority (14 October 2026):** [PERFORMANCE_BUDGET.md](../PERFORMANCE_BUDGET.md) supersedes every historical 250k camera-triangle limit and “previously under 250k must remain under” rule in this document. Current ceiling: **750,000 submitted camera triangles per view**, provisional; device validation pending. Historical measurements/results remain unchanged. Draw-call limits, functional assertions and local batch delta limits remain in force; explained geometry growth requires an explicit regression review, not automatic rejection at 250k.

# DEV-04D D3-0: Visual craftsmanship audit and D2-R triage

Audit only: nothing in the game was changed.
- Production head: `f26e563` (PR #8: D1, D1-R, D2).
- Target: **ART-01, a crafted stylised European woodland manor**. Not photoreal, and not an estate rebuild.

## 0. Evidence used

| Source | What |
|---|---|
| **Owner phone review** (primary) | Written findings in the D3-0 brief, quoted in §1. **The phone screenshots did not reach this session**: the only upload is the earlier gallery-wall photo. They should be added to `docs/dev04d/d30/owner/` when available. Until then, every owner point was re-checked against the captures below, and each one reproduces. |
| Phone-viewport captures (new) | `docs/dev04d/d30/d2-phone/` and `docs/dev04d/d30/env/` (details below). |
| Desktop D2 / D1-R captures | `docs/dev04d/d2/evidence`, `d2/keys`, `d1r/*` |
| Budgets | `docs/dev04d/d2/budget/d2-salon-rooms.json`: doors closed, low quality, production geometry. |
| VCP-01 | Read-only review of `origin/vcp01-library-codex` (draft PR #9, `e043993`); see §4. |

About the phone-viewport captures:
- Size: 915 × 412 landscape, low quality, the production build. Every door is open (the evidence state), so call counts in these images are not budgets.
- `d2-phone/` covers every D2 asset close, at room distance and from the approach, plus the keys, the maquette and the salon wall.
- `env/` holds 22 views (harness `SET=d30`):
  - façade and portico;
  - forecourt ground;
  - library, billiard, dining room, kitchen, living room, vestibule;
  - study, botanic room, landing;
  - cottage and terrace.

**Craft hierarchy used for every judgement:**
1. silhouette;
2. proportion;
3. construction / support / joinery;
4. placement and spatial relationship;
5. material identity;
6. grounding / authored shading;
7. fine surface detail.

Detail never compensates for a failure higher in the list.

## 1. Owner findings: reproduced at phone distance

| Owner point | Reproduced? | What the captures show |
|---|---|---|
| D1 / D1-R wall art is the quality anchor | **yes** | The salon wall (`env/e-study`) and the landing / dining paintings read as authored at every distance. They are real images in solid frames. |
| D2 3D reads as arrangements of primitives | **yes**, for the reliefs and small pieces | The mask is an ellipsoid with stuck-on lozenges. The medallion is a disc, a ring and lozenges. The swallows are flat cut-outs. These read as "shapes on a wall", not as a carved / glazed / papier-maché object. |
| Sloop, bird and heron work better | **yes** | They have a real silhouette (hull + sail; plump bird; long-legged bird). Their construction reads. |
| Several identity pieces too small | **yes, severely** | From the approach (`d2-phone/*approach`): the medallion is a red dot on a 15 m wall; the mask is a dot beside the far window; the swallows are three marks between two large windows; the tile is a stamp; the heron is a stick next to a 1.6 m bench. Approach sizes on a 915 px-wide screen: medallion ≈ 14 px, mask ≈ 12 × 18 px, swallow group ≈ 80 px, heron ≈ 25 px tall. Keys from the standing pose ≈ 15–25 px. |
| Placed rather than composed | **yes** | Cottage: the mask hangs on the east wall seen only side-on, not on the arch axis or behind the table. Tile: on the corner of the house front, away from the terrace table zone. Medallion: a free wall with no furniture relation. |
| Environment blocky / flat / filled | **yes** | §5–§6: billiard table, library cases, façade ashlar, forecourt, kitchen islands. |

## 2. D2-R triage (every D2 3D implementation)
Scores are 1 (fails) to 5 (good), judged at **phone approach distance first**, then close.

| Asset | Ref. fidelity | 1st-person silhouette | Scale / presence | Construction | Material | Support | Placement | Benefit / cost | **Status** | What it needs |
|---|---|---|---|---|---|---|---|---|---|---|
| K3-001…004 keys | 3 | 2 at standing distance (15–25 px) | 2 | 4 | 3 (brass reads; iron dark) | 5 | 3 (inside a drawer, a recess) | ok (310–450 tris) | **SCALE_POSITION** | Presentation, not the models. The ×1.3 key is right for the hand but disappears in a 0.4 m drawer at 1.2 m. **Options:** a pickup-presentation scale (×1.6–1.8, lying on a small tray or cloth that frames it); a contrasting liner in the drawer / hatch; a soft glint on approach is optional and needs an owner decision (no emission). Icons are fine. |
| S3-004 bird | 4 | 4 | 3 (good on the table; small from the doorway) | 4 | 3 | 5 | 4 | good | **KEEP** | At most a later polish of the beak / eye (D3-b). No action now. |
| S3-014 swallows | 3 | 2 (flat plates; wings read as blades) | 2 (≈ 80 px over a 2.85 m wall) | 2 (hidden dowels ok; bodies are flat) | 2 | 4 | 3 (a good wall, but floating in it) | low | **REMODEL** | Real bodies with a pronounced swept-wing silhouette and a forked tail; carved volume; ×1.6 (≈ 1.6–1.8 m group); slightly lower so they relate to the bench below. Most visible upstairs D2 failure. |
| S3-015 sloop | 4 | 4 | 3 (fine on the desk; from the door it is a mast) | 4 | 4 | 5 | 4 | good | **KEEP** | Optional ×1.15 in D3-b if the desk composition is redone. |
| S3-016 moon | 4 | 4 | 3 | 4 | 3 | 5 | 3 (bedside, beside the curtain) | good | **KEEP** | Revisit placement only inside D3-b (Sterrenkamer composition). |
| S3-017 medallion | 3 | 2 (a disc with lozenges) | 1 (a dot on a 15.6 m wall) | 3 | 2 (flat terracotta, no relief light) | 5 | 1 (no relation to furniture) | low | **REMODEL** | Real relief: a raised border profile; bud and leaves as sculpted, overlapping volumes; terracotta with a glaze / patina split. **Ø 0.55–0.6 m.** Place it where it relates: over the botanic work table axis or the potting / herbarium zone, decided in D3-b with the room composition. Model now; final placement in D3-b. |
| S3-030 mask | 3 | 2 (an ellipsoid with lozenges; the flame crown missing) | 1 | 2 | 2 (the colour zones are separate shells, not painted planes) | 4 | 1 (side wall, never on an axis) | low | **REMODEL** | Elongated almond face with the **flame-shaped crown**, a strong nose ridge, cut eye openings and the painted zones as one surface. **≈ 0.6–0.7 m.** Re-place it on the cottage's main sightline (§5 cottage). |
| S3-031 lemon tile | 4 | 3 | 2 (a stamp on a large façade) | 4 | 4 (glaze reads) | 5 | 2 (corner, away from the table) | ok | **SCALE_POSITION** | The model is acceptable. Present it as an **architectural panel**: 2 × 2 tiles, or the single relief set in a 4 × 4 azulejo field (≈ 0.9–1.2 m) with a stone surround. Put it on the wall **behind the terrace table zone** (owner). Reuse the geometry; the surround is new. |
| S3-033 fire screen | 3 | 2 (a dark box; the scrollwork vanishes at range) | 3 | 3 | 2 (flat black iron) | 4 | 2 (beside the grill, neither windbreak nor backdrop) | low | **DEFER_TO_D3_ROOM** | Decide in D3-e with the BBQ zone. It needs an open scroll silhouette (pierced, not a plate) and warmer iron with a rust edge, or remove it if the BBQ brief has no backdrop. |
| S3-037 heron | 4 | 4 (style good) | 2 (≈ 0.8 m beside a 1.6 m bench) | 3 (the stump is a plain cylinder) | 3 | 4 | 3 | good | **SCALE_POSITION** | ×1.4–1.5 (the heron itself ≈ 1.0–1.1 m), on a **wider, rooted stump** or a pile of stones at the water's edge, so it reads from the path. Base work is small craft polish within the same pass. |
| Gingerbread maquette | 3 | 3 | 3 | 4 | 3 (the brown reads as a model, the gingerbread wink is subtle) | 5 | 4 | ok | **DEFER_NO_GAIN** | Icing piping on the window heads and corners would sharpen the wink, but the gain at hall distance is small. Leave it. |
| Salon wall (D2 addendum) | — | 5 | 5 | 4 | 5 | 5 | 5 | good | **KEEP** | The best D2 result; treat it as a second quality anchor. |

### D2-R summary
- **KEEP:** S3-004, S3-015, S3-016, salon wall.
- **SCALE_POSITION:** keys (presentation), S3-031 tile, S3-037 heron.
- **REMODEL:** S3-014 swallows, S3-017 medallion, S3-030 mask.
- **DEFER_TO_D3_ROOM:** S3-033 fire screen.
- **DEFER_NO_GAIN:** maquette.
- **CRAFT_POLISH:** none on its own; the heron's base is folded into its scale pass.

**Root cause of the REMODEL group.** All three are *wall reliefs*, built as a flat base plus scattered ellipsoids.
- Relief only reads through **silhouette and raking light on real depth**.
- Our reliefs had neither: they are shallow (3–4 cm), small, and lit flat.
- The fix is the craft hierarchy (silhouette first: an outline that reads at 5 m), not more lozenges.

## 3. Object-level gaps (A)

| Gap | Where it shows | Lever (hierarchy step) |
|---|---|---|
| Ellipsoid-and-lozenge relief | mask, medallion, swallows, tile ornaments | silhouette: author the outline as an extruded or lathed profile, then a few deliberate volumes |
| Uniform thin depth | all wall pieces 3–4 cm | proportion: relief depth 6–12 cm for pieces that must read from a room |
| Slab massing | billiard body, kitchen islands, cabinets, library case carcasses | construction: corner posts / blocks, aprons that step back, cornices / plinths as profiles (`moulding()`), legs that visibly carry |
| Material shells instead of painted planes | mask colour zones, maquette icing | material identity: one surface with the colour split in authored vertex colour / UV, not stacked shells |
| Flat dark metal | fire screen, shed key | material identity: warm iron with edge wear (two-tone vertex colour), never near-black |
| Small hero pickups | keys | placement / presentation: framing surface plus presentation scale |
| Missing contact | small props on tables | grounding: existing `ContactShadows` / baked AO used consistently on hero pieces |

## 4. VCP-01 (draft PR #9): what to reproduce, what not
Read-only review of `src/world/libraryCraft.ts`, `docs/vcp01/*`, the tests and the capture tooling. Nothing was merged,
cherry-picked or copied.

**Status of the branch:**
- It branched at `3e09c98`, before D1, D1-R and D2. It merges textually clean with `f26e563`, but every piece of its evidence predates production.
- The **four-legged globe has no rendered evidence**: `VALIDATION_STATUS` four-leg fields are null and the browser regression run was not done. Its only check is an AABB connectivity test, which cannot catch a wrong rail orientation.
- The cost is unmeasured: about 8–9 k triangles by segment count, against 1,064 for the production `floorGlobe`.
- **Library budget:** the library-b view has only **≈ 7 k triangles** of headroom left (242.7 k of 250 k). Any library craft work there has to be triangle-neutral.

| Technique | Already in production? | Value at player-eye | Verdict |
|---|---|---|---|
| Construction-first modelling, explicit support chains / joinery | yes: `Asm.begin/end` + `auditParts`, `joinery.*` | **high**: it fixes slab massing | **ADOPT** as a D3 working rule (design review before modelling). No new code. |
| Lathed / profiled wood | yes: `artkit.lathe`, `moulding()` | clear on hero silhouettes (globe, legs, balusters); modest on ordinary furniture | **ADOPT-NARROW**: hero pieces and the pieces whose silhouette is the problem (billiard legs / rails, table pedestals, porch columns) |
| Native sphere UV + painted cartography | no (the globe is an icosahedron with blobs) | strong on the globe | **ADOPT-NARROW**: the globe only, at D3-d |
| Axis-aware grain | yes: `projectUV(…, grain)`; `sb` picks the axis | small | existing; apply where grain visibly runs wrong |
| Selective subdivision (`softBox` mid, `cushion`) | yes | modest (chairs) | **ADOPT-NARROW**: upholstery that visibly deforms |
| Local contact grounding | yes: `ContactShadows` | small (too dark in the pilot) | existing; tune per piece |
| Authored vertex AO (`bake`, `baseAO`) | yes | small to moderate | existing; use on new hero pieces |
| **Matched standard / neutral / clay capture** (`vcp01-capture.mjs`: frozen tick, forced render plus `gl.finish()` before counters, Phong-aware clay) | partly (our harness has standard only) | **high as process** | **ADOPT**: generalise it into our audit harness (`MODE=neutral|clay`). Fix its path drift. |
| Private `turned()` lathe helper (cap removal, axis normals) | differs from `artkit.lathe`; production avoids its problem with the 0.001 radius idiom | none visible | **REJECT** promotion (one use case; the VCP report itself says not to standardise it) |
| Fine bevels / hidden topology (4 mm radii, chamfered bands) | yes via `sb` | none at 3 m | **LOW-VALUE**: do not pursue |

The globe goes to D3-d. Three variants get compared with matched captures (9 poses × standard / neutral / clay), with
`assetTris` and explicit-render counters:
- production `floorGlobe` (library and study);
- the pedestal pilot;
- the four-legged `craftGlobe`.

Two conditions apply:
- The library-b triangle headroom means the winner must be paid for: for example, by trimming hidden book geometry in the same room.
- No VCP code merges until the branch is rebuilt on production with fresh evidence and a sequential `e2e`, `dev04b/c/d` run.

## 5. Room-level gaps (B)
Updates `DEV04D_ROOM_AUDIT.md` after D1 / D2.

| Room | Composition problem (from the captures) | Highest-value fix | Batch |
|---|---|---|---|
| **Kitchen** (12.6 × 17.6 m) | Islands of furniture in a huge tiled floor: the island, two tables and the crates float without a work triangle. The long walls are a uniform run of cabinets / shelves. | One working zone (range + prep table + island, with use traces) and one eating zone; the floor area broken by a runner / tile border; one wall with real depth (dresser with plates). | D3-a |
| **Dining / game room** | The long table on the axis works. The side table is a lone island. The north end is weak. | Game-table scene (G1 / G2); the side table becomes the drinks supply against a wall; a sideboard composition at the window end. | D3-a |
| **Botanic room** (6.3 × 15.6 m) | Everything is in the middle third: the table island, prints on one wall, the medallion a dot on the other. Both ends are empty. | Working centre at one end (potting / herbarium bench under a window), a plant stand cluster at the other; the medallion over the work zone. | D3-b |
| **Study** | Salon wall + reading corner good; the desk end under the window is fine; the middle of the room is empty floor. | A map-chest / library table in the middle; the walk line kept. | D3-b |
| **Living** (12.6 × 13.6 m) | Sofa group around the hearth is good; the west half and the long walls are empty; bookcases are dark slabs. | A second zone (reading / music); bookcase carcass craft. | D3-d |
| **Library** | Strong double-height volume and balustrade. The cases read as boxes with flat book faces; the floor is one big rug and reading table. | Case carcasses with pilasters, cornice and plinth profiles; varied book depths and leaning books (triangle-neutral); the globe decision. | D3-d |
| **Billiard** | The table is a slab body on a flat bed; walls bare except two boards; floor-lamp only. | Remodel the table (§6); a cue rack and score board composition on one wall; a pendant lamp over the table. | D3-d |
| **Portugal cottage** | The long table and D2-046 on the arch axis work. The mask hangs on a side wall, invisible from the arch. The entry painting sits on a weak wall. | The mask on the **axis wall seen through the arch** (beside D2-046, or over the sideboard); move the entry piece only if it gains a stronger wall. | D2-R (mask) / D3-f |
| **Portugal terrace** | The game table is good; the tile is a stamp on the far corner. | The azulejo panel on the wall **behind the table zone** (D2-R). | D2-R |
| **BBQ** | A bare slab with the grill, screen, table and gas bottle in a row. | Ground edge, a backdrop decision and use traces. | D3-e |
| **Lake viewpoint** | Bench + heron; the heron is too small to anchor. | Heron scale + base (D2-R). | D2-R |

General patterns:
- **object islands in oversized rooms** (kitchen, botanic, living);
- **uniform spacing** of runs (kitchen cabinets, library cases);
- **free-wall placement** of identity pieces instead of axis / furniture relations;
- few **use traces** outside the dining table.

## 6. Estate / architecture gaps (C)

| Element | What reads wrong at player-eye | Bounded fix | Batch |
|---|---|---|---|
| **Front façade** (`env/e-facade-*`) | One ashlar texture tiles uniformly over two long storeys. No plinth course of real depth, no quoins at the corners, thin string course; dormers and chimney fine. | A deep plinth course, corner quoins, a stronger string / cornice profile, window sills and lintels with depth; tint variation per course (vertex colour). No new textures. | D3-e |
| **Portico / entrance** (`env/e-portico*`) | Two thin Tuscan columns carry a slim flat entablature in front of a flat wall. The door surround is a thin frame and the steps a flat slab. | Proportion: thicker columns with entasis (lathe), a real entablature (architrave / frieze / cornice via `moulding`), pilasters responding on the wall, a door case with a fanlight, and steps with a nosing. The single most visible architectural hero. | D3-e (first item) |
| **Door / window surrounds** | Interior doors have thin flat casings; windows have no reveals inside. | A shared profiled casing and plinth-block family (one `moulding` profile), applied room by room in D3 batches. | D3-a… |
| **Forecourt ground** (`env/e-forecourt-ground`) | A large flat gravel plane with one repeating texture; the planter is a plain round slab. | Edge kerbs, drive wear tracks (vertex tint), a stepped stone planter rim. | D3-e |
| **Large interior floors** | Kitchen tiles and the hall stone tile uniformly across 12–17 m. | Borders and runners that define zones; no new materials. | D3-a, D3-d |
| **Billiard table** (`env/e-billiard`) | Slab apron, flat cushions, short legs hidden behind the apron. | Turned legs that read below a shallower apron, corner blocks, a moulded top rail, cushion profile, pocket leathers. | D3-d |
| **Library shelving** (`env/e-library-*`) | Carcass boxes with a flat book face; identical modules. | Pilaster / cornice / plinth profiles, a varied module width, a ladder rail. Triangle-neutral (library-b ≈ 7 k headroom). | D3-d |
| **Garden ↔ path ↔ woodland transitions** | Paths are flat strips; terrace slabs end abruptly in lawn. | Edging stones and a grass-over-edge blend at the most visible junctions (arrival, terrace, lake). | D3-e / D3-f |

## 7. Priority matrix
Impact at player-eye × reach (how many players see it) ÷ cost.

| # | Item | Impact | Reach | Cost | Where |
|---|---|---|---|---|---|
| 1 | Portico + front façade articulation | very high | everyone, first impression | M | D3-e (could be pulled forward: owner decision O-3) |
| 2 | Key pickup presentation | high | everyone (four mandatory pickups) | S | D2-R |
| 3 | Mask remodel + cottage axis placement | high | cottage visitors | M | D2-R |
| 4 | Medallion remodel (placement in D3-b) | med | botanic visitors | M | D2-R + D3-b |
| 5 | Swallows remodel + scale | high | everyone upstairs | M | D2-R |
| 6 | Kitchen / dining composition + casework craft | high | everyone (puzzle rooms) | L | D3-a |
| 7 | Tile as an azulejo panel behind the terrace table | med | cottage visitors | S | D2-R |
| 8 | Heron scale + base | med | lake visitors | S | D2-R |
| 9 | Billiard table + library casework (+ globe) | med | many | M | D3-d |
| 10 | Botanic / study / living zoning | med | many | M | D3-b / D3-d |

## 8. Owner decisions before implementation

| # | Decision | Recommendation |
|---|---|---|
| O-1 | Run D2-R (the six items in the execution plan §4) as its own PR before D3-a | **yes**: the most visible complaints, about one bounded session |
| O-2 | Mask slot in the cottage: (a) beside D2-046 on the arch-axis north wall, or (b) over the sideboard on the west wall, seen from the table | (a): it is seen on entry through the arch |
| O-3 | Pull the portico / façade forward from D3-e to run right after D3-a (first-impression hero) | yes, if the owner values the arrival over strict batch order; otherwise keep it in D3-e |
| O-4 | Key presentation: a presentation scale of ×1.7 with a liner / tray. A subtle approach glint stays **off** unless the owner asks (no emission rule). | ×1.7 + liner; no glint |
| O-5 | S3-033 fire screen: remodel in D3-e or drop it from the BBQ | decide with the D3-e BBQ brief |
| O-6 | Globe: confirm a three-way comparison in D3-d, paid for by library triangle savings, with no VCP-01 code merged before a rebuild on production | yes |
| O-7 | The owner phone screenshots: re-send them so they are archived with this audit (`docs/dev04d/d30/owner/`) | — |
