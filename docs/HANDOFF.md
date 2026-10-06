# Feh Lu We — status, verification record and handoff

Last updated: 2026-10-06. Branch: `ccr-75ef4113-kfkimm` (the repository was empty before this work).

## Art refresh, step 3 (5 Oct 2026) — BOSLUST exterior sample (proposed, not approved)

The approach from the fork signpost through the hillside cut to the BOSLUST door is rebuilt in a bounded zone
(plan X 38–88, Z 0.6–48). It adds a broadleaf oak (two variants), a Scots pine, rocks, understory, a rock-walled
cut, an embedded rubble entrance with an oak frame and lanterns, a jointed signpost, a forest floor and the path
verge.
- **Opt-in only:** `?review=boslust` (sandboxed review mode, starts at the fork, comparison bar) or
  `?ext=sample&light=sample`.
- **Normal game unchanged:** pixel-identical captures and identical metrics at the step-1 BOSLUST poses.
- **Gameplay contract tested identical:** colliders, interactables and lights in the zone; vegetation outside it;
  the full entrance sequence by walking.
- **Cost:** door view 151 draw calls (baseline 154). Triangles ~300 k in the busiest views, above the 250 k
  guide. Not measured on a phone.
- **Details, evidence and self-critique:**
  [`art-refresh/EXTERIOR_SAMPLE.md`](art-refresh/EXTERIOR_SAMPLE.md).
- **Revision 1 (owner feedback on variety):**
  - Four tree species: oak, beech, birch and Scots pine, with three variants each.
  - Hazel and holly bushes, three variants each.
  - Six plant kinds with three or four variants each, placed by ecology.
  - Everything renders in three batched meshes. The door view drops to 142 draw calls (baseline 154), and
    triangles peak at ~350 k.
- **Consolidation pass (revision 2, 6 Oct 2026; proposed, not approved):**
  - Rendering works with and without `WEBGL_multi_draw`: two batched calls for all vegetation, or an instanced
    fallback (forced with `?multidraw=0`, works with `?debug=1` and review mode). Same triangles in both paths.
  - Measured at fork, approach, doorway, reverse and busy views (phone quality): multi-draw 47–142 calls,
    122–249 k triangles (within the 150 / 250 k guide; was up to 350 k). Fallback 76–175 calls — over the
    call guide by up to 25 at four views (cause and next remedy in EXTERIOR_SAMPLE §7).
  - Trees grown from branch skeletons with integrated buttress roots, three LODs from one layout; looser Scots
    pine; multi-stem hazel; readable holly; soft path verge; headwall stepping into the hill; backdrop row beyond
    the fence.
  - Verified here: unit 94/94; browser regression 102/102 (one stale test constant corrected and rerun); normal
    game pixel-identical at five poses; multi-draw and forced fallback pixel-identical at three poses.
  - CI: runs #17 (`c853918`) and #18 (`214db1e`) — build and deploy succeeded. Live page not loaded from the
    authoring environment (github.io unreachable there); confirm the build id on a phone.
  - Phone check guide: EXTERIOR_SAMPLE §1.1. **No device results yet.**
  - Tools: `scripts/ext-measure.mjs` (five-view measurements, both paths), `WALK=boslust-full node
    scripts/art-walk.mjs` (walkthrough incl. the door and stair).
- **Stabilisation pass (revision 3, 6 Oct 2026; proposed, not approved):**
  - Owner's phone review of revision 2 (qualitative, one device): works well, feels improved, no jittery
    overlapping pixels or models noticed. Unrecorded: device/browser, measured FPS, forced-fallback use.
  - Placement is deterministic per object (`src/world/woodlandPlan.ts`): adding a backdrop tree or changing a
    species' variants no longer rearranges bushes or ground cover (unit-tested). One-time re-roll: bushes,
    plants, litter and stones moved; trees kept position, species, variant and size but got new headings and
    colour jitter.
  - The two original stumps standing inside a tree's base are drawn as moss-capped nurse stumps covering their
    unchanged colliders (e2e-checked).
  - Reusable kit interfaces and what is still layout-bound: EXTERIOR_SAMPLE §11.
  - Measured (multi-draw): 47–142 calls, 120–251 k triangles; the busy view is 0.4 % over 250 k after the re-roll
    (documented, not re-tuned). Fallback: same triangles, 71–174 calls.
  - **Broader rollout waits for the settled level design** of the house and estate (being developed separately).
- **Not started:** estate-wide propagation. It waits for the owner's review of both samples and the new layout.

