# DEV-04D D2-R: production craftsmanship corrections
Branch `ccr-f4845963-3qt9ft`, built on production `f26e563` (PR #8) plus the D3-0 audit (`ccba5f1`). The scope is the
owner-approved D2-R brief.
- **Not touched:**
  - S3-004 bird, S3-015 sloop, S3-016 moon, the salon wall, the maquette;
  - S3-033 fire screen (deferred to D3-e);
  - PR #9.
- **Not started:** D3-a.
- **Not done:** merge, deploy.

Craft order applied throughout, judged at phone player-eye first: silhouette → proportion → construction / support →
placement → material → grounding / shading → detail.

## 1. Evidence
- **Owner screenshots:** they did not reach this session (see `d2r/owner/README.md`). The "before / production" set is
  therefore the matched capture of production `f26e563`, from **identical camera poses** at the owner's phone viewport
  (915 × 412, low quality): `d2r/before/`, `d2r/keys-before/`.
- **After:** the D2-R build, same poses: `d2r/after/`, `d2r/keys-after/`.
- **Clay** (one grey material, no maps or vertex colour; form only): `d2r/after-clay/`. Harness:
  `MODE=clay|neutral` in `scripts/dev04d-audit-views.mjs`.
- **Pose set:** `SET=d2r`, fixed poses rather than object-relative ones, so moved pieces are compared from the same
  cameras:
  - swallows from the walking path, across the void, close;
  - medallion from the door, the room, close;
  - **cottage:**
    - entry approach;
    - through the arch;
    - room looking south;
    - room toward the sideboard;
    - room toward the east wall;
    - mask close and face-on;
    - D2-045 close;
  - **terrace:** approach from the landing, table, panel close;
  - **heron:** from the path, from the bench, close;
  - keys in their opened containers (`d2-key-*`).
- **Key views:** `scripts/dev04d-key-views.mjs` at the phone viewport (`VW` / `VH`). Each key close up and from the
  main e2e's standing pose.

## 2. Per asset: before → after

| Item | Before (production) | After (D2-R) | Final dimensions | Triangles |
|---|---|---|---|---|
| **Keys** K3-001…004 | 15–25 px from the standing pose, brass on brown wood, iron on brown: lost in the drawer | ×1.7 presentation (visual only); each on its own support for contrast. Front key: brass + red tag on a **green felt** liner. Shed key: dark iron + wooden hanger on a **pale folded linen** cloth. Study key: on the archive card (now 15 × 22.5 cm, it lay under the drawer floor before D2) on a **dark leather blotter**. Conservatory key: on a **cream enamel oval dish** in the hatch. No glow, no glint. | key lengths 26.5 (front), 17.7 (study), 23.2 (shed), 21.0 (cons) cm | models unchanged (444 / 380 / 312 / 448); liners 108–216 each |
| **S3-030 mask** | an ellipsoid with stuck-on lozenges, 0.4 m, on the east wall seen side-on | **one sculpted shell:** almond face rising into an asymmetric three-tongue flame crown; brow, nose ridge, cheek planes and lips modelled in the surface, cut eye sockets, a hand-made waver in relief and outline. The coral / olive / cream paint follows the form as soft washes (authored vertex colour), so nothing is stuck on. Hung over the sideboard (§3). | 0.65 × 0.35 m, relief up to ≈ 0.13 m | 1,496 |
| **S3-017 medallion** | a 0.35 m disc, a ring and lozenges; a dot on a 15.6 m wall | **turned clay disc** with a rolled, profiled rim, slightly out of round. The plant grows from the field: a curving stem, five leaves with a sunk midrib that lift at the tip and overlap the stem, a bud cupped by two sepals. One terracotta family: the relief lighter, its contact with the field darker. Interim position: west wall, table axis, raised to 1.65 m. Final position in D3-b. | Ø 0.58 m, rim 6.6 cm deep | 1,172 |
| **S3-014 swallows** | three flat cut-outs, ≈ 1.2 m group, dark marks | **turned, flattened bodies** (slate back, rufous throat, cream belly painted on the form); swept, tapered wings on **two separate planes** (the near wing proud of the body, the far one behind it); deeply forked tails. Same loose, asymmetric shallow arc, uneven spacing, the middle bird highest. The tone is lifted for the shadowed window wall. | group ≈ 1.6 × 0.65 m (beak to tail), birds ×1.0 / 1.18 / 1.07 | 864 |
| **S3-031 tile** | a 45 cm stamp on the house corner | an **architectural azulejo panel**: a 4 × 4 field of 22.5 cm glazed tiles on a grout bed. The original lemon relief is the centre 2 × 2; twelve border tiles carry blue diamonds, the corners quarter rosettes. A blue plaster surround in the house's trim colour. On the façade pier **behind the game table and over the bench end** (between the east window's shutter and the corner). | 1.04 × 1.04 m | 492 (field) + 436 (relief) |
| **S3-037 heron** | 0.8 m on a plain cylinder stump, beside the bench | the accepted heron at **×1.45**, on a **broad rooted stump** (flared root lobes) with three shore stones (the lake's own rock material). At the bay's lakeside corner, front-right of the bench: it frames the view west without standing in it, and its silhouette clears the bench against the water from the path. | 1.18 m overall; stump Ø ≈ 0.5 m | 694 |

## 3. Portugal cottage composition

**Before:**
- D2-045 on the entry's west wall;
- D2-046 on the room's arch axis;
- the mask on the room's east wall, seen side-on.

**After:** three walls, three roles, nothing competing on the axis.

| Role | Piece | Where | Why |
|---|---|---|---|
| Axis anchor | **D2-046** *Een middag in Portugal* | north wall over the long table, unchanged | seen from the terrace door through the arch (`cot-entry-approach`, `cot-through-arch`) |
| Supporting painting | **D2-045** *De weg naar de kust*, **moved from the entry** | room's east wall, between the partition and the east window (x 29.68, z 160.9, facing west) | seen from the table and on the right when stepping through the arch. It no longer hangs in the narrow entry, where it was passed rather than looked at. |
| Object tied to use | **S3-030 mask** | west wall over the **sideboard with the blue and white plates and the jug**: a Portuguese dresser vignette | the sideboard moved 0.8 m south, out from under the west window, and the mask hangs centred above it, clear of the window |

- The entry keeps its door, lanterns and plants.
- The wall-art contract is checked for all three pieces: no door, window or sweep conflict.
- D2-045's old slot is on the e2e retired list.

## 4. Performance
Doors closed, low quality, the 37 standard views.
- Base: `budget-base-f26e563-rooms.json`. After: `budget-d2r-rooms.json`.

| | Δ calls | Δ triangles |
|---|---|---|
| every view | **−1 … 0** | −60 … +2,005 |
| living-a / living-b | 0 / 0 | +528 / +528 |
| kitchen-a / kitchen-b | 0 / 0 | +528 / +528 |
| library-a / library-b | 0 / 0 | +240 / +240 (library-b now 242,970: still under 250 k) |
| cottage room / entry | −1 … 0 | +419 … +2,005 |
| lake viewpoint / approach | 0 / 0 | +838 / +838 |
| worst view overall | 130 calls | 242,970 tris (0 views over the mobile guide) |

Two fixes made on the way:
- **Heron stones:** in the paint material they stretched the grounds chunk's paint mesh into the lake view (+1 call,
  +9.1 k tris, the D1 culling lesson). They now use the lake's own shore-rock material: +0 calls.
