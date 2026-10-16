# VEG-R07 — restore ground colour depth

Revision following the user's feedback that R06 erased too much of the original variation and looked clean/airbrushed. R07 restores visible light/dark and warm/cool colour changes, readable brush marks and larger earth details.

Grass keeps the seamless field and wrapped brush construction, with stronger variation at broad and middle scales. Irregular edged moss/light-green patches and larger curved marks restore the layered surface. Dirt adds warm/light earth and darker patches, stronger scuffs and irregular pale/dark aggregate. This is albedo variation, not geometric displacement or new bump shading.

The original and R06 textures remain available. Opt-in: `?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07`. Use `groundart=r06` for the rejected soft version, or omit `groundart` for the original texture. R07 uses the same 512×512 textures and shared materials as R06, with no extra texture memory, samplers, geometry or draw calls relative to R06. Scene layout, collision and vegetation models are retained.

Studio panels show **original left / soft R06 middle / revised R07 right**. `*-repeat.jpg` repeats each texture three times per axis. Panels use the existing ground material profile at different positions; matched game cameras are the comparison at identical world positions. `previous-*` game frames use R06; `r07-*` use the revision.

The ground-texture regression now checks that R07's base albedo has materially more value variation than R06 while retaining the terrain's mean-colour calibration, opacity, deterministic generation and periodic continuity. The complete 311-test suite passes, and the final strengthened two texture tests pass again separately. Typecheck and build pass; the existing bundle-size warning remains.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r07-review.mjs` uses local port 5199. `GALLERY_ONLY=1` limits the run to panels. This targeted texture revision reruns the multi-draw path with matched R06/R07 views; the existing R06 instanced checks are not claimed as fresh R07 checks. No physical-device, portrait or full puzzle-route rerun is claimed. This remains local work on the historical recovery base, without production-branch integration or deployment.

## Fresh render validation

Fourteen game records cover six matched low-quality views plus a high-quality sun-shadow control, before/after on the multi-draw path. No recorded page/console/shader/WebGL errors. Triangle counts and draw calls are unchanged in every sampled view, and placement inventories match. The six low-quality views stay below the unchanged 150-call / 750k-triangle ceilings.
