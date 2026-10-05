# Art refresh — review checklist (the gate)

This checklist is used for every visual sample and, later, for every area rollout. Its job is to stop an
unsatisfactory asset kit from spreading across the estate. The target it checks against is in
[`STYLE_TARGET.md`](STYLE_TARGET.md).

## 0. Who decides

**The owner's visual review decides.**
- The checks below make the review concrete and repeatable.
- The optional 1–5 scores help discussion, but they are **not objective proof**. A sample can tick every box and
  still fail because it does not feel right.
- If the owner's judgement and the checklist disagree, the owner wins and the checklist is updated.

## 1. Evidence package (required before review)

A sample is not reviewable until every item below exists in `docs/art-refresh/<sample>/`.

| # | Evidence | How |
|---|---|---|
| E1 | **Equal-pose before/after**: same poses, viewport, quality and save state as the baseline | `scripts/art-baseline.mjs` (extend `SHOTS` for new poses; keep the baseline poses unchanged). Phone quality, 844 × 390. Before = [`baseline/`](baseline/README.md), or a fresh capture of the parent commit if the baseline is stale. |
| E2 | **Neutral-light pass** for every pose | `-neutral.jpg` (fog off, white fill, white sun, exposure 1) |
| E3 | **Clay pass** for every pose | `-clay.jpg` (one grey material, no textures/colours) |
| E4 | **Near-distance checks**: the 0.8–1 m shots listed in the sample spec | Added poses in the same script |
| E5 | **Short moving walkthrough**: 10–20 s at walking speed along the sample's route, looking where a player would | Video if the capture environment supports it; otherwise a frame sequence at ≥ 4 fps plus a contact sheet. Taken through the real movement code, not camera teleports. |
| E6 | **Metrics**: draw calls and triangles per pose at phone quality, two runs each; JS bundle size (gzip) before/after | Script output + `npm run build` |
| E7 | **Regression results**: `npm run typecheck`, `npm test`, `node scripts/e2e.mjs` (the walkthrough, lighting L1–L6, collision and interaction suites) | Command output, pass counts |
| E8 | **Owner phone check**: FPS from `?debug=1` at the sample poses on the owner's phone | Reported by the owner. The only valid frame-rate evidence; SwiftShader FPS is meaningless. |
| E9 | **Change list**: which assets are new, which were kept, and which rules each new asset establishes | Short table in the sample README |

The evidence package must report these separately, as earlier iterations did:
- Source tests.
- Browser tests.
- Real-device checks.

## 2. Neutral inspection procedure (do this first)

Look at the **clay** frames before the game frames, so atmosphere and colour cannot carry weak geometry.

1. In clay, can you name every object in the frame? Can you tell the species of every tree?
2. In clay, do you see construction: legs meet aprons, beams bear on something, roots enter the ground?
3. In clay, does every object touch the ground or another object visibly?
4. In clay, do edges catch light? Are there no razor-sharp made objects and no unintentionally faceted organic
   forms?
5. In neutral light, do materials separate by value and texture alone (wood vs cloth vs plaster vs stone vs metal)?
6. Only then: in the game frames, does the mood (light, haze, warmth) *add to* forms that already work?

If a quality appears only in the game frames and not in clay or neutral, it is being carried by atmosphere and
does not count.

## 3. Criteria

Each line is **Pass / Fail / n.a.** An optional 1–5 score per section can be noted for discussion.

### A. Silhouette and recognisability
- [ ] Every hero and supporting asset is recognisable in clay at its normal viewing distance:
  - Hero: 1–3 m.
  - Supporting: 2–15 m.
- [ ] Each asset family shows its signature feature (STYLE_TARGET §5.1). Examples:
  - Chair: shaped back and arms.
  - Oak: flare, fork and broad crown.
  - Pine: bare trunk and high crown.
  - Rock: big planes.
- [ ] Trees of different species are distinguishable in clay at 15 m. No two neighbouring trees read as copies.
- [ ] No unintended "primitive" read anywhere in the frame: notched cube, pipe, disc, stacked cones, crenellation.

### B. Proportion and craftsmanship
- [ ] Furniture and architecture follow the dimension ranges in STYLE_TARGET §5.1:
  - Seat, table and arm heights.
  - Reveal depths, sill projection, architrave widths.
- [ ] Every load-bearing member exists and meets another member believably. Nothing hovers or interpenetrates
  visibly: no cushions through backs, no beams into nothing.
- [ ] Edge softness is consistent by material across the sample (wood 0.5–1.5 cm, upholstery 3–5 cm, stone 1–3 cm).
- [ ] Detail is concentrated at points of interest; at least one quiet surface per view.

### C. Material separation
- [ ] Wood, plaster, stone, cloth, metal, ceramic and foliage are distinguishable in the neutral pass at 1–3 m.
- [ ] Wood grain runs along each member's length.
- [ ] Built stone shows coursework at real scale.
- [ ] Brass, glaze, glass and water show sheen; matte materials don't.
- [ ] No surface reads as random noise or blotches. Texture motifs are authored and low-contrast.

