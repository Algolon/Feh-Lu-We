# DEV-04D — Reference Implementation & Estate-Wide Curation · Master plan (D0)

Status update: **D1 (D1-a + D1-b) implemented for owner review — see [`DEV04D_D1_REPORT.md`](DEV04D_D1_REPORT.md). D2–D4 not started.**

Status: **D0 reconciled, for owner review. No gameplay / art implementation has been made.** D0 is reconciled
against the recovered FLW stable-ID library (PR #7). The only code in D0 is the non-functional audit harness
(`scripts/dev04d-audit-views.mjs`) and its captures (`docs/dev04d/audit/`). D1 does not start before owner approval.

Companion documents:
- [`DEV04D_ASSET_MANIFEST.md`](DEV04D_ASSET_MANIFEST.md): per-ID reconciliation of all 126 FLW records (visual inspection, D0 class, location, implementation, concerns), owner review groups A / B / C, wall-slot binding;
- [`DEV04D_ROOM_AUDIT.md`](DEV04D_ROOM_AUDIT.md): every room and exterior destination, revised top 10, per-zone reference integration (§5), game-table plan (§4);
- [`DEV04D_WICKERMAN_DESIGN.md`](DEV04D_WICKERMAN_DESIGN.md): the repeatable ritual lifecycle, save migration, bale, audio, tests, S3-039 reconciliation (§1.1).

Core quality rule: *"Elke plek moet het waard zijn om te bezoeken, maar niet iedere plek hoeft noodzakelijk te zijn om
het spel uit te spelen."* Richness = meaningful information, believable use, hierarchy, story, material character,
memorable composition. Not prop count, and not reference coverage.

---

## 1. Baseline (verified)

| | |
|---|---|
| Repository | `Algolon/Feh-Lu-We` |
| Production / default branch | `ccr-75ef4113-kfkimm` @ `6c5e5c6371d049197b48f47e735eb46c19b6beda` (PR #6 merge, DEV-04C-R): re-verified, **unchanged** |
| D work branch | `ccr-f4845963-3qt9ft` (D0 docs + audit tooling only; no `src/` change) |
| FLW reference library | PR #7, `dev04-flw-reference-library` @ `93206dd`, base `6c5e5c6`: open, **not merged**, mergeable, build green, docs-only (`docs/reference/flw/**` + one cross-link). 67 canonical (D2 32 · S3 27 · K3 4 · RSV 4), 246 PNGs, **633.8 MiB**, validation 1187 / 1187 PASS. D0 read it in place; nothing was copied |
| Approval evidence in the library | 10 assets only: `APPROVED_2D` D2-002 / 007 / 026 / 028 / 046 · `APPROVED_3D_REF` S3-004 · `APPROVED_KEY_REF` K3-001…004 |

Invariants carried into D:

| Invariant | Value |
|---|---|
| Save schema | **4** (`STATE_VERSION`); the Wickerman uses one new key in the open `lit` record, no bump |
| Interactable / door ids | **130** (128 + `wicker.candles`, `wicker.figure`); `wicker.bale` → 131 only with owner approval (W1) |
| Checkpoints | **21** |
| Estate | 200 × 180 m |
| Puzzles, notebook, ART-01 / 01.1, light systems | authoritative; reference art never changes puzzle text, evidence placement or mechanics |
| Mobile guide | ≈ 150 draw calls / 250 k triangles at low quality; `golfSpur` the known exception |
| Accepted exception | two full-`e2e` touch-tap timing failures (C-R §7); input timing untouched |
| Stable ids vs. art ids | gameplay / save ids (`frontKey` …) never change; FLW ids live in a lookup |

---

## 2. Scope

**In D**:
- integration of the **approved** FLW sources;
- integration of REVIEW_READY sources **only after an owner group decision**;
- the gingerbread maquette re-skin;
- room-by-room curation;
- the social game-table memory scene;
- the repeatable Wickerman ritual with bale and burn audio;
- hero polish;
- final audit, performance and QA.

**Not in D**:
- puzzle threads, answers, evidence placement, notebook, finale, estate structure, ids, save fields, input timing;
- all RESERVED material, and **FLW-RSV-019…022 (PENDING, never reconstructed)**;
- any REFINE / REGENERATE / AMBIGUOUS / TEXT_ONLY asset;
- picking an alternative because it looks best;
- procedural imitation of missing art;
- branded or copyrighted material.

Information model kept: **World = where to go · Focus = what is usable · Notes = what was actually observed.**
Reference decor never adopts focus language (no glow, no prompt, no brass "button" look). This is why the consKey's
emissive blob goes.

---

## 3. Phase structure (revised)

Each subpass is split into **a** (approved sources, no further art decision) and **b** (owner-gated REVIEW_READY sources,
starts when the owner approves a group).

| Phase | Content | Depends on | Exit criteria |
|---|---|---|---|
| **D0** | audit, per-ID reconciliation, plans | — | **done**; owner decisions §8 answered |
| **D1-a** 2D art, approved | image-backed paintings for D2-002 / 007 (hall), 026 (living), 028 (landing), 046 (cottage); raster pipeline; frame family; framed bathroom / WC mirrors (F1) | D0 approval; PR #7 merged (M1) | each piece: aspect preserved, `wallArtConflicts()` clean, not on an evidence wall, readable at 412 × 915 low quality, 0 new draw calls in living / kitchen, texture budget §7 |
| **D1-b** 2D art, group A | dining D2-010 (enlarged slot), kitchen 005, Reiskamer 022, Sterrenkamer 029, guest room 035 (replaces the duplicate), workshop 044, cottage entree 045, BOSLUST gathering 042 | owner approves group A | same |
| **D2-a** 3D, approved | K3 key family on the four gameplay ids + icon fix; S3-004 bird; gingerbread maquette re-skin | D0 approval; K1 / K-B | ids, pickups, labels, saves unchanged; `Asm` construction audit clean; keys seated, not floating |
| **D2-b** 3D, group A | S3-014 swallows (landing), 015 sloop (Reiskamer), 016 moon (Sterrenkamer), 017 medallion (botanic), 030 mask + 031 tile (Portugal), 033 fire screen (BBQ), 037 heron (lake) | owner approves group A | one coherent model per sheet (majority of views; flagged inconsistencies resolved as the manifest says); budget |
| **D3** curation | per the room audit (batches D3-a…f), incl. the game-table scene; group-B pieces only where a zone brief asks for one | none (existing kit) | per zone: the six questions, before / after from the same audit poses, budget deltas (§7), decor QA probe |
| **D4** Wickerman + closeout | lifecycle + bale + audio + W8 filled-state read + fire / smoke / plinth polish; final audit, performance, QA, D report | W1–W8 | design §10 matrix green; all suites green (C-R exception aside); phone check |

**Recommended order (O1, revised).** The earlier D0 draft proposed "D3 first" because D1 / D2 looked blocked. They are
not blocked any more, so follow the brief's order with the a / b split: **D1-a → D2-a → D3 → D4**, with D1-b / D2-b
slotting in as soon as the owner approves group A (they touch disjoint walls and props).
- D1 / D2 first, because D3 composes rooms *around* their wall identity and identity objects. Curating the Reiskamer
  before its painting and sloop exist would mean doing it twice.
- D4 is independent and may run in parallel if the owner wants the Wickerman earlier.

### D3 internal batches (unchanged, each one commit + evidence)

| Batch | Zones |
|---|---|
| D3-a | dining / game room (game-table scene, chairs, side table G1), kitchen (work zone, crate story) |
| D3-b | study, botanic room, Reiskamer, Sterrenkamer, north guest room, bathroom |
| D3-c | attic common, seasonal store, lookout |
| D3-d | living east half, vestibule, back lobby, billiard, library touches, Copacabana bar refine |
| D3-e | forecourt / arrival, garden terrace, outdoor dining / BBQ, lake viewpoint, wellness, east glade |
| D3-f | shed, campfire, well, golf, BOSLUST surroundings, Portugal cottage + terrace (touch lightly) |

---

## 4. D1 proposed scope

| Item | Detail |
|---|---|
| Image pipeline | new `imagePainting(w, x, y, z, yaw, wM, hM, slot, frame)` beside `painting()`; sources re-encoded from `docs/reference/flw/2d/*` to sRGB, mip-mapped, **512 px long side (768 px for a hero)** into `src/assets/art/FLW-D2-###.webp`. A small `art.ts` table records id → file → aspect → frame family |
| Atlas, not N materials | pack the D1 rasters into one image atlas (2048 × 1024, like today's 4 × 2 procedural atlas), so all paintings stay **one material**: 0 new draw calls per room |
| Frame family | procedural profiles following S3-043 (simple, landscapes), S3-044 (deeper, heroes), S3-045 (slim, prints), if the owner approves that look (group A). Otherwise today's `painting()` frame is used |
| Slots | manifest §10. Aspect drives the frame size (nothing is stretched or cropped, except a D2-038 split if chosen) |
| Mirrors (F1) | bathroom (`manor.ts:1119`) and guest WC (`:603`): framed, tinted, non-reflective glass with a soft sheen instead of the emissive panel |
| Not in D1 | evidence walls (manifest §10), RSV material, group B / C pieces unless the owner asks |
| Tests | unit: every art slot clear of openings (`wallArtConflicts`), art table ids exist in `MANIFEST.json` with an allowed status (approved, or approved group); e2e: textures loaded, no page errors, budget views unchanged in calls |
| Evidence | before / after from `dev04d-audit-views` (hall h03, living, landing, cottage, plus a close 1.5 m view of each piece) |

## 5. D2 proposed scope

| Item | Detail |
|---|---|
| Key family (K3-001…004) | one builder (bow / collars / shank / bit / ring / tag-hanger-drop); ×1.3 game scale (K1); brass for 001 / 002 / 004, dark iron + rust for 003 (spec over render); K3-002 tag **not** reproducing the misspelling "Studerkamer"; consKey drop tinted glass, no emission; icon `consKey` bow → oval. ≈ 200–400 tris each, merged into the drawer / hatch groups |
| S3-004 bird | faceted carved songbird ≈ 22 cm, ≈ 300–500 tris, location per K-B |
| Gingerbread maquette | material re-skin per `gingerbread_maquette_sheet_v01` (gingerbread body, icing on edges / trim, restrained accents), this house's silhouette preserved, `mem.hall.maquette` unchanged |
| D2-b (group A) | eight S3 pieces, manifest §5, each with its flagged inconsistency resolved as written there (e.g. S3-014: the art's horizontal line, not the blockout cluster; S3-016: the art's simple base) |
| Tests | ids / pickups / labels / save round trip unchanged; each key pickup reachable through real input; `Asm` grounded / supported; budget per room delta |

---

## 6. Technical dependencies

| Dependency | Status |
|---|---|
| Wall-art registry + `wallArtConflicts()` | in place |
| `painting()` / `canvasPanel()` | procedural; D1 adds the image-backed variant + image atlas |
| Raster asset pipeline | none today. D1 adds Vite asset import of re-encoded `.webp` (derived files only; the 634 MiB sources stay in `docs/`) |
| `Asm` construction audit + chunk `Batcher`, prop atlas, room-region culling | in place |
| Fire system, procedural `Audio`, open `lit` record | in place (D4) |
| Evidence / budget harnesses | `dev04c-views/budget`, `dev04d-audit-views` |
| FLW sources | **present on PR #7** (decision M1 below) |

## 7. Mobile / performance strategy

- Guide unchanged (≤ 150 calls / ≤ 250 k tris at low quality per budget view; `golfSpur` not worse).
- Doors-closed headroom is tight in living and kitchen (≈ 20 calls / ≈ 45 k tris). Per room batch: **≤ +2 draw calls,
  ≤ +12 k triangles**, everything in the room's existing chunk. Paintings add **0** calls (atlas). Keys add 0 (merged).
- **Texture budget for D1: ≤ 12 MB GPU** in total (one 2048 × 1024 RGBA atlas with mips ≈ 11 MB). If group A pushes past one
  atlas page, a second page is one more material for the rooms that use it: measured, not assumed.
- S3 models: ≤ 1.5 k triangles each (heron, sloop), most ≤ 600; vertex colour + prop atlas; no new materials.
- Audio: the ritual layer exists only near an active burn (≤ 5 continuous voices).

## 8. Owner decisions needed before implementation

| # | Decision | Recommendation |
|---|---|---|
| **M1** | Merge PR #7 before D1 | **Yes, merge first**, as a docs-only PR on its own: D1's `art.ts` and the manifest point at `docs/reference/flw/**`, and those provenance links must resolve on the production branch. Cost to accept knowingly: **+634 MiB in git history for every clone and CI checkout** (193 of the files are provenance-only alternatives). If that is unwelcome, move the PNGs to Git LFS *before* merging; once merged, history keeps the bytes. D does not depend on the alternatives, only on the 67 canonical files |
| O1 | Order D1-a → D2-a → D3 → D4, with D1-b / D2-b when group A is approved; D4 may run in parallel | yes |
| O2 | One PR per subpass (D3 may split interior / exterior) | yes |
| **R-A** | Approve **group A** (manifest §9: 8 D2 + 8 S3 + frame family + S3-039 as reference) | approve as a group |
| R-B | Group B: approve none now; D3 zone briefs may request single pieces later | defer |
| R-C | Group C: park / reject (D2-004, 006, 015, 036, 037; S3-012; S3-009 and 013 stay `KEEP_EXISTING`) | reject / park |
| D1-H | Keep the DEV-04B-R stair landscape as the hall hero (D2-028 goes to the landing) | keep |
| K1 | Keys at a uniform ×1.3 game scale | yes |
| K-B | S3-004 bird location: rear nook side table (alt.: study reading cluster) | rear nook |
| S-14 | S3-014 swallows composition: the art's horizontal flight line (not the blockout's cluster) | art line |
| G1 | Game table: move the side-table marshmallow / shots onto the big table; the side table becomes the drinks supply | yes |
| G2 | Chubby-bunny card non-interactive (no new id) | yes |
| G3 | Nerf blasters: still no source image (not in the FLW library either). Wait, or build a generic, unbranded toy from the text | wait |
| F1 | Framed, tinted, non-reflective mirrors replace the emissive panels | yes |
| W1–W8 | Wickerman (design §11; **W8 new**: S3-039 straw read for the filled state only) | defaults as listed |

## 9. Top-10 estate-wide priorities

The full table is in the room audit §1. In order:
1. dining / game-room memory scene + D2-010;
2. the five approved wall pieces + mirrors;
3. Wickerman lifecycle (+ W8, polish);
4. key prop family;
5. kitchen;
6. study + botanic;
7. upstairs identity rooms (swallows, Reiskamer, Sterrenkamer, guest room);
8. attic store + common;
9. gingerbread maquette;
10. forecourt / terrace / BBQ.

## 10. Risks

| Risk | Mitigation |
|---|---|
| REVIEW_READY art treated as approved | the art table accepts only ids whose `MANIFEST.json` status is approved or that appear in an owner-approved group list committed with D1-b / D2-b; a unit test enforces it |
| Coverage over quality ("use all recovered art") | manifest §9 and room audit §5 name the negative space; 27 recovered sources are deliberately not placed |
| Dark paintings (D2-028, 041, 023) read as black panels on phones | low-quality phone-viewport check per piece; light the frame, never edit the source |
| Sheet inconsistencies copied into models | the manifest lists the majority view per S3 / K3 sheet; models follow that |
| Text artefacts in sheets (K3-002 "Studerkamer", garbled S3-013) | never rasterise sheet lettering; text is typeset from game data |
| Repo weight after merging PR #7 | M1: accept knowingly or move to LFS first |
| Budget creep in living / kitchen | atlas paintings (0 calls), per-room delta budget, both door states measured |
| Wickerman repeatability bugs | pure-rule state machine, normalisation table, reload matrix (design §10) |
| Touch timing exception | D does not touch input |
