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
   - Look at the room from the hall arch, from beside the sofa, and close up.
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

## 5. What the comparisons show

The sheets in `compare/` show four variants per pose:
- **Before:** the original room.
- **New assets, existing rendering**
- **New assets + interior lighting:** the proposal.
- **The proposal with Neutral tone mapping**

`compare/clay/` shows before vs after in clay.

### Assets, under the existing renderer

This is the material change. In clay, the original room was:
- a notched cube for each armchair;
- three slabs for the sofa;
- a plank on sticks for the table;
- a flat slab for the chimney breast.

Now, in clay:
- **Armchairs:** recognisable from the front, side, rear and at seat height, with feet, crowned cushions, a raked
  arched back and rolled arms.
- **Sofa:** one family with the armchairs.
- **Table:** has a top edge, an apron and a shelf.
- **Surround:** an arched opening, plinths, a keystone, a shaped shelf on corbels, and depth in the firebox.

At 1.2 m on the mantel:
- The pinecone reads as a tapered, shingled cone.
- The cup has a saucer and a handle.
- The feather has vanes, barbs and a quill.
- The brass stands have a turned three-part profile and the only metallic highlight on the shelf.

With the fire and lamp off (shots 22, 23 and 25), the room and the evidence stay readable.

### Interior lighting treatment

The treatment is opt-in (`light=sample`); `src/world/env.ts` and `Game.tick` hold its constants. Indoors only,
smoothed at doorways, it does three things:
1. Hemisphere fill × 0.72.
2. The hemisphere sky colour moves toward a cool window white and its ground colour toward a warm, dim floor bounce.
   This replaces the outdoor earth colour, giving a vertical gradient that models cushions and mouldings without
   shadow maps.
3. The fixture lights (fire, lamps) get × 1.35 through `LightPool.gain`.

The sun keeps its share, so the east wall still reads as daylight and the hearth wall is lit by the fire. Measured
on shot 01 (sampled pixels, ACES):

| Point | Existing | Treatment |
|---|---|---|
| West wall | 139 | 124 |
| Armchair | 84 | 69 |
| East (sunlit) wall | 189 | 181 |
| Chimney breast near the fire | 179 | 184 |

The contrast shifts toward the fire rather than the whole frame getting darker. **Honest assessment:** the effect
is modest and mostly mood: warmer pools, less uniform fill. Almost all of the visible improvement comes from the
assets, trims and grounding.

A first attempt cut fill by about 45 % and raised the floor bounce. It mainly darkened the room and flattened
cushions, so it was rejected (§8).

### Tone mapping

| Point (shot 01) | ACES | Neutral |
|---|---|---|
| West wall | 124 | 103 |
| Floor | 131 | 116 |
| Chimney breast | 184/128/79 | 163/104/51 |

Exposure was unchanged (1.15). Under Neutral the plaster, ceiling and floor go noticeably more orange and saturated,
and mid-tones darken. ACES keeps whites creamier and the fire reads hotter than its surroundings.

**Recommendation: stay on ACES.** Neutral does change the result, but not for the better in this warm interior. It
would also be an estate-wide switch.

### Material and grounding behaviour

The neutral-light passes (`after/*-neutral.jpg`) show the separation without mood lighting:
- **Wood:** grain along each member.
- **Cloth:** soft weave, piping darker.
- **Stone:** coursed blocks.
- **Brass and glaze:** small highlights.
- **Plaster:** calm.

Contact shadows are visible as soft darkening at furniture feet and under the hearth slab. There are no halos,
no z-fighting on the rug, and nothing extends across unrelated surfaces. They are static occlusion only; nothing
that toggles depends on them.

## 6. Cost (phone quality, settled over 30 frames; two runs agree)

