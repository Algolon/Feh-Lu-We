# DEV-04D D2: FLW 3D pieces, key family, maquette re-skin

Branch `ccr-f4845963-3qt9ft`; base for the deltas: D1-R head `564163d`; production baseline `3e09c98`. Scope as
approved: D2-a (K3-001…004, S3-004, gingerbread maquette) and D2-b (the eight group-A S3 pieces). Nothing outside this
scope was touched:
- no group B / C, REFINE, AMBIGUOUS, RESERVED or PENDING source;
- FLW-RSV-019…022 untouched;
- no D3 / D4 work;
- the D1-R gallery placements unchanged.

## 1. What was built

| FLW id | What | Where (plan x, z) | Mount | Triangles |
|---|---|---|---|---|
| K3-001 → `frontKey` | brass trefoil-bow key, collar stack, E-bit, red leather tag with a blank brass plate on a copper ring | home dresser drawer (`pk.frontKey`) | lies on the drawer floor | 444 |
| K3-002 → `studyKey` | small brass ring-bow key, fine bit, **blank** ivory paper tag on a string loop | on the archive card in the library desk drawer (`pk.studyKey`) | lies on the card | 380 |
| K3-003 → `shedKey` | dark iron square-bow key with rust on the collars and bit, broad stepped bit, wooden house hanger with a window | hall drawer (`pk.shedKey`) | lies on the drawer floor | 312 |
| K3-004 → `consKey` | brass oval-bow key, green glass teardrop (tinted ceramic / Phong, **no emission**) on a copper ring | kitchen service hatch (`pk.consKey`) | lies on the hatch sill | 448 |
| S3-004 houten vogelbeeld | faceted carved songbird, oak, ≈ 22 cm | rear-nook side table (92.55, 108.84) | stands on the table top | 332 |
| S3-014 gesneden zwaluwen | three carved swallows, cool-stained backs, pale bellies, each on a hidden dowel | front gallery, long south wall between the windows (90.0, face 80.42) | wall, `relief@90.00,80.42` | 624 |
| S3-015 miniatuurzeilboot | model sloop: hull, deck, cabin, keel, rudder, mast, boom, bowsprit, sail, 4 rigging lines, brass posts on an oak base | Reiskamer writing desk (79.25, 80.92) | stands on the desk | 526 |
| S3-016 keramische maanvorm | matte ivory crescent on a peg in a plain oak block | Sterrenkamer, window-side bedside (72.66, 91.0) | stands on the bedside | 352 |
| S3-017 terracotta bloemmedaillon | Ø 35 cm clay disc, raised rim, bud on a stem with sepals and four leaves | botanic room, west wall on the table axis (face 101.38, 88.5) | wall, `relief@101.38,88.50` | 452 |
| S3-030 papier-maché wandmasker | cream shell mask with an olive cheek and temple, a coral brow flame, cheeks, nose and mouth; olive brows, eyes | Portugal cottage room, east wall between the windows (face 29.70, 160.95) | wall, `relief@29.70,160.95` | 329 |
| S3-031 keramisch tegelreliëf | 45 × 45 cm terracotta slab with a glazed face: blue border and corner marks, yellow and blue rings, lemon branch with leaves, two lemons, blossoms | Portugal terrace, house front over the corner plant (20.78, face 157.0) | wall, `relief@20.78,157.00` | 436 |
| S3-033 smeedijzeren BBQ-haardplaat | iron plate with a shouldered arch, edge bars, raised scrollwork and leaves, A-frame stays on foot runners | BBQ, back-left of the grill, turned to the approach (106.15, 118.5) | stands on the platform; collider | 532 |
| S3-037 houten reigerbeeld | carved heron on a stump (≈ 0.8 m), thick legs, a few broad wing facets, S-neck, long beak, crest | lake viewpoint, beside the bench's north end (78.75, 141.05) | stands on the gravel; collider | 348 |
| Gingerbread maquette | colours only: gingerbread walls and roofs, white icing on all eaves, the main ridge and the pediment, dark sugar windows, sugar-glass conservatory, one red sweet over the entrance, two green gumdrops on the board | hall (unchanged table, silhouette, size) | — | +72 |

Every row:
- uses the shared art materials (paint / timber / brass / ceramic): no new material, no texture;
- is batched into its room or zone chunk (keys: one compound per pickup, as before);
- passes the DEV-04B construction audit (lowest point on its support; parts connected).

