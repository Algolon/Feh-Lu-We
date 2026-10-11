# VCP-01 visual quality report

**Status: incomplete draft, not ready for integration.** The original pedestal experiment has rendered evidence. After owner feedback, the library globe has been replaced in code by a four-leg stand based on the newly supplied `81891.jpg`. New-model rendered validation is pending. The pedestal implementation is retained for future placement, without changing any other room.

## Evidence and assessment

The [phone index](README.md) links genuine matched standard, clay and neutral captures from the first experiment. Untouched production = `3e09c982dcc5c1d1f5790cd818ba949e88fb2323`. Camera/renderer records are in `frames/production`, `frames/base` and `frames/pedestal-study`. Nine viewpoints, including portrait, low quality, DPR 1, no antialiasing. Clay neutralizes Lambert and Phong and removes coloured effects. All nine production-versus-review-base clay frames are pixel-identical; standard/neutral frames have small dynamic/raster differences recorded in `history/production-vs-review-base.json`.

Scores below are **the implementing agent's provisional judgement**, not independent proof or owner approval. They apply to the first rendered three-asset experiment, not to the replacement four-leg globe.

| Criterion | Base → study | Observable evidence | Remaining defect / confidence |
|---|---|---|---|
| Silhouette and proportion | 3 → 4 | Globe close-up/clay: thin tripod replaced by a continuous profiled base; table near: shaped, more substantial legs; chair near: curved taller crest/ears | Owner prefers the newly supplied stand design. Chair gain smaller than globe. Medium confidence |
| Construction credibility | 2 → 4 | Globe side: band carried by a saddle and stem; table: leg blocks meet aprons and edge profile | New stand needs rendered multi-angle inspection, even though its assembly unit audit passes. Medium |
| Material identity | 2 → 4 | Globe neutral: spherical printed map replaces raised land pieces; brass and wood remain distinct | Schematic coastlines are much simpler than reference printing; no exact texture-fidelity claim. Medium |
| Lighting and grounding | 3 → 4 | Globe foot/seat contacts, table joints visible under unchanged lighting | Chair contact may be too dark; no physical-device observation. Medium |
| Scene cohesion | 4 → 4 | Wide/alternate preserve palette, layout and hierarchy | No estate-wide recommendation to replace all furniture. Medium |
| First-person readability | 3 → 4 | Globe identifiable at 3 m, table legs and chair crest visible without pixel zoom | Fine band bevels have little effect at 3 m. Reference-selected replacement is unscored. Medium |

The code-first hypothesis is **partially supported**: the first renders show a clearer globe construction and modest furniture gains without lighting changes. The owner accepted the first globe's appearance but selected a different design for the library. Do not equate the updated geometry tests with demonstrated visual success of that replacement.

## Resumed validation — 11 October 2026

Production reverified through GitHub at `f26e5637a677a49dcdd2eadca3b49224de364652`; PR #9 remains a draft. A bounded browser preflight failed before page creation:

```text
third_party/crashpad/crashpad/util/linux/socket.cc:45
setsockopt: Operation not permitted (1)
process did exit: exitCode=null, signal=SIGTRAP
```

Git transport separately fails with `Failed to connect to proxy port 8080 after 0 ms: Could not connect to server`. The cloud HTTP policy reports unrestricted/enforced (revision 18), but that does not grant local socket permissions. No Full Access escalation was requested. No rendering or full regression pass is claimed for this retry. Existing unit/build results below are historical results, not reruns against reconciled production. [Machine-readable status](VALIDATION_STATUS.json) explicitly leaves new-model metrics null.

The owner's assessment is **clear earlier-globe improvement, modest furniture/whole-library improvement**. The rubric above is dominated by the hero asset and must not be read as a one-point whole-room improvement. At player-eye distance, furniture gains remain incremental; close-up joinery cannot establish a materially better library composition. The replacement globe is unscored until its actual standard, neutral and clay renders are inspected. No contact sheets were regenerated using old frames.

