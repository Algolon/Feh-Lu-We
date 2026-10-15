# VEG-ART-R02 — Sculpted oak pilot (review only)

Status: **experimental branch, opt-in, not approved for production**. Scope is one tree species: European oak, variants 0–2.

## Why

Existing oak crowns are built from displaced spherical clusters. Their individual smooth/round masses, repeated across species, obscure the authored branch skeleton and produce a too-assembled look in the stylized manor environment. This pilot changes the **crown volume language**, not the environment's color grading or the VEG-R01 LOD band selection.

## Design intervention

- Replace the single ovoid cluster mesh with a low-poly sculpted canopy cushion: tucked undersides, an overhanging scalloped edge, and offset upper shoulders. Branch-end locations, crown grouping and species palette remain inherited.
- Use coherent broad lobes (3/5 angular components), and deterministic offsets per cluster. Three contour rings build each continuous silhouette. Near/mid/far sample the same profile at 11/7/6 sectors, using single indexed meshes.
- Reuse the existing vertex-color AO/tint pipeline and bark/leaf texture atlas. No alpha cards, additional draw calls per instance, new textures, changed collisions, altered tree placement or root geometry.
- Keep the full original tree model under the default path; the experiment is activated only with `?vegart=oak-r02`. Compare with the same camera at `?veglod=hybrid` (legacy) and `?veglod=hybrid&vegart=oak-r02` (pilot). Other three tree species and all understory remain unchanged.
- Preserve `?veglod=baseline|a|b|hybrid` and the existing VEG-R01 continuous/outline behavior. Do not change the 750k mobile development budget or 150-call guide.

## Scope boundaries and next gate

This is a **structural art prototype**, not final approved vegetation. A faceted crown should read as coherent foliage and not as stacked umbrellas, mushrooms, hexagonal prisms or repeated cabbages. Inspect from ground level, elevated garden, woodland path and BOSLUST approach in normal sunlight and evening lighting. Watch silhouettes at 5, 15, 30 and 60 metres, dominant repeated shapes, branch-to-crown blending, grazing light and abrupt LOD changes.

Validation needed before activation:
1. Typecheck, unit tests, build and the most relevant existing browser checks.
2. Matched screenshots/video: existing oak and new oak from the same camera and time of day, all three variants, near/mid/far, alongside beech and birch for style consistency.
3. Multi-draw and instanced fallback counts, mobile-low triangles and calls in representative dense woods, and physical Samsung performance when available.
4. Owner's visual approval before promoting the pilot to other broadleaf species or making it default.

**No merge/deploy authorization** follows from implementing or documenting this pilot. Existing gameplay, lighting, forest distribution and the other vegetation families are explicitly out of scope.
