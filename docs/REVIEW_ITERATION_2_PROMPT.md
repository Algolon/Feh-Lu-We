# Feh Lu We — independent review and follow-up implementation prompt

Reviewed 5 October 2026. Repository: https://github.com/Algolon/Feh-Lu-We. Deployed game: https://algolon.github.io/Feh-Lu-We/.

## Evidence and limits

The source checkout reviewed is commit **58a0810533b95868915bdb2b9ea581e646220f86** (“Record successful Pages deployment”). The deployed page loads `assets/index-DMMDx5q8.js` and `assets/index-B4w46lTY.css`; these filenames exactly match the production build produced from this checkout. This is strong evidence of matching build output, but is not a byte-for-byte deployment verification or an inspection of GitHub's current workflow status.

Independently completed: `npm ci`, TypeScript checking, the 30 existing unit tests and the production build. Build output: JS 757.08 kB / 209.39 kB gzip; CSS 10.05 kB / 2.83 kB gzip; HTML 1.34 kB / 0.68 kB gzip. The repository remained unchanged by the review.

The live page was opened in the cloud browser. It displayed the game's Dutch WebGL-unavailable fallback, so **I could not perform a hands-on 3D playthrough, assess its rendered scenery or listen to its audio here**. This is an environment limitation, not evidence that the game fails on Omar's phone. No real-phone FPS, touch comfort, human puzzle difficulty or completion duration was measured.

Nine independent Node/Three.js audit checks were run against the source, with mocked canvas drawing where required. All nine reproduced the behavior asserted below. These are source/scene-logic reproductions, not a browser playthrough. The original automated E2E suite was inspected but not rerun. Its documented prior results belong to the original implementation session.

The prior walkthrough uses internal navigation helpers, direct orientation changes and known answers. It tests route feasibility, collision and action plumbing, but does not establish discoverability, natural control use, fair reasoning or a 30–60 minute human experience.

## Assessment

The existing implementation has useful foundations: separated game state and puzzle rules; a coherent procedural world; shared interaction factories; pointer-ID handling; a local save system; hints; and a small static deployment. Keep this foundation. A rewrite or engine switch would add risk without addressing the main weaknesses.

The next iteration should first make the world trustworthy: doors must look as they behave; solid geometry must block interaction; selected tools must not silently disable normal actions; menus must not submit stale actions. Next improve orientation, environmental reasoning and feedback. Then improve silhouettes, materials, lighting and composition while preserving mobile performance.

### Priority findings

P1 = player-visible reliability or progression flaw. P2 = important usability, robustness or design issue. P3 = polish or defensive hardening. No catastrophic P0 blocker was independently established.

