// DEV-01 slice contracts (B01 v0.2, DS01, register/notebook, events, saves, old-save migration, hints).
import { describe, it, expect } from 'vitest';
import { defaultState, parseSave, migrate, type GameState } from '../src/core/state';
import { pickup } from '../src/puzzles/rules';
import { SLICE } from '../src/core/artflags';
import {
  b01Place, b01Take, b01Check, b01Solved, b01Loose, freshSliceState, setHudAttention, recordObservation, observeRegister, registerTopics, setAttention,
  syncDerived, ds01Front, ds01Back, encounter, hintContexts, revealHint, saveQuestion, setArchived, togglePin, notebookView, importMainSave, observed,
} from '../src/slice/model';
import { parseSlice, defaultSlice, SEMANTIC_EVENTS } from '../src/slice/schema';
import { B01_SLOTS, B01_FOLIOS, B01_ANSWER, B01_CHAIN, SRC, type FolioId } from '../src/slice/ids';
import { REGISTER_TOPICS, REGISTER_TEXT, SLICE_HINTS, SOURCES, FOLIO_DETAILS, CONTENT_STATUS, TABLE_TEXT, B01_INSTRUCTION, PRACTICE_TEXT, DS01_MEMORY, DS01_FOUND_NOTICE, HINT_LEVEL_NAMES } from '../src/slice/content';
import { folioPage, pairView, practiceCard, photoFront } from '../src/slice/drawings';
import { CLUES } from '../src/content/clues';

