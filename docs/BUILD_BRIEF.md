# Feh Lu We — Claude Code build prompt

Copy the section below into Claude Code in the local checkout of https://github.com/Algolon/Feh-Lu-We. Attach the revised estate map and concept art if your Claude Code client supports images; otherwise place them in `docs/concept-art/` and identify the files. The written layout and requirements take precedence over any inconsistent illustration. This is a build brief, not a claim that a playable deployment already exists.

## Prompt starts here

You are implementing **Feh Lu We**, a mobile-first, first-person, stylized 3D puzzle exploration game. Work in the repository https://github.com/Algolon/Feh-Lu-We. Implement, test and prepare/deploy an actual playable static browser game, rather than delivering a plan, a slideshow, a collection of disconnected demos, or screenshots. Progress autonomously through milestones within this session, using available tools. Keep a short implementation log and persist a handoff if the context limit is approaching.

### 1. Product intent and scope

This game celebrates a friends group's longstanding Veluwe Weekends. Its fictional estate combines memorable holiday houses, shared situations, objects and inside jokes into one coherent place and mystery. We will replace prototype content with authentic memories later. Do not invent claims about real friends or pretend you know their history.

The long-term target is approximately **one hour of gameplay** for friends to playtest. There is no ten-hour development limit. For this first implementation, prioritize a complete explorable estate, reliable mobile controls, satisfying object interactions and an end-to-end solvable puzzle route. Aim for a first-play route of roughly 30–60 minutes, but report duration as an unvalidated design estimate until people play it. Do not inflate duration through slow walking, arbitrary searching or repeated errands.

Tone: warm familiarity turning into gentle unease, curiosity and mystery. Escape-room reasoning and The Witness-like environmental observation; Blue Prince-like layered discovery without resetting days. No combat, enemies, time pressure, jump scares, procedural daily resets or multiplayer in this first version. One player explores at their own pace. First-person camera, no animated player character required.

Prototype story: You prepare at home for the annual weekend. You arrive early at the estate and find a handwritten invitation: “We hebben alles klaargezet. Zoek uit waar we samenkomen.” The manor, garden and forest contain a trail of connected clues. Solving them opens the final gathering room in the small Portuguese cottage, revealing a warmly lit table and a message celebrating another weekend together. Use a playful fictional organizer, not a disappearance or tragedy involving a real friend. Dutch player-facing text. Maintain tension through unexplained arrangements, distant sounds and partially revealed spaces, with a warm ending.

### 2. Technical choice

Use **TypeScript + Vite + Three.js WebGLRenderer**, plus ordinary HTML/CSS for menus, touch controls, inventory and puzzle overlays. Use current compatible stable versions, record resolved versions in the lockfile, and consult official docs for APIs. Three.js is a rendering library, so implement the gameplay systems deliberately. Avoid React unless an established repository architecture makes it materially useful. Avoid introducing a heavyweight engine migration or a full rigid-body physics stack.

The game must run entirely client-side on static GitHub Pages. No backend, paid service, secret API key, runtime AI calls or login. Bundle dependencies. All required assets are generated at build time or committed locally. No runtime dependency on third-party model/image URLs.

Inspect the checkout, remote, default branch, existing files, package configuration and any `AGENTS.md` first. Preserve unrelated work. If the repository already has useful code, extend it. If empty, initialize cleanly. Do not silently overwrite a populated repository. If checkout/authentication is unavailable, still implement locally where possible and report the exact blocker without claiming a push or deployment.

### 3. Visual direction and asset production

Whimsical hand-painted animation-inspired art: soft rounded tree crowns, mossy greens, cream stone, terracotta, warm timber, amber windows, blue-green indoor water, atmospheric distance and readable silhouettes. Ghibli-like warmth is a mood reference, not a requirement to reproduce film characters or copyrighted assets. Cozy, mysterious and cohesive. Low-to-medium-poly models, deliberate bevels and color variation; no grey-box final presentation, photorealism or dense high-poly environment.