### D. Grounding
- [ ] Every object in the sample has a visible contact cue: decal, darkening, plinth, feet, roots or verge.
- [ ] Walls meet floors with a skirting or plinth line.
- [ ] Trees meet terrain with flare, roots or litter.
- [ ] Paths meet ground with verge, stones or plants.
- [ ] Contact decals show no z-fighting, no floating on slopes or stairs, and do not darken through walls.

### E. Palette coherence
- [ ] The colours used come from the palette in STYLE_TARGET §5.3, or a documented addition to it.
- [ ] Warm lights are the brightest, most saturated warm elements in every frame. Nothing décor-only outshines them.
- [ ] Foliage on screen stays within the saturation and value rules. Check with sampled pixels in at least three
  points per exterior frame and compare against the baseline samples (`baseline/README.md`).
- [ ] Shade and haze lean cool; light leans warm.
- [ ] Room identity comes only from a wall tint, a textile accent and a prop cluster (no separate art style).

### F. Composition
- [ ] Each key view has a readable anchor or subject, a frame, and a soft background (STYLE_TARGET §5.6).
- [ ] The route is framed, not blocked. Foliage sits at the frame edges, not across the path.
- [ ] The garden's open lawn, lantern circle and sightlines are unchanged (if the sample touches them).
- [ ] The moving walkthrough reads well in motion. Specifically:
  - No popping LOD at walking distance.
  - No flicker.
  - No foliage passing through the camera at eye height on the path.

### G. Puzzle readability
- [ ] Every clue object, plaque, sign, tablet and lock in the sample is at least as readable as in the baseline,
  at the same poses. Compare the same frames side by side.
- [ ] Puzzle-critical discriminators survive in game, neutral and clay passes. The key one is the brass stands on
  the mantel vs the other bases.
- [ ] Required clues keep a clear radius of about 1.2 m and an unobstructed sightline from the approach.
- [ ] Hitboxes, collision footprints, interaction ids, light ids and mantel slot order are unchanged. Any change
  must be listed in E9 and covered by a passing test.

### H. Performance at phone default
- [ ] Draw calls at every sample pose are within the sample's stated budget and ≤ 150. Two runs agree.
- [ ] Triangles are within the sample budget and ≤ 250 k.
- [ ] JS gzip growth is within the sample budget. Any model or texture downloads are listed with sizes.
- [ ] No new per-frame CPU work proportional to object count (e.g. per-object decal updates).
- [ ] The owner's phone FPS is reported (E8) and is not noticeably worse than the baseline on the same phone. If the
  phone check is not done, the review records **"performance on device: unverified"**.

### I. Regression
- [ ] Typecheck clean, unit tests pass, e2e suites pass (walkthrough, L1–L6 lighting, collision, saves, touch).
- [ ] No console errors or failed requests in the walkthrough.
- [ ] Saves from before the sample load without migration issues.

## 4. Outcomes and the propagation rule

| Outcome | Meaning | What happens |
|---|---|---|
| **Pass** | The owner approves; no Fail in A–I | The sample's kit functions may be used in the next area. Its rules are recorded in STYLE_TARGET as "approved". |
| **Pass with fixes** | The owner approves the direction; specific Fails are small and local | The fixes are made and re-captured (E1–E7 for affected poses only). No propagation until the fixes are re-reviewed. |
| **Fail** | The owner rejects the look, or any Fail in A, C, D, G or H that is not small | The kit stays confined to the sample area (behind its own builder or constants, easy to revert). Root cause is noted: shape rules, pipeline limit, palette or lighting. |

**Propagation rule.** No asset, generator, material, texture, palette change or global lighting change from a
sample is used outside that sample's area until that sample has a recorded **Pass**. Global switches (tone
mapping, fill light) are the exception that must be tested estate-wide. They stay at their baseline values in the
shipped build until approved, behind a flag or constant.

**Stop rule.** If a sample fails twice for the same root cause, stop iterating on assets and revisit the approach
before a third round. Examples:
- Organic shapes look generated → switch that asset to the GLB route.
- Lowered fill makes rooms murky → rethink the lighting rule.

## 5. Review record (copy per review)

```
Sample:                       Commit:                 Date:
Evidence: E1 [ ] E2 [ ] E3 [ ] E4 [ ] E5 [ ] E6 [ ] E7 [ ] E8 [ ] E9 [ ]
A Silhouette ........ Pass/Fail   score (1–5, optional): _   notes:
B Craftsmanship ..... Pass/Fail   _
C Materials ......... Pass/Fail   _
D Grounding ......... Pass/Fail   _
E Palette ........... Pass/Fail   _
F Composition ....... Pass/Fail   _
G Puzzle readability  Pass/Fail   _
H Performance ....... Pass/Fail   calls: _/_  tris: _/_  device FPS: _ (or "unverified")
I Regression ........ Pass/Fail   unit _/_  e2e _/_
Owner verdict: Pass / Pass with fixes / Fail
What feels right:
What feels wrong:
Rules to add/change in STYLE_TARGET:
```
