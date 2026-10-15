# Asset credits

## Runtime assets (shipped in the game)

No third-party art, model, texture or font files are downloaded. Most audio is synthesized at runtime;
two licensed outdoor-footstep recordings are edited and bundled in the game (not downloaded at runtime):

| Asset | How it is made | Source |
|---|---|---|
| 3D models (buildings, furniture, trees, props) | Procedural Three.js geometry (boxes, cylinders, icosahedra, extrusions), merged/instanced | `src/world/*.ts` |
| Textures (grass, dirt, stone, plaster, wood, tiles, slate, terracotta, foliage, bark, rugs, water, paintings, maps, plaques, mosaics) | Seeded HTML Canvas drawing | `src/world/textures.ts`, `src/world/conservatory.ts`, `src/world/forest.ts` |
| Symbols / pictograms | Original SVG path data, drawn to canvas and inline SVG | `src/content/symbols.ts` |
| Clue diagrams | Inline SVG generated in code | `src/ui/diagrams.ts` |
| Sound effects and ambience (except outdoor footsteps) | WebAudio oscillators + filtered noise, synthesized at runtime | `src/audio/audio.ts` |
| Grass and dirt footfalls | Four edited, mono, compressed field-recording excerpts played by WebAudio | `src/audio/fieldFootsteps*.ts`; credits below |
| Fonts | System font stack (Georgia/Palatino fallbacks); no web fonts loaded | `src/ui/style.css` |
| Favicon | Inline SVG data URI | `index.html` |

Paintings in the manor are procedurally generated landscapes; they do not reproduce existing artworks.

## Software dependencies (bundled into the build)

| Package | License | Use |
|---|---|---|
| [three](https://github.com/mrdoob/three.js) 0.186 | MIT | Rendering (including `BufferGeometryUtils.mergeGeometries` from `three/examples/jsm`) |

Development-only: Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT), playwright-core (Apache-2.0). Exact
resolved versions are recorded in `package-lock.json`.

## Reference material (not used at runtime)

`docs/concept-art/*.png` — seven concept images supplied by the project owner as visual references
(estate map, aerial exterior, entrance hall, pool conservatory, open garden, forest clearing, home).
They are documentation only; the game does not load them and they are not part of `dist/`.
`docs/BUILD_BRIEF.md` — the implementation brief supplied by the project owner.

## Licensed source recordings — outdoor footsteps

The following user-supplied recordings were edited into four short original in-game step clips
(two per surface) with per-step normalization, high-pass filtering and click-free fades.
They are embedded in the game's code bundle as one compact MP3 sample bank; they are **not** provided
as a standalone sound-effects library. The full original tracks are not shipped.

| In-game surface | Source and creator | License |
|---|---|---|
| Grass | [Walking on grass (slowly)](https://pixabay.com/sound-effects/film-special-effects-walking-on-grass-slowly-28128/) by davidsonfreemedia (Freesound), [original Freesound entry](https://freesound.org/people/davidsonfreemedia/sounds/504590/) | Creative Commons Zero (CC0) at Freesound |
| Dirt / outdoor paths | [Walking on dirt](https://pixabay.com/sound-effects/film-special-effects-walking-on-dirt-363354/) by Soumages | [Pixabay Content License](https://pixabay.com/service/license-summary/) |

The game adds its own movement-triggered timing and left/right variation. The audio bank was
created from source files supplied by the project owner. The Pixabay recording must not be extracted
or redistributed on a standalone basis; see the [Pixabay terms](https://pixabay.com/service/terms/).
