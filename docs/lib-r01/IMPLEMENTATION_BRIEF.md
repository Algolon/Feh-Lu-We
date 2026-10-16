# LIB-R01 — Library re-layout implementation brief

## Goal / self-directed implementation prompt
Rebuild the **actual playable** Feh Lu We library (ground room X 72.4–85, Z 94–109.6) using the approved warm library concept image and the supplied references. Preserve the game's crafted stylized European woodland-manor visual language, mobile-first controls, and existing game systems. Implement in a separate branch; never merge or deploy without a successful review/owner approval.

### Layout
1. Delete the two double-sided free-standing bookshelf islands. Preserve the architectural footprint, six ground-level façade windows, and existing gallery above. Anchor the collection to the west/north wall instead.
2. Size custom shelf runs to **the solid wall bays between windows**, without ever covering glass, panes or openings. Retain upper gallery shelving and rolling ladder.
3. Replace the old freestanding puzzle table with a central reading area: a warm rug, leather sofa, wing chair, low coffee table, side table, some books/plant clutter. Maintain walking corridors from both library doors and to the DS01 album.
4. Add a wood writing desk/bureau in the south-west corner with the B01 three engraved sockets, loose folios, practice sheet, locked drawer, archive card and brass study key. Preserve canonical IDs, same puzzle answer, gating, old-save compatibility and B01/DS01 separation. Its east apron/drawer must face an approachable inspection pose.
5. Replace the old lamp on the B01 table with a **classic green-shade banker's lamp** using the existing `lamp.library` state/interaction.
6. Add a warm antique-style standing globe and small naturally arranged book stacks; avoid excessive geometry or tiny materials.
7. Build a spiral stair in the north-east area to the **existing east upper library gallery**, and replace the intersected upper railing segment with a true passage. The lower and upper steps/landing must have walkable supports and no invisible solid tread obstacles.
8. Update world-relative puzzle anchors, debug routes and poses; do not replace B01 with a superficial static replica.

### Scope and engineering
- Canonical source: `src/world/manor.ts`, `src/world/libraryR01.ts`, `src/slice/world.ts`, `src/slice/placement.ts`.
- Preserve `mLib` batching / room culling, save IDs and the game-state schema.
- Aim within PB01 provisional 750k view-triangle budget and ~150 draw calls per player view. These are review targets, not claims without measurements.
- No unexplained changes to other rooms, windows, lighting, notebook, game logic, or deployments.

### Acceptance / validation
- Run `npm run typecheck`, `npm test`, `npm run build`, and browser/gameplay smoke checks when executable.
- No B01 or DS01 regression; keys persist across reload, desk drawer unlock is still reachable.
- Test routes and collision from library entrance to bureau, DS01 album, spiral foot, each stair step and upstairs landing; confirm both directions work.
- Capture comparable wide/near in-game screenshots at desktop and mobile; inspect clashes, shelves vs glass, stair clearance, material palette, lamp legibility, and lighting.
- Record measured triangles/draw calls/FPS from the actual candidate versus production.
- If live renderer/runtime not available: explicitly mark tests unrun and PR as **draft**; no claim of functional validation or deployment.

### Status
First implementation committed on `lib-r01-library-redesign`. Rendering and runtime validation pending.
