# DEV-01 human review script

Automated tests prove the mechanics; they do not prove understanding or fun. This script is for 2–4 testers who
have **not** seen the solutions. One host observes and notes; the tester thinks aloud. ~30–45 min per tester.

## Setup

- Link: `…/Feh-Lu-We/?review=dev01` (local: `npm run build && npm run preview`, then
  `http://<lan-ip>:4173/Feh-Lu-We/?review=dev01` on the phone; `vite preview --host` to expose it).
- Start card → **Nieuwe test**. The tester's own saved game is never changed.
- Host only: `&debug=1` shows room id + v0.2 alias, target id and slice state. Never show it to the tester.
- Host spoilers: `DEV01_SLICE.md` §2/§5 (B01 canon chain and detail pairs).
- Record per tester: device + browser, landscape/portrait, minutes per phase, hints opened (level), wrong B01 sets,
  every moment of confusion (quote it), and the `?debug=1` FPS in the hall, library and U04 if available.

Say only: *"Je komt aan bij een landhuis. Kijk rond, lees wat je vindt en praat hardop. Er is geen haast."*
Do not mention the photo, the album, the drawing sheets or the clips.

## Phase 1 — arrival → drawer → register (G01–G03)

Observe: Does the tester open the front door, find the mantel rule from the invitation and open the drawer
without help? After taking the register, do they read it (bag → *Lezen*) on their own?

Ask after the register: *"Wat staat er nu in je notitieboek? Wat is het verschil tussen de drie delen?"*

- [ ] Before reading the register the notebook shows no topics, no "next step".
- [ ] After reading, the tester can say where the three topics came from (the register, verbatim).
- [ ] *Mijn aandacht*: does the tester expect it to change the house? (It must not.) Note what they expect.

## Phase 2 — B01 (library → upstairs → library)

Observe without hinting:
- [ ] Does the tester understand **object pair → clip → slot**? At which step do they get it?
- [ ] Do they look for rooms by **content** (what lies on the table) rather than by labels? (There are no plaques
  and no room names on the map in this build.) Quote how they describe where they are going.
- [ ] Do they treat the drawing sheets as loose sketches (not as folders/documents)? Note their words.
- [ ] Do they think DS01 objects (maquette note, album, letter, photo) belong to B01? Note any attempt to use them.
- [ ] Can they compare a sheet sketch with the upstairs objects on the phone? (Tekenblad *Bekijken* → *Vergroten*;
  Waarnemingen keeps the sketches.) Note squinting / zooming / walking closer.
- [ ] Wrong full set: is the neutral line understood as "not yet" (not as a hint about a specific slot)?
- [ ] Do they use **Notities** from the table and come back? Is their selection still there?
- [ ] Hints: which level did they open, and was level 0 (riddle name only) useful or annoying?

Ask after solving: *"Hoe wist je welke map in welk vak moest?"* — a good answer names the clip shape.

## Phase 3 — DS01 (optional discovery; never steer)

- [ ] Does the tester follow a reference spontaneously (note → album; letter → "kamer met de koffers")?
- [ ] If they found the photo first (C-first), does the album later make sense to them?
- [ ] Do they turn the photo over (*Omdraaien*) on their own?
- [ ] Ask: *"Waarom hangt die foto daar?"* — can they explain it (tea spilled, put to dry)?
- [ ] Ask: *"Voelde dat als een opdracht of als iets wat je ontdekte?"*

## Phase 4 — notebook as memory aid

Show the notebook and ask the tester to point at:
- [ ] a **waarneming** (something they saw), [ ] an **eigen vraag/idee** (make one if none), [ ] a **hint**
  (they should say hints are not in the notebook), [ ] a **resultaat**.
- [ ] Ask them to find the suitcase-and-label sheet again without the table. Time it.
- [ ] Does anything in the notebook feel like it gives away the solution? Quote it.

## Phase 5 — phone handling

- [ ] B01 detail pairs, clip shapes, photo front/back readable? (Landscape and portrait.)
- [ ] Any button hard to hit (target < finger)? Any panel cut off / needing sideways scroll?
- [ ] Return from Notities lands in the same panel, same selection, same scroll?
- [ ] Closing a panel never triggers something in the world behind it?
- [ ] Comfort on the grand stair and the upstairs gallery (speed, nausea, getting stuck at door leaves)?

## Reporting

Per tester: the checklist above, minutes per phase, hints (context + level), wrong B01 sets, device/FPS, and the
three biggest confusions verbatim. Pause → *Kaart* is available; note if they reach for it and what they expected.
