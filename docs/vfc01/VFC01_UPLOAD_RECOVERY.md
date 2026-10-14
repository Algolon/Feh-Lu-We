# VFC-01 — verified upload recovery

Checked 14 October 2026. State: **BLOCKED — missing original evidence bytes**.

## Verified checkpoint

- Existing branch: `vfc01-visual-fidelity-calibration`.
- Starting remote HEAD: `870fa9eb0db6101db0fe80b28b17f044e6cd3db5`.
- Current production HEAD at inspection: `6b2b82d95fc761390b9275c94ee363f37a25f6bf` (UI-R02 merge). VFC's experimental production base remains `ae2a036…`; it was not rebased or merged.
- Source, reports, telemetry, prior validation records and viewer are reachable on the existing branch.
- Of 201 files in the original evidence manifest, 35 are present and all 35 match their recorded SHA-256 checksums at the starting HEAD.
- Missing: **166 files / 38,290,438 bytes**: 157 WebPs, eight MP4s and one PNG contact sheet.
- Present images: **12 baseline WebPs**. There is no material-only WebP reachable in the inspected branch tree. An uploaded but unreferenced blob would not count as delivered evidence.
- All eight videos and all nine selected before/after image files are missing.

## Local/process reconciliation

The active task directory was empty at startup. No VFC upload, Base64 conversion, ffmpeg or rendering process was running. Two other surviving checkouts belong to UI-R02 and ENV-L01; both were clean and were left untouched. A fresh checkout of the **existing** VFC branch was made solely for recovery inspection and these delivery-status changes.

Workspace and temporary-file searches found no original VFC imagery, MP4s, archive or upload ledger. Searches of saved files for VFC01 and Visual Fidelity found no recoverable package. The supplied workspace-maintenance notice explains why a previously present scratch directory may be unavailable; the precise time of its removal cannot be established from current evidence.

The branch history through its VFC checkpoints contains no selected images, material-only evidence or videos. Local Git object validation found no dangling recoverable objects in the fetched checkout. The historically documented lost tree `2a733084702ea764528a10b2fa828a0c56e8ff8d` is not retrievable from GitHub (404).

## Upload failure: what is established

Creating a GitHub blob does **not** add it to a branch. Delivery requires a tree referencing its path/SHA, a commit with that tree and a successful branch-ref update. The remote stayed at `870fa9eb`, so no later complete upload checkpoint was published.

The previous session's upload logs and path-to-blob-SHA ledger are unavailable. The original manifest stores **SHA-256 file checksums**, not Git blob object IDs; those checksums cannot be used as GitHub blob addresses. GitHub's available interfaces cannot enumerate unattached blobs. Therefore neither the exact original stall cause nor the contents of any remaining unattached uploads can be established here. No claim of a GitHub size limit, timeout, conversion failure or authentication failure is made without evidence.

The immediate, verified blocker is the absence of both source bytes and recoverable Git object addresses. Uploading the remaining evidence is impossible from the retained checksums alone.

## Changes in this recovery checkpoint

- Added `UPLOAD_AVAILABILITY.json` with a complete present/missing path inventory at the starting HEAD.
- Corrected README and recovery-history delivery claims without removing historical measurements or conclusions.
- Added a prominent incomplete-upload notice to the existing viewer. It displays available baseline frames, hides missing image/video resources and labels unavailable comparisons explicitly. It does not substitute baseline images for experimental results.
- Preserved `EVIDENCE_MANIFEST.json` as the original expected-package inventory.
- No regeneration, remeasurement, unit/regression rerun, source-pilot edit, deletion, new branch, merge or deployment.

## Next safe action after original assets are recovered

Recover the original selected frames and eight MP4s, or the prior upload ledger mapping exact paths to Git blob SHAs. Match recovered bytes to the original manifest before attaching them. Do not regenerate research evidence under the original hashes.

1. Prioritise the nine selected comparison frames; publish no more than three files per batch.
2. Publish each video separately, then its matching poster when available.
3. After each batch, create a tree based on the latest remote tree, create a child commit, and update only this branch with the expected previous SHA. Alternatively use an authenticated ordinary Git push.
4. Re-read the remote HEAD and tree; verify the exact new paths, sizes and blob SHAs before starting another batch.
5. Save the path/SHA ledger in the same commit. Stop on the first failed batch, preserving blobs and source bytes; retry only with a new concrete hypothesis.
6. Upload the remaining matrix evidence in small batches after the selected comparisons and videos are durable.

Review can assess reports and retained baseline evidence now; the experimental visual conclusions still lack their original remote evidence. Physical-phone validation remains pending.

## Continuation — 14 October 2026

Started from `6d06ce7`, preserving its parent `870fa9e`. The earlier recovery checkout survived and was clean; a separate checkout of the same existing branch isolates this continuation. Production remains `6b2b82d`; no production/parallel source is incorporated. The 112 locally unreachable blobs were checked against missing-file sizes/SHA-256 values: no original-media match. Conversation retrieval yielded no path/blob ledger.

Full Chromium fails before page creation because the environment denies its process-singleton Unix socket. A bounded alternative, matching Playwright Chromium 141 Headless Shell, successfully created WebGL2. Missing selected images can therefore be reproduced from the unchanged source tree `f73b44f6aec2f19ec32310d3e02dfa0e89c70c08`. The first reproduced Library baseline has exactly identical decoded pixels to the retained baseline. Count/configuration checks guard each capture; timing records are unchanged. `RECOVERY_CAPTURES.json` distinguishes each new reproduction and its source commit. `EVIDENCE_MANIFEST_ORIGINAL.json` preserves the original file checksums.

Ordinary Git reads/fetches work; a dry-run push failed because no GitHub username/credential is available. Use bounded authenticated connector batches, immediately attach blobs through tree/commit/ref with an expected HEAD, then verify the remote tree and sizes before another batch. No Base64 conversion is repeated for an asset.

Reproduction command: `VFC_BROWSER_PATH=/path/to/headless_shell node scripts/vfc01-recover.mjs selected`. Tasks `matrix`, `sweeps`, and `video V3:vegetation` reproduce only missing paths; video uses the exact previously recorded poses/order. Each job should run under an explicit timeout. `python3 scripts/vfc01-integrity.py` enforces complete expected evidence; `--allow-incomplete` is an inventory mode, not a relaxed completion gate.

The selected front capture initially differed by 5,360 submitted triangles when resumed without earlier camera visits. Replaying the original library→terrace-player→front sequence restored the original 117,996 triangles; vegetative LOD history must be preserved during partial resumption. The rejected capture is diagnostic only. No acceptance threshold was changed.

Main-matrix milestone: all 90 frames are present (six original V0 colour frames preserved, 84 missing frames reproduced). Every reproduced main/selected frame matches its prior recorded camera calls, triangles, source triangle count, referenced texture bytes and DPR. No prior timing JSON was modified. Dynamic and supplementary evidence remains pending.
