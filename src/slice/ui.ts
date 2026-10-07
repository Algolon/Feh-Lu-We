// DEV-01 player UI: source overlays (with the photo's back), the three-part notebook (Waarnemingen · Mijn onderzoek
// · Archief), the B01 table panel, the hall drawer panel, level 0–3 hints and the return context between panels and
// the notebook. One overlay at a time (the shared UI modal); every control ≥ 48 px; overlays block world input.
import type { Game } from '../core/game';
import { addClue, has } from '../core/state';
import { CLUES } from '../content/clues';
import { SYMBOLS, symbolSvg } from '../content/symbols';
import { LOCK_OPTIONS, submitCode, type Outcome } from '../puzzles/rules';
import { DIAGRAMS } from '../ui/diagrams';
import {
  sl, sourceDef, isMemory, recordObservation, observed, encounter, observeRegister, setAttention, setHudAttention, b01Place, b01Take, b01Check, b01Loose, b01Slots, b01Solved,
  ds01Front, ds01Back, togglePin, saveQuestion, setArchived, hintContexts, revealHint, notebookView, type NbSource,
} from './model';
import { ALIAS_OF, B01_SLOTS, SRC, type FolioId, type SlotId, type TopicId } from './ids';
import { REGISTER_TOPICS, HINT_LEVEL_NAMES, TABLE_TEXT, FOLIO_TITLE, DS01_FOUND_NOTICE } from './content';
import * as D from './drawings';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const $ = <T extends HTMLElement>(sel: string, root: ParentNode) => root.querySelector(sel) as T;

/** Where the notebook returns to: the parent panel with its draft, scroll position and focused control. */
export interface ReturnCtx { panel: 'b01' | 'drawer'; title: string; draft: unknown; scroll: number; focus: string | null }
interface B01Draft { sel: FolioId | null; view: FolioId | 'practice' | null; msg: string }
interface DrawerDraft { vals: number[] }
interface NbDraft { tab: 'w' | 'o' | 'a'; text: string; pins: string[]; scroll: number }

export class SliceUI {
  private nbDraft: NbDraft = { tab: 'w', text: '', pins: [], scroll: 0 };
  constructor(private g: Game) {}
  private get s() { return this.g.state; }
  private get ui() { return this.g.ui; }
  /** Room id under the player (provenance of observations). */
  room(): string {
    const p = this.g.player;
    return this.g.extras.rooms?.roomAt(p.x, p.y + 0.8, p.z) ?? (this.s.scene === 'home' ? 'home' : 'out');
  }
  private commit() { this.g.changed(); }

