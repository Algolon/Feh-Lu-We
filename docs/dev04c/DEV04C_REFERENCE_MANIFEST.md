# DEV-04C — Reference & art-asset manifest

Purpose: one table of every stable art / reference asset that DEV-04C found (or was told to expect), where it would be
used and how far it is integrated — so Batch 05, the RESERVED work and the FLW rasters can be added later **without
redesigning anything**: each row names the slot and the contract a delivered file plugs into.

Audit scope (10 Oct 2026, production `4f2b2ed`): the working tree, every remote branch (`git ls-remote` + `git ls-tree`),
the session filesystem (`find / -iname '*FLW*'`), a full-text search for `FLW-`, and the brief itself (no attachments).

## States

| State | Meaning |
|---|---|
| `AVAILABLE_APPROVED` | final, owner-approved art file present — may be shipped in game |
| `AVAILABLE_REFERENCE_ONLY` | present, approved as *reference* (shape / material / construction), never shipped as a texture |
| `USED_IN_C` | used by DEV-04C (as reference or asset — see column) |
| `DEFER_TO_D` | available or partly specified, consciously left for DEV-04D |
| `PENDING` | explicitly paused / not to be inferred (RESERVED) |
| `UNAVAILABLE` | expected by id/family but no file exists in the repo or the session |

## 1. Stable FLW families (Feh Lu We decorative art)

**No file, manifest or textual definition of any `FLW-*` id exists in the repository or in this session.** Rows are
therefore family-level (individual ids cannot be listed without inventing them). Nothing was generated to replace them.

| Stable ID | Source / reference | Intended location / use | State | Integration state |
|---|---|---|---|---|
| `FLW-D2-###` (2D wall art) | not supplied | manor / cottage walls, framed | `UNAVAILABLE` | **contract ready, not integrated** — see §4. Existing procedural paintings and the DEV-04B-R hall painting stay |
| `FLW-S3-###` (3D decorative reference sheets) | not supplied | sculptures / masks / carved pieces (`06_art_decor/sculptures_masks_woodcarving`) | `UNAVAILABLE` → `DEFER_TO_D` | nothing modelled |
| `FLW-K3-###` (key prop family) | not supplied | the four gameplay keys (§3) | `UNAVAILABLE` | keys left as they are; dependency recorded |
| `FLW-RSV-###` (RESERVED, general) | not supplied | RESERVED route content | `PENDING` (production paused) | not implemented |
| `FLW-RSV-019` | — | RESERVED route fragment | `PENDING` | not implemented, content not inferred |
| `FLW-RSV-020` | — | RESERVED route fragment | `PENDING` | not implemented, content not inferred |
| `FLW-RSV-021` | — | RESERVED route fragment | `PENDING` | not implemented, content not inferred |
| `FLW-RSV-022` | — | RESERVED route fragment | `PENDING` | not implemented, content not inferred |
| Batch 05 (any family) | not supplied | — | `UNAVAILABLE` | not a prerequisite for C |

## 2. Internal references actually in the repo

These carry no `FLW` id; their stable identifier is the file stem (versioned `_v01`, a later `_v02` goes beside it).

