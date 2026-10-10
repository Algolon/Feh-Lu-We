# DEV-04D — Asset & source manifest (D0, reconciled)

Status: **D0 reconciled against the recovered FLW stable-ID library. For owner review. Nothing is implemented.**

| | |
|---|---|
| Production baseline | `ccr-75ef4113-kfkimm` @ `6c5e5c6` (unchanged, re-verified 10 Oct 2026) |
| Source library | PR #7 *Reference: import FLW stable-ID asset library*, branch `dev04-flw-reference-library` @ `93206dd`, **open, not merged**. Read directly from that ref (`git show`); nothing copied into the D branch |
| Library | `docs/reference/flw/` (`MANIFEST.json` is the machine source of truth): 126 stable-ID records, **67 selected canonical paths** (D2 32 · S3 27 · K3 4 · RSV 4), 246 PNGs incl. provenance, 633.8 MiB, validation 1187 / 1187 PASS |
| Separate, still authoritative | `docs/reference/dev04/**` (architecture, construction, environment, the six internal calibration sheets: §8) |
| Supersedes | the paused D0 manifest at `eb8c9df`, whose "no FLW source in the repository" finding was a repository-state finding only. It is now replaced by the per-ID reconciliation below |

All paths in the tables are relative to `docs/reference/flw/`. "Canonical" = the selected recovered reference path,
**not** production approval (library README).

---

## 0. Method

1. **Every canonical image was inspected visually**: all 32 D2 paintings (full frame, plus 100 % crops of the approved
   five and three review candidates), all 27 S3 sheets, all 4 K3 sheets and the 4 recovered RSV sheets. The S3-039 Wickerman sheet was
   compared with `dev04/05_landmarks_hero_props/wickerman_clearing/generated/wickerman_clearing_sheet_v01.png` and the
   in-game figure (`audit/x27`, `x28`). Notes per asset are in the tables, not inferred from filenames.
2. Recovered status, approval evidence and notes were taken from `MANIFEST.json` and `provenance/source-notes/*` per
   exact stable ID. Relevant evidence that does **not** amount to approval is quoted, not promoted:
   - the Batch 02 README "Only the 13 approved Batch 02 designs" (D2-004/005/008/010/011/015, S3-008/009/012/013/043/044/045);
   - the Batch 03 "Concept style approved candidate" (S3-014/016/017).
   Both are design-level and pre-date later rejections (D2-011). The recovery task kept these assets REVIEW_READY, and
   so does D0.
3. In-game equivalents were checked in the code: `painting()` calls, the art registry, `items.ts`, `ui/icons.ts`, the key
   pickups, `furniture.ts barSign`, `wickerman.ts`, `canon.ts` / `clues.ts`.
4. Source gaps were re-checked:
   - no file named for any gap ID exists on any branch;
   - only the PR #7 branch carries FLW images (196 named files);
   - no other concrete repository source exists for the 15 gap IDs.

**Resolution is not the constraint for D2.** Every canonical D2 file is ≥ 868 px on its short side and shows clean
painterly detail at 100 %. A 1.4 m canvas seen from 2 m covers roughly 300–350 px of a 412 × 915 phone viewport. A 512 px
texture (768 px for a hero) is therefore enough. The "not a native 4K master" caveat matters for print, not for this
game. So every canonical D2 counts as **suitable as a direct in-game raster** on technical grounds. Only composition
and readability (noted per item) separate them.

## 1. D0 classes

| Class | Meaning | From recovery status |
|---|---|---|
| `APPROVED_IMPLEMENT` | approved source; implement in its D subpass after ordinary technical checks | `APPROVED_2D`, `APPROVED_3D_REF`, `APPROVED_KEY_REF` |
| `REVIEW_READY_OWNER_GATE` | inspected, location / role proposed, owner group A / B / C (§9); **not** implemented before an owner yes | `REVIEW_READY` |
| `REFERENCE_ONLY` | informs a model, material or composition; never shipped as-is | REVIEW_READY sheets that only guide existing work (frames, Wickerman, RSV) |
| `KEEP_EXISTING` | the in-game version stays; the sheet does not replace it | — |
| `REFINE` · `REGENERATE` · `AMBIGUOUS` | recovery holds, preserved; no D implementation; alternatives not picked by looks | same |
| `WAITING_FOR_SOURCE` | no usable image (`TEXT_ONLY` in the recovery) | `TEXT_ONLY` |
| `RESERVED_HOLD` · `PENDING` | RESERVED workflow paused; RSV-019…022 never reconstructed | same |

## 2. Counts after reconciliation

