# DEV-04C — Atmosphere, authored surfaces & interactive setpieces

Core rule of the pass: **one central layer per concern, opt-in per material or system, paid for once** — an
authored-surface layer for every material family, one light/atmosphere hierarchy driven by the existing `dusk`,
`indoor` and `woodWeight` values, flames that belong to what they burn on, and one optional interactive setpiece. No
estate, layout, puzzle, notebook or finale change; no RESERVED content; no fabricated art.

Plan and audit (written before any code change): [`DEV04C_PLAN.md`](DEV04C_PLAN.md) · art / reference ids:
[`DEV04C_REFERENCE_MANIFEST.md`](DEV04C_REFERENCE_MANIFEST.md).

## 0. Start point, commits, tested commit

| | |
|---|---|
| Production start | `ccr-75ef4113-kfkimm` @ `4f2b2ed4b5e91bfcaecd63b0e85859849ef13078` — verified unchanged before the first edit (no delta to audit) |
| Work branch | `ccr-b04299a9-fwl08f`; draft PR against `ccr-75ef4113-kfkimm` |
| Not done | no merge, no deploy |

| Commit | Scope |
|---|---|
| `c0d4565` | audit, plan, reference manifest, evidence + budget harness, **before** captures on `4f2b2ed` |
| `37e54a2` | authored surfaces, atmosphere hierarchy, lake, fire continuity (incl. chandeliers), Wickerman setpiece, unit tests, `e2e:dev04c`, documented-id check in `e2e:dev04a/b` |
| `7bbe2a4` | surfaces cost halved, storey band removed, clearing glow in its own mesh, lake ring trimmed, frametime probe, dusk evidence views (removes a temporary probe committed by mistake in `37e54a2`) |
| `0681519` | report draft (docs only) — **the exact tested commit** |
| (final) | this report + after / compare evidence (docs only) |

**Exact tested commit: `0681519015cf1b49bb1b1cfdb1c351af890fe9b7`.** The complete gate (§8) ran on it in one pass with
a clean working tree before and after (`git status --porcelain` empty, HEAD unchanged), `dist/` deleted and rebuilt from
it, served by `vite preview` (SwiftShader Chromium). No earlier result was reused. The after captures and budgets (§6, §7)
were taken on that same build. The only commit after it changes `docs/dev04c/**` (this report, `after/`, `compare/`) and
nothing else: no code, tests, assets, materials or generated content.

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

## 6. Visual evidence

Same poses before (`4f2b2ed`) and after (`0681519`), eye height, low quality (the phone default), 1280 × 720, standard
evidence door state; per-view render cost in `before/views.json` / `after/views.json`. Side-by-side sheets (before on top)
in [`compare/`](compare/):

| Brief item | Sheets |
|---|---|
| manor exterior / arrival | `c01-arrival-manor`, `f01-hall-from-forecourt` |
| hall | `c02-hall` |
| living room | `c03-living`, `c04-living-hearth`, `f04-living-from-hall` |
| quiet interior (bedroom) | `c05-sterren-bedroom` |
| Copacabana Room | `c06-copa-room`, `c07-copa-bar` |
| Portugal exterior / interior | `c08-portugal-exterior`, `c09-portugal-interior` |
| lake / shore | `c10-lake-approach`, `c11-lake-shore` |
| normal woodland routes | `c12-woodland-route`, `c13-woodland-shed-path` |
| BOSLUST calibration | `c14-boslust-calibration`, `c15-boslust-door` |
| Wickerman unlit / lit / burning | `w01`–`w06`, and the 4-up **[`wickerman-states`](compare/wickerman-states.jpg)** (unlit → candles lit → burning → aftermath) |
| dusk (atmosphere at the other end of the `dusk` range) | **[`woodland-dusk`](compare/woodland-dusk.jpg)** (before / after afternoon, after at dusk 0.9, the burning figure at dusk); single frames `after/c16-*`, `after/w07-*`, `after/w08-*` |
| fire continuity | `f02-dining-candles`, `f03-campfire` (the continuity itself is a behaviour check, §8) |

Reading the sheets: the woodland views gain the most (canopy reads as shade, mid-distance trees step back into a cool
haze, the far path dissolves); the lake reads as water; interiors are warmer and lit more by their fixtures, with broad
value drift on plaster and floors that stays below "dirty"; BOSLUST and the Portugal exterior keep their composition,
values and identity (slightly cooler canopy / greyer rock — consistency, not a redesign). In the interiors the surface
layer is deliberately quiet; the owner may want it stronger (§11).

