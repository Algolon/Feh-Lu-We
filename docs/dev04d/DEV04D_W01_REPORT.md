# DEV-04D W01 — Wickerman ritual and visual iteration

**Status: RELEASED for live owner playtesting** (W1–W8 accepted for this release, 15 Oct 2026; W6 pacing, W7 sound balance and W8 art stay subject to the phone playtest). Release details: §14.

| | |
|---|---|
| Stream | W01, the Wickerman implementation stream inside the original D4 scope (master plan §D4), run in parallel with D3-b2 |
| Branch | `ccr-1cffdfa6-w9jn3r` (the session's designated branch; the brief's proposed name `dev04d-w01-wickerman-ritual` was not used because this environment may only push to the designated branch). Isolated: nothing else is on it |
| Starting production | `752cb02` (15 Oct 2026, "Merge PR #30 cars-r02"), verified on GitHub before any change |
| Production during the work | moved to `6c57ced` (gravity bong, serre air conditioner). Merged into W01 without conflict (§9); all regression suites ran on the merged tree |
| Final feature SHA | code head `d9c9466` (refinement pass; includes the production merge `971dc36`); this report and the evidence are committed on top of it on the same branch |
| Owner decisions | W1–W8 implemented **provisionally** with the design's proposed defaults; none is described as owner-approved (§4) |

## 1. Recovered baseline and concurrent work

- `git fetch`: production `ccr-75ef4113-kfkimm` = `752cb02` at the start. No other Wickerman implementation or partial W01
  branch exists (all 36 remote branches inspected; only `dev04-reference-pack` / `ccr-f194a21e` carry Wickerman
  *reference* docs, no code). The worktree was clean.
- Concurrent workstreams and their overlap with W01 (three-way `git merge-tree` against the W01 head):