| ID | Priority | Finding | Evidence / consequence |
|---|---|---|---|
| F01 | P1 | Restored open doors can appear closed | `makeDoor` initial sync sets `angle = target` and disables collision, but does not set `pivot.rotation.y`. The updater changes the pivot only when `angle !== target`. A saved-open door stays at its closed base angle after restore. Reproduced with the real factory. |
| F02 | P1 | Upstairs interaction through downstairs ceiling | Manor slabs are visible geometry and support surfaces, but not LOS occluders. A valid ground-floor pose directly below `study.compartment` can target its hitbox within reach with no blocking segment, even while the study door is locked. Reproduced on generated manor geometry. This undermines the intended upstairs access gate. |
| F03 | P1/P2 | Selected keys suppress ordinary door actions | The dispatcher calls `useItem` whenever a selected item meets a keyed door. On an already-unlocked door this refuses with “De deur is al van het slot.” rather than opening/closing. Reproduced on the factory. Players must deselect before using the door normally. |
| F04 | P2 | Delayed button-lock submission is not cancelled | `UI.buttonLock` schedules a 250 ms callback using mutable `seq`; closing/replacing the modal does not cancel it. Clearing can change the queued answer; a correct pending answer can submit after closing and can close a subsequently opened modal. Source-confirmed lifecycle flaw; browser repro still needed. |
| F05 | P2 | Direct tap works only in the right 58% of the world view | `zone-move` occupies the left 42% and handles stationary taps as joystick starts/releases; only `zone-look` calls `onTap`. “Tap on things” is therefore incomplete for objects on the left side. Source-confirmed, real-phone feel not measured. |
| F06 | P2 | Guidance can leave an essential shed item behind | The shed beat is considered solved as soon as kindling is acquired, even if the required token is still in its drawer. `currentPuzzle` advances to fire. The player can discover the missing token only at the final gate and must retrace the estate. Reproduced in the rules. Recoverable, not a permanent soft lock. |
| F07 | P2 | Playtime measurement excludes much of the puzzle experience | `playMs` grows only while no modal is open. Reading, reasoning in panels, notebook use and hints do not count. Time also derives from clamped simulation delta, undercounting very slow frames. This makes completion-time feedback misleading. Source-confirmed. |
| F08 | P2 | Lantern feedback reveals each correct prefix | A wrong first/second lantern resets immediately; a correct one remains lit. A player can learn the code through feedback without interpreting the fire clue. Six inputs in the audit sequence suffice. This is a design weakness, not a broken rule. |
| F09 | P2 | Many main puzzles repeat symbol-order entry | Drawer, study, pool cabinet and lanterns primarily convert observation/text into sequences. The optional billiard panel offers a different rule, but still largely uses a flat overlay. Source-backed design assessment; human engagement untested. |
| F10 | P2/P3 | Reduced-motion setting does not cover all animated effects | CSS transitions and pooled-light flicker honor it; procedural fire deformation and sauna puffs continue. Source-confirmed incomplete feature. |
| F11 | P3 | Exact-centre circular collision cannot eject a body | When player and circle centres coincide, `dx = dz = 0`; substituting a tiny distance still yields zero push. Reproduced. Ordinary stepped walking may avoid it, but recovery/invalid positions need a deterministic fallback. |
| F12 | P3 | Save parser accepts unknown IDs | It checks data types but retains arbitrary inventory and slot IDs. Some consumers guard names, others dereference `ITEMS[id]` directly. Unknown IDs survive parse in the audit and can produce later errors. This matters for corrupt data and future content migrations, not a normal-play crash observed here. |
| F13 | P3 | Startup and WebGL recovery need lifecycle guards | Repeated Start calls have no in-flight guard; the capability probe accepts WebGL1 although installed Three.js WebGLRenderer requires WebGL2; context loss shows a toast but has no explicit restore flow. Source-based risks; double-start/context-restore behavior not browser-tested. |

Additional observations, deliberately not overstated:

- Distance culling leaves hitboxes/root groups enabled after hiding render meshes. A source test confirmed this, but existing distance/reach checks may prevent ordinary invisible-object interaction. Treat as an invariant worth reviewing, **not a demonstrated gameplay exploit**.
- Open-door collision disappears immediately on state change and does not follow the swinging leaf. This is simplified simulation, not inherently a bug. Improve visual/collision agreement without requiring full rigid-body physics.
- The study's “morning sun reaches the eastern place first” rule is a weak real-world explanation at this scale and with trees/buildings. Prefer a clearly defined map rule or drawn route rather than implying a physical sunrise model.
- `estateMapSvg()` shows a static layout without the player's pose, discovered-state cues or floor information. It supports broad navigation but cannot fully answer “where am I now?”
- Lights are assigned by proximity, without room/occlusion awareness. Cross-wall light leakage or reassignment popping should be visually tested, not assumed to have been observed.
- Existing documentation reports acceptable low-mode draw counts and higher high-mode counts. Those numbers were not independently remeasured here. Preserve instancing and batching rather than assuming extra geometry and shadows are free.

## Proposed improvement direction

**A memorable place with readable affordances and environmental cause-and-effect.** Keep the open lawn, indoor pool, sauna, woods and composite manor. Improve key sightlines, local visual identity and recognition of meaningful objects. Concentrate richer geometry and textures on doors, drawers, evidence and landmarks. Do not fill the estate with decorative clutter, new formal garden paths or repeated generic locks to increase duration.