Generate core models procedurally in Three.js: modular walls with actual door openings, pitched roofs, windows, floorboards, furniture, doors on hinge pivots, drawer tracks, trees, shrubs, barrels, lanterns, fire, well, cottage, pool, sauna and interaction props. Reuse shared geometries/materials. Generate simple painterly textures with seeded Canvas drawing where helpful. A procedurally built tree must have a recognisable trunk and clustered foliage, not an arbitrary cube. Windows and doors must read clearly as architectural elements.

Free external assets are optional enhancements, not a prerequisite. Download only assets whose actual license permits use and redistribution; record exact source, author, license and modifications in `ASSET_CREDITS.md`. Do not assume “free” means CC0. If downloads or license verification fail, produce a local procedural substitute immediately. Concept images are visual references, not ready-made 3D geometry or a substitute for rendering explorable spaces. Do not build the game as flat concept-art billboards.

No original house photos or authentic jokes are supplied. Put editable placeholder memory text in `content/memories.ts` with stable IDs and clearly marked TODOs in developer documentation. Player-facing placeholders should feel like natural fictional notes, never an unfinished implementation checklist.

### 4. Canonical estate geography

Create a coherent **120 × 100 world-unit** estate, treating one unit approximately as one metre. Use X east/right, Z north/back and Y up. Front gate is at the south/front edge; the main manor entrance faces south. Use this allocation as the authoritative spatial plan:

| Region | Approximate footprint | Role |
|---|---|---|
| Forest | X 0–120, Z 0–50 | About 50% of estate; real walkable woodland with paths and interaction sites |
| Garden/building half | X 0–120, Z 50–100 | Remaining half |
| Manor | X 48–72, Z 52–80 | 24 × 28 footprint, about 672 m² |
| Glazed pool conservatory | X 72–84, Z 64–82 | 12 × 18 footprint, about 216 m²; attached to kitchen/right rear wing |
| Portuguese cottage | X 20–30, Z 88–96 | 10 × 8 footprint with intimate terraces |
| Barrel sauna | Approximately X 85–89, Z 69–73 | Outside, immediately right/east of conservatory |
| Garden | Remaining ground in northern half | About 5/6 of the house-and-garden half, roughly 41.7% of entire estate |

Buildings total approximately 8.3% of estate ground area. These are planning proportions, not screen-pixel proportions in a perspective camera. Paths and the garden pond belong to their containing landscape region; document classification. Do not add vast decorative structures that change these proportions. The reference images may differ: the written footprint takes priority.

**Garden correction:** mostly a generous open grassy field with a communal dining terrace, a few scattered trees, small flower patches and a minimal path network. No elaborate terraced formal garden, frequent staircases or maze of ornamental paths. One obvious route from manor to cottage is enough. Cottage terraces may have a few steps. The main garden should be traversable freely.

**Pool correction:** the conservatory DOES contain the swimming pool. The entire pool sits inside its enclosed glazed walls/roof, with a dry walkable perimeter, plants, seating and towels. There is NO outdoor swimming pool. Treat the pool edge as a safe solid boundary in this prototype; swimming is unnecessary. The barrel sauna is outdoors immediately to its right. It should be enterable and its heater controllable, without a simulation of bodily heat.

**Forest:** do not reduce it to an inaccessible tree border or a billboard. Provide broad woodland areas traversable between trunks, a looping set of paths and several explorable clearings. Include a timber shed around (25,25), fire clearing around (18,12), stone well around (96,26), and an old side gate around (108,12). Approximate coordinates can move slightly for readability. The long driveway runs from (60,0) toward the front entrance near (60,52). Tree placement must not seal paths or trap the player. Provide coherent boundary fencing, rocks/hedges or visual woodland boundaries at the estate perimeter; no infinite wandering beyond the map.

