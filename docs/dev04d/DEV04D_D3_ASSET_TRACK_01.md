# DEV-04D D3 Asset Track 01: D3-b asset prebuild and reference translation

| | |
|---|---|
| Branch | `ccr-9363918b-2q64zu` (the session's designated branch, used in place of the suggested `dev04d-d3-assets-01`) |
| Base | production `ccr-75ef4113-kfkimm` @ `444de9b` (verified; **not** the architectural calibration branch) |
| Scope | asset prebuild for the D3-b room group: study, botanic room, Reiskamer, Sterrenkamer, north guest room, bathroom; plus the front gallery swallows (the gallery is on the D3-b floor, `DEV04D_D3_KICKOFF.md` §3.2) |
| Not done | world placement, room layouts, lighting, puzzle / evidence changes, merge, deploy |
| Status | **stopped for owner visual approval** |

Rule applied: **asset production may run ahead of room production; world placement may not.** Every candidate below
is built only in the isolated review harness. D3-b keeps final placement, in-room scale, lighting relation, sightline
role and composition.

## 1. Sources reconciled

- `DEV04D_ASSET_MANIFEST.md` (D0 classes, owner groups A / B / C, §9–§11);
- `DEV04D_ROOM_AUDIT.md` (D3-b rooms, protected panels);
- `DEV04D_D3_CRAFTSMANSHIP_AUDIT.md` (D2-R triage);
- `DEV04D_D3_EXECUTION_PLAN.md` (D3-b objective, budgets), `DEV04D_D3_KICKOFF.md` §3.2 (binding owner carry-forward);
- `docs/reference/flw/` `MANIFEST.json` (stable ids, status, sha256), the canonical sheets themselves.

Status rules kept:
- no new ids;
- no source art regenerated or reinterpreted;
- canonical ≠ approved;
- group B stays deferred until the owner asks (master plan R-B);
- `src/content/art.ts` / `props3d.ts` ship rules untouched (nothing new ships).

## 2. Complete D3-b candidate inventory

Statuses: `READY_FOR_PLACEMENT` · `READY_2D` · `OWNER_REVIEW` · `NEEDS_REFINE` · `DEFER` · `NOT_ELIGIBLE`. A finished
model is **not** called approved: every Track 01 build ends at `OWNER_REVIEW`.

### 2.1 3D (FLW-S3)

| Stable ID | Target room | Source status | Current production | Track 01 action | Resulting status | Tris / materials | Evidence | Notes for D3-b placement |
|---|---|---|---|---|---|---|---|---|
| **FLW-S3-014** *Gesneden zwaluwen* | front gallery (D3-b floor) | REVIEW_READY, owner group A | D2-R interim (864 tris), **not final** (owner) | **REBUILD** from the sheet | `OWNER_REVIEW` | **2,802**, timber only (hero prop) | `d3b-assets/sheet-swallows.jpg`, `swallows/` | group 1.73 × 0.60 m at s = 1, uniform `s`. From the 14 m void view it is still small at s = 1: D3-b should test s 1.0–1.25 against the wall between the windows and lower it towards the bench (D2-R intent) |
| **FLW-S3-017** *Terracotta bloemmedaillon* | botanic room | REVIEW_READY, group A | D2-R interim (1,172 tris); model direction accepted | **REFINE** (D2-R disc kept) + scale ladder | `OWNER_REVIEW` | **1,972** at s ≤ 1.6; **2,468** above (more lathe segments); paint (medium identity) | `sheet-medallion.jpg`, `sheet-medallion-scale.jpg`, `medallion/` | survives ×2–×3 without looking crude. On the current long west wall, even ×3 stays small from the botanic door: the door read is a **placement** problem (the work-zone end wall facing the door), not only scale. Suggested range ×2–×2.5 (Ø 1.16–1.45 m), decided with the bench |
| **FLW-S3-016** *Keramische maanvorm* | Sterrenkamer | REVIEW_READY, group A | D2 piece (352 tris), audit KEEP | **REBUILD**: the isolated comparison shows a flat 22 mm cut-out and an undersized block, against the sheet's volumetric crescent | `OWNER_REVIEW` | **1,208**, timber + paint (medium identity) | `sheet-moon.jpg`, `moon/` | ≈ 0.33 m overall at s = 1. At the bedside approach (2.2 m) it is ≈ 25 px tall on the phone. `t01-x1.4-eye-room` / `t01-x1.8-eye-room` show presentation scales for D3-b's bedside / moon / D2-029 grouping |
| FLW-S3-015 *Miniatuurzeilboot* | Reiskamer | REVIEW_READY, group A | D2 piece (526 tris), audit KEEP | **reviewed only** (harness, against the sheet) | `NEEDS_REFINE` (low priority) | 526, timber + metal + paint | `sheet-sloop.jpg`, `sloop/` | silhouette, sail and rig read. Still against the sheet: the hull is a shallow canoe, where the sheet has a deep planked hull, a keel and a cream sheer stripe. It is not visible as a failure from the door; refine only if D3-b redoes the desk composition (audit: optional ×1.15) |
| FLW-S3-004 *Houten vogelbeeld* | proposed in D0: study reading cluster **or** rear nook; placed in the rear nook | APPROVED_3D_REF | D2 piece (332 tris), audit KEEP | none | `DEFER` | 332 | D2 evidence `d2/evidence/d2-s3-004-*` | not in a D3-b room unless D3-b moves it into the study cluster; beak / eye polish only then |
| S3-001, 008, 011, 022, 023, 025, 026, 027, 034, 036 | not D3-b rooms (hall, living, attic, archive, BOSLUST, sauna, outdoor) | REVIEW_READY group B | — | none | `NOT_ELIGIBLE` (wrong batch) | — | — | — |

Not in this track: the D3-b craft targets with no FLW stable id (botanic work bench, plant stands, study map chest,
bed and bedside joinery). These are room furniture: their size and position are the room batch's composition, and they
have no source art to translate. Ids are not invented.

### 2.2 2D (FLW-D2)

All sources were checked against the `MANIFEST.json` sha256: 9 / 9 match. Approved pixels are untouched. The previews
sample the canonical file at the atlas build's resample (long side = atlas px, high-quality smoothing, no crop, no
colour change) under the production art material's 1.35 albedo gain.