For puzzles, add learning and application rather than more passwords: strengthen the opening observation puzzle, make the lantern interaction a complete-attempt environmental configuration, and give the pool/sauna puzzle a physical manipulation step. Keep a small number of clear puzzle families and optional memory discoveries. A cohesive 20–40 minute experience is preferable to claiming an hour through travel time; the one-hour goal remains subject to actual friend playtests.

The fictional story and placeholder memories are still editable. No authentic memories, photos or friend dialogue have been supplied to this review, so a follow-up must not invent them.

---

# Follow-up prompt for Claude Code

Copy everything from “You are improving…” through “End of prompt.” into Claude Code, or attach this document and tell Claude to execute this section. The existing repository already contains the concept art; do not require Omar to upload it again. If this document is a chat attachment, read it there and save a copy only if bytes are accessible.

## Prompt begins

You are improving the existing **Feh Lu We** game in https://github.com/Algolon/Feh-Lu-We, currently published at https://algolon.github.io/Feh-Lu-We/. Implement the next playable iteration. This is an incremental quality pass on working code, not a greenfield build or engine migration.

### A. Inspect, preserve and establish a baseline

Inspect the actual checkout, default branch, `AGENTS.md`, current HEAD, README, puzzle solutions, handoff, tests, deployment workflow and `docs/concept-art/`. This review refers to commit `58a0810533b95868915bdb2b9ea581e646220f86`; changes may have landed afterward. Reproduce each finding against current code and close already-fixed items with evidence instead of blindly applying obsolete instructions.

Keep TypeScript + Vite + Three.js, procedural assets, local state and static Pages hosting. Preserve save compatibility where reasonably possible. No backend, runtime AI dependency, paid assets, login, multiplayer, physics-engine replacement or general architectural rewrite. Keep unrelated work untouched. This request authorizes implementing and publishing the improved game through the existing Pages deployment within repository permissions.

Run the existing typecheck, unit tests and production build. Run the existing E2E suite where a supported browser is available, but inspect its assumptions: internal autopilot and direct game calls are not a substitute for human-facing input tests. Open the current game and capture baseline views using the tools available in your environment. If WebGL or browser support is blocked, state the limitation and continue source/logic work; never claim a completed playthrough or phone performance.

Record baseline commit, tested URL, build size and browser/device environment in `docs/ITERATION_2_REVIEW.md`. Track findings with status, reproduction, fix and validation. Proceed to implementation rather than ending at an analysis document.

### B. Fix reliability first

#### B1 — Saved doors and physical consistency

In `src/interactions/props.ts`, derive both initial visual hinge angle and collision state from the persisted open state. On first synchronization, set the pivot to its actual restored angle immediately. Later state changes animate correctly. Cover doors facing X+/X-/Z+/Z-, front/study doors, conservatory glass doors and cabinet doors.

Ensure a saved-open door looks open after reload and can close/reopen normally. During animations, collision must have a sensible relationship to visible geometry. Choose a simple swept/threshold solution or a moving leaf proxy; avoid full physics. Never trap/crush the player. Door closing safety checks should consider the player's current volume and intended sweep, not merely a remote final panel position.

Acceptance: save/reload both open and closed keyed/unkeyed doors; compare visual angle and movement passage; rapidly toggle; stand in doorway; use from both sides and floors. Assert geometry as well as state—checking only `state.open` misses the current bug.

#### B2 — Interaction occlusion and containment

In manor floor/ceiling generation and the shared picking system, solid slabs must block LOS between floors without incorrectly blocking movement on top. Add dedicated interaction occluders or robust raycasts against simplified architectural occlusion geometry. Account for true staircase holes, door openings, pool cabinet shells, furniture containers and shed walls.

Reproduce the current exploit: stand downstairs beneath the study compartment and aim upward; its hitbox is within reach while the visible ceiling does not block the collider-based segment. After repair, study note, desk lock and pickups must be inaccessible from downstairs. The legitimate upstairs route must still work.