const perms = <T,>(a: T[]): T[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const reload = (s: GameState) => parseSave(JSON.stringify(s))!;
const events = (s: GameState, type: string) => (s.slice?.log ?? []).filter((e) => e.type === type);
/** Everything except the slice block: used to prove "no world-state change". */
const world = (s: GameState) => { const { slice: _s, ...rest } = JSON.parse(JSON.stringify(s)); return rest; };
/** Lay the three sheets in slot order, then press "Controleer" (PD v0.2 §4.2). Returns the check outcome. */
const fillB01 = (s: GameState, order: FolioId[]) => { B01_SLOTS.forEach((slot, i) => b01Place(s, slot, order[i])); return b01Check(s); };

describe('DEV-01 B01: folio → details → upstairs pair → archive clip → slot', () => {
  it('the chain maps sterren→rond, planten→punt, reizen→vierkant; answer derived from it', () => {
    const bySubject = Object.fromEntries(B01_CHAIN.map((c) => [c.subject, c.clip]));
    expect(bySubject).toEqual({ sterren: 'rond', planten: 'punt', reizen: 'vierkant' });
    for (const c of B01_CHAIN) expect(B01_ANSWER[c.clip]).toBe(c.folio);
    expect(new Set(Object.values(B01_ANSWER)).size).toBe(3);
  });
  it('all 6 permutations: exactly one opens the drawer', () => {
    let correct = 0;
    for (const p of perms(B01_FOLIOS)) {
      const s = freshSliceState(1);
      const r = fillB01(s, p);
      if (b01Solved(s)) { correct++; expect(r.ok).toBe(true); expect(s.unlocked).toContain('lock.libraryDesk'); expect(s.open['library.desk']).toBe(true); }
      else { expect(r.ok).toBe(false); expect(s.slice!.b01.wrong).toBe(1); expect(s.open['library.desk']).toBeUndefined(); }
    }
    expect(correct).toBe(1);
  });
  it('correct solve needs no observation / hasSeen state at all', () => {
    const s = defaultState(1); // no slice block, nothing observed, not even the table
    fillB01(s, B01_SLOTS.map((k) => B01_ANSWER[k]));
    expect(b01Solved(s)).toBe(true);
    expect(Object.keys(s.slice!.obs)).toEqual([]);
  });
  it('placing never judges; "Controleer" on an incomplete set is no attempt; swap/take-back keep every sheet recoverable; complete wrong set is neutral', () => {
    const s = freshSliceState(1);
    expect(b01Place(s, 'rond', 'stars').ok).toBe(true);
    expect(b01Place(s, 'punt', 'travel').msg).toMatch(/ligt in het vak/);
    const inc = b01Check(s);
    expect(inc.ok).toBe(false); expect(inc.msg).toMatch(/elk vak/);
    expect(s.slice!.b01.wrong).toBe(0);
    b01Place(s, 'punt', 'stars'); // move stars from rond → punt
    expect(s.slice!.b01.slots).toEqual({ punt: 'stars', rond: null, vierkant: null });
    expect(b01Loose(s).sort()).toEqual(['plants', 'travel']);
    b01Place(s, 'rond', 'travel');
    expect(b01Place(s, 'vierkant', 'plants').ok).toBe(true); // a full but wrong set is not judged by placing
    expect(s.slice!.b01.wrong).toBe(0);
    const wrong = b01Check(s);
    expect(wrong.ok).toBe(false);
    expect(wrong.msg).not.toMatch(/punt|rond|vierkant|map I|sterren|planten|reizen/i); // no prefix / per-slot oracle
    expect(s.slice!.b01.wrong).toBe(1);
    expect(b01Take(s, 'punt').ok).toBe(true);
    expect(b01Take(s, 'punt').ok).toBe(false);
    expect(b01Loose(s)).toEqual(['stars']);
    b01Place(s, 'punt', 'plants'); b01Place(s, 'rond', 'stars'); b01Place(s, 'vierkant', 'travel');
    expect(b01Solved(s)).toBe(false);
    expect(b01Check(s).ok).toBe(true);
    expect(b01Place(s, 'rond', 'travel').ok).toBe(false); // fixed once solved
    expect(b01Check(s).ok).toBe(false);
  });
  it('solved ≠ reward claimed: the key is claimed only when taken from the drawer', () => {
    const s = freshSliceState(1);
    fillB01(s, B01_SLOTS.map((k) => B01_ANSWER[k]));
    syncDerived(s);
    expect(s.slice!.results).toContain('b01.solved');
    expect(s.slice!.results).not.toContain('b01.studyKey');
    expect(events(s, 'RewardClaimed').map((e) => e.id)).not.toContain('b01.studyKey');
    pickup(s, 'pk.studyKey', 'studyKey'); syncDerived(s);
    expect(events(s, 'RewardClaimed').map((e) => e.id)).toContain('b01.studyKey');
    expect(events(s, 'ItemAcquired').map((e) => e.id)).toContain('studyKey');
  });
});

describe('DEV-01 save/reload of mechanical and observation state', () => {
  it('before solve, after solve, before reward and after reward', () => {
    const s = freshSliceState(1);
    recordObservation(s, SRC.folio('stars'), 'library'); encounter(s, 'b01');
    b01Place(s, 'rond', 'stars'); b01Place(s, 'punt', 'travel');
    let r = reload(s);
    expect(r.slice!.b01.slots).toEqual({ punt: 'travel', rond: 'stars', vierkant: null });
    expect(observed(r, SRC.folio('stars'))).toBe(true);
    expect(r.slice!.encountered).toEqual(['b01']);
    b01Place(r, 'punt', 'plants'); b01Place(r, 'vierkant', 'travel'); b01Check(r); syncDerived(r);
    r = reload(r); // solved, reward not claimed
    expect(b01Solved(r)).toBe(true);
    expect(r.open['library.desk']).toBe(true);
    expect(r.taken).not.toContain('pk.studyKey');
    expect(r.slice!.results).toEqual(expect.arrayContaining(['b01.solved']));
    pickup(r, 'pk.studyKey', 'studyKey'); syncDerived(r);
    r = reload(r); // reward claimed
    expect(r.inventory).toContain('studyKey');
    expect(r.slice!.results).toContain('b01.studyKey');
    expect(r).toEqual(reload(r)); // stable round-trip
  });
  it('the observation faces and DS01 flags survive a reload', () => {
    const s = freshSliceState(1);
    ds01Front(s, 'reis'); ds01Back(s, 'reis');
    const r = reload(s);
    expect(r.slice!.obs[SRC.dsPhoto].faces).toEqual(['front', 'back']);
    expect(r.slice!.ds01).toEqual({ photoFound: true, photoBackSeen: true });
  });
  it('slice schema sanitises garbage, duplicates and impossible combinations', () => {
    expect(parseSlice(null)).toBeNull();
    expect(parseSlice({ schema: 99 })).toBeNull();
    const p = parseSlice({ schema: 2, b01: { slots: { punt: 'stars', rond: 'stars', vierkant: 'X' } }, ds01: { photoFound: false, photoBackSeen: true }, attention: 'nope', log: [{ type: 'Hack', id: 'x' }] })!;
    expect(p.b01.slots).toEqual({ punt: 'stars', rond: null, vierkant: null });
    expect(p.ds01.photoBackSeen).toBe(false);
    expect(p.attention).toBeNull();
    expect(p.log).toEqual([]);
  });
  it('normal game unchanged: no slice block unless the review build writes one; flag off outside ?review=dev01', () => {
    expect(SLICE).toBe(false);
    expect('slice' in defaultState(1)).toBe(false);
    expect('slice' in migrate({ version: 4, scene: 'estate', flags: { catalogSolved: true } })!).toBe(false);
  });
});

describe('DEV-01 DS01 "De foto die moest drogen" (optional)', () => {
  const visit: Record<'A' | 'B' | 'C', (s: GameState) => void> = {
    A: (s) => recordObservation(s, SRC.dsNote, 'hall'),
    B: (s) => { recordObservation(s, SRC.dsAlbum, 'library'); }, // album page + letter: one reading cluster
    C: (s) => { ds01Front(s, 'reis'); },
  };
  it('all 6 visiting orders end in the same state; C first works; A and B stay meaningful after C', () => {
    const outcomes = perms(['A', 'B', 'C'] as const).map((order) => {
      const s = freshSliceState(1);
      const b4 = world(s);
      for (const k of order) visit[k](s);
      const nb = notebookView(s);
      expect(s.slice!.ds01.photoFound).toBe(true);
      expect(s.slice!.results.filter((r) => r === 'ds01.memory')).toHaveLength(1);
      for (const id of [SRC.dsNote, SRC.dsAlbum, SRC.dsPhoto]) expect(nb.observations.some((o) => o.id === id)).toBe(true);
      expect(nb.research.questions).toEqual([]); // no automatic quest / checklist
      expect(nb.research.topics).toBeNull(); // DS01 never reveals or creates topics
      expect(world(s).flags).toEqual(b4.flags); // no story/quest flags, no main-route effect
      expect(world(s).inventory).toEqual(b4.inventory); // the photo is never an item
      expect(s.slice!.b01).toEqual(defaultSlice().b01); // and never a B01 piece
      return JSON.stringify({ ds: s.slice!.ds01, mem: nb.archive.memories.map((m) => m.id) });
    });
    expect(new Set(outcomes).size).toBe(1);
  });
  it('photoFound is monotone and the memory reward is granted exactly once', () => {
    const s = freshSliceState(1);
    expect(ds01Front(s, 'reis').first).toBe(true);
    expect(ds01Front(s, 'reis').first).toBe(false);
    recordObservation(s, SRC.dsAlbum, 'library');
    expect(events(s, 'RewardClaimed').filter((e) => e.id === 'ds01.memory')).toHaveLength(1);
    expect(notebookView(s).archive.memories.filter((m) => m.id === 'ds01.memory')).toHaveLength(1);
    expect(reload(s).slice!.ds01.photoFound).toBe(true);
  });
  it('the back is registered only after it was really turned over', () => {
    const s = freshSliceState(1);
    expect(ds01Back(s, 'reis')).toBe(false); // cannot turn what you have not looked at
    ds01Front(s, 'reis');
    expect(s.slice!.obs[SRC.dsPhoto].faces).toEqual(['front']);
    expect(s.slice!.ds01.photoBackSeen).toBe(false);
    expect(notebookView(s).observations.find((o) => o.id === SRC.dsPhoto)!.back).toBeUndefined();
    ds01Back(s, 'reis');
    expect(s.slice!.ds01.photoBackSeen).toBe(true);
    const o = notebookView(s).observations.find((x) => x.id === SRC.dsPhoto)!;
    expect(o.back?.text).toBe('Weekendhuizen · blad: het eerste huisje. Album op de leesplank in de bibliotheek. De afbeelding hoort bij de maquette in de hal.');
    expect(o.provenance).toMatch(/voor- en achterkant/);
    // the two faces are logged under their canon ids
    expect(events(s, 'ObservationRecorded').map((e) => e.id).filter((id) => id.startsWith('OC.'))).toEqual(['OC.ds01.front', 'OC.ds01.back']);
  });
  it('B01 and the study lock need no optional (DS01) state; DS01 never touches B01', () => {
    const s = freshSliceState(1);
    fillB01(s, B01_SLOTS.map((k) => B01_ANSWER[k]));
    expect(b01Solved(s)).toBe(true);
    expect(s.slice!.ds01).toEqual({ photoFound: false, photoBackSeen: false });
    expect(Object.keys(s.flags).filter((f) => /^opt\.|ds01|photo/i.test(f))).toEqual([]);
    const t = freshSliceState(1);
    for (const k of ['A', 'B', 'C'] as const) visit[k](t);
    expect(t.slice!.b01).toEqual(defaultSlice().b01);
    expect(t.unlocked).toEqual([]);
  });
});

describe('DEV-01 register, notebook and attention', () => {
  it('before the register: only sources really looked at, no topics', () => {
    const s = freshSliceState(1);
    const nb = notebookView(s);
    expect(nb.observations.map((o) => o.id)).toEqual(['c.invitation']);
    // UX v0.2 §3: the invitation is quoted in full, not censored — but it creates no topic structure
    expect(nb.observations[0].text).toBe(CLUES['c.invitation'].text);
    expect(nb.research.topics).toBeNull();
    expect(nb.research.attention).toBeNull();
    expect(nb.research.questions).toEqual([]);
  });
  it('pickup ≠ read: owning the register (drawer open, in the bag) reveals nothing', () => {
    const s = freshSliceState(1);
    s.flags.drawerLockSolved = true; s.open['hall.drawer'] = true;
    pickup(s, 'pk.ledger', 'ledger'); syncDerived(s);
    expect(registerTopics(s)).toBeNull();
    expect(observed(s, 'c.ledger')).toBe(false);
    expect(events(s, 'RewardClaimed').map((e) => e.id)).toContain('drawer.register');
    expect(events(s, 'RegisterObserved')).toHaveLength(0);
    expect(setAttention(s, 'kantlijn')).toBe(false); // nothing to choose yet
  });
  it('reading the register shows exactly the three topics it names, verbatim', () => {
    const s = freshSliceState(1);
    expect(observeRegister(s, 'hall')).toBe(false); // not owned
    pickup(s, 'pk.ledger', 'ledger');
    expect(observeRegister(s, 'hall')).toBe(true);
    const topics = notebookView(s).research.topics!;
    expect(topics.map((t) => t.id)).toEqual(['tafel', 'kantlijn', 'paden']);
    for (const t of topics) expect(REGISTER_TEXT).toContain(t.line);
    // no actions, rooms-to-go-to or checklists beyond the register's own words
    for (const t of topics) expect(t.line).not.toMatch(/ga naar|plaats|leg |hang|zoek/i);
    expect(events(s, 'RegisterObserved')).toHaveLength(1);
    expect(observeRegister(s, 'hall')).toBe(false);
  });
  it('switching attention changes no world state, no eligibility, no hints', () => {
    const s = freshSliceState(1);
    pickup(s, 'pk.ledger', 'ledger'); observeRegister(s, 'hall'); encounter(s, 'b01');
    const before = world(s), hints = JSON.stringify(hintContexts(s));
    for (const t of ['tafel', 'kantlijn', 'paden', null] as const) {
      setAttention(s, t);
      expect(world(s)).toEqual(before);
      expect(JSON.stringify(hintContexts(s))).toBe(hints);
    }
    expect(setAttention(s, 'nope' as never)).toBe(false);
  });
  it('the HUD attention label is the player\'s own opt-in, off by default, and changes nothing else', () => {
    const s = freshSliceState(1);
    pickup(s, 'pk.ledger', 'ledger'); observeRegister(s, 'hall'); setAttention(s, 'tafel');
    expect(s.slice!.hudAttention).toBe(false);
    expect(notebookView(s).research.hud).toBe(false);
    const before = world(s);
    expect(setHudAttention(s, true)).toBe(true);
    expect(world(s)).toEqual(before);
    expect(reload(s).slice!.hudAttention).toBe(true);
  });
  it('own questions are only made by the player; archiving never solves or understands anything', () => {
    const s = freshSliceState(1);
    recordObservation(s, SRC.dsNote, 'hall');
    expect(saveQuestion(s, '   ', [])).toBeNull();
    togglePin(s, SRC.dsNote);
    const q = saveQuestion(s, 'Waar is de foto?', s.slice!.pins)!;
    expect(q.pins).toEqual([SRC.dsNote]);
    const before = world(s);
    expect(setArchived(s, q.id, true)).toBe(true);
    expect(setArchived(s, SRC.dsNote, true)).toBe(true);
    expect(world(s)).toEqual(before);
    expect(b01Solved(s)).toBe(false);
    const nb = notebookView(s);
    expect(nb.archive.questions.map((x) => x.id)).toEqual([q.id]);
    expect(nb.observations.some((o) => o.id === SRC.dsNote)).toBe(false);
    expect(nb.archive.observations.map((o) => o.id)).toEqual([SRC.dsNote]);
    // solved ≠ archived
    fillB01(s, B01_SLOTS.map((k) => B01_ANSWER[k]));
    expect(notebookView(s).archive.questions.map((x) => x.id)).toEqual([q.id]);
  });
  it('observations keep raw text and provenance, no relevance score or solution summary', () => {
    const s = freshSliceState(1);
    recordObservation(s, SRC.folio('travel'), 'library');
    recordObservation(s, SRC.pair('reizen'), 'reis');
    const nb = notebookView(s);
    const cluster = nb.observations[0];
    expect(cluster.provenance).toBe('Boven · waarneming 3');
    expect(nb.observations[1].provenance).toBe('Begane grond · waarneming 2');
    expect(nb.observations[1].text).toContain(FOLIO_DETAILS.travel);
    for (const o of nb.observations) expect(Object.keys(o).sort()).toEqual(['archived', 'art', 'back', 'diagram', 'id', 'pinned', 'provenance', 'seq', 'text', 'title']);
    expect(nb.observations.map((o) => o.text).join(' ')).not.toMatch(/vierkant vak|→/);
  });
});

describe('DEV-01 hints: encountered riddles only, levels 0–3', () => {
  it('nothing before the riddle is met; level 0 names the riddle only; 1 attention, 2 relation, 3 solution', () => {
    const s = freshSliceState(1);
    expect(hintContexts(s).map((h) => h.id)).toEqual([]);
    expect(revealHint(s, 'b01')).toBe(0);
    encounter(s, 'b01');
    const h = hintContexts(s).find((x) => x.id === 'b01')!;
    expect(h.shown).toBe(0);
    expect(h.context).not.toMatch(/rond|punt|vierkant|kamer|boven|clip/i);
    // PD v0.2 §4.2, literal
    expect(SLICE_HINTS.b01.levels).toEqual([
      'Zoek boven de objectgroepen uit de tekeningen.',
      'Vergelijk beide details; de clip aan de juiste groep bepaalt het vak.',
      'Telescoopfolio rond, varenfolio puntig, kofferfolio vierkant.',
    ]);
    expect(HINT_LEVEL_NAMES).toEqual(['Aandacht', 'Relatie', 'Oplossing']);
    expect([revealHint(s, 'b01'), revealHint(s, 'b01'), revealHint(s, 'b01'), revealHint(s, 'b01')]).toEqual([1, 2, 3, 3]);
    expect(reload(s).slice!.hints.b01).toBe(3);
    fillB01(s, B01_SLOTS.map((k) => B01_ANSWER[k]));
    expect(hintContexts(s).some((x) => x.id === 'b01')).toBe(false);
  });
  it('the drawer hint appears once its lock was met, never because of the room it is in', () => {
    const s = freshSliceState(1);
    recordObservation(s, 'c.mantel', 'living');
    expect(hintContexts(s).some((h) => h.id === 'drawer')).toBe(false);
    encounter(s, 'drawer');
    expect(hintContexts(s).some((h) => h.id === 'drawer')).toBe(true);
  });
  it('DS01 hints: only after one of its sources was seen, titled by what was seen; literal PD §6.6 levels; stay available', () => {
    const s = freshSliceState(1);
    expect(hintContexts(s).some((h) => h.id === 'ds01')).toBe(false);
    recordObservation(s, SRC.dsNote, 'hall');
    expect(hintContexts(s).find((h) => h.id === 'ds01')!.title).toBe('De afbeelding van het eerste huisje');
    recordObservation(s, SRC.dsAlbum, 'library');
    expect(hintContexts(s).find((h) => h.id === 'ds01')!.title).toBe('De lege fotohoek in het album');
    const c = freshSliceState(1);
    ds01Front(c, 'reis'); // C first
    const h = hintContexts(c).find((x) => x.id === 'ds01')!;
    expect(h.title).toBe('Waar hoort deze afbeelding bij?');
    expect(h.levels[0]).toBe('Kijk naar de titel en herkomst van de afbeelding. Het album en de maquette vertellen iets over hetzelfde huisje.');
    expect(h.levels[2]).toMatch(/^De afbeelding hangt aan het droogrek bij het raam in de kamer met koffers\./);
    expect([revealHint(c, 'ds01'), revealHint(c, 'ds01'), revealHint(c, 'ds01')]).toEqual([1, 2, 3]);
    expect(hintContexts(c).some((x) => x.id === 'ds01')).toBe(true);
    expect(c.slice!.results.filter((r) => r === 'ds01.memory')).toHaveLength(1); // hints give no reward
  });
  it('hints are never stored as observations', () => {
    const s = freshSliceState(1);
    encounter(s, 'b01'); revealHint(s, 'b01'); revealHint(s, 'b01'); revealHint(s, 'b01');
    expect(notebookView(s).observations.map((o) => o.id)).toEqual(['c.invitation']);
  });
});

describe('DEV-01 old-save compatibility (catalogSolved → B01 alias)', () => {
  const v4 = (extra: Record<string, unknown>) => JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true, drawerLockSolved: true }, clues: ['c.invitation', 'c.mantel', 'c.ledger', 'c.libraryPlan', 'c.guestbookTabs', 'c.catalogDesk'], ...extra });
  it('solved catalogue with the key in the bag: study access kept, no replay, nothing written back', () => {
    const text = v4({ inventory: ['invitation', 'notebook', 'ledger', 'studyKey'], flags: { leftHome: true, drawerLockSolved: true, catalogSolved: true }, taken: ['pk.ledger', 'pk.studyKey'], unlocked: ['lock.hallDrawer', 'lock.libraryDesk'], open: { 'library.desk': true }, track: 'B' });
    const copy = String(text);
    const s = importMainSave(text)!;
    expect(text).toBe(copy);
    expect(b01Solved(s)).toBe(true);
    expect(s.slice!.b01.legacy).toBe('catalogSolved');
    expect(s.inventory).toContain('studyKey');
    expect(s.slice!.results).toEqual(expect.arrayContaining(['b01.solved', 'b01.studyKey', 'drawer.solved', 'drawer.register']));
    expect(s.slice!.registerObserved).toBe(true); // iteration 3 opened the register on pickup
    expect(s.slice!.attention).toBe('kantlijn');
    expect(s.slice!.legacyClues).toEqual(['c.libraryPlan', 'c.guestbookTabs', 'c.catalogDesk']);
    expect(notebookView(s).observations.map((o) => o.id)).not.toContain('c.libraryPlan');
    expect(reload(s).slice!.b01.legacy).toBe('catalogSolved');
  });
  it('solved catalogue but key still in the drawer: drawer open, key claimable, not yet claimed', () => {
    const s = importMainSave(v4({ flags: { leftHome: true, drawerLockSolved: true, catalogSolved: true }, unlocked: ['lock.libraryDesk'], open: { 'library.desk': true } }))!;
    expect(b01Solved(s)).toBe(true);
    expect(s.open['library.desk']).toBe(true);
    expect(s.taken).not.toContain('pk.studyKey');
    expect(s.slice!.results).not.toContain('b01.studyKey');
  });
  it('unsolved catalogue placements are dropped without penalty; register not read stays unread', () => {
    const s = importMainSave(v4({ inventory: ['invitation', 'notebook', 'ledger'], clues: ['c.invitation'], slots: { 'cat.punt': 'ster', 'cat.rond': 'varen' } }))!;
    expect(Object.keys(s.slots).filter((k) => k.startsWith('cat.'))).toEqual([]);
    expect(b01Solved(s)).toBe(false);
    expect(s.slice!.b01.wrong).toBe(0);
    expect(s.slice!.registerObserved).toBe(false);
  });
  it('an iteration-2 (v3) save migrates through the normal chain first', () => {
    const s = importMainSave(JSON.stringify({ version: 3, scene: 'estate', inventory: ['torch'], flags: { drawerLockSolved: true } }))!;
    expect(s.version).toBe(4);
    expect(s.slice!.schema).toBe(3);
    expect(importMainSave('{nope')).toBeNull();
  });
});

