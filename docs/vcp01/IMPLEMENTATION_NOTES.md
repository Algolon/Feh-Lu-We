# VCP-01 implementation

Three assets only, opt-in under `?review=library-craft&craft=pilot`. `craft=base` is the default; `craft=pilot` alone has no effect. Production assets and the study globe are retained. No puzzle, interaction, save schema, lighting, room or route data changed.

- **Globe:** native-UV 40 × 24 sphere; 512 × 256 original schematic map with parchment sea, sage land, coastlines and graticule; closed chamfered flat brass meridian band; polar bearings; continuous lathed walnut pedestal and stepped foot. Source PNG inspected and digest verified (see audit). A floor-height interpretation with a longer stem and much simpler cartography, not an exact reference reproduction. The source image and misleading label are not runtime content.
- **Table:** immutable 1.1 × 2.2 footprint / 0.81 m top datum; breadboard ends with transverse grain, under-edge profile, corner joint blocks and turned tapered legs. East apron remains open for the original moving drawer; no cover over the catalogue sockets.
- **Chair:** existing upholstery builder, one optional `craft` parameter used only here. Taller arched outer back, taller loose back cushion and sculpted curved ears. Existing roll fronts, fabric, frame, seat, foot locations and collision retained. Face subdivisions are added only where the back/wing actually deforms.
- **Grounding:** existing ContactShadows, one library-owned instanced layer. Globe/seat and individual table feet; no broad lighting change. Material is owned/disposed by World; shared shadow texture follows the existing kit lifecycle.
- **Engineering:** Asm room batches, existing timber/fabric/brass families, axis-specific UVs, static base occlusion, deterministic map seed and bounded cached source geometry. New globe uses one shared material/texture. The private lathe wrapper removes degenerate cap faces and corrects axis normals discovered by tests; it is not promoted into artkit from a single pilot.

## Review and reproducibility

The existing in-memory review storage automatically isolates this entry, including settings. The touch-sized switch rebuilds via the established World disposal path, keeps pose and game state, and updates the URL. Exit goes to the normal game. Original builders remain in the `else` path.

```sh
npm ci
npm run build
npm run preview -- --host 0.0.0.0
# http://localhost:4173/Feh-Lu-We/?review=library-craft&craft=base
# http://localhost:4173/Feh-Lu-We/?review=library-craft&craft=pilot
CHROME=/usr/bin/chromium node scripts/e2e-vcp01.mjs
node scripts/vcp01-capture.mjs base
node scripts/vcp01-capture.mjs pilot
python scripts/vcp01-sheets.py
```

For `production` captures, serve a build of the audit's exact source SHA and set `BASE_URL` to that server. Do not label a current-branch baseline as an untouched production capture. The script writes camera/FOV/quality/context settings, renderer counters, construction audits and errors alongside each set. Nine viewpoints (including portrait), each in standard, neutral and clay. Identical standing height, target, exposure, low quality/DPR 1 and fixed simulation clock. Explicit render + GPU completion precedes counters, avoiding the stale-frame measurements found during development.

Clay replaces Lambert and Phong, removes vertex/instance tint, transparent surfaces, unlit glows/shader effects and point lights. Neutral removes fog and uses white hemisphere/sun at fixed strengths and exposure 1; fixture lights/materials remain present, as in the established baseline method. No light-direction occlusion is baked into assets.

Software-rendered Chromium verifies actual shape, composition, shader compilation and counters. It cannot establish Android frame rate. Source image access is verified; owner fidelity approval and physical-device performance remain separate gates.

## Phone review

Start with [the mobile evidence index](README.md). Images are ordinary JPEGs viewable directly in GitHub on Android; tap a sheet to enlarge. No developer tools or modelling application are needed for this first visual decision.

No branch-specific hosted preview exists: repository Pages deploys only its default branch, and has not been changed. For live review, run this branch in a local/LAN environment or a browser-accessible development workspace and open the URLs above. A new hosted preview would require a separately approved hosting action; do not use the production Pages URL for this experiment.

## Owner-selected revision

The library now calls the four-leg `craftGlobe`; the earlier design is retained as `pedestalGlobe` and its captures moved to `frames/pedestal-study` / `pedestal-comparison`. No other room was changed. This avoids expanding the experiment while preserving the owner's option to use the first design elsewhere. The new stand reuses the spherical map/material and polar bearings; its lathed horizon, legs, rail joints and centre support are separately testable. The old Globe bullet above documents the first study, not the replacement's support geometry.