## Art refresh, step 2 (5 Oct 2026) — interior sample (proposed, not approved)

The living-room hearth corner is rebuilt with a small art kit.
- **Opt-in only:** `?review=living` (a sandboxed review mode with a comparison bar) or `?art=sample&light=sample`.
- **Normal game unchanged:** without parameters it builds the original room (identical metrics and pixels at the
  baseline poses).
- **Details:** [`art-refresh/INTERIOR_SAMPLE.md`](art-refresh/INTERIOR_SAMPLE.md).
- **Not started (at step 2):** the exterior sample (now step 3, above) and any estate-wide rollout.

## Art refresh, step 1 (5 Oct 2026) — target, baseline, review gate (no game changes)

Planning only. The visual target is a crafted European woodland manor:
[`art-refresh/STYLE_TARGET.md`](art-refresh/STYLE_TARGET.md). The gate every sample must pass is
[`art-refresh/REVIEW_CHECKLIST.md`](art-refresh/REVIEW_CHECKLIST.md).

Baseline captures (15 poses at phone quality, each as game, neutral-light and clay) are in
[`art-refresh/baseline/`](art-refresh/baseline/README.md), made with `scripts/art-baseline.mjs`.

**Measured finding:** the BOSLUST door pose uses 154 draw calls, over the 150 phone budget.

**Next:** two bounded samples (hearth corner, BOSLUST approach), after the owner decides the open questions in
STYLE_TARGET §9.

## Iteration 3 (5 Oct 2026) — "Het huis dat zich herinnert"

Driven by the iteration-3 implementation prompt and five art-direction images. Design: [`ITERATION_3_DESIGN.md`](ITERATION_3_DESIGN.md);
art: [`ART_DIRECTION.md`](ART_DIRECTION.md); evidence: [`ITERATION_3_VALIDATION.md`](ITERATION_3_VALIDATION.md); spoilers:
[`PUZZLE_SOLUTIONS.md`](PUZZLE_SOLUTIONS.md). Delivered in checkpoints:

1. **CP1** (`5e84349`): pictorial colour icons restored; mantel drawer rule made fair (brass stands, read facing the
   hearth, no answer plaque); room/portal-based persistent lighting with hysteresis; visible flames in front of the
   hearth recess; reduced motion holds flames steady.
2. **CP2 + CP3** (`1997ea8`): 180 × 150 estate on a terrain heightfield; manor rebuilt with 26 named rooms, service
   wing, basement; conservatory + sauna moved; BOSLUST hill, cut, real stair, chambers and tunnel; floor-tab map;
   three threads with seals, convergence, cipher, plates and finale; thread-aware notebook and hints; save v4 with
   migration and set-aside restarts; draw-call/triangle budgets met.
3. **CP4/CP5** (this commit): storybook woodland details (toadstools, stumps, grass tufts), meadow grass; docs,
   evidence screenshots and metrics; deployment check below.

Still pending: real-phone checks (frame rate, touch feel, iOS Safari), a human playtest of the new route, audio
listening, replacing placeholder memories with authentic ones.

## Iteration 2 (5 Oct 2026) — independent review fixes

Work driven by [`REVIEW_ITERATION_2_PROMPT.md`](REVIEW_ITERATION_2_PROMPT.md). Findings, reproductions and fixes:
[`ITERATION_2_REVIEW.md`](ITERATION_2_REVIEW.md); tests, before/after metrics and screenshots:
[`ITERATION_2_VALIDATION.md`](ITERATION_2_VALIDATION.md).

- All 13 review findings handled (F09 partly by design); F01–F05 were reproduced in the browser on the baseline first.
- Two additional evidence bugs found from screenshots and fixed: mantel objects hidden in the chimney breast (the
  feather pictogram was invisible) and a pool mosaic that was never visible.
- Reworked puzzles: lantern circle with complete-attempt evaluation and a visible link to the conservatory; cabinet
  opened by four numbered in-world symbol wheels; study rule replaced by an explicit dashed route.
- Save format v3 (automatic migration from v2). Timing now separates active/moving/paused; local event log and build
  id in feedback.
- Still pending: real-phone checks, human playtest, audio listening, room-light leakage on a real GPU.

## What runs

A complete static browser game (TypeScript + Vite + Three.js) that is solvable from the home tutorial to the
ending, on desktop and with touch:

- **Home tutorial** (separate compact scene): look, walk, pick up, inventory, item use (matches → candle), lamp,
  drawer with the estate key, contextual refusal at the door until the five essentials are packed.
