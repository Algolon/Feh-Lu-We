# Iteration 2 — validation record

Environment for everything below: Linux container, headless Chromium 1194, **SwiftShader software WebGL**,
production build served by `vite preview` under `/Feh-Lu-We/`. FPS from this environment is not a device
measurement. Touch = Chrome DevTools Protocol touch events (real multi-touch pointer events in the browser,
not a human hand).

## Source checks

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` | **40 / 40** unit tests (was 30): puzzle rules incl. lantern complete-attempt, cabinet wheels, shed guidance, hint discovery; save v3 validation + v2 migration; collision incl. concentric push-out and occluder-only slabs |
| `npm run build` | pass — JS 779 kB (**217.7 kB gzip**, +8.3 kB vs baseline), CSS 10.8 kB (3.07 kB gzip), HTML 1.34 kB |

## Browser checks (`npm run e2e`, 53 checks, all pass on the final build)

Two kinds of test are kept separate:

- **External-input tests** — DOM clicks, CDP touch events, real picking/raycasts: regressions F04, F05,
  repeated Start, context loss, the touch suite (simultaneous move+look, release, `touchcancel`, drag vs tap on
  both screen sides, overlay blocking, bag via touch, ≥48 px targets, pause/resume, portrait resize), WebGL failure.
- **Internal-helper route checks** — `scripts/e2e-helpers.js` steers the real movement/collision with a fixed-step
  "virtual joystick" and aims the camera directly, then presses the real action. This proves route feasibility,
  collision and action plumbing; it does **not** prove discoverability, natural control use or fair reasoning.

| Suite | Checks | Notes |
|---|---|---|
| regressions (review findings) | 12 | F01–F05, F07, F10, F12, B1 door sweep, B2 glass/closed cabinet, B4 repeated Start, B4 context loss/restore |
| walkthrough tutorial → ending | 2 | 53 steps incl. a complete **wrong** lantern attempt, turning all four cabinet wheels in the world, no console errors / 404s |
| collision | 8 | wall, closed/open door, no-crush, stairs up 3.35/down 0.15, railing, pool edge, glass, no pickup through wall |
| saves | 7 | pickups, drawer, position, upstairs + flags, invalid pose → checkpoint, corrupted save, reset |
| touch (844×390, DPR 2; 390×844 portrait) | 10 | see above |
| WebGL failure | 2 | forced flag + browser with WebGL disabled |
| render budget | 12 | below |

Not exercised automatically: pointer-lock release → pause (headless pointer lock unreliable), audio unlock/listening,
background/resume on a real browser tab switch.

## Render budget — baseline vs iteration 2 (same viewpoints, same environment)

Draw calls / visible triangles for one frame. "High" includes the shadow-map pass.

| Viewpoint | Low before | Low after | High before | High after |
|---|---|---|---|---|
| gate (driveway) | 97 / 163k | 96 / 164k | 119 / 252k | 118 / 252k |
| forecourt → manor | 97 / 96k | 96 / 97k | 133 / 190k | 132 / 190k |
| entrance hall | 130 / 100k | 131 / 100k | 169 / 195k | 170 / 196k |
| garden → manor + conservatory | 121 / 160k | 122 / 161k | 153 / 209k | 154 / 210k |
| forest (shed area) | 47 / 99k | 47 / 99k | 84 / 195k | 84 / 194k |
| conservatory pool | 80 / 65k | 81 / 66k | 119 / 160k | 120 / 161k |

Low mode (phone default) stays within ≤150 calls / ≤200k triangles. Additions (dormers, entrance bay, wheels,
link lights, mantel objects) were absorbed by batching/instancing (link lights: 1 instanced mesh; outer land: 1 merged
mesh). Raw data: `docs/iteration-2/metrics-before/metrics.json`, `metrics-after/metrics.json`.

The debug overlay (`?debug=1`) now reports **median FPS and 95th-percentile frame time from real, uncapped frame
times** (simulation delta stays capped separately). Example from this environment: high quality estate frames take
up to ~3 s in software rendering — meaningless for devices, but it shows why FPS must be measured on a phone.

## Visual evidence (before → after, identical poses)

`docs/iteration-2/before/*.jpg` and `docs/iteration-2/after/*.jpg` (960×540): home table, forecourt, hall,
living/mantel, landing, pool, sauna, garden, shed, fire, well, cottage; plus `after/13-cabinet-wheels.jpg`.
Most visible changes: open front door now looks open (F01), entrance bay + dormers, unobstructed door sightline,
legible mantel row with plaque, visible pool mosaic and clear water, numbered sauna board, lantern circle.

## Save compatibility

State version 3. v2 saves migrate automatically (`playMs` → `activeMs`, empty event log); solved flags, inventory,
open doors and positions are kept (unit test). A save solved with the old cabinet panel shows the wheels in the
solved position. Garden lanterns moved: an in-progress partial lantern attempt from an old save simply continues.

## Pending — not verified

- Real Samsung Android Chrome and iPhone Safari: FPS, thumb comfort, tiny-target selection, glass/foliage views,
  background/resume, rotation, audio unlock, 10–15 minutes stability.
- Human playtest duration and puzzle fairness (the 30–60 min target remains an estimate).
- Audio quality (never listened to).
- Light leakage between rooms on a real GPU (zone logic is in place; visual check pending).
- Live page load from this session (github.io blocked); see deployment status in `HANDOFF.md`.
