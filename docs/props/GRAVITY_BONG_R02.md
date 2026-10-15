# Gravity bong R02 — productmodel Feh Lu We

## Scope
Vervang de DIY-emmer/fles-gravity-bong op de buitentafel in de handpan-hoek door het commerciële product uit beide door de gebruiker bijgevoegde referenties. Dit is uitsluitend environmental storytelling.

## Designcontract
- Zwarte ronde voetplaat, rechter draagstang, zwarte centrale cilindrische behuizing.
- Twee afzonderlijke transparante afgeronde glazen reservoirs boven en onder de behuizing, beide met zichtbare verticale binnenbuis.
- Beneden: zichtbaar blauw getint water met eigen volume, waterspiegel en rand.
- Boven: rooklaag in het glazen reservoir, subtiel langzaam bewegend.
- Links: horizontaal aansluitstuk, ronde aansluiting, schuin omhoog gericht mondstuk met rookpluim.
- Rechts: horizontaal aansluitstuk, rond plateau, metalen cup/roostertje met smeulend rood-oranje materiaal en tweede rookpluim.
- Productachtige, strakke low/mid-poly vormen met subtiele materiaal- en glashighlights; leesbaar op een telefoon.
- Geen plastic emmer, PET-fles of logo vereist. Geen puzzel- of gameplaymechaniek toevoegen.

## Technische uitvoering
- Model in src/world/gravityBong.ts en alleen de bestaande placement-hook in src/world/grounds.ts wijzigen.
- Centreren op de bestaande tafel zodat mondstuk en bowl op het tafelblad blijven.
- Rook gebruikt de bestaande FIRE_UNIFORMS-klok: GPU-animatie, stilstaand in reduced-motion, zonder nieuwe CPU-loop.
- Cached geometries en batching, transparante rook zonder eigen schaduwen of lichtbronnen.
- Geen veranderingen aan colliders, progression, hints, clues, saves, handpan, route of andere props.
- Validatie: typecheck, tests, productiebuild, Pages-deploy; visuele goedkeuring apart beoordelen op telefoon.