# EXT-R03/04 release — 16 oktober 2026

Eigenaar heeft live zetten expliciet geautoriseerd. Geteste releasekandidaat integreert de goedgekeurde dak-/steencorrectie `438a503`, de R04-uitwerking inclusief kleinere dichtere klimop en steenstructuur `c7991fd`, en actuele productie `6c52b77` (SKY-C01-R01). Merge `abe2219` is conflictvrij; de productie-wolkenbron is exact behouden.

Typecheck, 401 tests en productiebuild slagen. De nieuwe gekoppelde release-run in `ext-r04/release/` heeft alle tien checks groen: elf buitenbeelden, portret, 27 bewegende cameramonsters, 304 steunhoogtes, gameplay-/openingregistraties, aanloop door de voordeur, picking, batchinggelijkheid en quality-switches. Maximaal 140 calls / 661.284 driehoeken in vaste beelden; de grenzen zijn niet aangepast. Fysieke telefoon-FPS/geheugen blijft ongeverifieerd.

PR #58 is gericht op de productiebranch en bevat PR #56 als voorouder, zodat beide exterioriteraties in één publicatie kunnen landen met behoud van hun commitvolgorde. De volgende stap is CI op deze kandidaat, merge via de bestaande GitHub-route en verifiëren van Pages plus de build-ID en entree/tuingevel op de openbare site. Publicatie is op dit checkpoint nog niet uitgevoerd.

Publieke verificatie: `scripts/ext-r04-live.mjs <deployed-short-sha>` gebruikt een geïsoleerde browsercontext en eigen tijdelijke save. Het leest of wijzigt geen gebruikersprofiel.
