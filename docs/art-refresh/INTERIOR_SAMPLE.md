# Art refresh, step 2 — interior sample: the living-room hearth corner

**Status: proposed, not owner-approved.** This sample is reachable only through the review entry below (or the
`?art=sample` flag). The normal game still builds the original living room. Nothing outside this room has new
assets.

Companion documents:
- [`STYLE_TARGET.md`](STYLE_TARGET.md), including the step-2 revisions at the top.
- [`REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md).
- The step-1 [`baseline/`](baseline/README.md).

## 1. How to review it on a phone

1. Open **`https://algolon.github.io/Feh-Lu-We/?review=living`**. The build id is shown on the review start card
   and in Pauze; check it against the commit in §9.
2. Tap **Start review**. You start in the wide arch between the hall and the living room, looking at the hearth,
   with the ordinary touch controls (left thumb walks, right side looks, tap or the big button acts).
3. The **Review** pill at the top opens three toggles:
   - **Toon oud / Toon nieuw:** rebuilds the room with the original or the new assets, at the same spot (about a
     second).
   - **Licht:** the interior lighting treatment, new or original.
   - **Tonemap:** ACES (current) or Neutral. Exposure stays 1.15 in both.
4. Try things the way a player would:
   - Inspect the mantel.
   - Douse the fire with the action button, relight it with the matches from the bag.
   - Switch the floor lamp off and on.
   - Look at the room from the hall arch, from a seat-height crouch (not available; stand next to the sofa instead)
     and close up.
5. **Isolation.** The review runs on a temporary in-memory save. Your own save, backup save and settings are never
   read, written, reset or migrated by opening or using the review link (tested; §7).
6. Leave via the link on the start card, or open the plain URL. The normal game is unchanged.

Developer flags, all opt-in:
- `?art=sample`: build the new room.
- `&light=sample`: interior lighting treatment.
- `&tm=neutral`: Neutral tone mapping.

They also work with `?autotest=1` for the capture and test scripts.

## 2. What was built

All geometry is generated in code: no downloaded models or textures. It sits in
[`src/world/livingSample.ts`](../../src/world/livingSample.ts) (assets), [`src/world/artkit.ts`](../../src/world/artkit.ts)
(reusable helpers + materials + contact shadows), and small hooks in `hearth.ts`, `manor.ts`, `env.ts`, `world.ts`
and `game.ts`.

| Asset | Construction | Rules it demonstrates |
|---|---|---|
| **Armchair** (×2) | Turned walnut feet. Upholstered base, darker toward the floor (baked). Crowned seat cushion with a piped front edge. Raked back with an arched top. Loose back cushion. Rolled arms with piped scroll fronts. | Upholstery language; edge softness by material; occlusion baked only where parts meet; contact shadow |
| **Sofa** | The same generator, 2.3 m, three seat and back cushions, two throw pillows (accent colours) | One design language reused, not a second style |
| **Occasional tables** (coffee + side) | Two-step softened top (grain along the long side). Apron rails set in from the edge. Square tapered legs jointed under the apron. Lower shelf on the coffee table. | Joinery and readable thickness at phone resolution |
| **Fireplace surround + hearth** | One extruded sandstone frame with a segmental-arch opening and bevelled edges. Keystone. Plinth blocks. Cove bed moulding. Oak shelf with a flat fascia (carries the "links → rechts" plaque) on scrolled oak corbels. Plaster chimney breast with a small cornice. Firebox with splayed cheeks, sloping throat and soot gradient. Raised hearth slab. Iron grate, andirons with brass finials, three logs with pale cut ends, glowing ember bed (part of the fire visual, so it goes out with the fire). | Substantial stonework; depth in the opening; hearth visible but not dominating the mantel row |
| **Mantel evidence** | Three identical turned brass stands (Phong sheen) under feather, pinecone and cup. Pinecone: tapered ovoid core shingled with 100 woody scales in offset rows. Feather: two curved vanes, quill, barbs, dark tip band. Cup: glazed white with a blue band, saucer, clear side handle, tea. Decoys keep different bases (pewter dish, wooden plinth, lace doily). | Hero-prop silhouettes readable in clay; the brass stand is the only base with sheen and a three-part turned profile |
| **Architectural framing** | Profiled oak skirting along every wall segment. Window linings that box the windows out 14 cm (reveals). Deep oak window boards with an apron. Painted architraves with a capped head. Chamfered ceiling beams on oak corbels. A plastered ceiling between the beams (it was the dark underside of the upstairs floorboards). | Depth and contact lines through trim, not ornament everywhere |
| **Curtains** | Pleated floor-length panels (folds in geometry, valley shading baked) on a brass rod with finials (west windows, as before) | Cloth through form, not texture |
| **Floor lamp** | Weighted turned base, bronze stem with collars, empire fabric shade, visible bulb. The shade glows when on (emissive follows the lamp's logical state) and reads as linen when off. | Fixture presentation independent of light-slot allocation |
| **Light pools** | Fire and floor-lamp pools use a new *soft* profile (wide gaussian, lower strength; the fire's is elongated along the hearth) | No opaque, hard-edged painted disc |
| **Contact shadows** | One instanced, multiply-blended soft rounded-rectangle quad per grounded object (sofa, armchairs, tables, lamp, plant, bookshelf, hearth slab and surround foot). One draw call for the whole room. Static occlusion only. | Grounding without shadow maps |
| **Rug** | Calmer pattern: muted madder field, linen border, small ink-blue medallion | Accent without shouting |

**Kept as they were:**
- The bookshelf, plant and painting. The painting is moved 0.75 m west, because its old position overlapped the window
  at x 79, which is now visible with its linings.
- The candle, clock and vase decoys, remade at the same positions; the vase got a smooth spline profile.
- The photo memory and walls.
- The floor, with only a less orange tint.

**Colour choices** (base colours, not shading steps; validated together in the render):
- Moss velvet sofa.
- Ochre velvet armchairs: the lively accent nearest the fire.
- Oxblood curtains.
- Walnut and oak timber.
- Sandstone surround.
- Brass highlights.
- Cream joinery.
- Rose and gold throw pillows.

## 3. Pipeline changes (and what stayed)

All changes are minimal and opt-in. Existing builders render exactly as before.

- **`Batcher.add`** keeps authored vertex colours when the geometry is flagged `keepColor`, multiplying them by the
  part tint. Normals and the first UV set were already preserved. Unflagged geometry behaves exactly as before.
  This is covered by `tests/artkit.test.ts`.
- **`artkit.ts`:**
  - `softBox`: a rounded box with optional face subdivision, so cushions can crown.
  - `cushion`, `lathe`, `moulding` (extruded profiles), `projectUV` (metre-scaled UVs with grain direction),
    `bake` (vertex occlusion), `Asm` (places local parts on a furniture origin, merged into the room's existing
    batches).
  - `ContactShadows`.
  - A material set of six: upholstery, timber, stone, paint, brass, ceramic, plus the rug texture. Brass and
    ceramic are the only Phong (specular) materials; everything else stays Lambert.
- **Visual vs gameplay geometry stay separate.** The sample calls the same collision primitives with the same
  numbers as the original builders. Interaction hitboxes, ids, lights and the mantel slot positions are untouched.
  This is tested in §7.
- **Lights and patches:**
  - `LightPatches.add` gained an optional `soft`/`aspect`/`yaw` (the original profile is unchanged).
  - `makeLamp` passes `patch.soft`.
  - `LightPool` gained a `gain` multiplier (1 = original).
- **Not changed:**
  - No engine change.
  - No GLB pipeline.
  - No new dependencies.
  - No generalized asset framework.

## 4. Comparisons

### Settings and captures

| Setting | Value |
|---|---|
| Viewport | 844 × 390, device scale 1 |
| Quality | phone default `low`: no shadow maps, pixel ratio 1, no MSAA, 3 pooled lights |
| Camera | FOV 68°, eye height 1.65 m (seated view: 1.1 m) |
| Exposure | 1.15 in every game pass, including Neutral tone mapping |
| HUD | hidden for inspection frames; one ordinary gameplay frame with HUD is included |

Script: [`scripts/art-capture.mjs`](../../scripts/art-capture.mjs). Poses 01–04 are the step-1 baseline poses,
unchanged.

The capture sets are in [`interior-sample/`](interior-sample/):

| Set | URL flags | Passes | Purpose |
|---|---|---|---|
| `before/` | none | game · neutral · clay | baseline room, re-captured with the stricter clay definition |
| `existing-render/` | `art=sample` | game | new assets, original lighting and tone mapping |
| `after/` | `art=sample&light=sample` | game · neutral · clay | new assets + recommended interior lighting (**the proposal**) |
| `neutral-tm/` | `art=sample&light=sample&tm=neutral` | game | tone-mapping alternative |
| `compare/` | | | labelled sheets: before / existing render / after / Neutral TM, and before vs after clay |

Poses:
- 01 hearth wide, 02 mantel front, 03 mantel near, 04 armchair near (baseline poses).
- 16 oblique furniture, 17 doorway from the hall, 18 armchair front, 19 armchair rear, 20 seated height (sofa),
  21 hearth oblique.
- 22/23 fire and lamp **off**.
- 24/25 floor lamp on/off, 26 window near, 27 table near, 28 sofa front.

The walkthrough video is `interior-sample/walkthrough.webm`: 844 × 390, real-time frames on a software renderer,
so it is choppy.

RESULTS_PLACEHOLDER
