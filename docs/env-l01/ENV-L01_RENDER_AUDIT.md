# ENV-L01 — render audit

Status: desktop/software renderer audit complete; owner Android failure NOT reproduced or diagnosed. No defect repair claim.

## Provenance and isolation

13 October 2026. Actual default branch `ccr-75ef4113-kfkimm`, verified GitHub metadata and Git remote HEAD: `ae2a036e783400355c8d137f24e16c33bb1a8323` (D3-b1, PR #14). Independent clone and branch `env-l01-lighting-skybox`; no other worktree or branch edited. Open PR search found only #9, VCP-01, against an older production base. Overlap: `artflags.ts` and review UI; no `env.ts` overlap. Active unpushed DEV-04D/UI-R01 work cannot be enumerated from GitHub: coordinate those files before integration. Existing VFC-01 checkout was inspected read-only, then left alone.

Read: env.ts, game.ts, artflags.ts, interactions/world.ts (LightPool/LightPatches), surfaces.ts, vegbatch.ts, boslustZone.ts, terrain.ts, estate.ts, boslustSample.ts, woodkit.ts, fire/fixtures, STYLE_TARGET, ART_BIBLE, DEV04C_PLAN/ATMOSPHERE_REPORT, newer D3/D3-b1 reports and capture/regression harnesses. No AGENTS.md in this checkout.

## What was actually tested

63 actual Three.js/WebGL2 frames, eight fixed locations (BOSLUST door and approach, lawn, manor, deep woodland, hall, living hearth, darker Sterrenkamer). Both legacy dusk endpoints, low/high, landscape; BOSLUST/lawn portrait endpoints; component isolation at late dusk in three outdoor poses; high/no-shadow and forced instanced fallback at BOSLUST. Same player poses, resolved support height, FOV 68, DPR 1, 915×412 or 412×915. Torch off. Only front door open. Fresh test browser context, no owner's save; no completed-puzzle flags edited to change dusk. `dusk` set only in renderer test hook. Detailed conditions and every frame counter: [baseline measurements](evidence/baseline-measurements.json).

Full Chromium failed before a page: `process_singleton_posix.cc:292 socket() failed: Operation not permitted (1)` / SIGABRT. Installed Chromium **headless shell 141** worked without extra permissions. Vite preview and browser must share the same execution/network namespace; a separate shell preview was inaccessible (`ERR_CONNECTION_REFUSED`). Captures use an in-process preview server. GPU: ANGLE Vulkan SwiftShader. This is real game rendering, not Android hardware or phone FPS evidence. The two owner screenshots were not attached to this mission; their camera positions/build/settings remain unknown. No identical-camera claim against them.

## Findings, by evidence class

- **OBSERVED:** no page/console errors, shader diagnostics failures or GL errors in the 63 captures. Late-dusk trees, ground and stonework remain visible at these poses; individual underside/contact regions are very dark. The reported scene-wide Android black-out was not reproduced.
- **CONFIRMED (render isolation):** hemisphere contributes visible illumination; directional contributes a separate warm component. Directional-only creates extensive black shadow-facing surfaces. Removing shadows on LOW does not recover a missing light (LOW already has no shadow maps). Removing fog does not recover near-field black geometry. Disabling the authored surface define produces limited value/colour changes, not a transition from black to correctly lit geometry. Neutral white illumination raises and neutralizes dark mid-tones without changing geometry.
- **CONFIRMED (source + captures):** dusk is not a physically night-like state: the sun remains 12° above the horizon and warm, intensity about 1.4 in woodland; hemisphere stays about 1.056. Forest floor is deliberately dark (`boslustSample.ts` floor/litter/moss targets), and low earth bounce is `#544634`. This explains some dark material presentation, not the unobserved Android failure.
- **CONFIRMED (source):** sky fragment includes colourspace conversion but omits tone mapping, unlike Lambert/Phong world materials. A visible sky therefore does not prove world lighting is healthy. This is a calibration mismatch, not proof of the reported failure.
- **CONFIRMED (source):** authored surface noise is static and bounded, applied to diffuse albedo; its intended finite-input value multiplier cannot reach zero (ground minimum 0.71 before bounded hue drift). Both vegetation paths share materials, geometry, colours and normals. The forced fallback BOSLUST frames remain visually coherent; this does not certify every mobile driver/shader precision path.
- **INFERRED:** low-reflectance terrain/canopy colours × dark earth fill × warm low-angle sun contribute to the murky evening palette. Shader precision/driver problems, actual quality selection, context loss and phone display processing remain possible for the owner's much more severe report.

## Diagnostic consequences

| Variant | Visual consequence in matched outdoor frames | Conclusion |
|---|---|---|
| Hemisphere only | Cool shaded scene remains visible, practical lights prominent | Fill reaches geometry |
| Directional only | Many black-facing masses, warm lit surfaces | Fill is essential; missing-fill Android hypothesis still requires device isolation |
| Shadows off | Low matches normal; high loses canopy shadows/extra shadow draws | No low shadow-map cause here |
| Fog off | Distant contrast increases; foreground still dark | Not the near-field cause here |
| Authored surface off | Small patch/hue differences | No demonstrated global black defect |
| Neutral white illumination | Material hues and mid-values lift | Colour/intensity balance matters |
| Tone mapping off | Different contrast and clipping; no missing geometry recovery | ACES not demonstrated as a black-out cause |
| Uniform grey material override | Geometry visibly shades and has form | Original albedo/shading contributes; NOT a fully isolated clay pass (practical effects retained) |
| Instanced fallback | Same recognizable BOSLUST geometry/value structure | No path-wide black defect at tested view |

## Recommendations

1. Do not label a brightness increase as the Android fix. Keep that issue open and request original screenshots plus device/build/quality/dusk details and matched device comparisons.
2. Preserve production light values and assets while adding an isolated review of synchronized four-phase palettes. Keep exposure 1.15/ACES fixed; shift ambient sky/earth balance intentionally and retire direct sunlight at blue hour. Reuse the dome, one hemisphere, one directional and existing pool.
3. In the prototype only, give the sky the world tone-mapping/output path; correlate horizon and haze. Keep clouds/moon/stars out of this minimum test.
4. Review fixed-camera device renders before estate-wide tuning. See QA/review documents for budget exceptions and remaining gates.
