# DEV-04D D3-A2: manor entrance and front-façade architectural calibration
- **Branch:** `ccr-f4845963-3qt9ft`, on production `444de9b` (D3-a merged, PR #11).
- **Scope:** the principal entrance, the portico, the steps and landing, the front-door surround and reveal, and the
  projecting central bay.
- **Not touched:** the rest of the façade, the rear and side façades, D3-b.
- **Not done:** merge and deploy, both pending owner review.

## 1. Baseline diagnosis (production `444de9b`)
Evidence: `d3arch/before/`, `before-neutral/`, `before-clay/`. 10 fixed poses at the phone viewport 915 × 412, low
quality.

| Element | As built | Why it reads as blockout |
|---|---|---|
| Columns | One 12-sided lathe: a small base step, a nearly straight shaft, a thin abacus plate | They stand straight on the landing with no plinth; the shaft has no taper; the capital barely spreads |
| Entablature | One 0.29 m painted box (the "architrave") under one 0.1 m slab, a thin lead slab on top | It reads as a flat slab on sticks: no fasciae, no frieze, no projecting cornice. The beam stops at the column line and never reaches the house, so the canopy's back hangs in the air. |
| Pilasters / support | None | Nothing on the bay answers the columns |
| Doorway | The bay's 1.9 m recess with bare stone cheeks; only the brown wooden door lining inside | No stone surround, no head, no jambs, no plinth blocks; the opening is a hole cut in the ashlar |
| Steps / landing | One 7.5 cm step body (one box, one colour) under the landing slab | No nosing, no riser / tread value split, so the step vanishes at approach distance |
| Lanterns | Centred at z 79.7, inside the bay's masonry (the bay face is at 79.55) | Mostly buried; their light came out of the wall |
| Bay base | The bay starts 0.5 m above the ground; the main plinth runs behind it | The projecting bay has no base and no string course: it reads as a flat panel stuck on |
| Façade (whole) | Plinth, string course, cornice and quoins exist (DEV-03 / DEV-04A) | Already the right grammar. The weak point is the entrance bay, which carries none of it. |

## 2. Interventions (`src/world/entrance.ts`, wired in `manor.ts` `shell()`)
All of it is visual. The landing floor, the 7.5 cm step height, the column collider circles (r 0.2 m), the door, its
opening, its swing and its threshold are the shell's, unchanged.

### 2.1 Portico (construction first)
| Part | Construction |
|---|---|
| Column plinths | 0.5 × 0.5 × 0.14 m blocks on the landing, in the warmer base stone |
| Tuscan columns | 16-sided lathe: torus base and fillet; shaft Ø 0.40 m with entasis (widest at a third of its height, ≈ 15 % narrower under the neck); astragal, neck, echinus spreading to the abacus. One shared helper: `tuscanColumnGeo(h, r)`. |
| Abaci | 0.54 m square. Their top is the old beam datum (GF + 2.76), so the beam bears on them exactly. |
| Responding pilasters | On the bay face behind each column: base block, shaft, cap at the same datum. The beam now has a back bearing. |
| Architrave | Two fasciae (a shadowed lower one, a dressed upper one) along the front, and **returns** from each column back to its pilaster. The canopy is carried front and back. |
| Soffit | Closes the canopy between the returns (no view up into an empty box) |
| Frieze | A 0.2 m block recessed 4 cm behind the architrave |
| Cornice | `corniceRun()`: bed moulding, a corona projecting 0.17 m (its soffit throws the shadow line that reads at approach distance), a cymatium |
| Roof | Lead covering, a lead roll along the front edge, a flashing up the bay face |

### 2.2 Doorway
- A dressed stone surround on the bay face:
  - 0.2 m jambs, 6 cm proud, standing on darker plinth blocks;
  - a 0.14 m lintel across them at the door head (GF + 2.7).
- The recess cheeks are lined in a shadowed dressed tone through the bay depth, so the reveal reads as worked stone.
- Clearances:
  - the opening is unchanged: 1.7 m in the wall, 1.9 m in the bay;
  - the lintel's underside (2.85 m) is above the door leaf (2.77 m);
  - unit test: nothing enters the doorway prism.

### 2.3 Steps and landing
- **Step:** the body is in the darker riser stone; the tread is in a lighter stone with a 2.5 cm nosing and returned ends.
- **Landing:** a nosing lip at floor level, with a riser shadow band under it, 1 cm proud of the slab's own face (no shared
  plane).
