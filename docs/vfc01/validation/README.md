# VFC-01 validation

**Historical run validation, not a C01 rerun or complete remote package.** C01 verifies paths/sizes/Git blob SHAs and viewer references only. Seven MP4s and 24 keyframes remain missing; original full-decode statements below refer to the earlier local packaging run. See [closeout](../VFC01_CLOSEOUT.md).

Current reconstructed source: typecheck and both production/isolated builds passed; 267 unit tests in 22 files passed. Existing production files remain byte-identical to the verified base.

- `dev04d-browser.json`: 18/18 existing DEV-04D cases against the production preview build. An initial attempt timed out on second-page navigation after the preceding checks passed; a wrapper increased only the navigation timeout from 30 to 180 seconds and the rerun completed. No original suite or assertion was modified.
- `isolation.json`: five variants preserve save/settings/backup canaries, 130 IDs, 21 checkpoints and save version 4.
- `phone-loop.json`: one render per RAF and sampling/camera control flow. This is not physical-device cadence evidence.
- `gallery.json`: 78 matched comparisons, all image dimensions, 25 linked resources and no page errors.
- `../EVIDENCE_MANIFEST.json`: image decode/hashes and all eight H264 videos fully decoded by ffmpeg; headless browser H264 playback is not asserted.

Physical-device validation remains pending. Broad performance probes use SwiftShader and show host drift.
