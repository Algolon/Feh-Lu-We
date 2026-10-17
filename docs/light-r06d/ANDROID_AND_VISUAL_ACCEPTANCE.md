# LIGHT-R06D — visual fidelity and real Android acceptance protocol

**Status:** engineering review only. No merge, no GitHub Pages deployment, and no claim of a physical-Android pass without device evidence.

## Release principles

The fireplace (`fire.living`) and living room floor lamp (`lamp.livingFloor`) must always illuminate their **authored surfaces** when logically on, without requiring a `LightPool` PointLight slot or reacting to the player's camera/look/movement.

The shader experiment inherited from LIGHT-R06C is opt-in behind `?stableLiving=1`. The high-level question is not whether two surfaces become brighter; it is whether the result remains natural, preserves material detail, is free from room leaks, and runs acceptably on mobile.

## Matched screenshot automation

The Actions workflow `.github/workflows/light-r06d-acceptance.yml`:
- Checks `npm ci`, `typecheck`, `npm test`, `test:budget`, `build`.
- Builds **current production** at the recorded SHA and the candidate at the workflow SHA, separately for Low/landscape and High/portrait (SwiftShader WebGL, not physical Android).
- Tests dusk fractions `0`, `0.53`, `0.96` (day / dusk / dark); fixed poses at hall near/far, living entrance, living close and floor-lamp corner; all combinations of fire / floor lamp ON/OFF.
- Tests `door.livLib` closed and open from library, and deterministic hall→living→stop→360°→hall pose traversal with no flicker in source uniform state. A QA save/reload test already exists in `scripts/light-r06-stable-qa.mjs`.
- Captures 60+ metrics/snapshots per profile, including median SwiftShader-render durations, overexposed central region proportion, GPU program variants, draw calls and triangles.
- Enforces no browser/GL shader errors, and the source-bound fixture layer remaining active while all PointLights are forcibly disabled.

**Important test semantics:** central-ROI luminance alone does not establish correct room occlusion or material appearance. Review side-by-side screenshots for orange/salmon cast, mantle stone detail, wood/cloth material breakup, wall spill and plausible source reach. Be wary of frame-to-frame flicker from animation; use consistent poses/game state. The reported render timing uses SwiftShader software rasterisation and `gl.finish`: useful only for a controlled relative software comparison, not actual GPU milliseconds.

## Preview build — isolated and unpublished

A successful Actions `preview-build` job produces the downloadable artifact:
**`LIGHT-R06D-playable-review-build-NOT-deployed`**.

Extract it locally; keep the `Feh-Lu-We` subfolder. From its parent folder:
`python3 -m http.server 4188 --bind 0.0.0.0`

Open in a desktop browser:
`http://localhost:4188/Feh-Lu-We/?stableLiving=1`

For strict proof that the two sources still light the room with every pooled PointLight off:
`http://localhost:4188/Feh-Lu-We/?stableLiving=1&noPoint=1`

This is a **local server**, not deployment or a publicly hosted preview. No production site is touched. The normal game without `stableLiving=1` is your local baseline.

## Physical Android acceptance: owner's device required

Using a real Samsung/Android phone, open the extracted preview from the same trusted local Wi‑Fi:
`http://YOUR_PC_LAN_IP:4188/Feh-Lu-We/?stableLiving=1&r06dDevice=1`

The review build contains a small **local-only** recorder `light-r06d-device-probe.js` which appears only when `r06dDevice=1` is requested. It records 60 s of actual browser `requestAnimationFrame` frame durations and in-game render counters and offers a **JSON download**. It does not phone home and does not upload data.

Perform a paired test at **each quality level**, preferably with the same device, orientation, battery level and ambient thermal conditions:

1. Warm up the game and travel the hall→living→hall route once.
2. Enable `r06dDevice=1`; set quality **Low**. Record 60 s with `stableLiving=1`; walk slowly from the hall through the arch, pause, look 360°, retrace to hall. Save JSON.
3. Repeat from the **same local review build** without the `stableLiving=1` flag (control), using the same path and quality; save JSON.
4. Repeat both configurations at **High**. Optional longer 5–10-minute traversals for thermal drift; compare first vs last 60s.
5. Repeat the source-on/off and closed-door scenarios visually and note any rendering errors or source activation delay.
6. Collect FPS, P95/P99 frame interval, proportion of frames over 33.3 ms, median draw calls, triangles and shaders; record device model, OS, browser version, thermal/battery context.
7. For **true GPU frame timing**, connect Android Chrome DevTools and/or hardware profiling. Browser `requestAnimationFrame` frame intervals do **not** measure GPU execution time. Do not claim GPU pass if these measurements are unavailable.

Acceptance is relative to the locally packaged control on the **same** device. Provisional PB01 guidance: Low ≤150 draw calls and ≤750,000 triangles (some production views already exceed triangle guidance). Existing production overruns must be documented and not attributed to the lighting pilot. Target 30 FPS; reject meaningful systematic P95 regression, jank or thermal drift.

## Quantitative checks

- **Steady lamp semantics:** fire-only, floor-only, both-on and both-off work independently, persist after save/reload, do not change from hall, on turn, or on reverse travel. Strict zero-PointLight mode still emits local light while source ON.
- **Day phases:** daylight, dusk, dark; no excessive orange wash, blown stone/plaster, broken vegetation, window glare or portal seam.
- **Occlusion:** no room-wall/ceiling leak when the library door is shut. Open arch shows already-lit living from hall. Compare open/closed library door.
- **Performance:** no unexpected material clone on exterior vegetation; no new triangles; track Low calls, High calls, shader variants and on-device frame pacing. Quality differences require explicit sign-off.
- **Errors:** zero JS, WebGL shader compiler, load or context-loss errors.

## Required decision record

A final review must explicitly state:
- Code+unit tests PASS/FAIL.
- SwiftShader visual/geometry regression PASS/CONDITIONAL/FAIL with screenshots.
- Owner art direction approval yes/no/pending.
- Physical Android FPS/performance **measured/unmeasured**, hardware GPU/thermal **measured/unmeasured**.
- Final gate **PASS, CONDITIONAL PASS or FAIL**, and whether LIGHT-R08 should proceed to hall + living + library.
- **No merge or production deployment** unless user separately authorizes.