- **Walk heights:** unchanged: ground 0, the step 0.075, the landing GF 0.15.

### 2.4 Central bay
- **Bay plinth:** the bay gets its own plinth course with a weathered top, either side of the steps. It stops at the
  steps, as the main plinth stops at doors. The bay's quoins now stand on it (both start at 0.7 m).
- **String course:** it runs round the bay front and returns at the main string course's height, so the floor line is
  continuous; behind the portico it passes inside the canopy, which sits against it.
- **Lanterns:**
  - Moved out of the masonry onto wrought brackets, between each pilaster and the door surround.
  - Their light was lowered from 4 / 7 m to 2.2 / 5 m: free of the wall, the old setting washed the portico white.
  - This is a local fixture value; the lighting system is unchanged.

### 2.5 Material and imperfection
- **Broad value zones in one limestone family** (`STONE`):
  - base / riser darkest, then the plinth tops;
  - the wall field;
  - shadowed dressed members (lower fascia, soffits, reveals, pilaster shafts);
  - dressed trim (columns, upper fascia, cornice, surround) lightest;
  - lead.
- **No new texture or material:**
  - the ashlar `stone`, `paint` and `slate` materials the shell already uses;
  - the geometry joins the `manor` chunk's existing batches.
- **Imperfection:** the batcher's per-part value jitter, raised slightly on stone members (±1.5 %). No crooked geometry.

### 2.6 Deliberately left unchanged
- The rest of the front façade:
  - the main plinth, string course, cornice and quoins (already the right grammar);
  - the window surrounds;
  - the pediment and oculus;
  - the roof and dormers.
- The rear and side façades.
- The manor footprint, the rooms, the door position, the door interaction, collider and swing, paths and routes,
  vegetation (the hedges stop at 84.9 and 95.1, clear of the bay plinth).

## 3. Player-eye assessment
Matched poses, `d3arch/compare/` (before | after):

| View | Gain | Reads at normal play distance? |
|---|---|---|
| Long forecourt approach / façade whole | Small: the portico's top reads as a deeper, layered band and the lanterns show | marginal at 28–34 m; the house silhouette is unchanged by design |
| Medium approach (18 m) | The canopy has thickness and a shadow line; the pilasters frame the door; the bay has a base | **yes** |
| In front of the steps | Constructed entablature on capitals; door surround and lintel; nosed step | **yes**: the strongest view |
| Angled left / right | The returns carry the canopy to the wall (no floating back edge); the bay plinth turns the corner | **yes** |
| Portico close / door reveal | Column base / entasis / capital; lined reveal | yes (close detail) |
| Out through the door | Looking out: unchanged framing, door clear | no change, as intended |

Clay (`before-clay` vs `after-clay`): the gain is geometric, not lighting. Pilasters, beam returns, the fasciae, the
corona's soffit, the door surround and the nosed step all exist in clay.

**Honest limit:** from the far forecourt the change is modest. The façade's big read (its massing and the repeated
ashlar) is the next lever, and it belongs to D3-e.

## 4. Reusable architecture grammar
| Technique | Verdict | Use |
|---|---|---|
| `tuscanColumnGeo(h, r)`: base, entasis, astragal, echinus | **hero architecture only** | the portico; a garden loggia or a conservatory entrance if one gets columns. Never for posts and props. |
| `corniceRun()`: bed moulding, corona, cymatium on three sides | **reusable** | door heads, porch canopies, the cottage door hood, dormer heads. It is cheap (3 boxes) and its corona shadow line is what reads at distance. |
| Beam **returns** to a responding pilaster (support logic) | **reusable rule** | any canopy or beam must visibly bear on something at both ends |
| Door surround (jambs on plinth blocks, a lintel, lined reveals) | **reusable** | principal doors: garden doors, the conservatory, the cottage. Secondary doors keep the simple casing. |
| Nosed tread over a darker riser | **reusable rule** | every exterior step set (terrace, cottage, sauna, BBQ platform) |
| Plinth stops at doors and steps; a projecting mass gets its own plinth and carries the string course | **reusable rule** | the service wing, the conservatory and the cottage plinths in D3-e / f |
| `STONE` value ladder (base → field → shadowed → dressed → lead) | **reusable** | the colour rule for every stone build; no new textures |
| Per-stone geometric irregularity (wobbly courses, offset blocks) | **not worth standardising** | invisible at phone distance; it costs triangles in a chunk drawn from everywhere |
| Micro-bevels on mouldings | **not worth it** | rejected by the D3 rules; no visible gain |