| Pose | Before calls | Before triangles | After calls (Δ) | After triangles (Δ) |
|---|---|---|---|---|
| 01-hearth-wide | 92 | 179 318 | 99 (+7) | 216 746 (+37 428) |
| 02-mantel-front | 95 | 156 906 | 101 (+6) | 194 274 (+37 368) |
| 03-mantel-near | 93 | 156 070 | 98 (+5) | 193 426 (+37 356) |
| 04-armchair-near | 90 | 173 426 | 97 (+7) | 210 854 (+37 428) |
| 16-oblique-furniture | **185** | 179 947 | **194 (+9)** | 218 623 (+38 676) |
| 17-doorway-from-hall | 109 | 178 848 | 117 (+8) | 217 384 (+38 536) |
| 18-armchair-front | 101 | 169 138 | 108 (+7) | 205 062 (+35 924) |
| 19-armchair-rear | **157** | 168 563 | **166 (+9)** | 207 239 (+38 676) |
| 20-sofa-seated | 94 | 153 908 | 101 (+7) | 191 336 (+37 428) |
| 21-hearth-oblique | 97 | 158 638 | 103 (+6) | 196 006 (+37 368) |
| 22-hearth-wide-off | 89 | 176 910 | 95 (+6) | 214 018 (+37 108) |
| 23-mantel-front-off | 92 | 154 498 | 97 (+5) | 191 546 (+37 048) |
| 24/25-floor-lamp | 134 | 184 632 | 142 (+8) | 219 456 (+34 824) |
| 26-window-near | 92 | 152 746 | 98 (+6) | 190 114 (+37 368) |
| 27-table-near | 102 | 161 744 | 109 (+7) | 199 172 (+37 428) |
| 28-sofa-front | **194** | 191 027 | **203 (+9)** | 228 187 (+37 160) |

**Calls: +5 to +9 per view.** Seven new materials in the room batch, one contact-shadow mesh, one soft light-pool
mesh, and the lamp's shade, trim and bulb objects. Each new material costs one call per area, not per part:
cushions, trims and pinecone scales are merged.

**Three poses exceed 150 calls in both versions** (16, 19, 28). They look through the hall arch and the open front
door to the outdoors. The overrun pre-dates the sample; it adds 9 there.

**Triangles: about +37 k everywhere the room is visible** (measured). The per-asset split is counted from the
construction, not measured separately:
- Each subdivided cushion is 768 triangles: the sofa has 8 cushions (≈ 6 k plus about 1.5 k of frame), and each
  armchair has 2 (≈ 2.5 k).
- The pinecone has 100 scales of about 60 triangles each (≈ 6 k).
- Small rounded parts are 300 triangles each.

Every pose stays ≤ 228 k against the 250 k guide. If a phone shows strain, the cheapest cut is the pinecone (rows
of 10 → 7) and cushion subdivision (`mid` 4 → 2), roughly −6 k by the same count, without changing silhouettes.

**Materials and lights:**
- Two new Phong materials (brass, glazed ceramic) on small surfaces only.
- Everything else stays Lambert.
- No shadow maps, post-processing or new light slots.
- Interior treatment: fixture light × 1.35 and fill × 0.72 indoors. This changes light intensity only, not cost.

**Transfer:**

| | Before | After | Δ |
|---|---|---|---|
| JS | 904.8 kB, gzip 259.9 kB | 937.6 kB, gzip 271.6 kB | +11.7 kB gzip |
| CSS | | | +0.45 kB |

No new files are downloaded; textures are generated at load. Load-time work is a few extra canvas textures and
geometry generation for one room.

**Frame rate:** not measured here. Software rendering only. **Real-device validation is pending your phone test**
(`?review=living&debug=1` shows FPS).

## 7. Verification

