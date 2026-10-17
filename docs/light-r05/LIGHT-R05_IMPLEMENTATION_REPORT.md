# LIGHT-R05 — Stable Interior Illumination: implementation review

**Status:** CANDIDATE — NO MERGE / NO DEPLOY. Physical Android validation remains necessary.
**Issue:** https://github.com/Algolon/Feh-Lu-We/issues/98
**Source branch:** fix/light-r05-stable-illumination, from production d7b304d (17 Oct 2026).
**Evidence workflow:** .github/workflows/light-r05-review.yml (pinned baseline d7b304d versus candidate using identical QA scripts).

## Gate A — Evidence and causal mechanism

The original LIGHT-R05 actual-world diagnostic (https://github.com/Algolon/Feh-Lu-We/actions/runs/39016419899) and the user's Android recording 82406.mp4 reveal a logical living-room fire that is already on and visible while the corresponding real point-light intensity remains 0. Recorded x=84.75: 0; x=81: 0; x=79: slot transfer but 0; x=78.75: 3.084; x=77: 10.82. The source is near x=73.35, z=86.7, and its physical range is 8m. The global indoor factor was already 1 before late illumination: not caused by indoor ambient transition.

LightPool has 3 low/mobile or 4 high real point-light slots. The previous selection used distance + fixed strength weight with 2.3-unit hysteresis. Handover fades the old source completely before moving the point-light and fades the new source in. An emissive flame can remain visible long before its environmental illumination appears. LIGHT-R04 removed camera/dwell priority without resolving the underlying slot scarcity.

Previous production updates post-LIGHT-R04 did not alter LightPool (issue #98); no evidence for a lighting merge conflict.

## Gate B — Compare architectures

| Alternative | Potential | Cost / risk | Decision |
|---|---|---|---|
| A. Motion-aware, strength/range-aware slot selection | Preselect real sources before they reach physical influence area while keeping normal Three.js attenuation | Cannot eliminate scarcity; steals another source's slot | **Candidate prototype** |
| B. Source-tied surface-local patches | Stable source-linked light on otherwise dark surfaces | Wall placement, room/door masking, blending and overdraw; risk decal glow/leakage | Deferred pending surface test |
| C. Hybrid B + A | Potentially best continuity in scenes showing many simultaneously lit sources | Broader art/material changes; mobile GPU risk | Contingency if visual gate shows A insufficient |

The game already uses cheap source-tied LightPatches for floor illumination. This candidate changes selection while retaining those existing baseline patches. It does not prematurely add speculative wall decals or new shader variants.

## Gate C — Candidate implementation

- Uses translation between 250ms selection samples, never gaze; up to 1.7s physical look-ahead capped at 3.2m, and ignores possible teleports over 1.5m.
- Priority distance=min(actual distance, distance to movement-predicted viewpoint). Score includes intensity + 0.35 * source range and retains an incumbent margin reduced from 2.3 to 1.0.
- Actual THREE.PointLight positions, reach, logical on/off, portal reachability and faded transfers are unchanged.
- No extra point lights, draw calls, geometry, materials, transparent surfaces, or exposure changes.

Risks: displacement of a useful weak light by a stronger predicted light; stop/start hysteresis; visible room is not the same as physical light radius.

## Gate D — Real-scene browser comparison

scripts/light-r05-qa.mjs loads the real estate under an identical saved game, timestep (50ms), low/mobile quality, viewport, and reduced motion for both versions. Routes: hall-to-living, living-to-hall, hall-to-billiard, dining-to-hall and hall-to-library. Data include individual assigned lights/intensities, selected room, indoor factor/gain, calls/triangles, position-sampled rendered RGB central-ROI luminance, handover events, 360-degree stationary test and matched screenshots.

NOTE: Comparing the same ROI at different player positions does not isolate brightness of one world-space wall. Compare baseline vs candidate at **identical** poses; report source-level traces separately. WebGL SwiftShader is not a physical Android GPU.

Artifacts and logs: https://github.com/Algolon/Feh-Lu-We/actions/workflows/light-r05-review.yml

## Gate E — Validation and release verdict

Mandatory: npm ci, npm run typecheck, npm test, npm run test:budget, npm run build. The new light-r05 unit test guards early fire prewarming, camera invariance, closed opaque portals and the 3-source limit. Existing R02/R03/R04 tests are included.

The final browser comparison, per-route confidence, and physical Android playtest are mandatory before release approval. Those results must be added and reviewed. A green workflow by itself is **not** proof of visual success.

**Current verdict: CONDITIONAL / HOLD — DO NOT MERGE / DEPLOY.**
