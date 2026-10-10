# DEV-04C — Atmosphere, authored surfaces & interactive setpieces

Core rule of the pass: **one central layer per concern, opt-in per material or system, paid for once** — an
authored-surface layer for every material family, one light/atmosphere hierarchy driven by the existing `dusk`,
`indoor` and `woodWeight` values, flames that belong to what they burn on, and one optional interactive setpiece. No
estate, layout, puzzle, notebook or finale change; no RESERVED content; no fabricated art.

Plan and audit (written before any code change): [`DEV04C_PLAN.md`](DEV04C_PLAN.md) · art / reference ids:
[`DEV04C_REFERENCE_MANIFEST.md`](DEV04C_REFERENCE_MANIFEST.md).

## 0. Start point, commits, tested commit

__GATE_TABLE__

## 1. Observed baseline (production `4f2b2ed`, before any change)

Captured with `scripts/dev04c-views.mjs` on a clean build of `4f2b2ed` ([`before/`](before/), 25 views + `views.json`,
`budget.json`). What the captures and the code showed (details in the plan, §5–§8):

- **Flat value fields.** Plaster walls, floors, lawn and canopy each read as one value; texture variation repeats every
  metre or two and the batcher's ±4 % jitter is per piece (`before/c02-hall`, `c03-living`, `c05-sterren-bedroom`,
  `c10-lake-approach`).
- **No aerial perspective.** Haze 30 → 125 m; mid-distance woodland kept full saturation and value, the sky stayed a
  saturated blue down to a warm cream horizon (`c12-woodland-route`, `c13`).
- **No warm / cool hierarchy.** Warm cream haze everywhere; interiors were lit by the full, un-shadowed sun on the low
  (phone) quality, so rooms looked like the outdoors with a ceiling.
- **The lake** was one flat teal disc with a hard cut at the shore (`c10`, `c11`).
- **Fire continuity defect.** Every flame was culled on its own size-based distance while its fixture or room batch
  used another, so flames vanished 10–25 m before their host (hall chandelier 46 m vs frame 57 m, campfire 40 m vs
  clearing 55 m, living hearth 32 m vs a room batch with no limit, …).
- **Wickerman**: no interaction, no state, no flame, no light (`w01`).
- **BOSLUST** (`c14`, `c15`) and the **Portugal** exterior (`c08`) are the calibration targets: protected.

## 2. Implementation

### 2.1 ART-01.1 authored surfaces (C2) — `src/world/surfaces.ts`

A world-space, low-frequency value / hue layer per material family, added to three.js's shared shader chunks once and
compiled only into materials that opt in (`surface(mat, profile)` sets one define → one program variant per profile).
Static, so it never fights realtime light; no texture, no geometry, **no draw call**.

| Profile | Broad value zone | Mid breakup | Warm / cool drift | Saturation | Applied to |
|---|---|---|---|---|---|
| timber | ±10 % @ 3.2 m | ±5 % @ 0.55 m | 5 % | 1.0 | `wood`, `bark`, art-kit timber |
| plaster | ±12 % @ 2.6 m | ±4.5 % @ 0.9 m | 5 % | 1.0 | `plaster` (manor skins, cottage) |
| stone | ±10 % @ 1.9 m | ±7 % @ 0.42 m | 3.5 % | 0.97 | `stone`, `tile`, `slate`, `terracotta`, art-kit ashlar, rocks |
| fabric | ±7 % @ 1.1 m | ±3.5 % @ 0.3 m | 3 % | 1.0 | upholstery, rugs |
| paint | ±4 % @ 2.4 m | — | 2 % | 1.0 | painted parts, the prop atlas (books, prints, hay) |
| ground | ±20 % @ 11 m | ±9 % @ 2.8 m | 11 % | 0.72 | terrain, paths, gravel, the land beyond the fence |
| foliage / tree | ±15 / 13 % @ 8 / 7 m | — | 9 / 8 % | 0.84 / 0.86 | crowns, plants, the tree atlas |
| metal | ±3 % @ 1.2 m | — | — | 1.0 | brass, ceramic |

Principles from the brief made concrete: geometry still defines silhouette (nothing remodelled); materials get broad
value zones; breakup is designed (bounded amplitudes, unit-tested), not noise; warm / cool drift is per region, not per
pixel. A "storey grounding" band was tried and **removed**: its 3.2 m period showed as a hard line on walls whose floors
are not at the manor's levels (cottage, BOSLUST, facades). Unlit materials (flames, glow, signs) are never altered.

### 2.2 Light and atmosphere hierarchy (C3) — `src/world/env.ts`, `src/core/game.ts`

| | Before | After |
|---|---|---|
| Sun / sky fill outdoors | 2.4 warm-white / 1.6 pale blue | 2.55 warm / 1.5 cooler blue: shadow-facing planes go cool, sunlit ones warm |
| Sky | saturated zenith, warm cream horizon | muted zenith; **horizon = the haze colour**, so distance dissolves into the sky |
| Haze, open ground | 30 → 125 m | 16 → 165 m (aerial perspective from the middle distance) |
| Haze, woodland (`woodWeight`) | 22 → 110 m, light green-grey | 7 → 102 m, cooler sage; sun −14 % under the canopy |
| Interiors (`indoor`) | sun −5 %, fill −28 %, fixtures ×1.35 | sun −50 %, fill −38 % (warmer window sky + warm floor bounce), fixtures ×1.7; haze pushed to 40 → 220 m |
| Dusk (`dusk`, puzzle progress) | unchanged role | same blend, horizon follows the haze |

Navigation stays readable by construction rather than by darkness: the changes are in hue, haze and the balance between sun, fill and fixtures (interiors lose un-shadowed sun but gain fixture light); puzzle surfaces keep their own lights, and the full / DEV-01–03 suites' interaction and reticle checks pass unchanged.