| D0 class | D2 | S3 | K3 | RSV | Total |
|---|---|---|---|---|---|
| `APPROVED_IMPLEMENT` | 5 | 1 | 4 | — | **10** |
| `REVIEW_READY_OWNER_GATE` (group A / B / C) | 27 (8 / 14 / 5) | 20 (8 / 11 / 1) | — | — | 47 |
| `REFERENCE_ONLY` | — | 4 (S3-039, 043, 044, 045) | — | 4 | 8 |
| `KEEP_EXISTING` | — | 2 (S3-009, 013) | — | — | 2 |
| `REFINE` | 1 | 4 | — | 1 | 6 |
| `REGENERATE` | 1 | — | — | — | 1 |
| `AMBIGUOUS` | 15 | 10 | — | — | 25 |
| `WAITING_FOR_SOURCE` | 1 | 4 | — | 6 | 11 |
| `RESERVED_HOLD` | — | — | — | 12 | 12 |
| `PENDING` | — | — | — | 4 | 4 |
| **Records** | 50 | 45 | 4 | 27 | **126** |

S3-043/044/045 are grouped A in §9 *as a frame family reference* (the owner approves the look). S3-009 and S3-013 are
`KEEP_EXISTING` / group C (§5).

---

## 3. Approved, ready for implementation (`APPROVED_IMPLEMENT`)