The `before/` frames of the Wickerman lit / burning poses show the unlit clearing: those states did not exist.

## 7. Performance delta (low quality — mobile guide ≈ 150 calls / 250 k triangles)

`renderer.info` after one low-quality frame, 1280 × 720, both builds measured by `scripts/dev04c-budget.mjs` in the same
door state per set ([`before/budget.json`](before/budget.json), [`after/budget.json`](after/budget.json)); `e2e:dev04c`
check 10 re-measures 28 of them on every run (the after run is in `after/e2e-dev04c-budget.json`). ⚠ = over the guide.

**DEV-04A budget views (front + Copacabana + attic stair doors open)**

| View | Before `4f2b2ed` | After `0681519` | Δ calls | Δ triangles |
|---|---|---|---|---|
| atticNook | 41 / 99,132 | 41 / 99,132 | +0 | +0.0 % |
| atticCommon | 39 / 101,408 | 39 / 101,408 | +0 | +0.0 % |
| conservatoryInside | 74 / 128,214 | 74 / 128,214 | +0 | +0.0 % |
| conservatoryDoorDeck | 143 / 205,534 | 140 / 204,258 | -3 | -0.6 % |
| wellnessDeck | 65 / 155,549 | 65 / 155,549 | +0 | +0.0 % |
| saunaAccess | 148 / 225,826 | 145 / 224,134 | -3 | -0.7 % |
| wickermanClearing | 31 / 160,593 | 31 / 160,593 | +0 | +0.0 % |
| wickermanPath | 35 / 211,057 | 35 / 211,057 | +0 | +0.0 % |
| frontForecourt | 139 / 206,032 | 135 / 203,720 | -4 | -1.1 % |
| arrivalCourt | 133 / 202,574 | 129 / 200,262 | -4 | -1.1 % |
| portugalTerrace | 31 / 91,423 | 31 / 91,839 | +0 | +0.5 % |
| portugalApproach | 33 / 119,039 | 33 / 119,455 | +0 | +0.3 % |
| golfVicinity | 55 / 198,013 | 55 / 198,013 | +0 | +0.0 % |
| golfSpur ⚠ | 93 / 262,690 | 90 / 260,998 | -3 | -0.6 % |

**DEV-04B render poses + DEV-04C calibration views (front door open)**

| View | Before `4f2b2ed` | After `0681519` | Δ calls | Δ triangles |
|---|---|---|---|---|
| gate (driveway) | 99 / 235,173 | 99 / 235,589 | +0 | +0.2 % |
| forecourt → manor | 130 / 204,977 | 126 / 202,665 | -4 | -1.1 % |
| entrance hall | 105 / 193,300 | 105 / 193,300 | +0 | +0.0 % |
| library | 54 / 185,684 | 54 / 185,684 | +0 | +0.0 % |
| garden → manor + conservatory | 138 / 205,294 | 132 / 201,334 | -6 | -1.9 % |
| forest (shed area) | 36 / 148,663 | 36 / 148,663 | +0 | +0.0 % |
| BOSLUST cut | 87 / 223,287 | 87 / 223,703 | +0 | +0.2 % |
| conservatory pool | 100 / 174,506 | 100 / 174,506 | +0 | +0.0 % |
| campfire | 27 / 108,543 | 27 / 108,543 | +0 | +0.0 % |
| well | 51 / 178,035 | 51 / 178,035 | +0 | +0.0 % |
| wickerman figure | 36 / 196,168 | 36 / 196,168 | +0 | +0.0 % |
| golf chute | 54 / 164,445 | 54 / 164,445 | +0 | +0.0 % |
| dining | 59 / 132,634 | 59 / 132,634 | +0 | +0.0 % |
| kitchen | 55 / 136,008 | 55 / 136,008 | +0 | +0.0 % |
| attic observatory | 37 / 93,704 | 37 / 93,704 | +0 | +0.0 % |
| Copacabana bar | 52 / 125,519 | 52 / 125,519 | +0 | +0.0 % |
| Portugal cottage | 39 / 103,099 | 39 / 103,099 | +0 | +0.0 % |
| livingRoom | 50 / 152,010 | 50 / 152,010 | +0 | +0.0 % |
| sterrenBedroom | 28 / 73,522 | 28 / 73,522 | +0 | +0.0 % |
| copaRoom | 85 / 166,914 | 85 / 166,914 | +0 | +0.0 % |
| lakeApproach | 38 / 133,165 | 38 / 133,581 | +0 | +0.3 % |
| lakeShore | 38 / 126,640 | 38 / 127,056 | +0 | +0.3 % |
| woodlandRoute | 33 / 190,861 | 33 / 190,861 | +0 | +0.0 % |
| boslustCalibration | 90 / 235,111 | 90 / 235,527 | +0 | +0.2 % |

