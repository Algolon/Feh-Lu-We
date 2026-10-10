# DEV-04D — Wickerman ritual lifecycle (design)

> **D0 PAUSED, PROVISIONAL (owner instruction, 10 Oct 2026).** The owner confirmed that the later FLW-D2, FLW-S3,
> FLW-K3 and partial FLW-RSV reference images exist: they were generated and approved in separate project chats and
> were never committed. Every "not available" / `WAITING_FOR_SOURCE` statement below describes **the repository at
> `6c5e5c6` only**, meaning *not yet imported*, not *does not exist*. The asset manifest, the D1 / D2 plan, the phase
> order (O1), the priorities and the owner decisions are **not final**. They will be reconciled against the imported
> FLW reference library. The room audit, captures and Wickerman design are preserved as working notes.

Status: **D0 design, for owner review. Nothing here is implemented.** Implementation is D4 (§11 of the master plan).
Baseline: production `6c5e5c6` (PR #6 / DEV-04C-R merge).

The DEV-04C rule "burned is permanent per save" (DEV-04C report §11, owner decision 2) is **superseded** by the DEV-04D
brief: the shrine becomes a repeatable physical ritual, fed from a hay bale on site. Everything else from C / C-R
stays: optional, never puzzle evidence, never a gate, no toasts (the prompt carries the state and the scene shows the
change), the candle sweep from the candle nearest the player, one action with matches carried.

---

## 1. What exists today (audited from the code)

| Part | Where | Today |
|---|---|---|
| Figure geometry | `src/world/wickerman.ts` `wickermanGeo()` | willow armature + woven bands (one merged mesh, baked vertex colours) and a separate **hay** geometry (`g.userData.hay`, prop-atlas straw sheet), both built once and shared |
| Clearing build | `src/world/grounds.ts` `wickerman()` | dry-stone plinth r ≈ 1.05 m, two sleepers, timber shoes with iron straps, collider r 1.15 m, 9 candle jars on flat stones at r ≈ 3.1 m, log bench east (x + 4.6), stake lantern at the path mouth (x − 4.2, z + 3.9); chunk `wick`, drawn within ~40–47 m |
| Setpiece | `src/world/wickerFire.ts` `buildWickerSetpiece()` | figure + hay as own meshes with a burn shader (`uChar` char front rising from the feet, `uGlow` ember band, `uEmber` spots; hay discarded below the front); candle flames = one `candles` fire revealed per candle (`uReveal`, `uStart`); effigy fire low/high, embers, smoke, smoulder; two pooled lamps; one additive floor-glow mesh; one `fire` audio emitter |
| State | `state.lit['wicker.candles']`, `state.lit['wicker.figure']` | `lit` is an open `Record<string, boolean>` (`boolRec()` in `state.ts`): no schema change was needed in C |
| Burn timeline | `WICKER_BURN = { catch 5, charEnd 62, fadeStart 66, settled 80 }` s | session clock only; a save taken mid-burn loads as the settled aftermath |
| Interactables | `wicker.candles` (9 hitboxes, one id), `wicker.figure` | the two approved C additions (130 ids total) |
| Audio | `src/audio/audio.ts` | fully procedural WebAudio, no files. One shared `fire` noise loop + random pops; emitter level = linear falloff over **10 m**, max over all fire emitters |

Observed weaknesses (DEV-04C report §11 known issues + `docs/dev04c/after/w0*.jpg`):
- effigy flames read as a stack of teardrop tongues ("petals") rather than one sheet of fire at close range;
- the smoke is a faceted low-poly column that reads as grey polyhedra overhead;
- the dry-stone plinth reads as a smooth light disc (a "cake board") from the entrance view;
- the candle ring **stays lit forever** after the burn (no closure to the ritual);
- the burn is audible only within 10 m and sounds like the campfire.

---

## 2. Lifecycle / state machine

```
            light candles (matches carried, one action, 3.6 s sweep)
 READY ─────────────────────────────────────────────► RING_LIT
 (filled, candles out)  ◄───────── blow out ─────────  (filled, ring burning)
   ▲                                                      │ ignite figure (matches)
   │ refill (carrying hay)                                ▼
 EMPTY_FRAME ◄──── clean ──── CHARRED ◄── settles ──── BURNING
 (clean frame,               (charred remnant,     (≈ 80 s, session clock;
  no hay)                     candles out)          candles go out one by one
   ▲   │                                            at the end of the burn)
   │   └── take hay at the bale (CARRYING, session-only) ──┐
   └──────────────────────────────────────────────────────┘
```

| Stage | Derived from | Figure / hay look | Candles | Interactions offered |
|---|---|---|---|---|
| `READY` | `!figure && !empty && !candles` | intact willow, full hay | out | ring: **Kaarsen aansteken** (matches carried) · figure: *Stroman — eerst de kaarsen* (no action) |
| `RING_LIT` | `!figure && !empty && candles` | intact, full hay | lit | ring: **Kaarsen uitblazen** · figure: **Stroman aansteken** |
| `BURNING` | `figure` and session burn clock `< settled` | char front rising, hay burning away, flames, embers, smoke, strong flicker light | lit, then **extinguish one by one** during the last seconds | ring: none · figure: none (label `null`: nothing to do while it burns) |
| `CHARRED` | `figure` and (settled or loaded) | blackened willow, **charred hay remnant** inside the cage + ash heap on the plinth, faint ember spots fading | out | figure: **Stroman schoonmaken** · ring: **Kaarsen aansteken** (optional, harmless) |
| `EMPTY_FRAME` | `empty && !figure` | clean willow frame, no hay, no remnant | as left | figure: *Lege stroman — haal hooi* (no action) / **Hooi in de stroman stoppen** while carrying · bale: **Hooi pakken** |
| `CARRYING` (sub-state of `EMPTY_FRAME`) | session variable `carrying` | — | — | figure: **Hooi in de stroman stoppen** · bale: **Hooi terugleggen** |

Rules:
- The figure can be ignited only in `RING_LIT` (unchanged C gate). In `EMPTY_FRAME` it cannot be ignited: nothing
  to burn (label says *Lege stroman*).
- The ring can be lit in every stage except `BURNING`, and blown out in every stage except `BURNING` (the ritual runs
  its course; no half-lit rings mid-burn). Lighting the ring around an empty frame is allowed and meaningless (decor).
- The bale is interactable **only** in `EMPTY_FRAME` (World = where to go, Focus = what is usable). In every other stage
  it is scenery with no prompt.
- Refill is **one bundle, one trip** (default; see owner decision W3). The bale is an unlimited source.
- Every transition is an explicit player action except two automatic ones: `BURNING → CHARRED` (time) and the candle
  extinguish at the end of the burn.

---

## 3. Save representation (version 4 preserved — no schema change)

Smallest backward-compatible representation: **one new boolean key in the existing `lit` record**.

| Key | Meaning in D | Meaning in C / C-R | Change |
|---|---|---|---|
| `lit['wicker.candles']` | ring burning | ring burning | unchanged |
| `lit['wicker.figure']` | figure **burned and not yet cleaned** (burning in-session or charred) | figure burned (permanent) | meaning narrowed: cleaning now clears it |
| `lit['wicker.empty']` *(new)* | frame cleaned, **no hay yet** | — | new key, absent = filled |
| carrying hay | **not saved** (session only) | — | — |

Why `lit` and not `flags`: `lit` already holds the whole setpiece (the burn is a fire state), it is an open boolean
record that every v4 save already parses (`boolRec()`), and nothing that reads `flags` (objectives, hint system,
thread tracker, DEV-01 slice, e2e "no puzzle flag set by the setpiece") can ever see it. No migration step, no version
bump, no new top-level key.

Why carrying is not saved: a carried bundle is a few seconds of state between bale and figure, 3–6 m apart. Not saving
it means a reload can never produce a bundle in an odd place (the save pose can be anywhere). Reloading while carrying
lands in `EMPTY_FRAME` without hay: one more bale tap. Coherent and cheaper than persisting a held object.

### 3.1 Load normalisation (documented, deterministic)

Applied in the setpiece's `onSync` the first time state is seen; written back with the next save:

| Saved combination | Loads as | Note |
|---|---|---|
| none of the keys (new game, pre-DEV-04C save) | `READY` | as today |
| `candles` only | `RING_LIT` | as today (ring restored fully lit, no sweep replay) |
| `figure` (C / C-R save: the old permanent aftermath), with or without `candles` | `CHARRED`, **candles out** | the C rule left the ring lit after the burn; in D a completed burn extinguishes the ring. A C save that kept the ring lit therefore loads with the ring out. This is the one intentional reinterpretation, and it is documented here and in the D4 report |
| `figure` saved mid-burn in D | `CHARRED`, candles out | same as C: a save never restores a running burn |
| `empty` | `EMPTY_FRAME` (candles as saved) | |
| `figure && empty` (impossible through play) | `EMPTY_FRAME` (`figure` cleared) | defensive: cleaning sets `empty` and clears `figure` in one action, so this only appears in a hand-edited save |

Old saves where `wicker.figure = true` currently means "burned" resolve to `CHARRED`: the player sees the familiar
aftermath and can now clean it. Nothing is lost, nothing is silently reset to a filled figure.

---

## 4. Hay bale

**Form**: one compact rectangular two-string bale (the brief's default; nothing in the references argues for a round
bale, and a round bale would dominate a 6 m clearing).

| Property | Spec |
|---|---|
| Size | ≈ 0.95 × 0.48 × 0.38 m (L × W × H), a small square bale, liftable by one person: believable as the source of a carried bundle |
| Construction | slightly bulged soft box (crafted, not a cube); cut ends show darker straw ends, long sides show stalks along the length (prop-atlas `straw` sheet, the hay of the figure, so the source visibly matches); two dark twine bands, tension dents where they cross the edges |
| Use traces | one loosened corner with a pulled tuft standing out of the top; a few loose stalks on the ground beside it; a faint flattened patch of grass where it was dragged in |
| Grounding | stands on a **low timber pallet / two sleepers** (≈ 0.12 m, the same timber as the figure's sleepers) that keeps the hay off the damp ground; the pallet sits on the terrain with a 2–3 cm sink and a contact-shadow decal, seated on the terrain plane (sample the four corners), never floating |
| Companion prop (default yes, owner decision W4) | a twig besom leaning against the bale: explains the cleaning without an inventory tool. Pure scenery, no interactable |
| Placement | at the **south-west edge** of the clearing, ≈ (x − 3.6, z − 3.7) = (176.4, 51.3), ≈ 5.2 m from the figure and ≥ 1.5 m outside the candle ring, long side tangential to the clearing. Clear of the side-path mouth (north-west), the stake lantern and the log bench (east). From the entrance view (`x27`) it sits ≈ 35° right of centre: seen, but secondary to the figure. Final position confirmed on the D4 plan capture (`x30-wickerman-plan`) and the walk line |
| Collision | one box collider over pallet + bale (≈ 1.0 × 0.55, top ≈ 0.50 m). The player's step-up is **0.42 m** (`PLAYER.stepUp`): a bare 0.38 m bale would be walkable, the pallet lifts the top above step-up so the bale is an obstacle, not a step |
| Vegetation | the clearing only keeps *small* vegetation out within r − 2.5 m (`vegetationClear` → `inWickermanClearing(-2.5)`): the bale footprint needs its own keep-out so grass / flowers do not grow through it |
| Batching / culling | static parts (bale, twine, besom, loose stalks) go into the `wick` chunk batch: **no extra draw call** in normal stages; one hitbox group for the interactable |

---

## 5. Interactions (prompts are the feedback; no toasts, no modal)

| Stage | Target | Prompt (Dutch, matches the C voice) | Action | sfx |
|---|---|---|---|---|
| READY | figure | *Stroman — eerst de kaarsen* | none (`locked` tick) | `locked` |
| READY / CHARRED / EMPTY | ring | **Kaarsen aansteken** / *Kaarsen (geen lucifers)* | sweep 3.6 s | match strike per candle (soft) |
| RING_LIT | ring | **Kaarsen uitblazen** | out | soft puff per candle |
| RING_LIT | figure | **Stroman aansteken** / *Stroman (geen lucifers)* | ignite | `fire` + ritual layer (§8) |
| BURNING | figure, ring | *(no prompt)* | — | — |
| CHARRED | figure | **Stroman schoonmaken** | 1.8 s clean transition (§6) | brush / ash sweep |
| EMPTY_FRAME | figure | *Lege stroman — haal hooi* | none | `locked` |
| EMPTY_FRAME | bale | **Hooi pakken** | carrying = true | straw rustle |
| CARRYING | figure | **Hooi in de stroman stoppen** | 1.6 s refill (§6) → READY | rustle |
| CARRYING | bale | **Hooi terugleggen** | carrying = false | rustle |

**Carried hay (no permanent inventory item)**:
- A session-only `carrying` flag owned by the setpiece; not an `ITEMS` id, never in `state.inventory`, never in the bag.
- Shown in the existing **held chip** (`ui.setHeld(name, icon)`) as *Bundel hooi* with a new `hay` icon in
  `ui/icons.ts` (icons are keyed by string; an icon does not require an item). Tapping the chip ("tik om los te
  laten") puts it back. No modal, no toast.
- Taking hay clears any selected item (one thing in the hand); selecting an item from the bag puts the hay back.
- Carrying is **local to the clearing**: walking out of it (> 12 m from the figure) puts the hay back on the bale
  (no prompt, the chip simply clears). The bundle never travels to the manor.
- Needs one small `GameApi` addition, e.g. `carry(label: string | null, icon?: string)`, routed through `Game` so the
  held chip and `selected` stay consistent. No change to the notebook, inventory UI or input timing.

---

## 6. Visual state changes

| Transition | What the player sees | Mechanism (reuses the C burn shader family) |
|---|---|---|
| light ring | candles light one by one from the nearest | unchanged (`uReveal`, `uStart`) |
| ignite → burn | unchanged C timeline (`burnLook`), with the D4 polish of §9 | `uChar`, `uGlow`, `uEmber`; fires low / high; embers; smoke |
| end of burn | flames die; at `fadeStart … settled` the candles go out **one by one in reverse sweep order**, each with a tiny wisp | `uReveal` animated 1 → 0 (the jar glow and floor patches already follow it); state write `candles = false` at settle |
| CHARRED | blackened willow (`uChar = 1`); **charred hay remnant**: lumpy black / grey clumps inside the torso and legs (≈ 50 % of the hay volume, the rest burned away) + a low ash heap on the plinth between the feet, a few ember spots that fade out over ~60 s | remnant = the hay geometry drawn with a remnant material (black / ash palette, noise discard ≈ 50 %), plus a small ash-heap mesh; both visible only in CHARRED (+1–2 draw calls in that stage only) |
| clean (1.8 s) | a puff of ash at the feet, the remnant crumbles away from the top down, the char front **recedes downward** to a clean willow frame, the ash heap shrinks to a faint scorch | `uChar` animated 1 → 0 top-down, remnant discard threshold animated, ash puff = the existing ember/smoke system for 1 s |
| EMPTY_FRAME | the willow cage with nothing inside: the armature reads clearly against the hedge | hay mesh hidden |
| refill (1.6 s) | hay visibly **grows into the cage from the feet up** (legs, torso, arms, head), wisps last | hay shader gets an upper discard front `uFill` (0 → 1): discard above the fill front. Same material, one uniform |
| READY | identical to the first-visit figure | — |

Permanent "used" detail (default yes, owner decision W5): a faint scorch on the timber shoes, sleepers and plinth top
in every stage, including the first visit. It tells "this has burned before" without tracking a burn count, so a
fresh game and a twentieth cycle look the same.

Believability note: real willow would burn away. The stylised contract (already in C) is that the armature survives
the burn. Cleaning therefore means clearing ash and remnant, not rebuilding the willow. This matches the reference's
"internal armature (wood/metal)" inset and keeps the cycle affordable.

---

## 7. Technical approach (D4)

- **Pure rules** in `wickerFire.ts` (unit-testable, no renderer): `wickerStage(state, session)`, `cleanFigure(s)`,
  `refillFigure(s, carrying)`, `normaliseWicker(s)`; `igniteFigure` gains the `!empty` precondition; `blowCandles` and
  `lightCandles` refuse during `BURNING`. `burnLook` unchanged; the end-of-burn extinguish is driven from the update
  loop at `WICKER_BURN.fadeStart … settled`.
- **New interactable**: `wicker.bale` (the bale's hitbox group). **131 ids**. Needs owner approval (decision W1),
  recorded in a `scripts/dev04d-additions.json` beside `dev04c-additions.json`; the A/B/C suites keep failing on any
  undocumented addition or removal.
- **Cleaning and refill** reuse `wicker.figure` (its label and action switch on stage): no further id.
- **GameApi** `carry()` (§5). `Game.select()` puts the hay back; the held-chip tap routes to the setpiece.
- **Materials / draw calls**: normal stages unchanged. CHARRED +1–2 calls (remnant, ash heap). The bale and besom are
  batched. Budget views `wickermanClearing` / `wickermanPath` stay inside the guide (today 31 / 160 k and 35 / 211 k).
- **Audio**: §8.
- **Superseded tests** (deliberate, listed in the D4 report): `tests/dev04c.test.ts` "igniteFigure refuses a burned
  figure / permanent aftermath" and `e2e:dev04c` "save / load: the lit ring and the burned figure persist" (`re.candles
  && re.flames` after the burn) are rewritten to the D lifecycle; everything else in those suites stays as is.

---

## 8. Audio concept — the burn (procedural, no files)

**Architecture fit**: all sound is synthesised in `Audio` (WebAudio, one shared noise buffer, filtered loops, scheduled
transients). No audio asset exists in the repo, and none is needed: the layers below are oscillators and filtered
noise. **No music file, no internet audio, nothing copyrighted.** If the owner later wants a recorded or composed layer,
that is a `WAITING_FOR_SOURCE` slot (§8.4), not something D imports.

### 8.1 Layers

| # | Layer | Synthesis | Follows |
|---|---|---|---|
| 1 | **Fire body** (roar) | noise → lowpass, cutoff 300 → 900 Hz and gain rising with flame size | `max(flameLow, flameHigh)` |
| 2 | **Burning willow** (crackle and snaps) | random transients: short high-passed clicks (as today) plus rarer deep cracks (bandpassed 160–220 Hz thump + click); rate ∝ intensity, capped at ~6 per second | flame size, char front |
| 3 | **Drone** (ritual undertone) | two oscillators a fifth apart (≈ 55 Hz triangle + 82.4 Hz sine, 0.3 Hz detune beat) → lowpass 400 Hz; max gain ≈ 0.04, a bed you feel more than hear | slow swell over the build, full at the peak, gone by the end of the decline |
| 4 | **Pulse** (restrained frame-drum heartbeat) | low tone 70 → 48 Hz, 0.35 s decay, every ~1.9 s in the build and ~1.5 s at the peak; never accelerates into a panic rhythm; only within ~18 m | build + peak only |
| 5 | **Air** (updraft / wind texture) | noise → bandpass ≈ 600 Hz, Q 0.7, slow LFO; gives the column a breath | intensity, a touch of `dusk` |
| 6 | **Aftermath** | ember hiss (very quiet high-passed noise), one low settling thump + short crumble when the burn settles, then the candle puffs one by one | settle, then silence; the clearing ambience returns |

Arc over the existing timeline (`WICKER_BURN`): **catch** 0–5 s (match, fire body, first cracks) → **build** 5–20 s
(drone fades in, pulse starts) → **peak** 20–50 s (all layers, densest crackle) → **decline** 50–66 s (pulse stops,
drone thins) → **settle** 66–80 s (hiss, settling thump, candle puffs) → silence.

Tone: strange, memorable, slightly esoteric, playful-dark. Consonant interval (fifth), slow tempo, no stingers, no
sudden loud hits, no dissonant swells, no voices, no horror vocabulary.

### 8.2 Locality

- Ritual level = intensity × distance gain: full within 8 m, smooth fall to 0 at 35 m (the clearing is screened by
  woodland, so it should be audible from the loop path as a far crackle, not across the estate). Indoors = 0.
- The drone and pulse use a shorter radius (fade out by ~22 m) so far away only the fire and cracks remain: a natural
  "you hear a fire somewhere" cue.
- Respects mute, tab suspend, and the existing master gain.

### 8.3 Cost

Nodes are created on ignition and torn down after the aftermath (or when the player is > 40 m away), so the normal
game pays nothing. While active: ≤ 5 continuous voices (2 oscillators + 3 filtered noise loops on the shared buffer)
plus capped transients. The existing global `fire` loop stays for the candles / campfire. Audio sits behind a new
`Audio.ritual(level, phase)` method and a small change in `Game.updateAudio()` to pass the clearing's look and distance;
no change elsewhere.

### 8.4 Missing source (flagged, not blocking)

No recorded or composed audio exists. Procedural layers are the D4 plan. **Optional future slot**
`WAITING_FOR_SOURCE`: an owner-supplied original loop (e.g. a hand-played frame drum or a drone recording, licence
clear) could replace layer 3 or 4 through the same `ritual()` envelope. Not required for D.

---

## 9. D4 polish bundled with the lifecycle (P2, separable)

1. **Sheet fire**: replace the effigy's teardrop "petal" stack with fewer, broader flame sheets that follow the limbs
   (same `makeFire('custom')` path, wider tongues, merged), so close range reads as one fire.
2. **Smoke**: softer column (more, smaller, rounder puffs with alpha falloff), no faceted polyhedra overhead.
3. **Plinth**: dry-stone read (stone course breakup, darker joints, cap stones) instead of a smooth light disc.
4. **Candle stones**: the flat stones under the jars barely read in the grass; a slightly larger, darker stone each.

Each is optional, measured against the `wicker*` budget views, and can be dropped without affecting the lifecycle.

---

## 10. Test cases

Unit (`tests/dev04d.test.ts`, pure rules):

1. `wickerStage` for every key combination (incl. `figure && empty` → EMPTY_FRAME).
2. READY → light → RING_LIT → ignite → BURNING (figure true) → settle → CHARRED with `candles === false`.
3. `igniteFigure` refused in READY (ring out), EMPTY_FRAME (no hay), CHARRED, BURNING.
4. `cleanFigure` only from CHARRED: sets `empty`, clears `figure`; refused in every other stage.
5. `refillFigure` only from EMPTY_FRAME **with** carrying; clears `empty`; refused without hay.
6. Bale: take only in EMPTY_FRAME; put back; carrying never touches `inventory`, `used` or `flags`.
7. Ring: no light / blow during BURNING; allowed in READY, RING_LIT, CHARRED, EMPTY_FRAME.
8. Normalisation table §3.1 (all rows), and C/C-R saves `{candles:true, figure:true}` → CHARRED, candles out.
9. Two full cycles in a row end in the same READY state as a new game (no drift).
10. `parse → serialise` round trip keeps version 4 and the three keys only.

e2e (`e2e:dev04d`, real input, reticle + action button):

11. Full cycle through real input: light (sweep monotone, 9 lit), ignite, burn to settle (simulated clock), candles go
    out one by one (monotone decreasing count), clean, take hay (held chip shows *Bundel hooi*, bag unchanged), refill
    (hay grows: fill uniform monotone), back to READY. No toast at any step.
12. Reload in each stable stage (READY, RING_LIT, CHARRED, EMPTY_FRAME): same stage after reload; version 4.
13. Reload while carrying → EMPTY_FRAME, not carrying.
14. Reload mid-burn → CHARRED, candles out.
15. Old-save fixtures: pre-C (no keys) → READY; C/C-R aftermath (`candles + figure`) → CHARRED, candles out.
16. Walk out of the clearing while carrying → chip clears, still EMPTY_FRAME.
17. Selecting matches while carrying puts the hay back.
18. Ids: baseline 128 + `wicker.candles`, `wicker.figure`, `wicker.bale` (if approved); nothing else.
19. Render budget: `wickermanClearing` / `wickermanPath` in READY, BURNING and CHARRED inside the guide.
20. Audio (headless-safe): the ritual node graph is created on ignition and released after the aftermath; level is 0
    beyond 35 m and indoors (asserted on the computed level, not on sound output).

Regression: `e2e:dev04c`, `e2e:dev04b`, `e2e:dev04a` and the full suites stay green, apart from the superseded
permanence assertions listed in §7, which are rewritten, not deleted.

---

## 11. Owner decisions for this design

| # | Decision | Default if the owner agrees |
|---|---|---|
| W1 | Approve one new interactable id `wicker.bale` (→ 131 ids) | yes |
| W2 | Accept the new save key `lit['wicker.empty']` and the C-save normalisation (burned + lit ring → charred, ring out) | yes |
| W3 | Refill = one bundle, one trip (vs. two or three trips for legs / body) | one trip |
| W4 | Besom leaning on the bale as the visual explanation of cleaning (no tool item) | yes |
| W5 | Permanent faint scorch on shoes / sleepers / plinth in every stage (shrine "has burned before") | yes |
| W6 | Burn length stays ≈ 80 s per cycle (vs. ≈ 60 s for a repeatable ritual) | keep 80 s; revisit after a phone play |
| W7 | Procedural ritual layer as specified, no recorded / composed audio | yes |
