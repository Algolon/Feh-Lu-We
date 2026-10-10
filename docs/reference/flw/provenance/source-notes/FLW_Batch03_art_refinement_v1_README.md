# Feh Lu We — Batch 03 final art-direction refinement

Decorative Art Calibration v1 / 2026-10-09

**Scope:** FLW-S3-014, FLW-S3-016, FLW-S3-017. FLW-D2-036 carried over unchanged.

The artwork proposals add the crafted, stylized European woodland manor aesthetic of FLW-S3-004 to the geometric blockouts:

- **FLW-S3-014:** three distinct hand-carved swallows, compact carved wing planes, asymmetry, oiled European oak with selective cool tinted feather planes. Do not model each feather individually. Preserve separate wood pieces and rear mounting.
- **FLW-S3-016:** a hand-formed matte ivory ceramic crescent with modest surface texture and a substantial oak plinth; the ceramic-to-wood joint must withstand its cantilevered silhouette. No decorative star maps or puzzles.
- **FLW-S3-017:** a terracotta bas-relief of a flower bud with large carved leaf planes, earthy tonal variation, thick disc and concealed wall fixture. No coded botany.

## Production truth

1. Each `*_art-direction-reference.png` is an **authored image concept crop**, not a native full-resolution render. It is usable for appearance and silhouette, but not geometrically guaranteed across its multiple illustrated views.
2. Each `*_orthographic-blockout.png` and `*_geometry-blockout.glb` comes from one coherent **existing technical mesh**, unchanged from the previous completion package; this proves multi-view geometric consistency. It does *not* implement all surface sculpture shown in the new art-direction concept.
3. Each `*_combined-modelling-reference.png` collects both sources; the top sets *look/material intent*, the lower panel sets *technical shape/placement*.
4. Before implementing as final game objects, refine the GLBs against the concept sheet and retest thickness, mounts, normals, silhouette, and draw call/triangle budget.
5. Decorative Art Calibration v1 and puzzle/story canon remain unchanged.
6. The three 3D assets can be marked **art-direction design complete**, but the GLBs remain **technical blockouts** until modelling integration.
