# DEV-01R — canon reconciliation audit (written before any edit)

Audited: branch `ccr-928d1d45-tudz6y` at `6894a89` (DEV-01), review build `?review=dev01`.

## 0. Source availability

The DEV-01R brief says the v0.2 inputs "worden nu aangeleverd". At audit time they were **not present** in this
session: not in the repository (fetched; both remote branches unchanged — `ef6b7c3`, `6894a89`), not in the working
tree, not in the attachment/upload mounts (`/mnt/attach`, `/mnt/user-data/uploads` empty), not elsewhere on disk,
and not in the connected Notion workspace (searched by file name and by canon id `EB.folio.stars`).

| Document | Available? |
|---|---|
| Feh_Lu_We_Puzzle_Design_v0.2.md | ❌ |
| UX_GAME_FEEL v0.2 | ❌ |
| LEVEL_PLAN v0.2 | ❌ |
| LEVEL_LAYOUT.json v0.2 | ❌ |
| ADJACENCY_GRAPH v0.2 | ❌ |
| DELTA_V0_1_TO_V0_2.md | ❌ |
| INTEGRATION_OPEN.md | ❌ |
| Environment Story / Art Bible | ❌ (never available in this repository) |

The audit therefore uses the **canon stated in the DEV-01R brief itself** (B01 chain with ids and details, the
folio = loose drawing sheet concept, DS01 locations and state rules, UX rules). Items that can only be checked
against the missing files are marked **NIET TOETSBAAR** and are not changed on guesswork.

## 1. B01

| # | Item | Implemented (DEV-01) | Canon (DEV-01R brief) | Status |
|---|---|---|---|---|
| B1 | Folio concept | three **folders** ("Map I/II/III", coloured covers, opened with *Openen*) | folio = **los tekenblad** (loose drawing sheet); no competing *werkmap* evidence | **CONFLICT** — changes the fiction (folder vs sheet) and the clue grammar (a "map" reads as a work folder, explicitly excluded) |
| B2 | Folio ids | `I`, `II`, `III`; sources `s.b01.folio.I…` | `EB.folio.stars`, `EB.folio.plants`, `EB.folio.travel` | **CONFLICT** |
| B3 | stars details | lens cap on green cord + star chart with circled W | telescope on a **fork mount** + **two round screw heads**; **notebook with three holes** | **CONFLICT** |
| B4 | plants details | fern with torn tip + pot with one blue band | fern with a **broad diagonal repair strip**; **scissors with one angular + one round grip** | **CONFLICT** |
| B5 | travel details | compass with cracked glass + ticket with one punched hole | suitcase with **two parallel straps + square middle patch**; **label with cut-off top-right corner** | **CONFLICT** |
| B6 | Chain subject → clip → slot | stars→round→round, plants→pointed→pointed, travel→square→square | same | MATCH |
| B7 | Subject → room | stars U05 `sterren`, plants U10 `botanic`, travel U04 `reis` | same subjects; U-ids per LEVEL_LAYOUT | MATCH (room ids **NIET TOETSBAAR**, see L1) |
| B8 | Table instruction text | provisional, uses "map … clip" | "letterlijke instructie uit Puzzle v0.2" | **NIET TOETSBAAR**; wording "map" CONFLICT via B1 |
| B9 | Hint levels 1–3 | provisional, names the old details | "hintniveaus uit Puzzle v0.2" | **NIET TOETSBAAR**; old detail words CONFLICT via B3–B5 |
| B10 | Judging: swap/take back, incomplete = no attempt, complete wrong = neutral, correct = study key; no hasSeen | as specified, unit + e2e tested | same | MATCH |
| B11 | Door plaques, emblem floor plan, guestbook tabs, old catalogue books/sockets | removed in review build | none allowed | MATCH |
| B12 | Botanical emblem prints (old `e.varen` drawings) | removed in review build | no second emblem system | MATCH |
| B13 | Room names on map floor plans | hidden in review build | no room-name evidence | MATCH |
| B14 | Captioned paintings in U04 ("onderweg") and U05 ("sterrenkaart") | still visible | no room-name / label evidence | **MINOR** — thematic words on the walls of two clue rooms; not room names, but label-like |
| B15 | Hall guestbook (`mem.hall.guestbook`) | visible, memory only, no tabs or room relation | no guestbook room→tab relation | MATCH |
| B16 | U04 open suitcase with luggage labels (`mem.reis.suitcase`) | visible near the drying rack | travel pair = suitcase + label | **MINOR** — a near-miss next to the canonical travel pair (no straps/patch, no cut corner); keep, flag for human review |
| B17 | U05 tripod telescope (existing) | visible | stars pair = telescope on a fork mount | MINOR (useful near-miss: tripod, no fork, no screw heads) |
| B18 | DS01 visually/interactively separate from B01 | paper/photo language, no clips/numerals | same | MATCH |