Define a deliberate interaction policy for glass: seeing an object through glass does not permit taking it through a closed barrier. Prevent selecting through closed drawers/cabinets; availability and LOS must agree. Avoid overbroad invisible blockers in genuine openings. Separate render culling, logical availability and input eligibility with an explicit invariant; do not assume hidden render meshes automatically disable hitboxes.

Acceptance: below/above study, either side of wall and door, closed/open container, glass cabinet, stair landing. Test nearest-hit ordering and held-item use. Maintain target reach and stable nested entity resolution.

#### B3 — Selected-item behavior

Fix `Game.perform` / keyed door dispatch: an unlocked door must open/close normally while its matching key remains selected. Define wrong-item feedback for a locked target and normal actions for an unlocked target. The action label must accurately describe what will happen; do not show “Use key” when the action simply refuses. Avoid forcing repeated bag-open/deselect steps for routine navigation.

Use a contextual interaction resolver if helpful: default action, compatible item use, incompatible item response. Keep it small and data-driven. Optional automatic reusable-key selection is acceptable if behavior is consistent and communicated. For fire and well, allow intentional default actions once the setup is complete without a stale selected item monopolizing input. Test these state transitions and whether selected consumed items are cleared.

#### B4 — Modal actions and start lifecycle

Cancel delayed puzzle submissions on modal close, replacement, clear and scene changes. Capture the submitted immutable sequence and bind it to the originating modal/session. A stale callback must not mutate progression or close a different modal. Disable/reset appropriately while submitting. Consider removing unnecessary delay if animation can occur independently.

Regression scenarios: submit then Clear inside 250 ms; submit then close; submit then open bag/notebook/pause; rapid reopen; wrong/correct input. No stale attempt counters or out-of-context solution.

Make Start/Continue idempotent while loading; disable buttons/show loading feedback and ensure one input subscription set and one RAF loop. Keep errors recoverable. Detect WebGL2 specifically for the installed renderer. Handle context loss with paused input, visible recovery state and a supported restore/reload flow preserving last good save.

#### B5 — Recovery and saves

Fix the exact-centre circle push-out using a deterministic safe direction, then re-resolve. Validate restored positions against bounds, support and geometry. Improve save-ID validation and reconciliation against item/clue/entity registries, with guards at UI/action boundaries. Unknown IDs should be dropped or migrated safely, not crash a selection or slot panel. Validate bounded stats, finite timestamps, hint levels, sequences and slot values.

Introduce a new state version only if structure changes, with explicit migration of current v2 saves. Existing solved states, acquired tools and open doors must remain usable. Do not erase real progress silently. Clearly distinguish storage unavailable from save succeeded.

### C. Make mobile interaction comfortable

Keep independent simultaneous movement/look pointer ownership, pointer cancellation and no world action from UI presses. Implement direct object taps across both left and right world zones: stationary short tap can select/interact; intentional drag on the movement area controls joystick. Tune thresholds so thumb navigation does not accidentally activate objects. Do not steal UI scroll or modal taps.

Retain the centre action button for reliable interaction with small objects. Provide subtle target feedback, an enlarged touch hit region only where unambiguous, and labels for “inspect”, “pick up”, “open”, “use” and incompatible targets. Do not reveal distant secrets through outlines. World geometry and reach still apply to widened hit targets.

Smooth joystick speed response; the current near-rim jump from walking to running should become predictable. Choose either a continuous speed curve or an explicit optional sprint toggle, with a readable tutorial cue. Add joystick handedness/position adjustment only if it does not distract from core fixes. Keep FOV/pitch motion comfortable, no forced head bob, camera shake or aggressive inertia. Preserve usable portrait mode and safe areas.

Reduce HUD clutter. Add a small in-context learning sequence: move/look → inspect invitation → open drawer → pick up/use → leave. Tutorial reminders disappear after successful use. Give the held item a compact clear indicator and quick release. Prefer consistent drawn SVG icons to platform-dependent emoji for the main HUD/inventory; emoji may remain in temporary developer tools.

