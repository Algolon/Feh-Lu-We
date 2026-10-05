# Iteration 3 — validation record

Build under test: commit after `1997ea8` (CP4 art pass), production build served by `vite preview` under
`/Feh-Lu-We/`. Evidence files: [`iteration-3/metrics-after/`](iteration-3/metrics-after/) (results, metrics,
walkthrough steps) and screenshots in [`iteration-3/after/`](iteration-3/after/); the pre-iteration baseline is in
[`iteration-3/before/`](iteration-3/before/) and [`iteration-3/metrics-before/`](iteration-3/metrics-before/).

The three kinds of evidence are reported separately, as requested.

## 1. Source tests (Node, `npm test` + `npm run typecheck`)
**65 / 65 pass** (5 files), typecheck clean.
- `tests/canon.test.ts` — the drawer answer equals the brass-stand objects left → right; dial options; invitation
  wording; hint levels; mantel slot order for every fireplace facing.
- `tests/rules.test.ts` — tutorial; code locks; keys; fire/lantern ordering; service plan judged only when full
  (correct and wrong first placements read the same); recoverable placement; cabinet wheels; catalogue derived
  emblem → room → tab; basement door names missing seals; route console accepts carried seals, moves and returns
  them; cipher decodes to 2413 with identical messages for near and far misses; plates judged on all three;
  **three thread orders (A→B→C, C→B→A, B→C→A) each reach the finale**; tracked thread drives the objective; hint
  menu; final hint levels are the only ones that reveal answers.
- `tests/state.test.ts` — save parsing and sanitising; v1/v2/v3 → v4 migration (tools kept, legacy items dropped,
  retained solves keep their containers open, old ending archived with a notice, poses reset); new slot/dial
  validation; underground poses survive.
- `tests/rooms.test.ts`, `tests/collision.test.ts` — portal relevance, light hysteresis, collision basics.

## 2. Browser tests (Chromium 141 + SwiftShader software WebGL, `node scripts/e2e.mjs`)
**71 / 71 checks pass.** Highlights:
- **Normal-control route, home → finale:** 70 steps through real movement, collision, look direction, the action
  button and the DOM panels — no state edits or teleports — including deliberate wrong attempts (wrong service plan,
  wrong lantern order, wrong cipher code), the real stair into the hill, the finale, and the tunnel shortcut back
  into the route chamber. No console errors or failed requests.
- **Measured route time:** ≈ 5.7 minutes of simulated running/acting for the fastest direct route (no reading, no
  thinking, answers known). Arrival → table seal 1.5 min, → archive seal 2.6 min, → trail seal 4.2 min, basement
  4.5 min, BOSLUST open 5.4 min, finale 5.7 min. Real play time with reading and puzzling is **not measured** and
  remains a design estimate.
- Collision: walls, closed/open doors, no door closing onto the player, grand stair up/down, gallery railing, the
  sealed basement door, pool edge, conservatory glass, the locked BOSLUST door, the walkable hill flank, no pickup
  through walls.
- Saves: reload restores pickups, drawers, upstairs and underground poses; invalid poses fall back to checkpoints;
  corrupted saves are ignored; a real v3 save migrates in the browser (notice shown, tools kept, rewards opened,
  old ending archived); restart sets the save aside and the start screen restores it.
- Regressions from iteration 2 (F01–F12, B1–B4) and the lighting checks L1–L6 ported to the new layout.
- Touch (CDP touch events, 844 × 390): simultaneous move + look, release/cancel, drag vs tap, overlay blocks input,
  48 px targets, pause/resume, portrait resize. WebGL-unavailable path.

Full list of checks:

- F01 saved-open doors are visually open after reload
- F02 upstairs bedroom objects not reachable through the ceiling
- F03 selected key does not block opening an unlocked door
- F04 no stale delayed submission closes a newer modal
- B1 closing a door with the player in its swing path is refused
- B2 no taking through closed glass/cabinet
- F10 reduced motion holds flames steady but visible + UI transitions off
- F12 unknown saved ids are dropped; inventory UI works
- F07 playtime counts panel reading as active and pause as paused
- B4 context loss pauses with a recovery dialog and resumes on restore
- B4 repeated Start presses create one game loop
- F05 stationary tap on the left side of the screen interacts
- L1 seen from the hall, the living room keeps real light and its hearth flame stays visible (open arch)
- L2 looking away and back does not toggle or reorder lights
- L3 crossing the threshold changes nothing abruptly (smooth light, flame always visible)
- L4 closed door blocks the neighbouring room light; open door lets it through
- L5 fixture glow follows logical state, not light-slot ownership
- L6 decorative candles burn; a doused fireplace stays doused after reload
- walkthrough tutorial → finale (A → B → C)
- walkthrough: no console errors / 404s
- collision: wall blocks movement
- collision: closed door blocks, open door passes
- collision: door will not close onto the player
- collision: grand stair reaches the upper floor and back
- collision: gallery railing prevents falling
- collision: the sealed basement door blocks the stair
- collision: pool edge is solid, no fall-through
- collision: conservatory glass is solid
- collision: BOSLUST door blocks while locked
- terrain: the hill flank is walkable (feet follow the ground)
- interaction: no pickup through a wall
- save: pickups survive reload and stay removed from the world
- save: drawer state survives reload
- save: position restored
- save: upstairs pose + puzzle flags restored
- save: invalid saved pose falls back to a checkpoint
- save: underground pose restored
- save: v3 → v4 migration keeps tools, opens retained rewards, archives the old ending, offers the new chapter
- save: corrupted save is ignored safely
- save: restart sets progress aside (no blanket wipe) and offers to restore it
- save: restoring the set-aside progress continues the old game
- touch: simultaneous joystick move + look drag
- touch: release stops movement
- touch: touchcancel clears joystick (no stuck movement)
- touch: drag starting on an object looks around instead of picking it
- touch: direct tap on a visible nearby object picks it up
- touch: open overlay blocks movement and look
- touch: inventory interaction (torch on via bag)
- touch: HUD buttons are at least 48 px
- touch: pause and resume
- touch: portrait resize keeps canvas + controls usable
- WebGL failure path (forced) shows an understandable message
- WebGL failure path (browser with WebGL disabled)
- render low (phone default): gate (driveway)
- render high (desktop, +shadows): gate (driveway)
- render low (phone default): forecourt → manor
- render high (desktop, +shadows): forecourt → manor
- render low (phone default): entrance hall
- render high (desktop, +shadows): entrance hall
- render low (phone default): library
- render high (desktop, +shadows): library
- render low (phone default): garden → manor + conservatory
- render high (desktop, +shadows): garden → manor + conservatory
- render low (phone default): forest (shed area)
- render high (desktop, +shadows): forest (shed area)
- render low (phone default): BOSLUST cut
- render high (desktop, +shadows): BOSLUST cut
- render low (phone default): conservatory pool
- render high (desktop, +shadows): conservatory pool
- render low (phone default): gathering room
- render high (desktop, +shadows): gathering room

### Render budget (phone mode = quality "low"; SwiftShader counts — FPS here is meaningless)
| View | low calls | low triangles | high calls | high triangles |
|---|---|---|---|---|
| gate (driveway) | 135 | 195,100 | 166 | 268,652 |
| forecourt → manor | 130 | 159,111 | 179 | 264,583 |
| entrance hall | 149 | 158,144 | 206 | 280,568 |
| library | 43 | 53,466 | 51 | 89,694 |
| garden → manor + conservatory | 150 | 160,037 | 175 | 195,051 |
| forest (shed area) | 66 | 151,598 | 107 | 250,642 |
| BOSLUST cut | 134 | 208,784 | 165 | 297,104 |
| conservatory pool | 75 | 85,745 | 119 | 164,169 |
| gathering room | 29 | 14,972 | 35 | 20,160 |

Target: ≤ 150 draw calls and ≤ 250 k triangles in phone mode — met in every measured view (garden and hall sit
at 150 / 149). Desktop "high" adds the shadow pass. Transfer size: ≈ 0.9 MB JS (≈ 260 KB gzip) + 11 KB CSS,
far under the 8 MB budget; there are no image, font or audio downloads.

## 3. Real-device checks
**None performed in this iteration.** This environment has no physical phones and no hardware GPU, so frame rate,
thermal behaviour, touch feel and iOS Safari specifics are unverified. Recommended before the playtest: one
Android Chrome and one iPhone Safari run of the first 15 minutes, watching for frame drops in the garden and hall.

## 4. Deployment
See [`HANDOFF.md`](HANDOFF.md#deployment-status) for the exact workflow run and what could and could not be
verified about the live site from here.