describe('DEV-01R canon: B01 chain and folio concept', () => {
  it('canon ids EB.folio.stars/plants/travel map to round/pointed/square', () => {
    expect(B01_FOLIOS.map((f) => SRC.folio(f))).toEqual(['EB.folio.stars', 'EB.folio.plants', 'EB.folio.travel']);
    expect(B01_ANSWER).toEqual({ rond: 'stars', punt: 'plants', vierkant: 'travel' });
  });
  it('sheets and clusters transcribe the PD v0.2 §4.2 details literally; each cluster carries its attached clip', () => {
    expect(FOLIO_DETAILS).toEqual({
      stars: 'telescoop op vorkvoet met twee ronde schroefkoppen; gesloten schrift met drie gaten naast elkaar',
      plants: 'geperste varen onder glas met één brede diagonale reparatiestrook; schaar met één hoekige en één ronde greep',
      travel: 'koffer met twee parallelle riemen en vierkante middenpatch; label met afgesneden rechterbovenhoek',
    });
    for (const f of B01_FOLIOS) expect(SOURCES[SRC.folio(f)].text).toContain(FOLIO_DETAILS[f]);
    expect(SOURCES[SRC.pair('sterren')].text).toMatch(/telescoop op vorkvoet met twee ronde schroefkoppen.*gesloten schrift met drie gaten naast elkaar.*Aan het schrift zit .*clip.*rond/s);
    expect(SOURCES[SRC.pair('planten')].text).toMatch(/geperste varen onder glas met één brede diagonale reparatiestrook.*schaar met één hoekige en één ronde greep.*Aan de glasplaat zit .*clip.*puntig/s);
    expect(SOURCES[SRC.pair('reizen')].text).toMatch(/koffer met twee parallelle riemen en een vierkante middenpatch.*label met afgesneden rechterbovenhoek.*Door het gat van het label zit .*clip.*vierkant/s);
    expect([SRC.pair('sterren'), SRC.pair('planten'), SRC.pair('reizen')]).toEqual(['EB.stars', 'EB.plants', 'EB.travel']); // LEVEL_LAYOUT evidence ids
    for (const s of ['sterren', 'planten', 'reizen'] as const) expect(pairView(s)).toContain('<svg');
    for (const s of ['sterren', 'planten', 'reizen'] as const) expect(SOURCES[SRC.pair(s)].text).not.toMatch(/tekenblad|folio|→|dus /i); // raw, no "so this sheet goes there"
  });
  it('literal table instruction; a local practice card that is not a fourth slot', () => {
    expect(B01_INSTRUCTION).toBe('Deze losse tekenbladen horen bij drie objectgroepen boven. Vergelijk beide getekende details met hun originelen. De archiefclip aan de passende groep heeft de vorm van het juiste vak. Een losse overeenkomst is niet genoeg.');
    expect(TABLE_TEXT).toContain(`“${B01_INSTRUCTION}”`);
    expect(PRACTICE_TEXT).toMatch(/sleutel met drie tanden/); expect(PRACTICE_TEXT).toMatch(/gestreepte koordlus/); expect(PRACTICE_TEXT).toMatch(/golf/);
    expect(SOURCES[SRC.practice].art!()).toContain('<svg');
    expect(practiceCard()).toContain('<svg');
    expect(B01_SLOTS).toEqual(['punt', 'rond', 'vierkant']); // no wave slot
    const s = freshSliceState(1);
    recordObservation(s, SRC.practice, 'library');
    fillB01(s, B01_SLOTS.map((k) => B01_ANSWER[k]));
    expect(b01Solved(s)).toBe(true); // the practice card neither gates nor counts
  });
  it('a folio is a loose drawing sheet: no folder ("map") wording anywhere the player reads B01', () => {
    const b01 = [TABLE_TEXT, ...B01_FOLIOS.map((f) => SOURCES[SRC.folio(f)].title + SOURCES[SRC.folio(f)].text), ...SLICE_HINTS.b01.levels, SLICE_HINTS.b01.context].join(' ');
    expect(b01).not.toMatch(/\bmap(pen|je)?\b|folder|werkmap/i);
    expect(b01).toMatch(/tekenblad/);
  });
  it('DEV-01 review saves (schema 1, folio ids I/II/III) migrate to the canon ids', () => {
    const p = parseSlice({ schema: 1, b01: { slots: { punt: 'III', rond: 'I', vierkant: null } }, obs: { 's.b01.folio.II': { seq: 3, room: 'library', faces: ['front'] } }, pins: ['s.b01.folio.II'], archivedObs: ['s.b01.folio.I'], questions: [{ id: 'q9', text: 'x', pins: ['s.b01.folio.III'] }] })!;
    expect(p.schema).toBe(3); // schema 1 → 2 → 3 in one parse
    expect(p.b01.slots).toEqual({ punt: 'plants', rond: 'stars', vierkant: null });
    expect(Object.keys(p.obs)).toEqual(['EB.folio.travel']);
    expect(p.obs['EB.folio.travel'].id).toBe('EB.folio.travel');
    expect(p.pins).toEqual(['EB.folio.travel']);
    expect(p.archivedObs).toEqual(['EB.folio.stars']);
    expect(p.questions[0].pins).toEqual(['EB.folio.plants']);
    expect(parseSlice({ schema: 2, b01: { slots: { punt: 'I' } } })!.b01.slots.punt).toBeNull(); // no legacy ids in schema 2
  });
  it('schema ≤ 2 source ids migrate to the canon ids (cluster incl. clip, OA/OB/OC.ds01); merged records keep the earliest seq and all faces', () => {
    const p = parseSlice({
      schema: 2,
      obs: {
        's.b01.pair.sterren': { seq: 5, room: 'sterren', faces: ['front'] }, 's.b01.clip.sterren': { seq: 4, room: 'sterren', faces: ['front'] },
        's.ds01.album': { seq: 7, room: 'library', faces: ['front'] }, 's.ds01.letter': { seq: 8, room: 'library', faces: ['front'] },
        's.ds01.note': { seq: 2, room: 'hall', faces: ['front'] }, 's.ds01.photo': { seq: 9, room: 'reis', faces: ['front', 'back'] },
      },
      pins: ['s.ds01.letter', 's.ds01.album'], ds01: { photoFound: true, photoBackSeen: true },
    })!;
    expect(p.schema).toBe(3);
    expect(Object.keys(p.obs).sort()).toEqual(['EB.stars', 'OA.ds01', 'OB.ds01', 'OC.ds01']);
    expect(p.obs['EB.stars'].seq).toBe(4);
    expect(p.obs['OC.ds01'].faces).toEqual(['front', 'back']);
    expect(p.pins).toEqual(['OB.ds01']);
    expect(p.hudAttention).toBe(false);
    expect(parseSlice({ schema: 3, obs: { 's.ds01.note': { seq: 1 } } })!.obs['s.ds01.note']).toBeDefined(); // no re-mapping in schema 3
  });
  it('DS01 texts are the literal PD v0.2 §6.2 texts', () => {
    expect(SOURCES[SRC.dsNote].text).toBe('“De afbeelding van het eerste huisje zit in het album Weekendhuizen, op de leesplank beneden. De maquette staat alvast hier. — G.M.”');
    expect(SOURCES[SRC.dsAlbum].text).toContain('“Gingerbread house — het eerste huisje”');
    expect(SOURCES[SRC.dsAlbum].text).toContain('“Er kwam water op de foto. Om hem te laten drogen hangt hij nu boven bij het raam, naast de koffers en het kleine droogrek. Het album laat ik hier. — G.M.”');
    expect(SOURCES[SRC.dsPhoto].text).toBe('Een licht gegolfde afbeelding hangt met twee houten wasknijpers aan een klein rek bij het raam. Onderaan staat: Gingerbread house — het eerste huisje.');
    expect(DS01_FOUND_NOTICE).toBe('Afbeelding bewaard in notities');
    expect(DS01_MEMORY.title).toBe('De foto die moest drogen');
    expect(photoFront()).toContain('Gingerbread house — het eerste huisje');
    const all = [SRC.dsNote, SRC.dsAlbum, SRC.dsPhoto].map((id) => SOURCES[id].text + (SOURCES[id].back?.text ?? '')).join(' ');
    expect(all).not.toMatch(/\bthee\b|— J\.|huisje aan het water|\bclip\b|\bvak\b/i); // nothing left of the provisional DEV-01 texts, no B01 language
  });
});

