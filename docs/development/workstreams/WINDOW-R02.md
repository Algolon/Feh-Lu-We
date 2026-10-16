# Feh Lu We — WINDOW-R02: reguliere ramen huisbrede uitrol

## Status / beperkingen
Scope: **46 normale, rechthoekige gevelramen** op het hoofdgebouw (beide verdiepingen)
en de servicevleugel. Werkt op geïsoleerde ontwikkelbranch `window-r02-manor-glazing-rollout`,
draft PR #72, bovenop de eerder visueel goedgekeurde WINDOW-R01-R05 pilot / PR #70.
**Geen merge of deploy** zonder expliciete owner approval en volledige verificatie.

De dakramen, dakkapellen, entreebaai/oculus en ramen in losstaande gebouwen
hebben andere wandtopologie. Deze blijven bewust ongemoeid: niet blind door dezelfde
uitsnijder halen (risico op dak-/serre-/gevelgaten). Er komt een aparte audit op
welke special-geometry werkelijk als fysiek raam bedoeld is.

## Gedeelde architectuur
- `manorWindowLayout.ts`: 10 gevelsegmenten, 46 posities, consistent oppervlak, raamhoogte,
  verdiepingshoogte, buitenrichting en uitsparing. Eén bron voor gevelgeometrie én portalen.
- `manorWindowAssembly.ts`: één naar buiten geplaatst groen kozijn (gemaakt door de gevelhelper),
  glazen vlak, fysiek ondoordringbare ruit, afgewerkte diepe pleister-dagkanten,
  donkere eiken binnenvensterbank. Houtnerfrichting volgt de langsas van de wand,
  ook bij X/Z-gedraaide gevels.
- `roomdefs.ts`: elk afzonderlijk raam is verbonden met de werkelijke aangrenzende kamer
  op de juiste verdieping. Geen universele 'toon hele huis'-portal.
- `interactions/world.ts`: bestaande per-apertuur zichtrichtings-/range-/collision-test
  blijft leidend; het buitenbos krijgt alleen beperkte vensterkegels.
- `arch.ts`: gesneden muurvlakken delen hetzelfde pigment en wereldgeankerde UVs,
  zodat de eerdere verticale banden niet terugkeren.

## Harde review-gates
1. Typecheck, alle tests, build, voor alle 46 ramen: correcte positionering in muuropening,
   fysiek dicht glas, visueel vrij glas, geen raam/deur-overlap.
2. In-game screenshots vanuit beide richtingen op hoofdgevels en servicevleugel;
   ook bovenverdieping en zijgevels beoordelen; leg bekende uitzonderingen expliciet vast.
3. Op mobiel-low: richtlijn max 150 cam draw calls / voorlopig 750k ingediende
   cameradriehoeken. Vergelijk identieke standpunten met productie én met pilot.
4. Controleer culling-popping tijdens draaien/lopen en effect op vegetatie-LOD,
   nachtsituaties, interne kamerzichtlijnen, colliders en picking.
5. Controle op echte Samsung met frametime/p95/p99 vóór algemene release.
6. Actuele productiebranch kan verder zijn dan PR #70: pas na owner-approval
   veilig integreren en her-testen. Eerst pilot + R02 in review, dan pas release.
