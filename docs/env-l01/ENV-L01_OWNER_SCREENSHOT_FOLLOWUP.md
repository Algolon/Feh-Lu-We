# ENV-L01 — owner approval and black-render screenshot follow-up

13 October 2026. Owner approved **all four atmospheres** (daylight, golden afternoon, blue hour, late dusk). Colour palettes are unchanged. This approves the visual direction; no merge or production deployment authorised or performed.

## New evidence

Owner attachment `82052.jpg` was actually read and inspected. Original phone/browser bars are not republished to public GitHub; the attachment remains in the conversation. [Pixel analysis / provenance](evidence/owner-screenshot-analysis.json) records its SHA256, size and diagnostic ROI.

**OBSERVED:** blue/slate sky and HUD remain visible; most trees/ground/foreground structures are black or near black; isolated foliage surfaces, a luminous lantern and the lock retain colour/value. Black tree silhouettes occlude the visible sky, so at least those objects are being drawn. This is materially more severe than the ordinary production dusk captured in the first audit.

Selected ROI x=0…709, y=410…1235 (825 rows, excluding top HUD text and lower joystick): encoded-JPEG luma median **0**, **87.49%** at <=8/255. The ROI still contains some sky and objects; it is not semantic segmentation, physical luminance, or a matched-camera comparison to the earlier frames. Its numbers do not identify a cause.

Current published game was fetched directly: embedded build **ae2a036 · 2026-10-12**, still with the legacy positive hemisphere/directional formulas and authored surface shader. [Served-build verification](evidence/served-build-check.json). Screenshot build, cache, quality, exact pose, renderer and progress value remain unknown.

## Revised diagnosis

- **CONFIRMED:** the owner's symptom exists in the supplied image. It is no longer merely a verbal report. The severe defect is still **not reproduced natively** on the available renderer and its cause remains unconfirmed.
- **INFERRED, priority:** a failure in global light contribution or a shared lit-shader path is consistent with black surfaces while sky/emissive elements survive. Colour in some foliage does **not** prove point lights are functioning; it may come from directional or local illumination. Do not diagnose a missing HemisphereLight from the picture alone.
- **INFERRED:** ordinary dusk calibration is an inadequate explanation for the breadth of black surfaces, given the positive source light values and intact software reference. Pure distance culling is also inadequate for the silhouettes that visibly cover sky. Neither statement rules out other runtime/driver issues.
- **UNRESOLVED:** high-vs-low shader/shadow path, global light visibility/uniform upload, material/shader variants/precision, batching path and the exact cached build. High-quality shadows normally affect direct light, not hemisphere fill; a dark high-quality result alone would not identify the fault.

## Controlled tests — deliberate fault injection, not an Android reproduction

![Inferred nearby pose: normal, deliberately disabled globals, deliberately disabled hemisphere, approved pilot](evidence/owner-controlled-diagnostics.jpg)

Real game, inferred BOSLUST-near pose (x63, feet at support height, z13.5, yaw33°, pitch0), 412×733 DPR1, coarse pointer, preview t=0.85, torch off. **This is not the owner's exact pose.** Nine capture records (including a repeated normal reference after restoring material defines) isolate low/high normal, globals-off, hemisphere-off low/high, hemisphere-only, authored surfaces off, and pilot. [Measurements](evidence/owner-followup-measurements.json).

Turning globals off deliberately produces widespread dark/black surroundings while sky and lantern presentation remain. Removing hemisphere produces black-facing/shadowed areas but retains many sunlit surfaces; high adds direct shadows. Neither forced variant duplicates every feature of the owner screenshot or proves the corresponding fault actually occurred. Normal reference remains readable. Material surface shader can now be disabled and exactly restored using the sandbox panel; no production material pipeline change.

## Device diagnosis controls added to the isolated review

`?review=lighting` → ENV-L01 panel:

