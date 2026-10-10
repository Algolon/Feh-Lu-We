# Feh Lu We Decorative Art — Batch 04

**Status: visual production candidates, NOT final game integration or geometry approval.**

Eight original standalone images as generated in the conversation have been gathered and renamed with stable asset IDs, without artificial resizing. Four standalone 2D artwork images and four 3D reference sheets.

All source files and ZIP members were verified to be readable. The four artwork aspect ratios were verified to within a 0.2% tolerance (native model dimensions may not yield perfect integer ratios).

## Art direction
Decorative Art Calibration v1 is the governing grammar. No new inventory IDs; no RESERVED assets.

## Production limitations
- These PNGs are original generated images, **not 4K native-resolution exports**. Pixel dimensions are in the manifest. Avoid calling them master textures until resolution and in-engine readability gates have been passed.
- 3D sheets are illustrations to interpret, not geometric CAD or certified orthographic views. Model each object once and check its front/side/rear/3-quarter coherence, material sections and gravity/load path.
- FLW-S3-039 is the intact 2.8m wicker/straw sculpture only. No burning state, animation or changed-story state was included or approved.
- FLW-D2-042 is a general woodland painting only, NOT a story reveal for D03.
- The 'Copacabana Room' signage correction is unaffected (no signage in this batch).

## Suggested implementation gates
1. Place four 2D images as actual art textures on independently modeled frame geometries; evaluate from typical FPS camera distance and mobile viewport.
2. For 3D models, replace microstraw, feather and decorative edge detail by a few major geometry planes and materials.
3. Validate real-world dimensions, stand stability, rear attachments and contact shadows before final sign-off.

This archive contains the validated eight images, manifest.csv, manifest.json, and this README.
