# EXT-R03/04 release — 16 oktober 2026

Eigenaar heeft live zetten expliciet geautoriseerd. Geteste releasekandidaat integreert de goedgekeurde dak-/steencorrectie `438a503`, de R04-uitwerking inclusief kleinere dichtere klimop en steenstructuur `c7991fd`, en actuele productie `ac8cf1c` (SKY-C01-R01, keuken-/haldoorgang met houten drempel en Mushroom Grove per-instance LOD). Integratiemerges `abe2219` en `b5d8948` zijn conflictvrij. Wolken, Mushroom Grove, Mushroom-modellen, LOD-framework en roomdefs zijn exact gelijk aan productie; de manor-diff beperkt zich tot de bedoelde exteriorcode.

Typecheck, 410 tests en productiebuild slagen. De nieuwe gekoppelde release-run in `ext-r04/release/` heeft alle tien checks groen: elf buitenbeelden, portret, 27 bewegende cameramonsters, 304 steunhoogtes, gameplay-/openingregistraties, aanloop door de voordeur, picking, batchinggelijkheid en quality-switches. Maximaal 141 calls / 661.560 driehoeken in vaste beelden; de grenzen zijn niet aangepast. Fysieke telefoon-FPS/geheugen blijft ongeverifieerd.

PR #58 is samengevoegd op de productiebranch als `be9a9e223da13bd51d599a1b9f00dc82a0b60e35`; de opgenomen PR #56 is eveneens als merged geregistreerd. Beide exterioriteraties zijn in één publicatie geland met behoud van hun commitvolgorde.

Build én Pages-deployment zijn geslaagd: https://github.com/Algolon/Feh-Lu-We/actions/runs/38902422123 . Op 16 oktober 2026 om 14:47 Europe/Amsterdam heeft de geïsoleerde browser de openbare site gecontroleerd: HTTP 200, build-ID `be9a9e2`, nieuwe groenmeshes aanwezig, entree 94 calls / 522.740 driehoeken en tuingevel 104 / 657.516. Geen pagina-/console-/WebGL-/shaderfouten. Bewijs: `ext-r04/live/result.json`, `entrance.jpg`, `garden.jpg`.

Live: https://algolon.github.io/Feh-Lu-We/ .

Publieke verificatie: `scripts/ext-r04-live.mjs <deployed-short-sha>` gebruikt een geïsoleerde browsercontext en eigen tijdelijke save. Het leest of wijzigt geen gebruikersprofiel.
