# DEV-04D D3: execution plan (recalibrated after D3-0)
This plan follows the D3-0 audit (`DEV04D_D3_CRAFTSMANSHIP_AUDIT.md`). The D3 sequence itself is unchanged: **D3-a → D3-f**.
What changes:
- how work is judged (§1–§3);
- what each batch must improve (§5);
- a small D2-R step before D3-a (§4).

## 1. Rules (apply to every D3 and D2-R change)
1. **Craft hierarchy.** Judge each intervention in this order:
   1. silhouette;
   2. proportion;
   3. construction / support / joinery;
   4. placement and spatial relationship;
   5. material identity;
   6. grounding / authored shading;
   7. fine surface detail.
2. **No detail before structure.** An object is not improved by adding detail until its silhouette, proportion,
   construction, placement and material identity already work at normal player-eye distance.
3. **Progress test.** Every intervention must improve object craft, room composition or estate coherence. Adding props
   that improve none of these does not count.
4. **Design before modelling.** Each hero object gets a one-paragraph construction note before it is modelled. The note
   says what carries what, which profile defines the silhouette, and the target size at approach distance in screen
   pixels.
5. **Existing kit first.** Use what is already there:
   - `Asm` + `auditParts`;
   - `lathe`, `moulding`, `softBox` / `cushion`, `projectUV` grain, `bake` / `baseAO`, `ContactShadows`;
   - the shared art materials.

   New helpers only once two or more real use cases exist. No new materials or textures without a measured reason.
6. **Unchanged contracts:**
   - ids, checkpoints, save schema 4, puzzles, evidence placement;
   - the wall-art contract, construction audits;
   - FLW ship rules; RSV-019…022 untouched.

## 2. Quality gates (per batch)

| Gate | Pass condition |
|---|---|
| G1 player-eye | The targeted object or zone reads at the approach pose on a 915 × 412 viewport: hero objects ≥ 60 px on their main axis; identity pieces recognisable without being close. |
| G2 composition | The room has defined zones (the six room-audit questions answered); no object island; identity pieces relate to an axis, an entrance or furniture. |
| G3 construction | `Asm` audit clean; neutral / clay view shows a credible support chain. |
| G4 budget | Per room batch: **≤ +2 calls, ≤ +12 k tris** (doors closed, low); the mobile guide holds everywhere (≤ 150 / ≤ 250 k). Rooms with less headroom get stricter local caps (§6). |
| G5 regression | typecheck, unit, `e2e:dev04a/b/c/d`. Add dev01–03 + full `e2e` whenever a pickup, door or puzzle object is touched. |
| G6 owner | Phone review of the deployed build for each merged batch. |

Rejection rule: a change that looks better only in a clay close-up, with no visible gain at mobile play distance, is
normally rejected.

## 3. Evidence standard
For every meaningful craft change, one matched set (same camera, FOV, viewport and quality) before and after:
1. **approach**: the player's normal approach pose at eye height (1.65 m);
2. **room composition**: the room seen whole from its main entrance or axis;
3. **close**: about 1–1.5 m;
4. **neutral and / or clay**: whenever modelling or construction is the subject.

Also required:
- **Viewports:** phone 915 × 412 (primary) and 1280 × 720 (secondary).
- **Tooling:** the audit harness gains `MODE=standard|neutral|clay`, generalised from the VCP-01 capture approach. It
  freezes the tick and forces a render plus `gl.finish()` before reading counters. Poses stay in the harness (`SET=d3a…`)
  so before and after are reproducible.
- **Performance:** measured separately (doors closed, low), never inferred from evidence frames.

## 4. D2-R: a bounded refinement before D3-a (proposed)
Six items, one PR, about one working session. The reason to do it first: these are the owner's most visible complaints,
and D3-a would otherwise inherit an unresolved quality debt.

