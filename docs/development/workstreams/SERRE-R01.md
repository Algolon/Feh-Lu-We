# SERRE-R01 — roof orientation repair

Date: 2026-10-15
Base: ed232293b86a688ad6f52a01333ad3bc6b8106d5 (latest verified default branch).
Branch: fix/serre-roof

## Diagnosis and change

Both pitched glass roof halves and their transverse rafters used `rz: s * slope`. In `planMatrix`, Z rotation retains its sign; the east half therefore rose eastward instead of toward the central ridge. The resulting valley left the correctly positioned ridge beam floating above the roof.

Change both roof rotation sites to `rz: -s * slope`. Existing roof span, height, materials, batching, gable panes and ridge beam are retained. No geometry is added.

## Validation checkpoint

- Inspected current conservatory builder, CONS footprint, box base-height semantics and planMatrix rotation convention at the pinned base.
- Analytically checked both transformed rafter endpoints: eaves X116/X130 at Y3.36; central ends X123 at Y5.76. Rafter top at ridge is approximately Y5.798, overlapping the ridge beam starting Y5.74. Eave rafters overlap wall plates Y3.32–3.40. Roof glass follows the same corrected rotation.
- Local execution is unavailable after the interrupted session: exec-server returns “No such file or directory”. Previous local worktree cannot be inspected; no local files or parallel work were modified or reset during recovery.
- Remote fix branch was absent before recovery; recreate from the latest verified default-branch commit rather than the obsolete local baseline.
- Typecheck, unit tests and production build: pending the existing push-triggered GitHub Actions workflow. Check the branch workflow result before merging.
- Visual browser validation remains open: inspect from the pool perimeter and outside both gable ends; confirm a high central ridge and continuous roof framing. No visual pass is claimed.

## Exact next step

Check the feature-branch GitHub Actions build, then perform the visual checks above when browser/runtime access is available. Merge/deployment has not been requested in this chat and is not part of this checkpoint.
