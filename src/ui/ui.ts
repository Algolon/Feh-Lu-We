// HTML user interface: HUD, toasts, modal overlays and puzzle panels. No hover-only actions;
// every control is a ≥48px button. Overlays block world input while open.
import { ITEMS } from '../content/items';
import { CLUES, CLUE_GROUP, THREADS, type ClueDef } from '../content/clues';
import { symbolSvg, SYMBOLS } from '../content/symbols';
import { DIAGRAMS } from './diagrams';
import { icon, itemIcon } from './icons';
import type { Settings } from '../core/state';

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface HudHandlers {
  action: () => void;
  menu: () => void;
  bag: () => void;
  notebook: () => void;
  hint: () => void;
  deselect: () => void;
}

export class UI {
  readonly hud = $<HTMLDivElement>('#hud');
  readonly overlay = $<HTMLDivElement>('#overlay');
  readonly start = $<HTMLDivElement>('#start');
  private toastTimer = 0;
  private modalClose: ((silent?: boolean) => void) | null = null;
  onModalChange: (open: boolean) => void = () => {};
  actionBtn!: HTMLButtonElement;
  private reticle!: HTMLDivElement;
  private label!: HTMLDivElement;
  private toastEl!: HTMLDivElement;
  private objective!: HTMLDivElement;
  private checklist!: HTMLDivElement;
  private held!: HTMLButtonElement;
  private fade!: HTMLDivElement;
  private notebookBtn!: HTMLButtonElement;

  get modalOpen() {
    return !this.overlay.hidden;
  }

