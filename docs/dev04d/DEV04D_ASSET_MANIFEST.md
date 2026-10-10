# DEV-04D — Asset & source manifest (D0)

> **D0 PAUSED, PROVISIONAL (owner instruction, 10 Oct 2026).** The owner confirmed that the later FLW-D2, FLW-S3,
> FLW-K3 and partial FLW-RSV reference images exist: they were generated and approved in separate project chats and
> were never committed. Every "not available" / `WAITING_FOR_SOURCE` statement below describes **the repository at
> `6c5e5c6` only**, meaning *not yet imported*, not *does not exist*. The asset manifest, the D1 / D2 plan, the phase
> order (O1), the priorities and the owner decisions are **not final**. They will be reconciled against the imported
> FLW reference library. The room audit, captures and Wickerman design are preserved as working notes.

Audit date 10 Oct 2026, production `6c5e5c6` (PR #6 merge, verified = `origin/ccr-75ef4113-kfkimm`).

## 0. Search performed

| Where | How | Result |
|---|---|---|
| Working tree | `grep -rE "FLW-(D2\|S3\|K3\|RSV)-[0-9]+"`, `grep -r "FLW-"` | only `FLW-RSV-019 … 022` (DEV-04C plan / manifest text); no D2 / S3 / K3 id anywhere |
| Git history (133 commits, all refs) | `git log --all -S "FLW-"` | only the DEV-04C / C-R docs commits |
| Every remote branch (11) | `git ls-remote`; `git diff --diff-filter=A <prod> <branch>` for images, models, audio | **no branch adds any image / model / audio file over production**. `ccr-6f6fb018-yr1gfm` (PR #4, DEV-04B-R) was not in the DEV-04C branch list; it is fully merged and adds nothing |
| Session filesystem | `find / -iname "*FLW*"` | nothing |
| Connected Notion workspace | search "FLW-D2", "Feh Lu We" | no results |
| The D brief | text only | no attachments |
| Image files in the repo | `docs/reference/**`, `assets/**`, `public/**` | the 6 personalized sheets + source collage (below); branding (logo, favicon, 2 concept arts); `docs/concept-art/01–07` (early concept images); evidence captures |

**Finding (repository state only): no FLW-D2, FLW-S3 or FLW-K3 source image has been committed to the repository or is
present in this session, and no individual FLW id other than RSV-019…022 is recorded in it.** The owner confirms the
library exists outside the repo (separate project chats) and will be imported; this section is re-run after that
import. Rows for those families are therefore *family-level* plus the
concrete **integration slots** that a delivered file will plug into. No visual content is inferred for a missing
source; nothing was generated to stand in for one.

## 1. Action vocabulary

`IMPLEMENT` (source present, ready) · `KEEP` · `REFINE` (improve with an available reference) · `REPLACE` (swap a
placeholder when its source arrives) · `WAITING_FOR_SOURCE` · `RESERVED_HOLD`.
Priority P0–P3 as in the room audit. Subpass D1–D4 as in the master plan.

---

## 2. FLW families

| Stable ID | Name / subject | Intended location | Family | Source available | Source type | Current in-game representation | Status | Puzzle / story dependency | Prio | Subpass | Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `FLW-D2-###` (all) | 2D decorative artwork | manor / cottage walls (slots §5) | D2 | **no** | — | 8 procedural "sky + hill + blobs" paintings from one 4×2 atlas (`paintingTexture`), the DEV-04B-R hall landscape | not integrated | none (decor) — must stay off puzzle-bearing walls (§5.2) | P1 | D1 | `WAITING_FOR_SOURCE` |
| `FLW-S3-###` (all) | 3D decorative modelling references | sculptures / masks / carved pieces, shelf objects | S3 | **no** | — | none (the `06_art_decor/sculptures_masks_woodcarving` folder holds only `.gitkeep`) | not integrated | none | P2 | D2 | `WAITING_FOR_SOURCE` |
| `FLW-K3-###` (all) | gameplay key prop family | the four gameplay keys (§4) | K3 | **no** | — | box compounds + SVG icons (§4) | not integrated | **save-relevant ids stay**; art id maps to item id in a lookup | P2 | D2 | `WAITING_FOR_SOURCE` |
| `FLW-RSV-###` (general) | RESERVED puzzle / story material | RESERVED route | RSV | no | — | none | production paused | **puzzle / story-sensitive** | — | — | `RESERVED_HOLD` |
| `FLW-RSV-019` | RESERVED route fragment | — | RSV | no | — | none | PENDING | puzzle / story-sensitive; no mechanic change | — | — | `RESERVED_HOLD` |
| `FLW-RSV-020` | RESERVED route fragment | — | RSV | no | — | none | PENDING | idem | — | — | `RESERVED_HOLD` |
| `FLW-RSV-021` | RESERVED route fragment | — | RSV | no | — | none | PENDING | idem | — | — | `RESERVED_HOLD` |
| `FLW-RSV-022` | RESERVED route fragment | — | RSV | no | — | none | PENDING | idem | — | — | `RESERVED_HOLD` |

**Unblock path (owner)**: deliver either (a) the files themselves, or at least (b) the FLW **index** (id → subject →
intended room), so D0's slots can be bound to ids before the rasters arrive. Proposed drop location:
`assets/flw/d2/FLW-D2-###.<png|jpg|webp>`, `assets/flw/s3/FLW-S3-###_<view>.png`, `assets/flw/k3/FLW-K3-###_<view>.png`,
plus one `assets/flw/index.json` (`{ id, subject, family, room?, aspect?, frame?, status }`). D2 rasters for the game
are re-encoded to ≤ 1024 px long side (≤ ~150 KB each) at integration; the originals stay as delivered.

---

## 3. Approved internal references actually present (usable now)

Stable id = file stem (`_v01`; a later `_v02` goes beside it). All are **AVAILABLE_REFERENCE_ONLY**: modelling /
stylisation references, never shipped as textures.

| Stable ID | Subject | Location | Current in-game representation | Status | Dependency | Prio | Subpass | Action |
|---|---|---|---|---|---|---|---|---|
| `wickerman_clearing_sheet_v01` | Wickerman + clearing | Wickerman clearing | DEV-04B willow figure, DEV-04C setpiece | implemented | optional setpiece, never evidence | P1 | D4 | `REFINE` — lifecycle (`DEV04D_WICKERMAN_DESIGN.md`), plinth read, fire / smoke polish |
| `gingerbread_maquette_sheet_v01` | gingerbread manor maquette | hall, maquette table (west wall) | DEV-02 maquette of THIS house: pale cream walls, slate-blue roofs, glass conservatory, a thin white "icing" line on the main eaves (`maquette.ts`) | geometry ✓, material **not** done (deferred in C) | `mem.hall.maquette` inspect (id stays) | P1 | D2 | **`IMPLEMENT` now** — material re-skin per `GENERATED_REFERENCE.md`: gingerbread body, icing on edges / seams / trim, restrained red / green accents, plausible base board; the current-house silhouette is preserved (the sheet is *not* a licence for a generic cottage) |
| `copacabana_room_sheet_v01` | Copacabana Room bar / sign | conservatory | bar group + canopy sign "Copacabana Room" (DEV-04A/B) | implemented | pool symbols A2 evidence (visibility must stay) | P2 | D3 | `REFINE` — hanging glassware / bottles on real racks, towels, cocktail traces; restraint, no tiki overload |
| `attic_observatory_sheet_v01` | attic observatory | attic lookout (`atticLookout`) | telescope, desk, star chart, roof window (DEV-04A/B) | implemented | none (stars evidence stays in Sterrenkamer) | P2 | D3 | `REFINE` — observing traces (log, red torch, star-wheel, blanket on the chair) |
| `books_family_sheet_v01` | modular book family | every shelf | DEV-04B book family | implemented | catalogue books B1 (ids stay) | P3 | — | `KEEP` |
| `living_dining_furniture_sheet_v01` | living / dining furniture family | living, dining, suites | DEV-03/04B furniture | implemented | mantel / A01 evidence placements stay | P3 | D3 | `KEEP` — chair variants reused for the game-table scene |
| `personalized_boards_collage_v01` | source of the six sheets | — | — | — | — | — | — | `KEEP` (not used directly) |
| technical modelling board (`*_v02`) | orthographic / joinery versions of the six | — | — | **missing** | — | P3 | — | `WAITING_FOR_SOURCE` (not blocking) |
| External URL references (`REFERENCES.md` files) | construction / material principles | various | principles only | — | — | — | — | `KEEP` (no image stored, copyright) |
| NGA *Country House in a Park* (public domain, URL) | manor painting reference | — | — | URL only | — | P3 | D1 | inspiration for original paintings only, not a reproduction and not a substitute for FLW-D2 |
| `docs/concept-art/01–07` | early concept images | — | — | present | — | — | — | `KEEP` (historic; superseded by ART-01) |

---

## 4. Gameplay keys (FLW-K3 audit)

Gameplay ids are save-relevant and **do not change**; a future art id maps to them through a lookup
(`{ frontKey: 'FLW-K3-###', … }`).

| Item id | Pickup id | Where seen in the world | World model today | Inventory / held chip / inspect | K3 source | Action |
|---|---|---|---|---|---|---|
| `frontKey` | `pk.frontKey` | home tutorial, desk drawer (`home.ts:72`) | 3 boxes / cylinder: brass shank, round bow, red tag | SVG icon, ring bow + red tag (`ui/icons.ts`) | no | `WAITING_FOR_SOURCE` |
| `shedKey` | `pk.shedKey` | manor hall drawer (`manor.ts:448`) | 2 boxes: shank + wooden house-shaped hanger (reads as a block) | SVG, trefoil bow, house tag | no | `WAITING_FOR_SOURCE` |
| `studyKey` | `pk.studyKey` | library reading-table drawer, **on the archive card** (`manor.ts:720`) | the pickup object is the card; the key is a 3 × 1 × 10 cm brass box on it | SVG, brass, white label | no | `WAITING_FOR_SOURCE` |
| `consKey` | `pk.consKey` | service hatch, kitchen side (`manor.ts:907`) | brass box + green emissive blob ("green glass pendant") | SVG, green glass pendant | no | `WAITING_FOR_SOURCE` |

All four world models are weak (boxes), but the brief forbids inventing the approved K3 geometry, so they stay until
the sheets exist. D2 implementation contract when they arrive: one shared key family (bow / collar / shank / bit
construction), ~150–400 triangles each, prop-atlas material, distinct bows kept (ring / trefoil / square) so the
inventory icons and world models agree; the tag / hanger / pendant identity of each key preserved.

---

## 5. Existing wall art — inventory and D1 slots

### 5.1 Decorative (replaceable by FLW-D2 when delivered)

| In-game id (DEV-04A art registry) | Room | Size (m) | Content today | Issue | Action |
|---|---|---|---|---|---|
| `painting@94.90,89.35` | hall, above the stair (east wall) | 2.0 × 1.4, gilt | DEV-04B-R procedural manor-across-the-lake at dusk | the strongest painting; hero slot | `KEEP` (a FLW-D2 hero may supersede it only on owner choice) |
| `painting@85.12,92.50` | hall, west wall, ground level | 0.9 × 0.7 | atlas #0 | generic | `REPLACE` / `WAITING_FOR_SOURCE` |
| `painting@85.12,86.20` | hall, west wall at gallery height (y 4.6) | 1.2 × 0.9 | atlas #1 | generic | `REPLACE` / `WAITING_FOR_SOURCE` |
| `painting@77.25,80.45` | living, south wall | 1.2 × 0.85 | atlas #3 | generic; **same image as the north guest room** | `REPLACE` / `WAITING_FOR_SOURCE` (priority: living is a calibration room) |
| `painting@104.80,91.92` | dining / game room, north wall | 0.8 × 0.6 | atlas #7 | generic, undersized for the room | `REPLACE` / `WAITING_FOR_SOURCE` |
| `painting@90.00,103.92` | upstairs landing | 1.1 × 0.8 | atlas #2 | generic; same as a home-scene painting | `REPLACE` / `WAITING_FOR_SOURCE` |
| `painting@85.12,93.00` | upstairs walkway | 0.9 × 0.7 | atlas #5 | generic; same as a home-scene painting | `REPLACE` / `WAITING_FOR_SOURCE` |
| `painting@107.58,102.60` | north guest room (`storage`) | 1.0 × 0.6 | atlas #3 | duplicate of the living painting | `REPLACE` / `WAITING_FOR_SOURCE` |
| home scene `painting@0.04,1.60`, `painting@3.00,0.04` | home tutorial | 0.8 × 0.6, 1.0 × 0.7 | atlas #2, #5 | duplicates of landing / walkway | `KEEP` (P3; the home scene is outside the estate) |

The eight atlas paintings are the clearest "placeholder" read in the manor: one sky gradient, one hill line and five
dark blobs at 128 × 96 px. They are acceptable at distance and weak at first-person reading distance. **They are not
re-painted procedurally in D** (that would be a procedural imitation of unavailable artwork): they wait for FLW-D2.

### 5.2 Puzzle-bearing or puzzle-adjacent (never replaced by decorative art)

| Id | Room | Role | Action |
|---|---|---|---|
| `panel@84.82,96.60` library floor plan with room emblems | library | **B1 evidence** | `KEEP` (untouchable) |
| `panel@95.10,96.00` service chart (+ hatch) | kitchen | **A1 evidence** | `KEEP` |
| `panel@82.50,109.44` service drawing | basement archive | evidence | `KEEP` |
| route maps (two panels, lit / unlit) | basement route room | **D evidence** | `KEEP` |
| study framed route map | study | **B2 evidence** | `KEEP` |
| BOSLUST sign, cipher tablet, plate diagram | BOSLUST | **D2 / C evidence**, "exactly BOSLUST" | `KEEP` |
| `panel@78.60,93.90` star map | Sterrenkamer | room identity (ster emblem, B1 chain) | `KEEP` (motif must stay "stars") |
| `panel@78.60,86.68` travel sketch "onderweg" | Reiskamer | room identity (koffer emblem) | `KEEP` (motif must stay "travel") |
| `panel@107.50,{85.0, 89.0, 93.0, 94.6}` botanical prints (blad / varen symbols) | botanic room | room identity (varen emblem); uses the symbol drawings | `KEEP` |
| `panel@99.75,98.52` star chart | attic lookout | decor, observatory theme | `KEEP` / `REFINE` in D3 |
| Copacabana bar sign (`panel@128.60,109.35`) | conservatory | named personal memory, exact title | `KEEP` |

### 5.3 D1 slot plan (where FLW-D2 pieces should go — bound to ids once the index exists)

Not "fill every wall". One hero per main room, secondary pieces ≤ 0.9 m, nothing over openings (the DEV-04A
`wallArtConflicts()` contract enforces it), nothing on evidence walls (§5.2).

| Slot | Wall | Max size | Frame family | Notes |
|---|---|---|---|---|
| S-living-1 | living, south wall (today atlas #3) | 1.2 × 0.9 | gilt / dark timber | calibration room: first slot to fill |
| S-living-2 | living, wall between shelf and window (if clear) | 0.6 × 0.8 portrait | timber | optional |
| S-dining-1 | dining / game room, north wall (today atlas #7) | 1.4 × 1.0 | timber | bigger than today: the room is a hero room |
| S-hall-1 / S-hall-2 | hall west wall, two heights (today #0 / #1) | 0.9 × 0.7 / 1.2 × 0.9 | gilt | keep the stair landscape as the hall hero |
| S-landing-1 | landing south wall (today #2) | 1.1 × 0.8 | timber | |
| S-walkway-1 | walkway (today #5) | 0.9 × 0.7 | timber | |
| S-guestN-1 | north guest room (today #3 duplicate) | 1.0 × 0.6 | timber | |
| S-study-1, S-botanic-1, S-bedroom-* | long blank walls in the study / botanic / bedrooms | ≤ 0.9 | per room | only if the FLW index assigns art there; the botanic room keeps its prints |
| S-cottage-1 | Portugal cottage room | ≤ 0.8 | painted timber (blue) | local identity |
| S-billiard-1 | billiard room | ≤ 1.0 | dark timber | sporting / club motif if supplied |
| S-copa-1 | conservatory service corridor | ≤ 0.8 | bamboo / light timber | only if a tropical-memory piece exists |

---

## 6. Current 3D decorative assets (inventory, for D2 / D3 reuse)

| Family (code) | Members | State | Note |
|---|---|---|---|
| Furniture (`furniture.ts`, `dressing.ts`, DEV-04B) | table, roundTable, chair (carver / ladder / spindle), sofa, armchair, bookshelf, counter, farmhouseSink, bed2, bedside, wardrobe, desk, writingDesk, lectern, bathtub, pedestalBasin, towelRail, stool, slatBench, workbench, blanketChest, sideboard, larder, shelvingUnit, coatRail, luggageRack, billiardTable, cueRack, floorGlobe, telescope, lounger | mature | the kit D3 composes with |
| Props (`propkit.ts`, one 1024² atlas) | books (shelf / open / stacks), game boxes, beer crates, shopping crates, crate loads, drapes, rugs, straw | mature | the atlas has room for hay-bale ends, labels, a marshmallow bag |
| Table dressing (`tabletop()`) | candle, bowl, open book, chart … seeded clusters | mature | |
| Bottles / glasses | `bottleGeoOf('beer')`, `capGeo`, `shotGlass`, cocktail glasses | present | the game-table scene reuses them |
| Lights | lantern, sconce, table / floor lamp, chandelier, static variants | mature | |
| Hero builds | hearth (living), maquette, Copacabana bar, Wickerman, BOSLUST, cottage, wellness (sauna / jacuzzi), golf chute, well, campfire, shed | mature | |
| Personal recognition props (ENVIRONMENT_STORY PB04) | gravity bong, handpan, balloons + tank, golf bag, cars, red crates, instrument case: **present** · Nerf blasters + ~10 darts: **absent** | partial | Nerf: the owner's reference image is described in `ENVIRONMENT_STORY.md` but is **not in the repo** → `WAITING_FOR_SOURCE` (or owner decision: model a generic, unbranded foam-dart toy from the text) |
| Placeholders found in the room audit | bathroom "mirror" = frameless emissive box (`manor.ts:1119`); `kitchen.hatch` green blob key; atlas paintings | — | see room audit |

## 7. Audio sources

| Asset | Available | Action |
|---|---|---|
| Any recorded / composed audio | **none** in the repo; all sound is procedural (`src/audio/audio.ts`) | `KEEP` procedural |
| Wickerman ritual layer | to be synthesised (design §8) | `IMPLEMENT` in D4 (no source needed) |
| Optional owner-supplied original loop (drone / frame drum) | no | `WAITING_FOR_SOURCE` (optional, not blocking) |

## 8. Ready now vs. blocked

**Ready to implement with what is in the repo**: gingerbread maquette re-skin (D2), Copacabana / attic refinements
(D3), every D3 room curation, the game-table memory scene (D3), the Wickerman lifecycle + audio (D4).

**Blocked only by missing source files**: all FLW-D2 wall art (8 replaceable paintings + new slots), all FLW-S3
decorative 3D pieces, all four FLW-K3 key models, the Nerf blasters (unless the owner approves a text-based generic
model), the `*_v02` technical boards (not blocking).

**Never in D**: FLW-RSV-019 … 022 and any RESERVED material (`RESERVED_HOLD`).
