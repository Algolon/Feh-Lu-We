# DEV-04C — Audit and plan

Atmosphere, authored surfaces & interactive setpieces. Written **before** any code change, from the code and from
captures of the unchanged production build. Implementation results are in `DEV04C_ATMOSPHERE_REPORT.md`.

## 1. Starting commit

| | |
|---|---|
| Production / default branch | `ccr-75ef4113-kfkimm` |
| Expected HEAD | `4f2b2ed4b5e91bfcaecd63b0e85859849ef13078` |
| Verified HEAD | `4f2b2ed4b5e91bfcaecd63b0e85859849ef13078` (`git fetch` + `git rev-parse origin/ccr-75ef4113-kfkimm`, 10 Oct 2026) — **production has not moved**; no delta to audit |
| Work branch | `ccr-b04299a9-fwl08f`, identical to `4f2b2ed` and clean before the first edit |
| Other remote branches | all older than production and already merged into it (`assets/woodland-manor-branding`, `ccr-6996e148…`, `ccr-f194a21e…`, `claude/trusting-cray…`, `dev04-reference-pack`), or abandoned deploy branches not in production (`ccr-928d1d45…`, `claude/wizardly-curie…`); none carries reference art |

Baseline invariants re-read from the code and the suites: save version **4**; **128** interactables
(`scripts/dev04a-baseline.json`); **21** checkpoints; estate 200 × 180 m; DEV-04B families; low-quality guide ≈ 150
calls / 250 k triangles with **golfSpur** the one known exception (re-measured: 93 calls / 262,690 triangles).

## 2. Visual references available

Read: `REFERENCE_INDEX.md`, `REFERENCE_CHECKLIST.md`, `PERSONALIZED_REFERENCE_BOARDS.md`, `DEV04A_HANDOFF.md`,
`WEB_REFERENCE_SOURCES.md`, every `REFERENCES.md` / `GENERATED_REFERENCE.md` / `generated/README.md` in `00_`–`07_` and
`99_avoid`, the DEV-04A and DEV-04B reports.

| Kind | What is actually in the repo |
|---|---|
| Personalized generated sheets (internal, owner-approved 8 Oct 2026) | 6 PNG sheets (~500 px): Wickerman + clearing, gingerbread maquette, Copacabana Room, attic observatory, modular books, living/dining furniture; plus the source collage `generated/personalized_boards_collage_v01.png` |
| External references | URL + usage notes only (copyrighted images are deliberately not stored): Soucheff manor, Casa Amendoeira, Idealcombi, Trevor Leat willow, stylized wood material (Taheri), firepit, telescope, books, kitchen, sofa packs, NGA *Country House in a Park* (public domain, URL only) |
| Calibration folders | `00_calibration/boslust`, `portugal_exterior`, `living_room_candidate`, `external_style_targets`: `.gitkeep` / URL notes only — the in-game builds themselves are the calibration (captured here as `before/c14`, `c15`, `c08`, `c03`) |
| Empty leaf folders | most of `01_architecture`, `02_ground_landscape`, `03_assets`, `06_art_decor`, `07_materials` (`plaster_stone_tile`, `fabric_leather`, …) and all `99_avoid` folders hold only `.gitkeep` |
| Not in the repo | the separate *technical modelling board* (`*_v02` sheets) — stated as missing in `PERSONALIZED_REFERENCE_BOARDS.md` |

The Long Dark: used as a list of **principles only** (painterly simplification, large value shapes, restrained breakup,
designed irregularity, warm-shelter / cool-woodland separation, atmospheric depth). No asset, texture, palette, UI or
composition of it is referenced or reproduced; no image of it is stored.

## 3. Approved art / reference assets actually accessible

Searched the working tree, every remote branch (`git ls-remote` + `git ls-tree` of each), the whole filesystem
(`find / -iname '*FLW*'`) and every text file for `FLW-`:

- **No `FLW-D2-*`, `FLW-S3-*`, `FLW-K3-*` or `FLW-RSV-*` file, manifest or mention exists** in the repository or this
  session. No image was supplied with the brief.
- Accessible and approved: the six generated sheets above (AVAILABLE_REFERENCE_ONLY — modelling/stylization reference,
  not final art).

Full per-ID table: `DEV04C_REFERENCE_MANIFEST.md`.

## 4. Unavailable / pending assets