Provide modal focus management, focus return, sensible keyboard navigation and Escape behavior. Buttons need appropriate accessible names; the action button's accessible name should match its current action. Review narrow portrait and short landscape layouts: dial wheels, slots, inventory, clue diagrams and notebook tabs must not overflow. Preserve 48 px minimum touch targets.

Acceptance: actual UI-input tests covering left/right tap, simultaneous move/look, drag cancellation, orientation change, panels, pointer lock release and resume. Test 390×844 portrait and 844×390 landscape plus representative larger phone sizes. Real Samsung Chrome/iPhone Safari checks remain pending unless performed on those devices.

### D. Improve progression and puzzle quality

Preserve existing solvability and recognizable geography. First repair guidance: the shed beat must account for both kindling and required token, including token-in-slot and consumed/installed states where relevant. Split discovery/acquisition/completion signals so “lock solved” is not confused with “necessary object collected”. Provide a contextual recovery hint if an earlier item is missing. Allow exploring later areas early and retain previously recorded clues.

Keep hints optional. Allow choosing hints for discovered unresolved puzzles rather than always forcing the first unsolved global beat. Offer one-, two- and three-level hints with fair escalation. The objective should suggest an intention or unresolved lead, not spoil the answer. No timer gates or mandatory waiting.

Implement two meaningful puzzle improvements, fully tested, before adding optional quantity:

1. **Garden lanterns: a complete configuration/attempt.** Remove immediate correct-prefix feedback. Let the player set the intended lantern arrangement/order and evaluate a complete attempt through an obvious final action, or create a simple three-station configuration puzzle using the existing symbols. Every valid partial input should receive the same acknowledgement until final evaluation. Wrong attempts reset only the attempt. Keep all necessary evidence at the fire clearing and record it. Choose a design that does not require unnecessary repeated walking across the lawn just to enter a guess. Sequence-entry can remain if the environmental interaction and final evaluation are clear.
2. **Pool/sauna: observe, transform, manipulate.** Retain the shallow/deep and sauna link, but add a genuine physical operation such as aligning a four-position symbol wheel on the poolside cabinet while comparing pool mosaics and sauna orientation. Make the operation visible on the actual object with readable touch controls; if a focused overlay is needed, show a coherent close-up rather than a generic unrelated password card. The rule must be taught visually, not supplied only as a text instruction. No swimming requirement, complex mirrors/reflections or water physics. Existing solved saves stay solved.

Strengthen the drawer observation puzzle: distinct recognizable mantel objects at a legible scale, stable left/right convention with a visual anchor, clear invitation marks and a matching lock. Inspection text supplies accessible equivalence without making the actual scene irrelevant.

Replace the study's questionable sunlight reasoning with a clearly stipulated rule on the map: an organizer's route, directional ordering arrow or legend tied to east/west. The displayed map and world must agree. Avoid claiming physical sunrise sequencing you do not simulate.

Review arbitrary gates: “the torch must be on to read” and “matches too short for lantern” should be credible and visually supported. If lighting matters, players should see the difference; alternatively use lighting as atmosphere and let access depend on the physical puzzle. The torch should not seem irrationally ineffective on one readable plate merely because a progression flag is missing.

Give major solves a visible cause-and-effect reward: actual compartment opens, lamp path changes, well bucket rises or landmark gains warm light. Link the garden solve to the conservatory cabinet with a clear cue—auditory feedback alone is insufficient. No newly invented authentic friend stories. Keep memory placeholders editable in `src/content/memories.ts`; enrich discovery presentation with consistent fictional material only where necessary.

Add at most one new optional environmental puzzle if the core fixes and two reworks are done. Teach one rule with an easy example and apply it once in a new context. Reward a memory/discovery, not a required missing key. Do not make every interaction a puzzle or every locked door an identical symbol code.

Update solutions, diagrams, hints, dependencies and route tests together. Check alternate acquisition order, wrong item, retry, missing token and revisiting an already solved room. Record playtime as unvalidated until actual humans test it; never justify scope with a fabricated “one hour” claim.

### E. Art pass: improve composition and identity before polygon count

The review did not render the game successfully, so validate these art priorities against baseline screenshots before assuming every issue is present. Compare existing art references with the actual game from player eye height, not just an aerial camera.

