// The interactable-id contract of the browser suites: the pre-DEV-04A baseline plus the documented additions
// (scripts/interactable-additions.mjs). Keeps the manifests auditable: no id twice, none shadowing a baseline id, every
// optional production vignette traced to its source file (declared there exactly once) and declared save-free.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { WICKER_IDS } from '../src/world/wickerRitual';

const json = (f: string) => JSON.parse(readFileSync(`scripts/${f}`, 'utf8'));
const baseline: string[] = json('dev04a-baseline.json').interactables;
const manifests = { dev04c: json('dev04c-additions.json'), dev04d: json('dev04d-additions.json'), optional: json('optional-additions.json') };

describe('interactable-id additions manifests', () => {
  const all = Object.values(manifests).flatMap((m) => m.interactables as string[]);
  it('no id is listed twice or shadows a baseline id', () => {
    expect(new Set(all).size).toBe(all.length);
    expect(all.filter((i) => baseline.includes(i))).toEqual([]);
    expect(baseline.length + all.length).toBe(134); // 128 baseline + 2 DEV-04C + 1 W01 + 3 optional production vignettes
  });
  it('the loader the suites use reads exactly these manifests', () => {
    const src = readFileSync('scripts/interactable-additions.mjs', 'utf8');
    for (const f of ['dev04c-additions.json', 'dev04d-additions.json', 'optional-additions.json']) expect(src).toContain(`'./${f}'`);
  });
  it('the Wickerman ids are the DEV-04C pair and the W01 bale', () => {
    expect(manifests.dev04c.interactables).toEqual([WICKER_IDS.candles, WICKER_IDS.figure]);
    expect(manifests.dev04d.interactables).toEqual([WICKER_IDS.bale]);
  });
  it('every optional production vignette is traced to its source, declared there once, and writes no save state', () => {
    for (const id of manifests.optional.interactables as string[]) {
      const d = manifests.optional.details[id];
      expect(d, id).toBeTruthy();
      expect(d.saves).toBe(false);
      const src = readFileSync(d.source, 'utf8');
      expect(src.split(`'${id}'`).length - 1, `${id} declared once in ${d.source}`).toBe(1);
      // its handler never saves: either no act() at all, or act(..., { save: false })
      const acts = src.match(/g\.act\(/g)?.length ?? 0;
      expect(acts === 0 || (src.match(/\{ save: false \}/g)?.length ?? 0) >= acts, `${id}: act without save:false`).toBe(true);
    }
  });
});