**Pond/cottage:** a small pond near (36,92), beside the Portuguese cottage, with white plaster, terracotta roof, simple outdoor seating and two or three small terraces. Pond size should not consume the open garden. Pond is separate from the indoor pool.

**Manor ground floor:** vestibule → spacious central entrance hall. On entering, a large open living room is left, dining room is right, connected to kitchen behind it. Ahead is a wall with a door on the left and staircase on the right. Additional rear room contains a pool/billiard table. Kitchen connects to glazed pool conservatory and outdoor garden. Include a service corridor, meaningful sightlines and physically connected doorways. Front doors are functional. Roofs remain on in the actual game; remove them only in a map/debug view.

**Upstairs:** staircase reaches a real upper landing and at least two accessible rooms: a bedroom/study and small storage room. Model the stair opening so there is no ceiling blocking ascent. Use a hidden smooth collision ramp matching the visible stairs, with landing support; no teleport masquerading as stair climbing. The upper footprint can be smaller than ground floor, and its space must agree with the exterior massing. No need to furnish inaccessible ornamental roof voids. Main manor, cottage, shed, sauna and all intentional play areas must be reachable, with temporary puzzle locks permitted.

### 5. Opening home tutorial

Separate compact home scene, not extra land on the estate. Introduce looking, walking, interaction and inventory naturally: open a drawer, inspect invitation, pick up torch, matches and notebook, operate a lamp, take the front-door key and leave. Clearly signal preparedness. If a required item is missed, give a contextual reminder or accessible backup at the estate; never allow a hidden soft lock. End tutorial by interacting with exit door, transitioning to front gate of estate. No lengthy cutscene.

### 6. Mobile controls and accessibility

Primary target: current Android Chrome on a Samsung phone; secondary iPhone Safari and desktop browsers. Landscape recommended but portrait must remain usable. No requirement to install an app.

- Left thumb virtual joystick: forward/back/strafe relative to camera yaw. Adjustable sensitivity; analogue speed with deadzone. Right side drag: yaw/pitch, clamped pitch. Keep movement on horizontal plane.
- Simultaneous move/look must work using distinct `pointerId` ownership and pointer capture. Respect `pointercancel`, blur, tab hiding and resize; clear active inputs so movement never remains stuck.
- Use `touch-action: none` on game control surfaces, disable accidental scrolling/selection, and keep UI scrollable where needed. A right-side tap is distinguished from a drag by movement/time thresholds.
- Context action button near right thumb, labelled “Openen”, “Pakken”, “Aansteken”, etc. Centre reticle identifies the nearest visible valid object in reach, normally ~2.5 units. Also support direct tap/click on a visible nearby object using screen-coordinate raycasting.
- Raycasts must respect walls, closed doors and occlusion; no picking up an object through a wall. Prioritize nearest actual hit and resolve nested meshes to their parent interaction ID. UI events must not also trigger world interaction.
- Inventory and notebook buttons, readable inspect overlays and large touch targets at least 48 CSS px. Handle safe-area insets, browser bars and dynamic viewport height. No hover-only actions.
- Start button explicitly unlocks/resumes audio. Sound can be muted; essential clues are also visible/textual. Do not rely solely on red/green or other color differences: pair colors with symbols/shapes.
- Desktop: WASD, mouse look with optional user-initiated pointer lock, E action, click selection, Esc pause/unlock. Never require pointer lock on mobile.
- Pause, resume, restart with confirmation, low/high quality, sensitivity and reduced-motion setting. No mandatory screen orientation lock or fullscreen. Fullscreen is optional where supported.

Movement should feel calm and grounded: eye height ~1.65, walking speed ~3.2 units/sec, optional run ~5.0, no head bob by default. A 120-unit estate should not take minutes of empty travel. Implement collision against walls, trunks, closed doors, furniture and water boundaries, wall sliding, support height and valid stair ascent/descent. No jumping required. Resolve closed-door colliders as doors animate; prevent crushing/locking player in door sweep.