## 2. DS01

| # | Item | Implemented | Canon | Status |
|---|---|---|---|---|
| D1 | A location | G02 hall, note by a maquette | G02 by the **gingerbread** maquette | MATCH (location) · **MINOR** (maquette is a green board model, not gingerbread) |
| D2 | B location | G04 low **side table** by the reading chair, ~7 m from B01 | G04 **rustige leesplank**, apart from B01 | **MINOR** (furniture type) |
| D3 | C location | U04 small drying rack in front of the window, near the suitcases | U04 by window / suitcases / small drying rack | MATCH |
| D4 | A/B/C texts, back text | provisional | "exact door Puzzle v0.2 gespecificeerde teksten" | **NIET TOETSBAAR** |
| D5 | No pickup, no put-back, no quest gate, no storyUnderstood | as specified | same | MATCH |
| D6 | photoFound on C-front inspection; back only after explicit turn | as specified, unit + e2e | same | MATCH |

## 3. UX / notebook

| # | Item | Implemented | Canon | Status |
|---|---|---|---|---|
| U1 | Sections | Waarnemingen · Mijn onderzoek · Archief | same | MATCH |
| U2 | Register owned ≠ read | pickup does not open it; read from the bag | same | MATCH |
| U3 | Only the three register topics, only after deliberate inspection | yes (lines verbatim from the integrated register text) | same; register wording per v0.2 | MATCH (v0.2 register wording **NIET TOETSBAAR**) |
| U4 | Mijn aandacht has no mechanical effect | world state, eligibility and hints unchanged (tested) | same | MATCH |
| U5 | No next step, no automatic clue grouping, no secret total, no hidden placeholders | none (tab shows the count of looked-at sources only) | same | MATCH |
| U6 | Hints separate from world evidence | dialog only, labelled "Hint n", never stored | same | MATCH |
| U7 | Notebook titles of the folios | "Map I/II/III" | sheet, not folder | **CONFLICT** via B1 |

## 4. Level

| # | Item | Implemented | Canon | Status |
|---|---|---|---|---|
| L1 | Room aliases G01 vestibule, G02 hall, G03 living, G04 library, U04 reis, U05 sterren, U10 botanic | derived from the DEV-01 brief | "exact per v0.2 layout data" | **NIET TOETSBAAR** (LEVEL_LAYOUT.json missing); the brief's own DS01 canon (G02 maquette, G04 library, U04 travel room) is consistent with them |
| L2 | Evidence poses | as-built, validated keepouts, e2e reticle-checked | per LEVEL_PLAN metrics | **NIET TOETSBAAR** |
| L3 | Save-relevant room ids | unchanged | unchanged | MATCH |
| L4 | No 200 × 180 roll-out | none | none | MATCH |

## 5. Plan (only what DEV-01 needs to conform)

Correct now: B1–B5, U7 (sheets with the canonical ids and details; save migration for review saves of schema 1),
B8/B9 wording (still provisional, re-labelled to the new details), B14 (captions off in the review build),
D1 (gingerbread maquette), D2 (reading plank on the same footprint).
Keep and document: B16, B17 (near-misses for human review).
Not changed: L1, L2, D4, B8/B9 literal texts, U3 wording — waiting for the documents.
The review-only sauna vegetation fix stays review-only.

