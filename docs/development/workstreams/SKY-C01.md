# SKY-C01 — organic stylized cloud comparison
- Branch: `sky-c01-organic-clouds`
- Baseline: `fe74db0b471d7816d840e6c223b92950adf5639f` (default `ccr-75ef4113-kfkimm`). Live served bundle confirms `fe74db0 · 2026-10-14`, index-D3-sdVd1.js SHA256 907a42e31c08146cc19ef8f5881f4a951f50738931438b37ffc54597c4faea44.
- State: PARTIAL — A/B implemented, preliminary actual-game renders successful; full matrix/measurement/decision pending.
- Approved scope: prototype + owner review only; no merge/deploy/production selection.

## Confirmed
- Production shader preserved; normal gameplay ignores candidates and allocates no mask texture.
- A: eight authored analytic profiles, bounded contour warp, broad plane shading.
- B: eight original drawn/interpolated masks in 1024×512 RGB atlas, reused phase palette and common placement/shading.
- Review selector: `?review=lighting&sky=production|procedural|masks`. ENV four-phase controls unchanged.
- Typecheck/build and 11 targeted SKY-C01/ENV unit tests pass. Six preliminary real in-engine canvas captures passed with identical matched geometry/light counters and save sentinels.
- Full Chromium fails due AF_UNIX socket restriction; headless_shell succeeds. Use CHROME below; no further browser diagnosis needed.

## Next executable step
Commit/push this increment; rebuild against that commit and capture full evidence with:
`CHROME=/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell node scripts/sky-c01-capture.mjs docs/sky-c01/evidence`
Then consolidate direction, comparison, QA, decision and handover in `docs/sky-c01/REPORT.md`.

## Parallel safety
Other local worktrees GEO-R01/TUT-R01/PB01 left untouched. Their inspected changes do not overlap cloud implementation; ENV branch differs from production primarily by later UI integration. SKY owns cloudPrototypes.ts, env.ts candidate-only additions, lightingReview.ts review-only additions. Reconcile these with any future ENV edits at integration. PB01 proposes 750k camera triangles but is not part of baseline; no 250k veto applied to clouds. No world geometry change.

## Gate
Physical Samsung GPU pacing/thermal performance and final artistic selection require owner review. Normal game remains baseline on this branch.