  // ---------------------------------------------------------------------------------------------- sources
  /** Show a source and record it as an observation (DEV-01: only an overlay that was actually shown counts). */
  inspect(id: string) {
    if (id === SRC.dsPhoto) return this.photo('front');
    if (isMemory(id)) {
      const rec = addClue(this.s, id);
      this.ui.showClue(id, false);
      if (rec) { this.commit(); this.ui.toast('Bewaard bij je herinneringen (Archief).'); }
      return;
    }
    const isNew = recordObservation(this.s, id, this.room());
    this.sourceOverlay(id, isNew);
    if (isNew) this.commit();
  }
  private artHtml(id: string, art?: () => string) {
    if (art) return `<div class="zoombox" data-zoom><div class="zoomin">${art()}</div></div><div class="row center"><button class="btn small" data-zoombtn data-fk="zoom">Vergroten</button></div>`;
    const c = CLUES[id];
    let syms = '';
    if (c?.symbols?.length) syms = `<div class="syms">${c.symbols.map((x) => `<div class="s">${symbolSvg(x, 44)}<span>${SYMBOLS[x].name}</span></div>`).join('')}</div>`;
    return syms + (c?.diagram ? DIAGRAMS[c.diagram]() : '');
  }
  private wireZoom(body: HTMLElement) {
    body.querySelectorAll<HTMLButtonElement>('[data-zoombtn]').forEach((b) => b.addEventListener('click', () => {
      const box = b.closest('.body')!.querySelector('[data-zoom]') ?? b.parentElement!.previousElementSibling;
      const on = box?.classList.toggle('zoomed') ?? false;
      b.textContent = on ? 'Verkleinen' : 'Vergroten';
    }));
  }
  private sourceOverlay(id: string, isNew: boolean) {
    const d = sourceDef(id)!;
    const body = this.ui.modal(d.title, `<p class="kind kind-obs">Waargenomen</p>${this.artHtml(id, d.art)}<p>${esc(d.text)}</p>` +
      (isNew ? '<p class="muted">✎ Bewaard bij Waarnemingen in je notitieboek.</p>' : '') +
      '<div class="row center"><button class="btn primary" data-ok>Verder</button></div>');
    this.wireZoom(body);
    $('[data-ok]', body).addEventListener('click', () => this.ui.closeModal());
  }
  /** DS01 C: the photo on the rack. Not an item; turning it over is a separate, deliberate act. */
  photo(face: 'front' | 'back') {
    const room = this.room();
    const d = sourceDef(SRC.dsPhoto)!;
    let changed = false, first = false;
    if (face === 'front') {
      const before = observed(this.s, SRC.dsPhoto);
      first = ds01Front(this.s, room).first;
      changed = !before;
    } else {
      changed = !observed(this.s, SRC.dsPhoto, 'back');
      ds01Back(this.s, room);
    }
    const shown = face === 'front' ? { title: d.title, text: d.text, art: d.art } : d.back!;
    const body = this.ui.modal(shown.title, `<p class="kind kind-obs">Waargenomen</p>${this.artHtml(SRC.dsPhoto, shown.art)}<p>${esc(shown.text)}</p>` +
      // PD v0.2 §6.4: the first look at the front gives one quiet notice; no chime, no "all connected" pop-up
      (first ? `<p class="muted" data-found>✎ ${esc(DS01_FOUND_NOTICE)}</p>` : changed ? '<p class="muted">✎ Bewaard bij Waarnemingen in je notitieboek.</p>' : '') +
      `<p class="muted">De afbeelding blijft aan het rek hangen.</p><div class="row center"><button class="btn" data-flip data-fk="flip">${face === 'front' ? 'Omkeren' : 'Voorzijde bekijken'}</button><button class="btn primary" data-ok>Verder</button></div>`);
    this.wireZoom(body);
    $('[data-flip]', body).addEventListener('click', () => this.photo(face === 'front' ? 'back' : 'front'));
    $('[data-ok]', body).addEventListener('click', () => this.ui.closeModal());
    if (changed) this.commit();
    queueMicrotask(() => (body.querySelector('[data-fk="flip"]') as HTMLElement | null)?.focus({ preventScroll: true }));
  }
  /** Reading from the bag. The register is the only source that reveals the three topics, and only when read. */
  readItem(item: string) {
    if (item === 'ledger') {
      const first = observeRegister(this.s, this.room());
      this.sourceOverlay('c.ledger', first);
      if (first) this.commit();
      return;
    }
    const c = { invitation: 'c.invitation', journal: 'c.journal', cipherStrip: 'c.letterstrook' }[item];
    if (c) this.inspect(c);
  }

  // ---------------------------------------------------------------------------------------------- return context
  private capture(panel: ReturnCtx['panel'], title: string, draft: unknown): ReturnCtx {
    const body = this.ui.overlay.querySelector('.body') as HTMLElement | null;
    const fk = (document.activeElement as HTMLElement | null)?.dataset?.fk ?? null;
    return { panel, title, draft, scroll: body?.scrollTop ?? 0, focus: fk };
  }
  private restore(ctx: ReturnCtx) {
    if (ctx.panel === 'b01') this.b01Panel(ctx.draft as B01Draft); else this.drawerPanel(ctx.draft as DrawerDraft);
    const body = this.ui.overlay.querySelector('.body') as HTMLElement | null;
    if (body) body.scrollTop = ctx.scroll;
    if (ctx.focus) queueMicrotask(() => (this.ui.overlay.querySelector(`[data-fk="${ctx.focus}"]`) as HTMLElement | null)?.focus({ preventScroll: true }));
  }

