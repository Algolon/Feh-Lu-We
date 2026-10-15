# INTERIOR-R01 — recovered 2026-10-15

Base: ed232293b86a688ad6f52a01333ad3bc6b8106d5 (current default branch verified via clone and ls-remote). Branch: fix/interior-r01-recovered.

## Recovery
The previous scratch checkout flw-clean, local commit a56666d and raw screenshots are no longer present. No game-master branch exists remotely. Reconstructed the exact source changes retained in the conversation, explicitly rather than claiming filesystem recovery. No parallel work modified; recent compass UI remains on the base.

## Changes
- Replace all Kwartiermaker occurrences with Game Master in game content and associated documentation. Remove only the physical mantel reading-direction plaque; invitation/inspect guidance remains.
- Continue kitchen tile dado beneath the raised service hatch.
- Fit the short hatch handle to its leaf using min(1 m, 55% of leaf height). Ordinary door grips retain their original 1 m height.
- Keep inter-storey and attic slabs in the structural manor chunk. They block sunlight even while furniture upstairs is hidden. Previously the mIn batching rule disabled shadow casting on inter-storey slabs; attic furniture culling could remove the attic floor. Existing stairs and window openings remain. No lighting phases or fixture intensity changes.

## Fresh validation
- npm run typecheck: pass.
- npm test: 289/289 pass across 26 files.
- npm run build: pass; existing bundle-size advisory remains.
- scripts/e2e-dev04d.mjs: 18/18 pass, including hatch key availability/targeting/support, saves and IDs, construction audits and 13 low-quality budget views. The second home-scene load completed this time.
- scripts/interior-r01-check.mjs: pass. Ray tests confirm shadow-casting structural slabs above kitchen, living and lobby (3.15 m), attic slab (6.45 m), continuous tile surface beneath hatch, and hardware within hatch height. Early probe iterations corrected test assumptions about intervening beams and actual attic height; no further production changes were needed.
- git diff --check: pass.

Earlier-session before/after captures visually confirmed the repair in kitchen, lobby, dining and living. Those raw captures were lost; fresh recovery validates actual scene geometry and existing browser regression rather than claiming fresh exhaustive visual coverage. Not tested on a physical phone or across every lighting phase.

## Checkpoint and next action
The recovery patch contains all source changes, this record and the focused browser check, based on ed232293. It is saved separately for recovery if scratch disappears again. Apply with git apply on that base; otherwise use git apply --3way and review only this scope.

Publication remains blocked by the previous automatic approval review: editing was authorized, pushing to Algolon/Feh-Lu-We was not explicitly authorized. No workaround attempted. Exact next action: obtain user authorization to push, merge and deploy; fetch/review new default-branch changes, integrate safely, rerun checks if integration changes code, push the feature branch, open/review the PR, merge and verify Pages deployment.

## Publication authorization — 2026-10-15
Owner approved live publication in this chat ("Ja top. Deze mag live"). Earlier pending-authorization notes are historical. Integrated current production f9bc76f (approved CARS-R01) before release; prior roof and exterior glass repairs remain included.