| ID | Source | Inspection | Proposed location | Current in-game | Implementation | Sub | Concerns |
|---|---|---|---|---|---|---|---|
| FLW-D2-002 *Het laatste zonlicht* | `2d/FLW-D2-002_het-laatste-zonlicht.png` 1619 × 971 (5:3) | golden-hour beech / oak lane, path leading right into low sun; clear value structure (dark trunks, bright path); crisp at 100 %; NW-European woodland, fits ART-01 palette | **hall, west wall at gallery height** (today atlas #1, `manor.ts:394`, 1.2 × 0.9) → 1.35 × 0.81 | atlas painting #1 | image-backed `painting` (5:3), gilt frame kept | D1-a | warm palette shares a family with D2-007: keep them on different heights / walls (done here) |
| FLW-D2-007 *De stille eik* | `2d/FLW-D2-007_de-stille-eik.png` 1086 × 1448 (3:4) | single ancient oak, mossy roots, sun low right; strong silhouette, portrait | **hall, west wall ground level** (today atlas #0, `manor.ts:395`, 0.9 × 0.7) → 0.66 × 0.88 portrait | atlas #0 | idem, portrait frame | D1-a | the portrait slot must pass `wallArtConflicts()` beside the maquette table; dark lower third: check under hall light |
| FLW-D2-026 *De kust na de regen* | `2d/FLW-D2-026_de-kust-na-de-regen.png` 1672 × 941 (16:9) | rocky coast and cliffs at sunset, surf; saturated warm / teal; excellent detail | **living, south wall** (today atlas #3, `livingSample.ts:606`, 1.2 × 0.85) → 1.4 × 0.79 | atlas #3 (also duplicated in the guest room) | image painting, dark timber frame | D1-a | living is a calibration room with ≈ 20 calls headroom: must stay in the existing material / atlas (0 new calls). The dead `manor.ts:484` duplicate at (78, 80.45) is checked in D1 |
| FLW-D2-028 *Het huis in de nacht* | `2d/FLW-D2-028_het-huis-in-de-nacht.png` 1619 × 971 (5:3) | night forest, warmly lit house by a lake: a quiet echo of the estate itself; deep blues | **upstairs landing, south wall** (today atlas #2, `manor.ts:1056`, 1.1 × 0.8) → 1.3 × 0.78 | atlas #2 | image painting | D1-a | the darkest approved piece: it can read as a black rectangle under the landing sconces. D1 checks it at low quality and lifts exposure only through the frame light, not by editing the image. It does not replace the DEV-04B-R hall hero (owner may swap: decision D1-H) |
| FLW-D2-046 *Een middag in Portugal* | `2d/FLW-D2-046_een-middag-in-portugal.png` 1672 × 941 (16:9) | sunlit Mediterranean street, bougainvillea, steps, harbour town; Portuguese identity explicit | **Portugal cottage room** (`cottageRoom`), the wall not carrying `mem.cottage.table`, ≈ 0.9 × 0.51 | none (bare wall) | image painting, painted (blue) timber frame | D1-a | the cottage is a restraint calibration target: **one** piece only, unless the owner also approves D2-045 / 047 (§9) |
| FLW-S3-004 *Houten vogelbeeld* | `3d/FLW-S3-004_houten-vogelbeeld.png` (sheet) | faceted carved songbird, oiled oak; front / side / back / ¾ are **consistent** (the only fully coherent multi-view sheet); faceting already reads low-poly | location **unknown** in the inventory; proposed: rear nook side table (`rearNook`) or the study reading cluster, never on an evidence surface (mantel E01, sideboard A01, start console) | none | one faceted mesh (≈ 300–500 tris), oak vertex colour, prop atlas wood | D2-a | size not given: model at ≈ 22 cm tall (shelf object). Location: owner decision K-B |
| FLW-K3-001 *Landhuissleutel* → `frontKey` | `keys/FLW-K3-001_landhuissleutel.png` | brass trefoil bow, collared shank, E-bit, red leather tag "LANDHUIS"; 120 mm. Front / side / ¾ and the orthos agree on bow, collars and bit | home dresser drawer (`home.ts:79`) and every held / inventory use | 3-box compound + SVG icon (trefoil ✓ red tag ✓) | key-family mesh (§6) | D2-a | the tag text is not modelled (unreadable at world scale); the item text "voordeur landhuis" stays |
| FLW-K3-002 *Studeerkamersleutel* → `studyKey` | `keys/FLW-K3-002_studeerkamersleutel.png` | small brass round-bow key, fine bit, ivory paper tag; 80 mm | library desk drawer, on the archive card (`manor.ts:720`) | 3 × 1 × 10 cm box on the card + icon (ring ✓ white tag ✓) | key-family mesh; the card stays the pickup object | D2-a | **the sheet's tag is misspelt "Studerkamer"** in every view: do not reproduce. The tag is left blank, or set "studeerkamer" in the item's existing wording |
| FLW-K3-003 *Bosschuursleutel* → `shedKey` | `keys/FLW-K3-003_bosschuursleutel.png` | square bow, robust shank, broad stepped bit, wooden house-shaped hanger; 105 mm | hall drawer (`manor.ts:447`) | 2 boxes (shank + block) + icon (square ✓ house ✓) | key-family mesh | D2-a | **the render reads copper / bronze; the spec says dark iron with rust.** Follow the spec (dark iron, rust accents) so the grounds key contrasts with the brass manor keys |
| FLW-K3-004 *Serresleutel* → `consKey` | `keys/FLW-K3-004_serresleutel.png` | brass **oval** bow, green glass teardrop on a copper ring; 95 mm | kitchen service hatch (`manor.ts:907`) | brass box + green emissive blob + icon (**ring** bow) | key-family mesh; the glass drop non-emissive (tinted, slight specular) | D2-a | icon bow `ring` → `oval` to match the sheet (`ui/icons.ts:136`); the glow blob goes (decor never uses focus language) |

**K3 view consistency**: the four orthographic panels share one generic template (identical collars and bit) and do
not reproduce each key's bit exactly. The 3D views are authoritative for the bow / tag identity; the orthos for
proportions (length / bow width / thickness). No sheet shows an impossible geometry.

---

## 4. FLW-D2 — 2D decorative art (50 records)

Locations: the inventory location is given where the recovery has one; otherwise the location is **proposed by D0**
from the image and `ENVIRONMENT_STORY.md` ("geen geheime code op ieder schilderij": paintings must never read as
clues). All REVIEW_READY rows are `REVIEW_READY_OWNER_GATE`, approval required. Group = §9.

| ID | Source | Inspection | Intended / proposed location | Current in-game | Proposed implementation | Sub | Grp | Concerns |
|---|---|---|---|---|---|---|---|---|
| D2-004 *Regen op de Veluwe* | `2d/…004_regen-op-de-veluwe.png` 4:3 | **title / subject mismatch**: shows a golden sunset over heath with a stream, *no rain*. Good quality, interpolated export (soft at 100 %) | — | — | none unless the owner accepts the subject as is | — | C | duplicates the warm-woodland role of 002 / 007; the rainy subject exists in D2-035 |
| D2-005 *Kleikom, appels, ruwe tafel en linnen* | `2d/…005_….png` 4:5 | warm still life, clay jug and bowl of apples on a rough table; sound | **kitchen**, wall above the table end | none | image painting, timber frame | D1-b | A | interpolated export, fine at 512 px |
| D2-006 *Onbekende portretstudie* | `2d/…006_….png` 3:4 | loose painterly portrait of a smiling woman | — | — | park | — | C | a specific, recognisable face in a house of real friends invites "who is this?": a narrative / clue read the story rules out |
| D2-008 *Schaduwvlakken* | `2d/…008_….png` 1:1 | abstract navy / ochre shadow planes with leaf silhouettes; graphic, reads well at distance | study or attic common | — | image painting, slim frame | D1-b | B | modern; one per house at most |
| D2-009 *Mot boven wilde bloemen* | `2d/…009_….png` 4:5 | moth over wild flowers, soft pastel | botanic room (secondary wall) | botanic prints (keep) | small print | D1-b | B | must not compete with the varen-emblem prints |
| D2-010 *Na het feest* | `2d/…010_….png` 4:3 | after-party still life: wine, bread, grapes, pewter jug on red drapery | **dining / game room, north wall** (today atlas #7, 0.8 × 0.6 → 1.4 × 1.05) | atlas #7 | image painting, dark timber, larger slot | D1-b | A | thematically right for the played-evening room; warm reds under candlelight: check saturation |
| D2-013 *Perentak in houtdrukstijl* | `2d/…013_….png` 3:4 | woodcut pear branch on cream; crisp graphic | pantry or kitchen (second piece) | — | print, slim frame | D1-b | B | one kitchen piece is enough (D2-005 first) |
| D2-015 *Laatste partij* | `2d/…015_….png` 16:9 | lit house at night by a stream; the house is a porch / wrap-around American type | — | — | park | — | C | duplicates D2-028's role; the architecture contradicts the manor; the title ("last game") invites a clue read in the game house |
| D2-016 *Recreatieprint* | `2d/…016_….png` 3:4 | mid-century abstract curves, olive / ochre / rust / navy | attic common or billiard | — | print | D1-b | B | — |
| D2-017 *Botanische cyanotypie siergras* | `2d/…017_….png` 1:2 | cyanotype grasses, blue / cream; narrow format | bathroom (beside the framed mirror) | — | narrow print | D1-b | B | — |
| D2-021 *Berkenstudie* | `2d/…021_….png` 1:2 | birch trunks; narrow | walkway pier or rear nook | — | narrow print | D1-b | B | — |
| D2-022 *De onbekende reiziger* | `2d/…022_….png` 3:4 | traveller seen from behind at a window, backpack, mountains outside; rich | **Reiskamer**, wall opposite the travel sketch | travel sketch panel (identity, keep) | image painting | D1-b | A | the figure is from behind (no identifiable face): fine. It must not sit next to the koffer-emblem sketch |
| D2-023 *Twee elkaar rakende horizonvlakken* | `2d/…023_….png` 1:1 | moody dark horizon, copper light | study | — | painting | D1-b | B | dark: exposure check |
| D2-025 *Abstracte papiermarmering* | `2d/…025_….png` 3:4 | marbled endpaper pattern | library gallery or archive | — | print | D1-b | B | library is a restraint room |
| D2-027 *Bergreisprint* | `2d/…027_….png` 3:4 | alpine valley with lake, painterly | Reiskamer (second) or north guest room | — | painting | D1-b | B | — |
| D2-029 *Maanlicht op water* | `2d/…029_….png` 1:1 | pastel moonlight on water, blue / lilac | **Sterrenkamer** | star map (identity, keep) | painting | D1-b | A | night theme without star imagery: supports, does not duplicate, the ster emblem |
| D2-030 *Gestileerde varens en waterpoel* | `2d/…030_….png` 3:4 | ferns around a pool; painterly rather than stylised | bathroom or guest WC | — | painting | D1-b | B | — |
| D2-035 *Zomerregen op een landweg* | `2d/…035_….png` 4:3 | wet sandy lane through oak / birch after rain; cool daylight | **north guest room** (today the duplicate atlas #3, 1.0 × 0.6) or walkway | atlas #3 duplicate | painting | D1-b | A | the only cool-daylight Veluwe piece: balances the warm approved set |
| D2-036 *Een open plek* | `2d/…036_recovered-reference.png` 1:1 | sunlit oak clearing | — | — | park | — | C | fourth warm sunlit-woodland piece (002, 007, 042) |
| D2-037 *Takken op wit* | `2d/…037_….png` 3:4 | bare branches in the lower corners of a pale sheet | — | — | park | — | C | at room distance it reads as a blank panel |
| D2-038 *Bos in vier seizoenen* | `2d/…038_….png` 4:3 | quadriptych (spring / summer / autumn / winter) with baked dividers | landing long wall or walkway | atlas #5 (walkway) | one frame, or four narrow frames from the four panels | D1-b | B | splitting uses the source as delivered (crop only, no repaint) |
| D2-039 *Voorbij de boomtoppen* | `2d/…039_….png` 16:9 | panorama over misty forest from height | attic lookout or attic common | — | painting | D1-b | B | sloped attic walls limit the slot |
| D2-041 *Het bos zonder wind* | `2d/…041_….png` 5:3 | dark forest stream, mossy rocks | **BOSLUST entree** (inventory, Hero P1) | — | painting | D1-b | B | low-key image in a dim space: exposure risk; the entry wall carries cipher / plate evidence (calibration target, touch lightly) |
| D2-042 *Onder hetzelfde bladerdak* | `2d/…042_….png` 16:9 | sunlit oak canopy | **BOSLUST verzamelzaal** (inventory, Hero P1) | — | painting | D1-b | A | the gathering hall is finale-adjacent: the package itself says "D03 story neutral". Placement off the end-letter wall |
| D2-044 *Houtdruk hout, zaagsel en gereedschap* | `2d/…044_….png` 4:3 | woodcut plane, saw, chisel, shavings | **workshop** (G11) | — | print, slim frame | D1-b | A | ties to "the board game was built here" (SI) |
| D2-045 *De weg naar de kust* | `2d/…045_….png` 4:3 | coastal path to a white cottage, sea, pines | **Portugal cottage entree** (inventory) | — | painting | D1-b | A | cottage restraint: with D2-046 that makes two pieces in two rooms |
| D2-047 *Vogels rond een schaakachtig tafelblad* | `2d/…047_….png` 5:4 | robin, blue tit, goldfinch and wren round a chequered café table; azulejo vase | Portugal cottage room (inventory) | — | painting | D1-b | B | a third cottage piece crowds the room; a chequerboard can read as a puzzle. The package says "no meaningful positions" |
| D2-001, 003, 012, 018, 019, 020, 024, 031, 032, 033, 034, 040, 048, 049, 050 | provenance alternatives only | not selected | — | — | none | — | — | `AMBIGUOUS`: owner selection evidence needed (library README). D0 does not pick by looks |
| D2-011 *Dansende bosdieren* | provenance only | owner rejected the anatomy | — | — | none | — | — | `REGENERATE` |
| D2-014 *De open deur* | provenance only | flagged too Mediterranean | — | — | none | — | — | `REFINE` |
| D2-043 *Saunastoom in houtdrukstijl* | — | no image | sauna | — | none | — | — | `WAITING_FOR_SOURCE` |

---

## 5. FLW-S3 — 3D modelling references (45 records)

The sheets are illustrations, not certified orthographics. View inconsistencies are flagged so the model follows the
majority of views instead of reproducing impossible geometry. All REVIEW_READY rows are `REVIEW_READY_OWNER_GATE` unless
classed otherwise.

| ID | Inspection (incl. view consistency) | Intended / proposed location | Current in-game | Proposed implementation | Sub | Grp / class | Concerns |
|---|---|---|---|---|---|---|---|
| S3-001 *Eikenbladconsole* | carved oak acanthus / oak-leaf corbel. **Inconsistent**: the front shows the leaf proud of a solid face; the side and ¾ views show it inside an open arched recess | hall or vestibule shelf bracket | — | corbel pair under a shelf, side-view construction | D2-b | B | decide on solid vs. open construction before modelling |
| S3-007 *Oude koperen bakvorm* | fluted copper tart tin, hammered; views consistent | G06 kitchen (inventory) | pans on a rail | one lathe mesh, hung on the rail | D2-b / D3 | B | small; better as part of the D3 kitchen work |
| S3-008 *Houten vosmasker* | faceted fox mask, rear hanger; low-res board crop (interpolated) | living east half or attic common | — | faceted mesh ≈ 400 tris | D2-b | B | low source detail; the rear view is flatter than the front / side |
| S3-009 *Copacabana Room interior* | shaped plank sign, hibiscus, monstera, "Copacabana Room" correct in the front view | conservatory bar | **DEV-04B owner-directed drawn bar sign** (`furniture.ts barSign`) | none: keep the existing sign; the sheet stays a reference for any later re-skin | — | `KEEP_EXISTING` (C) | AI lettering in the small views; Batch 02 requires typeset text anyway |
| S3-011 *Abstract reliëf uit teruggewonnen hout* | overlapping reclaimed planks with arcs; front / ¾ / side / rear (cleats, keyholes) **coherent** | attic common or billiard (large blank wall) | — | layered plank relief, vertex colour | D2-b | B | P2 in its own sheet |
| S3-012 *Tropisch houten wandmasker* | leaf-crowned smiling mask; **blurry interpolated crop** | Copacabana Room | — | none | — | C | low source quality; tiki direction contradicts "no tiki overload" |
| S3-013 *Copacabana Room exterior* | hanging sign on a post arm; the ¾ / side views have **garbled lettering** | — | outdoor name boards **removed in DEV-04A** by owner direction | none | — | `KEEP_EXISTING` (C) | reinstating it reverses an owner decision |
| S3-014 *Gesneden zwaluwen* | three carved swallows, oiled oak with cool tint (art); plus a coherent blockout. **Art vs. blockout differ**: the art is a horizontal flight line, the blockout a triangular cluster with other poses | **bovenoverloop / landing** (sheet: room identity P1), ≈ 90 × 50 cm | — | three flat-relief swallows on a hidden rail, art-direction look, blockout proportions | D2-b | A | owner picks the composition (line vs. cluster); recommend the art's line |
| S3-015 *Miniatuurzeilboot* | wooden model sloop on brass posts; front / side / rear / top / ¾ **consistent** | **Reiskamer** (inventory) | open suitcase memory | hull + mast + sail mesh; rigging as 3–4 thin lines max | D2-b | A | simplify the rigging; place on the desk, not in the suitcase cluster |
| S3-016 *Keramische maanvorm* | ivory crescent on an oak block (art); the blockout adds a collar disc and stepped base | **Sterrenkamer** (sheet: P1), ≈ 24 cm | — | extruded crescent + base | D2-b | A | follow the art's simpler base; no star map |
| S3-017 *Terracotta bloemmedaillon* | terracotta bud relief disc, Ø 35 cm, coherent | **botanic room** (sheet: P1) | botanic prints | shallow disc relief | D2-b | A | must not read as a new varen / blad symbol (no coded botany: its own sheet) |
| S3-022 *Stenen bloemornament* | weathered limestone block with a five-petal flower. **Inconsistent**: the flower is centred in the front view, lower-left in the ¾ view | garden terrace wall or sauna deck | — | relief block | D2-b | B | location unknown in the inventory |
| S3-023 *Houten drukbloksculptuur* | leaf printing block. **Inconsistent**: the front view shows the knob above the block; the side / rear views put it centred on the back. Follow side / rear | **archive** (inventory, P2) | — | small block mesh | D2-b | B | the archive is a restraint room |
| S3-025 *Houten bladeren-/schorsrelief* | oak leaves over bark in a frame, ≈ 3 cm deep; rear cleats; the ¾ view mirrors the leaf direction | **BOSLUST entry** (inventory) | — | relief panel | D2-b | B | calibration target; evidence walls |
| S3-026 *Takfries* | open-work branch frieze; the rear cut-outs are simpler than the front openings | **BOSLUST gathering** (inventory) | — | alpha-tested plane on a frame (not modelled branches) | D2-b | B | finale-adjacent room |
| S3-027 *Houten bloemrozet* | 22 cm carved rosette, coherent, keyhole plate | **sauna** (inventory) | — | relief disc | D2-b | B | small |
| S3-030 *Papier-maché wandmasker* | coral / olive / cream mask, rear cord; coherent | **Portugal cottage** (sheet: room identity P1), ≈ 40 cm | — | mask shell | D2-b | A | one decorative object in the cottage, with D2-046 |
| S3-031 *Keramisch tegelreliëf* | 45 × 45 cm azulejo-style lemon relief, wire hanger; coherent | **Portugal terrace** (sheet: room identity P1) | — | tile slab with a relief texture | D2-b | A | weather-plausible outdoor mounting |
| S3-033 *Smeedijzeren BBQ-haardplaat* | wrought-iron fire screen with scrollwork, A-frame feet; coherent | **BBQ** (inventory) | kettle grill, prep table | flat plate + scroll relief (alpha or texture) + feet | D2-b / D3-e | A | — |
| S3-034 *Houten bladschaalornament* | carved oak bowl with leaf motif | **outdoor dining** (inventory) | — | lathe-like bowl | D3-e | B | a table prop: belongs to the D3 used-table work |
| S3-036 *Laag stenen reliëf met golfvormen* | wave relief; the sheet says 60 × 20 × 4 cm, the recovery note says target ≈ 65 × 35 | **wellness** (inventory) | — | relief slab | D2-b | B | resolve proportions at model QA (recovery note) |
| S3-037 *Houten reigerbeeld* | carved heron on a stump, ≈ 75 cm; coherent | **dry bank viewpoint** (inventory, room identity P1) | bench viewpoint (C-R) | faceted heron, thick legs | D2-b | A | reduce legs / feathers (package note); viewpoint stays uncluttered |
| S3-039 *Wickerman* | see `DEV04D_WICKERMAN_DESIGN.md` §1.1 | Wickerman clearing | DEV-04B figure + DEV-04C setpiece | no remodel; reference for the filled-state hay read and the bale material | D4 | `REFERENCE_ONLY` (A) | the support-pole frame differs in all four views |
| S3-043 *Eenvoudig schilderijkader* · S3-044 *Dieper antiek kader* · S3-045 *Smal printkader* | three frame families (simple · deeper antique with bead · slim print), finish swatches; **low-res interpolated crops**; the 043 and 044 profile drawings are near-identical (044's depth not really defined) | every D1 painting | `painting()` gilt frame | procedural frame profiles per family: 043 for landscapes, 044 for heroes, 045 for prints | D1 | `REFERENCE_ONLY` (A) | approving the look avoids per-painting frame decisions |
| S3-002, 005, 006, 019, 020, 021, 024, 028, 029, 035 | alternatives only | as inventory (G01, G04, G05, rearNook, atticLookout, hut, shed, cottageEntry, handpan) | — | none | — | — | `AMBIGUOUS`: selection evidence needed |
| S3-003, 010, 018, 032 | — | — | — | none | — | — | `REFINE` (recovery reasons kept) |
| S3-038, 040, 041, 042 | — | golf tee, ?, campfire logs, east glade bench | — | none | — | — | `WAITING_FOR_SOURCE` |

---

## 6. Key prop family (D2-a contract)

Gameplay / save ids **do not change**. One lookup records the art ids:
`{ frontKey: 'FLW-K3-001', studyKey: 'FLW-K3-002', shedKey: 'FLW-K3-003', consKey: 'FLW-K3-004' }`.

| | Contract |
|---|---|
| Construction | one shared builder: bow (trefoil / ring / square / oval) + collar stack + shank + per-key bit + ring + tag / hanger / drop. Per-key proportions from the sheet specs (120 / 80 / 105 / 95 mm) |
| Scale | real scale is 8–12 cm, tiny in first person. **Uniform ×1.3 game scale** keeps the relative sizes and matches today's box sizes (≈ 0.15 m): decision K1 |
| Budget | ≈ 200–400 triangles each, prop atlas, merged into their drawer / hatch group: 0 new draw calls |
| Materials | warm brass (001 / 002 / 004), dark iron + rust (003, per spec), red leather tag, paper tag, wood house hanger, tinted green glass (non-emissive) |
| Icons | `ui/icons.ts`: consKey bow `ring` → `oval`; the others already match (trefoil, ring, square + house) |
| Unchanged | pickup ids, `available` rules, `hit` boxes, labels, item texts, inspect clues, save fields |
| Tests | ids unchanged, inventory icons distinct (bow + tag, never colour alone: `icons.ts` rule), each pickup still reachable through real input, no floating (key seated on drawer floor / hatch sill) |

---

## 7. FLW-RSV — RESERVED (27 records)

The RESERVED workflow stays paused. Puzzle mechanics and text are authoritative in the game (`canon.ts`, `clues.ts`,
`slice/content.ts`). None of these sheets is implemented in D.

| ID | Inspection | Relation to the game | D0 class |
|---|---|---|---|
| RSV-007 *Oefenkaart* | three-panel practice card (two details → object group → clip shape / slot), clean | canon B01 practice card exists (`slice/content.ts` SRC.practice) | `REFERENCE_ONLY` (release gate) |
| RSV-012 *Dienstplan en plaatsingslabels* | service plan + three worded labels + three destination tags | **conflicts with canon**: different rule text; labels carry words ("MELK EN KAAS") where canon has wordless labels; a milk bottle where canon has a churn (`clues.ts:49`, `canon.ts:62`, `symbols.ts:258`) | `REFERENCE_ONLY`: must never replace the A1 evidence |
| RSV-015 *Schuurinstructie C00* | lever + lantern-base cut-away and instruction card, clear | shed C-thread instruction | `REFERENCE_ONLY` (release gate) |
| RSV-016 *Maan-, blad-, zonlantaarn en middenontvanger* | coherent lantern family (brass, glass globe, stone plinth) + receiver; four consistent views | the C2 lantern puzzle exists (maan / blad / zon); a later visual re-skin of those props would need the RESERVED release gate, mechanics unchanged | `REFERENCE_ONLY` |
| RSV-002 | — | — | `REFINE` |
| RSV-001, 003, 004, 005, 006, 008, 009, 010, 011, 013, 014, 018 | — | — | `RESERVED_HOLD` |
| RSV-017, 023, 024, 025, 026, 027 | — | — | `WAITING_FOR_SOURCE` |
| **RSV-019, 020, 021, 022** | — | — | **`PENDING`**: never implemented or reconstructed |

---

## 8. Internal DEV-04 calibration sheets (unchanged status)

| Stable ID | Status / action |
|---|---|
| `gingerbread_maquette_sheet_v01` | approved internal reference: **`APPROVED_IMPLEMENT`**, maquette material re-skin (D2-a), silhouette of this house preserved |
| `wickerman_clearing_sheet_v01` | approved direction: composition authority for the clearing; D4 lifecycle reference (with S3-039) |
| `copacabana_room_sheet_v01` | D3 refine of the bar (glassware, towels); the sign stays (S3-009 `KEEP_EXISTING`) |
| `attic_observatory_sheet_v01` | D3 refine (observing traces) |
| `books_family_sheet_v01`, `living_dining_furniture_sheet_v01` | `KEEP` |
| `docs/concept-art/01–07`, external URL references | `KEEP` (historic / principles) |

---

## 9. Owner review groups (REVIEW_READY only, a recommendation, not an approval)

**A: strong production candidates** (high visual quality, clear location, real need):

| ID | One line |
|---|---|
| D2-010 | after-party still life → dining / game room north wall (replaces the undersized atlas piece) |
| D2-005 | apples still life → kitchen |
| D2-022 | traveller at the window → Reiskamer |
| D2-029 | moonlight on water → Sterrenkamer |
| D2-035 | rainy lane, cool daylight → north guest room (replaces the duplicate) |
| D2-044 | woodcut tools → workshop |
| D2-045 | coastal path → Portugal cottage entree (inventory P1) |
| D2-042 | sunlit canopy → BOSLUST gathering hall (inventory Hero P1) |
| S3-014 | carved swallows → landing (P1) |
| S3-015 | model sloop → Reiskamer |
| S3-016 | ceramic moon → Sterrenkamer (P1) |
| S3-017 | terracotta medallion → botanic room (P1) |
| S3-030 | papier-maché mask → Portugal cottage (P1) |
| S3-031 | azulejo lemon relief → Portugal terrace (P1) |
| S3-033 | iron fire screen → BBQ |
| S3-037 | carved heron → lake viewpoint (P1) |
| S3-043 / 044 / 045 | frame family look (reference) |
| S3-039 | Wickerman reference for D4 (no remodel) |

**B: usable, optional** (fine quality, lower need; place only where a room wants it):
D2-008, 009, 013, 016, 017, 021, 023, 025, 027, 030, 038, 039, 041, 047 · S3-001, 007, 008, 011, 022, 023, 025, 026, 027, 034, 036.

**C: questionable** (recommend park / reject):

| ID | Reason |
|---|---|
| D2-004 | title promises rain, image is a sunset; duplicate warm-woodland role |
| D2-006 | identifiable unknown face → narrative / clue read |
| D2-015 | duplicates 028; American porch house; "last game" title reads as a clue |
| D2-036 | fourth warm sunlit-woodland piece |
| D2-037 | reads blank at room distance |
| S3-009 | the existing owner-directed bar sign stays (`KEEP_EXISTING`) |
| S3-012 | blurry crop; tiki direction |
| S3-013 | exterior name boards were removed by owner decision in DEV-04A |

---

## 10. Wall-art inventory and slot binding (D1)

Puzzle-bearing panels never take decorative art (unchanged list: library floor plan B1, kitchen service chart A1,
archive service drawing, route maps D, study route map B2, BOSLUST sign / cipher / plate, Sterrenkamer star map,
Reiskamer travel sketch, botanic prints, attic star chart, Copacabana bar sign).

| Slot (today) | Room | Binding | Class |
|---|---|---|---|
| `painting@94.90,89.35` DEV-04B-R stair landscape (hero) | hall | keep | `KEEP_EXISTING` (decision D1-H: swap for D2-028 only on owner choice) |
| atlas #1 `@85.12,86.20` (y 4.6) | hall west, gallery height | **D2-002** | approved |
| atlas #0 `@85.12,92.50` | hall west, ground | **D2-007** | approved |
| atlas #3 `@77.25,80.45` | living south | **D2-026** | approved |
| atlas #2 `@90.00,103.92` | landing | **D2-028** | approved |
| new | Portugal cottage room | **D2-046** | approved |
| atlas #7 `@104.80,91.92` | dining north | D2-010 (enlarge to ≈ 1.4 × 1.05) | group A |
| atlas #3 dup `@107.58,102.60` | north guest room | D2-035 | group A |
| atlas #5 `@85.12,93.00` | walkway | D2-038 or D2-021 | group B (else keep the atlas piece until chosen) |
| new | kitchen · Reiskamer · Sterrenkamer · workshop · cottage entree · BOSLUST gathering | D2-005 · 022 · 029 · 044 · 045 · 042 | group A |
| home scene ×2 | home tutorial | keep (outside the estate) | `KEEP_EXISTING` |
| bathroom / guest-WC emissive "mirrors" | bath, guest WC | framed, tinted, non-reflective mirror (F1) | no source needed |

If an atlas slot has no approved art when D1 closes, its procedural placeholder stays: it is never repainted
procedurally to imitate FLW art.

## 11. Ready vs. blocked

**Ready on owner D0 approval (no further art decision)**: D2-002 / 007 / 026 / 028 / 046 (D1-a); K3-001…004 and
S3-004 (D2-a); gingerbread maquette re-skin (D2-a); framed mirrors (D1-a); all D3 curation; the Wickerman D4 lifecycle.

**Waiting on an owner group decision**: every REVIEW_READY row (group A first).

**Blocked by source / recovery status**: the 25 `AMBIGUOUS`, the 6 `REFINE`, D2-011 `REGENERATE`, the 11
`WAITING_FOR_SOURCE` (D2-043, S3-038/040/041/042, RSV-017/023–027), the 12 `RESERVED_HOLD`, and RSV-019…022
**PENDING** (never in D). The Nerf blasters (PB04) still have no source image (decision G3).