- **Estate** 120 × 100 units following the written plan: forest south half with looping paths and four sites;
  manor (vestibule, double-height hall with chandelier and gallery, living room with working fireplace, dining,
  kitchen, service corridor, billiard room, real staircase with hidden ramp to a landing, locked study, storage);
  glazed conservatory with the pool **inside** and a walkable perimeter; enterable barrel sauna **outside to the
  east** with a heater; open grassy garden with dining terrace, three lantern posts, one path to the cottage;
  Portuguese cottage with terraces, pond, two niches and the gated gathering room.
- **Interactions** via one shared API: 18 hinged doors/gates/cabinet doors (keyed, puzzle-gated, no-crush),
  5 sliding drawers (each holding a pickup), 12 pickups, 14 player-toggleable lamps plus puzzle-driven lanterns,
  two fires (light/extinguish), sauna heater, inspectables that record clues, item-on-target use with feedback
  for wrong combinations.
- **Puzzle chain**: 8 required beats + optional billiard pattern panel + 9 placeholder memories. Three escalating
  hints per required puzzle, hint use and wrong attempts recorded.
- **Persistence**: versioned `GameState` in localStorage (migration from v1, sanitising parser, safe fallback to a
  checkpoint when a saved pose is invalid), separate settings store, restart with confirmation.
- **Audio**: synthesised WebAudio (footsteps by surface, doors, drawers, pickups, chimes, fire crackle, water,
  sauna steam, wind/birds turning to owls/knocks as dusk falls), unlocked by the Start button, mutable.
- **Mood**: puzzle progress moves the light from golden afternoon to early evening.

## Verification record (this session)

Environment: Linux container, headless Chromium 1194 with **SwiftShader software WebGL**. No real phone and no
GPU were available. Emulated touch used Chrome DevTools Protocol multi-touch events.

| Check | Result |
|---|---|
| `npm ci`, `npm run typecheck`, `npm test` (30 unit tests), `npm run build` in a clean clone | ✅ pass |
| Production build served under `/Feh-Lu-We/` — no console errors, no failed requests/404s | ✅ pass |
| Full desktop walkthrough tutorial → ending through real movement/collision/action button, no debug cheats (53 steps, `scripts/out/walkthrough-steps.txt`) | ✅ pass |
| Collision: wall, closed vs open door, door refuses to close on player, stairs up (y 3.35) and down (y 0.15), gallery railing, pool edge, conservatory glass, no pickup through a wall | ✅ 8/8 |
| Saves: pickups + drawer + position survive reload, upstairs pose + puzzle flags restored, invalid pose → checkpoint, corrupted save ignored, restart wipes progress | ✅ 7/7 |
| Touch emulation (844×390, DPR 2): simultaneous joystick + look, release and `touchcancel` stop movement, drag on an object looks instead of picking, direct tap picks, overlay blocks input, bag interaction, ≥48 px HUD buttons, pause/resume, portrait resize | ✅ 10/10 |
| WebGL failure path: forced flag and a browser launched with WebGL disabled both show a Dutch explanation | ✅ 2/2 |
| Render budget at 6 sampled viewpoints (see below) | ✅ low mode within 150 calls / 200k tris |

Bugs found and fixed by these checks: restart did not actually wipe progress (the reload re-saved state); the
start screen could overwrite an existing save on reload; picking used stale matrices for animating doors.

### Render measurements (SwiftShader, 1280×720; draw calls/triangles are representative, FPS is not)

| Viewpoint | Low (phone default): calls / tris | High (desktop default, incl. shadow pass): calls / tris |
|---|---|---|
| Gate / driveway | 97 / 163k | 119 / 251k |
| Forecourt → manor | 97 / 96k | 133 / 189k |
| Entrance hall | 130 / 99k | 169 / 194k |
| Garden → manor + conservatory | 121 / 160k | 153 / 208k |
| Forest (shed area) | 47 / 99k | 84 / 194k |
| Conservatory pool | 80 / 64k | 119 / 160k |

High mode exceeds the 150-call / 200k-triangle target at some views because the shadow-map pass is counted;
low mode (default on touch devices) stays inside it. Initial transfer: ~213 KB gzipped (JS 209 KB + CSS 3 KB + HTML).

### Not verified (honest gaps)

- **Real phone performance and feel** (Samsung/Android Chrome, iPhone Safari): not measured. FPS numbers from
  SwiftShader are meaningless for devices. Touch was emulated, not performed by a human hand.
