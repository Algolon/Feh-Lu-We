# Feh Lu We — puzzle solutions (spoilers)

Developer/playtest-host reference. These answers are never shown in ordinary player UI except as the
optional third hint ("Oplossing"). Client-side code cannot hide them from someone reading the source.

Coordinates are plan coordinates: X east, Z north, 1 unit ≈ 1 m. The solution logic lives in
`src/puzzles/rules.ts` (`SOLUTIONS`, `submitCode`, `pressLantern`, `useOnFirePit`, `useOnWell`, `placeInSlot`)
and is covered by `tests/rules.test.ts`, including a full-route progression test.

## Recorded walkthrough (automated, desktop, no debug cheats)

`node scripts/e2e.mjs` drives this exact sequence through the real movement/collision and action button
(53 steps). The step list is written to `scripts/out/walkthrough-steps.txt`.

| # | Beat | Exact solution |
|---|---|---|
| 0 | Home | Take invitation, torch, matches, notebook from the round table; open the sideboard drawer, take the estate key; leave by the front door |
| 1 | Hall drawer | Dials **Veer – Dennenappel – Kopje** |
| 2 | Study desk | Buttons **Put – Schuur – Vuur** |
| 3 | Shed | Shed key; torch on; read tool board; take kindling; open workbench drawer, take token |
| 4 | Fire clearing | Kindling on pit → matches on pit → light post lantern → read plate: **Maan → Blad → Zon** |
| 5 | Garden lanterns | Light **Maan, then Blad, then Zon** |
| 6 | Conservatory cabinet panel | **Ruit – Golf – Driehoek – Cirkel** |
| 7 | Well | Crank on well → wind → crest opens the box |
| 8 | Cottage niches | **Token left, crest right** |

---

## Beat 0 — Packing at home (tutorial)
- **Prerequisites:** none.
- **Clues:** the "Inpakken" checklist (top-left) lists the five essentials; the objective line; the door's refusal message names what is missing and where the key is.
- **Solution:** pick up *uitnodiging* (opens the invitation), *zaklamp*, *lucifers*, *notitieboek* from the round table; open the sideboard (dressoir) drawer on the west wall and take *sleutel van het landhuis*; use the front door ("Vertrekken").
- **Optional lessons:** light the candle by selecting the matches in the bag (🎒 → "In de hand nemen") and using them on the candle; switch the table lamp.
- **Output:** `scene = estate`, player at the front gate.
- **Recovery:** the door refuses to let you leave until all essentials are packed — no hidden soft lock. Spare matches also exist in the manor kitchen island drawer.

## Beat 1 — Hall console drawer (manor, entrance hall)
- **Prerequisites:** estate front-door key (unlocks the front door at (60, 52)).
- **Clues:**
  - Invitation (`c.invitation`): three pictograms drawn **in a ring** (so no order): kopje, veer, dennenappel; text says they stand on the mantelpiece in the living room and to read them **left to right**.
  - Mantelpiece (`c.mantel`, living room west wall, fireplace at (48.8, 62)): physical objects left→right when facing it: kaars, **veer**, klok, **dennenappel**, vaas, **kopje**. The inspect text lists them too.
  - Drawer lock (`c.drawerLock`): three dials, each with kaars, veer, klok, dennenappel, ster, kopje.
- **Reasoning:** keep only the invitation's three pictograms, in mantel order.
- **Answer:** `veer, dennenappel, kopje`.
- **Output:** flag `drawerLockSolved`, lock `lock.hallDrawer`; the drawer springs open; *messing sleutel* (study key) inside.
- **Recovery:** wrong attempts only increment a counter; unlimited retries.

## Beat 2 — Study desk (upstairs, west room)
- **Prerequisites:** brass study key (unlocks `door.study` on the landing).
- **Clues:**
  - Desk note (`c.studyNote`): press the three forest places in the order the **morning sun** reaches them; it rises in the east and sets in the west.
  - Framed map (`c.forestMap`) on the study's south wall: forest with compass; **put** far east (96, 26), **schuur** west (28, 26), **vuurplaats** further west (14, 12). Also recorded in the notebook with the same diagram.
- **Answer:** east → west = `put, schuur, vuur`.
- **Output:** flag `studyLockSolved`, compartment opens; *schuursleutel* inside. The notebook's map doubles as forest navigation.
- **Recovery:** unlimited retries.

## Beat 3 — Timber shed (forest, ≈ (28, 26))
- **Prerequisites:** shed key. Reach it via the forest path that leaves the forecourt to the west.
- **Clues:** tool board (`c.toolboard`) on the shed's west wall: *"Eerst het vuur. Steek dan de lantaarn aan bij het vuur. Pas in dat licht lees je de plaat."* It is **only readable with the torch on** (bag → Zaklamp aan, or F); otherwise a toast explains why.
- **Pickups:** *aanmaakhout* (floor, SW corner); *houten penning* in the workbench drawer (north wall).
- **Output:** kindling + token in inventory.
- **Recovery:** the torch cannot be missed (required to leave home). Pickups stay until taken.