| Family | State | Consequence for DEV-04C |
|---|---|---|
| `FLW-D2-*` 2D wall art | UNAVAILABLE (no raster in repo/session) | C4 wall-art integration is **not done**; no procedural imitation is made to fill slots; the DEV-04B-R hall painting stays. The manifest carries an integration contract so the rasters can drop in later |
| `FLW-S3-*` 3D decorative refs | UNAVAILABLE | nothing modelled from them; DEFER_TO_D |
| `FLW-K3-*` key prop refs | UNAVAILABLE | the four gameplay keys stay as they are (C5 dependency recorded, nothing invented) |
| `FLW-RSV-019 … 022` | PENDING (RESERVED paused) | not implemented, not inferred; no puzzle change |
| Batch 05 | not a prerequisite | manifest rows only |

## 5. Material and lighting architecture (as found)

- **Materials** (`kit.ts getKit()`, `artkit.ts artMats()`, `woodkit.ts woodMats()`, `propkit.ts propMats()`): ~25 shared
  `MeshLambertMaterial`s (+ `MeshPhongMaterial` brass / ceramic) with `vertexColors`, each with one runtime canvas
  texture (`textures.ts`: plaster, stone, wood, tile, slate, terracotta, grass, dirt, foliage, bark, rug; art kit:
  weave, grain, ashlar, rug atlas; woodkit tree atlas + strata; one 1024² prop atlas). ~30 one-off Lambert materials
  for signs, plaques, water, panels.
- **Batching**: `Batcher` merges every part per material × chunk into one mesh, baking a per-part ±4 % brightness
  jitter and optional authored vertex colours (`keepColor`). Vegetation: `BatchedMesh` (multi-draw) or `InstancedMesh`
  fallback (`vegbatch.ts`) with per-instance colour.
- **Surface variation today**: the canvas textures (blotches/strokes at texture scale, so they *repeat*), the ±4 %
  part jitter, the terrain's per-vertex colour zones (lawn / forest floor / shore / paths). Nothing breaks up colour at
  the **building or landscape scale**: plaster walls, floors, lawn and canopy read as one flat value each
  (`before/c02-hall`, `c03-living`, `c10-lake-approach`).
- **Shader customisation**: one `onBeforeCompile` (woodkit tree atlas) and the flame material (`fire.ts`). No global
  chunk patches, no post-processing. Tone mapping ACES, exposure 1.15.

## 6. Environment: fog / sky / light (as found)

`src/world/env.ts`: a gradient sky dome (zenith/horizon/sun disc), one `HemisphereLight`, one `DirectionalLight` (sun,
shadows only on *high*), linear `Fog` 30 → 125 m. One `dusk` value (puzzle progress) blends afternoon → evening. Two
art-refresh treatments already exist:

- **Interior** (`indoor` 0..1, smoothed by `Game.tick`): cooler window sky above, warm floor bounce, −28 % hemisphere,
  and `LightPool.gain` +35 % for fixtures.
- **Woodland** (`woodWeight()` from `boslustZone.ts`, estate-wide since DEV-03): cooler greener fog that starts nearer
  (22 → 110 m), cooler sky fill, warmer earth bounce, +8 % sun.

Fixture light: a pool of 3 (low) / 4 (high) `PointLight`s assigned by room relevance (`LightPool`), plus additive
floor "light patches" (`LightPatches`) that follow lamp state. Emissive surfaces = `MeshBasicMaterial` (`k.M.glow`).

Observed in the captures: the woodland treatment is mild — mid-distance trees keep full saturation and value, so there
is little aerial perspective (`before/c12-woodland-route`, `c13`); sky and fog are warm cream everywhere, so warm
interior vs cool exterior is not a readable hierarchy; the lawn is one saturated green.

## 7. Wickerman interaction capabilities (as found)

`grounds.ts wickerman()` + `wickerman.ts`: willow figure (merged, baked vertex colours) and its hay (prop atlas, straw
sheet), both batched into chunk `wick` (region drawn within 40 m); plinth, sleepers, timber shoes, collider r 1.15 m;
nine unlit candle jars on flat stones at r ≈ 3.1 m; a stake lantern (always on) at the path mouth; candle positions
published as `scene.userData.wickerCandles = { centre, candles[9] }`. **No interactable, no state key, no light, no
flame, no burn geometry.** The figure and hay are batched with the rest of the clearing, so they cannot change look
without being split out.

## 8. Existing fire / flame implementations