  // ---------------------------------------------------------------------------------------------- B01 table panel
  b01Panel(draft: B01Draft = { sel: null, view: null, msg: '' }) {
    const s = this.s;
    encounter(s, 'b01');
    if (recordObservation(s, SRC.table, this.room())) this.commit();
    if (draft.view === 'practice') return this.practiceView(draft);
    if (draft.view) return this.folioView(draft);
    const solved = b01Solved(s);
    const slots = b01Slots(s), loose = b01Loose(s);
    if (draft.sel && !loose.includes(draft.sel)) draft.sel = null;
    // a folio is a loose drawing sheet: its thumbnail IS the sheet with its two sketches
    const cover = (f: FolioId, w = 96) => `<span class="folio-thumb">${D.folioPage(f).replace('width="320"', `width="${w}"`)}</span>`;
    const name = (f: FolioId) => `tekenblad met ${FOLIO_TITLE[f]}`;
    const body = this.ui.modal('Leestafel', `
      <p class="kind kind-obs">Waargenomen</p><p class="muted">${esc(TABLE_TEXT.split('\n\n')[1] ?? '')}</p>
      <div class="b01-slots">${B01_SLOTS.map((k) => `<div class="pslot"><div class="pslot-label">${D.slotMark(k).replace('width="160"', 'width="56"')}<span>${esc(D.SHAPE_NAME[k])} vak</span></div>` +
        (slots[k] ? `<button class="btn piece" data-take="${k}" data-fk="take-${k}" ${solved ? 'disabled' : ''} aria-label="${esc(name(slots[k]!))} terugpakken uit het ${D.SHAPE_NAME[k]}e vak">${cover(slots[k]!, 72)}<span class="muted">${solved ? 'ligt vast' : 'terugpakken'}</span></button>`
          : `<button class="btn slot-empty" data-slot="${k}" data-fk="slot-${k}" ${draft.sel && !solved ? '' : 'disabled'} aria-label="Leg ${esc(draft.sel ? name(draft.sel) : 'een tekenblad')} in het ${D.SHAPE_NAME[k]}e vak">${draft.sel ? 'Tekenblad hier leggen' : 'leeg'}</button>`) + '</div>').join('')}</div>
      ${solved ? '<p><b>De lade van de leestafel staat open.</b></p>' : loose.length ? `<p class="muted">Kies een tekenblad, of bekijk het van dichtbij:</p><div class="b01-folios">${loose.map((f) => `<div class="folio-card ${draft.sel === f ? 'sel' : ''}">
          <button class="btn piece ${draft.sel === f ? 'sel' : ''}" data-pick="${f}" data-fk="pick-${f}" aria-pressed="${draft.sel === f}" aria-label="${esc(name(f))}">${cover(f)}</button>
          <button class="btn small" data-view="${f}" data-fk="view-${f}">Bekijken</button></div>`).join('')}</div>` : '<p class="muted">Alle tekenbladen liggen in een vak. Klopt het niet, pak er dan een terug.</p>'}
      <div class="row center"><button class="btn small" data-practice data-fk="practice">Oefenkaart bekijken</button></div>
      <p class="feedback" aria-live="polite">${esc(draft.msg)}</p>
      <div class="row center">${solved ? '' : `<button class="btn primary" data-check data-fk="check">Controleer</button>`}<button class="btn" data-notes data-fk="notes">Notities</button><button class="btn" data-ok>Klaar</button></div>`);
    body.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => b.addEventListener('click', () => { draft.sel = b.dataset.pick as FolioId; draft.msg = ''; this.b01Panel(draft); this.refocus(`pick-${draft.sel}`); }));
    body.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) => b.addEventListener('click', () => { draft.view = b.dataset.view as FolioId; this.b01Panel(draft); }));
    body.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach((b) => b.addEventListener('click', () => {
      if (!draft.sel) return;
      const r = b01Place(s, b.dataset.slot as SlotId, draft.sel);
      this.outcome(r);
      draft.sel = null;
      draft.msg = r.ok ? '' : r.msg;
      this.b01Panel(draft);
      this.refocus('check');
    }));
    // "Controleer" judges the complete set (PD v0.2 §4.2); incomplete is no attempt
    body.querySelector('[data-check]')?.addEventListener('click', () => {
      const r = b01Check(s);
      this.outcome(r);
      if (b01Solved(s)) { this.ui.closeModal(); this.ui.toast(r.msg); return; }
      draft.msg = r.msg;
      this.b01Panel(draft);
      this.refocus('check');
    });
    $('[data-practice]', body).addEventListener('click', () => { draft.view = 'practice'; this.b01Panel(draft); });
    body.querySelectorAll<HTMLButtonElement>('[data-take]').forEach((b) => b.addEventListener('click', () => {
      const r = b01Take(s, b.dataset.take as SlotId);
      this.outcome(r);
      draft.msg = '';
      this.b01Panel(draft);
      this.refocus(`slot-${b.dataset.take}`);
    }));
    $('[data-notes]', body).addEventListener('click', () => this.notebook(this.capture('b01', 'de leestafel', { ...draft })));
    $('[data-ok]', body).addEventListener('click', () => this.ui.closeModal());
  }
  /** The local practice card (PD v0.2 §4.2): read as part of the table, never a slot or an input. */
  private practiceView(draft: B01Draft) {
    const isNew = recordObservation(this.s, SRC.practice, this.room());
    const d = sourceDef(SRC.practice)!;
    const body = this.ui.modal(`Leestafel · ${d.title}`, `<p class="kind kind-obs">Waargenomen</p>${this.artHtml(SRC.practice, d.art)}<p>${esc(d.text)}</p>` +
      (isNew ? '<p class="muted">✎ Bewaard bij Waarnemingen in je notitieboek.</p>' : '') +
      `<div class="row center"><button class="btn primary" data-back data-fk="back">Terug naar de tafel</button></div>`);
    this.wireZoom(body);
    $('[data-back]', body).addEventListener('click', () => { draft.view = null; this.b01Panel(draft); this.refocus('practice'); });
    if (isNew) this.commit();
  }
  private folioView(draft: B01Draft) {
    const f = draft.view as FolioId;
    const id = SRC.folio(f);
    const isNew = recordObservation(this.s, id, this.room());
    const d = sourceDef(id)!;
    const body = this.ui.modal(`Leestafel · ${d.title}`, `<p class="kind kind-obs">Waargenomen</p>${this.artHtml(id, d.art)}<p>${esc(d.text)}</p>` +
      (isNew ? '<p class="muted">✎ Bewaard bij Waarnemingen in je notitieboek.</p>' : '') +
      `<div class="row center"><button class="btn primary" data-back data-fk="back">Terug naar de tafel</button></div>`);
    this.wireZoom(body);
    $('[data-back]', body).addEventListener('click', () => { draft.view = null; this.b01Panel(draft); this.refocus(`view-${f}`); });
    if (isNew) this.commit();
  }
  private refocus(fk: string) { queueMicrotask(() => (this.ui.overlay.querySelector(`[data-fk="${fk}"]`) as HTMLElement | null)?.focus({ preventScroll: true })); }
  private outcome(r: Outcome) {
    if (r.sfx !== 'none') this.g.sfx(r.sfx);
    this.commit();
  }

  // ---------------------------------------------------------------------------------------------- hall drawer (with notes)
  drawerPanel(draft: DrawerDraft = { vals: [0, 0, 0] }) {
    const s = this.s;
    encounter(s, 'drawer');
    if (recordObservation(s, 'c.drawerLock', this.room())) this.commit();
    const opts = LOCK_OPTIONS.drawerLock;
    const body = this.ui.modal('Slot op de lade', `<p>Drie draaiwieltjes met tekeningetjes. Zet ze in de goede volgorde.</p><div class="dials"></div>
      <p class="feedback" aria-live="polite"></p>
      <div class="row center"><button class="btn" data-notes data-fk="notes">Notities</button><button class="btn primary" data-try data-fk="try">Proberen</button></div>`);
    const dials = $('.dials', body);
    const render = () => {
      dials.innerHTML = draft.vals.map((v, i) => `<div class="dial"><button class="btn" data-up="${i}" data-fk="up-${i}" aria-label="Wieltje ${i + 1} omhoog">▲</button><div class="face">${symbolSvg(opts[v], 48)}<span>${SYMBOLS[opts[v]].name}</span></div><button class="btn" data-down="${i}" data-fk="down-${i}" aria-label="Wieltje ${i + 1} omlaag">▼</button></div>`).join('');
      dials.querySelectorAll<HTMLButtonElement>('[data-up]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.up!; draft.vals[i] = (draft.vals[i] + opts.length - 1) % opts.length; render(); this.refocus(`up-${i}`); }));
      dials.querySelectorAll<HTMLButtonElement>('[data-down]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.down!; draft.vals[i] = (draft.vals[i] + 1) % opts.length; render(); this.refocus(`down-${i}`); }));
    };
    render();
    $('[data-try]', body).addEventListener('click', () => {
      const r = submitCode(s, 'drawerLock', draft.vals.map((v) => opts[v]));
      this.g.act(r);
      if (r.ok) this.ui.closeModal(); else $('.feedback', body).textContent = r.msg;
    });
    $('[data-notes]', body).addEventListener('click', () => this.notebook(this.capture('drawer', 'het slot', { vals: [...draft.vals] })));
  }

  // ---------------------------------------------------------------------------------------------- notebook
  notebook(from: ReturnCtx | null = null, tab?: NbDraft['tab']) {
    if (!has(this.s, 'notebook')) { this.ui.toast('Je hebt je notitieboek nog niet.'); return; }
    if (tab) this.nbDraft.tab = tab;
    const v = notebookView(this.s);
    const d = this.nbDraft;
    const back = from ? `<div class="row"><button class="btn primary" data-return data-fk="return">← Terug naar ${esc(from.title)}</button></div>` : '';
    const body = this.ui.modal('Notitieboek', `${back}<div class="tabs" role="tablist">
        <button class="btn" role="tab" data-t="w" data-fk="tab-w">Waarnemingen (${v.observations.length})</button>
        <button class="btn" role="tab" data-t="o" data-fk="tab-o">Mijn onderzoek</button>
        <button class="btn" role="tab" data-t="a" data-fk="tab-a">Archief</button>
        ${this.s.scene === 'estate' && !from ? '<button class="btn" data-map data-fk="map">Kaart</button>' : ''}</div><div id="nb"></div>`,
    (silent) => { d.scroll = 0; if (!silent && from) queueMicrotask(() => this.restore(from)); });
    const nb = $('#nb', body);
    const show = (t: NbDraft['tab']) => {
      d.tab = t;
      body.querySelectorAll<HTMLButtonElement>('[data-t]').forEach((x) => { x.classList.toggle('on', x.dataset.t === t); x.setAttribute('aria-selected', String(x.dataset.t === t)); });
      nb.innerHTML = t === 'w' ? this.obsTab(v.observations) : t === 'o' ? this.researchTab(v) : this.archiveTab(v);
      this.wireNotebook(nb, from);
    };
    body.querySelectorAll<HTMLButtonElement>('[data-t]').forEach((b) => b.addEventListener('click', () => show(b.dataset.t as NbDraft['tab'])));
    body.querySelector('[data-map]')?.addEventListener('click', () => this.g.openMap(() => this.notebook()));
    body.querySelector('[data-return]')?.addEventListener('click', () => this.ui.closeModal());
    show(d.tab);
    if (d.scroll) body.scrollTop = d.scroll;
    body.addEventListener('scroll', () => { d.scroll = body.scrollTop; }, { passive: true });
  }
  private card(o: NbSource, open = false, actions = true) {
    const art = o.art ? `<div class="zoombox" data-zoom><div class="zoomin">${o.art()}</div></div>` : o.diagram ? DIAGRAMS[o.diagram as keyof typeof DIAGRAMS]() : '';
    const back = o.back ? `<div class="face-back"><b>${esc(o.back.title)}</b>${o.back.art ? o.back.art() : ''}<p>${esc(o.back.text)}</p></div>` : '';
    return `<details class="clue nb-obs" data-obs="${o.id}" ${open ? 'open' : ''}><summary><h3>${esc(o.title)}</h3><span class="prov">${esc(o.provenance)}</span>${o.pinned ? '<span class="badge pin">📌 Door jou vastgezet</span>' : ''}</summary>
      <p class="kind kind-obs">Waargenomen</p>${art}<p>${esc(o.text)}</p>${back}
      ${actions ? `<div class="row"><button class="btn small" data-pin="${o.id}" data-fk="pin-${o.id}" aria-pressed="${o.pinned}">${o.pinned ? 'Losmaken' : 'Vastzetten'}</button><button class="btn small" data-arch="${o.id}" data-fk="arch-${o.id}">${o.archived ? 'Heropenen' : 'Opbergen'}</button></div>` : ''}</details>`;
  }
  private obsTab(list: NbSource[]) {
    if (!list.length) return '<p class="muted">Hier blijven de dingen die je bekijkt.</p>'; // UX v0.2 §2, literal
    return `<p class="muted">Letterlijk bewaard, nieuwste bovenaan. Zet vast wat je bij een eigen vraag wilt houden.</p>${list.map((o, i) => this.card(o, i === 0)).join('')}`;
  }
  private researchTab(v: ReturnType<typeof notebookView>) {
    const r = v.research, d = this.nbDraft;
    const topics = r.topics ? `<h4 class="grp">Uit het register</h4><div class="register">${r.topics.map((t) => `<div class="reg-topic"><b>${esc(t.title)}</b><p>“${esc(t.line)}”</p></div>`).join('')}</div>
      <p class="muted">Mijn aandacht (alleen voor jezelf; het verandert niets in het huis):</p>
      <div class="row attention">${REGISTER_TOPICS.map((t) => `<button class="btn small ${r.attention === t.id ? 'on' : ''}" data-att="${t.id}" data-fk="att-${t.id}" aria-pressed="${r.attention === t.id}">${esc(t.title)}</button>`).join('')}
        ${r.attention ? '<button class="btn small" data-att="" data-fk="att-none">Aandacht loslaten</button>' : ''}</div>
      ${r.attention ? `<div class="row"><button class="btn small ${r.hud ? 'on' : ''}" data-hud data-fk="hud" aria-pressed="${r.hud}">${r.hud ? 'Niet meer in beeld tonen' : 'Mijn aandacht in beeld tonen'}</button></div>` : ''}` : '';
    const pinsPick = r.pinned.length ? `<p class="muted">Door jou vastgezette waarnemingen bij deze vraag:</p><div class="pinpick">${r.pinned.map((o) => `<label class="set"><span>${esc(o.title)} <span class="prov">${esc(o.provenance)}</span></span><input type="checkbox" data-qpin="${o.id}" ${d.pins.includes(o.id) ? 'checked' : ''}></label>`).join('')}</div>` : '';
    const qs = r.questions.length ? r.questions.map((q) => `<div class="own"><p class="kind kind-own">Mijn idee</p><p>${esc(q.text || '(zonder tekst)')}</p>${q.pins.length ? `<p class="muted">Door jou vastgezet: ${q.pins.map((id) => esc(sourceDef(id)?.title ?? id)).join(' · ')}</p>` : ''}<button class="btn small" data-qarch="${q.id}" data-fk="qarch-${q.id}">Opbergen</button></div>`).join('') : '';
    const results = r.results.length ? `<h4 class="grp">Resultaten</h4>${r.results.map((x) => `<div class="result"><span class="kind kind-res">✓ Resultaat bevestigd</span> ${esc(x.text)}</div>`).join('')}` : '';
    return `${topics}<h4 class="grp">Eigen vragen en ideeën</h4>
      <textarea data-qtext data-fk="qtext" placeholder="Wat wil je uitzoeken? (alleen voor jezelf)">${esc(d.text)}</textarea>${pinsPick}
      <div class="row"><button class="btn" data-qsave data-fk="qsave">Bewaren</button></div>${qs}${results}`;
  }
  private archiveTab(v: ReturnType<typeof notebookView>) {
    const a = v.archive;
    // UX v0.2 §4.1: a viewed memory is labelled "Bekeken", never "Opgelost"
    const mem = a.memories.length ? a.memories.map((m) => `<div class="own mem"><p class="kind kind-mem">Herinnering · Bekeken</p><b>${esc(m.title)}</b>${m.art ? `<div class="zoombox" data-zoom><div class="zoomin">${m.art()}</div></div>` : ''}<p>${esc(m.text)}</p></div>`).join('') : '<p class="muted">Nog geen herinneringen.</p>';
    const qs = a.questions.map((q) => `<div class="own"><p class="kind kind-own">Mijn idee · Opgeborgen · door jou</p><p>${esc(q.text)}</p><button class="btn small" data-qunarch="${q.id}" data-fk="qun-${q.id}">Heropenen</button></div>`).join('');
    const obs = a.observations.map((o) => this.card(o)).join('');
    return `<h4 class="grp">Herinneringen</h4>${mem}${qs || obs ? `<h4 class="grp">Opgeborgen · door jou</h4>${qs}${obs}` : ''}`;
  }
  private wireNotebook(nb: HTMLElement, from: ReturnCtx | null) {
    const d = this.nbDraft;
    const again = (fk?: string) => { this.notebook(from); if (fk) this.refocus(fk); };
    this.wireZoomInline(nb);
    nb.querySelectorAll<HTMLButtonElement>('[data-pin]').forEach((b) => b.addEventListener('click', () => { togglePin(this.s, b.dataset.pin!); d.pins = d.pins.filter((p) => sl(this.s).pins.includes(p)); this.commit(); again(`pin-${b.dataset.pin}`); }));
    nb.querySelectorAll<HTMLButtonElement>('[data-arch]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.arch!; setArchived(this.s, id, !sl(this.s).archivedObs.includes(id)); this.commit(); again(); }));
    nb.querySelectorAll<HTMLButtonElement>('[data-att]').forEach((b) => b.addEventListener('click', () => { setAttention(this.s, (b.dataset.att || null) as TopicId | null); this.commit(); again(`att-${b.dataset.att || 'none'}`); }));
    nb.querySelector('[data-hud]')?.addEventListener('click', () => { setHudAttention(this.s, !sl(this.s).hudAttention); this.commit(); again('hud'); });
    const ta = nb.querySelector<HTMLTextAreaElement>('[data-qtext]');
    ta?.addEventListener('input', () => { d.text = ta.value; });
    nb.querySelectorAll<HTMLInputElement>('[data-qpin]').forEach((c) => c.addEventListener('change', () => { d.pins = c.checked ? [...new Set([...d.pins, c.dataset.qpin!])] : d.pins.filter((p) => p !== c.dataset.qpin); }));
    nb.querySelector('[data-qsave]')?.addEventListener('click', () => {
      if (saveQuestion(this.s, d.text, d.pins)) { d.text = ''; d.pins = []; this.commit(); again('qtext'); } else this.ui.toast('Schrijf eerst iets op, of kies een vastgepinde waarneming.');
    });
    nb.querySelectorAll<HTMLButtonElement>('[data-qarch]').forEach((b) => b.addEventListener('click', () => { setArchived(this.s, b.dataset.qarch!, true); this.commit(); again(); }));
    nb.querySelectorAll<HTMLButtonElement>('[data-qunarch]').forEach((b) => b.addEventListener('click', () => { setArchived(this.s, b.dataset.qunarch!, false); this.commit(); again(); }));
  }
  private wireZoomInline(root: HTMLElement) {
    root.querySelectorAll<HTMLElement>('[data-zoom]').forEach((z) => z.addEventListener('click', () => z.classList.toggle('zoomed')));
  }

  // ---------------------------------------------------------------------------------------------- hints
  hints(ctx?: string) {
    const list = hintContexts(this.s);
    if (!list.length) { this.ui.showText('Hint', 'Je bent nog geen raadsel tegengekomen waar een hint bij hoort. Kijk rond; hints gaan alleen over wat je al hebt gezien.'); return; }
    const h = list.find((x) => x.id === ctx) ?? list.find((x) => x.id === 'b01') ?? list[0];
    const body = this.ui.modal('Hint', '');
    const render = () => {
      const cur = hintContexts(this.s).find((x) => x.id === h.id) ?? h;
      body.innerHTML = (list.length > 1 ? `<div class="tabs" role="tablist" aria-label="Kies een raadsel">${list.map((c) => `<button class="btn ${c.id === h.id ? 'on' : ''}" role="tab" aria-selected="${c.id === h.id}" data-pick="${c.id}">${esc(c.title)}</button>`).join('')}</div>` : '') +
        `<div class="riddle"><span class="kind">Hulp bij</span> ${esc(cur.context)}</div>` +
        `<p class="muted">Drie niveaus, elk alleen als je erom vraagt: 1 ${HINT_LEVEL_NAMES[0]} · 2 ${HINT_LEVEL_NAMES[1]} · 3 ${HINT_LEVEL_NAMES[2]}.</p>` +
        cur.levels.slice(0, cur.shown).map((t, i) => `<div class="hint slice-hint"><span class="kind kind-hint">Hint ${i + 1} · ${HINT_LEVEL_NAMES[i]}</span><p>${esc(t)}</p></div>`).join('') +
        `<p class="muted">Hints zijn geen bewijs uit het huis en komen niet in je notitieboek.</p>` +
        `<div class="row center">${cur.shown < 3 ? `<button class="btn primary" data-more data-fk="more">Toon hint ${cur.shown + 1} (${HINT_LEVEL_NAMES[cur.shown].toLowerCase()})</button>` : ''}<button class="btn" data-ok>Terug</button></div>`;
      body.querySelector('[data-more]')?.addEventListener('click', () => { revealHint(this.s, h.id); this.g.saveSoon(); render(); this.refocus('more'); });
      body.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.pick !== h.id) this.hints(b.dataset.pick); }));
      $('[data-ok]', body).addEventListener('click', () => this.ui.closeModal());
    };
    render();
  }

  // ---------------------------------------------------------------------------------------------- HUD + debug
  /** HUD line: only the player's own attention, and only when they switched it on (UX v0.2 §3). Never a next step. */
  objectiveLine(): string {
    const x = this.s.slice;
    return x?.attention && x.hudAttention ? `Mijn aandacht: ${REGISTER_TOPICS.find((t) => t.id === x.attention)!.title}` : '';
  }
  debugInfo(target: string | null): string {
    const x = sl(this.s);
    const room = this.room();
    return `slice · room ${room}${ALIAS_OF[room] ? ` (${ALIAS_OF[room]})` : ''} · target ${target ?? '—'}<br>` +
      `b01 ${JSON.stringify(x.b01.slots)} solved=${x.b01.solved}${x.b01.legacy ? ' (alias ' + x.b01.legacy + ')' : ''} · register=${x.registerObserved} · aandacht=${x.attention ?? '—'}<br>` +
      `ds01 found=${x.ds01.photoFound} back=${x.ds01.photoBackSeen} · obs ${Object.keys(x.obs).length} · enc ${x.encountered.join(',') || '—'} · results ${x.results.join(',') || '—'}`;
  }
}
