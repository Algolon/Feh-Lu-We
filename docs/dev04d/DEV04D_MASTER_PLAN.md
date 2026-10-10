# DEV-04D — Reference Implementation & Estate-Wide Curation · Master plan (D0)

Status: **D0 deliverable for owner review. No gameplay / art implementation has been made.** The only code added in
D0 is a non-functional audit harness (`scripts/dev04d-audit-views.mjs`) and its captures (`docs/dev04d/audit/`).

Companion documents:
- [`DEV04D_ASSET_MANIFEST.md`](DEV04D_ASSET_MANIFEST.md): source search, FLW / reference / key / wall-art status;
- [`DEV04D_ROOM_AUDIT.md`](DEV04D_ROOM_AUDIT.md): every room and exterior destination, priorities, game-table plan;
- [`DEV04D_WICKERMAN_DESIGN.md`](DEV04D_WICKERMAN_DESIGN.md): the repeatable ritual lifecycle, save, audio, tests.

Core quality rule: *"Elke plek moet het waard zijn om te bezoeken, maar niet iedere plek hoeft noodzakelijk te zijn om
het spel uit te spelen."* Richness = meaningful information, believable use, hierarchy, story, material character,
memorable composition. Not prop count.

---

## 1. Production baseline (verified)

| | |
|---|---|
| Repository | `Algolon/Feh-Lu-We` |
| Production / default branch | `ccr-75ef4113-kfkimm` |
| Expected HEAD | `6c5e5c6371d049197b48f47e735eb46c19b6beda` (merge of PR #6, DEV-04C-R) |
| Verified | `git fetch origin ccr-75ef4113-kfkimm` → `origin/ccr-75ef4113-kfkimm` = `6c5e5c6…` = local HEAD (10 Oct 2026). **Production has not moved; no delta.** |
| D work branch | `ccr-f4845963-3qt9ft`, created at `6c5e5c6`, clean before D0 |
| Other remote branches | all merged into production or abandoned deploy branches; none carries an image / model / audio file production lacks (manifest §0) |
| Build | `npm ci && npm run build` clean on the baseline (pre-existing chunk-size warning only) |

Invariants carried into D (from the code and the C / C-R reports):

| Invariant | Value | Where checked |
|---|---|---|
| Save schema | **4** (`STATE_VERSION`) | `state.ts`, unit + e2e |
| Interactable / door ids | **130** = 128 baseline (`scripts/dev04a-baseline.json`) + `wicker.candles`, `wicker.figure` (`scripts/dev04c-additions.json`) | `e2e:dev04a/b/c` |
| Checkpoints | **21** | suites |
| Estate footprint | 200 × 180 m | `layout.ts` |
| Puzzle solutions / progression | `docs/PUZZLE_SOLUTIONS.md` authoritative | suites |
| Notebook / gameplay UX, ART-01 / ART-01.1, atmosphere / material / light systems | authoritative baseline | — |
| Mobile guide (low quality) | ≈ 150 draw calls / 250 k triangles; `golfSpur` the known exception (90 / 261 k) | `e2e:dev04c` budget check |
| Accepted exception | two full-`e2e` touch-tap timing failures in this container (C-R report §7): **not** a D topic; input timing is untouched unless a D change causes a real input regression | — |

---

## 2. Scope

**In D**: authored richness room by room and destination by destination; integration of the approved FLW sources
**when they physically exist**; the gingerbread maquette re-skin (its reference is in the repo); the social game-table
memory scene; the repeatable Wickerman ritual (approved gameplay expansion) with its hay bale and burn audio; remaining
hero polish (fire sheet, smoke, plinth); final audit, performance and QA.

**Not in D** (brief §15 and earlier owner decisions): main puzzle threads, answers, mandatory evidence placement,
notebook architecture, finale, estate structure, removal of stable ids, repurposed save fields, touch / input timing,
RESERVED / `FLW-RSV-019…022`, procedural imitation of missing FLW art, branded / copyrighted boardgame or audio
material, broad reopening of A / B / C / C-R work.

Information model kept: **World = where to go · Focus = what is usable · Notes = what was actually observed.** D3
decor never adopts the focus / interaction language (no glow, no prompt, no brass "button" look) unless it is a real
interaction.

---

## 3. Phase structure

| Phase | Content | Depends on | Ready now? | Exit criteria |
|---|---|---|---|---|
| **D0** Audit, manifest, plan | this pass | — | **done**, awaiting owner review | four documents + captures reviewed; owner decisions §8 answered |
| **D1** 2D art / wall identity | FLW-D2 rasters into the existing `canvasPanel` / art-registry path, frame family, hierarchy (one hero per main room), replace the 8 atlas paintings; wall composition fixes that need no new art (unframed bathroom / WC "mirrors" → framed mirrors; puzzle walls stay) | **FLW-D2 files + index** | **partly**: mirror / wall-composition fixes yes; art no | each placed piece: id, room, aspect preserved, frame, `wallArtConflicts()` clean, mobile read at 412 × 915 |
| **D2** 3D references + key props | gingerbread maquette re-skin (**ready**); FLW-S3 decorative pieces; FLW-K3 key family mapped to gameplay ids | maquette: none · S3 / K3: **source files** | **maquette only** | coherent single model per sheet, construction audit (`Asm`) clean, ≤ budget, ids unchanged |
| **D3** Estate-wide curation | room / zone curation per the room audit, in priority order; the game-table scene; social traces, used furniture, local wear; deliberate negative space | none (uses existing kit); FLW slots left open | **yes** | per-zone: the six questions answered (brief §13) in the commit, before / after captures from the same audit poses, budget per room view inside the guide, no floating / clipping (probe) |
| **D4** Hero interactions, Wickerman, closeout | Wickerman lifecycle + hay bale + burn audio; fire sheet / smoke / plinth polish; final audit, performance, full QA, D report | owner decisions W1–W7 | **yes** after approval | lifecycle test matrix green (design §10), all suites green (C-R accepted exception aside), budgets, phone check |

**Recommended order** (owner decision O1): the brief lists D1 → D4, but D1 and most of D2 are blocked by missing
files. Proposed execution order: **D3 (curation, incl. game table) → D2-maquette → D4 (Wickerman) → D1 / D2-S3-K3 as
soon as files arrive** (they can slot in at any point because their slots and contracts are defined in the manifest).
Nothing in D3 / D4 pre-empts a D1 slot: D3 leaves the wall-art slots of manifest §5.3 free.

### D3 internal batches (each one commit + evidence)

| Batch | Zones (from the room audit) | Why this grouping |
|---|---|---|
| D3-a | dining / game room (game-table memory scene, chairs, side table decision), kitchen (work zone, island, shopping-crate story continuity) | the owner's required scene + the largest adjacent dead zone; shared batch `mWing` |
| D3-b | upper floor long rooms: study, botanic room, Reiskamer, Sterrenkamer, north guest room, bathroom | the long empty floors; puzzle-adjacent identity rooms (B1 emblems) need care |
| D3-c | attic common + seasonal store + lookout | "seasonal storage" that is nearly empty; attic observatory refinement |
| D3-d | living east half, vestibule, back lobby, billiard, library touches, Copacabana refinement | calibration rooms: restraint, small additions only |
| D3-e | exteriors: forecourt / arrival, garden terrace, outdoor dining / BBQ, lake viewpoint, wellness, east glade | social traces outside |
| D3-f | woodland destinations: shed, campfire, well, golf spur / tee, BOSLUST surroundings, Portugal cottage + terrace | BOSLUST and Portugal are the calibration targets: touch lightly |

---

## 4. Major technical dependencies

| Dependency | Status | Used by |
|---|---|---|
| Wall-art registry + `wallArtConflicts()` (DEV-04A `openings.ts`) | in place, unit + e2e tested | D1, any D3 wall decor |
| `canvasPanel()` / `painting()` | procedural today; needs an image-backed variant (`imagePanel(url, aspect, frame)`) | D1 |
| Asset pipeline for rasters | none today (all textures are runtime canvases) | D1: Vite asset import, re-encode ≤ 1024 px, mip-mapped, sRGB |
| `Asm` construction audit (support / connectivity) + chunk `Batcher` | in place (DEV-04B) | D2, D3: every new decor part batched into its room chunk, grounded |
| Prop atlas (one 1024² canvas) | in place, has free cells | D3 labels, marshmallow bag, cards, hay ends |
| Room regions / culling ownership | in place (DEV-04B/C) | all: new meshes owned by their room region |
| Fire system (`makeFire`, reveal uniforms, `regionOwned`) | in place (DEV-04C) | D4 |
| Procedural audio (`Audio`) | in place, no files | D4 ritual layer |
| Save `lit` open record | in place | D4 (`wicker.empty`) |
| Evidence + budget harnesses | `dev04c-views/budget`, new `dev04d-audit-views` | every D batch: same poses before / after |
| **FLW-D2 / S3 / K3 files** | **missing** | D1, D2-S3, D2-K3 |

---

## 5. Commit strategy

- Branch `ccr-f4845963-3qt9ft` for D0 (this commit) and then per owner instruction for D1–D4 (one branch per subpass,
  as in earlier passes, or one continuing branch: owner decision O2).
- **One meaningful milestone per commit**, never a mixed commit: e.g. `D3-a: game-table memory scene`, `D3-a: kitchen
  work zone`, `D4: Wickerman lifecycle rules + unit tests`, `D4: bale + clean / refill visuals`, `D4: ritual audio`.
- Docs / evidence commits separate from code commits (as in C / C-R), and the report names the **tested commit**.
- New interactable ids only with owner approval, recorded in `scripts/dev04d-additions.json` (the A/B/C id checks keep
  failing on any undocumented change).
- Every D batch ends with a gate run on the exact commit; no merge, no deploy without owner instruction.

## 6. Testing strategy

| Layer | What | When |
|---|---|---|
| Unit (vitest, today 218) | pure rules: Wickerman stages, normalisation, carry; geometry sanity of new decor builders (finite, grounded, inside room bounds, no part below the floor / table top it sits on); art slots clear of openings | every code commit |
| `e2e:dev04d` (new suite) | ids (130 + approved additions only), save version 4, Wickerman lifecycle through real input (design §10), held-chip hay, game-table scene present and not blocking the route / A01 sideboard, no new interactable in decor, budgets of the D views, page errors | D3 / D4 commits |
| Regression | `typecheck`, `test`, `build`, `e2e:dev04c`, `e2e:dev04b`, `e2e:dev04a`, `e2e:dev03`, full `e2e`, `e2e:dev02`, `e2e:dev01` | gate per batch (full `e2e` touch exception as accepted in C-R) |
| Visual evidence | `scripts/dev04d-audit-views.mjs` on the base and on the batch commit, same poses → before / after sheets | per batch |
| Decor QA probe | floating / clipping / coplanar check of new parts: support ray under each grounded part, table-top contact, z-fight check against the surface it lies on (offset ≥ 2 mm) | per D3 batch |
| Real phone | owner's phone check (as in C §13) for the D3 hero rooms and the burn | before merge of each subpass |

## 7. Mobile / performance strategy

- Guide unchanged: ≤ 150 draw calls, ≤ 250 k triangles at low quality per budget view; `golfSpur` not worse.
- **D0 observation** (room audit X7): with *every* door open (the audit's evidence state), several manor views exceed
  the guide (kitchen 220 / 361 k, living 189 / 331 k, hall-maquette 157 / 484 k). With every door **closed**, the same
  poses are inside it: kitchen 128 / 203 k, living 131 / 205 k, maquette 58 / 178 k, dining 76 / 139 k. So the baseline
  is fine in a realistic state, but **living and kitchen have only ≈ 20 calls / ≈ 45 k triangles of headroom**.
  D3 therefore measures each target room before and after in both door states and keeps a per-room delta budget of
  **≤ +2 draw calls, ≤ +12 k triangles per room batch**, everything in the room's existing chunk. The all-doors-open
  worst case is reported, not gated (it was already over before D).
- Batching: every new decor part goes through `Asm` into its room chunk (no new draw call); shared cached geometry
  (`cg` / `cached`) for repeats; prop-atlas textures; vertex-colour / seeded jitter variation instead of new materials.
- Culling: new meshes are owned by their room region; exterior props by their zone chunk with the zone's draw distance.
- Collision only where gameplay needs it (furniture you could walk into, the hay bale); table-top props never collide.
- Audio: the ritual layer exists only while the burn runs near the player (≤ 5 continuous voices).
- Textures: D1 rasters ≤ 1024 px long side; a soft cap of ~6 MB total new texture memory for D1.

## 8. Owner decisions still needed

| # | Decision | Recommendation |
|---|---|---|
| O1 | Execution order: D3 → D2-maquette → D4 → D1 / S3 / K3 when files arrive (instead of D1 → D4 literally) | **yes**: nothing ready waits on missing files |
| O2 | Branch / PR granularity: one PR per subpass (D3 may be two PRs: interior, exterior) | one PR per subpass |
| O3 | Deliver the **FLW index** (id → subject → room) even before the rasters, so D1 slots can be bound to ids | yes, the index alone unblocks D1 planning |
| O4 | FLW drop location `assets/flw/{d2,s3,k3}/` + `assets/flw/index.json` (manifest §2) | yes |
| G1 | Game table: move the side-table marshmallow / shots group onto the big table and turn the side table into the drinks-supply point (beer crate), or keep two spots | move to the table; side table becomes supply |
| G2 | The chubby-bunny card: **non-interactive** legible card (no new id) vs. an inspectable card (new id + memory text from the owner) | non-interactive now; inspectable only with owner-written text |
| G3 | Nerf blasters (ENVIRONMENT_STORY PB04): the owner's photo is not in the repo. Build a generic, unbranded foam-dart toy from the text description, or wait for the image | wait for the image (WAITING_FOR_SOURCE); D3 leaves the spots free |
| W1–W7 | Wickerman decisions | see `DEV04D_WICKERMAN_DESIGN.md` §11 (defaults: approve `wicker.bale`, `lit['wicker.empty']`, one trip, besom, permanent scorch, 80 s, procedural audio) |
| F1 | Bathroom + guest-WC "mirrors" are frameless emissive panels (`manor.ts:603`, `:1119`). Replace with a framed mirror (tinted, non-reflective, believable) in D1 | yes |

## 9. Top-10 estate-wide D priorities

See the room audit §1 for the full table. In order:

1. **Dining / game room**: the played-evening memory scene (required) + break the "set table" (chairs, side table). P1 · D3-a
2. **Wickerman ritual lifecycle** + hay bale + burn audio (approved expansion). P1 · D4
3. **Kitchen**: legible group cooking (prep zone on the island, pans, produce, used board), large dead floor. P1 · D3-a
4. **Study and botanic room**: 15.6 m long rooms with everything at one end; give each a working centre (map chest / reading chair cluster; potting bench with the design's werkbank / spoelbak) without touching the B1 / B2 evidence. P1 · D3-b
5. **Wall art**: eight identical-family procedural placeholder paintings; FLW-D2 integration (blocked) + framed mirrors now. P1 · D1
6. **Attic seasonal store + common**: "seasonal storage" that holds one box; the design's dust-sheeted furniture, game crates, instrument cases, with a clear walking lane. P1 · D3-c
7. **Gingerbread maquette** material re-skin from its approved sheet. P1 · D2
8. **Upstairs bedrooms** (Reiskamer, Sterrenkamer, north guest room): big empty floors, blank walls; luggage / weekend traces, keep emblem identity. P2 · D3-b
9. **Arrival forecourt + garden terrace**: one large flat gravel field and plain terrace slabs; arrival traces (luggage, instrument case at the door), gravel wear / edge structure, used outdoor table. P2 · D3-e
10. **Wickerman / fire polish**: sheet fire, softer smoke, dry-stone plinth read. P2 · D4

## 10. Risks

| Risk | Mitigation |
|---|---|
| D3 turns into clutter | per-zone brief (six questions) committed before code; one focal point + supporting cluster + named negative space; owner review of D3-a before D3-b… |
| Budget creep in big rooms already heavy with all doors open | measure first, per-room delta budget, batch into the existing chunk |
| Missing FLW sources stall D1 / D2 | order O1; slots and contracts ready so delivery is a small integration |
| Wickerman repeatability bugs across saves | pure-rule state machine, normalisation table, full reload matrix in e2e |
| Decor mistaken for interaction / evidence | no focus language on decor; evidence walls and clusters listed as no-go (manifest §5.2, room audit) |
| Touch timing exception resurfaces | D does not touch input; if a D change causes a real input regression it is fixed, otherwise the accepted exception stands |