### 7. Required interaction systems

Use stable world entity IDs and a shared interaction API, not bespoke click handlers scattered through code. Each object defines label, reach, availability predicate, state change and feedback. Required working examples:

1. Open/close several hinged doors, including keyed locks and a visibly gated final door.
2. Open/close at least three drawers; one reveals an actual pickup after opening.
3. Pick up keys and tools into inventory; object disappears from world and remains acquired after reload.
4. Use an appropriate held/selected item on a target with clear feedback for wrong combinations.
5. Toggle lamps and lanterns, with visible emissive change and modest illumination.
6. Light/extinguish fireplace or fire-clearing fire after acquiring matches. Use cheap animated geometry/sprites and sound; no expensive simulation.
7. Walk up/down stairs and enter upper rooms.
8. Inspect notes/objects in a readable overlay; record clues in notebook.
9. Enter sauna and toggle heater with visual/audio feedback.
10. At least one garden interaction and two forest interaction sites affect the puzzle route.

Sound feedback, small animations, clear state changes and brief contextual text should confirm outcomes. Show why an attempted action is blocked. A locked prop must have an intended purpose; avoid filling every room with fake clickable objects.

### 8. Complete puzzle route

Implement eight connected but varied beats, using fixed deterministic solutions. Treat this as a starting design you may improve for clarity while retaining the chain and geographic coverage. Every answer must be derivable from in-world evidence. Create `docs/PUZZLE_SOLUTIONS.md` with prerequisites, clues, exact answer, output state and recovery path for each puzzle. Never ship secret solutions in ordinary player UI, although client-side code cannot conceal them from determined inspection.

| Beat | Place / reasoning | Result |
|---|---|---|
| 0 | Home: inspect invitation, open drawer, pack torch/matches/notebook | Tutorial complete; travel to estate |
| 1 | Manor hall/living: match three pictograms on invitation to visibly arranged shelf objects; use their order to select three symbols on drawer lock | Brass study key |
| 2 | Upstairs study: use key; compare a short note with a framed diagram showing an explicit way to order three landmarks | Record three-symbol forest instruction; obtain shed key |
| 3 | Forest shed: keyed access; locate fuel and a wooden garden token; inspect a tool board for a useful symbol clue | Fuel + token; progress toward fire clue |
| 4 | Fire clearing: combine fuel and matches, light fire; a nearby mounted lantern illuminates a physically present engraved clue plate, which can also be inspected/read accessibly | Reveals a three-symbol lantern order |
| 5 | Open garden: operate three lantern controls in that order; wrong entry gives feedback/reset of attempt only, not world progress | Conservatory cabinet opens; collect well crank |
| 6 | Conservatory + sauna: use observed pool-tile shapes and sauna wall diagram to derive a four-button symbol sequence, enter it on cabinet panel | Reveals well instructions and cottage crest; sauna heater is an optional satisfying interaction, not a heat wait gate |
| 7 | Forest well: install crank and operate it; receive final cottage key only if prior crest is acquired; clearly explain missing prerequisite | Final key and invitation fragment |
| 8 | Cottage: use final key, then place garden token/crest into corresponding slot indicated by invitation fragment | Gathering room opens; ending and playtest feedback prompt |

Avoid abstract locks requiring unexplained numerical guessing. Ensure matching/ordering rules are explicitly taught in early easy puzzles. Include at least one optional pattern puzzle on a physical panel inspired by observing the environment, with an original rule taught by simple examples; do not clone The Witness's exact art/puzzle presentation. Optional clues/secrets in billiard room and pond seating may enrich exploration but must not block ending.

Create a simple hint system with three escalating hints per required puzzle: where to look, how to reason, explicit solution as last step. Hints are optional and recorded for playtest analysis. Wrong answers never destroy inventory or permanently block progress. Order-independent exploration should be possible; examining a later clue early records it and remains valid. Persist all acquired clues. Keep required tools reusable or create explicit recovery paths.