Keep the canonical estate: large composite castle-like manor; forest about half the terrain; garden predominantly open lawn; enclosed pool in glazed conservatory; sauna outside to its right; cottage/pond at the rear; long driveway and woodland interaction sites. No external pool or intricate formal garden terraces.

Choose a restrained coherent style: painterly, rounded, warm animation-inspired environmental art, cream stone, moss greens, slate roofs, amber light and calm turquoise water. Avoid increasing detail uniformly. Use a small shared palette and consistent material scale. Improve:

- **Manor silhouette:** recognizable entrance, gentle roof variation/dormers where useful, believable facade proportions, selective bevels and window frames. Preserve reachable interior alignment. Add massing only if it improves identity rather than creating inaccessible promised rooms.
- **Entry/hall:** compose the doorway view toward a meaningful object and readable staircase. Keep left living/right dining understandable. Local furnishings should communicate use, not random distribution in oversized rooms.
- **Evidence props:** readable keys, drawer handles, mantel shapes, pool tiles, lantern symbols and panels. Consistent visual vocabulary for interactive parts. Budget richer geometry here first.
- **Forest:** several distinct silhouettes, varied clustered crowns, sparse ground vegetation and meaningful clearings. Landmarks must be recognizable through approach sightlines. Keep traversable space and retain instancing/chunking.
- **Garden:** broad uninterrupted grass, slight color/flower variation, useful tree shadows/contact cues, communal table as a landmark. No added dense path network just to fill space.
- **Conservatory:** clearly framed glass, practical transparency, readable pool perimeter, mild water color/normal animation and dry-side clues. No expensive screen-space reflection or refraction pipeline in low mode.
- **Cottage:** restrained white/terracotta contrast, small terraces and an inviting ending composition, visibly distinct from manor.

Improve lighting depth using inexpensive vertex/contact shading or small static shadow decals, not an army of shadow-casting point lights. Make nearest-lamp assignment stable and room-aware where practical; avoid lights abruptly jumping or illuminating unrelated rooms through walls. Keep clues readable at late dusk. Preserve warm/cool separation and restrained fog without hiding all landmarks. Avoid bloom, outlines or dark grading that reduce clarity.

Reduced-motion must affect shader/procedural animation too: fire, steam, water, foliage if added, light flicker and transitions. Static/low-motion equivalents should remain informative. Audio should use gentle non-fatiguing levels and recognizable interaction sounds; inspect/listen before asserting quality. Essential information remains visual/textual. No heavy soundtrack dependency.

Capture consistent before/after screenshots at home table, forecourt, hall, living/mantel, upstairs landing, pool, sauna, open garden, forest shed/fire/well and cottage ending. These screenshots are comparison evidence, not a reason to ship large reference PNGs inside the game bundle.

### F. Navigation and notebook

Upgrade the existing static estate map to accept current pose and discovered-state data. Add “you are here” with heading, correctly transform plan coordinates to north-up SVG coordinates, and distinguish discovered landmarks from unknown ones without disclosing puzzle answers. Keep overview readable on mobile. A small upper-floor locator or simple manor floor sketch is useful; no permanent full-screen minimap is required.

Allow returning from clue/map to previous notebook context. Group clues by area/puzzle, provide a simple inspected/solved mark and a compact recent-clue section. Avoid showing every long clue in one undifferentiated scrolling feed. Make important physical diagrams readable and keep the notebook from spelling out transformations the player is meant to infer unless accessibility/help mode requests that support.

### G. Performance and measurement

Preserve shared materials, merged static geometry, spatial collision queries and instanced plants. Measure before/after at the same viewpoints and quality settings. Previous source documentation reports low mode around 47–130 calls and 64k–163k triangles; treat that as prior reported evidence, not a new benchmark or a promise.

Target ~30 FPS or better on a real midrange phone, with 60 where practical. Cap internal drawing resolution and keep a low mode without costly shadows/postprocessing. Do not render at unrestricted device DPR. Aim to stay around <=150 draw calls and <=200k visible triangles in low mode at representative views; explain any justified tradeoff. Keep first-load transfer compact and ensure all runtime assets are local, credited and lazy-loaded where useful. Do not rebuild all geometry on every interaction.

