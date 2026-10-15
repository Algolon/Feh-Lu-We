# R04 production integration / live release

Authorization: the user explicitly requested publication to the public game after the required tests.

Production base: `c1bbdfec368674d4361c23a04e42bb98716c23e3`, branch `ccr-75ef4113-kfkimm`.
Approved Mushroom Grove: `3f9bde64b9c63d90b811166eb9d6f871b4225278` (R04).
A separate integration worktree/branch was created from the production base. The three shared files (`audio.ts`, `game.ts`, `estate.ts`) merged cleanly and were inspected; the current recorded footsteps, -30% dirt gain, bong interaction/sample, airco and kitchen juice pouch implementations were retained. No production files were reset to the older feature baseline.

## Existing production build blocker

The production base's own typecheck fails in `tests/grassR04.test.ts`: the test uses the global `Buffer`, but the project intentionally has no Node global typings (`types: [vite/client]`, minimal local Node shims). The most recent production Actions run 38781777192 also failed; preceding production run 38774168928 succeeded.

Only the test decoder was changed: `Uint8Array.from(atob(...))` and `TextDecoder` replace global Buffer. The same byte length, ID3 header and exact SHA-256 assertion remain. No footstep sample, timing, volume or audio implementation was changed by this repair.

## Validation in progress

- Unmodified production source: 308 unit tests pass; typecheck fails as described above. Its production build was generated separately for paired browser comparisons.
- Integrated source with test repair: typecheck, 315 unit tests across 32 files, four performance-policy tests and production build pass. Existing bundle-size warning remains.
- The standard full browser harness is running on the integrated build. A paired production run covers metrics and BOSLUST, where historical test failures were already documented.
- Assertions are unchanged. The local harness only increases navigation/default wait timeouts to 120 seconds for the software WebGL host. This temporary runner is not shipped.

Release gates and final deployment identifiers are recorded below when complete. The default production ref is updated only against the exact tested base SHA, so concurrent production updates cannot be overwritten.

## Resume after workspace maintenance (2026-10-15)

The transient worktrees, running browser processes and unpushed live-evidence files were removed by workspace maintenance. They were not reset or deleted by this implementation. Remote checkpoint `2a8e12dcc2f3de8c55cab0ae32363fab5e6677e3` and approved R04 remain reachable and have been freshly cloned. The interrupted complete browser run has no recoverable final results and is not claimed as a final pass. Earlier observed partial results in the conversation (including the successful tutorial-to-finale route) are historical observations only.

Production advanced to `87f4db5322b9c857034d74186d32bb43de35ffe4` (playable handpan plus repeatable Wickerman and first-clip-only grass footfalls). It was merged into the recovery branch. Two conflicts were combined deliberately: scene replacement clears both MushroomVision and the handpan target point; vegetation footprints retain both Mushroom Grove and the new hay bale exclusion. Original feature and production histories are preserved. New validation below supersedes the incomplete old run for release.