| Stable ID | Target room | Source status | Current production | Track 01 action | Resulting status | Atlas cost | Evidence | Notes for D3-b |
|---|---|---|---|---|---|---|---|---|
| FLW-D2-022 *De onbekende reiziger* | Reiskamer | REVIEW_READY, group A | in the atlas, hung (D1) | none (no duplicate atlas entry) | `READY_2D` (already production) | in the atlas | D1 evidence | composition with the sloop and the travel sketch is D3-b's |
| FLW-D2-029 *Maanlicht op water* | Sterrenkamer | group A | in the atlas, hung (D1) + salon wall | none | `READY_2D` (already production) | in the atlas | D1 evidence | groups with the moon (S3-016) and the star map (evidence: untouched) |
| FLW-D2-035 *Zomerregen op een landweg* | north guest room | group A | in the atlas, hung (D1) | none | `READY_2D` (already production) | in the atlas | D1 evidence | — |
| FLW-D2-008 *Schaduwvlakken* | study | REVIEW_READY, group B | — | framed preview (print frame, 0.6 × 0.6 m) | `OWNER_REVIEW` | 320 px | `sheet-2d.jpg`, `art2d/FLW-D2-008-*` | modern graphic; reads at 3 m; one per house at most |
| FLW-D2-023 *Twee elkaar rakende horizonvlakken* | study | group B | — | framed preview (simple frame, 0.7 × 0.7 m) | `OWNER_REVIEW` | 320 px | `art2d/FLW-D2-023-*` | low-key: at 3 m it reads as a dark square with a copper band. Needs a lit wall |
| FLW-D2-009 *Mot boven wilde bloemen* | botanic room (secondary wall) | group B | — | framed preview (print frame, 0.48 × 0.6 m) | `OWNER_REVIEW` | 320 px | `art2d/FLW-D2-009-*` | must not compete with the varen-emblem prints (evidence wall) or the medallion. Small at 3 m |
| FLW-D2-027 *Bergreisprint* | Reiskamer (second) or north guest room | group B | — | framed preview (simple frame, 0.6 × 0.8 m) | `OWNER_REVIEW` | 320 px | `art2d/FLW-D2-027-*` | clear daylight landscape; reads at 3 m. Keep it away from the koffer-emblem travel sketch |
| FLW-D2-017 *Botanische cyanotypie siergras* | bathroom (beside the framed mirror) | group B | — | framed preview (white print frame, 0.35 × 0.7 m) | `OWNER_REVIEW` | 320 px | `art2d/FLW-D2-017-*` | the narrow format suits the bath pier beside the mirror |
| FLW-D2-030 *Gestileerde varens en waterpoel* | bathroom or guest WC | group B | — | framed preview (simple frame, 0.6 × 0.8 m) | `OWNER_REVIEW` | 320 px | `art2d/FLW-D2-030-*` | a fern subject in the house that has the varen emblem: owner check against the botanic identity |
| D2-013, 016, 021, 025, 038, 039, 041, 047 | not D3-b rooms | group B | — | none | `NOT_ELIGIBLE` | — | — | — |
| D2-004, 006, 015, 036, 037 | — | group C (park) | — | none | `NOT_ELIGIBLE` | — | — | — |

