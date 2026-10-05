# Feh Lu We

A mobile-first, first-person, stylised 3D puzzle-exploration game celebrating a friends group's Veluwe
Weekends. You pack at home, arrive early at a fictional estate and follow a trail of connected clues through
the manor, the glazed pool conservatory, the barrel sauna, the open garden, the forest and finally the small
Portuguese cottage where everyone gathers. Player-facing text is Dutch.

**Status:** playable prototype, end-to-end solvable. Prototype content (notes, memories) is placeholder text
by a fictional organiser ("de Kwartiermaker") and is meant to be replaced — see [Memory content](#memory-content).

- Published at https://algolon.github.io/Feh-Lu-We/ (GitHub Pages; see [Deploy](#deploy))
- Build brief and concept art: [`docs/BUILD_BRIEF.md`](docs/BUILD_BRIEF.md), [`docs/concept-art/`](docs/concept-art/)
- Spoilers: [`docs/PUZZLE_SOLUTIONS.md`](docs/PUZZLE_SOLUTIONS.md) · Playtest guide: [`docs/PLAYTEST.md`](docs/PLAYTEST.md) · Status/next steps: [`docs/HANDOFF.md`](docs/HANDOFF.md)
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
It runs a complete tutorial→ending walkthrough plus collision, save/reload/reset, multi-touch, WebGL-failure
and render-budget checks, writing screenshots to `scripts/out/`.

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
on targets where it matters (*Aansteken*, *Zwengel plaatsen*, or *Gebruik: …* with an explanation for wrong items).
Where a held item doesn't matter (an unlocked door, a burning fire) the normal action applies. Tap the held-item
chip to put it away. Keys are used automatically on their locks.

Notebook: clues grouped by area with the newest on top and a ✓ for solved puzzles; *Kaart* shows where you are
(blue arrow), unvisited places as "?", and an upstairs sketch inside the manor. Hints (Hint button) can be chosen for any
discovered, unsolved puzzle.

Settings (pause menu): look and joystick sensitivity, low/high quality (high = shadows, sharper, 1.5× pixel
ratio cap; low = 1× cap, no shadows; phones default to low), reduced motion, invert look, mute, optional
fullscreen, restart with confirmation. Progress saves automatically to `localStorage` on this device.

## Architecture

TypeScript + Vite + Three.js (`WebGLRenderer`), plain HTML/CSS UI. No backend, no runtime downloads.

```
src/core/        game.ts (loop, picking, scenes, save/restore, debug), state.ts (versioned GameState, migration), rng.ts
src/player/      input.ts (pointer-id touch joystick/look, keyboard, pointer lock), player.ts (movement), collision.ts (2.5D grid)
src/world/       kit.ts (materials, batcher), textures.ts (seeded canvas textures), arch.ts (walls/doors/stairs/roofs),
                 furniture.ts, nature.ts (instanced vegetation), env.ts (sky, sun, dusk), home.ts, estate.ts, manor.ts,
                 conservatory.ts (pool + sauna), cottage.ts, forest.ts
src/interactions/ world.ts (World container, Interactable API, light pool, culling), props.ts (doors, drawers, pickups, lamps, inspectables)
src/puzzles/     rules.ts (pure puzzle/progression rules, hints)
src/content/     items.ts, clues.ts, symbols.ts, memories.ts (editable placeholder memories)
src/ui/          ui.ts (HUD, overlays, puzzle panels), diagrams.ts (SVG clues), style.css
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
- **Performance:** static geometry merged per material+chunk with vertex colours; vegetation instanced; small props
  distance-culled by size; building interiors hidden from outside; a fixed pool of 3–4 point lights is assigned to
  the nearest lit lamps (no shader recompiles when lamps toggle).

## World layout (plan, 1 unit ≈ 1 m, X east, Z north)

| Region | Footprint |
|---|---|
| Forest (south half) | X 0–120, Z 0–50 — shed (28,26), fire clearing (14,12), well (96,26), old side gate (108,12), looping paths |
| Manor | X 48–72, Z 52–80 (entrance faces south; upstairs study + storage) |
| Glazed pool conservatory | X 72–84, Z 64–82 (pool inside) |
| Barrel sauna | X 85–89, Z 69–73 (outside, east of the conservatory) |
| Portuguese cottage | X 20–30, Z 88–96, pond ≈ (36, 92) |
| Garden | the rest of the northern half: open lawn, dining terrace, three lantern posts, one path manor → cottage |

Paths and the pond count as part of their landscape region. Roofs stay on in play; the pause/notebook
*Kaart* shows a plan view.

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
`mem.storage.box`, `mem.pond.bench`, `mem.sidegate.postbox`, `mem.cottage.ending`.
Edit only `title`/`text`; keep IDs stable (saves and world objects refer to them). Puzzle clue texts are in
`src/content/clues.ts` — changing those requires checking `docs/PUZZLE_SOLUTIONS.md` and `npm test`.

## Credits

All 3D models, textures and sounds are generated procedurally by this code. See [`ASSET_CREDITS.md`](ASSET_CREDITS.md).
