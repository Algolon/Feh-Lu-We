# Art direction (iteration 3)

> **Historical record.** This describes what iteration 3 *intended*. The current visual target, the baseline
> assessment of how far the game is from it, and the review gate are in
> [`art-refresh/STYLE_TARGET.md`](art-refresh/STYLE_TARGET.md) and
> [`art-refresh/REVIEW_CHECKLIST.md`](art-refresh/REVIEW_CHECKLIST.md).

## Reference traits
Five reference images were supplied for iteration 3 as **direction only** (they are not included in the
repository and nothing was traced or copied from them):
stylised woodland with mushrooms and stumps; a forest path to a timber house; a soft stylised meadow; a timber
village; a pirate-timber prop scene. The traits taken from them:

| Trait | How it shows up in the game |
|---|---|
| Chunky, rounded forms; few, large shapes | Crowns built from 3–5 soft icosahedron blobs; rounded furniture; thick timber frames on doors, the BOSLUST portal and the shed |
| Saturated but warm palette, painted shading instead of textures detail | Vertex colours with baked top-light shading on foliage; small per-part brightness jitter in batched meshes |
| Storybook woodland details | Toadstool clusters at tree feet, old stumps, ferns, rocks, grass tufts along paths |
| Soft meadow | Grass tufts and flower patches across the lawn; open sightlines kept around the lantern circle |
| Warm timber interiors with lamps | Wood floors, beams, chandeliers with real flames, curtains and rugs per room, floor light pools |
| Readable landmarks | Lantern circle, the hill with its stone cut, the conservatory glass, chimneys and dormers |

## Palette (approximate)
- Foliage: `#4d7a33` → `#839c3e`; lawn `#9cc05e`; woodland floor `#5d7a38` / `#6f8c43`; hill `#7f9a4a`.
- Timber: `#5a3a22`, `#6b4426`, `#8a5a33`; stone `#c2b8a0` – `#f2e6cc`; slate roofs `#7d879c`.
- Warm light: flames and lamps `#ffc06a` – `#ffd27a`; dusk fog `#e9d9b6` → `#c09a86`.
- Accents: toadstool red `#c8382a`, enamel plaque blue `#21324a` with brass `#c9a44c`.

## Room identity
Every key room has a distinct colour and prop signature: living room (green sofa, hearth, fair mantel), library
(leather/navy/olive book palettes, ladder, lecterns), dining (long table, candles), kitchen (copper pans, farmhouse
table, service chart), Reiskamer (warm terracotta, suitcase with labels), Sterrenkamer (navy, star chart, telescope),
study (purple rug, desk, framed map), botanical room (herbarium, leaf frames, plants), basement (cool stone,
coloured pipes), gathering room (warm plaster, laid table, string lights, hearth). Enamel plaques with the room
emblems mark the doors of the eight catalogue rooms.

## Asset licensing
All geometry, textures (canvas-generated), icons (inline SVG paths) and sounds (Web Audio synthesis) are created
in code in this repository. No third-party art, fonts or audio files are bundled; the only runtime dependency is
three.js (MIT). The supplied reference images are not redistributed.
