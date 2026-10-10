# Feh Lu We — Batch 02 Resolution Pass v1

Date: 2026-10-09
Scope: Only the 13 approved Batch 02 designs. No changes to imagery, style, signs, or puzzle/story content.

## Important production distinction
These exports use high-quality Lanczos interpolation with restrained edge sharpening on earlier review-preview crops. They are **not** natively generated high-resolution masters. The preview crops originally came from a multi-asset concept artboard, so their authentic source-level detail is lower than their preview dimensions suggest. Enlarging them cannot create reliable brushstroke detail, lettering geometry, wood grain, or consistent 3D orthographic views.

## Contents
- 01_Final_2D_4K_candidates/: six independent PNG images, exact 4:3 / 4:5 / 1:1 / 16:9 ratio. 4K-class dimensions. No added frames or typographic labels.
- 02_3D_reference_3K_candidates/: seven 3072-pixel-wide enlarged reference sheets. Original board contents, not physically verified turnarounds.
- manifest.csv and manifest.json: stable IDs, source/export sizes, checksums and per-asset status.

## Appropriate uses
- Art-direction sign-off, in-engine mock placement on actual 3D frames, viewing on S25-sized screen, checking lighting/exposure and perceptual legibility.
- Reference for manual redraw or standalone regeneration at native resolution.

## Not yet appropriate uses
- Calling 2D images final high-resolution texture masters with preserved source detail.
- Treating all views in an S3 sheet as geometry-accurate orthographic reference without an artist coherence pass.
- Assuming typography on S3-009 or S3-013 has been provided as vector geometry. Exact copy remains 'Copacabana Room'.

## Next required gate for final-master status
1. Recreate each chosen 2D composition as a separate native high-resolution standalone image, preserving composition and palette, not as a new artboard. Compare image at 100%, in a real frame, and from gameplay camera distance.
2. Reproduce each 3D design as a single-design front/side/rear/3-quarter reference; test consistency of silhouette, hardware, lettering, and material thickness.
3. For S3-009/013 supply vector/path-based exact sign lettering: 'Copacabana Room'.
4. Approve after a mobile in-engine visual check.

These are resolution-pass candidates; Calibration v1 is not changed by this export.
