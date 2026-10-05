# Feh Lu We

A mobile-first, first-person, stylised 3D puzzle-exploration game celebrating a friends group's Veluwe
Weekends. You pack at home, arrive early at a fictional estate and follow three threads of clues — at the table,
in the margins, off the paths — through a two-storey manor, a glass pool conservatory and sauna, a lawn with
lanterns and a large woodland. Three seals open the basement; a restored route and a taught cipher open
**BOSLUST**, a door in a wooded hill, where a stair leads down to the gathering room. Player-facing text is Dutch.

**Status:** playable prototype, end-to-end solvable. Prototype content (notes, memories) is placeholder text
by a fictional organiser ("de Kwartiermaker") and is meant to be replaced — see [Memory content](#memory-content).

- Published at https://algolon.github.io/Feh-Lu-We/ (GitHub Pages; see [Deploy](#deploy))
- Build brief and concept art: [`docs/BUILD_BRIEF.md`](docs/BUILD_BRIEF.md), [`docs/concept-art/`](docs/concept-art/)
- Spoilers: [`docs/PUZZLE_SOLUTIONS.md`](docs/PUZZLE_SOLUTIONS.md) · Playtest guide: [`docs/PLAYTEST.md`](docs/PLAYTEST.md) · Status/next steps: [`docs/HANDOFF.md`](docs/HANDOFF.md)
- Iteration 3 ("Het huis dat zich herinnert"): [`docs/ITERATION_3_DESIGN.md`](docs/ITERATION_3_DESIGN.md) · [`docs/ITERATION_3_VALIDATION.md`](docs/ITERATION_3_VALIDATION.md) · [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md)
- Iteration 2 (review fixes): [`docs/ITERATION_2_REVIEW.md`](docs/ITERATION_2_REVIEW.md) · [`docs/ITERATION_2_VALIDATION.md`](docs/ITERATION_2_VALIDATION.md)

## Run locally

Requires Node.js 20.19+ (22 LTS recommended).

```bash
npm ci
npm run dev          # http://localhost:5173/Feh-Lu-We/
npm run typecheck
npm test             # unit tests (puzzle rules, progression, saves, collision)
npm run build        # static site in dist/ (base path /Feh-Lu-We/)
npm run preview      # serves dist at http://localhost:4173/Feh-Lu-We/
npm run e2e          # browser checks against the preview server (see below)
```

`npm run e2e` expects `npm run preview` running in another shell and a Chromium binary
(defaults to `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; override with `CHROME=/path/to/chrome`).
It runs a complete home→finale walkthrough through the real controls plus collision, save/migration/restore,
lighting, multi-touch, WebGL-failure and render-budget checks, writing screenshots to `scripts/out/`
(`E2E_ONLY=walkthrough,metrics` runs a subset). `node scripts/smoke3.mjs` loads named poses and prints render stats.

URL flags: `?debug=1` shows median FPS and 95th-percentile frame time (from real, uncapped frame times), draw calls,
triangles, position, reticle target, puzzle flags, safe checkpoint buttons and a reset button. `?autotest=1` exposes `window.__game` for automated tests. Neither changes saves.

## Controls

| | Phone / tablet | Desktop |
|---|---|---|
| Walk | Left thumb anywhere on the left side: floating joystick. Speed follows the thumb smoothly; the outer fifth blends into a jog | WASD / arrow keys, Shift to run |
| Look | Drag on the right side | Drag with the mouse, or *Pauze → Muis vastzetten* (pointer lock, `L`) |
| Interact | Big amber button bottom-right, or a short tap directly on the object (left or right side of the screen) | `E` / Enter / Space, or click the object |
| Bag / notes / hint | Tas / Notities / Hint buttons (top corners) | `I` / `N` / `H` |
| Torch | Bag → Zaklamp aan/uit | `F` |
| Pause & settings | Pauze button (top left) | `Esc` |

Using an item: open the bag, pick an item, *In de hand nemen*; the action button then names what the item will do
on targets where it matters (*Aansteken*, *Aanmaakhout erin leggen*, or *Gebruik: …* with an explanation for wrong items).
Where a held item doesn't matter (an unlocked door, a burning fire) the normal action applies. Tap the held-item
chip to put it away. Keys are used automatically on their locks.

Notebook: *Draden* lists the three story threads (plus arrival and convergence) with their next step and a
*Volg deze draad* button that steers the objective line and hints; *Aanwijzingen* groups clues per thread with a ✓
for solved puzzles; *Kaart* has tabs for the estate and each floor (basement and "onder de heuvel" appear once
discovered), with a blue arrow for you and "?" for unvisited places. Hints show the last observation and the next
step separately, with three levels per puzzle.

Settings (pause menu): look and joystick sensitivity, low/high quality (high = shadows, sharper, 1.5× pixel
ratio cap; low = 1× cap, no shadows; phones default to low), reduced motion, invert look, mute, optional
fullscreen, restart with confirmation. Progress saves automatically to `localStorage` on this device.
Restarting never deletes progress: the previous save is set aside and the start screen offers *Vorige voortgang
terugzetten*. Saves from iteration 2 are migrated (tools and solved puzzles kept, a finished game archived).

## Architecture

TypeScript + Vite + Three.js (`WebGLRenderer`), plain HTML/CSS UI. No backend, no runtime downloads.

```
src/core/        game.ts (loop, picking, scenes, save/restore, debug), state.ts (versioned GameState, migration), rng.ts
src/player/      input.ts (pointer-id touch joystick/look, keyboard, pointer lock), player.ts (movement), collision.ts (2.5D grid)
src/world/       kit.ts (materials, batcher), textures.ts (seeded canvas textures), arch.ts (walls/doors/stairs/roofs),
                 furniture.ts, nature.ts (instanced vegetation), env.ts (sky, sun, dusk), home.ts, estate.ts, manor.ts,
                 conservatory.ts (pool + sauna), cottage.ts, forest.ts, boslust.ts (hill, stair, chambers, tunnel),
                 layout.ts (authored layout), terrain.ts (heightfield), roomdefs.ts (rooms + portals), rooms.ts,
                 fire.ts, hearth.ts
src/interactions/ world.ts (World container, Interactable API, light pool, culling), props.ts (doors, drawers, pickups, lamps, inspectables)
src/puzzles/     rules.ts (pure puzzle/progression rules, hints)
src/content/     canon.ts (all answers + derived wording), items.ts, clues.ts, symbols.ts, memories.ts (editable placeholders)
src/ui/          ui.ts (HUD, overlays, puzzle panels), diagrams.ts (SVG clues), map.ts (estate + floor plans), icons.ts, style.css
src/audio/       audio.ts (WebAudio-synthesised sound, no files)
tests/           vitest unit tests
scripts/         e2e.mjs + e2e-helpers.js (Playwright suites), views.mjs (fixed-viewpoint screenshots),
                 png2jpg.mjs, shot.mjs (screenshot helpers)
```

Key design points:
- **State is authoritative.** Every interactive object derives its visuals from `GameState` in `onSync`; restoring a
  save is just `syncAll()`. Puzzle rules are pure functions shared by world objects and unit tests.
- **One interaction API.** Each interactable has a stable id, label, reach, handler and optional item handler;
  picking raycasts only invisible hitboxes of nearby interactables and checks line of sight against wall/door
  colliders, so nothing can be used through a wall.
- **Collision** is a 2.5D grid of boxes/cylinders with Y ranges, flat floors and linear ramps (stairs use a hidden
  smooth ramp). Doors toggle their colliders and refuse to close on the player.
- **Performance:** static geometry merged per material+area with vertex colours; areas drawn only when one of their
  rooms is visible through open doors/arches (authored room/portal graph); vegetation instanced per tile with
  distance culling and crown LOD; a fixed pool of 3–4 point lights assigned by room relevance with hysteresis
  (no shader recompiles when lamps toggle).

## World layout (plan, 1 unit ≈ 1 m, X east, Z north)

| Region | Footprint |
|---|---|
| Estate | 180 × 150, front gate (90, 0); terrain heightfield with rolling woodland and a hill |
| Woodland (south) | Z 0–72 — shed (42, 39), fire clearing (21, 18), well (144, 39), old side gate (162, 18), fork signpost (55.5, 8.6) |
| BOSLUST | door in the hill at (63, 18.2) behind a stone-walled cut; stair down to chambers at Y −3.4; tunnel north to the basement |
| Manor | X 72–108, Z 80–110, two storeys + basement; service wing X 108–116, Z 92–110 |
| Pool conservatory | X 116–130, Z 94–112 (pool inside); barrel sauna outside to its right at (134, 102) |
| Garden | lawn north of the manor: terrace, lantern circle (90, 128), cottage X 32–42 Z 128–136, pond (48, 132) |

Full room list and design notes: [`docs/ITERATION_3_DESIGN.md`](docs/ITERATION_3_DESIGN.md).

## Deploy

`.github/workflows/deploy-pages.yml` runs on every push: `npm ci`, typecheck, unit tests, build, upload of
`dist/` as the Pages artifact. On the repository's **default branch** it then runs `configure-pages` and
`deploy-pages`. One-time setup by a repository admin: **Settings → Pages → Build and deployment → Source:
GitHub Actions**, then re-run the workflow (Actions tab → *Run workflow*) or push again. Until that is done the
deploy job fails with "Get Pages site failed" while the build job still validates every push. Current status:
[`docs/HANDOFF.md`](docs/HANDOFF.md#deployment-status).

Vite is configured with `base: '/Feh-Lu-We/'`; all assets are bundled or generated at runtime, so the site
works under that sub-path. No server-side routing is used.

## Memory content

Placeholder memories live in [`src/content/memories.ts`](src/content/memories.ts) with stable IDs:
`mem.home.calendar`, `mem.hall.guestbook`, `mem.kitchen.list`, `mem.living.photo`, `mem.billiard.scoreboard`,
`mem.storage.box`, `mem.reis.suitcase`, `mem.sterren.telescope`, `mem.garden.nestbox`, `mem.pond.bench`,
`mem.sidegate.postbox`, `mem.cottage.table`, `mem.gathering.keepsakes`.
Edit only `title`/`text`; keep IDs stable (saves and world objects refer to them). Puzzle clue texts are in
`src/content/clues.ts`; answers come from `src/content/canon.ts` — changing those requires checking
`docs/PUZZLE_SOLUTIONS.md` and `npm test`.

## Credits

All 3D models, textures and sounds are generated procedurally by this code. See [`ASSET_CREDITS.md`](ASSET_CREDITS.md).