## 6. Outcome (after the reconciliation commit)

| # | Resolution |
|---|---|
| B1, U7 | Folios are loose drawing sheets everywhere (world: thin paper with the two sketches; panel: the sheet itself as thumbnail; texts: *tekenblad*). No "map"/folder wording in any B01 text (unit-tested). |
| B2 | Ids `stars` / `plants` / `travel`, source ids `EB.folio.*`; slice schema 2 migrates DEV-01 review saves (unit-tested). |
| B3–B5 | Canonical detail pairs in sheet sketches, room objects (3D telescope on fork mount with two round screw heads; 3D suitcase with two straps + square patch) and texts (unit-tested). |
| B8, B9 | Re-worded to sheets and the canonical details; still provisional pending the literal v0.2 text. |
| B14 | Painting captions off in the review build. |
| D1 | Gingerbread maquette (brown body and roof, white icing). |
| D2 | Reading plank (ledge on trestles), same validated footprint. |
| B16, B17 | Kept as near-misses; listed for the human review. |
| L1, L2, D4, U3 | Unchanged — not verifiable without the v0.2 files. |

Checks after the DEV-01R reconciliation: typecheck ✅ · unit 137/137 ✅ · existing e2e 103/103 ✅ · e2e:dev01 32/32 ✅ ·
normal game vs `ef6b7c3`: draw calls and triangles identical at 13 views, pixel deltas within run-to-run noise ✅.
The review-only sauna vegetation fix stays review-only (separate follow-up).

## 7. Final canon verification against the real v0.2 package (written before any edit)

Sources: `docs/design/v0.2/` at `e8217a6` — PUZZLE_DESIGN (v0.2, 7 Oct), UX_GAME_FEEL (v0.2), LEVEL_PLAN, LEVEL_LAYOUT.json,
ADJACENCY_GRAPH, DELTA_LEVEL_V0_1_TO_V0_2, INTEGRATION_OPEN (v0.2), ENVIRONMENT_STORY, ART_BIBLE, ART_TOKENS (internally v0.1;
treated as the current discipline inputs of the package). All ten were read in full. Scope: only the items §0–§6 left
NIET TOETSBAAR, provisional or derived, plus the checks the DEV-01R-final brief lists. ART_BIBLE/ART_TOKENS are future
production direction and not reconciled here (no art pass); UI colours already equal the "existing UI" tokens.

Citations: PD = PUZZLE_DESIGN, UX = UX_GAME_FEEL, LP = LEVEL_PLAN, LL = LEVEL_LAYOUT.json, ES = ENVIRONMENT_STORY.

### 7.1 Level, room aliases, poses

| # | Item | Current implementation | Design source | Status | Action |
|---|---|---|---|---|---|
| F1 | Room aliases G01–G04, U04, U05, U10 | vestibule, hall, living, library, reis, sterren, botanic (assumed) | ES §5 (G01 vestibule, G02 hal, G03 zitkamer, G04 bibliotheek, U04 gastensuite/pakhoek, U05 sterrenhoek, U10 botanische kamer); LP §12 runtime ids `reis` "gastensuite met pakhoek", `sterren`, `botanic`; LL rooms | MATCH | ids.ts comment: verified, no longer an assumption |
| F2 | Room bounds, door ids on the route | as-built (`door.library`, `door.livLib`, `door.reis`, `door.sterren`, `door.botanic`) | LL `source.rooms` (bounds identical), ADJACENCY physical edges | MATCH | — |
| F3 | B01 clusters reachable before the study key | yes (e2e walks them before the key) | LL check "B01 reachable before studyKey"; PD L01 | MATCH | — |
| F4 | B01 inspection poses | reis (78.6, 85.3) facing N; sterren (79.0, 92.35) facing N; botanic (102.9, 84.0) facing W | LL `evidence_reservations` / LP §7: reis (81.5, 83) W/N, sterren (76.5, 90) W, botanic (104.5, 88) E, 1.2 m clear, status "preferred candidate, not approved replacement" | MINOR | **Not moved.** The reserved spots are occupied by as-built furniture (sterren: bed x 73.9–76.1 directly west of the pose; botanic: the existing 1.2 × 2.4 m table covers (104.5, 88)). Conforming means restaging three rooms = the later blockout (LP §11/§14, "design only; not implemented"). DEV-01 keeps the contract that applies to as-built rooms: right room, pre-key, approach by real controls, ≥ 1.2 m clear around each pose except the target surface (measured: nearest other furniture ≥ 2.3 m). Listed as follow-up. |
| F5 | Gingerbread maquette position | table (85.5, 95.9) against the west wall | LL `ES.gingerbread` centre (88, 96), "secondary scene; no brass base/no code"; ES PB01 flank, off the console axis | MINOR | Move the table to (88, 96) (passes `validatePlacement`: route, stair, openings, poses); pose and route re-derived |
| F6 | DS01 rooms A/B/C | G02 hall / G04 library / U04 reis | PD §5.2, §6.2 | MATCH | — |
| F7 | Save-relevant room ids | unchanged | LP §10 "alle 39 source-room-IDs behouden" | MATCH | — |

