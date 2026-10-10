# Additional reference: asymmetrical salon-style gallery wall (DEV-04D2)

`gallery_wall_salon_reference_v01.jpg`: an owner photo of a real living-room wall, added on 10 Oct 2026 as an
**environment-dressing composition reference**. It shows how the frames are arranged. It is not an art source.

## Usage rules
- **Composition only.** The posters in the photo are third-party prints. Never rasterise, trace or recreate them in
  the game. The TV, chair, cabinet and plant in the photo are context, not references.
- Fill a gallery wall only with **canonical FLW-D2 paintings** from `docs/reference/flw` that may ship (`src/content/art.ts`
  ship rule). Keep their source aspect ratios and their stable FLW ids. No new artwork is generated for it, and no hung
  piece is replaced.

## Composition contract (owner brief)
| Aspect | Requirement |
|---|---|
| Count | about 14–16 framed works in one organic cluster |
| Anchors | two large visual anchors: one central, one to the right |
| Fill | medium and small works around the anchors |
| Contour | irregular top and bottom outline; compact core, airier edges |
| Formats | a mix of portrait, landscape and square |
| Frames | black, light timber and off-white rails, varied (the existing `antique` / `simple` / `print` families, recoloured) |
| Gaps | 4–8 cm between frames on average |
| Avoid | rigid grids, symmetric placement |
| Finish | ART-01: a crafted, stylised European woodland manor |

## Implementation notes (for the next environment-art pass)
- **Reusable config.** Describe the layout as data: frame centres relative to a wall anchor, with size, frame family and
  rail colour. A builder places it on any wall face through `flwPainting` (or a variant that takes a rail colour). It
  registers each frame with the DEV-04A wall-art contract (`registerArt`), so `wallArtConflicts()` still guards doors,
  openings and sconces.
- **Wall fit.** A cluster of about 2.4 × 1.5 m needs a free wall span of at least 3 m, with nothing in front of it
  above 0.9 m, on a primary sight line. Candidates must be measured with `scripts/dev04d-wallprobe.mjs`.
- **Performance.**
  - All canvases come from the one FLW atlas material, so the pictures add **0 draw calls**.
  - Frames batch into the room chunk on the paint material (painted rails, not textured timber, so the chunk's
    culling sphere does not grow; see the D1 WC-mirror lesson).
  - Expect about 1.5–2.5 k triangles for 15 frames.
- **Blocker: art supply.** Thirteen FLW-D2 pieces may ship, and all 13 hang in D1-R slots. A 14–16 piece cluster
  needs one of two owner decisions:
  - (a) more D2 pieces promoted from group B, so that "no new artwork" still holds;
  - (b) explicit permission to repeat pieces or to move hung pieces into the cluster, which reopens the closed D1-R
    placement pass.

## Status
Registered as an **additional environment-dressing requirement**. It is **not implemented in D2**:
- D2's scope is 3D props and keys;
- the D1-R gallery pass is closed;
- the art-supply blocker above needs an owner decision first.

It is queued for the next fitting environment-art pass (D3 curation or a dedicated D1-G pass).