describe('DEV-01 content and events', () => {
  it('content is canon; folio art carries no subject word, emblem or room name', () => {
    expect(CONTENT_STATUS).toMatch(/canon/); expect(CONTENT_STATUS).not.toMatch(/provisional/);
    expect(Object.values(SOURCES).every((d) => d.status === 'canon')).toBe(true);
    for (const f of B01_FOLIOS) {
      // the drawings carry only a numeral and colour notes; the description names what is drawn, never a room
      expect(folioPage(f)).not.toMatch(/<text|ster|plant|reis|kamer|botan|telescoop|koffer/i); // sketches only, no words
      expect(SOURCES[SRC.folio(f)].text).not.toMatch(/kamer|botan|\bboven\b|sterren|reizen|planten/i); // drawn objects only, never a room or subject
    }
  });
  it('the six semantic event types are distinct and emitted by the matching actions only', () => {
    expect(new Set(SEMANTIC_EVENTS).size).toBe(6);
    const s = freshSliceState(1);
    encounter(s, 'b01');
    expect(events(s, 'ObservationRecorded').map((e) => e.id)).toEqual(['c.invitation']);
    expect(events(s, 'Encountered').map((e) => e.id)).toEqual(['b01']);
    expect(events(s, 'PuzzleSolved')).toEqual([]);
  });
});