### 7.2 B01

| # | Item | Current implementation | Design source | Status | Action |
|---|---|---|---|---|---|
| B20 | Folio ids, concept | `EB.folio.stars/plants/travel`, loose drawing sheets | PD §4.2 | MATCH | — |
| B21 | Detail transcripts | paraphrased ("drie gaten langs de rug", "varenblad met … schuin eroverheen") | PD §4.2 table ("gesloten schrift met drie gaten naast elkaar", "geperste varen onder glas met één brede diagonale reparatiestrook", "koffer met twee parallelle riemen en vierkante middenpatch", "label met afgesneden rechterbovenhoek") | MINOR | literal transcripts in sheet, cluster and notebook |
| B22 | Clip and inspection cluster | clip on a separate empty index card beside the objects, its own inspect target (`b01.clip.*`) | PD §4.2 "ronde clip aan schrift", "puntige clip aan glasplaat", "vierkante clip door labelgat"; PD UX-contract "één inspectiecluster per paar"; PD U01; ES §8 "de clip zit aan het schrift … één inspectiecluster" | CONFLICT | clip drawn on/through the object; one inspect per cluster; cluster source ids = LL evidence ids `EB.stars` / `EB.plants` / `EB.travel` |
| B23 | Table instruction | provisional ("Ieder tekenblad hoorde ooit met een clip …") | PD §4.2 literal instruction | CONFLICT | literal text |
| B24 | Local practice card | absent | PD §4.2 "Lokale oefenkaart: sleutel met drie tanden + gestreepte koordlus; beide originelen ernaast met golftab; getekend oefenvak golftab, niet een vierde slot"; PD §6.7 slice contents | CONFLICT | add: card + both originals with a wave tab on the table, one inspectable source; no fourth slot, no input |
| B25 | Judging | judged automatically when the third slot is filled | PD §4.2 "beoordeel volledige set met 'Controleer'" | CONFLICT | placing never judges; **Controleer** judges (incomplete = no attempt, complete wrong = neutral, correct = drawer) |
| B26 | Mapping | rond=stars, punt=plants, vierkant=travel | PD §4.2 | MATCH | — |
| B27 | Hint levels | provisional wording | PD §4.2 hints 1–3 | CONFLICT | literal |
| B28 | Reward + follow-up card | study key; card names the study, no B02 answer | PD §4.2 | MATCH | — |
| B29 | Competing old evidence | plaques, emblem plan, guestbook tabs, catalogue, emblem prints, captions all off; tripod telescope, open suitcase, herbarium remain | PD §4.2 "Decoratieve sterren/planten/koffers mogen bestaan, maar nooit het volledige unieke detailpaar dupliceren" | MATCH | near-misses B16/B17 (and the herbarium) are explicitly allowed |

### 7.3 DS01