  buildHud(h: HudHandlers) {
    this.hud.innerHTML = `
      <div id="topbar-l">
        <button class="hud-btn" id="b-menu" aria-label="Pauze en instellingen">${icon('menu')}<span class="lbl">Pauze</span></button>
        <button class="hud-btn" id="b-hint" aria-label="Hint">${icon('hint')}<span class="lbl">Hint</span></button>
      </div>
      <div id="topbar-r">
        <button class="hud-btn" id="b-notes" aria-label="Notitieboek">${icon('notes')}<span class="lbl">Notities</span></button>
        <button class="hud-btn" id="b-bag" aria-label="Tas">${icon('bag')}<span class="lbl">Tas</span></button>
      </div>
      <div id="objective" aria-live="polite"></div>
      <div id="checklist" hidden></div>
      <div id="reticle"></div>
      <div id="target-label"></div>
      <button class="hud-btn" id="held" hidden aria-label="Gekozen voorwerp, tik om los te laten"></button>
      <button class="hud-btn" id="action" disabled aria-label="Actie">—</button>
      <div id="toast" role="status" aria-live="polite"></div>
      <div id="fade"></div>`;
    this.actionBtn = $('#action', this.hud);
    this.reticle = $('#reticle', this.hud);
    this.label = $('#target-label', this.hud);
    this.toastEl = $('#toast', this.hud);
    this.objective = $('#objective', this.hud);
    this.checklist = $('#checklist', this.hud);
    this.held = $('#held', this.hud);
    this.fade = $('#fade', this.hud);
    this.notebookBtn = $('#b-notes', this.hud);
    const tap = (el: HTMLElement, fn: () => void) => el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
    tap(this.actionBtn, h.action);
    tap($('#b-menu', this.hud), h.menu);
    tap($('#b-bag', this.hud), h.bag);
    tap(this.notebookBtn, h.notebook);
    tap($('#b-hint', this.hud), h.hint);
    tap(this.held, h.deselect);
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.closeModal();
    });
    // keep Tab inside the open dialog
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const els = [...this.overlay.querySelectorAll<HTMLElement>('button, input, textarea, select')].filter((x) => !x.hasAttribute('disabled'));
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  setNotebookEnabled(on: boolean) {
    this.notebookBtn.style.display = on ? '' : 'none';
  }

  private actionKey = '';
  /** Reticle label + action button. When the action uses the held item, the button shows that item's picture. */
  setTarget(label: string | null, actionLabel: string | null, item: string | null = null) {
    this.reticle.classList.toggle('on', !!actionLabel);
    this.label.textContent = label ?? '';
    this.actionBtn.disabled = !actionLabel;
    const key = `${actionLabel ?? '—'}|${item ?? ''}`;
    if (this.actionKey !== key) {
      this.actionKey = key;
      this.actionBtn.innerHTML = item && actionLabel ? `${itemIcon(item, 30)}<span>${esc(actionLabel)}</span>` : esc(actionLabel ?? '—');
      this.actionBtn.setAttribute('aria-label', actionLabel ?? 'Geen actie');
    }
  }

  setHeld(name: string | null, itemId: string | null = null) {
    this.held.hidden = !name;
    this.held.innerHTML = name ? `${itemIcon(itemId ?? '', 30)}<span>${esc(name)}</span>${icon('close', 18)}` : '';
    this.held.setAttribute('aria-label', name ? `${name} in de hand — tik om los te laten` : '');
  }

  toast(msg: string, ms = 3600) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  setObjective(text: string) {
    this.objective.textContent = text;
  }

  setChecklist(items: { name: string; done: boolean }[] | null) {
    this.checklist.hidden = !items;
    if (items) this.checklist.innerHTML = `<b>Inpakken</b><ul>${items.map((i) => `<li class="${i.done ? 'done' : ''}">${i.done ? '☑' : '☐'} ${esc(i.name)}</li>`).join('')}</ul>`;
  }

  async fadeOut() {
    this.fade.classList.add('on');
    await new Promise((r) => setTimeout(r, 650));
  }
  fadeIn() {
    this.fade.classList.remove('on');
  }

  // ---------------------------------------------------------------- modal plumbing
  /** Kind of the open modal ('pause' counts as paused time for playtest timing). */
  modalKind: string | null = null;
  private returnFocus: HTMLElement | null = null;
  /** Move keyboard focus into the open modal (first control after the close button, else the close button). */
  focusFirst() {
    const els = this.overlay.querySelectorAll<HTMLElement>('.body button, .body input, .body textarea, [data-close]');
    (els[0] ?? null)?.focus({ preventScroll: true });
  }
  modal(title: string, bodyHtml: string, onClose?: (silent?: boolean) => void, kind = 'panel'): HTMLElement {
    const wasOpen = !this.overlay.hidden;
    this.closeModal(true);
    if (!wasOpen) this.returnFocus = document.activeElement as HTMLElement | null;
    this.modalKind = kind;
    this.overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header><h2>${esc(title)}</h2><button class="btn close" data-close aria-label="Sluiten">✕</button></header>
      <div class="body">${bodyHtml}</div></div>`;
    this.overlay.hidden = false;
    this.modalClose = onClose ?? null;
    $('[data-close]', this.overlay).addEventListener('click', () => this.closeModal());
    this.onModalChange(true);
    queueMicrotask(() => this.focusFirst());
    return $('.body', this.overlay);
  }

  closeModal(silent = false) {
    if (this.overlay.hidden) return;
    this.overlay.hidden = true;
    this.overlay.innerHTML = '';
    this.modalKind = null;
    const cb = this.modalClose;
    this.modalClose = null;
    cb?.(silent); // silent = replaced by another overlay (not a player dismissal)
    if (!silent) {
      this.onModalChange(false);
      this.returnFocus?.focus?.({ preventScroll: true });
      this.returnFocus = null;
    }
  }

  // ---------------------------------------------------------------- content renderers
  clueHtml(c: ClueDef) {
    let syms = '';
    if (c.symbols?.length) {
      syms = `<div class="syms">${c.symbols.map((s, i) => `<div class="s">${symbolSvg(s, 44)}<span>${SYMBOLS[s].name}</span></div>${c.symbolsLayout === 'arrow' && i < c.symbols!.length - 1 ? '<span class="arrow">→</span>' : ''}`).join('')}</div>`;
    }
    const diag = c.diagram ? DIAGRAMS[c.diagram]() : '';
    return `${syms}${diag}<p>${esc(c.text)}</p>`;
  }

  showClue(id: string, recorded: boolean) {
    const c = CLUES[id];
    if (!c) return;
    const body = this.modal(c.title, this.clueHtml(c) + (recorded ? `<p class="muted">✎ Bewaard in je notitieboek.</p>` : ''));
    body.insertAdjacentHTML('beforeend', `<div class="row center"><button class="btn primary" data-ok>Verder</button></div>`);
    $('[data-ok]', body).addEventListener('click', () => this.closeModal());
  }

  showText(title: string, text: string) {
    const body = this.modal(title, `<p>${esc(text)}</p><div class="row center"><button class="btn primary" data-ok>Verder</button></div>`);
    $('[data-ok]', body).addEventListener('click', () => this.closeModal());
  }

  inventory(opts: { items: string[]; selected: string | null; torchOn: boolean; onSelect: (id: string | null) => void; onTorch: () => void; onRead: (id: string) => void }) {
    const body = this.modal('Tas', opts.items.length
      ? `<div class="inv">${opts.items.map((id) => `<button data-id="${id}" class="${opts.selected === id ? 'sel' : ''}"><span class="e">${itemIcon(id, 46)}</span>${esc(ITEMS[id]?.name ?? id)}</button>`).join('')}</div><div class="desc" id="inv-desc">Tik op een voorwerp.</div><div class="row" id="inv-actions" style="margin-top:10px"></div>`
      : '<p>Je tas is nog leeg.</p>');
    let cur: string | null = opts.selected;
    const render = () => {
      body.querySelectorAll<HTMLButtonElement>('.inv button').forEach((b) => b.classList.toggle('sel', b.dataset.id === cur));
      const desc = body.querySelector('#inv-desc');
      const acts = body.querySelector('#inv-actions');
      if (!desc || !acts) return;
      if (!cur) { desc.textContent = 'Tik op een voorwerp.'; acts.innerHTML = ''; return; }
      const it = ITEMS[cur];
      desc.textContent = it?.desc ?? '';
      acts.innerHTML = '';
      const add = (label: string, cls: string, fn: () => void) => {
        const b = document.createElement('button');
        b.className = `btn ${cls}`;
        b.textContent = label;
        b.addEventListener('click', fn);
        acts.appendChild(b);
      };
      if (cur === 'torch') add(opts.torchOn ? 'Zaklamp uit' : 'Zaklamp aan', 'primary', () => { opts.onTorch(); this.closeModal(); });
      if (it?.readClue) add('Lezen', '', () => opts.onRead(cur!));
      if (opts.selected === cur) add('Loslaten', '', () => { opts.onSelect(null); this.closeModal(); });
      else add('In de hand nemen', 'primary', () => { opts.onSelect(cur); this.closeModal(); });
    };
    body.querySelectorAll<HTMLButtonElement>('.inv button').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.id!; render(); }));
    render();
  }

  notebook(o: { clues: string[]; solved: Set<string>; threads: { id: string; title: string; sub: string; done: boolean; next: string; tracked: boolean; started: boolean }[]; onTrack: (id: string) => void; onMap?: () => void; tab?: string }) {
    const clues = o.clues.map((id) => CLUES[id]).filter(Boolean);
    const main = clues.filter((c) => !c.memory);
    const mem = clues.filter((c) => c.memory);
    const body = this.modal('Notitieboek', `<div class="tabs" role="tablist"><button class="btn" data-t="d">Draden</button><button class="btn" data-t="a">Aanwijzingen (${main.length})</button><button class="btn" data-t="b">Herinneringen (${mem.length})</button>${o.onMap ? '<button class="btn" data-t="m">Kaart</button>' : ''}</div><div id="nb"></div>`);
    const nb = $('#nb', body);
    const card = (c: ClueDef, open: boolean) => {
      const pz = CLUE_GROUP[c.id]?.puzzle;
      const done = pz && o.solved.has(pz) ? '<span class="badge">✓ opgelost</span>' : '';
      return `<details class="clue" ${open ? 'open' : ''}><summary><h3>${esc(c.title)}</h3>${done}</summary>${this.clueHtml(c)}</details>`;
    };
    const showThreads = () => {
      nb.innerHTML = `<p class="muted">Het huis bewaart drie delen van de route. Je kunt ze in elke volgorde volgen. Kies er een om te volgen: de doelregel bovenin en de hints gaan dan over die draad.</p>` +
        o.threads.map((t) => `<div class="thread ${t.done ? 'done' : ''} ${t.tracked ? 'tracked' : ''}"><div class="th-head"><b>${esc(t.title)}</b><span class="muted"> · ${esc(t.sub)}</span>${t.done ? '<span class="badge">✓ afgerond</span>' : ''}</div>` +
          `<div class="th-next">${t.done ? 'Klaar.' : t.started ? esc(t.next) : '<span class="muted">Nog niet begonnen.</span> ' + esc(t.next)}</div>` +
          (t.done ? '' : `<button class="btn ${t.tracked ? 'primary' : ''}" data-track="${t.id}" aria-pressed="${t.tracked}">${t.tracked ? '✓ Je volgt deze draad' : 'Volg deze draad'}</button>`) + `</div>`).join('') +
        `<div class="row" style="margin-top:6px"><button class="btn" data-track="auto">Automatisch kiezen</button></div>`;
      nb.querySelectorAll<HTMLButtonElement>('[data-track]').forEach((b) => b.addEventListener('click', () => o.onTrack(b.dataset.track!)));
    };
    const showMain = () => {
      if (!main.length) { nb.innerHTML = '<p class="muted">Nog niets genoteerd. Bekijk dingen in de wereld om ze te bewaren.</p>'; return; }
      const recent = main.slice(-2).reverse();
      const groups = new Map<string, ClueDef[]>();
      for (const c of main) {
        const tid = CLUE_GROUP[c.id]?.thread ?? 'start';
        const g = THREADS.find((t) => t.id === tid)?.title ?? 'Overig';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(c);
      }
      const order = THREADS.map((t) => t.title);
      nb.innerHTML = `<h4 class="grp">Nieuwste</h4>${recent.map((c) => card(c, true)).join('')}` +
        [...groups].sort((p, q) => order.indexOf(p[0]) - order.indexOf(q[0])).map(([g, list]) => `<h4 class="grp">${esc(g)}</h4>${list.map((c) => card(c, false)).join('')}`).join('');
    };
    const showMem = () => {
      nb.innerHTML = mem.length ? [...mem].reverse().map((c) => card(c, true)).join('') : '<p class="muted">Nog geen herinneringen gevonden.</p>';
    };
    const tabs = body.querySelectorAll<HTMLButtonElement>('.tabs .btn');
    const show = (t: string) => {
      tabs.forEach((x) => x.classList.toggle('on', x.dataset.t === t));
      if (t === 'd') showThreads(); else if (t === 'a') showMain(); else showMem();
    };
    show(o.tab ?? 'd');
    tabs.forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.t === 'm') { o.onMap?.(); return; }
      show(b.dataset.t!);
    }));
  }

  map(views: { id: string; label: string; svg: string }[], initial: string, onBack?: () => void, note = '') {
    const body = this.modal('Kaart', `${views.length > 1 ? `<div class="tabs" role="tablist">${views.map((v) => `<button class="btn" data-v="${v.id}">${esc(v.label)}</button>`).join('')}</div>` : ''}<div id="mapv"></div>` +
      (note ? `<p class="muted" style="text-align:center">${esc(note)}</p>` : '') +
      (onBack ? '<div class="row center" style="margin-top:8px"><button class="btn" data-back>Terug</button></div>' : ''));
    const host = $('#mapv', body);
    const show = (id: string) => {
      const v = views.find((q) => q.id === id) ?? views[0];
      host.innerHTML = v.svg;
      body.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((b) => { b.classList.toggle('on', b.dataset.v === v.id); b.setAttribute('aria-selected', String(b.dataset.v === v.id)); });
    };
    body.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((b) => b.addEventListener('click', () => show(b.dataset.v!)));
    show(initial);
    body.querySelector('[data-back]')?.addEventListener('click', () => onBack?.());
  }

  hints(o: { title: string; hints: string[]; shown: number; choices: { id: string; title: string }[]; current: string; onPick: (id: string) => void; onMore: () => void; thread?: string; last?: string | null; next?: string | null }) {
    const body = this.modal(`Hint · ${o.title}`, '');
    const render = (n: number) => {
      const picker = o.choices.length > 1
        ? `<div class="tabs" role="tablist" aria-label="Kies een raadsel">${o.choices.map((c) => `<button class="btn ${c.id === o.current ? 'on' : ''}" role="tab" aria-selected="${c.id === o.current}" data-pick="${c.id}">${esc(c.title)}</button>`).join('')}</div>`
        : '';
      const ctx = (o.thread ? `<p class="muted">Draad: <b>${esc(o.thread)}</b></p>` : '') +
        (o.last ? `<div class="hint obs"><b>Laatst gezien:</b> ${esc(o.last)}</div>` : '') +
        (o.next ? `<div class="hint nextstep"><b>Volgende stap:</b> ${esc(o.next)}</div>` : '');
      body.innerHTML = picker + ctx + `<p class="muted">Hints zijn optioneel en worden alleen op dit apparaat bijgehouden voor de testronde.</p>` +
        o.hints.slice(0, n).map((h, i) => `<div class="hint"><b>${['Waar kijken', 'Hoe denken', 'Oplossing'][i]}:</b> ${esc(h)}</div>`).join('') +
        `<div class="row center">${n < 3 ? `<button class="btn primary" data-more>${n === 0 ? 'Toon een hint' : n === 2 ? 'Toon de oplossing' : 'Nog een hint'}</button>` : ''}<button class="btn" data-ok>Terug</button></div>`;
      body.querySelector('[data-more]')?.addEventListener('click', () => { o.onMore(); render(n + 1); });
      body.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.pick !== o.current) o.onPick(b.dataset.pick!); }));
      $('[data-ok]', body).addEventListener('click', () => this.closeModal());
      this.focusFirst();
    };
    render(o.shown);
  }

  // ---------------------------------------------------------------- puzzle panels
  /** Three wheels, each cycling through `options`. */
  dialLock(title: string, intro: string, options: string[], wheels: number, onTry: (seq: string[]) => boolean) {
    const body = this.modal(title, `<p>${esc(intro)}</p><div class="dials"></div><div class="row center"><button class="btn primary" data-try>Proberen</button></div>`);
    const vals = new Array(wheels).fill(0);
    const dials = $('.dials', body);
    const render = () => {
      dials.innerHTML = vals.map((v, i) => `<div class="dial"><button class="btn" data-up="${i}" aria-label="Wieltje ${i + 1} omhoog">▲</button><div class="face">${symbolSvg(options[v], 48)}<span>${SYMBOLS[options[v]].name}</span></div><button class="btn" data-down="${i}" aria-label="Wieltje ${i + 1} omlaag">▼</button></div>`).join('');
      dials.querySelectorAll<HTMLButtonElement>('[data-up]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.up!; vals[i] = (vals[i] + options.length - 1) % options.length; render(); }));
      dials.querySelectorAll<HTMLButtonElement>('[data-down]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.down!; vals[i] = (vals[i] + 1) % options.length; render(); }));
    };
    render();
    $('[data-try]', body).addEventListener('click', () => {
      if (onTry(vals.map((v) => options[v]))) this.closeModal();
    });
  }

  /** Press symbol buttons in sequence; auto-submits when `length` symbols are entered. */
  buttonLock(title: string, intro: string, options: string[], length: number, onTry: (seq: string[]) => boolean) {
    const body = this.modal(title, `<p>${esc(intro)}</p><div class="seq"></div><div class="keys">${options.map((o) => `<button data-k="${o}">${symbolSvg(o, 44)}${SYMBOLS[o].name}</button>`).join('')}</div><div class="row center" style="margin-top:12px"><button class="btn" data-clear>Wissen</button></div>`);
    let seq: string[] = [];
    const slots = $('.seq', body);
    const render = () => {
      slots.innerHTML = Array.from({ length }, (_, i) => `<div class="slot">${seq[i] ? symbolSvg(seq[i], 40) : ''}</div>`).join('');
    };
    render();
    body.querySelectorAll<HTMLButtonElement>('[data-k]').forEach((b) => b.addEventListener('click', () => {
      if (seq.length >= length) return;
      seq.push(b.dataset.k!);
      render();
      if (seq.length === length) {
        // Submit immediately with an immutable copy: no timer that could outlive this panel.
        const attempt = [...seq];
        seq = [];
        if (onTry(attempt)) { this.closeModal(); return; }
        slots.classList.add('shake');
        render();
      }
    }));
    $('[data-clear]', body).addEventListener('click', () => { seq = []; render(); });
  }

  /**
   * Placement board (service tags, catalogue books, route seals): tap a loose piece, then a slot.
   * Pieces can always be taken back. Feedback comes only once every slot is filled.
   */
  place(o: { title: string; intro: string; slots: { id: string; label: string; icon: string; piece: string | null }[]; pieces: string[]; pieceHtml: (id: string) => string; pieceName: (id: string) => string; onPlace: (slot: string, piece: string) => void; onTake: (slot: string) => void; done?: boolean; empty?: string }) {
    const body = this.modal(o.title, '');
    let sel: string | null = o.pieces[0] ?? null;
    const render = () => {
      body.innerHTML = `<p>${esc(o.intro)}</p><div class="place-slots">${o.slots.map((sl) => `<div class="pslot"><div class="pslot-label">${sl.icon}<span>${esc(sl.label)}</span></div>` +
        (sl.piece ? `<button class="btn piece" data-take="${sl.id}" aria-label="${esc(o.pieceName(sl.piece))} terugpakken">${o.pieceHtml(sl.piece)}<span class="muted">terugpakken</span></button>` :
          `<button class="btn slot-empty" data-slot="${sl.id}" ${sel ? '' : 'disabled'} aria-label="Leg in: ${esc(sl.label)}">${sel ? 'Hier leggen' : 'leeg'}</button>`) + `</div>`).join('')}</div>` +
        (o.done ? '' : o.pieces.length ? `<p class="muted">Kies wat je wilt neerleggen:</p><div class="place-pieces">${o.pieces.map((p) => `<button class="btn piece ${p === sel ? 'sel' : ''}" data-piece="${p}" aria-pressed="${p === sel}" aria-label="${esc(o.pieceName(p))}">${o.pieceHtml(p)}</button>`).join('')}</div>` : `<p class="muted">${esc(o.empty ?? 'Alles ligt op zijn plek.')}</p>`) +
        `<div class="row center" style="margin-top:10px"><button class="btn" data-ok>Klaar</button></div>`;
      body.querySelectorAll<HTMLButtonElement>('[data-piece]').forEach((b) => b.addEventListener('click', () => { sel = b.dataset.piece!; render(); }));
      body.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach((b) => b.addEventListener('click', () => { if (sel) o.onPlace(b.dataset.slot!, sel); }));
      body.querySelectorAll<HTMLButtonElement>('[data-take]').forEach((b) => b.addEventListener('click', () => o.onTake(b.dataset.take!)));
      $('[data-ok]', body).addEventListener('click', () => this.closeModal());
    };
    render();
  }

  /** Number wheels (0–9) with neutral feedback; returns true from onTry when it opened. */
  digitLock(title: string, intro: string, count: number, onTry: (digits: number[]) => boolean) {
    const body = this.modal(title, `<p>${esc(intro)}</p><div class="dials digits"></div><div class="row center"><button class="btn primary" data-try>Proberen</button></div>`);
    const vals = new Array(count).fill(0);
    const dials = $('.dials', body);
    const render = () => {
      dials.innerHTML = vals.map((v, i) => `<div class="dial"><button class="btn" data-up="${i}" aria-label="Wieltje ${i + 1} omhoog">▲</button><div class="face num" aria-live="polite">${v}</div><button class="btn" data-down="${i}" aria-label="Wieltje ${i + 1} omlaag">▼</button></div>`).join('');
      dials.querySelectorAll<HTMLButtonElement>('[data-up]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.up!; vals[i] = (vals[i] + 1) % 10; render(); }));
      dials.querySelectorAll<HTMLButtonElement>('[data-down]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.down!; vals[i] = (vals[i] + 9) % 10; render(); }));
    };
    render();
    $('[data-try]', body).addEventListener('click', () => { if (onTry([...vals])) this.closeModal(); });
  }

  billiard(onTry: (cells: number[]) => boolean) {
    const body = this.modal('Paneel naast het biljart', `<p>Negen lampjes, met het raam aan de bovenkant. Tik om lampjes aan of uit te zetten.</p><div class="grid9"></div><div class="row center"><button class="btn primary" data-try>Proberen</button></div>`);
    const on = new Set<number>();
    const grid = $('.grid9', body);
    const render = () => {
      grid.innerHTML = Array.from({ length: 9 }, (_, i) => `<button data-c="${i}" class="${on.has(i) ? 'on' : ''}" aria-pressed="${on.has(i)}" aria-label="Lampje rij ${Math.floor(i / 3) + 1} kolom ${(i % 3) + 1}">${on.has(i) ? '●' : '○'}</button>`).join('');
      grid.querySelectorAll<HTMLButtonElement>('[data-c]').forEach((b) => b.addEventListener('click', () => { const c = +b.dataset.c!; if (on.has(c)) on.delete(c); else on.add(c); render(); }));
    };
    render();
    $('[data-try]', body).addEventListener('click', () => { if (onTry([...on])) this.closeModal(); });
  }

  // ---------------------------------------------------------------- menus
  pause(s: Settings, h: { onChange: (s: Settings) => void; onRestart: () => void; onPointerLock?: () => void; onFullscreen?: () => void; onMap?: () => void; playMinutes: number; build: string }) {
    const body = this.modal('Pauze', `
      <div class="row" style="margin-bottom:10px"><button class="btn primary" data-resume>Verder spelen</button>${h.onMap ? '<button class="btn" data-map>Kaart</button>' : ''}${h.onFullscreen ? '<button class="btn" data-fs>Volledig scherm</button>' : ''}${h.onPointerLock ? '<button class="btn" data-pl>Muis vastzetten</button>' : ''}</div>
      <label class="set">Kijkgevoeligheid <input type="range" min="0.3" max="2.5" step="0.1" value="${s.lookSensitivity}" data-k="lookSensitivity"></label>
      <label class="set">Joystickgevoeligheid <input type="range" min="0.5" max="1.5" step="0.05" value="${s.moveSensitivity}" data-k="moveSensitivity"></label>
      <label class="set">Hoge kwaliteit (schaduwen, scherper beeld) <input type="checkbox" ${s.quality === 'high' ? 'checked' : ''} data-k="quality"></label>
      <label class="set">Minder beweging <input type="checkbox" ${s.reducedMotion ? 'checked' : ''} data-k="reducedMotion"></label>
      <label class="set">Kijkrichting omkeren <input type="checkbox" ${s.invertY ? 'checked' : ''} data-k="invertY"></label>
      <label class="set">Geluid uit <input type="checkbox" ${s.muted ? 'checked' : ''} data-k="muted"></label>
      <p class="muted">Speeltijd tot nu toe: ${h.playMinutes} min. Voortgang wordt automatisch bewaard op dit apparaat. Versie: ${esc(h.build)}</p>
      <p class="muted">Bediening — telefoon: linkerduim loopt, rechts slepen kijkt, tik op iets of gebruik de grote knop. Computer: WASD/pijltjes, Shift rennen, slepen of muis vastzetten om te kijken, E = actie, I = tas, N = notities, H = hint, F = zaklamp, Esc = pauze.</p>
      <div class="row" style="margin-top:8px"><button class="btn danger" data-restart>Opnieuw beginnen…</button></div>`, undefined, 'pause');
    const cur = { ...s };
    body.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((inp) => inp.addEventListener('input', () => {
      const k = inp.dataset.k as keyof Settings;
      if (k === 'quality') cur.quality = inp.checked ? 'high' : 'low';
      else if (inp.type === 'checkbox') (cur as Record<string, unknown>)[k] = inp.checked;
      else (cur as Record<string, unknown>)[k] = parseFloat(inp.value);
      h.onChange({ ...cur });
    }));
    $('[data-resume]', body).addEventListener('click', () => this.closeModal());
    body.querySelector('[data-fs]')?.addEventListener('click', () => h.onFullscreen?.());
    body.querySelector('[data-map]')?.addEventListener('click', () => h.onMap?.());
    body.querySelector('[data-pl]')?.addEventListener('click', () => { this.closeModal(); h.onPointerLock?.(); });
    $('[data-restart]', body).addEventListener('click', () => this.confirm('Opnieuw beginnen?', 'Je huidige voortgang wordt opzijgezet. Op het startscherm kun je hem terugzetten met “Vorige voortgang terugzetten”.', 'Opnieuw beginnen', h.onRestart));
  }

  contextLost(onReload: () => void) {
    const body = this.modal('Beeld onderbroken', `<p>Het 3D-beeld is weggevallen (dat kan gebeuren als de telefoon geheugen vrijmaakt). Je voortgang is bewaard.</p><p class="muted">Het beeld komt vaak vanzelf terug. Lukt dat niet, herlaad dan.</p><div class="row center"><button class="btn primary" data-reload>Herladen</button></div>`);
    body.querySelector('[data-reload]')!.addEventListener('click', onReload);
  }

  confirm(title: string, text: string, yes: string, onYes: () => void) {
    const body = this.modal(title, `<p>${esc(text)}</p><div class="row center"><button class="btn danger" data-yes>${esc(yes)}</button><button class="btn" data-no>Annuleren</button></div>`);
    $('[data-yes]', body).addEventListener('click', () => { this.closeModal(); onYes(); });
    $('[data-no]', body).addEventListener('click', () => this.closeModal());
  }

  ending(opts: { title: string; text: string; minutes: number; hints: number; wrong: number; memories?: string[]; onFeedback: (text: string) => void; onContinue: () => void }) {
    const body = this.modal(opts.title, `<p class="letter">${esc(opts.text)}</p>
      ${opts.memories?.length ? `<p class="muted">Wat je onderweg vond (${opts.memories.length}): ${opts.memories.map(esc).join(' · ')}</p>` : ''}
      <p class="muted">Speeltijd: ${opts.minutes} min · hints bekeken: ${opts.hints} · foute pogingen: ${opts.wrong}</p>
      <p><b>Testronde:</b> waar liep je vast, wat was te makkelijk of te moeilijk, hoe voelde de besturing?</p>
      <textarea id="fb" placeholder="Jouw feedback…"></textarea>
      <div class="row center" style="margin-top:10px"><button class="btn primary" data-copy>Kopieer feedback + statistieken</button><button class="btn" data-cont>Rondkijken</button></div>`);
    $('[data-copy]', body).addEventListener('click', () => opts.onFeedback(($('#fb', body) as HTMLTextAreaElement).value));
    $('[data-cont]', body).addEventListener('click', () => { this.closeModal(); opts.onContinue(); });
  }

  // ---------------------------------------------------------------- start screen
  showStart(o: { hasSave: boolean; onContinue: () => void; onNew: () => void; error?: string; hasBackup?: boolean; onRestore?: () => void }) {
    this.start.hidden = false;
    this.start.innerHTML = `<div class="card">
      <h1>Feh Lu We</h1>
      <p class="sub">Een weekend op de Veluwe. Iemand heeft alles al klaargezet…</p>
      ${o.error ? `<div class="err">${o.error}</div>` : `<div class="row">
        ${o.hasSave ? '<button class="btn primary" data-cont>Verder spelen</button><button class="btn" data-new>Nieuw spel</button>' : '<button class="btn primary" data-new>Start</button>'}
        ${o.hasBackup ? '<button class="btn" data-restore>Vorige voortgang terugzetten</button>' : ''}
      </div>
      <p class="note">Speel liefst liggend (landschap). Linkerduim: lopen · rechts slepen: rondkijken · tik op dingen of gebruik de grote knop rechtsonder.<br>Geluid gaat aan na Start. Voortgang wordt bewaard op dit apparaat.</p>`}
    </div>`;
    this.start.querySelector('[data-cont]')?.addEventListener('click', o.onContinue);
    this.start.querySelector('[data-new]')?.addEventListener('click', () => {
      if (o.hasSave) this.confirm('Nieuw spel?', 'Je huidige voortgang wordt opzijgezet (niet gewist): je kunt hem hier later terugzetten met “Vorige voortgang terugzetten”.', 'Nieuw spel', o.onNew);
      else o.onNew();
    });
    this.start.querySelector('[data-restore]')?.addEventListener('click', () => {
      this.confirm('Vorige voortgang terugzetten?', o.hasSave ? 'Je huidige voortgang en de opzijgezette wisselen van plaats. Er gaat niets verloren.' : 'De opzijgezette voortgang wordt weer je spel.', 'Terugzetten', () => o.onRestore?.());
    });
  }
  hideStart() {
    this.start.hidden = true;
    this.hud.hidden = false;
  }
}
