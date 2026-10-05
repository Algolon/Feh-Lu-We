# Feh Lu We — playtest guide (iteration 3)

Goal of this round: can friends find their way through the larger estate on their own phones, do the three
threads and the convergence feel fair, where do they get stuck, and how do the controls feel? **The 45–90 minute
duration is an unvalidated design estimate** — the automated walkthrough needs ≈ 6 simulated minutes because it
knows every answer, runs and walks in straight lines.

## Before the session (host)

1. Open the Pages link on the tester's phone (Android Chrome / iPhone Safari), landscape recommended.
2. Testers who played iteration 2 keep their progress: they see a one-time notice "Het landgoed is veranderd".
   To start clean without losing that save: start screen → *Nieuw spel* (the old save is set aside and can be
   brought back with *Vorige voortgang terugzetten*). A private tab also works.
3. Ask them to think aloud. Don't help unless they're stuck for more than ~3 minutes; point to the Hint button
   and the notebook's *Draden* tab first. Note the time at Start.
4. Sound on (atmosphere only; no clue depends on audio).

## Tasks to observe

| # | Task | What to watch |
|---|---|---|
| 0 | Pack at home and leave | Controls discovered quickly? Sideboard drawer found? |
| 1 | Hall drawer | Do they connect "three objects on brass stands" with the mantel and read it facing the hearth? |
| 2 | Choosing a thread | Do they read the ledger? Do they use *Draden* / *Volg deze draad*, or wander? |
| A | Aan tafel | Service plan rule understood (cold/flowers/remaining)? Do they find the conservatory and the sauna outside to the right, and turn the wheels deep → shallow? |
| B | In de kantlijn | Do they combine plan (emblems), door plaques and guestbook (tabs)? Stairs and upstairs corridor easy to navigate? Map route on the study wall followed? |
| C | Buiten de paden | Shed found west of the forecourt? Torch for the board? Item use at the fire? Lantern order remembered? |
| D1 | Basement | Do they realise the seals open the basement door in the back hall? |
| D2 | Route console | Do they match line styles on the drawing to the socket labels? |
| D3 | BOSLUST | Do they find the fork signpost and the cut? Do they connect the library note (ABC → DEF, three back) with the inscription? |
| D4 | Plates | Do they read the wall drawing and turn the plates? |
| — | Navigation | Map with floor tabs used? Any "where am I" moments in the manor or under the hill? Does the tunnel shortcut surprise them? |

## Record per tester

- Device + browser, landscape/portrait, quality setting.
- Total time to ending (also shown on the ending screen).
- Hints viewed per puzzle (ending screen shows the total; *Kopieer feedback* copies per-puzzle hint levels and
  wrong-attempt counts as JSON).
- Stuck points: where, how long, what they tried.
- Mobile comfort (1–5): joystick, looking, tapping objects, reading overlays, button reach, motion comfort.
- Bugs: anything stuck in geometry, doors, objects not reachable, text unreadable, performance drops (note location).
- Mood: did the warm → uneasy → warm arc land? Which places felt memorable?

## Feedback template (paste into the group chat)

```
Tester:            Device/browser:            Orientation:
Finished: ja/nee   Time: __ min   Hints: __    Quality: laag/hoog
Stuck at:
Too easy / too hard:
Controls (1-5): lopen __ kijken __ tikken __ leesbaarheid __
Performance problems (where):
Favourite moment:
Memories we should add:
```

The in-game ending screen's **Kopieer feedback + statistieken** button copies the free-text feedback together
with the build id (also shown in the pause menu), timing, hint levels, wrong attempts, clue count, device
user-agent, quality setting and a local event log (puzzle panels opened, code attempts, refusals, hints, places
visited, solves). Nothing is sent anywhere; it only goes to the clipboard.

Timing fields: `activeIncludingReading` (game visible and running, including reading clues, puzzle panels,
notebook and hints), `atFinish` (frozen at the ending), `moving`, `pausedOrHidden` (pause menu open or tab in the
background — excluded from active time).

## Known limitations to tell testers

- Placeholder notes: real shared memories and photos are not in yet (the story is fictional on purpose).
- No real-phone performance measurement has been done yet; if it stutters, switch *Hoge kwaliteit* off.
- Progress is stored only on that device/browser.
