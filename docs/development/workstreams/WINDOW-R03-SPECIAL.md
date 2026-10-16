# WINDOW-R03 — afwijkende ramen: constructieve inventaris en implementatiegates

**Basis:** actuele reguliere raamuitrol WINDOW-R02, geïntegreerd in PR #81.
**Branch:** `window-r03-special-windows`. Niet deployen of mergen voordat deze
speciale constructies stuk voor stuk architectonisch correct en visueel getest zijn.

## Broncode-audit (16 oktober 2026)

| Type | Locatie in code | Huidige toestand | Volgende ingreep |
|---|---|---|---|
| 8 dakkapellen (2×S, 2×N, 2×W, 2×E) | `manor.ts` rond `dormer()` | Framed `windowAt` tegen **massief houten/stenen dakkapellichaam**, zonder echte muuropening of gekoppelde zichtportal. Een extra doorzichtige ruit zou op de vaste body kijken. | Snij de daadwerkelijke dakkapel-voorwand uit, met een doorlopende uitsparing door beide wandlagen, een enkele ruit, kozijn en afgewerkte binnenkanten. Bepaal eerst welke zolder-/bovenkamers daadwerkelijk aansluiten. |
| Ronde entree-oculus | `manor.ts` `cyl(... M.glow ...)` | Rond glanzend/donker decoratief vlak in stenen geveltop; geen ronde uitsparing | Echte annulaire opening in pediment, één ronde glasplaat en juiste binnenruimte. Heeft een eigen triangulatie nodig (niet rechthoekige `wall()`). |
| Langwerpig entree-bovenraam | `manor.ts` `windowAt('x',79.55,...)` | Decoratief raam op de massieve entreewand, mogelijk dubbele gevelopbouw. | Architectonische doorsnede van de uitbouw bepalen, zodat geen raam op achterliggende steen uitkijkt. |
| Dakraam uitkijkhoek | `atticRoofSkin()`, `atticRoofWindow()`, `roofWindowOutside()` | **Binnenste dakvlak heeft reeds echte uitsparing**, met een binnenruit. Buitenste dakvlak gebruikt nog gedempte `glow`-glazing. | Controleer of de buitenste daklaag hetzelfde gat heeft; zoniet, herbouw die specifieke daktriangulatie. Slechts één ruit en aangrenzende culling correct maken. Bestaande telescoop-vignette behouden. |
| Copacabana serre | `conservatory.ts` | Bestaande *echte* glazen gevel en dak met eigen collider/doorlogica en materiaal. | Geen uniforme manor-raamuitrol. Alleen visuele/LOS QA, niet opnieuw bouwen. |
| Schuur, sauna, Portugalhuisje | `estate.ts`, overige gebouwhelpers | Afzonderlijke gebouwen/gevelregels. | Inventaris per gevel; geen fictieve ramen toevoegen. Alleen bestaand glas vrij maken waar een werkelijke opening bestaat. |

## Acceptatie-eisen per afwijkend raam
1. Eén constructieve opening, één glasvlak, geen onverklaarbare steenplaten
   achter glas of tweede kozijn; waar passend rustige mahonie-vensterbank, niet
   automatisch bij ieder dak- of serre-raam.
2. Doorzicht van binnen naar buiten én terug, correcte culling/LOS, fysieke collision;
   deuren en bestaande puzzelobjecten niet beïnvloeden.
3. In-game close-ups, frontaal en schuin, dag en nacht, minimaal een voorbeeld
   per geometry-type, plus mobiel portrait.
4. Vergelijk draw calls en submitted triangles tegen **actuele** productie in
   identieke camerastandpunten; PB01 150 / voorlopig 750k op mobile-low,
   maar benoem afzonderlijk bestaande overschrijdingen en regressies.
5. Speciale bouwdelen in kleine batches: eerst dakkapel, dan ronde entree,
   dan dakobservatorium, dan serre/bijgebouwen. Geen megamerge voordat de
   geometry-passingen zijn bevestigd.
6. Behoud bestaande geometrische referentiedata en verschuif geen puzzleprops.

## Status
Dit is de **bevestigde inventaris en implementatiepoort**, geen afgeronde
3D-implementatie. R03 is bewust geïsoleerd van de R02 release.
