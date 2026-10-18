# ENT-GLASS-R01 — dubbele glazen doorgang entree ↔ hal

Owner request 18 oktober 2026: vervang de enkele houten scheidingsdeur met een duidelijk bredere dubbele glazen deur naar de foto (donker metalen kader, decoratief langwerpig rechthoekig inzetprofiel, lange verticale grepen).

## Scope en maten
- Bestaande volle scheidingswand op Z84 blijft staan. Opening verandert van 1.50 x 2.35 m naar **2.40 x 2.70 m**, midden X90, tot de vloer.
- Twee bladeren van 1.20 m, buitenste scharnieren (X88.8/X91.2), centraal sluitvlak, draaien symmetrisch naar entree/vestibule.
- Materialen: zacht transparant warm glas, slank donker bronszwart met rechthoekige opzet op beide zijden, verticale grepen aan beide zijden.
- Smalle metalen deuromlijsting, geen dubbele houten architraven.
- Bestaande ID `door.entranceHall` blijft hetzelfde, één open/dicht-status, geen nieuw slot of puzzel.
- Culling: hal zichtbaar door gesloten glas, maar deur houdt fysiek botsing tegen totdat geopend. Het bestaande lichtselectiesysteem verandert niet.
- Geen wijzigingen aan voordeur, bovenverdieping, entreevloer, meubels of puzzles.

## QA / acceptatie
1. Typecheck, Vitest, Vite-build op PR-branch.
2. In-game beelden vanaf entree en hal met beide deuren gesloten én open, ook schuin close-up (frames/sluitnaad/handgrepen/z-fighting).
3. Collision/ray: gesloten op beide deurhelften blokkeert, open beide vrij; flankerende delen van de scheidingswand blijven solide.
4. Transparante deuren tonen hal bij gesloten toestand; geen plotseling verdwijnende omgeving vanaf entree; test high/mobile render calls + driehoeken.
5. Als er geen screenshots of browsertest beschikbaar zijn, NIET claimen dat visuele QA geslaagd is en nog niet live mergen/deployen.

Geen automatische merge of deploy zonder geverifieerde QA en eigenaarbesluit.