| Item | Change | Budget |
|---|---|---|
| Keys (K3-001…004) | Presentation scale ×1.7 inside containers; a framing surface (felt / linen liner in the drawers, a tray in the hatch). Item / pickup ids, rules and hit boxes unchanged; the hit box grows only if needed for the larger model. | about +50 tris per container |
| S3-030 mask | Remodel: almond face with the flame crown, nose ridge, eye cuts, painted zones as one surface. ≈ 0.65 m. Moved to the cottage's arch-axis wall (owner picks one of two slots, O-2). | ≤ 900 tris |
| S3-017 medallion | Remodel: profiled border, sculpted bud and leaves, glaze / patina split; Ø 0.55–0.6 m. **Interim placement** on the west wall at the table axis. Final position in D3-b. | ≤ 900 tris |
| S3-014 swallows | Remodel: bodies with volume, swept wings and forked tails; group ×1.6 (≈ 1.7 m); lowered to relate to the bench. | ≤ 1.2 k tris |
| S3-031 tile | Azulejo panel: the existing relief plus a 4 × 4 glazed field with a stone surround (≈ 1.0 m), on the wall behind the terrace table zone. | ≤ 900 tris, 0 calls (ceramic and paint exist in the chunk) |
| S3-037 heron | ×1.45 plus a broad rooted stump / stones; bench and view unchanged. | ≤ 1.0 k tris |

**Out of D2-R:** S3-033 (D3-e), the maquette (no gain), and S3-004 / 015 / 016 plus the salon wall (keep).

## 5. D3 batches (sequence unchanged)

### D3-a: dining / game room and kitchen (first test of the strengthened workflow)

**Room-composition objective:**
- Dining: the long table axis stays the spine. The game-table memory scene (G1 / G2) is composed on it. The side table
  becomes the drinks supply against a wall. The north (window) end gets a sideboard composition.
- Kitchen: split the 12.6 × 17.6 m floor into a **work zone** (range, prep table, island, with use traces: pans, a
  chopping board in use, the crate story) and an **eating zone**. A runner or tile border defines circulation. One wall
  gets real depth (a dresser with plates).

**Craft targets** (highest value first):
1. kitchen casework: carcasses with plinth / cornice profiles, door panels, worktop overhang, island with legs or a
   plinth that carries visibly;
2. dining chairs and the table: leg and rail joinery read;
3. one shared interior door / window casing profile (`moulding`), proven in these two rooms first.

**D2-R items here:** none (D2-R is done before).

**Architecture / material targets:**
- the casing family;
- floor borders / runners;
- a tile-field tint variation (vertex colour, no new texture).

**No-go:**
- the service chart, the hatch mechanism, the `kitchen.*` ids, D2-005 / D2-010 slots, evidence;
- no new materials;
- no engine-wide refactor (the casing helper stays a local `moulding` profile until D3-b reuses it).

**Headroom:** kitchen-b 128 / 210 k (**+22 calls / +40 k**); dining-b 98 / 201 k. Local cap: kitchen ≤ +1 call,
≤ +10 k tris.

**Gate:** G1–G6, with the before / after evidence set in §3.

### D3-b: study, botanic room, Reiskamer, Sterrenkamer, north guest room, bathroom

**Room-composition objective:**
- Botanic room: a working centre (potting / herbarium bench) at the window end, a plant-stand cluster at the other end,
  the medallion over the work zone (final position).
- Study: a centre piece (map chest / library table).
- Reiskamer / Sterrenkamer: identity groupings (desk + sloop + D2-022; bedside moon + D2-029 + star map).

**Craft targets:**
- the work bench (construction-first);
- the plant stands;
- the bed / bedside joinery where it reads.

**D2-R items here:** the medallion's final placement.

**Architecture / material targets:** reuse the casing family; window reveals.

**No-go:**
- the prints wall (evidence);
- the star-map / travel-sketch panels;
- the study key drawer.

**Headroom:** large everywhere (≥ +95 calls, ≥ +110 k).

