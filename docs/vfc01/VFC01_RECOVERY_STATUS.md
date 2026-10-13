# VFC-01 — recovery checkpoint

The initial calibration workspace was removed by automated workspace maintenance after local commit but before the GitHub tree/ref upload completed. This is a recovery checkpoint, not a completed evidence package.

## Provenance

- Production branch: ccr-75ef4113-kfkimm.
- Production HEAD reverified on GitHub after interruption: ae2a036e783400355c8d137f24e16c33bb1a8323.
- Dedicated branch: vfc01-visual-fidelity-calibration.
- Lost local commit: adaf9d05e82498cd10aec3e919e8c480f1a05128.
- Lost local tree: 2a733084702ea764528a10b2fa828a0c56e8ff8d (not present as a GitHub tree).
- Some immutable blobs were uploaded, but their complete path/SHA index and remaining files were removed with the workspace. The branch remained at its production base.
- No merge, production deployment, DEV-04D source edit or permanent budget change occurred.

## Retained historical notes — not reproducible current evidence

The following are conversation-retained notes from the initial run. The original full source, screenshots, videos and telemetry are unavailable. They must not be attached to rebuilt variants as if freshly measured.

Selected zones: Library and Portugal cottage + terrace. Six fixed poses, FOV 70, CSS viewport 915×412. V0 production; V1 materials/UV; V2 craft geometry; V3 combined; V4 combined plus bounded visibility. Three geometry objects per zone: Library stack, north case, reading table; cottage table and two canopy posts.

Historical production player counts were Library 93 calls / 286772 triangles and cottage 94 / 199731; Library medium 127 / 328224. Historical V3 player counts were 100 / 289752 and 96 / 200655. Source craft increment was 4176 unique triangles. Those notes already showed that 250k was not a hard engine limit.

Historical DPR 1 / 1.25 / 1.5 / 1.75 buffer pixel ratios were approximately 1 / 1.56 / 2.25 / 3.06. Timings used Chromium SwiftShader render + readPixels fences, not a physical phone. Triangle sweeps around 250/350/500/700k used one constant-coverage, constant-material panel with variable tessellation; the Library 250k target was unattainable. No mobile performance claim was made.

Historical referenced texture estimates: production 41.98 MiB; indiscriminate full-map pilot 89.98; curated Standard 60.64; selected Phong 512/no-normal 49.98. One Poly Haven Wood Table 001 source was licensed CC0, graded/derived to game-sized swatches. KTX2 one-map test observed WebP 150012 download bytes vs ETC1S 186190 and UASTC 1098249; RGBA+mip estimate 5592405 vs BC7 compressed mip bytes 1398128. Device format/compatibility was not validated on a phone.

Historical visual conclusions were qualified: selected construction/UV direction helped; material-only Library improvement was modest; crispness/contact grounding was more substantial. Shadow striping on thin terrace rafters survived crop/no-normal controls, so the high-shadow configuration was deferred. Tiny lantern proxy 100→84 triangles saved no draw and was rejected. Existing TreeBatches already had four bands 16/26/48m and 3m hysteresis; architecture range loss and micro-decoration fades required different class rules. Authored GLB was optional and not performed.

Historical checks reported 267 unit tests, 18 DEV-04D browser cases, five-variant save/ID/checkpoint isolation and one-render-per-RAF phone control flow. Those results apply to the lost implementation and do not validate a rebuild. Physical phone results remain pending.

## Recovery rule

Rebuild only isolated VFC files from the same verified production base, recapture and remeasure the matrix, and commit/push checkpoints before large evidence uploads. Keep retained notes explicitly historical. Stop for owner review before any rollout.
