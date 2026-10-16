# VEG-R09 production integration

User authorized publication of the accepted local vegetation on 16 October 2026. Integrated `d2a1fa7` into production base `be9a9e2` rather than publishing the historical recovery checkout directly. Production exterior/arrival, sky, portals, Mushroom Grove LOD, audio and upstairs identity updates are retained. Concurrent uncommitted rug work in the recovery checkout is excluded.

The normal browser entry now defaults to woodland-r02, trees-r03, vegdetail r05, groundart r07 and gardenart r09. Explicit older review parameters remain usable. Node-only geometry tests retain their explicit baseline behavior.

## Integration corrections

The full 117-record integrated art study confirmed both render paths, all 38 room fits and the same 49 additions, with no page/shader/WebGL errors. It exposed excess rendering cost in distant BOSLUST and a new conservatory corner. Raw intermediate measurements are in `visual-before-culling/results.json` and `visual/results.json`; these are discovery records, not passing final-budget evidence.

Front hedges now retain their inset body at distance, while separate close-leaf groups draw near the manor (25 m from their bounds). Nearby geometry and leaf coverage are unchanged. Meadow grass keeps exactly the same individual models, transforms and colours but uses 20 m batching cells instead of 40 m; this avoids drawing entire coarse cells outside the camera or behind the manor. No budget ceiling was raised.

Final default-entry checks use the production bundle, without vegetation opt-in parameters, on both renderer paths. They recheck BOSLUST, the conservatory corner, near hedge, forecourt and living room; assert the 38-room / 49-plant audit; verify detailed hedge leaves are present nearby and absent in the distant BOSLUST view; and enforce the central low-quality budget. `default-entry/results.json` is final sampled renderer evidence.

## Checks

- Typecheck, 433 unit tests, four budget-policy tests, production build and whitespace checks pass. Existing bundle-size warning remains.
- Actual gameplay controls: **33/33 checks pass**, including tutorial-to-finale traversal (70 steps, 31 clues), wall/door/stair/railing/pool/glass collision, saves/restores and touch/portrait controls. No vegetation or puzzle state was bypassed in the walkthrough. `E2E_CAPTURE=0` skips redundant walkthrough screenshots; touch screenshots remain. Checks ran before the final grass-cell refinement, which changes only render grouping, not geometry placement or collision.
- The first concurrent browser attempt timed out taking a screenshot. The separate rerun passed. A CI-only timeout in the atlas test was removed by checking the same complete coordinate array in one assertion instead of thousands of assertion calls.
- Software Chromium/SwiftShader verification does not establish physical-phone FPS, heat or shimmer acceptance.

## Reproduce

`CHROME=/path/to/chromium E2E_CAPTURE=0 E2E_ONLY=walkthrough,collisionChecks,saveChecks,touchChecks E2E_OUT=docs/veg-r09-release/e2e node scripts/e2e.mjs http://127.0.0.1:4179/Feh-Lu-We/`

`CHROME=/path/to/chromium E2E_OUT=docs/veg-r09-release/default-entry node scripts/veg-r09-live-smoke.mjs http://127.0.0.1:4179/Feh-Lu-We/`

The same smoke script accepts the public Pages URL after deployment. PR: https://github.com/Algolon/Feh-Lu-We/pull/68

Final local default entry: all 10 views pass, maximum 131 calls and 746,794 triangles. Source hashes are in `validation.json`.