## Beat 4 — Fire clearing (forest, ≈ (14, 12))
- **Prerequisites:** kindling, matches.
- **Steps:** select *aanmaakhout* → use on the fire pit (placed, consumed); select *lucifers* → use on the pit (fire lit). Then use the lantern on the post: it can only be lit **from the fire** ("De lantaarnkap is diep en de lucifers zijn te kort…"). Then inspect the copper plate.
- **Answer revealed:** plate (`c.firePlate`): **Maan → Blad → Zon** ("Zo ontsteek je de tuin.").
- **Wrong combinations:** matches before kindling → explained failure; other items → "Dat helpt niet om vuur te maken."
- **Recovery:** the fire can be put out and relit (wood stays in the pit; matches are reusable). Once read, the plate stays recorded in the notebook.

## Beat 5 — Garden lanterns (open lawn north of the manor)
- **Positions:** Zon (43, 90), Maan (57.5, 94), Blad (72.5, 90). Each shows its symbol on four sides (shape + colour).
- **Answer:** light `maan`, then `blad`, then `zon`.
- **Wrong entry:** all lanterns go out and the attempt resets (`seq.gardenLanterns = []`); no world progress is lost.
- **Output:** flag `lanternsSolved`, lock `lock.cabinetLower` → the conservatory cabinet's lower compartment opens; take the *zwengel* (crank).
- **Recovery:** unlimited retries; order can be brute-forced (6 permutations) but the plate gives it directly.

## Beat 6 — Conservatory cabinet panel (+ barrel sauna)
- **Clues:**
  - Pool mosaic (`c.poolTiles`): from the shallow end with the steps (south) to the deep end (north): **cirkel, driehoek, golf, ruit**. "ONDIEP" / "DIEP" signs on the coping.
  - Sauna board (`c.saunaDiagram`) inside the barrel sauna (outside, east of the conservatory): pool seen from above, arrow from **deep to shallow**, four boxes, "Zoals de stoom opstijgt: van diep naar ondiep."
- **Answer:** reverse of the mosaic order = `ruit, golf, driehoek, cirkel`.
- **Output:** flag `cabinetPanelSolved`, upper glass display opens: *wapenschild* (crest) + well instructions note (`c.wellNote`).
- **Optional:** sauna heater on/off (glowing stones, steam, sound). Never a timer or gate.
- **Recovery:** unlimited retries; the panel can be tried before or after lanterns (order-independent).

## Beat 7 — Well (forest east, ≈ (96, 26))
- **Prerequisites:** crank (beat 5). Crest (beat 6) to open the box.
- **Steps:** select *zwengel* → use on the well (installed, consumed); use again ("Zwengelen") — bucket rises with an iron box. With the crest in the bag, the box opens.
- **Missing prerequisite:** without the crest the bucket still rises and the game explains: the box has a shield-shaped lock; you need the *wapenschild* from the conservatory's upper cabinet. Coming back later with the crest opens it.
- **Output:** *sleutel van het huisje* + *snipper van de uitnodiging* (`c.fragment`: "Links hoort wat uit het bos komt, rechts wat uit het huis komt.").
- **Recovery:** crest is not consumed here. Crank stays installed on the well.

## Beat 8 — Portuguese cottage (≈ (25, 92))
- **Prerequisites:** cottage key (front door), token + crest.
- **Steps:** open the front door; inside, the gathering-room door has **no keyhole**, gold trim and two niches. Use a niche (opens the niches panel).
- **Answer:** `token` in the **left** niche (from the forest/shed), `crest` in the **right** niche (from the house).
- **Wrong placement:** both filled but wrong → door stays shut with a hint; items can be taken back or swapped any time.
- **Output:** flag `cottageSolved`, gathering door opens, table lamps/candles/bunting light up; stepping in triggers the ending, stats and the playtest feedback prompt (copy to clipboard).

## Optional — Billiard panel (manor billiard room, east wall)
- **Taught by examples:** two framed sketches (`c.billiardExamples`): a lamp lights where a **coloured** ball lies; the white ball does not count; the window is at the top.
- **Evidence:** the actual table: red top-left, yellow middle-right, blue bottom-right, white bottom-middle.
- **Answer:** cells 0, 5, 8 (row-major, window row first).
- **Reward:** memory note `mem.billiard.scoreboard`. Not required for the ending.

## Optional memories
Guestbook (hall), photo (living), shopping list (kitchen), storage box (upstairs), pond bench note, side-gate postbox, home calendar, cottage table card. See `src/content/memories.ts`.
