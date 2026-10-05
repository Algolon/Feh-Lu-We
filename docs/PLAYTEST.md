# Feh Lu We — playtest guide

Goal of this round: can friends finish the prototype on their own phones, where do they get stuck, and how do
the controls feel? **The 30–60 minute duration is an unvalidated design estimate** — the automated walkthrough
takes ~4 simulated minutes because it knows every answer and walks in straight lines.

## Before the session (host)

1. Open the Pages link on the tester's phone (Android Chrome / iPhone Safari), landscape recommended.
2. If they played before: *Pauze → Opnieuw beginnen* for a clean run, or use a private tab.
3. Ask them to think aloud. Don't help unless they're stuck for more than ~3 minutes; point to the 💡 Hint
   button first. Note the time at Start.
4. Sound on (it carries atmosphere, but no clue depends on audio).

## Tasks to observe (in order)

| # | Task | What to watch |
|---|---|---|
| 0 | Pack at home and leave | Do they discover look-drag + joystick quickly? Do they find the sideboard drawer? Do they try the candle (item use)? |
| 1 | Find what's "klaargezet" in the hall | Do they connect the invitation pictograms to the mantelpiece and read left→right? |
| 2 | Upstairs study | Stairs comfortable? Do they follow the dashed route on the map or brute-force the 3 buttons? |
| 3 | Shed in the forest | Do they find the path west from the forecourt? Do they think of the torch for the dark board? |
| 4 | Fire clearing | Do they understand *select item → use* (kindling, then matches) and lighting the lantern from the fire? |
| 5 | Garden lanterns | Do they remember/look up the plate order? Do they understand that only the third lantern tells right from wrong? |
| 6 | Conservatory + sauna | Do they see the pool mosaic, find the numbered board in the sauna, and turn the numbered wheels into the deep→shallow order? |
| 7 | Well | Do they understand the missing-crest message if they come too early? |
| 8 | Cottage | Do they read the fragment's left/right rule? Ending reached? |

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

- Placeholder notes: real shared memories and photos are not in yet.
- No real-phone performance measurement has been done yet; if it stutters, switch *Hoge kwaliteit* off.
- Progress is stored only on that device/browser.