Builders: `src/world/d2props.ts`. Data and specs: `src/content/props3d.ts`. FLW ids are reference ids only: no decor is
interactable, and the registry keys `relief@x,z` are not gameplay ids.

### Gameplay ids
All of these are unchanged:
- the four pickups `pk.frontKey`, `pk.shedKey`, `pk.studyKey`, `pk.consKey`;
- items, availability rules, hit boxes, labels, `after` hooks (archive card, cons note);
- `mem.hall.maquette`;
- 130 interactables / doors, 21 checkpoints, save keys, save schema 4.

The inventory icon for `consKey` now draws the oval bow. The other icons already matched: trefoil + red tag, ring +
white label, square + house.

## 2. Modelling interpretations and compromises
- **Keys.** One builder with per-key specs at ×1.3. Each sheet's front, ¾ and ortho views agree on the bow, collars
  and bit; where the orthos are a generic template, the art views win.
  - K3-003 is dark iron with rust (the spec), not the render's copper.
  - K3-002's tag is blank: the sheet's "Studerkamer" is never reproduced, and the item text keeps "studeerkamer".
  - Lettering on the tags is not modelled (sheet text is never rasterised); the front key's brass plate stays blank.
  - The keys lie flat. The tag, hanger or drop fans out to the side on its split ring.
- **Key seating fixes (found by the D2 seat check).** These were existing defects, needed for "keys seated, pickups
  reachable":
  - the hall-drawer key and the archive card lay 1 cm under the drawer bottom; the card was never visible;
  - the service hatch was one solid wood block with the conservatory key inside it. It is now a real recess (sill,
    head, cheeks, the existing dark back panel), with the key on the sill. The hatch door, lock, rule and hit box are
    unchanged.
