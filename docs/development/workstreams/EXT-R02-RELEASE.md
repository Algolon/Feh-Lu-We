# EXT-R02 release candidate — blocked by performance gate

Production base: a28848d19ee31a4dae72802edc417b9b820a3494 (approved Mushroom Grove R04). Its Pages deployment succeeded: https://github.com/Algolon/Feh-Lu-We/actions/runs/38814685354

Integrated ext-r02-production-integration 1c93460, which contains approved EXT-R02 checkpoint 205fddffd3196b8992e7a5bf371bffa6eae13ba0. One manor.ts import conflict resolved by retaining both architectural finish imports and kitchen juice pouch. All Mushroom Grove, handpan, audio and other production source files remain unchanged except the intended exterior integration hooks. No production ref was changed.

Validation: typecheck, 364 tests and production build passed. All eight exterior raster/triangle/picking comparisons, source visibility, front approach, moving camera budget and low/high/low quality switches passed. Animated door six-angle pixel equivalence and four conservatory traversal waypoints passed. Four Mushroom Grove same-frame comparisons preserved pixels, triangles and picking (return: 104 calls / 694321 triangles). These tests verify render compatibility, not a fresh full audio/accessibility lifecycle.

BLOCKER: static conservatory pose (121,94), looking toward (114,1.8,100), low quality, 1280x720: 155 draw calls / 460336 triangles. Limit is 150 calls / 750000 camera triangles. Garden: 110 calls. Stop before release as instructed. Candidate needs a focused performance repair and repeat of affected validation. Software WebGL only; no physical device performance claim.

Evidence: ext-r02/release-qa/results.json, paired screenshots, ext-r02/qa/motion.json, ext-r02/mushroom-compat/batch-equivalence.json. Existing render scripts reproduce the checks. Git CLI push lacked credentials; source and evidence persisted through the connected GitHub API.
