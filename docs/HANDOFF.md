# Feh Lu We — status, verification record and handoff

Last updated: 2026-10-04. Branch: `ccr-75ef4113-kfkimm` (the repository was empty before this work).

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

- **Deployed.** After Pages was enabled (Source: GitHub Actions), workflow run
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

1. Enable Pages (above) and open the link on real phones; record FPS with `?debug=1` at the six viewpoints above.
2. Run the playtest in `docs/PLAYTEST.md` with 2–3 friends; tune hint wording and puzzle difficulty from results.
3. Replace placeholder memories (`src/content/memories.ts`) and the organiser voice with authentic content;
   consider photos as framed textures (keep files small; credit them in `ASSET_CREDITS.md`).
4. Content depth toward ~60 minutes: more optional memory hunts, a second layered clue per area, an upstairs
   bedroom wing; keep the one-path garden and open lawn.
5. Art: dormers, softer foliage cards, more house-specific props from the real holiday homes.

## Implementation log (short)

1. Inspected the empty repo; initialised TypeScript/Vite/Three; saved the brief + concept art to `docs/`.
2. Pure state/rules/collision modules with unit tests first (30 tests), including a full progression test.
3. Engine: pointer-id touch input, player, picking with LOS, UI overlays/panels, synthesised audio.
4. World: home, manor (with upstairs), conservatory + pool + sauna, cottage + pond, forest + sites, garden.
5. Playwright walkthrough iterated until tutorial → ending passed; added collision/save/touch/WebGL/metrics suites.
6. Performance pass: size-based distance culling, interior zones, baked decorative lamps, thinner undergrowth.
7. Docs, Pages workflow, push.
