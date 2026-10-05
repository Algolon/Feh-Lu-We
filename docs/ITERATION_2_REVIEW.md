# Iteration 2 — review findings: reproduction, fixes, status

Source of findings: [`docs/REVIEW_ITERATION_2_PROMPT.md`](REVIEW_ITERATION_2_PROMPT.md) (independent review, 5 Oct 2026).

## Baseline

| | |
|---|---|
| Baseline commit | `58a0810` ("Record successful Pages deployment") — identical to the reviewed commit |
| Deployed baseline | https://algolon.github.io/Feh-Lu-We/ — baseline build produces `assets/index-DMMDx5q8.js` / `index-B4w46lTY.css`, the filenames the review saw live |
| Baseline build size | JS 757.08 kB (209.39 kB gzip), CSS 10.05 kB (2.83 kB gzip), HTML 1.34 kB |
| Test environment | Linux container, headless Chromium 1194 with **SwiftShader software WebGL**; `vite preview` under `/Feh-Lu-We/`; touch via Chrome DevTools Protocol multi-touch. No GPU, no real phone. |
| Live page from this session | Not loadable: `github.io` is blocked by this session's egress proxy. Deployment is verified through GitHub's workflow/deployment status only. |

Reproduction method: a new `regressions` suite in `scripts/e2e.mjs` that drives the real game (UI clicks, CDP touch,
real picking). It was run against the unmodified baseline build first: **F01, F02, F03, F04 and F05 all failed
(reproduced)**, then passed after the fixes.

## Findings

| ID | Status | Reproduction (baseline) | Fix | Validation |
|---|---|---|---|---|
| F01 saved-open doors look closed | **Fixed** | `door.corridor`/`door.front` saved open → hinge `rotation.y` 0 after reload | `makeDoor` derives the restored angle on first sync; collider is solid while the leaf is < ~25° open, so collision follows the visible leaf | regression F01 (angle 1.6 rad); forecourt screenshot now shows the open front door |
| F02 interaction through the ceiling | **Fixed** | From the living room below the study, `inspect.studyNote` was targetable | Storey slabs registered as **interaction-only occluders** (`addOccluder`: block line of sight, never movement); culled objects are never pickable (explicit invariant) | regression F02; unit test "occluder-only slabs"; glass/closed-cabinet check B2 |
| F03 selected key blocks unlocked door | **Fixed** | With the study key held, label "Gebruik: Messing sleutel" and nothing happened | Contextual item resolver (`itemLabel`): held items apply only while meaningful (locked door, unlit fire, crank not installed); otherwise the default action runs and the label says so | regression F03 (label "Openen", door opens) |
| F04 stale delayed lock submission | **Fixed** | Correct 3-button entry, then opening the bag → the late callback closed the bag | Button locks submit synchronously with an immutable copy; no timer exists any more | regression F04 |
| F05 taps only in the right 58 % | **Fixed** | Stationary tap on an object in the left zone did nothing | Short stationary tap in the joystick zone also performs a screen-space interaction (same thresholds as the look zone: <12 px, <350 ms) | regression F05 (tap at x=270 of 844) |
| F06 shed guidance leaves the token | **Fixed** | Rules advanced to the fire beat with only kindling | Shed beat needs kindling **and** token (in bag, used, or in a niche); niche panel names a missing token/crest and where to look | unit tests "guidance (F06)" |
| F07 playtime undercounts | **Fixed** | `playMs` grew only without modals, from capped sim delta | Save v3: `activeMs` (incl. reading/panels/notebook/hints), `moveMs`, `pausedMs` (pause menu + hidden tab), frozen `finishedActiveMs`; real elapsed time per frame (cap 5 s for stalls) | regression F07 (panel → active, pause → paused) |
| F08 lantern prefix feedback | **Fixed (redesigned)** | Wrong first/second lantern reset immediately | Complete-attempt evaluation: every partial input gets the same acknowledgement; only the third lantern evaluates; wrong → all three briefly burn, then go out (attempt only) | unit tests "garden lanterns (complete attempt)"; walkthrough step with a full wrong attempt |
| F09 repeated symbol-order entry | **Partly addressed** | — | Cabinet puzzle is now a physical in-world manipulation (four numbered wheels), study uses an explicit route on the map, lanterns are an environmental configuration. The drawer dial and study buttons remain code entries (deliberately: the early "teach ordering" puzzles). No new puzzle added. | see D below |
| F10 reduced motion incomplete | **Fixed** | Fire/steam kept animating | World-level flag: flames hold a still pose, steam column static, water texture static, light flicker off, UI transitions off | regression F10 |
| F11 concentric circle push | **Fixed** | Body at a trunk centre was not ejected | Deterministic +x push-out, then re-resolve | unit test "pushes … centres coincide" |
| F12 unknown save ids | **Fixed** | Arbitrary inventory/slot ids survived parsing | Parser validates against item/clue/symbol registries, clamps hints/attempts/stats, bounds poses; UI dereferences guarded | unit tests "save validation (F12)"; regression F12 (bag still opens) |
| F13 start/WebGL lifecycle | **Fixed** | Repeated Start not guarded; WebGL1 accepted; context loss only toasted | Start/Continue idempotent with loading state (and `Game.start` guard); WebGL2 required; context loss pauses rendering + input, saves, shows a recovery dialog, resumes on restore, offers reload | regressions "repeated Start", "context loss" (via `WEBGL_lose_context`) |

