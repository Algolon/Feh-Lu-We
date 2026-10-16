# VIS-R01C C1 — Shared vegetation LOD controller (opt-in)

**Status:** code implemented on isolated feature branch. **Not merged, not deployed.**  
Tracking: [#64](https://github.com/Algolon/Feh-Lu-We/issues/64). Design: [C0 draft PR #65](https://github.com/Algolon/Feh-Lu-We/pull/65).  
**Base:** production `be9a9e223da13bd51d599a1b9f00dc82a0b60e35` (after the exterior changes). No source overlap with nine intervening production commits since Mushroom R01B.

## Implemented
1. `src/world/vegLodController.ts` adds a reusable per-instance **state-selection** component, not a new WebGL renderer. Delegates geometry/visibility/matrix updates to the existing `VegBatch` so both multi-draw and instanced fallback continue to work.
2. Supports distance-based levels, hysteresis, fade modes (`ceil12` Mushroom R01B; `round12` original PlantBatch; `hard` trees; `continuous` opt-in), immutable base transforms, room-gated visibility and conservatively radius-expanded outdoor-doorway visibility with mirrored Z.
3. Caches camera movement/window version/inside-outside changes to avoid redundant per-frame state writes. Does not change shader, material, geometry, draw-call settings, light setup, shadow packing or position generation.
4. `src/world/mushroomGrove.ts` uses the shared controller **only** when `?veglodshared=1`; the default remains the exact existing R01B update function. Profile A/B remains selectable via `?grovelod=a` or `?grovelod=b`.
5. `scene.userData.groveLodImpl` reports `shared-c1` or `legacy-r01b` in automation; force-level diagnostics remain available in both.
6. `tests/vegLodController.test.ts` contains contracts for all three Mushroom category bands, original PlantBatch rounding, hard ranges, hysteresis, first draw/no-op uploads, mirrored doorway windows, forced levels and a full forward/backward distance sweep.

## Critical compatibility constraints
- `VegBatch` must stay unchanged: multi-draw culls per instance; fallback packs visible meshes in late scene hook and preserves shadow reach.
- Mushroom batches/shaders and approved placement hashes remain untouched; change is **only** the early-frame selection caller behind a query flag.
- R01B's `groveSnapshot` and `groveForceLevel` are kept; no GPU or per-frame array allocations in controller, other than the preexisting callback view object.
- `PlantBatch` originally used `round`, not the Mushroom `ceil`: migrating plants with ceil would alter visible onset. Tree hard thresholds and existing profile override `?veglod=hybrid` remain untampered.
- Shader per-instance data currently occupies instanceColour for glow; no attempted generic data system without measured need.
- Device hitch near Mushroom Grove is **unlocalized** in 82348.mp4. No speculative PointLight/LightPool edits here.

## Required gates BEFORE merging or activating by default
1. Actions: `npm run typecheck`, full `npm test` including C1 contracts, `npm run test:budget` (4/4), `npm run build` on current branch.
2. Serve a local preview of both same-source routes (no different commits): `?grovelod=b` vs `?grovelod=b&veglodshared=1`; run `scripts/vis-r01-grove.mjs` with same parameters and `CHECK=1` for `MODE=views,walk,turn,still,toggle,gameplay`, then fallback `MULTIDRAW=0`, low landscape/day/dusk, portrait, high desktop. Compare poses, per-instance levels/fades, pixels, calls, submitted tris, gameplay hashes and errors. The existing measurement script can use `PARAMS=veglodshared=1`.
3. Verify `?grovelod=a` independently (zero LOD but identical visibility/fades). Extra room/doorway windows and camera turns as directed by C0.
4. Run focused mushroom QA and whole E2E vs same-current-production baseline. **No new errors**, do not suppress known failures. Validate same colliders (40) and placement hash (302).
5. Real Android Samsung: first and second approach, 45 m PointLight activation, Moon/Mushroom Vision effect, 10-minute warm run with `?debug=1` median FPS/p95, calls/tris and notes of >50/100 ms hitch. If recurring, add isolated opt-in frametime trace rather than making blind graphics changes.
6. Report objective old-vs-new evidence with screenshots/video and exact SHA, request owner review. Merge only after explicit approval; maintain fast rollback by removing the URL opt-in or disabling the new controller.

## Reproduceerbare same-build browserpariteit

Het nieuwe script `scripts/vis-r01c-parity.mjs` voert de bestaande VIS-R01-meetroute **twee keer sequentieel** op dezelfde `dist`-build uit, met `grovelod=b` en daarna `grovelod=b&veglodshared=1`. Het checkt render calls, driehoeken, afstand, LOD-levels, zichtbare instanties en (bij `MODE=walk`) alle routeframes, popping, en gameplay-vingerafdrukken. SwiftShader render-ms wordt expliciet *niet* als gelijkheids- of mobiele FPS-criterium vergeleken.

```sh
npm run typecheck && npm test && npm run test:budget && npm run build
MODE=views,turn,still,toggle,gameplay node scripts/vis-r01c-parity.mjs
MODE=views,walk,turn,still,toggle,gameplay node scripts/vis-r01c-parity.mjs
MODE=views,walk,turn,still,toggle,gameplay MULTIDRAW=0 node scripts/vis-r01c-parity.mjs
GROVE_PROFILE=a MODE=views,turn,still,toggle,gameplay node scripts/vis-r01c-parity.mjs
DUSK=1 VIEWPORT=portrait MODE=views node scripts/vis-r01c-parity.mjs
QUALITY=high VIEWPORT=desktop MODE=views node scripts/vis-r01c-parity.mjs
```

Resultaten verschijnen onder `scripts/out/vis-r01c-parity/` inclusief JSON met de maximaal eerste 25 afwijkingen. Bij echte regressies breekt het script met een nonzero exitcode; voor timing- of screenshotverschillen is aanvullende gerichte visuele QA nodig.

**Verificatiegrens:** dit checkpoint is via de GitHub-koppeling aangemaakt; de uitvoer van de volledige CI-/browser-/Samsung-gates is op dit moment **niet geverifieerd**. De helper is syntactisch afzonderlijk nagekeken, maar is nog geen geautoriseerde release-onderbouwing. Geen merge of default-activatie zonder de genoemde evidence.

## Follow-up
C2 should migrate **plants first, then bushes, then trees**, preserving the separate `PlantBatch` usages for litter/rocks/deadwood and safeguarding VEG-R02 art branches. A shared API is not by itself sufficient justification to change visuals, thresholds or resource budgets.

The current C1 submission is a **functional prototype with unit contracts**, not a declared QA-approved release. Browser/device evidence has yet to be recorded.
