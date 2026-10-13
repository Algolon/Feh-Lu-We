# UI-R02 — Woodland Archive pilot

Verified production baseline: `ccr-75ef4113-kfkimm` at `ae2a036e783400355c8d137f24e16c33bb1a8323`, 13 October 2026. Dedicated branch: `ui-r02-woodland-archive`.

## Sources and boundary

The request specifies W2 — Field Researcher / Woodland Archive and ART-01. The five attachments (`image-gen-3(4).png`, `image-gen-2(6).png`, `image-gen-1(6).png`, `image-gen-5(2).png`, `image-gen-6(1).png`) were unavailable. They were not inspected or used.

Two earlier W2 images were recovered and visually inspected: `FLW_UI_R01_W2_Field_Researcher_Exploration.png` and `FLW_UI_R01_W2_Field_Researcher_Notebook.png`. They depict a library, not the later BOSLUST concepts. They support quiet dark chrome, fine pale lines, warm paper/ink and an editorial side index. Their simulated book edges, speculative object annotations and different category names are not functional requirements. The supplied original BOSLUST screenshot and revised concept references still need comparison once available.

All game images in this review are real browser captures of the verified repository world. No generated environment, lighting alteration, concept composite or new art asset is used as implementation evidence.

## Architecture found in production

| Area | Existing implementation | Pilot decision |
| --- | --- | --- |
| UI | `src/ui/ui.ts`, DOM templates and event callbacks, no component framework | Reuse this architecture and existing control IDs |
| Styling | `src/ui/style.css`, paper/amber globals shared by menus and puzzles | Extract the old HUD block; add scoped `woodland.css` tokens, HUD and notebook specialization |
| Content | `CLUES`, `CLUE_GROUP`, `THREADS`; symbols and SVG diagrams | Keep text, symbols, ordering and grouping |
| HUD | Pause/hint top left; notebook/bag top right; objective, home checklist, reticle, selected item, action and toast | Preserve callbacks, replace presentation; one visible contextual action |
| Notebook | Draden, Aanwijzingen, Herinneringen; newest observations also repeated in their original groups | Keep these filters and behavior; introduce fixed index with independently scrolling content |
| Map | Separate modal reached from notebook or pause; discovery-filtered levels and unknown landmarks | Keep navigation/filtering; apply archive skin only when reached from notebook |
| Modal management | One overlay, silent replacement, input disabling, Escape/back, focus restoration and trap | Preserve replacement semantics; remove obscured HUD controls from keyboard/accessibility navigation |
| Touch | Floating left joystick (60px physical radius), right drag, short object taps on either side | Preserve input implementation and radius; restyle the stick and add a passive location cue |
| Save/progression | `core/state.ts`, `core/game.ts`, puzzle rules | No changes |
| Experimental notebook | `src/slice/ui.ts`, DEV-01 research/observations/archive model | Its content/layout remains outside this normal-game pilot; shared HUD/modal plumbing is regression checked |

The real interaction picker already provides explicit labels such as `Bekijken: gravure`. The previous UI displayed the same label near the reticle and again in the oversized action button. The pilot retains the existing accessible label and callback but presents one action button; the center keeps a small focus ring. The idle disabled button is visually absent. Keyboard E/Enter/Space and direct object taps are still the game's existing paths.

**Existing content tension:** production Draden includes authored next-step guidance, even for unstarted threads. This pilot preserves that behavior because the brief prohibits an unagreed content/navigation redesign. It does not claim to convert that legacy guidance into a pure observation-only research model. Aanwijzingen and Herinneringen still derive exclusively from recorded clue IDs. No new relationship, location label, secret checklist or inferred observation was added.

## Implementation plan applied

1. Verify baseline and open work; inspect UI, input, clue, map and save paths; capture a clean production BOSLUST comparison.
2. Build reusable chrome tokens and line icons while keeping recognizable illustrated item icons.
3. Implement the HUD and normal-game notebook vertical slice; scope the map skin to the notebook route.
4. Run real viewport/interaction captures, focused UI contracts and existing regressions; inspect screenshots, then stop for owner visual review.

## Design system

| Role | Rule |
| --- | --- |
| Quiet chrome | Forest `#27382d`, charcoal `#17221d`, HUD `rgba(18,28,23,.88)`, pale text `#f1ebdc` |
| Investigation | Paper `#eee7d8`, raised paper `#f7f2e7`, ink `#26302a`, secondary ink `#5e655a` |
| Accent | Brass `#b9a16a` only on notebook access, active contextual action and feedback rule |
| Typography | System sans for chrome/navigation; installed Iowan/Palatino/Georgia serif stack for notebook headings/evidence; no font download |
| Spacing | 4/8/12/16/24px rhythm; content measures up to 68ch |
| Silhouette | 4px general corners, 6px action corner; one paper plane with ruled divisions, no fantasy frame or parchment texture |
| Icons | Small current-color SVG chrome icons; existing full-color item icons and puzzle symbols remain unchanged |
| Feedback | Existing live status/toast messages and timings; small dark strip, positioned away from active action/selected item |
| Interaction | Minimum 48px button/summary targets; selected tab distinguished by fill, keyboard state and text; visible focus outlines |
| Responsive | Touch toolbar uses icons; desktop keeps labels/E cue; landscape side index, portrait top index; safe-area tokens retained |
| Motion | Short opacity/size transitions; no idle pulse or glow; existing reduced-motion setting and OS preference retained |

No external font, texture, UI library, WebGL mesh, draw call or postprocessing pass is added. CSS and JS payload changes are recorded in the QA report. Contrast calculations cover the intended token combinations, not a claim of a full accessibility certification.

## Integration with other work

Open PR #15 (ENV-L01) changes lighting/review/core/main/world files. Open PR #9 (craftsmanship) changes art flags/state/review/world files. Their changed-file lists were inspected. This pilot does not edit any of those files. The CSS change is an import in the existing UI stylesheet plus removal of the previous HUD block; all notebook rules are specialized under `.modal.wa-notebook` to avoid generic menu/puzzle overrides.

DEV-04D content and geometry in the baseline remain untouched. Future environment commits can be rebased independently; rerun the real HUD contrast captures after integrating lighting. Review-toolbar placement remains the responsibility of each opt-in review tool, not a reason to rearrange the normal HUD. No branch belonging to another track is modified.

Inventory, pause/settings and puzzle interface expansion is deferred until this slice has visual approval. No merge or deployment is authorized by this draft.