## 5. Performance
Doors closed, low quality, against `444de9b`. The budget files are in `d3arch/`:
- `budget-base-444de9b-{poses,exterior,rooms}.json`
- `budget-d3arch-{poses,exterior,rooms}.json`

| Set | Views | Δ draw calls | Δ triangles | After: maxima |
|---|---|---|---|---|
| D3-A2 poses (entrance) | 10 | **0** | **+1,064** in every view | 105 calls / 176,479 tris |
| Hero views (exterior + rooms) | 124 | **0** | 0 … +1,064 | 148 calls / 309,073 tris (see the note) |
| All room views | 84 | **0** | 0 … +1,064 | 147 calls / 244,034 tris (library-b) |

- The `manor` chunk gains **+1,064 triangles and no mesh**: no new batch, no new material, no texture. Because that chunk
  is drawn from every exterior view and through the windows, the delta shows in nearly all views, and it is the same
  1 k everywhere.
- **Note, already in the baseline and not caused by this pass:** two Wickerman views exceed 250 k in production:
  - x28-wickerman-from-bench: 308,009 → 309,073;
  - x29-wickerman-south-edge: 275,655 → 276,719.

  They are flagged for D4 (the Wickerman batch).
- Every other view stays inside the guide (≤ 150 calls, ≤ 250 k).

## 6. Regression (final build, one immutable bundle; hash recorded before and after the run: unchanged)
| Gate | Result |
|---|---|
| typecheck | clean |
| unit (vitest) | **254 / 254**, including the new `dev04d-entrance.test.ts` (5): no collider or floor added, the doorway prism clear, the beam datum on the abaci, nothing floating above the canopy, the triangle budget |
| e2e:dev04d | 18 / 18 |
| e2e:dev04a | 19 / 19 (support contract, wall-art contract, front-threshold surface ownership, garden / front door walk-through) |
| e2e:dev04b | 9 / 9 (construction audits, DEV-04A contracts) |
| e2e:dev04c | 22 / 22 |
| e2e:dev03 / dev02 / dev01 | 11 / 11, 34 / 34, 34 / 34 (dev01 / dev02 include the front-door key, open and walk-through flow) |
| full e2e | **103 / 103** |

One real finding, fixed before this run:
- **Problem:** the lead roll along the canopy front used `cyl()` lying on its side. `cyl()` offsets by half its length
  along its own axis, so the roll sat 2.3 m above the roof. The DEV-04A support contract flagged it.
- **Fix:** it is now built with `rod()`, which centres the part.
- **Guard:** a unit test (nothing above the canopy) now catches this, and all after-evidence was re-captured on the fixed
  build.

Contracts:
- 130 interactables, 21 checkpoints and save schema 4 are unchanged.
- Front door: its id, key, collider, swing and opening are unchanged.
- Walk heights and colliders are unchanged; the door walk-through is covered by dev01 / dev02 / dev04a.

## 7. Evidence paths
- `d3arch/before`, `before-neutral`, `before-clay`: production `444de9b`, served from an immutable copy of its build
  (bundle `index-UJHmtWnc.js` = the deployed one).
- `d3arch/after`, `after-neutral`, `after-clay`: this build.
- `d3arch/compare/<pose>.jpg`: before | after, standard. `<pose>-clay.jpg`: the same in clay.
- Poses: `SET=d3arch` in `scripts/dev04d-audit-views.mjs`. All taken at 915 × 412, low quality:
  - long approach, façade whole, medium approach, before the steps;
  - angled left, angled right;
  - portico close, door reveal, oblique far;
  - out through the door.