- **Only local lights (test):** zeros global sun/fill deliberately. Reference only, never a repair.
- **Without authored surface shader:** removes the FLW_SURFACE defines, then restores their exact originals when another diagnostic is selected. Geometry, textures and other defines remain.
- **Download render diagnosis:** exports `ENV-L01-render-report.json`: build, camera, quality/DPR, actual review mode/value, exposure, scene-light visibility/values, linked cached-program global-light uniforms, GPU/precision/capability information and GL diagnostics.

The report excludes the saved game, inventory, puzzle flags and personal storage. It is downloaded locally, not uploaded or sent. Cached programs include unused variants; the report must be interpreted together with the image. Reading GL error samples/clears that error flag. [Software export smoke check](evidence/report-export-check.json): report downloaded/parsed, 88 linked programs, no GL/page/shader errors; puzzle flags unchanged.

### Validation scope

Latest diagnostic code: typecheck/build pass, **273 unit tests pass**. Browser UI selections, surface restore, normal references and JSON download exercised in the nine captures; no console/page errors. Original full E2E 102/103, DEV-04C 22/22 and DEV-04D 18/18 remain results of the earlier committed prototype, not reruns of this addendum. No phase palette, ordinary game light value, save/progression logic or world geometry changed. The extra review diagnostics add about 1.42 kB gzip relative to the first prototype; no ordinary-frame shader work is added.

## Smallest next step on the owner's phone

1. In the currently published game, select **Low** quality, reload and take a screenshot from the same spot. Keep the same save and torch state. Note whether High was selected for the supplied image and record the build from Pause.
2. If the scene remains black on Low, compare the existing production `?multidraw=0` fallback at the same spot, with the same save; this is already available without merging ENV-L01.
3. If/when the isolated branch is served for device review, capture normal/hemisphere-only/without-surface-shader frames and download a report. The current production URL does not yet contain the new lighting review or its report button.

Keep root-cause repair and final integration blocked until device evidence narrows the fault. The four-phase art direction is accepted and should not be re-darkened to imitate the faulty screenshot.


## Second owner comparison — High and Normal both readable

Owner supplied `1791896546517.jpeg` (High, first image) and `82065.jpg` (Normal, second image), showing a visually very similar BOSLUST view. Both attachments were inspected. **OBSERVED:** High adds canopy/ground/stone shadows; Normal is brighter and flatter; both retain terrain, stonework, door, foliage and spatial form. The earlier scene-wide black appearance is absent in both. The door is open in these new views; the old view/camera and action sequence were different, so these are not a controlled reconstruction of the original failure.

Same diagnostic ROI as above: High median encoded luma **32.11**, near-black **6.99%**; Normal median **50.87**, near-black **2.19%**, against the earlier image's 0 / 87.49%. [Provenance and metrics](evidence/owner-quality-comparison.json). ROI contains different subject pixels across the old/new views: this confirms the observed severity difference, not a photometric effect attributable only to quality.

**Updated conclusion:** High by itself is not a sufficient cause; the owner's device can render readable High and Normal frames at this view. A permanent all-frame failure of the global-light/material path is weakened. An intermittent or state-dependent fault remains plausible, as do a camera/location-specific issue or a different cached build. No root-cause repair is claimed and no rendering code was changed based on these two frames.

**Source observation:** a High↔Low change calls `applyQuality(true)` (`game.ts` pause callback). It changes DPR/shadow enablement/map size, marks scene materials for shader refresh when shadow state changes and rebuilds the 3/4-slot light pool. Therefore a visual recovery after a quality toggle would be confounded with program/light-pool refresh, not just shadow brightness. This is a reason to ask for the action sequence, not proof of a stale uniform or GPU context fault. Existing software context-loss/recovery checks passed earlier; they do not reproduce the owner's native session.

**Next discriminating fact:** did the earlier black image clear after reloading/reopening the page, after changing quality without reloading, or simply after moving? Record that sequence before deciding between renderer initialization, shader/light-pool refresh and view/location dependence. There is no need to request another identical Normal-quality shot while both modes currently work. Approved phase palettes remain unchanged; PR stays draft, no merge or deployment.