Fix the debug FPS calculation to use real uncapped elapsed frame time; simulation delta can remain capped separately. Collect median and slow-frame timings, not only an average displayed FPS. Label software rendering/emulation explicitly.

Separate playtest timing into active session time (including reading and puzzle panels), movement/control time and explicit paused/hidden time. Exclude off-tab time, keep finished duration fixed and expose clearly named values in feedback. Add local-only events for puzzle opened/attempted/solved, hints and missing-item refusals if small enough to aid playtest analysis. No remote telemetry or external analytics service. Include build version/commit in feedback and settings so user reports identify the tested build.

### H. Verification and deployment

Add regression tests that assert corrected behavior, not tests that merely mirror implementation. In particular: saved-open hinge angle; real study LOS from downstairs; selected key/unlocked door; cancelled lock timer; left-side stationary tap; shed token guidance; unknown saved IDs; centre collision recovery; reduced-motion behavior. Run the full existing suite after each affected subsystem is complete, then a complete normal route and touch input suite before deployment.

Test production output under `/Feh-Lu-We/`, asset paths, save migration, reload upstairs and at final puzzles, pointer lock/menu flow and orientation changes. No console errors/404s. Exercise the actual visible controls where possible; clearly separate internal-helper route checks from external-input tests. Include negative tests, not only the known happy path.

Real-phone validation: Samsung Android Chrome and iPhone Safari, simultaneous thumbs, tiny target selection, glass/foliage views, browser background/resume, rotation, audio unlock and 10–15 minutes of stability. If real devices are unavailable, deliver with those checks explicitly pending rather than claiming them passed.

Keep GitHub Pages/Vite `base: '/Feh-Lu-We/'` and the current working workflow. Verify the actual default branch; the reviewed repository uses a `ccr-…` default branch. Do not assume `main`, force-push or rename branches just for tidiness. Preserve the current deployment audience. With authorized credentials, push the tested improvement and verify the workflow and deployed page. If not available, deliver the patch and precise deployment blocker. Never label an expected URL “verified live” solely because a workflow says success.

### I. Work order and deliverables

1. Reproduce reliability findings and fix B1–B4 first; checkpoint a working build.
2. Complete remaining recovery/saves, mobile controls and progression fixes; checkpoint.
3. Rework the two specified puzzles with updated hints/solutions; checkpoint.
4. Art/navigation/audio polish guided by actual screenshots; measure performance.
5. Full regression/route checks, publish and verify; write clear final status.

Do not spend the whole session redesigning architecture or expanding content. If context becomes limited, save a precise handoff describing implemented/unimplemented items, tests, source state and next commands; prioritize a coherent completed subset over several half-working features. Persist checkpoints without destructive history changes.

Deliver actual source changes, updated README and puzzle documentation, `docs/ITERATION_2_REVIEW.md`, `docs/ITERATION_2_VALIDATION.md`, concise before/after visual evidence, performance/build-size comparison and a real deployment status. Summarize which independently reviewed issues were fixed, which proposals changed after seeing the game and which tests/device checks remain pending.

Start by inspecting the repository and reproducing F01/F02/F03. Then implement the first reliability fixes immediately. Ask only for blocking information; choose sensible reversible defaults for routine design decisions.

End of prompt.

---

## How Omar can use this from mobile

Attach this Markdown file to the Claude Code chat connected to the existing repository. Opening instruction:

> Read the attached independent review and execute its follow-up implementation prompt on the existing Feh Lu We repository. The concept art already exists in `docs/concept-art/`. Reproduce the findings against current HEAD, preserve the working game and saves, then implement, test and publish the improvements. Report source tests, browser tests and real-device checks separately.

No need to reattach the original seven images or original greenfield prompt unless Claude cannot access the repository's existing documentation. This review gives a baseline and priorities, not a claim of hands-on visual or gameplay testing.