| Stable ID | Source | Location / use | State | Integration state |
|---|---|---|---|---|
| `wickerman_clearing_sheet_v01` | `docs/reference/dev04/05_landmarks_hero_props/wickerman_clearing/generated/` (+ `GENERATED_REFERENCE.md` "future interaction states") | Wickerman clearing | `AVAILABLE_REFERENCE_ONLY` · `USED_IN_C` | used for the C6 state flow (unlit → lit → ignitable → burned aftermath), palette of the char / ember treatment, and the "fire not mandatory" rule. The figure geometry is DEV-04B's and unchanged |
| `copacabana_room_sheet_v01` | `04_special_locations/copacabana_room/generated/` | Copacabana Room | `AVAILABLE_REFERENCE_ONLY` · `USED_IN_C` | palette weight only (warm wood vs teal) for the C1 calibration of the room's light; no geometry change |
| `living_dining_furniture_sheet_v01` | `03_assets/living_dining_furniture/generated/` | living / dining | `AVAILABLE_REFERENCE_ONLY` · `USED_IN_C` | bottom vignette = warm-room value hierarchy target for the interior light / fabric breakup |
| `books_family_sheet_v01` | `03_assets/books_closeup/generated/` | shelves | `AVAILABLE_REFERENCE_ONLY` | already integrated in DEV-04B; not changed in C |
| `attic_observatory_sheet_v01` | `04_special_locations/attic_observatory/generated/` | attic nook | `AVAILABLE_REFERENCE_ONLY` | DEV-04A/B; not changed in C (inherits the shared surface / light layer only) |
| `gingerbread_maquette_sheet_v01` | `05_landmarks_hero_props/gingerbread_maquette/generated/` | maquette | `AVAILABLE_REFERENCE_ONLY` · `DEFER_TO_D` | material re-skin is an asset-library item, not a C calibration area |
| `personalized_boards_collage_v01` | `docs/reference/dev04/generated/` | source of the six sheets | `AVAILABLE_REFERENCE_ONLY` | not used directly |
| technical modelling board (`*_v02`) | stated in `PERSONALIZED_REFERENCE_BOARDS.md` | all six subjects | `UNAVAILABLE` | — |
| `07_materials/timber_painted_wood` (Taheri stylized wood, URL) | `REFERENCES.md` | timber profile | `AVAILABLE_REFERENCE_ONLY` (URL) · `USED_IN_C` | principle only: broad authored value shifts, no noisy realism |
| `00_calibration/external_style_targets` (Soucheff manor, URL) | `REFERENCES.md` | estate-wide | `AVAILABLE_REFERENCE_ONLY` (URL) · `USED_IN_C` | principle only: material simplification, large readable forms |
| `06_art_decor/manor_paintings` (NGA, public domain, URL) | `REFERENCES.md` | future original paintings | `AVAILABLE_REFERENCE_ONLY` (URL) · `DEFER_TO_D` | — |

## 3. In-game art already carrying a stable id (unchanged)

| In-game id | What | Note |
|---|---|---|
| `painting@94.90,89.35` (+ the other `painting@x,z` ids) | DEV-04B-R hall painting (`drawManorLandscape`, procedural) and the room paintings | stay until an approved `FLW-D2` supersedes one |
| `panel@128.60,109.35` | Copacabana Room bar sign | unchanged |
| gameplay keys `frontKey`, `shedKey`, `studyKey`, `consKey` + pickups `pk.*` | box-compound world models, SVG inventory icons | **art ids must stay separate from these save ids** — a future `FLW-K3-###` maps to an item id in a lookup, never replaces it |

## 4. Integration contracts (so later assets drop in without redesign)

**FLW-D2 (wall art)** — a delivered raster needs: `{ id: 'FLW-D2-###', file, aspect, frame: 'gilt' | 'timber' | 'none',
wall: room + plan point + yaw, height }`. Placement goes through the existing `canvasPanel()` / `painting()` path (an
image-backed texture instead of the procedural draw), which already registers the footprint with `openings.ts`
(`registerArt` → `wallArtConflicts()`), so doors, windows, sweeps and circulation are protected by the DEV-04A contract
and its tests. Scale rule: the largest wall gets one hero piece (hall ≈ 2.0 × 1.4 m), secondary walls ≤ 0.9 m, no
wall filled just because it is empty.

**FLW-S3 (3D refs)** — modelled through the DEV-04B `Asm` construction audit (support / connectivity rules) into the
area's existing batch; only for an established location and only when the reference is coherent.

**FLW-K3 (keys)** — one shared key family (bow / shank / bit construction) mapped by gameplay item id
(`{ frontKey: 'FLW-K3-###', … }`); the pickup ids, item ids and lock ids do not change.

**FLW-RSV** — nothing in DEV-04C reads, reserves or blocks these; no puzzle mechanic was changed to make room.
