# Feh Lu We — puzzle solutions (spoilers), iteration 3 "Het huis dat zich herinnert"

Developer / playtest-host reference. Answers never appear in ordinary player UI except as the optional third
hint ("Oplossing"). Client-side code cannot hide them from someone reading the source.

Plan coordinates: X east, Z north, 1 unit ≈ 1 m; the estate is 180 × 150 with the front gate at (90, 0).
All answers are derived in `src/content/canon.ts` (one source for props, clue texts, hints and tests) and the
rules live in `src/puzzles/rules.ts`. `tests/rules.test.ts` solves the whole route in three different thread
orders; `node scripts/e2e.mjs` plays it through the real controls (see the recorded walkthrough below).

## Route overview

```
home ─▶ hall drawer ─┬─▶ A  Aan tafel        : service plan → conservatory key → cabinet wheels → TAFELZEGEL
 (start)             ├─▶ B  In de kantlijn   : library catalogue → study key → desk buttons     → ARCHIEFZEGEL
                     └─▶ C  Buiten de paden  : shed → fire + plate → garden lanterns            → SPOORZEGEL
                                   (any order; the notebook lets the player follow one thread)
three seals ─▶ basement door ─▶ route console ─▶ letter strip ─▶ BOSLUST cipher ─▶ stair into the hill
            ─▶ route plates + lever ─▶ gathering room ─▶ final letter (finale) ─▶ tunnel shortcut back
```

| # | Puzzle | Exact solution |
|---|---|---|
| 0 | Home | Invitation, torch, matches, notebook from the round table; sideboard drawer → estate key; front door |
| 1 | Hall drawer (ladekast) | Dials **Veer – Dennenappel – Kopje** (the three objects on brass stands, left → right facing the fireplace) |
| A1 | Service plan (kitchen) | **Melkbus + kaas → provisiekamer · gieter met tulp → serre · dampende terrine → eettafel** |
| A2 | Cabinet wheels (conservatory) | **1 Ruit · 2 Golf · 3 Driehoek · 4 Cirkel** |
| B1 | Library catalogue | **Ster-boek → ronde tab · varen-boek → puntige tab · koffer-boek → vierkante tab** |
| B2 | Study desk | Buttons **Put – Schuur – Vuur** |
| C1 | Fire clearing | Kindling on the pit → matches → light the post lantern from the fire → read plate **Maan → Blad → Zon** |
| C2 | Garden lanterns | Light **Maan, Blad, Zon** (judged only when the third burns) → centre stone opens |
| D1 | Basement door | Carry all three seals; use the door |
| D2 | Route console | **Archiefzegel → doorgetrokken lijn · tafelzegel → gestreepte lijn · spoorzegel → gestippelde lijn** |
| D3 | BOSLUST lock | Strip unlatches the cover; **WZHH YLHU HHQ GULH** three letters back = TWEE VIER EEN DRIE → **2 4 1 3** |
| D4 | Route plates | Notch **tafelplaat boven · boekplaat rechts · boomplaat onder** (from the start: 2, 1, 1 turns) → pull the lever |
| D5 | Finale | Read the letter on the table in the gathering room |

---

## 0 · Packing at home (tutorial)
Unchanged from iteration 2: the door refuses until all five essentials are packed and names what is missing.

## 1 · The hall drawer (start thread)
- **Where:** console (ladekast) on the west wall of the hall, just inside the vestibule.
- **Evidence:** the invitation: *"Op de schoorsteenmantel staan drie voorwerpen op kleine messing voetjes. Alleen
  die drie horen bij de lade. Lees ze van links naar rechts, terwijl je voor de haard staat."* The living-room
  mantel shows, left → right when facing the hearth: candle on a tin saucer, **feather on a brass stand**, clock on
  a wooden plinth, **pinecone on a brass stand**, vase on a lace doily, **cup on a brass stand**. The notebook shows
  the same row with its bases. Each dial offers all six objects.
- **Solution:** Veer – Dennenappel – Kopje. Wrong entries only count an attempt.
- **Reward:** the drawer opens: *landgoedregister* (explains the three seals and the basement door) and the shed key.
- **Hints:** 1 where to look · 2 only the brass-stand objects, read facing the hearth · 3 the answer.

## Thread A · Aan tafel
**A1 Service plan.** Torn hosting plan on the dining sideboard (three trolleys, the rules are on the kitchen
chart; the third trolley stayed in the conservatory). Kitchen chart (west wall): *"Wat koud moet blijven, vertrekt
uit de provisiekamer. Bloemen gaan naar de serre. De wagen die overblijft, bedient de tafel."* Three wordless tags.
Hang them in the panel (tap a tag, then a slot; tags can always be taken back). The arrangement is judged only
when all three hang. → The serving hatch opens: **serresleutel** + note.