Resume with production reconciliation preserving both histories, then make one build and serve an immutable copy for sequential main E2E, DEV-04B, DEV-04C, VCP-01 and any added production suites. Do not rebuild or capture concurrently with tests. Record a build-file hash manifest before and after the run. New baseline/pilot captures must share the reconciled build, camera and settings; keep the untouched original baseline as historical provenance.

## Technical evidence and limits

- Current source: typecheck and production build pass; **229 unit tests pass**, including finite normals/UVs, cap degeneracy, native sphere UVs, cached geometry, stand connectivity/footprint, table datum/drawer clearance and review storage flags.
- Baseline DEV-04B: 9/9 checks pass, 130 interaction IDs, 21 checkpoints, schema 4.
- First-pilot browser checks: finite geometry and Asm audits pass; actual catalogue UI solves and opens the drawer, and study-key pickup works; repeated variant rebuilds stabilize at base 59 geometries / pilot 60, both 20 textures after warming.
- That first switch test falsely compared an internal collision-query counter; the test now compares only physical bounds/colliders/floors/ramps. It also correctly found a settings read-through; the library review now isolates settings as well as saves. Both fixes await browser rerun. Previous raw results are retained under `history`, not presented as a clean pass.
- Full `npm run e2e` was attempted, but did not pass: timeouts, touch-tap checks and a changed-build asset 404 occurred while parallel capture/rebuild work was active. It must be rerun against an immutable final build with the supported browser. Do not infer a production bug or a clean regression pass from this run.
- Final `e2e:dev04b` and `e2e:dev04c` are pending; the chained command stopped when the main suite failed.
- The resumed sandbox blocks local browser sockets and browser download requests. No fresh screenshots of the four-leg revision, final renderer budget, reliable frame-time median/p95 or physical Android FPS are available.

Earlier pedestal-study view costs (not the new stand):

| View | Base calls / triangles | Study calls / triangles |
|---|---:|---:|
| Library wide | 58 / 201,558 | 59 / 208,010 |
| Table near | 47 / 181,720 | 48 / 188,172 |
| Seating near | 46 / 226,870 | 47 / 231,802 |
| Globe 3 m | 31 / 184,270 | 32 / 190,722 |
| Globe 1 m | 28 / 181,036 | 29 / 187,488 |
| Globe side | 31 / 181,230 | 32 / 187,682 |
| Library alternate | 80 / 236,168 | 81 / 241,100 |
| Globe rear | 45 / 222,214 | 46 / 228,666 |
| Portrait | 28 / 178,568 | 29 / 184,072 |

All earlier-study views meet 150 calls / 250k triangles. The replacement stand must be measured anew. Startup-contaminated frame statistics in raw capture records are not usable performance samples. Shared globe map = 512 × 256 RGBA, roughly 0.67 MiB with mipmaps; this is an estimate, not driver memory. No external models or runtime reference images.

## Reusable techniques

Recommend evaluating these for later adoption, subject to owner review:

1. **Construction first:** explicit support chain and immutable interaction datums. A small well-joined asset is more useful than extra ornament.
2. **Turned profiles and flat-section metal bands:** distinctive silhouettes at modest cost. Validate cap area/normals; do not blindly accept primitive output.
3. **Native sphere UVs + compact cartography:** strongest material/readability gain in the first globe. Use selective original markings without labels or puzzle clues.
4. **Subdivide only deformed planes:** the chair crest needs interior vertices to arch visibly; other flat surfaces do not.
5. **Grain orientation and local contact:** strengthen material logic without global lighting retuning. Avoid making contact decals too dark.
6. **Fair review harness:** immutable production build, same poses/settings, full Phong-aware clay, explicit render before counters and isolated save state.

Do not standardize the private lathe cleanup helper estate-wide yet; it needs broader profiling. Fine bevels and paper speckle contribute little at normal play distance. Complex ornamental carving, anatomically expressive sculpture and richly authored antique maps may still justify dedicated modelling/painting tools. No such dependency is introduced here.

## Outstanding gates

New stand renders and visual iteration; final switching/save/browser suites; fresh budget/timing records; reconcile the branch with production's later `f26e5637a677a49dcdd2eadca3b49224de364652` integration; owner visual approval; actual Android performance. No merge or deployment is authorized by this report.