- **Human playtime**: the 30–60 min estimate is unvalidated; the bot needs ~4 simulated minutes.
- **Audio** was not listened to (headless); it is generated without errors.
- **Live deployment**: see *Deployment status* below.

## Deployment status

- **Iteration 3 deployed (workflow-verified only, 5 Oct 2026).** Run
  [37351203312](https://github.com/Algolon/Feh-Lu-We/actions/runs/37351203312) for commit `6faa465`: build job
  (npm ci, typecheck, 65 unit tests, build, Pages artifact upload) and deploy job (`configure-pages@v6` +
  `deploy-pages@v5`) both succeeded. Earlier iteration-3 runs: 37349594462 (`1997ea8`), 37316537547 (`5e84349`),
  both successful. The live page was **not** loaded from the authoring session: the proxy refuses github.io
  (`CONNECT tunnel failed, response 403`). To confirm on a phone, open https://algolon.github.io/Feh-Lu-We/ →
  Pauze: the build id must start with `6faa465` or a later commit of this branch.

- **Iteration 2 deployed (workflow-verified only).** Run
  [37292481735](https://github.com/Algolon/Feh-Lu-We/actions/runs/37292481735) for commit `f8ba812`: build job
  (npm ci, typecheck, 40 unit tests, build, Pages artifact 220 kB uploaded) and deploy job (`configure-pages` +
  `deploy-pages`) both succeeded. Later docs-only commits redeploy the same game code. The page was **not** loaded
  from the authoring session (github.io blocked); check the build id in the pause menu on a phone matches the
  latest commit's short sha.
- Iteration 1: after Pages was enabled (Source: GitHub Actions), workflow run
  [37275022509](https://github.com/Algolon/Feh-Lu-We/actions/runs/37275022509) succeeded: build (npm ci,
  typecheck, 30 unit tests, build) and deploy (`configure-pages` + `deploy-pages` reported success) for commit
  `aaa65d5`. Environment URL: https://algolon.github.io/Feh-Lu-We/
- The authoring session's network could not fetch `github.io`, so the live page itself was confirmed only through
  GitHub's deployment status, not by loading it there. Open it on a phone to confirm.
- Deploys follow the repository's default branch (currently `ccr-75ef4113-kfkimm`, because it was the first branch
  pushed to the empty repo). Every push to it redeploys.
- Earlier runs 37244156035 / 37244226760 failed only at the deploy step because Pages was not yet enabled.

## Commands

```bash
npm ci && npm run typecheck && npm test && npm run build
npm run preview &          # http://localhost:4173/Feh-Lu-We/
npm run e2e                # all browser suites; E2E_ONLY=walkthrough,metrics to select; CHROME=/path/to/chrome
node scripts/shot.mjs "http://localhost:4173/Feh-Lu-We/?debug=1" out.png "window.__game.metrics()"
```

## Suggested next steps

1. Open the link on real phones; record FPS with `?debug=1` in the garden, the hall, the BOSLUST cut and the forest
   (the views closest to the draw-call budget). Check that the pause menu's build id matches the latest commit.
2. Run the playtest in `docs/PLAYTEST.md` with 2–3 friends; time the real route (estimate 45–90 min); tune hints.
3. Replace placeholder memories (`src/content/memories.ts`) and the organiser voice with authentic content;
   consider photos as framed textures (keep files small; credit them in `ASSET_CREDITS.md`).
4. If a phone struggles in the garden/hall: lower `World.VEG_FAR`, merge more loose props into area batches, or
   split the woodland prop chunk per site.
5. Art: contact shadows under furniture, more house-specific props, a richer under-the-hill passage.

## Implementation log (short)

1. Inspected the empty repo; initialised TypeScript/Vite/Three; saved the brief + concept art to `docs/`.
2. Pure state/rules/collision modules with unit tests first (30 tests), including a full progression test.
3. Engine: pointer-id touch input, player, picking with LOS, UI overlays/panels, synthesised audio.
4. World: home, manor (with upstairs), conservatory + pool + sauna, cottage + pond, forest + sites, garden.
5. Playwright walkthrough iterated until tutorial → ending passed; added collision/save/touch/WebGL/metrics suites.
6. Performance pass: size-based distance culling, interior zones, baked decorative lamps, thinner undergrowth.
7. Docs, Pages workflow, push.
8. Iteration 2: review fixes (see above).
9. Iteration 3: checkpoints CP1–CP5 (see the top of this file).