### 9. Architecture and persistence

Keep modules small and functional, with clear separation: app bootstrap, renderer/loop, player/input/collision, world generation, interactables, inventory, puzzle state, audio, HTML UI, persistence and data. A reasonable structure is `src/core`, `src/player`, `src/world`, `src/interactions`, `src/puzzles`, `src/ui`, `src/content` and `public/assets`; adapt to existing conventions.

One authoritative versioned GameState stores scene, inventory, entity states, puzzle flags, recorded clues and a safe player position. Save to localStorage after material changes, with guarded parsing/writes, default fallbacks and migration/reset strategy. Restore objects from state before input starts. On restore inside closed geometry, move to a valid nearby checkpoint. Pause movement while puzzle overlays are open. Returning from home to estate must not leave stale scene listeners, disposed references or duplicate render loops.

Add a hidden developer mode, available through `?debug=1`, for FPS/draw calls/triangles, player coordinates, interaction ID, puzzle flags, safe teleport checkpoints and reset. Not a normal player flow. Keep debug flags out of saved progression where possible.

### 10. Performance budgets

Treat these as measured engineering targets, not claims:

- Stable ~30 FPS or better on a contemporary midrange phone, target 60 where possible; test actual hardware before claiming it. Emulation is only a controls/layout check.
- Initial compressed transfer ideally under 10 MB, excluding optional lazy assets; no giant reference PNGs loaded by gameplay.
- Target under ~150 draw calls and ~200k visible triangles at usual viewpoints. Measure, adjust geometry density and quality if exceeded.
- Instance trees/foliage and repeat props, frustum cull, keep collisions simple and spatially partitioned. Never raycast every forest leaf mesh on every pointer event.
- Low mode caps internal render resolution near a 1× CSS resolution and disables shadows/postprocessing. Higher mode caps pixel ratio conservatively, e.g. 1.5. Do not blindly render at a phone's full DPR.
- One main directional light, hemisphere/ambient fill, emissive lanterns. Only a small number of local lights; no shadow-casting light for every lantern. Simple water material with gentle animated normals/color, no real-time reflection/refraction pass in low mode.
- Make the transparent conservatory practical: modest panel count, correct depth handling, few overlapping transparency layers; avoid glass that renders all interiors incorrectly.
- Suspend rendering/audio appropriately when hidden, clamp frame delta on resume, dispose replaced scenes/resources and avoid allocations each frame.

If density is too expensive, simplify decoration or use instanced rounded forms. Retain full accessible geography, correct pool placement, mobile controls and puzzle completion.

### 11. GitHub Pages deployment

Target repository: `Algolon/Feh-Lu-We`. Expected default project URL, subject to actual Pages settings: `https://algolon.github.io/Feh-Lu-We/`. Do not report this as live unless verified.

Set Vite `base: '/Feh-Lu-We/'` for that project path. Use `import.meta.env.BASE_URL` or imported asset URLs; no `/assets/...` assumptions that break under a repository subpath. Avoid server-side routing; state/screens can use in-memory or hash routing. Commit package lockfile and add working `dev`, `typecheck`, `test`, `build`, `preview` scripts.

Prepare `.github/workflows/deploy-pages.yml` using current supported official GitHub Actions: checkout, setup-node, `npm ci`, typecheck/tests/build, configure-pages, upload-pages-artifact for `dist`, deploy-pages. Use appropriate permissions (`contents: read`, `pages: write`, `id-token: write`), `github-pages` environment, concurrency and the actual default branch. Verify current action versions through official docs rather than guessing. Pages source must be GitHub Actions. Do not use a forced push or destructive branch reset.

The user wants this prototype published via GitHub Pages. If authenticated and repository permissions allow it, commit relevant changes, push to the appropriate authorized branch, enable Pages source if possible and monitor the workflow through completion. Honor applicable repository instructions. If access/settings cannot be changed, deliver tested source and the exact remaining setup step, clearly distinguished from successful deployment. Never leak tokens or ask the user to paste credentials into code. Report the deployed commit and real verified URL.