void REGISTER_TOPICS;

describe('DEV-01 placement contract (as-built slice layout)', async () => {
  const P = await import('../src/slice/placement');
  it('no slice prop violates a keepout (rooms/walls, doors and swings, windows, stair, route, evidence poses)', () => {
    expect(P.validatePlacement()).toEqual([]);
  });
  it('the validator catches props through a window, in a door swing, on the stair and on a pose', () => {
    const bad = [
      { ...P.prop('ds01.rack'), id: 'x.window', z: 80.45 }, // pushed into the window slab
      { ...P.prop('b01.botanicTable'), id: 'x.swing', x: 104.5, z: 95.4 }, // in the botanic door's swing
      { ...P.prop('ds01.maquetteTable'), id: 'x.stair', x: 93.9, z: 90 }, // on the grand stair
      { ...P.prop('b01.sterrenTable'), id: 'x.pose', z: 92.6 }, // on its own reading pose
    ];
    const v = P.validatePlacement(bad);
    for (const [id, rule] of [['x.window', 'window'], ['x.swing', 'opening'], ['x.stair', 'stair'], ['x.pose', 'pose']]) expect(v.some((x) => x.prop === id && x.rule === rule)).toBe(true);
  });
  it('every interactable part has a reading pose; DS01 stands apart from B01', () => {
    const parts = P.PROPS.flatMap((p) => (p.parts ?? []).map((x) => x.id));
    for (const id of parts) expect(P.POSES.some((q) => q.target === id)).toBe(true);
    expect(Math.hypot(P.prop('ds01.sideTable').x - P.prop('b01.tableTop').x, P.prop('ds01.sideTable').z - P.prop('b01.tableTop').z)).toBeGreaterThan(5);
    expect(Math.hypot(P.prop('ds01.rack').x - P.prop('b01.reisDesk').x, P.prop('ds01.rack').z - P.prop('b01.reisDesk').z)).toBeGreaterThan(4);
  });
});
