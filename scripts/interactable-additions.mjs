// The documented interactable ids added after the pre-DEV-04A baseline (scripts/dev04a-baseline.json). Every browser
// suite that checks the id contract reads this one list: baseline + these, nothing else may appear or go.
//   dev04c-additions.json   DEV-04C Wickerman setpiece (wicker.candles, wicker.figure)
//   dev04d-additions.json   DEV-04D W01 hay bale (wicker.bale)
//   optional-additions.json optional production vignettes outside DEV-04 (serre beetle, Bosfruit pouch, bong hit)
import { readFileSync } from 'node:fs';
export const ADDITION_MANIFESTS = ['./dev04c-additions.json', './dev04d-additions.json', './optional-additions.json'];
export const ADDITIONS = ADDITION_MANIFESTS.flatMap((f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).interactables);