**Wickerman states (burning = real in-session ignition, 10 s in)**

| View | Before `4f2b2ed` | After `0681519` | Δ calls | Δ triangles |
|---|---|---|---|---|
| wickerUnlit | 31 / 160,589 | 31 / 160,589 | +0 | +0.0 % |
| wickerLit | 31 / 160,589 | 35 / 164,011 | +4 | +2.1 % |
| wickerBurning | 31 / 160,589 | 43 / 175,751 | +12 | +9.4 % |
| wickerBurningClose | 30 / 155,412 | 42 / 170,574 | +12 | +9.8 % |
| wickerPathBurning | 35 / 217,435 | 47 / 232,597 | +12 | +7.0 % |
| wickerApproachBurning | 30 / 159,920 | 42 / 175,082 | +12 | +9.5 % |

- **Every view inside the guide stays inside it.** The only view over it, **golfSpur**, went *down* (93 → 90 calls,
  262,690 → 260,998 triangles).
- **Cheaper arrival / garden / sauna views (−3 … −6 calls)**: the chandeliers are now owned by their room batch, so the
  DEV-03 "interior from outside only near an open door" rule finally applies to them (their frames used to be drawn 50 m
  away through the front door).
- **+0.2 … +0.5 % triangles in lake-facing views**: the lake's depth gradient needs rings (64 → 480 triangles).
- **Wickerman (local, measured, justified)**: unlit 0; candles lit +4 calls / +3.4 k triangles (flame pair, jar mesh,
  floor glow); burning +12 calls / ~+15 k (two flame pairs, embers, smoke, smoulder, glow) — at most 47 calls / 232.6 k
  (path view while burning), inside the guide; only drawn within the clearing's 40 m region.
- **Fragment cost of the surface layer** (no draw-call or triangle cost): measured with `scripts/dev04c-frametime.mjs`
  as median ms per render in SwiftShader (CPU rasteriser, a fill-rate proxy, run-to-run noise ≈ ±5 %): woodland route
  ±0 %, living room +6 … +9 %, arrival +6 … +10 %, lake approach +5 … +15 % vs `4f2b2ed`. First version cost +10 … +20 %;
  halved by one vec2 noise lookup instead of two scalars and no mid-scale lookup on the canopy (the heaviest overdraw).
  **Not yet measured on a real phone GPU** (§11).

## 8. Test results — final gate on `0681519`

