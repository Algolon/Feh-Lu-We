# Feh Lu We — family-safe route

- Full game: https://algolon.github.io/Feh-Lu-We/
- Family game: https://algolon.github.io/Feh-Lu-We/game/

Both routes are served by the same GitHub Pages deployment (Vite multi-page inputs). No fork, second Pages site, manual content duplication or query-string filter.

The route is detected centrally in `src/core/edition.ts`. The family version omits the gravity bong model, its supporting low table, its hitbox and action; the handpan, seating, puzzles and rest of the world stay unchanged. It also never requests the bong audio sample and guards the sound trigger as defence in depth.

Graphics default to **high**, including on phones/touch devices. This only affects first-time defaults; users may choose Low manually, and that stored preference is respected. The full game retains its device-dependent defaults.

Save, backup and settings keys use `fehluwe.family.*` on /game/ and keep the historical `fehluwe.*` keys in the full version. Both can be played on the same browser without overwriting each other's progress.

The release workflow builds both entry pages and browser-smokes the family path before deploying. All future updates on the production branch are shared automatically. This is a family-friendly presentation, **not** access control: GitHub Pages is public and the complete game is still accessible at its normal URL.