### 2.3 Water (C2) — `src/world/grounds.ts`

The lake is one mesh / one material as before: a radial depth gradient (dark, nearly opaque centre → lighter, more
transparent shallows over the sloping bed, so the shore reads as a band, not a cut), a sky-haze sheen at grazing angles
(the fog colour by reference, so it follows dusk and woodland haze), and sparse thin ripple crests on the shared flame
clock (frozen in reduced motion). No reflections, no extra pass.

### 2.4 Fire / light continuity (C3) — `src/world/fire.ts`

`makeFire({ owner })`: a flame is drawn **exactly when its host is**. `owner.parent` hangs it in its fixture;
`owner.region` (via `regionOwned()`) gives it to the host's room-region batch through a never-self-culled holder, so its
own `.visible` stays free for game state. Applied to: living + BOSLUST hearths, dining + BOSLUST table candles, the
campfire and its laid logs (`fireCamp`), and **all four chandeliers** (frame + flames now owned by `mHall`, `mWing`,
`mLib`, `ug`) — which also gives them the DEV-03 rule that an interior is drawn from outside only near an open doorway
(the chandelier frames used to be drawn from the sauna deck and the golf spur, 50 m away). Nothing is globally
force-rendered.

### 2.5 Wickerman setpiece (C6) — `src/world/wickerFire.ts`

| State | What you see | How |
|---|---|---|
| unlit (`w01`) | the DEV-04B figure, nine glass jars, dark wicks | figure + hay now their own meshes (materials carry the char uniforms) |
| candles lit (`w02`, `w04`) | flames appear candle by candle round the ring, starting at the one nearest you; jars glow; warm floor glows; a soft pooled light | `wicker.candles` (9 hit boxes, one id); one `candles` fire with a reveal uniform (2 meshes for 9 flames), one jar mesh |
| ignitable | the figure accepts the matches only now; before, it refuses ("eerst de kaarsen") and nothing changes | `wicker.figure` |
| burning (`w03`, `w05`, `w06`, `w08`) | fire catches at the feet, climbs to the torso and arms; an ember band rises with the char front; the hay burns away below it; embers, a low-poly smoke column, a strong flickering light | `custom` fire kind (lower / upper body), char front + ember band in the willow / hay shaders, `makeEmbers`, `makeSmoke` (1 mesh each) |
| aftermath (`w07`) | blackened willow cage standing on the plinth, glowing embers in the char, a smouldering fire at the feet, faint glow | static; reached after ~80 s, or on load |

- **Optional**: no puzzle, clue, thread, objective or item reads or changes these states (unit-tested).
- **Input**: the established fire grammar — matches in hand, reticle on a candle / the figure, action button
  ("Kaarsen aansteken", "Stroman aansteken"); without matches the default action explains; the lit ring can be
  blown out again; a burned figure stays burned.
- **No collapse, no physics.**

## 3. Save implications

`state.lit['wicker.candles']`, `state.lit['wicker.figure']`. `state.lit` is an open boolean record that every save
version already parses (`boolRec`), so: **no schema change, save version stays 4, no new top-level key, no migration.**
Older saves load with the clearing unlit; v3 → v4 migration still filters `lit` to its known keys. The burn timeline is
session-only: a figure saved while burning loads as the settled aftermath (documented, tested).

## 4. Interaction / id changes

Two **new** interactables — `wicker.candles`, `wicker.figure` — and nothing else. All 128 baseline ids, the 21
checkpoints and every save key are unchanged. `e2e:dev04a` / `e2e:dev04b` asserted "none added"; they now assert
"every baseline id present, and the only additions are those in `scripts/dev04c-additions.json`" — any other addition
or removal still fails. **Owner decision requested** (§11).

## 5. Reference assets: used and deferred

No `FLW-D2/S3/K3/RSV` asset exists in the repository or the session (searched; manifest §1). Therefore:

- **C4 wall art: not integrated.** No procedural imitation was made; the DEV-04B-R hall painting stays. The placement
  contract for later rasters is in the manifest (§4).
- **C5 keys: not remodelled.** The four gameplay keys and their ids are unchanged; dependency on `FLW-K3` recorded.
- **3D references (`FLW-S3`)**: nothing modelled (DEFER_TO_D).
- **RSV-019 … 022**: PENDING, not inferred, not implemented; `e2e:dev04c` checks no RESERVED content appears.
- Used as reference: `wickerman_clearing_sheet_v01` (state flow, char / ember palette), `copacabana_room_sheet_v01`,
  `living_dining_furniture_sheet_v01` (warm-room value hierarchy), the timber / external style URL notes (principles).

__EVIDENCE__

__PERF__

__TESTS__

## 10. Regression fixes found on the way

| Found by | Problem | Fix |
|---|---|---|
| fire probe (baseline) | flames culled 10–25 m before their fixture / room batch | flame ownership (§2.4) |
| `e2e:dev04c` budget | chandelier flames, once tied to their frame, were drawn wherever the frame was — including from outdoors 50 m away (+2–3 calls at the sauna / golf spur) | chandeliers owned by their room batch (outdoor rule applies): those views went **below** baseline |
| `dev04c-budget` | +1 call in almost every view: the clearing's floor glows joined the shared light-patch mesh, whose bounds then spanned the estate | the clearing glows are their own region-owned mesh |
| capture review | the surface layer's storey band drew a hard line on the cottage wall | band removed |
| capture review | first lake sheen read as ice; glints as floes | darker, cooler sheen; thin ripple crests |
| frametime probe | surface shader +10–20 % render time (SwiftShader) | one vec2 noise instead of two scalars, no mid lookup on canopy: now ±0 % (woodland) to +15 % (lawn) |

__ISSUES__
