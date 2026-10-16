# RUGS-R01 — woven interior rugs

Shared rug family rebuilt in `src/world/propkit.ts`; the sample living room now uses the same family instead of its old box with a separate rug texture.

- Low crowned pile (about 2.5 cm), tapered perimeter and a rounded sewn binding.
- Individual irregular yarn bundles on fringed designs, rather than a solid fringe rectangle.
- A scalloped medallion, small botanical ornaments, warp/weft grain and quieter slate borders.
- Runner motif spacing scales with width. End lengths leave a continuous middle, including intermediate aspect ratios.
- Shared prop atlas increased from 1024 to 2048; rug art is authored at twice the former pixel resolution. This increases atlas memory from roughly 4 to 16 MiB before mipmaps, while keeping the shared material/batching structure.
- Existing room footprints and interactions retained; sample living-room furniture contact shadows lifted to the new pile surface.

Validation: TypeScript check, 318 tests passing (35 files; 20-second timeout for the existing botanical geometry test), production build and diff whitespace check. New raycast coverage regression tests short, medium and long runners. Build retains the bundle-size advisory.

Visual evidence: `after/hall-runner.jpg`, `after/hall-mat.jpg`, `after/living-rug.jpg`. Reproduce with `scripts/rugs-r01-review.mjs [baseUrl] [outDir]` and a local Chromium path in `CHROME`.

Production integration: based on default-branch commit 73a3cb6. UV range validation aggregates every coordinate before asserting bounds to avoid per-vertex assertion overhead. Perimeter geometry keeps dense edge samples and fewer central samples.

VRAM estimate (RGBA8 with full mip chain): shared texture 5.33 → 21.33 MiB (+16 MiB). The 21 placed rug geometries add approximately 5.77 MiB in merged position/normal/UV/colour buffers (44 bytes per vertex), or about 22 MiB total additional GPU storage. Driver overhead, visibility and allocator behaviour may differ; this is a buffer-size calculation, not a driver VRAM reading.