`fire.ts makeFire()`: unlit `MeshBasic` flame tongues merged per fire into two meshes (translucent outer + opaque core),
vertex-shader flutter on one shared clock (`FIRE_UNIFORMS`), reduced-motion freezes it. Kinds: `hearth`, `campfire`,
`candle`, `candles`. Users: living hearth (`fire.living`, + `embers()` mesh), BOSLUST gathering hearth / table candles /
chandelier, hall / dining / library chandeliers, dining candlesticks, the clearing campfire (`fire.clearing`), the home
candle. State: `state.lit[id]` booleans, `LampSource` per fire for the pooled light, `emitters` for crackle audio.

**Continuity defect found** (probe on the baseline build): every flame group is a top-level object that `World.setupCulling`
gives a *size-based* draw distance (16 + 25 × radius), while its fixture or room batch has a different one:

| Flame | Flame drawn to | Its host drawn to |
|---|---|---|
| hall chandelier | 46.5 m | chandelier frame 57 m |
| library chandelier | 43.2 m | frame 52 m |
| dining chandelier / candlesticks | 39.9 / 41.4 m | frame 45 m |
| living hearth | 32.2 m | `mLiv` batch: no distance limit indoors |
| clearing campfire | 39.8 m | `fireCamp` batch 55 m |
| BOSLUST candles / hearth | 43 / 31 m | `ug` batch: no limit |

So the fixture (or the fire pit with its stones) stays drawn while its burning flame vanishes — e.g. the campfire
from 40–55 m in the woodland, the living-room fire from the far end of the ground-floor enfilade. Room sets of flame
and host agree (both sampled the same way), so this is a **distance-ownership** problem, not a room-graph one.

## 9. Art placement system

`openings.ts` (DEV-04A): every door / window / sweep is registered; `painting()`, `canvasPanel()` and sconces register a
wall footprint (`artFootprint`, `registerArt`); `wallArtConflicts()` rejects art over openings (with architrave / sill
margins) and is checked by unit tests and `e2e:dev04a`. Paintings are procedural (`paintingTexture(seed)`,
`drawManorLandscape` for the DEV-04B-R hall painting). A future FLW-D2 raster only needs: an image URL, aspect, frame
style and a registered footprint — the contract already exists (see manifest §Integration contract).

## 10. Key props

Gameplay keys (`content/items.ts`): `frontKey`, `shedKey`, `studyKey`, `consKey`; pickups `pk.frontKey` (home),
`pk.shedKey`, `pk.studyKey` (with card), `pk.consKey`. World models are small box compounds (`shedKey`: two boxes);
inventory uses 2D SVG icons (`ui/icons.ts`). Item / pickup / lock ids are save-relevant and stay unchanged. With no
`FLW-K3-*` reference available, the keys are **not remodelled** (brief §9).

## 11. Performance baseline (low quality, 1280 × 720, SwiftShader)

Measured with the new `scripts/dev04c-budget.mjs` on a clean build of `4f2b2ed` → [`before/budget.json`](before/budget.json).
Highlights (calls / triangles):

| View | Before |
|---|---|
| golfSpur (known exception) | 93 / 262,690 |
| frontForecourt / arrivalCourt | 139 / 206,032 · 133 / 202,574 |
| saunaAccess / conservatoryDoorDeck | 148 / 225,826 · 143 / 205,534 |
| wickermanClearing / wickermanPath | 31 / 160,593 · 35 / 211,057 |
| entrance hall / living room | 105 / 193,300 · 50 / 152,010 |
| Copacabana room / bar | 85 / 166,914 · 52 / 125,519 |
| Portugal terrace / cottage | 31 / 91,423 · 39 / 103,099 |
| lake approach / lake shore | 38 / 133,165 · 38 / 126,640 |
| woodland route / BOSLUST calibration | 33 / 190,861 · 90 / 235,111 |

Numbers match the DEV-04B-R report to the call / triangle. (The evidence views in `before/views.json` use the
all-relevant-doors-open evidence state, so they are worst cases, not budget views.)

## 12. Implementation plan

**Principle**: one central layer per concern, opt-in by material/system, no per-mesh hacks, no extra draw calls for
surfaces or atmosphere. Calibrate on the six C1 locations first, then propagate (the shared layer *is* the
propagation; per-area tuning only where a calibration view demands it).