| Branch | Ahead of production | Touches W01 files? | Trial merge with W01 |
|---|---|---|---|
| `dev04-d3-b2` (D3-b2 WIP) | 1 | no (upstairs rooms; `scripts/e2e-dev04d.mjs` hunk at line 232, W01 changes line 28 only) | clean |
| `ext-r01-manor-arrival-study` | 2 | `grounds.ts` `arrival()` only (W01 edits `wickerman()` and appends a function) | clean |
| `veg-art-r02-oak-sculpt`, `veg-r01-vegetation-lod` | 3 / 1 | no | clean |
| `vcp01-library-codex` (PR #9) | 2 | no; conflicts with **production** in `artflags.ts` (pre-existing, not W01) | conflict unrelated to W01 |
| `vfc01-visual-fidelity-calibration` | 44 | no | not merged (old base) |

- ENV-L01 / SKY-C01 lighting, VEG-R01, GEO-R01, PB01, tutorial / HUD / compass: all in production, untouched by W01.

## 2. What was there (audited) and what W01 changed

| Area | Production (`752cb02`) | W01 |
|---|---|---|
| Rules | inline in `wickerFire.ts`; burned = permanent; ring stays lit forever | pure module `src/world/wickerRitual.ts`: stage derivation, transitions, normalisation, prompts, timelines, audio mix |
| Stages | unlit → lit → burning → aftermath (end) | READY → RING_LIT → BURNING → CHARRED → EMPTY_FRAME (→ CARRYING_HAY) → READY, indefinitely |
| Fire | two `makeFire('custom')` stacks of teardrop tongues ("petals") | noise-shaded flame **sheets** on 16 broad columns following legs, torso, arms, head; the fire climbs the figure base by base and dies back from below |
| Smoke | 12 faceted icosahedra in a column | 18 soft camera-facing puffs (4 painted shapes, rotation, varied scale and drift, warm-lit base) that swell and overlap as they rise into one dispersing plume (no discrete discs, also at blue hour) |
| Aftermath | hay hidden, smoulder fire at the feet forever, ring lit | blackened willow, **charred hay remnant** (ash-grey clumps with charcoal breaks and patches of scorched straw, ≈ 60 %, drawn double-sided so the charred cage reads filled where the empty frame is see-through), **ash heap** on the plinth, ember spots + smoulder fading over 60 s; candles out |
| Clean / refill | — | 1.8 s clean (remnant crumbles from the top, char recedes downward, ash heap sinks, ash puff), 1.6 s refill (hay packs in from the feet up, arms then head, W8 tufts last) |
| Filled vs empty | willow-dominant either way | hay a touch lighter / warmer; the wisps and the new W8 tufts belong to the hay, so EMPTY is the bare armature |
| Plinth | smooth light disc ("cake board") | constructed dry stone without moss (a hearth stone variant of the shore stone): dark core read as deep joints, two staggered battered courses, footing stones, coping slabs, hearth slabs (W5 scorch) |
| Candle stones | small, light, lost in the grass | broader, darker flat stone + a chock stone per jar |
| Bale | — | compact two-string bale on a pallet, twine bands with tension dents, cut ends, pulled tuft, loose straw, leaning besom (§5) |
| Audio | the shared campfire `fire` loop within 10 m | own procedural ritual layer (§6); the shared loop is untouched and no longer used by the Wickerman |

## 3. State machine and persistence contract

```
          light ring (matches carried; one action; 3.6 s sweep from the nearest candle)
 READY ───────────────────────────────────────────────► RING_LIT
  ▲  (filled, ring out)  ◄────────── blow out ─────────  (filled, ring lit)
  │                                                         │ ignite (matches)
  │ refill 1.6 s (ring forced OUT)                          ▼
 CARRYING_HAY ◄── take hay (bale) ── EMPTY_FRAME ◄── clean 1.8 s ── CHARRED ◄── settles at 80 s ── BURNING
 (session only)  ── put back / select item / chip /     (bare frame)            (remnant, ring out)  (candles go out one
                    leave > 12 m ──►                                                                   by one, 68–78 s)
```

| Saved `lit` keys (schema 4, no bump) | Stage | Note |
|---|---|---|
| none | READY | new game, pre-DEV-04C save |
| `wicker.candles` | RING_LIT | ring restored fully lit, no sweep replay |
| `wicker.figure` (± `wicker.candles`) | CHARRED, ring **out** | C / C-R aftermath saves and a save taken mid-burn; a loaded remnant is cold |
| `wicker.empty` (± `wicker.candles`) | EMPTY_FRAME | ring as saved |
| `wicker.figure` + `wicker.empty` | EMPTY_FRAME, `figure` cleared | only reachable by editing a save |
| carrying hay | never saved | a reload while carrying lands in EMPTY_FRAME |

- A key that becomes false is **deleted**, so a completed cycle leaves `lit` exactly as a new game has it (unit test:
  five cycles, byte-identical `lit`).
- Normalisation runs once per built world (`onSync`, first call) and is written with the next save.
- **Resolved ambiguity:** candles lit by hand around an empty frame are put **out** by the refill (READY with the ring
  out), so a lit ring can never let the next ritual skip its candle phase (unit + browser test).
- The ring can be lit / blown out in every stage except BURNING (design §2); during a burn neither the ring nor the
  figure offers a prompt.
- Optional content: every rule touches only `state.lit['wicker.*']` (tests assert inventory, used, flags, clues and
  puzzle solves are unchanged across full cycles). No toast, no modal at any step (browser-tested).

## 4. Owner decisions W1–W8 (implemented provisionally, not approved)

| # | Decision (design §11 default) | W01 | Deviation |
|---|---|---|---|
| W1 | `wicker.bale` → 131 ids | implemented; recorded in `scripts/dev04d-additions.json`, read by the A–D suites beside `dev04c-additions.json` | none |
| W2 | key `lit['wicker.empty']`; C saves (burned + lit ring) → charred, ring out | implemented | none |
| W3 | one bundle, one trip | implemented | none |
| W4 | besom leaning on the bale, no item | implemented (scenery, no collider, no id) | none |
| W5 | permanent faint scorch | smoke-darkened sleepers and timber shoes, darker hearth slabs on the plinth top, in every stage | baked colours, no decal |
| W6 | burn ≈ 80 s | kept (catch 0–5, build 5–20, peak 20–50, decline 50–66, settle 66–80) | none |
| W7 | procedural ritual audio | implemented (§6) | none |
| W8 | S3-039 straw read for the filled state | flared tufts at wrists (9 straws), ankles (8), crown (11) in the hay mesh; lashings `#3e3226` → `#352a1f`; no armature / pose change | **owner-review candidate** (S3-039 is REVIEW_READY, not approved art) |

Other deviations from the design, each deliberate:
- **The bale costs one draw call** where the clearing is drawn (the prop-atlas straw material is a new group in the
  `wick` batch); the design assumed zero. Pallet, twine and besom join existing groups.
- The charred remnant is the **hay mesh in a remnant mode** (same program, one uniform), not a separate mesh: CHARRED
  costs only the ash heap (+1 call) and the clean adds the ash puff (+1) for 1.8 s.
- The loaded / long-settled remnant is **cold** (no smoulder fire, no fire light); the DEV-04C reload showed a
  smouldering aftermath forever.
- Carrying is released at > 12 m from the figure (design value): leaving the clearing along the side path releases it
  at the loop junction, not at the clearing rim.

## 5. Hay bale, besom, interaction

- Placement `WICKER_BALE` (layout.ts): (176.4, 51.3), ≈ 5.2 m from the figure, ≥ 1.5 m outside the candle ring, long side
  tangential (yaw 44°), clear of the side-path mouth (NW), the stake lantern and the log bench (E). Seated on the
  terrain from five sampled points, 2 cm bedded.
- Construction (`src/world/hayBale.ts`): 0.95 × 0.48 × 0.38 m soft box (corners pulled in, faces bulging, twine dents),
  stalks along the length on the long faces, darker cut ends with stalk ends sticking out, two bark-twine bands with
  knots, a pulled tuft at the loosened corner, 26 loose stalks in front; pallet of two runners and five deck boards
  (top 0.1 m); a twig besom (handle, 22 birch twigs, two bindings) leaning on the clearing-side face.
- Collider: two circles r 0.32 along the bale, top ≈ 0.52 m (> 0.42 m step-up): an obstacle, never a step
  (browser-tested). Small-vegetation keep-out r 1.0 m round it (`vegetationClear`); no other vegetation or terrain change.
- `wicker.bale`: prompt **Hooi pakken** only in EMPTY_FRAME, **Hooi terugleggen** while carrying, no prompt otherwise.
- Held bundle: `GameApi.carry({ name, icon, release } | null)` (the one API addition). The existing held chip shows
  **Bundel hooi** with a new `hay` icon; `Game.select()` (bag selection, chip tap) calls `release`; loading a scene
  clears it. The bundle is never an `ITEMS` id, never in `state.inventory`, never saved.
- Prompts: figure — *Stroman — eerst de kaarsen* / **Stroman aansteken** / (none while burning) / **Stroman
  schoonmaken** / *Lege stroman — haal hooi* / **Hooi in de stroman stoppen**.

## 6. Ritual sound (procedural WebAudio, no files)

`Audio.ritual(dt, mix, gain, events)` builds its own node graph on ignition and releases it ≈ 2.5 s after the mix falls
silent or the player leaves range (fade, then stop + disconnect); `Game.updateAudio` passes the pure mix
(`ritualMix(t)`) and the distance gain (`ritualGain`: fire layers full ≤ 8 m → 0 at 35 m, drone / pulse → 0 at 22 m,
0 indoors). Respects mute (master gain; no transients scheduled while muted) and the user-gesture unlock.

| Layer | Synthesis | Arc |
|---|---|---|
| fire body | noise → lowpass 300 → 900 Hz | flame size |
| crackle / snaps | short high clicks (≤ ~6/s) + rare deep thumps with a click | flame size / 2–66 s |
| drone | 55 Hz triangle + 82.7 Hz sine (a fifth, slow beat) → lowpass 400 Hz, ≤ 0.04 | fades in 5–20 s, gone by 66 s |
| pulse | soft frame-drum heartbeat 70 → 48 Hz, every 1.9 s → 1.5 s, never faster | 7–54 s |
| air | noise → bandpass ≈ 600 Hz, slow LFO | flames, then smoulder |
| ember hiss | quiet high-passed noise | 50–104 s |
| events | match strike, a soft catch per candle in the sweep, a puff per candle going out, the ignition whoomp, a settling thump + crumble, three brush swishes, hay rustles, the refill rustle | per action |

Verified in the browser suite as a node-graph lifecycle (built on ignition, released at ≈ 37 m and after the
aftermath; mute flag honoured; the campfire loop intact). **Not verified by listening on a device** (§11).

## 7. Performance (PB01 mobile low: 915 × 412, DPR 1, shadows off)

Measured with `node scripts/w01-perf.mjs` on builds of production `752cb02` and W01 (before the production merge), same
poses, same actions; JSON in `docs/dev04d/w01/perf/`. Counts are exact `renderer.info` camera submissions (low has no
shadow pass). Matched-pose frame counters for all 25 evidence views are in `before/views.json` / `after/views.json`.

| Stage | Pose | Production calls / tris | W01 calls / tris | Δ | no-multi-draw P → W01 calls | transparent meshes P → W01 (est. coverage) |
|---|---|---|---|---|---|---|
| READY | entrance | 35 / 221,557 | 36 / 225,127 | +1 / +3,570 | 93 → 94 | 1 (0.23) → 1 (0.23) |
| READY | figure | 38 / 268,172 | 39 / 271,742 | +1 / +3,570 | 95 → 96 | 1 (0.38) → 1 (0.38) |
| RING_LIT | entrance | 39 / 240,887 | 40 / 244,457 | +1 / +3,570 | 95 → 96 | 3 (0.92) → 3 (0.92) |
| RING_LIT | figure | 42 / 271,594 | 43 / 275,164 | +1 / +3,570 | 99 → 100 | 3 (1.52) → 3 (1.52) |
| BURNING 4 s | entrance | 44 / 246,579 | 43 / 245,217 | -1 / -1,362 | 100 → 99 | 6 (1.93) → 6 (2.37) |
| BURNING 4 s | figure | 50 / 283,334 | 47 / 276,824 | -3 / -6,510 | 107 → 104 | 7 (3.19) → 7 (3.37) |
| BURNING 14 s | entrance | 47 / 252,627 | 44 / 246,117 | -3 / -6,510 | 103 → 100 | 7 (1.98) → 7 (2.43) |
| BURNING 14 s | figure | 50 / 283,334 | 47 / 276,824 | -3 / -6,510 | 107 → 104 | 7 (3.25) → 7 (3.37) |
| BURNING 32 s | entrance | 47 / 252,627 | 45 / 246,903 | -2 / -5,724 | 103 → 101 | 7 (1.98) → 7 (2.43) |
| BURNING 32 s | figure | 50 / 283,334 | 48 / 277,610 | -2 / -5,724 | 107 → 105 | 7 (3.25) → 7 (3.37) |
| BURNING 58 s | entrance | 47 / 252,627 | 45 / 246,903 | -2 / -5,724 | 103 → 101 | 7 (1.98) → 7 (2.43) |
| BURNING 58 s | figure | 50 / 283,334 | 48 / 277,610 | -2 / -5,724 | 107 → 105 | 7 (3.25) → 7 (3.37) |
| BURNING 72 s | entrance | 50 / 255,035 | 48 / 249,311 | -2 / -5,724 | 106 → 104 | 8 (1.96) → 8 (2.43) |
| BURNING 72 s | figure | 53 / 285,742 | 51 / 280,018 | -2 / -5,724 | 110 → 108 | 8 (3.21) → 8 (3.38) |
| CHARRED | entrance | 42 / 242,379 | 43 / 244,469 | +1 / +2,090 | 98 → 99 | 5 (1.28) → 5 (2.12) |
| CHARRED | figure | 45 / 273,086 | 46 / 275,176 | +1 / +2,090 | 102 → 103 | 5 (2.13) → 5 (2.86) |
| EMPTY_FRAME (production: no clean, permanent aftermath) | entrance | 42 / 242,379 | 35 / 238,825 | -7 / -3,554 | 98 → 91 | 5 (1.28) → 1 (0.23) |
| EMPTY_FRAME (production: no clean, permanent aftermath) | figure | 45 / 273,086 | 38 / 269,532 | -7 / -3,554 | 102 → 95 | 5 (2.13) → 1 (0.38) |
| refill (0.8 s) (production: no clean, permanent aftermath) | entrance | 42 / 242,379 | 36 / 241,035 | -6 / -1,344 | 98 → 92 | 5 (1.28) → 1 (0.23) |
| refill (0.8 s) (production: no clean, permanent aftermath) | figure | 45 / 273,086 | 39 / 271,742 | -6 / -1,344 | 102 → 96 | 5 (2.13) → 1 (0.38) |

Summary:
- **Absolute PB01:** every stage ≤ 53 calls / 286 k triangles with multi-draw and ≤ 110 calls without it, against 150 calls / 750 k. All views of §8 (incl. the clearing plan view 83 / 436 k) stay inside.
- **Relative:** READY / RING_LIT +1 call (the bale's straw material group) and +3,570 triangles (+1.6 % at the entrance view: bale ≈ 1.3 k, plinth courses, W8 tufts); BURNING −2 to −3 calls and ≈ −5.7 k triangles (16 flame sheets replace two tongue stacks); CHARRED +1 call (ash heap) +2.1 k; EMPTY_FRAME / refill are new stages (production keeps its lit aftermath there). Against production the largest Wickerman-view growth is +1.6 % (within the 2 % review guard); the suites' own guards against their historical baselines are in §9.
- **Transparency / overdraw (estimate, projected bounding spheres, not a fill measurement):** burning 1.98 → 2.43 screen-equivalents at the entrance (+23 %: wider smoke billboards, broader flame sheets); CHARRED 1.28 → 2.12 while the residual smoke fades (60 s, then 0); EMPTY / READY return to the single glass-jar mesh. The flame sheets discard most fragments (noise threshold), so the shaded area is below the bounding estimate.
- **Shader / programs:** 79 → 88 compiled programs after a full pass (85 before the production merge; the other 3 are production's gravity bong / serre materials) (+ flame sheet, smoke, ash heap, the two W01 burn variants replace the C ones). The flame shader does two texture fetches of a 128² noise texture per fragment; the smoke one; no new lights.
- **Dynamic lights:** unchanged: the ring and fire lamps compete in the existing 3-slot pool (3 assigned in every stage on both builds); the fire lamp now switches off when the embers have faded instead of glowing forever.
- **Memory:** +2 textures (two 128 × 128 RGBA DataTextures: flame noise and smoke puffs, 64 KiB each) once burning; geometry objects +1 at READY (bale batch group), equal while burning.
- **Reduced motion** (burn 32 s, entrance): 48 / 252,723 → 45 / 246,213; the fire keeps its shaped, static noise (browser-tested visible).
- **Render time (SwiftShader, median of 9 renders):** 0.77–1.11 s per frame on both builds; per-stage differences are inside the run-to-run noise (± 10 %). This is a CPU rasteriser on a loaded 4-core container: it shows no gross regression and nothing about a phone.

## 8. Visual evidence (`docs/dev04d/w01/`)

Reproducible with `node scripts/w01-views.mjs <baseUrl> <outDir>` (the same script captured both builds; production from
a build of `752cb02`) and `python3 scripts/w01-sheets.py`. Fixed poses, standard production lighting, daylight plus
the ENV-L01 **blue hour** (dusk 0.67) for v22–v24; 915 × 412 landscape for every view, 412 × 915 portrait for seven.

- `before/` (production `752cb02`), `after/` (W01 head, merged with production `6c57ced`; nothing of that merge is visible in the clearing): matched frames + `views.json` (counts, stage, wicker keys per frame). `prod-6c57ced/`: the plan view on current production, to separate production's own growth from W01 (v20: `752cb02` 131 / 401,472 → `6c57ced` 138 / 408,186 → W01 139 / 411,756, i.e. W01 +1 / +3,570).
- `sheets/pair-*.jpg`: before above / after below with counters. Key pairs: `v01` entrance, `v02` approach, `v03`
  figure at eye height, `v04` candle ring, `v08` / `v09` fire peak, `v12` / `v13` charred, `v13b` charred after the
  embers faded, `v14` / `v15` empty frame, `v16` bale, `v17` carrying, `v18` refill mid, `v19` refilled, `v20` clearing plan (inside the clearing, SE: figure, ring, bale, path-mouth lantern; re-posed in the refinement pass), `v21` plinth, `v22`–`v24` blue hour, `v25` READY after a second full cycle. The baseline has no clean / bale /
  refill: its v14–v19 frames show what production does at that point (the permanent aftermath).
- `sheets/s1-candle-sweep.jpg`, `s2-burn.jpg`, `s3-clean.jpg`, `s4-refill.jpg`: frame sequences on the game clock
  (candles 0.4–3.6 s; burn 2–82 s; clean 0.3–2 s; refill 0.25–1.8 s).
- `perf/`: the counters of §7.

## 9. Tests

All on the **merged tree** (W01 + production `6c57ced`), SwiftShader Chromium 141, production build served by
`vite preview`. Every failure was re-run on a build of **pure production `6c57ced`** (same scripts) to classify it.
Logs: `docs/dev04d/w01/tests/` (`merged-*`, `merged2-*` = re-run after the two test-side fixes below, `prod-*`,
and `final-*` = the complete re-run on the refinement head `d9c9466`, with results identical to the merged run: W01 27 / 27,
dev01 34 / 34, dev02 34 / 34, dev03 11 / 11, A 17 / 19, B 8 / 9, C 20 / 22, D 17 / 18, full e2e 96 / 103, every failure
the inherited one listed below).

| Check | Merged (W01) | Production `6c57ced` | Verdict |
|---|---|---|---|
| `npm run typecheck` | pass | — | pass |
| `npm test` | **315 / 315** (28 files; 21 new W01 tests) | 294 at `752cb02` | pass |
| `npm run test:budget` | 4 / 4 | — | pass |
| `npm run build` | pass (existing > 1.2 MB chunk warning) | — | pass |
| `npm run e2e:dev04d-w01` (new) | **27 / 27** | n/a | pass |
| `npm run e2e:dev04c` | 20 / 22 | 17 / 22 | the 2 fails are inherited (below); the 3 extra prod fails are the rewritten W01 lifecycle assertions, as intended |
| `npm run e2e:dev04d` | 17 / 18 | 17 / 18 | inherited: `inspect.serreAircoBeetle` id |
| `npm run e2e:dev04b` | 8 / 9 | 8 / 9 | inherited: same id |
| `npm run e2e:dev04a` | 17 / 19 | 17 / 19 | inherited: same id + relative budget guard |
| `npm run e2e:dev01` | 34 / 34 | — | pass |
| `npm run e2e:dev02` | 34 / 34 | — | pass |
| `npm run e2e:dev03` | 11 / 11 | — | pass |
| `npm run e2e` (full) | 96 / 103 | 96 / 103, **identical numbers** | inherited: six high-quality desktop render checks (120–194 calls / 475–570 k with shadows) and the Boslust LOD walk |

Inherited failures in detail (identical on production, none in a Wickerman view):
- **Ids:** production added `inspect.serreAircoBeetle` without registering it in an additions list; the A–D suites fail
  it. W01 registers its own `wicker.bale` (`dev04d-additions.json`) and does not paper over the other id.
- **A / C relative budget guards** compare against pre-DEV-04A / pre-DEV-04C baselines that production has outgrown
  (e.g. conservatory door deck 183 calls / 376 k vs 143 / 206 k; 20+ views). Per view, merged = production exactly,
  except the Wickerman views: `wickermanClearing` 31 / 205,030 → 32 / 208,600, `wickermanPath` 35 / 258,929 → 36 /
  262,679, `wickerLit` 35 / 208,448 → 36 / 212,018, `wickerBurning` 43 / 220,188 → **40 / 213,678**,
  `wickerPathBurning` 47 / 272,353 → **44 / 266,023** (`docs/dev04d/w01/tests/*-e2e-dev04c-budget.json`).

W01 coverage (unit + browser): every stage transition and refusal, the normalisation table and the old-save fixtures
(pre-C, C/C-R aftermath, edited `figure + empty`, empty + lit ring), reload in READY / RING_LIT / CHARRED / EMPTY_FRAME,
while carrying and mid-burn, two consecutive full cycles through real input (plus five through the rules), the candle
sweep (monotone, one at a time, from the nearest) and the end-of-burn extinguish (9 → 0, one at a time), the clean and
refill fronts (monotone), bale interaction, hay release by bag selection / chip tap / walking out, the lit-ring refill
rule, no toast at any step, untouched puzzle flags / inventory / uses / memories, the id contract, the bale collider,
reduced motion, direct touch taps on the figure and the bale, the audio node-graph lifecycle and per-stage render
budgets. Real input: reticle aiming, the on-screen action button by touch tap, the bag UI, the held chip, the
autopilot walk through collision, page reloads.

Superseded DEV-04C assertions (rewritten, not deleted; everything else in the suites unchanged):
`e2e-dev04c` "burn settles … hay gone" → hay as charred remnant; "only the two lit keys saved" → only the figure key
(the burn put the ring out); "save / load: the lit ring and the burned figure persist" → charred remnant, ring out,
cleanable. `tests/dev04c.test.ts`: tongue count > 8 → ≥ 5 broad columns.

Test-side fixes during the run (no product change): the first merged `e2e:dev04d-w01` run crashed on an array property
lost in `page.evaluate`; the first merged `e2e:dev04c` run aimed at the figure from beyond its reach after the reload.
Both fixed and re-run (`merged2-*`).

## 10. Changed files

Against production `752cb02` (W01 commits only; the production merge adds the gravity bong / serre files unchanged):

| File | Change | Shared? |
|---|---|---|
| `src/world/wickerRitual.ts` | **new**: pure rules, stages, normalisation, prompts, timelines, audio mix | W01 |
| `src/world/wickerFire.ts` | setpiece rewritten: sheet fire, soft smoke, remnant / clean / refill shader, ash heap, bale interactable, carry, ritual sound hook; re-exports the C API | W01 (Wickerman) |
| `src/world/wickerman.ts` | wisps moved into the hay, W8 tufts, `aFill` refill order, darker lashings; armature and pose unchanged | W01 (Wickerman) |
| `src/world/hayBale.ts` | **new**: bale, twine, loose straw, besom geometry | W01 |
| `src/world/grounds.ts` | `wickerman()` only: dry-stone plinth, candle stones, W5 scorch, the bale placement (+ appended `haleBale()`) | shared file, local function |
| `src/world/layout.ts` | `WICKER_BALE` constant after `WICKERMAN` | shared file, +1 constant |
| `src/world/footprints.ts` | small-vegetation keep-out round the bale (1 line + import) | shared file, 1 line |
| `src/interactions/world.ts` | `GameApi.carry()` declaration; `World.ritual` field (+ type import) | **shared API**, additive |
| `src/core/game.ts` | `carry()` + `carried`, `select()` releases it, `loadScene()` clears it, `updateAudio()` calls `audio.ritual()` | **shared**, +14 lines |
| `src/audio/audio.ts` | `ritual()`, `buildRitual()`, `releaseRitual()`, `ritualEvent()`; existing loops / sfx untouched | **shared**, additive |
| `src/ui/icons.ts` | `hay` icon | shared, additive |
| `tests/dev04d-w01.test.ts` | **new**: 21 unit tests | W01 |
| `tests/dev04c.test.ts` | one superseded count (`effigyTongues` > 8 → ≥ 5 broad columns) | superseded assertion |
| `scripts/e2e-dev04d-w01.mjs` | **new** browser suite (`npm run e2e:dev04d-w01`) | W01 |
| `scripts/e2e-dev04c.mjs` | three superseded permanence assertions rewritten to the W01 lifecycle; additions list | superseded assertions |
| `scripts/e2e-dev04a/b/d.mjs` | one line each: read `dev04d-additions.json` beside `dev04c-additions.json` | 1 line each |
| `scripts/dev04d-additions.json` | **new**: `wicker.bale` | W01 |
| `scripts/w01-views.mjs`, `w01-perf.mjs`, `w01-sheets.py` | **new** evidence tooling | W01 |
| `package.json` | `e2e:dev04d-w01` script | +1 line |
| `docs/dev04d/DEV04D_MASTER_PLAN.md`, `DEV04D_WICKERMAN_DESIGN.md` | W01 recorded as the D4 Wickerman stream | docs |
| `docs/dev04d/DEV04D_W01_REPORT.md`, `docs/dev04d/w01/**` | this report and its evidence | docs |

Not touched: `fire.ts` (shared flames and embers, reused; its `makeSmoke` is now unused, §11), state schema, items, puzzles, inventory UI,
input timing, vegetation and terrain beyond the bale keep-out, every upstairs / D3-b2 file.

## 11. Known issues, limitations, review points

- **No physical device.** All rendering and timing ran on SwiftShader (CPU rasteriser). Render-ms figures are relative
  fill / shader cost between builds, not phone frame times. PB01 device validation stays pending.
- **Audio by ear:** the mix levels, the drone and the pulse are tuned by reasoning, not by listening on a phone speaker;
  an owner listening pass is needed (W7). If the pulse reads as too ominous, removing it is one line.
- **Besom** reads as a stick + bundle at clearing distance; detail only shows close up.
- **W8 tufts** are a review candidate, not approved art.
- **Carry radius 12 m** (design default) keeps the bundle along the side path; 9 m would release it at the clearing rim.
- **Charred remnant at the entrance distance** reads as a dark-grey fill of the cage (clearly not empty), not as
  individual clumps; the clumps and scorched straw read from ≈ 3 m.
- `fire.ts` `makeSmoke` is no longer used (the Wickerman was its only caller); left in place to keep the shared file
  untouched.

Resolved in the refinement pass (commit `d9c9466`, after the first review handover `c64821f`): the blue-hour smoke
discs (upper puffs now swell, overlap and fade earlier), the uniform / see-through remnant (lighter ash, scorched-straw
patches, double-sided hay), the moss tint on the plinth and candle stones (moss-free stone variant, same batch group),
and the v20 plan view (it stood in the hedge and hid the bale). Draw calls and triangles are unchanged by the pass.

## 12. Integration assessment

- **D3-b2:** no shared file except `scripts/e2e-dev04d.mjs` (W01 changes line 28, D3-b2 adds a block at line 232):
  three-way merge clean. W01 is independent of D3-b2's rooms, Track 01 moon / sloop and upstairs culling.
- **Production during the work** (`6c57ced`: gravity bong in `grounds.ts` `socialGarden()`, serre air conditioner)
  merged into W01 without conflict (merge commit, no rebase / force); every suite ran on the merged tree.
- **ext-r01** (`grounds.ts` `arrival()`), **veg-art-r02**, **veg-r01**: trial merges with W01 clean.
- **Shared API** additions are additive and optional for other callers: `GameApi.carry`, `World.ritual`, `Audio.ritual`.
  Any other `GameApi` implementation (none exists besides `Game`) would need `carry`.
- **Inherited baseline issues, not W01's** (reproduced identically on production `6c57ced`, §9): the undocumented
  interactable `inspect.serreAircoBeetle` (fails the A–D id checks); the A / C relative budget guards against their
  historical pre-DEV-04A / pre-DEV-04C baselines in 20+ non-Wickerman views; the conservatory door-deck view at 183
  calls (> 150 guide) and the high-quality desktop render checks / Boslust LOD walk in the full e2e. W01 does not
  correct them (out of scope) and is not blamed for them.
- **Final integration** (when the owner approves): re-merge the then-current production, re-check `grounds.ts`,
  `game.ts`, `world.ts`, `audio.ts`, `icons.ts`, rerun the A–D suites, `e2e:dev04d-w01` and the full e2e. Do not merge
  while D3-b2 or another stream is on an unverified shared baseline. The id contract needs an owner decision on W1 and,
  separately, on production's `inspect.serreAircoBeetle`.

## 13. Definition of done (brief §11)

| # | Criterion | Status |
|---|---|---|
| 1 | Full eight-step ritual at least twice in a row | met: two cycles through real input (browser), five through the rules (unit) |
| 2 | Visual stages distinct | met: READY / RING_LIT / BURNING / CHARRED / EMPTY_FRAME / refill frames in `w01/sheets/` |
| 3 | Candles light and extinguish sequentially | met: sweep 1→9 from the nearest, extinguish 9→0 in reverse order (68–78 s) |
| 4 | No ignition before the candle ritual | met (gate in READY, EMPTY_FRAME, after a lit-ring refill) |
| 5 | Hay, clean, refill through real controls | met: action button, touch taps, bag, chip |
| 6 | Old and new saves normalise without a schema bump | met: version 4, normalisation table, fixtures |
| 7 | No mandatory progression touched | met: flags / inventory / uses / memories unchanged |
| 8 | Stylised quality at phone distance | **for owner judgement**: evidence at 915 × 412 and portrait; open points §11 |
| 9 | Audio coherent, respects settings | lifecycle, mute, locality verified; **sound by ear pending** (§11) |
| 10 | Performance deltas and regressions measured | met (§7, §9); device validation pending |
| 11 | Safely stored, isolated | met: own branch, pushed; production merged in without conflict; nothing merged / deployed |
| 12 | Owner-facing evidence complete | met: this report, `docs/dev04d/w01/` |

## 14. Release (15 Oct 2026)

| | |
|---|---|
| W01 branch / last pre-release W01 SHA | `ccr-1cffdfa6-w9jn3r` / `6f717c7` (history and evidence preserved) |
| Production integrated | `ee72f3e` → `c1bbdfe` → `cb85941` (production moved twice during the gates; each time merged in, never rebased or forced) |
| Integration commits | `b3bc527` (merge `ee72f3e`), `c8894ae` (id contract), `0a238ae` (release check), `7da1989` (merge `c1bbdfe`), `68636e3` (typing fix), `7bad60b` (merge `cb85941`) |
| Release candidate | the W01 head that carries this report (see the PR merged into `ccr-75ef4113-kfkimm`) |

**Source changes during integration** (nothing else):
- `src/audio/audio.ts`: the only conflicts, twice, in the import block (W01's `RitualMix` type next to production's
  footstep imports); both sides kept. Against production the file differs only by W01's ritual layer (+86 lines).
  `game.ts`, `world.ts`, `grounds.ts` auto-merged; production's footsteps, bong hit + cooldown, airco zap, Bosfruit
  pouch, `sfx(name, gain)` signature and `socialGarden(w, g, c)` are untouched.
- `tests/node-shims.d.ts`: production `c1bbdfe` added `tests/grassR04.test.ts`, which uses Node's `Buffer`; the project
  ships no `@types/node`, so `npm run typecheck` failed and **production's own Pages run 398 failed** (the live site
  stayed on `ee72f3e`). W01 declares the slice of `Buffer` that test reads in the project's existing shim file
  (test-only typing; no runtime change). This also unblocks production's deploy.

**Interactable-id contract** (`scripts/optional-additions.json`, loader `scripts/interactable-additions.mjs`, unit test
`tests/interactable-additions.test.ts`): the A–D and W01 suites now read one list = DEV-04C pair + W01 bale + three
optional production vignettes. 128 baseline + 6 = **134**, each registered exactly once (browser-checked).

| Id | Source / commit | Feature | Interactable by design | Writes save state | Contracts |
|---|---|---|---|---|---|
| `wicker.bale` | `wickerFire.ts` (W01) | hay bale, EMPTY_FRAME only | yes | no (session carry) | A–D, W01 |
| `inspect.serreAircoBeetle` | `serreAirco.ts`, `0381e61` | airco + electrocuted beetle inspect | yes | no (`save: false`) | A–D |
| `inspect.kitchenBosfruit` | `kitchenJuicePouch.ts`, `597fa51` | Bosfruit pouch inspect | yes | no (`save: false`) | A–D |
| `garden.gravityBong.hit` | `gravityBongInteraction.ts`, `aeb5080` | "Neem een hit" (sound, 5.6 s cooldown, toast) | yes | no (no `act`) | A–D |

None sets a flag, clue or item; none is on a required route. No id check was disabled or widened; the expected list is
exactly the reconciled registry.

**Final gates on the integrated candidate** (SwiftShader; production comparison = pure production builds of the same
commits; logs `docs/dev04d/w01/tests/release-*`):

| Gate | Candidate | Pure production | Verdict |
|---|---|---|---|
| typecheck | pass | **fails** (`c1bbdfe` / `cb85941`: `Buffer`) | corrected by W01 |
| `npm test` | 335 / 335 | — | pass |
| `test:budget` / build | 4 / 4 / pass | — | pass |
| `e2e:dev04d-w01` | 27 / 27 | n/a | pass |
| `e2e:dev04d-w01-release` (new: bong, airco, pouch, footsteps, audio coexistence, hay → item) | 8 / 8 | n/a | pass |
| `e2e:dev04a` | 18 / 19 | 17 / 19 | id check corrected; the historical relative budget guard remains (inherited) |
| `e2e:dev04b` | 9 / 9 | 8 / 9 | corrected |
| `e2e:dev04c` | 21 / 22 | 17 / 22 | id check corrected; historical budget guard remains (inherited) |
| `e2e:dev04d` | 18 / 18 | 17 / 18 | corrected |
| `e2e:dev01` / `dev02` / `dev03` | 34 / 34 · 34 / 34 · 11 / 11 | same | pass |
| `e2e` (full, run alone) | 96 / 103 | 96 / 103, **identical failures** | inherited: six desktop high-quality render checks, Boslust LOD walk |
| production `src/**/*.test.ts` (outside `npm test`) | `gravityBongInteraction.test.ts` 2 fail | same | inherited: needs a DOM (`document is not defined`); behaviour covered by the release browser check |

A first full-e2e run executed in parallel with the production run showed extra touch-tap timeouts on both builds;
re-run alone, both gave 96 / 103 with identical failures (load-induced, classified flaky / infrastructure). The full
chain ran on `0a238ae` (production `ee72f3e`); production's later `c1bbdfe` / `cb85941` changed footstep audio only,
so the audio-sensitive gates (typecheck, unit, build, W01, release check, D ids) were re-run on `68636e3` / `7bad60b`.

**Performance, candidate vs current production** (PB01 low, 915 × 412; `e2e:dev04c` budget views): every one of the
28 views identical to production except the Wickerman views — `wickermanClearing` 31 / 205,030 → 32 / 208,600,
`wickermanPath` 35 / 258,929 → 36 / 262,679, `wickerLit` 35 / 208,448 → 36 / 212,018, `wickerBurning` 43 / 220,188 →
**40 / 213,678**, `wickerPathBurning` 47 / 272,353 → **44 / 266,023** — and `arrivalCourt`, which flips ± 1 call between
runs on both builds (pool timing). All inside 750 k / 150. Stage, transparency, reduced-motion and audio-lifecycle
measurements of §7 / §9 are unchanged (production's merged changes are outside the clearing). No phone FPS exists.

## 15. Merge, deployment and live verification

| | |
|---|---|
| Pull request | [#48](https://github.com/Algolon/Feh-Lu-We/pull/48) `ccr-1cffdfa6-w9jn3r` → `ccr-75ef4113-kfkimm`, merge commit (history kept), merged with `expectedHeadSha` = the tested head `ae7b42f` |
| **Production release commit** | **`295a3b4`** "Merge DEV-04D W01: repeatable Wickerman ritual (#48)" (parents `cb85941`, `ae7b42f`) |
| Tested = released | tree of `295a3b4` = tree of `ae7b42f` (`c5a8595`); `ae7b42f` differs from the last browser-validated build `7bad60b` only in `docs/` |
| Production during the release | unchanged between the last re-integration (`cb85941`) and the merge |
| Pages deployment | workflow run [411](https://github.com/Algolon/Feh-Lu-We/actions/runs/38794768701) on `295a3b4`: build job (npm ci, typecheck, `npm test`, build, upload artifact `github-pages` 4.09 MB, digest `sha256:1075420…769c`) **success**; deploy job (configure-pages, deploy-pages) **success**, 19:33 UTC |
| Previous production deploys | runs 398 (`c1bbdfe`) and 408 (`cb85941`) **failed** at typecheck (the `Buffer` issue above), so before this release the live site still served `ee72f3e`; run 411 is the first successful production deploy since |

**Live verification — what is and is not verified.** This cloud environment's network policy denies
`algolon.github.io` and the Actions artifact storage (`*.blob.core.windows.net`): the proxy refuses both. Therefore:
- **Verified:** the deploy job of run 411 succeeded for `295a3b4`; the deployed source is byte-identical to the tested
  source; that source passes the gates of §14 in a production build, including the W01 suite (stages, bale,
  candle / figure / bale interactables, two cycles, saves) and the release check (bong hit, airco, pouch, footsteps,
  audio coexistence) with no runtime errors.
- **Not verified from here:** that `https://algolon.github.io/Feh-Lu-We/` now serves the run-411 bundle (CDN / cache),
  and a smoke test on the live URL. Quick owner check: open the game, Pauze → the build line must read
  **`295a3b4 · 2026-10-15`** (the Vite `__BUILD__` stamp); then the Wickerman clearing must show the hay bale on its
  pallet at the south-west edge. To enable the automated live smoke in a later session, allow `algolon.github.io` in the
  environment's network settings and run `node scripts/e2e-dev04d-w01-release.mjs https://algolon.github.io/Feh-Lu-We/`
  (it uses its own fresh browser profile: no player's save is touched).

**Remaining device-only review points (post-release acceptance, open):** Samsung performance and pacing (no
physical-device FPS exists; PB01 device validation pending); ritual audio balance on phone speakers / headphones (W7);
the real 80 s burn experience (W6); final visual opinion on smoke, fire, charred remnant and the W8 tufts.