- **Drawer liners:** as separate meshes they cost +1 call in views that frame a closed chest. They now draw only while
  their drawer is open.

No new material or texture.

## 5. Validation

| Gate | Result |
|---|---|
| typecheck | clean |
| unit (vitest) | 244 / 244 |
| e2e:dev04d | 18 / 18 (D1 art; keys seated on their support ±4 mm and targeted from the stand pose, front key in the home world; S3 built, audited, flush / supported; salon; the lake bench and BBQ reachable) |
| e2e:dev04a | 19 / 19 (wall-art contract with the moved D2-045, mask, panel) |
| e2e:dev04b | 9 / 9 (construction audit clean) |
| e2e:dev04c | 22 / 22 |
| e2e:dev03 / dev02 / dev01 | 11 / 11, 34 / 34, 34 / 34 |
| full e2e (all four keys taken through their real pickups) | 103 / 103 |

The full table was re-run on the final D2-R build: the liners drawn only while open, the heron stones in shore rock,
the construction-audit fixes. Every suite passed; dev04d 18 / 18 was run on the same final build.

Confirmed:
- 130 interactables / doors and 21 checkpoints unchanged; save schema 4.
- No decor became interactable (the D2-R pieces add no id).
- Key pickup ids, labels, availability rules, hit boxes and reach unchanged; only the visible meshes are scaled.
- No door, window or path obstruction (wall-art contract; the bench / BBQ walk checks).
- Evidence and puzzle panels untouched (the protected-panel clearance check).

## 6. Still visually questionable (for the owner's phone review)
1. **Swallows across the void:** from the landing (≈ 14 m) the group is still small. Wider would crowd the space
   between the windows; it reads well from the gallery itself.
2. **Medallion from the botanic door:** much stronger from the room and close; from the door it is a modest disc on a
   long wall. Its final position belongs to the D3-b room composition (a work-bench zone).
3. **Mask colour in the cottage's warm, dim light:** the olive half reads strong. The washes are softened and lightened,
   but this needs a check on the phone in production lighting.
4. **D2-045 on the east wall** sits 0.4 m from the partition corner, because the east window bounds the wall. An
   alternative is the partition's room side, facing the axis.
5. **Conservatory key:** the dish and ×1.7 make it readable, but the hatch recess itself is dark. Hatch lighting is out
   of D2-R scope.
6. **Heron:** 1.18 m reads from the bench and in silhouette from the path, but it remains a sculpture-scale object in a
   wide landscape, as intended.
