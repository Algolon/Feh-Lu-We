# EXT-R01 — Manor facade rollout & arrival paving refinement

Status: IMPLEMENTED; functional validation passed; performance exceptions documented; not merged or deployed.
Branch: `ext-r01-manor-arrival-study`.
Production baseline: `752cb024a349ec0045d4f1873e5b191b154191f0` (approved CARS-R02 included).

## Owner direction and implementation

The owner approved the first facade/arrival direction and asked to continue, remove the isolated paving connector by the planter, and make the entrance paving less perfectly rectangular (15 October 2026).

- Removed the narrow rectangular connector between planter and entrance apron. Preserved the three concentric paving courses around the planter.
- Rebuilt the apron as bounded, irregular stone polygons with varied course heights, lengths, small chipped corners, bevels and tonal variation. No random slab rotation/overlapping stones. The underlying walk height and doorway steps remain unchanged.
- Rolled the approved facade material, green-grey joinery, deep dressed stone window surrounds and bevelled corner quoins around all main elevations. Included decorative dormer windows and the service-wing walls/windows.
- Existing doorway-aware plinth/band runs remain authoritative. Main plinths, string courses and cornices now use the dressed stone profiles; no new course is drawn across door openings.
- Existing decorative opaque glazing convention is retained. No new see-through openings, altered door geometry or collision changes.
- Dedicated exterior material preserves the interior stone/material system. Other buildings, vegetation, cars, room culling and budget policy are unchanged.
- Existing roof silhouette stays fixed; roof-edge courses, dormer treatment, chimney stone and pediment material are coordinated with the facade. This is not a new roof topology or a full terrace redesign.

## Reproduce

```sh
npm ci
npm run typecheck
npm test
npm run build
node scripts/ext-r01-review.mjs
```

The script starts a production preview and uses Chromium headless shell (override `CHROME` if needed). The branch defaults to the new exterior; `?exterior=base` builds the paired control. Evidence comes from the same production bundle, fingerprinted in `ext-r01-rollout/build-fingerprint.json`.

## Functional validation

- Typecheck, production build and 297 unit tests passed. The existing bundle-size warning remains.
- Ten paired landscape shots at 1280×720, plus portrait 412×915 and phone landscape 915×412 captures, in low quality with shadow maps disabled.
- No observed page/console errors, failed shaders or WebGL errors; high-quality shader compilation also passed.
- Interaction IDs, canonical opening/sweep/art registrations and 304 sampled support heights match the original control.
- Collision-driven approach around the planter, over the apron and steps and through the open front door passed.

## Performance findings — not an unconditional budget pass

| View | Control → new draw calls | New camera triangles | Triangle increase |
|---|---:|---:|---:|
| arrival | 99 → 101 | 235,754 | +23,048 (10.8%) |
| facade-court | 122 → 123 | 285,037 | +22,808 (8.7%) |
| window-near | 62 → 63 | 241,261 | +22,808 (10.4%) |
| corner | 101 → 102 | 244,878 | +22,808 (10.3%) |
| west-return | 105 → 107 | 289,078 | +23,048 (8.7%) |
| paving | 73 → 75 | 342,514 | +23,048 (7.2%) |
| driveway | 96 → 98 | 266,111 | +23,048 (9.5%) |
| garden-facade | 165 → 167 | 429,261 | +23,048 (5.7%) |
| east-facade | 137 → 139 | 394,781 | +23,048 (6.2%) |
| service-wing | 198 → 199 | 433,893 | +22,808 (5.5%) |
| phone-landscape | 89 → 90 | 233,539 | +22,808 (10.8%) |

- Every sampled view is below the provisional 750,000 camera-triangle ceiling.
- Garden facade was already over the 150-call policy (165); new build is 167. The service-wing-facing pose is inside the conservatory: it was already 198 and is now 199. These pre-existing exceptions remain unresolved. They were discovered by expanding coverage beyond the initial front-court sample.
- The other nine measured views fit the 150-call ceiling.
- Full rollout adds about 23,000 triangles per view, versus about 11,600 in the original bounded slice. Some paired increases exceed the independent 8% review guard; they require owner review before integration. No thresholds or culling rules were relaxed.
- `views.json` intentionally reports `renderBudgetPassed: false`; the capture process exits 1 on these recorded policy exceptions. Functional/geometry checks pass independently.
- Software WebGL counters do not establish physical-phone FPS, thermal behaviour or GPU-memory headroom.

## Evidence and persistence

- First bounded prototype: `ext-r01/` (retained unchanged), implemented in local commit `97a5d792c94cf8d6e705bc672bf5d02e2a8601e9`.
- Current rollout: `ext-r01-rollout/`, including actual game screenshots, route traces, paired counters and bundle fingerprint.
- Automatic approval review rejected featurebranch push, including after the owner's follow-up, stating that explicit remote-export permission had not been recognized. No alternative remote-write route was attempted. Current implementation/evidence are locally committed; remote persistence still requires explicit authorization.
- No merge or deployment was attempted. Production default branch remained at the baseline on the latest fetch.