| # | Item | Current implementation | Design source | Status | Action |
|---|---|---|---|---|---|
| D10 | Source ids | `s.ds01.note`, `s.ds01.album`, `s.ds01.letter`, `s.ds01.photo` (+faces) | PD §6.2 `OA.ds01`, `OB.ds01`, `OC.ds01.front/back` | CONFLICT | rename; schema 3 migrates review saves |
| D11 | B as one reading cluster | album and letter are two targets/sources | PD §6.2 "pagina/brief één leescluster; bron OB.ds01" | CONFLICT | one target, one source |
| D12 | A text | provisional | PD §6.2 literal A-tekst (G.M.) | CONFLICT | literal |
| D13 | B page + letter | "Het huisje aan het water", tea, signed "J." | PD §6.2 page 'Gingerbread house — het eerste huisje', empty corners + faded rectangle; literal B-brief (water, G.M.) | CONFLICT | literal text and page art |
| D14 | C front/back/raw text, image | house by the water with bicycles; provisional texts | PD §6.2 literal C-ruwe inspectie and back; front = stylised image of the game maquette + caption | CONFLICT | literal; front art = gingerbread house + caption |
| D15 | C context "raam + koffers + droogrek" | rack at the window; ordinary suitcases 3.6 m away (the open suitcase bench) | PD §6.2 unique combination; "andere kofferprops mogen bestaan" without the unique pair | MINOR | two plain suitcases (no straps/patch/label) beside the rack |
| D16 | First-front notice | generic "Bewaard bij Waarnemingen" | PD §6.4 "eenmaal 'Afbeelding bewaard in notities'" | MINOR | literal |
| D17 | Archive entry | title "Het huisje aan het water", no image, label "Herinnering" | PD §6.1/§6.4 image with title, player title only after photo inspection; UX §4.1 label "Bekeken", never "Opgelost" | MINOR | title "De foto die moest drogen", photo image, label "Bekeken" |
| D18 | DS01 hints | none | PD §6.6 three literal hints, only after a DS01 source was met; C-first question "Waar hoort deze afbeelding bij?" | CONFLICT | add hint context (encounter-based title, no title before a source was seen) |
| D19 | State contract | photoFound monotone on front, back only after turning, no pickup/return/gate, no storyUnderstood, 6 orders | PD §6.4 | MATCH | — |
| D20 | Maquette inspection | decorative, not inspectable | PD OV01 "inspectie optioneel"; ES §7 inspect only if the interaction language is reliable | MATCH | — |

### 7.4 Register and UX

| # | Item | Current implementation | Design source | Status | Action |
|---|---|---|---|---|---|
| U10 | Register topics + reveal | three topics with the register's own lines, only after reading | UX §3, WF-02 (Aan tafel · In de kantlijn · Buiten de paden) | MATCH | — |
| U11 | Observation label | "Waarneming" | UX §2.1 label "Waargenomen" | MINOR | wording |
| U12 | Pin label | 📌 only | UX §2.1 marker **and** "Door jou vastgezet" | MINOR | add text |
| U13 | Own idea label | "Eigen vraag" | UX §2.1 "Mijn idee", dashed border | MINOR | wording |
| U14 | Archiving wording | "Naar archief" / "Terugzetten" / "Zelf gearchiveerd" | UX §4 "Opbergen", "Heropenen", "Opgeborgen · door jou" | MINOR | wording |
| U15 | Empty observations | own sentence | UX §2 "Hier blijven de dingen die je bekijkt." | MINOR | literal |
| U16 | Hint levels | Aandacht / Verband / Oplossing; level 0 = riddle line only | UX §5 / WF-07 "1 Aandacht 2 Relatie 3 Oplossing"; level 0 explains the three levels | MINOR | rename; level-0 explanation |
| U17 | HUD attention label | shown automatically once an attention is chosen | UX §3 / WF-09 "optioneel HUD-label staat standaard uit en toont bij aanzetten alleen onderwerp" | CONFLICT | separate opt-in toggle (default off) |
| U18 | Releasing attention | button "Geen" | UX §3 / WF-03 "Aandacht loslaten" | MINOR | wording |
| U19 | Result label | "Resultaat" | UX §4.1 / ART_TOKENS solved = check + label | MINOR | "✓ Resultaat bevestigd" |
| U20 | One overlay, return context, no click-through, ≥ 48 px, hints apart from evidence | as built (tested) | UX §5, §7 | MATCH | — |