### D3-c: attic common, seasonal store, lookout
- **Objective:** a store that tells a seasonal story; a common room zone.
- **Craft:** roof-truss joinery reads (support chains), storage racks.
- **No-go:** the attic telescope / lookout puzzle items.
- **Headroom:** to be measured at batch start (not in the D2 budget set).

### D3-d: living, vestibule, back lobby, billiard, library, Copacabana
- **Objective:**
  - living: a second zone in the empty west half;
  - vestibule / lobby: an arrival sequence;
  - billiard: a wall composition (cue rack, score board, pendant over the table).
- **Craft targets:**
  1. the **billiard table remodel** (turned legs below a shallower apron, corner blocks, moulded rail, cushion profile);
  2. library casework (pilasters, cornice, plinth, varied modules, ladder rail);
  3. the **globe comparison** (production / pedestal / four-legged; §4 of the audit).
- **D2-R items here:** none.
- **Architecture:** the interior casing family; hall floor border.
- **No-go:**
  - the catalogue sockets and the library desk drawer;
  - the living hearth calibration;
  - the Copa sign identity;
  - VCP-01 code: it is merged only after a rebuild on production with fresh evidence.
- **Headroom:** **library-b +7 k tris** (critical: the library work must be triangle-neutral, e.g. trim hidden book
  backs); living-a +20 calls / +38 k; hall-a +36 / +67 k.

### D3-e: arrival / front façade, garden terrace, BBQ, lake, wellness, east glade
- **Objective:** first impression. The approach to the manor must read as a crafted house.
- **Craft targets:**
  1. the **portico** (columns with entasis, a real entablature, responding pilasters, a door case with fanlight, steps
     with nosing);
  2. façade articulation (plinth course, quoins, string course, sills / lintels with depth; per-course tint variation);
  3. forecourt (kerbs, wear tracks, planter rim).
- **D2-R items here:** S3-033 fire screen (pierced scroll silhouette and warm iron, or drop it, per the BBQ brief).
- **Material:** vertex-colour variation over the existing ashlar; no new textures.
- **No-go:**
  - the front door / key flow;
  - the forecourt car props' gameplay role (if any);
  - the Wickerman (D4).
- **Headroom:** x05 terrace +49 / +50 k; x07 BBQ +38 / +45 k. The façade itself was not in the D2 budget set: measure
  it at batch start.

### D3-f: shed, campfire, well, golf, BOSLUST surroundings, Portugal cottage + terrace (light touch)
- **Objective:** coherence of the far destinations; path ↔ woodland transitions.
- **Craft:** the shed construction; the well's stone courses.
- **D2-R items here:** none (the mask and tile are done in D2-R; the cottage only gets composition polish).
- **No-go:** BOSLUST puzzle content; golf mechanics.
- **Headroom:** large (the cottage views ≥ +80 calls).

## 6. Performance strategy
- **Guide unchanged:** ≤ 150 calls / ≤ 250 k tris per budget view (low, doors closed).
- **Per batch:** ≤ +2 calls / ≤ +12 k tris per room.
- **Local caps** where headroom is thin:
  - library ≤ 0 tris net;
  - kitchen ≤ +1 call / +10 k;
  - living ≤ +1 / +10 k.
- **Craft is mostly free in calls** (the existing materials per chunk), and spends triangles where silhouettes show.
  Remove hidden geometry (book backs, interior faces of closed cabinets) to pay for it.
- Watch chunk culling spheres (D1 lesson: a far part on a shared material mesh stretches the sphere).
- New textures need a measured reason. Canvas textures (e.g. the globe map) count toward the 12 MB GPU texture budget.

## 7. First proposed implementation scope
1. **D2-R** (§4): one PR with the six items above. Evidence per §3; gates G1–G6.
2. Then **D3-a** (§5). It also proves:
   - the generalised capture modes (`MODE=neutral|clay`);
   - the shared casing profile;
   - the construction-note practice.

Nothing starts before owner approval (see the decisions in the audit summary).