**Ready for atlas / register once approved.** For each group-B piece the owner approves, D3-b needs these steps (no
other prep remains):
1. one `ITEMS` row in `scripts/build-flw-atlas.mjs` (`'FLW-D2-0xx': 320`, the 340 px / m rule clamped at 320);
2. one `ART` row in `src/content/art.ts`;
3. the id added to the owner list;
4. re-run the atlas build (it re-verifies the sha256).

**Estimate if all six are approved:** about +0.45 Mpx of atlas, likely a 2048 × 1216–1280 page (from 2048 × 960). That
is ≈ +2–3.5 MB GPU with mips (estimate: measure at the build), 0 new draw calls (one atlas material per chunk). This
branch does **not** touch the atlas or the registry, so no duplicate or unapproved entry can ship.

## 3. The Track 01 batch (what was actually built / prepared)

9 items: 3 × 3D built, 6 × 2D prepared. The batch is bounded by owner value, not by a count:
- the two mandatory carry-forwards;
- the one D3-b identity piece whose translation visibly fails its sheet (the moon);
- the group-B art that is the only remaining 2D supply for these rooms.

The sloop was reviewed but not rebuilt: its failure is secondary and not visible from the door.

| Item | Rebuild / polish / none |
|---|---|
| S3-014 swallows | **rebuild** |
| S3-017 medallion | **refine** (polish of the accepted D2-R model) + scale study |
| S3-016 moon | **rebuild** |
| S3-015 sloop | none (reviewed, `NEEDS_REFINE` noted) |
| S3-004 bird | none (`DEFER`) |
| D2-022 / 029 / 035 | none (already production) |
| D2-008 / 009 / 017 / 023 / 027 / 030 | prepared: checksums verified, framed previews, atlas rows specified |

## 4. Reference → model → player-eye

### FLW-S3-014 swallows (rebuild)

**Construction note.**
- What supports it: three separately carved birds, each on its own hidden oak dowel into the wall. The sheet's concealed rail is replaced by dowels, so nothing reads on the wall between the birds.
- How it is assembled: the body is the carrying mass; the wings and tail are let into it.
- Silhouette: long scythe wings (a convex leading edge and a hollow trailing edge, stepped by four primary tips) and deep tail streamers.
- Wing construction: two plates per wing (a covert band over the primaries), so the feather groups read as carved steps.
- Material identity: oiled oak (timber) with a slate-blue stain on the faces; the oak shows on every chamfer and cut edge. Cream belly and rufous face are painted on the lofted body.

| | Reference | Production (D2-R) | Track 01 |
|---|---|---|---|
| Silhouette | long scythe wings, deep forks | narrow blades, short | **scythe wings, stepped trailing edge, long streamers** |
| Body | plump, cream belly, rufous face | a thin spindle | lofted body, half relief, belly / face / crown painted on the form |
| Construction | carved plates in layers | one plate per wing | primaries + covert plates, chamfered edges, dowels |
| Material | blue-grey stain over warm oak | flat slate paint | **two-tone: warm oak covert band and edges, slate primaries** |
| Group | three different poses | three similar birds | glide / bank / dive (three poses, three sizes) |
| Player-eye (walk path, 3.1 m) | — | marks between windows | reads as three crafted swallows with warm / cool structure |

**Still short of the sheet:**
- the sheet carves individual feather rows inside the primaries; here only the two plate tiers read;
- the bodies are a little slimmer than the sheet's;
- in the banking bird's close-up, the far wing's covert plate overlaps the belly line;
- from the 14 m void at s = 1 the group is still small (a scale and position question for D3-b).

### FLW-S3-017 medallion (refine)

**Kept from D2-R:**
- the turned disc with its rolled, profiled rim;
- the hand-made out-of-round outline;
- the plant growing from the field;
- one terracotta family.