### 7.5 Not changed

ART_BIBLE / ART_TOKENS direction (future production; no art pass). F4 reserved B01 poses (blockout follow-up). Sauna
vegetation fix stays review-only (LP §10 names VD-02 as a separate audit class).

## 8. Outcome of the final verification (after the reconciliation commit)

Two further deviations were found while implementing and are fixed in the same commit (listed so the table in §7
stays as written before the edits):

| # | Item | Current implementation | Design source | Status | Action |
|---|---|---|---|---|---|
| U21 | Invitation before the register | slice variant without the sentence naming the three parts of the route | UX §3 "Als de uitnodiging al drie thema's noemt, die tekst niet censureren: wel citeren, nog geen queststructuur ervan maken" | CONFLICT | full invitation text; topics as structure still only after reading the register |
| D21 | Turn action on the photo | button "Omdraaien" | PD §6.4 "Acties zijn Bekijken en Omkeren" | MINOR | "Omkeren" |

| # | Resolution |
|---|---|
| F1 | Aliases verified (ES §5, LP §12, LL rooms); ids.ts comment updated. No id changed. |
| F4 | Not moved (as-built furniture occupies the reserved spots); contract parts that apply are kept; follow-up for the blockout (DEV01_SLICE §9). |
| F5 | Maquette table at `ES.gingerbread` (88, 96); note pose (88.0, 94.6); route re-derived; `validatePlacement` clean. |
| B21, B22 | Literal transcripts; one cluster per pair (`EB.stars/plants/travel`) with the clip drawn on the notebook / glass plate / through the label hole; separate clip cards and targets removed. |
| B23, B27 | Literal instruction and hints. |
| B24 | Practice card on the table (south end), read via *Oefenkaart bekijken* in the table panel; not a slot, no input, no gate (unit + e2e). |
| B25 | Placing never judges; *Controleer* judges; incomplete = no attempt (unit + e2e). |
| D10, D11 | `OA.ds01`, `OB.ds01` (album page + letter, one target), `OC.ds01` with faces logged as `OC.ds01.front/back`; schema 3 migrates review saves. |
| D12–D14 | Literal A, B (page title + letter), C raw text and back; front image = stylised gingerbread maquette + caption. |
| D15 | Two plain suitcases beside the rack (`ds01.cases`, validated). |
| D16, D17 | Notice "Afbeelding bewaard in notities" once; archive "De foto die moest drogen" with image, label *Herinnering · Bekeken*. |
| D18 | DS01 hint context with encounter-based titles; literal levels; C first → "Waar hoort deze afbeelding bij?". |
| U11–U19 | *Waargenomen*, *Door jou vastgezet*, *Mijn idee* (dashed), *Opbergen / Heropenen / Opgeborgen · door jou*, empty state literal, *Aandacht · Relatie · Oplossing* with a level-0 explanation, opt-in HUD label (default off), *Aandacht loslaten*, *✓ Resultaat bevestigd*. |
| U21, D21 | Full invitation; *Omkeren*. |

Content status: every B01/DS01 source is `canon` (unit-tested); nothing provisional remains. Remaining deviations:
F4 (poses, blockout follow-up), maquette size/art (out of scope), the allowed near-misses, and the optional UX
"Laatst bekeken" view / maquette inspection that the slice contract does not require.
The review-only sauna vegetation fix stays review-only (separate follow-up, LP §10 VD-02).

Checks after the final reconciliation: typecheck ✅ · unit 142/142 ✅ (incl. all 6 B01 permutations via *Controleer*,
all 6 DS01 encounter orders, old-save import, schema ≤ 2 → 3, notebook before/after the register) · existing e2e
103/103 ✅ · e2e:dev01 34/34 ✅ (incl. mobile portrait + landscape) · normal game vs `ef6b7c3`: draw calls and
triangles identical at 13 views, pixel deltas at run-to-run noise ✅.
