// HTML user interface: HUD, toasts, modal overlays and puzzle panels. No hover-only actions;
// every control is a ≥48px button. Overlays block world input while open.
import { ITEMS } from '../content/items';
import { CLUES, type ClueDef } from '../content/clues';
import { symbolSvg, SYMBOLS } from '../content/symbols';
import { DIAGRAMS } from './diagrams';
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
  private modalClose: (() => void) | null = null;
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
        <button class="hud-btn" id="b-menu" aria-label="Pauze en instellingen"><span class="ico">☰</span><span class="lbl">Pauze</span></button>
        <button class="hud-btn" id="b-hint" aria-label="Hint"><span class="ico">💡</span><span class="lbl">Hint</span></button>
      </div>
      <div id="topbar-r">
        <button class="hud-btn" id="b-notes" aria-label="Notitieboek"><span class="ico">📓</span><span class="lbl">Notities</span></button>
        <button class="hud-btn" id="b-bag" aria-label="Tas"><span class="ico">🎒</span><span class="lbl">Tas</span></button>
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
  }

  setNotebookEnabled(on: boolean) {
    this.notebookBtn.style.display = on ? '' : 'none';
  }

  setTarget(label: string | null, actionLabel: string | null) {
    this.reticle.classList.toggle('on', !!actionLabel);
    this.label.textContent = label ?? '';
    this.actionBtn.disabled = !actionLabel;
    this.actionBtn.textContent = actionLabel ?? '—';
  }

  setHeld(name: string | null, icon = '') {
    this.held.hidden = !name;
    this.held.innerHTML = name ? `<span class="ico">${icon}</span><span>${esc(name)} ✕</span>` : '';
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
  modal(title: string, bodyHtml: string, onClose?: () => void): HTMLElement {
    this.closeModal(true);
    this.overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header><h2>${esc(title)}</h2><button class="btn close" data-close aria-label="Sluiten">✕</button></header>
      <div class="body">${bodyHtml}</div></div>`;
    this.overlay.hidden = false;
    this.modalClose = onClose ?? null;
    $('[data-close]', this.overlay).addEventListener('click', () => this.closeModal());
    this.onModalChange(true);
    return $('.body', this.overlay);
  }

  closeModal(silent = false) {
    if (this.overlay.hidden) return;
    this.overlay.hidden = true;
    this.overlay.innerHTML = '';
    const cb = this.modalClose;
    this.modalClose = null;
    cb?.();
    if (!silent) this.onModalChange(false);
  }

  // ---------------------------------------------------------------- content renderers
  clueHtml(c: ClueDef) {
    let syms = '';
    if (c.symbols?.length) {
      if (c.symbolsLayout === 'ring') {
        const n = c.symbols.length;
        syms = `<div class="syms ring">${c.symbols.map((s, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          return `<div class="s" style="left:${62 + Math.cos(a) * 58}px;top:${50 + Math.sin(a) * 48}px">${symbolSvg(s, 42)}<span>${SYMBOLS[s].name}</span></div>`;
        }).join('')}</div>`;
      } else {
        syms = `<div class="syms">${c.symbols.map((s, i) => `<div class="s">${symbolSvg(s, 44)}<span>${SYMBOLS[s].name}</span></div>${c.symbolsLayout === 'arrow' && i < c.symbols!.length - 1 ? '<span class="arrow">→</span>' : ''}`).join('')}</div>`;
      }
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
      ? `<div class="inv">${opts.items.map((id) => `<button data-id="${id}" class="${opts.selected === id ? 'sel' : ''}"><span class="e">${ITEMS[id]?.icon ?? '•'}</span>${esc(ITEMS[id]?.name ?? id)}</button>`).join('')}</div><div class="desc" id="inv-desc">Tik op een voorwerp.</div><div class="row" id="inv-actions" style="margin-top:10px"></div>`
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

  notebook(clueIds: string[], onMap?: () => void) {
    const clues = clueIds.map((id) => CLUES[id]).filter(Boolean);
    const main = clues.filter((c) => !c.memory);
    const mem = clues.filter((c) => c.memory);
    const body = this.modal('Notitieboek', `<div class="tabs"><button class="btn on" data-t="a">Aanwijzingen (${main.length})</button><button class="btn" data-t="b">Herinneringen (${mem.length})</button>${onMap ? '<button class="btn" data-t="m">Kaart</button>' : ''}</div><div id="nb"></div>`);
    const nb = $('#nb', body);
    const show = (list: ClueDef[]) => {
      nb.innerHTML = list.length ? [...list].reverse().map((c) => `<div class="clue"><h3>${esc(c.title)}</h3>${this.clueHtml(c)}</div>`).join('') : '<p class="muted">Nog niets genoteerd. Bekijk dingen in de wereld om ze te bewaren.</p>';
    };
    show(main);
    body.querySelectorAll<HTMLButtonElement>('.tabs .btn').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.t === 'm') { onMap?.(); return; }
      body.querySelectorAll('.tabs .btn').forEach((x) => x.classList.toggle('on', x === b));
      show(b.dataset.t === 'a' ? main : mem);
    }));
  }

  map(svg: string) {
    this.modal('Kaart van het landgoed', svg);
  }

  hints(title: string, hints: string[], shown: number, onMore: () => void) {
    const body = this.modal(`Hint · ${title}`, '');
    const render = (n: number) => {
      body.innerHTML = `<p class="muted">Hints zijn optioneel. Ze worden bijgehouden voor de testronde.</p>` +
        hints.slice(0, n).map((h, i) => `<div class="hint"><b>${['Waar kijken', 'Hoe denken', 'Oplossing'][i]}:</b> ${esc(h)}</div>`).join('') +
        `<div class="row center">${n < 3 ? `<button class="btn primary" data-more>${n === 0 ? 'Toon een hint' : n === 2 ? 'Toon de oplossing' : 'Nog een hint'}</button>` : ''}<button class="btn" data-ok>Terug</button></div>`;
      body.querySelector('[data-more]')?.addEventListener('click', () => { onMore(); render(n + 1); });
      $('[data-ok]', body).addEventListener('click', () => this.closeModal());
    };
    render(shown);
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
        setTimeout(() => {
          if (onTry(seq)) this.closeModal();
          else { seq = []; render(); }
        }, 250);
      }
    }));
    $('[data-clear]', body).addEventListener('click', () => { seq = []; render(); });
  }

  slots(opts: { left: string | null; right: string | null; candidates: string[]; onPlace: (slot: 'left' | 'right', item: string) => void; onTake: (slot: 'left' | 'right') => void; hint: string }) {
    const body = this.modal('Twee nissen naast de deur', '');
    const render = () => {
      const n = (side: 'left' | 'right') => {
        const it = side === 'left' ? opts.left : opts.right;
        return `<div class="niche"><b>${side === 'left' ? 'Linkernis' : 'Rechternis'}</b>${it ? `<span class="e">${ITEMS[it].icon}</span>${esc(ITEMS[it].name)}<button class="btn" data-take="${side}">Terugpakken</button>` : '<span class="muted">leeg</span>'}</div>`;
      };
      body.innerHTML = `<p>${esc(opts.hint)}</p><div class="niches">${n('left')}${n('right')}</div>` +
        (opts.candidates.length ? `<p class="muted">Kies wat je in een nis legt:</p>${opts.candidates.map((c) => `<div class="row" style="margin-bottom:8px"><span style="min-width:150px">${ITEMS[c].icon} ${esc(ITEMS[c].name)}</span><button class="btn" data-place="left" data-item="${c}">← links</button><button class="btn" data-place="right" data-item="${c}">rechts →</button></div>`).join('')}` : '<p class="muted">Je hebt niets bij je wat in een nis past.</p>');
      body.querySelectorAll<HTMLButtonElement>('[data-take]').forEach((b) => b.addEventListener('click', () => opts.onTake(b.dataset.take as 'left' | 'right')));
      body.querySelectorAll<HTMLButtonElement>('[data-place]').forEach((b) => b.addEventListener('click', () => opts.onPlace(b.dataset.place as 'left' | 'right', b.dataset.item!)));
    };
    render();
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
  pause(s: Settings, h: { onChange: (s: Settings) => void; onRestart: () => void; onPointerLock?: () => void; onFullscreen?: () => void; onMap?: () => void; playMinutes: number }) {
    const body = this.modal('Pauze', `
      <div class="row" style="margin-bottom:10px"><button class="btn primary" data-resume>Verder spelen</button>${h.onMap ? '<button class="btn" data-map>Kaart</button>' : ''}${h.onFullscreen ? '<button class="btn" data-fs>Volledig scherm</button>' : ''}${h.onPointerLock ? '<button class="btn" data-pl>Muis vastzetten</button>' : ''}</div>
      <label class="set">Kijkgevoeligheid <input type="range" min="0.3" max="2.5" step="0.1" value="${s.lookSensitivity}" data-k="lookSensitivity"></label>
      <label class="set">Joystickgevoeligheid <input type="range" min="0.5" max="1.5" step="0.05" value="${s.moveSensitivity}" data-k="moveSensitivity"></label>
      <label class="set">Hoge kwaliteit (schaduwen, scherper beeld) <input type="checkbox" ${s.quality === 'high' ? 'checked' : ''} data-k="quality"></label>
      <label class="set">Minder beweging <input type="checkbox" ${s.reducedMotion ? 'checked' : ''} data-k="reducedMotion"></label>
      <label class="set">Kijkrichting omkeren <input type="checkbox" ${s.invertY ? 'checked' : ''} data-k="invertY"></label>
      <label class="set">Geluid uit <input type="checkbox" ${s.muted ? 'checked' : ''} data-k="muted"></label>
      <p class="muted">Speeltijd tot nu toe: ${h.playMinutes} min. Voortgang wordt automatisch bewaard op dit apparaat.</p>
      <p class="muted">Bediening — telefoon: linkerduim loopt, rechts slepen kijkt, tik op iets of gebruik de grote knop. Computer: WASD/pijltjes, Shift rennen, slepen of muis vastzetten om te kijken, E = actie, I = tas, N = notities, H = hint, F = zaklamp, Esc = pauze.</p>
      <div class="row" style="margin-top:8px"><button class="btn danger" data-restart>Opnieuw beginnen…</button></div>`);
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
    $('[data-restart]', body).addEventListener('click', () => this.confirm('Opnieuw beginnen?', 'Al je voortgang op dit apparaat wordt gewist.', 'Ja, wis alles', h.onRestart));
  }

  confirm(title: string, text: string, yes: string, onYes: () => void) {
    const body = this.modal(title, `<p>${esc(text)}</p><div class="row center"><button class="btn danger" data-yes>${esc(yes)}</button><button class="btn" data-no>Annuleren</button></div>`);
    $('[data-yes]', body).addEventListener('click', () => { this.closeModal(); onYes(); });
    $('[data-no]', body).addEventListener('click', () => this.closeModal());
  }

  ending(opts: { title: string; text: string; minutes: number; hints: number; wrong: number; onFeedback: (text: string) => void; onContinue: () => void }) {
    const body = this.modal(opts.title, `<p>${esc(opts.text)}</p>
      <p class="muted">Speeltijd: ${opts.minutes} min · hints bekeken: ${opts.hints} · foute pogingen: ${opts.wrong}</p>
      <p><b>Testronde:</b> waar liep je vast, wat was te makkelijk of te moeilijk, hoe voelde de besturing?</p>
      <textarea id="fb" placeholder="Jouw feedback…"></textarea>
      <div class="row center" style="margin-top:10px"><button class="btn primary" data-copy>Kopieer feedback + statistieken</button><button class="btn" data-cont>Rondkijken</button></div>`);
    $('[data-copy]', body).addEventListener('click', () => opts.onFeedback(($('#fb', body) as HTMLTextAreaElement).value));
    $('[data-cont]', body).addEventListener('click', () => { this.closeModal(); opts.onContinue(); });
  }

  // ---------------------------------------------------------------- start screen
  showStart(o: { hasSave: boolean; onContinue: () => void; onNew: () => void; error?: string }) {
    this.start.hidden = false;
    this.start.innerHTML = `<div class="card">
      <h1>Feh Lu We</h1>
      <p class="sub">Een weekend op de Veluwe. Iemand heeft alles al klaargezet…</p>
      ${o.error ? `<div class="err">${o.error}</div>` : `<div class="row">
        ${o.hasSave ? '<button class="btn primary" data-cont>Verder spelen</button><button class="btn" data-new>Nieuw spel</button>' : '<button class="btn primary" data-new>Start</button>'}
      </div>
      <p class="note">Speel liefst liggend (landschap). Linkerduim: lopen · rechts slepen: rondkijken · tik op dingen of gebruik de grote knop rechtsonder.<br>Geluid gaat aan na Start. Voortgang wordt bewaard op dit apparaat.</p>`}
    </div>`;
    this.start.querySelector('[data-cont]')?.addEventListener('click', o.onContinue);
    this.start.querySelector('[data-new]')?.addEventListener('click', () => {
      if (o.hasSave) this.confirm('Nieuw spel?', 'Je bestaande voortgang wordt gewist.', 'Nieuw spel', o.onNew);
      else o.onNew();
    });
  }
  hideStart() {
    this.start.hidden = true;
    this.hud.hidden = false;
  }
}
