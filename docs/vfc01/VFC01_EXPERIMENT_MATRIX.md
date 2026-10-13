# VFC-01 — matrix and reproduction

This is the **reconstructed fresh run**, not the lost initial implementation. Exactly two zones, six fixed poses, FOV 70, 915×412. Same pose/light/resolution for the main comparison.

| Variant | Materials | Geometry | Visibility | Renderer |
|---|---|---|---|---|
| V0 | Production | Production | Production | DPR 1, AA/shadows off |
| V1 | Bounded six-family swatches + local UVs | Same source topology/positions | Production | Same |
| V2 | Production families/face UVs | Six selected objects, edges/supports | Production | Same |
| V3 | V1 | V2 | Production | Same |
| V4 | V3 | V3 | Cottage architecture continuity, room-first props | Same |

90 main frames: six poses × five variants × colour/clay/neutral. Clay replaces lit opaque materials with grey Lambert; sky/unlit/transparent context remains. Neutral uses white directional/hemisphere and turns production fixture lights off; it preserves surface colour. V1 partitions batches, so submitted triangles can change without source topology changing.

Geometry pilots: Library stack, north case, reading table; cottage table, west/east canopy posts. 59 rectangular timber pieces get restrained one-segment bevels; ten connected support members add 1,080 triangles. Total source increment 6,744. This differs from the historical lost pilot and is freshly accounted.

## Independent controls

- Same loaded V3 world: DPR 1 / 1.25 / 1.5 / 1.75, then revisit 1 for drift.
- One constant-coverage opaque Lambert panel, one draw, same camera/light/DPR: approximately 250k / 350k / 500k / 700k camera triangles. Full rectangle coverage is retained; regular subdivisions slightly overshoot target counts. Library native >250k: explicitly unattainable.
- Fresh contexts: Lambert/Phong/Standard, 512/1024 timber, normals off, anisotropy 1/4, flat/smooth beveled normals, AA, 1024² shadows, crop/bias, ACES/Neutral. V0 and V3 both captured under identical crisp renderer settings.
- KTX2: recovered immutable ETC1S timber blob, compatible r186 loader/decoder, compared to a lossless WebP from its BC7 decoded round-trip. This measures format/delivery/storage behaviour; it cannot judge original encoding fidelity. UASTC rerun deferred.
- 172 deterministic V3/V4 steps across large vegetation, hero fixture, cottage architecture and micro card, approach/retreat. Videos play at four presentation frames/s; this is **not gameplay FPS or a collision-walk recording**.

## Reproduce

```sh
npm ci
npm run typecheck
npm test
npm run build
npx vite build --config vite.vfc01.config.ts
npx playwright-core install chromium
node scripts/vfc01-run.mjs baseline
node scripts/vfc01-run.mjs matrix
node scripts/vfc01-run.mjs sweeps
node scripts/vfc01-ktx.mjs
node scripts/vfc01-lod.mjs
node scripts/vfc01-run.mjs isolation
node scripts/vfc01-phone-loop.mjs
```

Pillow and ffmpeg are required for lossless screenshots and video packaging. Each script uses an in-process Vite server + Chromium, avoiding shell network namespace assumptions. Run rendering/timing jobs **sequentially**, and do not edit lab source during capture (Vite HMR invalidates the session). JSON includes current-generation metadata and errors. Images are lossless WebP; PNG intermediates are archived outside Git.

Optional resume controls: `VFC_VARIANTS=V4` recaptures/replaces V4 matrix rows; `VFC_LOD_KIND=small` refines only that sequence. Keep previous source/camera configuration constant when resuming.

Manual game entry `/Feh-Lu-We/vfc01.html`. URL controls: `v`, `camera`, `dpr`, `tex`, `model`, `normal=0`, `aniso=1`, `shadow=1`, `aa=1`, `shadowextent=12`, `bias=.06`, `tone=neutral`, `mode=clay|neutral`, `normals=flat`, `tris=350000`. `auto=1` pauses the gameplay loop for automation; omit on phone. `lodtest=1` adds the same micro card to V3/V4; `hero-test=1` relocates the same fixture to an unobstructed terrace post in both variants. These fixtures are not added/moved in the ordinary matrix.

## Isolation

All changes are new VFC modules/entry/config, scripts/docs and small derived/decoder assets. Game entry, builders, puzzles, IDs, save schema, global materials, culling code and DEV-04D budgets are untouched. Review memory storage is selected **before dynamic import of Game/state**. Branch checkpoints protect the recovery; no merge or deployment.

The scoped Batcher hook is restored in finally after building. Private field visibility adapters are lab-only and require typed production interfaces before adoption. Extra supports follow the same parent chunk visibility. The isolated build writes `dist-vfc01`; it is not committed. Normal production build copies experimental public assets on this branch even though it never imports the lab; do not deploy this branch or wholesale merge the experiment.