**Refined only where the sheet's identity was lost:**
1. a larger, ribbed, pointed bud (five petal ridges, a centre petal facing the viewer), cupped by two sepals;
2. a symmetric spray of three leaf pairs plus a small foot pair, with pointed, lanceolate leaves that fan out to the rim;
3. an inner bead inside the rim (the sheet's double ring);
4. olive patina in the leaf hollows and veins (vertex colour);
5. the lathe seam is welded (the D2-R model shows a shading line where the turn closes) and the back stays flat on the
   wall (D2-R dipped 2 mm).

**Scale study** (`sheet-medallion-scale.jpg`, the in-room door / room / close poses):
- ×2, ×2.5 and ×3 keep their proportions and stay crisp in standard and clay;
- above s = 1.6 the lathe gains segments, so the rim does not facet;
- not crude at identity scale.

**Still short of the sheet:**
- the leaves are smooth and slightly pillowy (the sheet has crisp veins and curling, serrated edges);
- no weathered chips or crazing on the rim and field (no texture by design);
- 8 leaves instead of about 12.

### FLW-S3-016 moon (rebuild)

**Construction note.**
- What supports it: a rough-hewn oak block carries a brass pin (with a washer); the pin runs into the crescent's lowest outer point, and the crescent stands 2 cm clear of the block.
- Silhouette: a fat crescent (its back to the left, the horns tapering to soft points); in section a lens (depth / width of the whole crescent 0.37).
- Proportion: block ≈ 0.7 of the crescent's width.
- Material identity: matte ivory glaze with a warm craze and dished grey-blue craters (vertex colour on paint), as the D2 moon's material decision; the block in timber.

| | Reference | Production | Track 01 |
|---|---|---|---|
| Form | volumetric crescent, lens section | 22 mm extruded cut-out | lofted crescent, lens section (depth / width 0.37 vs 0.13) |
| Base | chunky oak block, pin | small block, peg | block ≈ 0.7 × crescent width, brass pin and washer |
| Surface | crazed ivory, craters | flat ivory | warm craze, dished craters |
| Player-eye (2.2 m) | — | ≈ 15 px sliver | ≈ 25 px crescent at ×1; ×1.4 / ×1.8 evidence for D3-b |

**Still short of the sheet:**
- the hammered, faceted glaze and the crisp crater rims (close-up only);
- the cracked, rough-hewn block texture;
- at ×1 the piece is small for its room role (D3-b presentation decision).

## 5. Performance (per 3D asset)

Measured in the harness: triangles of the asset's batched meshes and the shared materials it uses. The Track 01
candidates use no new material and no texture.

| Asset | Class | Tris (Track 01) | Δ vs production | Materials | Expected draw calls |
|---|---|---|---|---|---|
| S3-014 swallows | hero prop | 2,802 | +1,938 | art timber (production used art paint) | 0 new if the gallery chunk `mUp` already batches art timber (upstairs furniture); confirm in the D3-b budget run. Fallback: the same geometry on paint, at 0 calls, loses the grain |
| S3-017 medallion | medium identity | 1,972 (s ≤ 1.6) / 2,468 (s > 1.6) | +800 / +1,296 | art paint (as production) | 0 |
| S3-016 moon | medium identity | 1,208 | +856 | art timber + art paint (as production) | 0 |

- D3-b headroom (execution plan §5): ≥ +95 calls, ≥ +110 k tris in every D3-b room. The batch cap is ≤ +2 calls /
  ≤ +12 k tris per room.
- The worst case adds ≈ +4.1 k tris across three different rooms.
- The swallows' cost is the only one that needs justification. It is the gallery's identity piece, seen by every player
  upstairs, and the gain shows at the normal walk-path distance (`swallows/t01-eye-walk` vs `prod-eye-walk`), not only
  close up.
- Hidden geometry: each bird's back is flattened against the wall, and the dowels are 12 tris each.

## 6. Isolated review harness

`asset-review.html` + `src/review/assetReview.ts`:
- dev tooling, served by `vite` only; **not** in the game build (verified: no Track 01 code in `dist/`);
- no save access.

It builds one asset (a Track 01 candidate or the current production piece) on a neutral stage, either a plastered wall
or a bedside against a wall. Three treatments:

| Treatment | What it shows |
|---|---|
| **standard** | the ART-01 interior treatment as `Env.update` computes it at indoor = 1, dusk 0: the interior sky / bounce hemisphere at 0.93, the un-shadowed sun at half strength, one fixture at the interior gain 1.7, ACES at 1.15. Shared art materials with their authored surfaces |
| **neutral** | white light, Neutral tone mapping, maps removed, vertex colour kept |
| **clay** | grey Lambert, form only |

`scripts/d3b-asset-views.mjs` captures:
- model views (front / three-quarter / side × the three treatments);
- a close detail;
- **player-eye at the phone viewport** (915 × 412, FOV 68, eye 1.65 m) from the **same poses the D2 / D2-R audit used in
  the real rooms**, transformed into the review frame, so the distances and angles are the in-room ones;
- the production piece from the same cameras;
- the source-reference crop;
- the contact sheets REFERENCE | STANDARD | CLAY | PLAYER-EYE;
- the medallion ladder and the 2D previews;
- `stats.json` (triangles, materials).

Honest limits:
- The stage has no room geometry (no side walls, ceiling or windows). Its light level approximates the interior
  treatment, not a specific room's: the D2-R swallow wall is darker in the game (≈ 37 % light).
- The final light relation is D3-b's.

Usage:

```
npx vite --port 5173
node scripts/d3b-asset-views.mjs http://localhost:5173/Feh-Lu-We/ docs/dev04d/d3b-assets   # ONLY=swallows,medallion,moon,sloop,art2d
```

## 7. Files and isolation

| New file | Role |
|---|---|
| `src/world/d3bAssets.ts` | Track 01 builders (`buildSwallows`, `buildMedallion`, `buildMoon`); audited under `T01:` names, so they never mix with the production pieces in `assetTris` |
| `src/review/assetReview.ts`, `asset-review.html` | isolated harness |
| `scripts/d3b-asset-views.mjs` | captures and contact sheets |
| `tests/dev04d-t01.test.ts` | 10 focused tests: audits and cost caps; T01 names; three distinct birds; birds off the wall and group size; uniform scale; medallion disc dimensions and uniform ×2 / ×2.5 / ×3; moon on its support and lens section; **no room / world module imports the builders** |
| `docs/dev04d/d3b-assets/` | evidence |

**No existing file was modified.**

## 8. Shared-file conflicts avoided (parallel architectural branch)

- **Not touched:**
  - `manor.ts`, `estate.ts`, `rooms.ts` / `roomdefs.ts`, `layout.ts`;
  - `props3d.ts` (the placement array), `d2props.ts` (the production builders and their anchors), `art.ts`;
  - `artAtlas.json` / the atlas image, `build-flw-atlas.mjs`, `package.json`.
- **d2props helpers duplicated, not exported.** The small relief helpers (plate / relief grid / loft) are re-implemented
  locally in `d3bAssets.ts` instead of exporting them from `d2props.ts`. A shared-file edit for a few helper exports was
  not worth a possible conflict. D3-b integration replaces the production builders anyway, and should consolidate the
  helpers then.
- **No npm script.** No `package.json` script was added for the capture run; the command is documented above.

## 9. Validation

| Gate | Result |
|---|---|
| typecheck | clean |
| unit (vitest) | 259 / 259 (21 files, incl. the 10 new Track 01 tests) |
| build | ok; `asset-review.html` and `d3bAssets` are not in `dist/` |
| e2e:dev04d | 18 / 18: **130 interactables / doors, 21 checkpoints, save keys and version 4 unchanged**; production S3 pieces unchanged (S3-014 864 t, S3-017 1,172 t, S3-016 352 t); wall-art contract and audits clean; no page errors |
| e2e:dev04a / dev04b / dev04c | 19 / 19, 9 / 9, see §9.1 |
| world placement | none: the builders are imported only by the harness and the tests (unit test asserts it) |
| puzzle / evidence | untouched (no gameplay file changed) |

### 9.1 Regression run

Production build `vite preview`, sequential runs:

| Suite | Result |
|---|---|
| e2e:dev04d | 18 / 18 |
| e2e:dev04a | 19 / 19 |
| e2e:dev04b | 9 / 9 (construction audit clean) |
| e2e:dev04c | running at the first commit; result added below |

## 10. Owner decisions requested

1. **S3-014 swallows**: approve the Track 01 form (scythe wings, two-tone oak / slate, glide / bank / dive), or name
   what still misses the sheet. Then D3-b sets the group scale (s 1.0–1.25) and its relation to the bench.
2. **S3-017 medallion**: approve the refinement. Pick the size range to test in D3-b (recommended ×2–×2.5) on the
   work-zone wall facing the door.
3. **S3-016 moon**: approve the rebuild (it replaces a model the audit had kept). Choose ×1 or a presentation scale
   (×1.4 recommended) for the bedside grouping.
4. **Group-B 2D**: yes / no per piece for D2-008, 023 (study), 009 (botanic), 027 (Reiskamer or guest), 017, 030
   (bathroom).
5. **S3-015 sloop**: leave it, or schedule the hull refine with the D3-b desk composition.
