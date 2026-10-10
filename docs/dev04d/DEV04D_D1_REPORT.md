# DEV-04D D1 — Wall identity: FLW-D2 art, frame family, framed mirrors (report)

Status: **D1-a + D1-b implemented on `ccr-f4845963-3qt9ft`, for owner review. Not merged, not deployed. D2–D4 not
started.**

| | |
|---|---|
| Base | production `ccr-75ef4113-kfkimm` @ `3e09c98` (PR #7 lean FLW library merged); the D branch is rebased onto it |
| Library check after the merge | all 67 canonical files in `docs/reference/flw/` match the D0 manifest's paths and sha256 byte for byte; all 126 records present, no status change (canonical ≠ approved kept) |
| Commits | `2dec5d9` implementation · `bdf2968` exposure / frames / mirror polish · evidence + this report (see `git log`) |
| Owner decisions applied | R-A approved (group A), R-B deferred, R-C parked; hall hero kept; F1 framed tinted mirrors |

## 1. What was implemented

**13 paintings on their D0 room bindings** (D0 manifest §10). Six reuse an existing slot and its wall-art id; seven are
new. Every canvas keeps its source aspect (±1 %), and nothing is cropped.

| FLW id | Basis | Room / wall | Canvas (m) | Frame | Slot id |
|---|---|---|---|---|---|
| D2-002 *Het laatste zonlicht* | APPROVED_2D | hall, west wall, gallery height | 1.35 × 0.81 | antique (S3-044) | `painting@85.12,86.20` (was atlas #1) |
| D2-007 *De stille eik* | APPROVED_2D | hall, west wall, ground | 0.66 × 0.88 | simple (S3-043) | `painting@85.12,92.50` (was atlas #0) |
| D2-026 *De kust na de regen* | APPROVED_2D | living, south wall between the windows | 1.40 × 0.79 | antique | `painting@77.25,80.45` (was atlas #3) |
| D2-028 *Het huis in de nacht* | APPROVED_2D | upstairs landing | 1.30 × 0.78 | antique | `painting@90.00,103.92` (was atlas #2) |
| D2-046 *Een middag in Portugal* | APPROVED_2D | Portugal cottage room, wall beside the arch | 0.90 × 0.51 | simple, painted blue-grey | new `painting@27.90,160.12` |
| D2-010 *Na het feest* | group A | dining / game room, north wall (enlarged from 0.8 × 0.6) | 1.40 × 1.05 | antique | `painting@104.80,91.92` (was atlas #7) |
| D2-005 *Kleikom, appels…* | group A | kitchen, east wall past the shelves (service-chart wall untouched) | 0.80 × 1.00 | simple, oak | new `painting@107.56,99.90` |
| D2-022 *De onbekende reiziger* | group A | Reiskamer, south wall (opposite the travel sketch) | 0.75 × 1.00 | simple | new `painting@80.80,80.44` |
| D2-029 *Maanlicht op water* | group A | Sterrenkamer, south wall (away from the star map) | 0.80 × 0.80 | print (S3-045) | new `painting@82.00,86.90` |
| D2-035 *Zomerregen op een landweg* | group A | north guest room, above the bed (replaces the duplicate of the living painting) | 1.00 × 0.75 | simple, oak | `painting@107.58,102.60` (was atlas #3 duplicate) |
| D2-042 *Onder hetzelfde bladerdak* | group A | BOSLUST gathering hall, north wall west of the door (letter stays on the table) | 1.40 × 0.79 | simple | new `painting@58.60,56.83` |
| D2-044 *Houtdruk…* | group A | workshop, east wall beside the tool wall | 0.80 × 0.60 | print, light oak | new `painting@115.56,99.70` |
| D2-045 *De weg naar de kust* | group A | Portugal cottage entry, west wall | 0.80 × 0.60 | simple, painted blue-grey | new `painting@20.32,158.60` |

**Image atlas pipeline.**
- `scripts/build-flw-atlas.mjs` reads each canonical original and verifies its sha256 against `MANIFEST.json`.
- It resizes only: Chromium high-quality resampling, aspect kept, ≈ 400 px per metre of canvas, long side 320–512 px.
- It packs the cells into one 2048 × 1024 atlas, with a 4 px edge-extruded gutter against mip bleed.
- It writes `src/assets/art/flw-d2-atlas.webp` (608 KiB, quality 0.9) and `src/world/artAtlas.json` (UV rects, sizes and provenance per id).
- The originals in `docs/reference/flw/` are not touched. There is no crop, colour edit or sharpening.

**Runtime.**
- `src/content/art.ts` is the art table: FLW id, ship basis, room, canvas size and frame. It also holds the owner group-A list. Art ids stay separate from gameplay ids.
- `flwPainting()` (in `furniture.ts`) uses **one shared material**. Each room chunk merges all of its paintings into one mesh, as every shared material in the game does.
- The texture starts as a neutral 4 px placeholder and switches to the image on load, so there is no black flash.
- **Exposure compensation:** under ACES tone mapping, the full-range paintings read about a stop darker than their pale plaster walls. A linear albedo gain of 1.35 on the material restores their own exposure.
  - There is no emission: a painting stays lit by its room and goes dark when the room is dark.
  - Pixels are untouched.

**Frame family** (owner-approved S3-043 / 044 / 045 direction):
- **antique** (S3-044, hero pieces): a deep walnut rail, a gilt bead on the sight edge and a linen slip.
- **simple** (S3-043): a flat moulded rail with a raised outer lip; oak, walnut or painted blue-grey (cottage).
- **print** (S3-045): a slim square rail for prints and the pastel square.

**Framed mirrors (F1).**
- `wallMirror()` replaces the two glowing emissive panels: in the bathroom (`manor.ts`, was a `k.M.glow` box) and in the guest WC.
- Each mirror is blue-grey tinted glass in a slim timber frame, with a deeper lower edge and one faint sheen band.
- It is non-emissive and non-reflective. Both are now seated on the wall face; the old panels stood 6 cm off it.

**Not touched:**
- the DEV-04B-R stair landscape (the hall hero);
- the walkway atlas painting (`painting@85.12,93.00`), which waits for a group-B choice;
- the two home-scene paintings;
- every evidence or identity panel.

D1 adds no interactable and makes no puzzle, story, save or id change.

## 2. Evidence

| What | Where |
|---|---|
| Matched before / after (30 poses: each painting and mirror from ≈ 3 m and ≈ 1.5 m; before = production `3e09c98`, after = D1; low quality, doors open) | `docs/dev04d/d1/before/`, `docs/dev04d/d1/after/` (+ `views.json` each) |
| Side-by-side sheets | `docs/dev04d/d1/compare/*.jpg` |
| Room budgets, doors closed (28 views: two corners of each D1 room; base build vs D1) | `docs/dev04d/d1/budget-base/views.json`, `docs/dev04d/d1/budget-d1/views.json` |
| Atlas + layout + provenance | `src/assets/art/flw-d2-atlas.webp`, `src/world/artAtlas.json` |
| Harness | `scripts/dev04d-audit-views.mjs` (`SET=d1`), `scripts/dev04d-wallprobe.mjs` (free-wall / wall-face probe used to place the new slots) |

## 3. Performance

| Measure | Result |
|---|---|
| Texture memory | +**10.7 MiB** GPU (2048 × 1024 RGBA + mips), under the 12 MiB D0 cap. The old procedural painting atlas (512 × 192) stays: the walkway and the home scene still use it |
| Download | +**631 KB** (608 KiB atlas webp + 8 KB JS) |
| Materials | +1 (the shared atlas material); frames and mirrors reuse the existing art materials |
| Static geometry (whole estate, per chunk, base vs D1) | ≈ **+9.2 k triangles in total**; largest per chunk +2.2 k (upstairs `mUp`), hall +0.9 k, living +0.4 k; canvas quads 2–6 triangles per chunk; mirrors −12 (glow boxes gone) |
| Room budgets (low, doors closed; 28 views) | **all inside the mobile guide** (≤ 150 calls, ≤ 250 k); per view **+0…+2 draw calls** and +0.9 k…+5.3 k rendered triangles (rendered counts include the shadow pass). Tightest: living-a 132 / 210 k, kitchen-b 129 / 208 k (D0 baseline 131 / 205 k, 128 / 203 k) |
| D1 views in e2e (low, doors closed) | all 13 inside the guide (largest: cottage room 94 / 179 k; hall 74 / 187 k) |
| Doors-open evidence views | +0…+5 calls; rendered-triangle deltas there swing ± 25 k between runs (workshop close −11.9 k), i.e. sampling variance of culling / LOD state, not D1 geometry (see the static diff) |

## 4. Tests

See §6 for the full run log. Unit:
- 227 / 227 pass, including 9 new in `tests/dev04d-art.test.ts`;
- the ship rule is enforced: an id must be APPROVED_2D, or REVIEW_READY and in group A; groups B and C are excluded;
- the provenance sha256 of every original matches;
- aspect ratios are preserved; atlas cells sit inside the atlas with gutters; texel density is checked; the frame families are checked.

Browser `e2e:dev04d` (new) checks:
- the atlas loads, with one material and sRGB colour;
- all 13 paintings and both mirrors are in their slots;
- the wall-art contract and the construction audits are clean;
- the 11 evidence and identity panels are present, and no D1 piece is within 0.3 m of one on the same wall;
- every canvas is unobstructed, seated 4–9 cm proud of its wall, and framed;
- the mirrors are Lambert, non-emissive and on the wall;
- 130 interactable / door ids, 21 checkpoints, save keys and save version 4 are unchanged;
- the budgets hold;
- the batching contract holds: one atlas mesh per chunk;
- there are no page errors.

## 5. Owner notes, deferred and blocked

- **Low-key pieces in dim rooms**:
  - D2-028 (landing), D2-022 (Reiskamer) and D2-029 (Sterrenkamer) are dark images.
  - With the exposure gain they read correctly where the room is lit, and as dark canvases where the room is dim. That is honest, and there is no glow.
  - If the owner wants them to carry more at night, a small picture light per hero is a D3 decision. It would add one light each.
- **D2-002 at gallery height** is mostly seen through the balustrade from the hall floor. That is the original slot. It reads fully from the front gallery.
- **Walkway**: the atlas placeholder stays until a group-B piece (D2-038 or D2-021) is chosen.
- **Group B** deferred and **group C** parked, as decided. All REFINE / REGENERATE / AMBIGUOUS / TEXT_ONLY / RESERVED / PENDING items are untouched. RSV-019…022 stay PENDING.
- **Not started**: D2 (keys, S3 pieces, maquette), D3, D4.

## 6. Run log

(filled in from the gate run: see below)