| # | Work | Mechanism | Files |
|---|---|---|---|
| C2 | **Authored surfaces** — broad, low-frequency, world-space value/hue breakup per material family (timber, plaster, stone, fabric, paint, ground, foliage, metal/ceramic), no texture density change | new `src/world/surfaces.ts`: ShaderChunk extensions installed once, all code under `#ifdef FLW_SURFACE`; materials opt in with a profile define (`surface(mat, 'plaster')`). Zero extra draw calls / textures; one program per profile | `surfaces.ts` (new), `kit.ts`, `artkit.ts`, `woodkit.ts`, `propkit.ts`, `estate.ts` (outer land) |
| C3 | **Atmosphere hierarchy** — cooler, hazier woodland with real aerial perspective; warmer, more contained interiors; sky horizon matched to fog so distance dissolves; dusk keeps its role | `env.ts` retune (palettes, woodland/outdoor fog ranges, interior warm bounce, sun/sky balance); everything stays driven by `dusk`, `indoor`, `woodWeight` | `env.ts`, `game.ts` (pool gain) |
| C3 | **Fire continuity** — a flame is drawn exactly when its host is | `makeFire({ host })`: flames either parent to their fixture (chandeliers) or are owned by their host's room region (hearths, table candles, campfire) instead of the size-based cull | `fire.ts`, `hearth.ts`, `furniture.ts`, `manor.ts`, `boslust.ts`, `forest.ts` |
| C2 | **Water** — lake reads as depth, not a teal disc: darker deep centre, lighter shallow rim, soft shore band, restrained moving glints; no reflections | lake material (vertex-shaded depth + small shader motion), shallow shore band | `grounds.ts` |
| C6 | **Wickerman setpiece** — unlit → candles lit → figure ignitable → burning → charred aftermath | figure + hay split from the `wick` batch into their own meshes with a `uBurn` char/glow uniform; candle flames = one `candles` fire over the published positions; figure flames = new `effigy` fire kind (one merged mesh pair) + a small ember mesh; pooled lights; two new interactables `wicker.candles`, `wicker.figure`; state in `state.lit` | `wickerman.ts`, `grounds.ts`, `fire.ts` |
| — | Tests | `tests/dev04c.test.ts` (surface defines, fire kinds, wicker rules/state), `scripts/e2e-dev04c.mjs`, `npm run e2e:dev04c`; evidence `scripts/dev04c-views.mjs`, budget `scripts/dev04c-budget.mjs` | new + `package.json` |

### Wickerman design decisions

- **Optional, not a gate**: no puzzle reads these keys; no clue, hint, thread or objective changes.
- **Matches**, the established fire grammar (`lightableItemLabel`, hearths, campfire): aim at the candles with the
  matches in hand → the whole ring lights in a quick staggered sweep (one shared state, not nine systems). Without
  matches in hand the candles say so.
- **Gating**: the figure is targetable from the start but refuses until the ring burns ("the candles first"); with
  the ring lit it takes the matches → burning.
- **Burning → aftermath**: in-session the figure burns (flames, glowing hay, embers, strong flickering light) for
  ~75 s while char creeps up the willow, then settles into a static charred aftermath (blackened armature, hay burned
  away, embers glowing in the plinth). A saved burned figure loads as the aftermath. No collapse, no physics.
- **Persistence**: `state.lit['wicker.candles']`, `state.lit['wicker.figure']`. `state.lit` is already an open
  `Record<string, boolean>` validated by `boolRec()`, so **no schema change, no version bump, no new top-level key**;
  older saves simply lack the keys (= unlit). The candles can be blown out again; the figure cannot be un-burned.

### ID decision (owner review)

**Owner decision (DEV-04C review): approved.** The established baseline after DEV-04C is 130 interactable / door ids; the older suites stay strict (all 128 prior ids present, only the two documented additions allowed).

The interaction needs two **new** interactables: `wicker.candles` and `wicker.figure`. All 128 existing ids, the 21
checkpoints and the save keys stay unchanged. `e2e:dev04a` / `e2e:dev04b` currently assert "none added"; they will
assert "every baseline id present, and the only additions are the documented DEV-04C ids"
(`scripts/dev04c-additions.json`) — still failing on any undocumented addition or removal.

### Explicitly not done (brief §11)

No estate/manor change, no furniture replacement, no new puzzle, no notebook/finale change, no RESERVED / RSV-019–022,
no fabricated Batch-05 or FLW art, no weather, no post-processing, no physics fire, no clutter pass, no merge/deploy.