### 12. Implementation order and verification

First build a minimal functioning loop with mobile input, collision and one interaction. Next generate the ENTIRE connected estate and tutorial home, then complete the required interaction systems and one complete puzzle chain. Finish with art/audio polish, performance pass and deployment. Do not spend the session producing elaborate scaffolding before anything runs. Make local checkpoints after milestones. If context gets tight, save status, commands, blockers and next actions in `docs/HANDOFF.md`, with precise working/non-working features. Never present unimplemented features as complete.

Required checks:

1. `npm ci`, typecheck, meaningful logic tests and production build succeed.
2. Browser smoke test of `dist` served under `/Feh-Lu-We/`, including assets, without console exceptions or network 404s. Test WebGL failure path with understandable message.
3. Desktop complete walkthrough from tutorial to ending without debug cheats; record solution sequence.
4. Touch emulation checks simultaneous move/look, direct tap vs drag, inventory interaction, overlay input blocking, orientation/resize, pointer cancellation and pause/resume. Real phone testing remains explicitly pending unless actually performed.
5. Collision checks: wall and closed door block movement; open door permits it; stair ascent/descent reaches correct floor; no pool fall-through; no pickup through wall.
6. Save/reload checks before and after pickups, locks, drawer opening, puzzle completion and upstairs movement. Inventory and puzzle state survive; reset works.
7. Unit tests on puzzle validation, progression dependencies, inventory/item reuse and save compatibility; focus on preventing soft locks rather than snapshotting every mesh.
8. Measure render counts, approximate load size and frame rate in available environment; distinguish device measurement from desktop/emulation.
9. Verify Pages workflow and public page when credentials permit. Otherwise state deployment limitation exactly.

Produce `README.md` (run/build/deploy/controls), `ASSET_CREDITS.md`, `docs/PUZZLE_SOLUTIONS.md`, `docs/PLAYTEST.md` (tasks, hint use, stuck points, mobile comfort and completion time), and `docs/HANDOFF.md` if unfinished. Include a short list of editable memory content IDs. End with what runs, how to play, checks completed, known limitations and deployment status.

### 13. Definition of done

I can open the verified Pages link on my phone, press Start and move/look smoothly with touch. I can prepare at home, arrive at the estate, explore the manor rooms/upstairs, indoor pool conservatory, sauna, broad garden, forest paths and sites, shed and Portuguese cottage. I can operate doors/drawers/lights/fire, collect and use objects, solve the connected puzzles, get hints and reach the ending. Progress survives refresh. The environment visibly follows the supplied art direction and corrected geography. Controls and puzzles do not require a keyboard. Anything not verified is reported candidly.

Start by inspecting the repository and immediately implement the first functioning milestone. Ask only for genuinely blocking missing information; choose sensible defaults for everything else.

## Prompt ends here

## Concept art reference guide

The seven requested references comprise an estate map and six supporting scenes: full exterior, entrance hall, pool conservatory, open garden, forest clearing and home tutorial. Concept art establishes mood and spatial intent, not exact collision geometry. Follow the written dimensions when art varies. In particular, retain the indoor pool and the open grassy garden.

## Official technical references

- Three.js, Making a Game: https://threejs.org/manual/pages/game.html — Three.js supplies rendering; gameplay systems need implementation.
- Three.js, Responsive Design: https://threejs.org/manual/pages/responsive.html — sizing the canvas and controlling internal rendering resolution.
- Vite, Deploying a Static Site: https://vite.dev/guide/static-deploy.html — GitHub Pages base path and build/deploy workflow.
- GitHub, What is GitHub Pages?: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages — static hosting and default project URL pattern.

Prepared 2026-10-04. Repository content and Pages settings were not inspectable from this session; the prompt explicitly requires Claude Code to inspect them before modifying anything.