- **S3-004.** Proportions follow the consistent multi-view sheet. The facets come from flat-shaded icosahedra.
- **S3-014.**
  - Follows the art's horizontal flight line, set as the owner's loose, asymmetric, shallow arc: uneven spacing, the
    middle bird highest, individual pitch, size and depth.
  - Scaled to ≈ 1.2 × 0.55 m, against the sheet's 90 × 50 cm. At sheet size the three birds read as dots on a 2.85 m
    gallery wall from the gallery.
  - The concealed rail is interpreted as individual dowels into the wall (the audit's part gap is widened for this set).
  - Backs use the matte paint material in a lifted cool-oak tone: the window wall stands in its own shadow (≈ 37 %
    light) and the darker tone read black.
- **S3-015.**
  - The hull is a tapered half-ellipsoid with a cream sheer band; the deck is a matching ellipse.
  - The rigging is reduced to forestay, two shrouds and a backstay.
  - It stands on the desk; the desk's book stack gave way to it. The open book stays, and the suitcase memory cluster
    is untouched.
- **S3-016.** The art's simple oak block, not the blockout's collar and stepped base. Matte paint material: the sheet
  says matte ceramic. It sits on the free bedside; the other bedside carries the lamp.
- **S3-017.** The bud and leaves are clay-toned, generic ornament rather than a coded plant. It hangs on the west wall,
  opposite the prints wall, away from the varen / blad evidence prints on x 107.5.
- **S3-030.** The shell is a front half-ellipsoid, with paint zones as slightly proud partial shells and faceted marks.
  The flame-shaped crown is simplified to an oval with a coral brow flame.
- **S3-031.**
  - The azulejo pattern is modelled as raised glazed geometry: no texture, no new material.
  - The wire hanger is hidden.
  - Exterior wall on the terrace, where a player arriving from the landing meets the house.
- **S3-033.** Straight behind the grill (the first placement), the kettle hid it from every approach. It now stands
  back-left of the grill, turned 20° to the way in. The feet stay on the platform; the gas bottle and grill front stay
  reachable (e2e).
- **S3-037.**
  - Leg and feather detail reduced as the package note asks.
  - About 0.8 m tall.
  - It stands beside the bench's north end, never in front of it: the view west to the water stays open, and the bench
    memory is still reached and targeted (e2e).
- **Maquette.** Colours and icing only; the geometry, the table and the inspect target are unchanged.

## 3. Performance (low quality, doors closed, matched poses; base = `564163d`)
Measured with `scripts/dev04d-audit-views.mjs` on both builds:
- data: `docs/dev04d/d2/budget/*.json`;
- the room views are the D0/D1-R inner-corner poses;
- the D2 views are the close / room / approach poses of every model.

| View | base calls / tris | D2 calls / tris | Δ |
|---|---|---|---|
| living-a (the tight one) | 131 / 209 774 | 130 / 211 812 | −1 / +2 038 |
| kitchen-b (the tight one) | 128 / 207 868 | 128 / 209 974 | 0 / +2 106 |
| hall-a | 114 / 180 432 | 114 / 182 538 | 0 / +2 106 |
| landing-b | 105 / 202 540 | 104 / 204 542 | −1 / +2 002 |
| library-b | 83 / 240 720 | 85 / 242 730 | +2 / +2 010 |
| rearNook-b | 113 / 206 068 | 112 / 208 106 | −1 / +2 038 |
| reis-a | 34 / 80 122 | 34 / 81 764 | 0 / +1 642 |
| botanic-a | 55 / 135 046 | 55 / 137 140 | 0 / +2 094 |
| cottageRoom-a | 69 / 165 172 | 70 / 167 201 | +1 / +2 029 |
| x07 BBQ | 112 / 204 570 | 112 / 205 450 | 0 / +880 |
| x11 lake viewpoint | 37 / 127 262 | 38 / 130 506 | +1 / +3 244 |
| x15 Portugal terrace | 29 / 116 457 | 29 / 116 893 | 0 / +436 |

The full tables are in the JSON files: 37 room / exterior views and 32 D2 views.

**Overall:**
- every view gains 0 to +2 calls (max +2: library, where the study key's brass and the card's paint are now two
  meshes);
- +0.4 k to +3.2 k triangles;
- every view stays inside the mobile guide (≤ 150 calls, ≤ 250 k triangles), and inside the per-room batch limit
  (+2 calls, +12 k).

**Attribution** (per-mesh diff, living-a and reis-a):
- the +1.6 k seen from most interior views is the upstairs chunk `mUp`. It now carries the bird, swallows, sloop and
  moon (+1 498 Lambert, +144 Phong);
- it is drawn whenever any part of the chunk is in view, including from the living room through the stairwell. This is
  the per-chunk batching contract (one mesh per material per chunk), so it costs no extra draw call.

**What did not change:**
- no new material, no texture: the GPU texture memory delta is 0;
- the keys stay individual compounds, as before.

**Draw-call deltas by cause:**

| Cause | Δ calls |
|---|---|
| shed key (paint + wood → paint) | −1 |
| front key (paint → brass + paint; home world, not in the estate tables) | +1 (by construction) |
| study card (paint → paint + brass) | +1 |
| conservatory key (paint + glow → brass + ceramic) | 0 |
| tile (new ceramic mesh in the cottage exterior chunk) | +1 |
| heron (timber in the lake viewpoint's view) | +1 |

## 4. Validation
See section 6. The new checks are:
- `tests/dev04d-props.test.ts` (12 tests):
  - ship rule against `MANIFEST.json`;
  - exact D2 scope; no B / C / RSV references;
  - triangle budgets;
  - K3 mapping to APPROVED_KEY_REF; item ids;
  - ×1.3 lengths and bow widths;
  - four distinct bows; oval cons key; iron shed key;
  - oval cons-key icon; no "Studerkamer";
  - heron beside, not in front of, the bench; medallion off the prints wall.
- `scripts/e2e-dev04d.mjs` §8 / §9 (7 new checks):
  - keys: ids, offered only when open, targeted from the main e2e's stand poses, seated ±4 mm; the front key in the
    home world;
  - S3: built, audited, within budget, resting on the support / flush on the wall (≤ 6 mm);
  - the key family within 200–450 triangles;
  - wall pieces registered with the wall-art contract and clear of the evidence panels;
  - the lake bench memory and the BBQ reachable on foot.

## 5. Evidence
- `docs/dev04d/d2/evidence/`: every S3 model three ways (`d2-<id>-close`, `-room`, `-approach`, at eye height on the
  approach), the three estate keys in their opened containers, and the maquette close and in the hall.
- `docs/dev04d/d2/keys/`:
  - each of the four keys close up and from the main e2e's standing pose (front key in the home world);
  - `inventory-icons.png`: the bag icons at 128 px and 40 px.
- `docs/dev04d/d2/budget/`: base and D2 measurements.
- Reference sheets: `docs/reference/flw/3d/FLW-S3-*.png`, `docs/reference/flw/keys/FLW-K3-*.png` (unchanged).

## 6. Test results
All runs are on the D2 build, SwiftShader:

| Gate | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm test` (vitest) | 239 / 239 (18 files; +12 in `dev04d-props.test.ts`) |
| `npm run e2e:dev04d` | 17 / 17 (10 D1 + 7 D2) |
| `npm run e2e:dev04a` | 19 / 19 |
| `npm run e2e:dev04b` | 9 / 9 (construction audits clean, including every D2 piece) |
| `npm run e2e:dev04c` | 22 / 22 |
| `npm run e2e:dev03` | 11 / 11 |
| `npm run e2e:dev02` | 34 / 34 |
| `npm run e2e:dev01` | 34 / 34 |
| `npm run e2e` (full game) | 103 / 103 (all four keys taken through their real pickups) |

The full regression gate was run because the keys touch pickup and inventory infrastructure. The owner-accepted touch
exception did not show up in this run.

## 7. Deferred / open
- Pre-existing, outside D2: the hall drawer's ledger also lies 1 cm into the drawer bottom (evidence object: left as is).
  The console shows `toNonIndexed` warnings from `fire.ts` (pre-D2).
- D3 / D4 not started. Nothing merged or deployed.

## 8. Addendum: asymmetrical salon gallery wall (owner reference; duplicates allowed, 11 Oct 2026)
- **Reference.** The owner's photo and composition contract:
  `docs/reference/dev04/06_art_decor/frames_wall_display/GALLERY_WALL_REFERENCE.md`. Composition reference only; no
  new artwork, and no hung piece moved or replaced.
- **Layout.** `SALON_LAYOUT` in `src/content/gallery.ts` is reusable data: outer-box corner, canvas width, rail, mat
  and finish per frame. `salonWall(c, layout, x, y, z, yaw)` hangs it on any wall face.
  - 15 frames from 13 canonical FLW-D2 sources; 010 and 044 appear twice, at small sizes and far apart. Each frame keeps
    its source aspect ratio and FLW id.
  - Anchors: centre, D2-029 *Maanlicht op water*, 0.75 × 0.75 m outer, black frame with mat; right, D2-007 *De stille
    eik*, portrait, black frame with mat.
  - Mixed portrait, landscape and square formats; black, light-wood and off-white frames.
  - Nearest-neighbour gaps 6–10 cm (mean within 4–8 cm, tested). Compact core, airier edges, irregular top and bottom
    contour.
- **Site.** The study's long east wall over the reading corner (face x 101.20, centre z 92.4, centre height floor +
  1.72 m), the same armchair-under-gallery arrangement as the photo.
  - Footprint about 2.9 × 1.65 m, at floor + 0.98 m to + 2.64 m (ceiling 2.85 m).
  - Clear of every evidence panel and opening (wall-art contract), and about 1.9 m from the study's framed map on the
    same wall.
- **Construction.** Atlas canvas (the shared FLW material), an off-white mat or dark backing board, four slim
  square-section rails (paint for black and off-white, timber for light wood): about 62 triangles a frame. Each frame
  registers `painting@x,z` with the wall-art contract.
- **Performance** vs D2 before the wall (`budget/d2-salon-rooms.json`):
  - only the study and botanic room views change: +0 to +1 calls, about +930 triangles;
  - no other room changes, living and kitchen included;
  - no new material or texture.
- **Tests:**
  - `tests/dev04d-gallery.test.ts` (5): 14–16 shippable pieces at source aspect; no overlaps; gap rules; two anchors
    (centre + right), clearly the largest; format and finish mix; irregular contour; fits under the ceiling and above
    the chair;
  - `e2e:dev04d` gains a check: all 15 frames registered without conflicts, each canvas unobstructed and seated
    1.5–5 cm off the wall;
  - results after the addendum: typecheck clean; unit 244 / 244; e2e:dev04d 18 / 18; dev04a 19 / 19; dev04b 9 / 9;
    dev04c 22 / 22;
  - the gallery touches no key, pickup or inventory code, so the dev01–03 / full e2e gate above still stands.
- **Evidence:** `docs/dev04d/d2/evidence/d2-salon-wall-close.jpg`, `-room.jpg`, `-approach.jpg`.