**A2 Cabinet wheels.** The conservatory key opens both conservatory doors (one shared lock: from the service
corridor and from the garden). Evidence: the pool mosaic (shallow south → deep north: cirkel, driehoek, golf,
ruit), the forgotten trolley ("Het bord daar telt van diep naar ondiep"), and the burned board in the sauna
outside to the right (boxes 1–4 numbered from the deep end). The four numbered wheels above the glass door start
on the untransformed shallow→deep reading. **Answer: 1 Ruit · 2 Golf · 3 Driehoek · 4 Cirkel** → glass door
opens → **tafelzegel**.

## Thread B · In de kantlijn
**B1 Library catalogue.** Evidence: the framed floor plan in the library (each room's emblem, also on the enamel
plaques beside the doors), the guestbook on the lectern (each room's page tab shape) and the reading table (three
books with emblems; three sockets marked with tab shapes: puntig, rond, vierkant). Chain: emblem → room → tab.
- ster → Sterrenkamer → ronde tab · varen → Botanische kamer → puntige tab · koffer → Reiskamer → vierkante tab.
Judged only when all three sockets are filled. → The table drawer opens: **messing sleutel** + archive card.

**B2 Study desk.** The key opens the study upstairs (grand stair → landing → east corridor). The note: press the
three places of the morning walk in the order of the dotted route on the framed map. Map: route starts at the
well (east), passes the shed (west), ends at the fire (south-west). **Put – Schuur – Vuur** → **archiefzegel**.

## Thread C · Buiten de paden
**C1 Shed and fire.** Shed key (hall drawer). The shed is west of the forecourt along the forest path. Dark
inside: the tool board needs the torch. Take the kindling; the workbench drawer holds the **boswandeljournaal**
(sketch of the hill with roots over a door; "follow the southern path; at the signpost with the forked arm go
north into the hill"). Fire clearing (south-west): kindling on the pit, then matches; light the post lantern from
the fire; the copper plate reads **Maan → Blad → Zon**.

**C2 Garden lanterns.** Lawn behind the manor: three lanterns (zon, maan, blad) around a flat stone. Light Maan,
Blad, Zon. A wrong third lantern makes all three flare and go out (the attempt resets; no prefix feedback).
→ The stone's lid slides aside: **spoorzegel**.

## Convergence · Samenkomst
**D1 Basement door** (back hall, behind the grand stair). Three seal impressions; the door names any missing
seal by shape. With all three seals it opens; a stair descends to the Kelderportaal.

**D2 Route console.** Archive (west): the pipe drawing — solid line from the library (walls), dashed from the
conservatory pool (water), dotted from the fire (paths), joining in the route chamber and running on to a hill.
Route chamber (north-west): three sockets labelled only with line styles (left → right: solid, dashed, dotted).
Archiefzegel → solid, tafelzegel → dashed, spoorzegel → dotted. Seals can be moved between sockets or taken
back; judged when all three are in. → Map lights up towards BOSLUST, the **letterstrook** slides out.

**D3 BOSLUST.** Southern loop → signpost with the forked arm at (55.5, 8.6) → side path north into the stone-walled
cut → door in the hill, sign **"BOSLUST"**. Engraved tablet: **WZHH YLHU HHQ GULH**. The library note on secret
writing teaches the shift ("ABC wordt DEF. Om een geschreven bericht terug te lezen, ga je drie letters terug.").
The lock's cover is sealed until the route is restored and the strip is carried. Three back: TWEE VIER EEN
DRIE → **2413**. Wrong codes all give the same neutral message.

**D4 Route plates.** A real stair descends inside the hill to the entry cellar and the rooted passage. Wall
drawing: tafelplaat notch up, boekplaat notch right, boomplaat notch down (left → right as you face the wall).
Each tap turns a plate a quarter clockwise; plates start at down / up / right. Pull the lever; the result is
judged on all three. → **door to the gathering room** opens.

**D5 Finale.** Gathering room: laid table, lit hearth and candles, keepsakes shelf (fictional objects, empty
labels). Reading the letter ends the chapter: *"Een plek onthoudt weinig uit zichzelf. Wij geven haar iets om
te bewaren."* Afterwards the old tunnel north of the room leads to the manor basement; the bolt is on the tunnel
side, so it only becomes a shortcut after the finale and never bypasses the basement door or the cipher.

## Optional content
Billiard panel (balls → lamps: cells 0, 5, 8), memory notes (photo, guestbook, kitchen list, suitcase, telescope
logbook, storage box, nest box in the old oak east of the pond, pond bench, side-gate postbox, cottage card,
keepsakes), the botanical room's herbarium, the old cottage with the Kwartiermaker's note.

## Recorded walkthrough (automated, desktop, no debug cheats)
`node scripts/e2e.mjs` (suite `walkthrough`) plays 70 steps through the real movement, collision, action button
and panels, including deliberate wrong attempts (wrong service plan, wrong lantern order, wrong cipher digits).
Step list with simulated timestamps: [`iteration-3/metrics-after/walkthrough-steps.txt`](iteration-3/metrics-after/walkthrough-steps.txt).