### Additional observations from the review

| Observation | Outcome |
|---|---|
| Culled meshes left hitboxes enabled | Made explicit: `World.isCulled()` removes culled objects from input eligibility. |
| Open-door collision vs swinging leaf | Collider now follows a leaf-angle threshold; closing is refused while the player stands in the **swing area** (not just the closed panel), and a closing leaf holds if the player steps into it. A moving leaf proxy was not added (simplified simulation, documented). |
| "Morning sun" study rule | Replaced by an explicit dashed **"ochtendwandeling"** route with arrows and "start" on both the framed 3D map and the notebook SVG. |
| Static map without pose | Map now shows a "you are here" arrow with heading, unvisited sites as "?", and an upstairs floor sketch when inside the upper manor. |
| Proximity light assignment leaks through walls | Pool assigns lights only to lamps in the player's lighting zone (room/building/outdoors) with hysteresis and stable light slots. Visual leak testing on real GPUs still pending. |
| Draw-call numbers not re-measured | Re-measured **both** baseline and new build at identical viewpoints — see `ITERATION_2_VALIDATION.md`. |

## Problems found only after looking at the game (not in the review)

Screenshots from the baseline build (`docs/iteration-2/before/`) showed two evidence bugs that undermined fairness:

1. **Mantel objects were embedded in the chimney breast.** The feather — one of the three required pictograms — was
   effectively invisible in the 3D scene. Fixed: shallower breast, objects moved forward and drawn at 1.6× with
   distinct silhouettes (feather now stands in an inkpot), plus a "links ⟶ rechts" plaque as a reading anchor.
2. **The pool mosaic was never visible.** The "land beyond the estate" plane ran under the pool basin (water read as
   flat green), and the mosaic planes sat 3 cm below the floor surface. Fixed: the outer land is a frame around the
   estate (one merged mesh), mosaics raised. The four shapes are now readable from the shallow end.

Also changed after seeing the game: the forecourt planter tree hid the front door from the driveway (removed); the
roof read as a flat slab from eye height (now ≈30° with dormers and a projecting entrance bay with pediment).

## Proposals not implemented (and why)

- **New optional environmental puzzle:** not added. Core fixes, two reworks and the evidence repairs took priority;
  the review asks for at most one and only after those.
- **Joystick handedness/position option:** not added (review: only if it doesn't distract from core fixes).
- **Moving door-leaf collision proxy:** threshold + sweep-area safety chosen instead (no physics).
- **Audio changes:** not made; audio still unheard by any reviewer (headless). Listening test remains pending.