| Step | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx vitest run` | **212 / 212** (16 files; 13 new in `tests/dev04c.test.ts`) |
| `npm run build` (clean `dist/`) | OK (the chunk-size warning is pre-existing) |
| `npm run e2e:dev04c` (new) | **19 / 19** |
| `npm run e2e:dev04b` | **9 / 9** |
| `npm run e2e:dev04a` | **19 / 19** |
| `npm run e2e:dev03` | **11 / 11** |
| `npm run e2e` (full) | **103 / 103** |
| `npm run e2e:dev02` | **34 / 34** |
| `npm run e2e:dev01` | **34 / 34** |

**`e2e:dev04c`** (`scripts/e2e-dev04c.mjs`, real input paths, no pixel snapshots): (1) environment finite over dusk ×
indoor × open / woodland; (2) all nine surface profiles initialised; (3) no NaN vertex; (4) light hierarchy measured on
the live environment (woodland haze nearer and cooler, interiors clear, less sun / fill, fixtures up); (5) every flame
has a visibility owner; (6) **fire continuity**: flame drawn ⇔ host drawn at 75 flame × pose samples incl. 40–55 m from
the campfire; (7) routes walked with the real controller (front door → hall, lake viewpoint, loop → side path → inside
the candle ring); (8) unlit start; (9) **gating** — matches in hand, the figure is targeted and refuses, state unchanged;
(10) **candles** via reticle + action button, staggered reveal, jars / light on; (11) **burn**: flames on body, char
rising, hay burning, smoke / embers, light; (12) settles into the aftermath; (13) optional — no puzzle flag, only the two
lit keys saved; (14) **save / load across a real page reload** (version 4, aftermath on load, other `lit` state kept);
(15) a pre-DEV-04C save loads unlit; (16) **ids**: 128 baseline + only the 2 documented, 21 checkpoints, save keys /
version unchanged; (17) **no RESERVED / FLW-RSV content**; (18) budgets vs `before/budget.json`; (19) no page errors.

**Unit** `tests/dev04c.test.ts`: surface profiles bounded (broad, not noisy), opt-in only on lit materials, chunks
extended once and guarded, noise continuous; flame ownership (region holder / fixture parent, same world position),
reveal uniforms keep two meshes; Wickerman rules (matches only, gate, once, blow-out), optional (puzzles / flags / items
untouched), save round-trip without schema change, v3 migration filters the keys; burn timeline monotone, finite,
settled aftermath; flame tongues finite and on the figure.

Changed suites: `e2e:dev04a` check 8 / `e2e:dev04b` check 5 accept exactly the ids in `scripts/dev04c-additions.json`
(still fail on any other addition or removal); `e2e:dev04b`'s hook label no longer says "no ignition state".

## 9. Regression fixes found on the way

| Found by | Problem | Fix |
|---|---|---|
| fire probe (baseline) | flames culled 10–25 m before their fixture / room batch | flame ownership (§2.4) |
| `e2e:dev04c` budget | chandelier flames, once tied to their frame, were drawn wherever the frame was — including from outdoors 50 m away (+2–3 calls at the sauna / golf spur) | chandeliers owned by their room batch (outdoor rule applies): those views went **below** baseline |
| `dev04c-budget` | +1 call in almost every view: the clearing's floor glows joined the shared light-patch mesh, whose bounds then spanned the estate | the clearing glows are their own region-owned mesh |
| capture review | the surface layer's storey band drew a hard line on the cottage wall | band removed |
| capture review | first lake sheen read as ice; glints as floes | darker, cooler sheen; thin ripple crests |
| frametime probe | surface shader +10–20 % render time (SwiftShader) | one vec2 noise instead of two scalars, no mid lookup on canopy: now ±0 % (woodland) to +15 % (lawn) |

## 10. Interaction changes (summary)

New: `wicker.candles` ("Kaarsen" / "Kaarsen aansteken" with matches / "Kaarsen uitblazen"), `wicker.figure`
("Stroman" / "Stroman aansteken" with matches, refused before the ring burns / "Verkoolde stroman" afterwards). No
existing interaction, label, puzzle answer, notebook entry, hint or objective changed.

## 11. Owner review decisions (DEV-04C review) and known issues

**Decided by the owner — recorded, nothing in the tested code changes:**

| # | Question | Decision | State in the tested commit `0681519` |
|---|---|---|---|
| 1 | New interactable ids | **Approved**: `wicker.candles`, `wicker.figure`. The established baseline after DEV-04C is **130 interactable / door ids**. The older suites stay strict: all 128 prior ids must remain and only these two documented additions may appear | already so: `e2e:dev04a` check 8 / `e2e:dev04b` check 5 / `e2e:dev04c` check 16 compare against `dev04a-baseline.json` + exactly `scripts/dev04c-additions.json`; any other addition or removal fails |
| 2 | Burn persistence | **Permanent per save.** Once burned, loading the save shows the charred aftermath; the figure is not rebuildable or re-ignitable. A new game starts with the intact, unlit figure | already so: `wicker.figure` is never cleared by the game; `igniteFigure` refuses a burned figure (unit), the figure takes no item afterwards (`itemLabel` → none), a reload shows the settled aftermath (`e2e:dev04c` check 14), a new game's state has no `wicker.*` key (`defaultState`) |
| 3 | Interior surface strength | **Keep the current restrained strength** in DEV-04C; DEV-04D's approved wall art, 3D references and room-by-room richness come first and the surface layer supports them | unchanged |
| 4 | Merge | **Hold PR #5** for a real-phone performance / visual check (§13). No further visual change unless that check exposes a concrete blocker | no merge, no deploy |
| 5 | DEV-04D | **Not started** | — |

**Known issues (unchanged):**

1. **Mobile GPU cost**: the surface layer's fragment cost was only measured in SwiftShader (+0 … +15 %); the phone check
   (§13) decides. If it is a blocker, the smallest lever is `ground` dropping its mid lookup like the canopy did (a cost
   change, not a look change worth reopening the pass for).
2. **Flame look**: the effigy flames reuse the stylised teardrop tongues; at close range they read as a stack of tongues
   rather than one sheet of fire. Acceptable for C; a bespoke sheet-fire is a D candidate.
3. **Smoke** is a faceted low-poly column (same language as the foliage); it reads at distance, less so overhead.
4. **Not done because unavailable**: FLW-D2 wall art (C4), FLW-K3 keys (C5), FLW-S3 3D refs — see the manifest; nothing
   was fabricated. RSV-019–022 untouched (PENDING).
5. Pre-existing and unchanged: the evidence pose `f01` (all relevant doors open, worst case) was already over the
   triangle guide before (289 k) and is 293 k after; it is not a budget view. Build chunk-size warning pre-existing.

## 12. Deferred to DEV-04D

Estate-wide curation of the surface strength per room; FLW-D2 / S3 / K3 rollout through the manifest contracts once the
files exist; gingerbread maquette material re-skin; bespoke fire / smoke shapes; any device-specific quality tiering of
the surface layer.

### DEV-04D backlog (recorded during DEV-04C-R; not implemented)

**D-BL-01 — The social board-game table: a played evening, not a set table** *(owner, DEV-04C-R acceptance; not
started)*

- **Where** (confirmed by the owner): the long table in the eat / game room, the room immediately to the right when
  you enter the manor and look in from the hall. In code: `ES.gameTable`, `src/world/manor.ts` around the
  `boardGameSet(c, 101.3, 84.35, …)` call, ground floor.
- **Today**: the home-made duo game (board, pawns, two dice, card piles), a score pad and 3 beer bottles at the table's
  south end. Marshmallows (one bowl) and 4 shot glasses stand on a separate small side table (96.2, 90.6).
- **Wanted**:
  - **≥ ~15 beer bottles**, naturally varied: mostly empties with a few still in use, some standing, one or two
    tipped over, a few labels turned away, slight height / tint variation. Clustered where people sat (by the seats,
    near the players' hands, a knot of empties at the table end), not spread evenly.
  - **Shot glasses** (several, some empty, one or two upturned) next to **one bottle of strong liquor**.
  - **Marshmallows / a marshmallow bag** on the table: an opened bag with a few loose ones.
  - Keep the **board game / cards / dice identity** readable: the board stays the focal point and nothing covers it.
- **Constraints**:
  - Hand-placed or seeded-jitter clusters only; no grid, ring or evenly spaced procedural placement.
  - Reuse the existing bottle / cap / glass geometry (`bottleGeoOf('beer')`, `capGeo`, `shotGlass`) through the
    chunk batch (`Asm`). No new interactables, no new save keys.
  - The dining views stay inside the mobile guide (today `dining` 59 calls / 133 k triangles).
  - Decide whether the side table's marshmallow / shots group moves to the big table or stays as a second spot.

**DEV-04C-R** (mobile acceptance corrections: lake, room-boundary light continuity, Wickerman candle sequence and no
message card) is reported in [`DEV04C_R_REPORT.md`](DEV04C_R_REPORT.md).

## 13. Real-phone check (hold condition for PR #5)

Purpose: confirm on real hardware what SwiftShader can only approximate — the surface layer's fragment cost and the
look at phone size. Run the **tested commit** (`0681519`, or the PR head: identical code) against production
(`4f2b2ed`) on the same phone, same orientation, low quality (the phone default).

1. Serve each build to the phone on the local network (`npm run build && npx vite preview --host --port 4173`, and
   the production build on another port) — no deployment needed. Open `…/Feh-Lu-We/?debug=1`: the overlay shows median
   FPS, p95 frame time, draw calls and triangles.
2. Stand still ~10 s at each pose (debug overlay checkpoint buttons, or walk there) and note median FPS / p95 for both
   builds: **lawn → lake** (the lake approach, the most expensive surface case: +5 … +15 % in SwiftShader), **front
   forecourt → manor**, **living room**, **woodland route** (south forest path), **Wickerman clearing** unlit and burning
   (matches from the bag on the candles, then the figure).
3. Look for: banding or shimmer in the broad surface variation, the lake sheen at grazing angles, flame / smoke
   readability at phone size, interior readability (not too dark), heat / throttling after a few minutes.

**Blocker criteria** (the only reasons to change visuals before merge, per the owner): a sustained median FPS drop of
more than ~10 % vs production in the same pose, a visible artefact (banding, shimmer, precision noise in the world-space
variation), or a readability problem (navigation, puzzle evidence). Anything else is recorded for DEV-04D.
