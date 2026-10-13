# ENV-L01 — four-phase direction

ART-01 remains the authority: crafted European woodland manor, material identity and construction, lively earthy colours, clear silhouettes. No asset, layout, HUD or puzzle redesign. Prototype-only, owner approval pending.

| Phase / review value | Feeling | Zenith / horizon anchors | Sky fill / earth fill | Hemi / sun | Sun elevation |
|---|---|---|---|---|---|
| ENV-01 / 0 | welcoming curiosity | #809fba / #d0d9d2 | #d2deea / #8b8067 | 1.70 / 2.10 | 47° |
| ENV-02 / ⅓ | warm familiarity | #809ab7 / #dfccb5 | #c9d9ea / #80705b | 1.55 / 2.40 | 24° |
| ENV-03 / ⅔ | cool mystery | #53677f / #a098a4 | #bdcee0 / #8191a2 | 2.00 / 0 | −4° |
| ENV-04 / 1 | quiet suspense | #26354c / #656a7d | #adc3db / #778aa2 | 1.85 / 0 | −11° |

These are authored inputs, not target screen pixels or measured illuminance. Linear RGB interpolation with smoothstep at each stop. Twilight fill is intentionally stronger than a physically realistic night: direct sunlight disappears, while a less brown earth gradient keeps downward-facing forms readable. This is a design experiment, not a claimed Android defect fix.

## One shared system

One existing procedural sphere, one sky shader, one hemisphere and one directional light. Position of the disc and light use the same direction/elevation, azimuth 245°. Sun/glow taper near the horizon and are absent at blue hour/late dusk. No fake warm daytime sun at night. Optional moon/stars/clouds deferred until the core values pass review: they add little to this diagnostic and could mask colour problems.

Sky uses ACES/exposure 1.15/output colourspace in pilot mode; legacy mode keeps its original path. Horizon blends 70% towards the regional haze palette. Fog uses the existing Three.js fog path (display-space fog mixing is not identical to tone-mapped sky radiance); judge the actual horizon/terrain join in captures, not identical numerical hex values.

Open ground: broad diffuse sky and selective sun modelling. Woodland: retained soft region weight, slight daytime sage haze, 4% fill attenuation, 14% direct attenuation; cool evening haze retains near/mid/far layers. Interiors: existing room factor, sun reduction, window-sky/floor gradient and ×1.7 fixtures remain; their phase response is tested, not assumed safe. Underground shares the existing indoor classification: a separate basement brightness treatment is deferred.

Outdoor practical gain is 1 / 1 / 1.06 / 1.12, fading to the existing interior gain at doorways. No source added, no radius expanded, no shadow-casting point light; LightPool ranking/dwell/fades and logical fire/lamp states unchanged. Emissive fixtures and patches remain tied to their existing on/off state, not automatically activated at dusk. Puzzle lanterns are not lit automatically.

## Narrative mapping and decisions

Keep `targetDusk = min(1, solvedCount / REQUIRED_COUNT × 0.85 + (finished ? 0.15 : 0))` and existing exponential smoothing. The four stops are presentation only: fresh state → daylight; about 39% of required solves → golden stop; about 78% → blue stop; full finale → late dusk. At all required puzzles but before finale, t=0.85 blends blue into late dusk. No real-time clock, completion flag edit or save migration. Preview slider bypasses the visual value in the sandbox only; audio/progression continue to use real puzzle dusk.

Owner choices: main evening should be ENV-03; retain restrained horizon colour and enough cool earth fill to read paths. ENV-04 should be subtly quieter, not a dramatic second darkening. Reject any configuration that needs the torch for routine navigation. Review daylight green saturation and whether distant haze is too light; do not compensate with exposure or dense fog.