| Kind | Result |
|---|---|
| Typecheck | clean |
| Unit tests | **73 / 73**, including 8 new `tests/artkit.test.ts`. These check that Batcher colour handling is unchanged for unflagged geometry, that authored colours are kept when flagged, that normals transform, and the bounds/normals of softBox, cushion crown, moulding, projectUV and lathe. The cushion-crown test caught a real defect: the first rounded box had no interior vertices, so cushions could not crown. |
| Production build | OK |
| Default game unchanged | Baseline poses 01–04 give the identical draw calls and triangles as the step-1 baseline (01: 92 / 179 318). Pixel difference against the step-1 JPEGs: mean 1.2–2.7 (JPEG and flame-animation noise). |
| Browser: art-sample suite (new, in `scripts/e2e.mjs`) | **12 / 12 on the final build.** The suite checks:
- Collision identical to the original room (36 colliders).
- The same 13 interactables and 5 light sources (ids, positions, intensities).
- The reticle targets the same objects from the same poses.
- Mantel inspect → hall drawer solved with Veer–Dennenappel–Kopje through real movement and the dial panel.
- Fire doused and lamp off persist through reload; relighting restores the flame and the shade glow.
- Reduced motion keeps flame and embers visible.
- From the hall the room is drawn and lit and its flame visible.
- Sofa, armchair, hearth and table block movement.
- No console errors.
- Review mode: starts at the arch with the bar, toggles work, the player's own save/backup/settings are
  byte-identical afterwards, and the normal entry is unchanged.

The first run found two real issues, both fixed. The floor lamp's light sat 15 cm lower than the original, which
changed light-slot ranking from the hall; it is now the original position. The other was a test reading the wrong
emissive. |
| Browser: full regression suite on the final build | **83 / 83 on the final build** (`node scripts/e2e.mjs`): the 71 existing checks — the full normal-control route home → finale (A → B → C), lighting L1–L6, collision, saves and migration, touch, WebGL-failure paths, render budgets — plus the 12 art-sample checks. The normal game's phone render metrics are unchanged. |
| Real device | **not done**; pending owner review |

## 8. Iteration log (what was inspected and corrected)

1. **Draw calls.** The first pass cost +23 calls. Ember pebbles were 16 separate meshes, so they were merged into
   one; shadow-flag splits were unified. Final: +5 to +9.
2. **Ceiling.** In the wide view it was the dark-red underside of the upstairs floorboards. A plaster ceiling was
   added between the beams, which now read.
3. **Rug.** The old rug, and the first new one, were the most saturated thing in the room. Recoloured to a muted
   field with a small medallion. The floor tint is less orange.
4. **Pinecone, first version.** It read as a pagoda in clay (horizontal disc scales). Rebuilt as shingled plates
   on a tapered core.
5. **Vase.** Kinked shading from a sharp lathe profile; now a spline profile.
6. **Contact shadows.** Version 1 was invisible (hidden under the furniture). Version 2 was a hairline rim
   (diagnosed by tinting them red). Version 3 is dense out to the footprint edge with a 15–20 cm soft falloff.
7. **Lighting.** First treatment (fill −45 %, bright bounce) mainly darkened the room and flattened cushions;
   rejected. Final: fill −28 %, cool top / warm dim bottom, fixtures +35 %. The indoor factor also has to snap at
   load; it previously ramped from 0 and made captures look untreated.
8. **Smaller fixes.**
   - Keystone hung below the arch: made flush.
   - Table apron z-fought with the top's lip: moved down.
   - Painting overlapped a window: moved.
   - Cushions could not crown: new subdividable rounded box.
   - Hearth contact-shadow decals were oriented across the wall: fixed.

## 9. Limitations and open points

- **Still primitive or generated-looking:**
  - The bookshelf, plant and painting are unchanged originals; the plant's blob foliage especially stands out next
    to the new furniture.
  - Curtain panels are flat pleated sheets with no gathering at the rod.
  - Floorboards are the original texture.
  - The flame shapes are the existing teardrop shader.
- **Walls** are plain plaster; the room has no cornice, and the chimney breast is deliberately plain so that the
  mantel objects silhouette clearly.
- **No seated camera in the game.** Shot 20 lowers the capture camera only.
- **The lighting treatment is subtle.** Without shadow maps there is no window light falling across the floor. A
  baked light pattern or a lightmap would need a second UV set (not in scope).
- **Code-built organic forms** (pinecone, feather) work at this scale. A hero tree may not (step-1 plan).
- **Software rendering only.** Colours and frame rate on a real phone screen are unverified.

## 10. Build and URLs

DEPLOY_STATUS
