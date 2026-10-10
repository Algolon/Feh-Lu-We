// Game orchestrator: renderer + loop, input → player, interaction picking, save/restore, scenes, UI glue.
import * as THREE from 'three';
import { ART, SLICE } from './artflags';
import { legacyRelocation } from './relocate';
import { SliceUI } from '../slice/ui';
import { syncDerived } from '../slice/model';
import { CAPS, FORCE_NO_MULTIDRAW, hideMultiDraw, detectCaps, vegPathLabel } from './caps';
import {
  type GameState, type Settings, type SceneId, type PlayerPose, SAVE_KEY, SETTINGS_KEY, BACKUP_KEY, defaultState, parseSave, parseSettings, storage, addClue, has, flag, logEvent,
} from './state';
import { Input } from '../player/input';
import { Player, PLAYER } from '../player/player';
import { World, LightPool, type GameApi, type Interactable, type LightView } from '../interactions/world';
import { UI } from '../ui/ui';
import { Audio } from '../audio/audio';
import {
  type Outcome, type Sfx, type PlaceKind, type PuzzleDef, PUZZLES, currentPuzzle, openPuzzles, viewHint, tutorialMissing, leaveHome as leaveHomeRule, submitCode, LOCK_OPTIONS,
  placePiece, takePiece, slotContents, loosePieces, placeSolved, submitDigits, submitBilliard, solvedCount, REQUIRED_COUNT, activeThread, threadNext, threadDone, owns,
} from '../puzzles/rules';
import { ITEMS, ESSENTIALS, SEALS } from '../content/items';
import { CLUES, CLUE_GROUP, THREADS, type ThreadId } from '../content/clues';
import { SERVICE, CATALOG, CONSOLE_SOCKETS } from '../content/canon';
import { SYMBOLS, symbolSvg } from '../content/symbols';
import { itemIcon } from '../ui/icons';
import { buildHome } from '../world/home';
import { buildEstate, MAP_SITES } from '../world/estate';
import { estateMapSvg, floorPlanSvg, MAP_LEVELS, levelAt, type MapLevel } from '../ui/map';
import type { Env } from '../world/env';
import type { RoomGraph } from '../world/rooms';
import { tickFires, FIRE_UNIFORMS } from '../world/fire';

export interface SceneExtras {
  env?: Env;
  isIndoor?: (x: number, z: number, y: number) => boolean;
  surfaceAt?: (x: number, z: number, y: number) => 'grass' | 'wood' | 'stone';
  /** Authored rooms + portals: lighting relevance and the floor-aware map. */
  rooms?: RoomGraph;
}

const DEBUG = new URLSearchParams(location.search).has('debug');
export const BUILD: string = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';
const AUTOTEST = new URLSearchParams(location.search).has('autotest');

export class Game implements GameApi {
  state: GameState;
  settings: Settings;
  selected: string | null = null;
  readonly playerRadius = PLAYER.radius;
  get reducedMotion() {
    return this.settings.reducedMotion;
  }
  readonly ui = new UI();
  readonly audio = new Audio();
  readonly player = new Player();
  /** DEV-01 slice review (?review=dev01) only; null in the normal game. */
  readonly slice: SliceUI | null = SLICE ? new SliceUI(this) : null;
  private modalClosedAt = 0;
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(70, 1, 0.08, 450);
  readonly torch = new THREE.SpotLight(0xfff1d6, 0, 22, 0.5, 0.45, 1.2);
  input!: Input;
  world: World | null = null;
  extras: SceneExtras = {};
  pool: LightPool | null = null;
  private running = false;
  private last = 0;
  private time = 0;
  private target: Interactable | null = null;
  private raycaster = new THREE.Raycaster();
  private saveTimer = 0;
  private poseTimer = 0;
  private cullTimer = 0;
  private switching = false;
  private fpsAcc = { t: 0, fps: 0 };
  private debugEl: HTMLDivElement | null = null;
  private dusk = 0;
  private indoor = 0;
  autopilot: { x: number; z: number; run: boolean } | null = null;
  contextLost = false;
  private started = false;

  constructor(private canvas: HTMLCanvasElement) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.settings = parseSettings(storage.get(SETTINGS_KEY), coarse);
    this.state = parseSave(storage.get(SAVE_KEY)) ?? defaultState();
    if (FORCE_NO_MULTIDRAW) hideMultiDraw(); // diagnostic (?multidraw=0): must precede the renderer's context
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.settings.quality === 'high', powerPreference: 'high-performance' });
    detectCaps(this.renderer);
    this.renderer.toneMapping = ART.tm === 'neutral' ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    // Context loss: pause rendering + input, save, offer recovery; resume automatically if the context returns.
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
      this.saveNow();
      this.ui.contextLost(() => location.reload());
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
      this.ui.closeModal();
      this.ui.toast('Het beeld is terug.');
    });
    this.camera.rotation.order = 'YXZ';
    this.torch.position.set(0.25, -0.2, 0);
    this.torch.target.position.set(0, -0.3, -5);
    this.camera.add(this.torch, this.torch.target);
    this.applyQuality();
    window.addEventListener('resize', () => this.resize());
    window.visualViewport?.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.hiddenAt = performance.now();
        this.audio.suspend();
        this.saveNow();
      } else if (this.running) {
        // off-tab time is recorded as paused, never as active play
        if (this.hiddenAt) this.state.stats.pausedMs += Math.min(performance.now() - this.hiddenAt, 6 * 3600e3);
        this.hiddenAt = 0;
        this.audio.resume();
        this.last = performance.now();
      }
    });
    window.addEventListener('pagehide', () => this.saveNow());
    this.resize();
  }

  // ------------------------------------------------------------------ lifecycle
  hasSave() {
    return !!parseSave(storage.get(SAVE_KEY)) && (this.state.inventory.length > 0 || this.state.scene === 'estate');
  }

  async start(fresh: boolean) {
    if (this.started) return; // one input subscription set, one RAF loop
    this.started = true;
    await this.audio.unlock();
    this.audio.setMuted(this.settings.muted);
    if (fresh) {
      this.stashSave();
      this.state = defaultState();
    }
    this.input = new Input(
      document.getElementById('zone-move')!, document.getElementById('zone-look')!, this.canvas,
      document.getElementById('stick')!, document.getElementById('stick-knob')!, this.settings,
    );
    this.input.onTap = (x, y) => this.tapAt(x, y);
    this.input.onAction = () => this.doAction();
    this.input.onKey = (k) => this.key(k);
    this.ui.buildHud({
      action: () => this.doAction(),
      menu: () => this.openPause(),
      bag: () => this.openBag(),
      notebook: () => this.openNotebook(),
      hint: () => this.openHint(),
      deselect: () => this.select(null),
    });
    this.ui.onModalChange = (open) => {
      if (!open) this.modalClosedAt = performance.now();
      this.input.setEnabled(!open);
      document.body.classList.toggle('playing-off', open);
      if (open) this.input.exitPointerLock();
    };
    this.ui.hideStart();
    if (DEBUG) this.buildDebug();
    await this.loadScene(this.state.scene);
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
    if (this.state.finished) this.ui.toast('Je hebt de verzamelzaal al gevonden. Kijk gerust nog rond.');
    if (this.state.notice) {
      const n = this.state.notice;
      this.state.notice = null;
      this.saveSoon();
      if (this.slice) this.ui.showText('Testversie (DEV-01)', n);
      else this.ui.showText('Het landgoed is veranderd', `${n}\n\nJe speelt verder met je bewaarde spel. Liever helemaal opnieuw beginnen zonder dit spel kwijt te raken? Kies in Pauze “Opnieuw beginnen”: je huidige voortgang wordt opzijgezet en is op het startscherm terug te zetten.`);
    }
  }

  /** Move the current save aside (never deleted): restorable from the start screen. */
  private stashSave() {
    const cur = storage.get(SAVE_KEY);
    if (cur && parseSave(cur)) storage.set(BACKUP_KEY, cur);
    storage.remove(SAVE_KEY);
  }
  hasBackup() {
    return !!parseSave(storage.get(BACKUP_KEY));
  }
  /** Swap the stashed save with the current one (nothing is lost). */
  restoreBackup() {
    const b = storage.get(BACKUP_KEY);
    const parsed = parseSave(b);
    if (!b || !parsed) return false;
    const cur = storage.get(SAVE_KEY);
    storage.set(SAVE_KEY, b);
    if (cur && parseSave(cur)) storage.set(BACKUP_KEY, cur); else storage.remove(BACKUP_KEY);
    this.state = parsed;
    return true;
  }

  async loadScene(id: SceneId) {
    if (this.world) {
      this.world.scene.remove(this.camera);
      this.world.dispose();
      this.world = null;
    }
    this.target = null;
    const build = id === 'home' ? buildHome : buildEstate;
    const { world, extras } = build(this);
    this.world = world;
    this.extras = extras;
    world.scene.add(this.camera);
    this.pool = new LightPool(world.scene, this.settings.quality === 'high' ? 4 : 3);
    this.audio.ambience = world.ambience;
    this.trackSolved(false);
    world.patches.build(world);
    world.syncAll();
    world.rooms = extras.rooms ?? null;
    world.isOpen = (d) => this.state.open[d] === true;
    world.setupCulling();
    this.cullTimer = 0;
    this.restorePose(world, this.state.player[id]);
    // art lighting: start fully indoors/outdoors (smoothing is only for walking through a doorway)
    this.indoor = world.rooms && world.rooms.roomAt(this.player.x, this.player.y + 0.8, this.player.z) !== 'out' ? 1 : 0;
    this.applyQuality();
    this.updateHud();
    // compile shaders up-front to avoid hitches on first view
    this.player.applyCamera(this.camera);
    this.extras.env?.update(this.dusk, this.camera.position);
    this.renderer.compile(world.scene, this.camera);
  }

  /** Put the player at the saved pose if it is valid, otherwise at the nearest checkpoint / spawn. */
  private restorePose(w: World, p: PlayerPose | null | undefined) {
    let pose = p ?? w.spawn;
    // DEV-02: poses in places the v0.2 layout rebuilt get a named safe relocation (src/core/relocate.ts)
    const moved = legacyRelocation(w.id, p);
    const named = moved ? w.checkpoints.find((c) => c.name === moved.checkpoint) : undefined;
    if (named) { logEvent(this.state, 'relocated', `${moved!.reason} → ${moved!.checkpoint}`); pose = named.pose; }
    const valid = (q: PlayerPose) => {
      const s = w.col.supportHeight(q.x, q.z, q.y + 0.05, PLAYER.stepUp);
      return Math.abs(s - q.y) < 0.3 && !w.col.overlaps(q.x, q.z, s, PLAYER.radius, PLAYER.height, PLAYER.stepUp);
    };
    if (!valid(pose)) {
      const cands = [...w.checkpoints.map((c) => c.pose), w.spawn].filter(valid);
      cands.sort((a, b) => Math.hypot(a.x - pose.x, a.z - pose.z) - Math.hypot(b.x - pose.x, b.z - pose.z));
      pose = cands[0] ?? w.spawn;
    }
    this.player.setPose(pose);
    this.player.y = w.col.supportHeight(pose.x, pose.z, pose.y + 0.05, PLAYER.stepUp);
  }

  // ------------------------------------------------------------------ GameApi for world objects
  act(o: Outcome, opts: { save?: boolean } = {}) {
    if (!o.ok && (o.sfx === 'locked' || o.sfx === 'fail')) logEvent(this.state, 'refused', this.target?.id);
    if (o.msg) this.ui.toast(o.msg);
    if (o.sfx !== 'none') this.sfx(o.sfx);
    if (opts.save !== false) this.changed();
  }
  sfx(name: Sfx | 'door' | 'drawer' | 'switch' | 'water' | 'steam') {
    this.audio.sfx(name);
  }
  toast(msg: string) {
    this.ui.toast(msg);
  }
  private solvedSeen = new Set<string>();
  private trackSolved(log: boolean) {
    for (const p of PUZZLES) if (p.solved(this.state) && !this.solvedSeen.has(p.id)) {
      this.solvedSeen.add(p.id);
      if (log) logEvent(this.state, 'solved', p.id);
    }
  }
  changed() {
    if (this.slice) syncDerived(this.state); // DEV-01: item / solve / reward events from the shared state
    this.trackSolved(true);
    if (this.selected && !has(this.state, this.selected)) this.select(null);
    this.world?.syncAll();
    this.updateHud();
    this.saveSoon();
  }
  inspect(clueId: string) {
    if (this.slice) { this.slice.inspect(clueId); return; }
    const recorded = addClue(this.state, clueId);
    this.ui.showClue(clueId, recorded);
    if (recorded) this.changed();
  }
  playerXZ() {
    return { x: this.player.x, z: this.player.z, y: this.player.y };
  }
  async leaveHome() {
    const r = leaveHomeRule(this.state);
    this.act(r, { save: false });
    if (!r.ok || this.switching) return;
    this.switching = true;
    this.saveNow();
    await this.ui.fadeOut();
    await this.loadScene('estate');
    this.saveNow();
    this.ui.fadeIn();
    this.switching = false;
    this.ui.toast('Je bent er. Het hek staat open; het landhuis ligt verderop aan het einde van de oprijlaan.', 6000);
  }
  finish() {
    if (!this.state.finished) {
      this.state.finished = true;
      this.state.stats.finishedAt = Date.now();
      this.state.stats.finishedActiveMs = Math.round(this.state.stats.activeMs);
      logEvent(this.state, 'finished');
      this.saveNow();
    }
    this.sfx('chime');
    this.updateHud();
    const minutes = Math.round((this.state.stats.finishedActiveMs ?? this.state.stats.activeMs) / 60000);
    const hints = Object.values(this.state.hints).reduce((a, b) => a + b, 0);
    const wrong = Object.values(this.state.wrong).reduce((a, b) => a + b, 0);
    const memories = this.state.clues.filter((id) => CLUES[id]?.memory).map((id) => CLUES[id].title);
    this.ui.ending({
      title: 'De verzamelzaal',
      text: `${CLUES['c.finalLetter'].text}\n\nDe kaarsen branden, het vuur knettert, en door de oude gang hoor je stemmen dichterbij komen.`,
      minutes, hints, wrong, memories,
      onFeedback: (text) => this.copyFeedback(text, minutes),
      onContinue: () => {},
    });
  }

  openPanel(kind: string) {
    const s = this.state;
    logEvent(s, 'panel', kind);
    if (this.slice && kind === 'b01') { this.slice.b01Panel(); return; }
    if (this.slice && kind === 'drawerLock') { this.slice.drawerPanel(); return; }
    const tryCode = (p: 'drawerLock' | 'studyLock') => (seq: string[]) => {
      const r = submitCode(s, p, seq);
      logEvent(s, r.ok ? 'code-ok' : 'code-wrong', p);
      this.act(r);
      return r.ok;
    };
    if (kind === 'drawerLock') {
      this.ui.dialLock('Slot op de lade', 'Drie draaiwieltjes met tekeningetjes. Zet ze in de goede volgorde.', LOCK_OPTIONS.drawerLock, 3, tryCode('drawerLock'));
    } else if (kind === 'studyLock') {
      this.ui.buttonLock('Slot op het bureau', 'Drie koperen knoppen: put, schuur en vuur. Druk ze in de goede volgorde.', LOCK_OPTIONS.studyLock, 3, tryCode('studyLock'));
    } else if (kind === 'service' || kind === 'catalog' || kind === 'console') {
      this.placePanel(kind === 'service' ? 'svc' : kind === 'catalog' ? 'cat' : 'con');
    } else if (kind === 'boslust') {
      this.ui.digitLock('Cijferslot van BOSLUST', 'Vier cijferwieltjes van 0 tot 9. Je ziet pas of het klopt als je het probeert.', 4, (digits) => {
        const r = submitDigits(s, digits);
        logEvent(s, r.ok ? 'code-ok' : 'code-wrong', 'boslust');
        this.act(r);
        return r.ok;
      });
    } else if (kind === 'billiard') {
      this.ui.billiard((cells) => {
        const r = submitBilliard(s, cells);
        this.act(r);
        if (r.ok) setTimeout(() => this.ui.showClue('mem.billiard.scoreboard', true), 600);
        return r.ok;
      });
    }
  }

  private placePanel(k: PlaceKind) {
    const s = this.state;
    const tagName: Record<string, string> = { warm: 'Label: dampende terrine', bloem: 'Label: gieter met een tulp', koud: 'Label: melkbus met kaas' };
    const lineName: Record<string, string> = { muren: 'doorgetrokken lijn', water: 'gestreepte lijn', paden: 'gestippelde lijn' };
    const lineIcon = (id: string) => `<svg width="56" height="20" viewBox="0 0 56 20" aria-hidden="true"><line x1="4" y1="10" x2="52" y2="10" stroke="#2b2118" stroke-width="4" stroke-linecap="round" ${id === 'water' ? 'stroke-dasharray="10 6"' : id === 'paden' ? 'stroke-dasharray="1 7"' : ''}/></svg>`;
    const cur = slotContents(s, k);
    const conf = k === 'svc'
      ? { title: 'Dienstrooster', intro: `“${SERVICE.rule}” Hang elk label in het vak waar die wagen heen moet.`, slots: SERVICE.slots.map((x) => ({ id: x.id, label: x.name, icon: symbolSvg(x.sym, 40) })), html: (id: string) => symbolSvg(SERVICE.tags.find((t) => t.id === id)!.sym, 46), name: (id: string) => tagName[id] ?? id }
      : k === 'cat'
        ? { title: 'Leestafel', intro: 'Elk boek terug in het vak van zijn kamer. De vakken zijn gemarkeerd met de vorm van een tabblad.', slots: CATALOG.sockets.map((x) => ({ id: x.id, label: SYMBOLS[x.tab].name, icon: symbolSvg(x.tab, 40) })), html: (id: string) => `<span class="book">${symbolSvg(CATALOG.books.find((b) => b.id === id)!.sym, 44)}</span>`, name: (id: string) => CATALOG.books.find((b) => b.id === id)!.cover }
        : { title: 'Routekast', intro: 'Drie zegelvakken, elk gemarkeerd met een lijnsoort van de kaart.', slots: CONSOLE_SOCKETS.map((x) => ({ id: x, label: lineName[x], icon: lineIcon(x) })), html: (id: string) => itemIcon(id, 44), name: (id: string) => ITEMS[id].name };
    this.ui.place({
      title: conf.title, intro: conf.intro,
      slots: conf.slots.map((x) => ({ ...x, piece: cur[x.id] })),
      pieces: loosePieces(s, k), pieceHtml: conf.html, pieceName: conf.name, done: placeSolved(s, k),
      empty: k === 'con' ? 'Je hebt geen zegels meer bij je.' : 'Alles hangt of ligt op een plek. Klopt het niet, pak dan iets terug.',
      onPlace: (slot, piece) => {
        const r = placePiece(s, k, slot, piece);
        logEvent(s, r.ok ? 'place' : 'place-wrong', `${k}.${slot}`);
        this.act(r);
        if (placeSolved(s, k)) this.ui.closeModal(); else this.placePanel(k);
      },
      onTake: (slot) => { this.act(takePiece(s, k, slot)); this.placePanel(k); },
    });
  }

  // ------------------------------------------------------------------ player-facing menus
  select(item: string | null) {
    this.selected = item;
    this.ui.setHeld(item ? ITEMS[item].name : null, item);
    if (item) this.ui.toast(`${ITEMS[item].name} in de hand. Richt op iets en gebruik de actieknop.`);
  }
  openBag() {
    this.ui.inventory({
      items: this.state.inventory,
      selected: this.selected,
      torchOn: !!this.state.lit.torch,
      onSelect: (id) => this.select(id),
      onTorch: () => this.toggleTorch(),
      onRead: (id) => {
        if (this.slice) { this.slice.readItem(id); return; }
        const c = ITEMS[id].readClue;
        if (c) {
          addClue(this.state, c);
          this.ui.showClue(c, false);
          this.changed();
        }
      },
    });
  }
  toggleTorch() {
    if (!has(this.state, 'torch')) return;
    this.state.lit.torch = !this.state.lit.torch;
    this.sfx('switch');
    this.changed();
  }
  openNotebook(tab?: string) {
    if (this.slice) { this.slice.notebook(); return; }
    if (!has(this.state, 'notebook')) {
      this.ui.toast('Je hebt je notitieboek nog niet. Het ligt op de tafel.');
      return;
    }
    const s = this.state;
    const tracked = s.track && s.track !== 'auto' ? s.track : null;
    const threads = THREADS.filter((t) => t.id !== 'start' || !threadDone(s, 'start')).filter((t) => t.id !== 'D' || flag(s, 'basementOpen') || SEALS.every((x) => owns(s, x)) || SEALS.some((x) => owns(s, x)))
      .map((t) => ({
        id: t.id, title: t.title, sub: t.sub, done: threadDone(s, t.id), next: threadNext(s, t.id).text, tracked: tracked === t.id,
        started: PUZZLES.some((p) => p.thread === t.id && p.discovered(s)),
      }));
    this.ui.notebook({
      clues: s.clues, solved: new Set(PUZZLES.filter((p) => p.solved(s)).map((p) => p.id)), threads, tab,
      onTrack: (id) => { s.track = id; logEvent(s, 'track', id); this.changed(); this.openNotebook('d'); },
      onMap: s.scene === 'estate' ? () => this.openMap(() => this.openNotebook()) : undefined,
    });
  }
  /** What blocks a puzzle right now (missing tools or earlier steps), phrased as the next step. */
  private prerequisite(p: PuzzleDef): string | null {
    if (p.available(this.state)) return null;
    const s = this.state;
    const need: Record<string, () => string> = {
      'a.service': () => 'Open eerst de lade in de hal.',
      'b.catalog': () => 'Open eerst de lade in de hal.',
      'a.cabinet': () => 'De serre zit op slot. De serresleutel krijg je van het dienstrooster in de keuken.',
      'b.study': () => 'Het bureau zit achter de deur van de studeerkamer. De messing sleutel ligt in de lade van de leestafel in de bibliotheek.',
      'c.shed': () => 'De schuur zit op slot. De schuursleutel ligt in de lade in de hal.',
      'c.fire': () => 'Zonder droog aanmaakhout brandt er niets. Dat ligt in de schuur.',
      'd.basement': () => `Je mist nog: ${SEALS.filter((x) => !owns(s, x)).map((x) => ITEMS[x].name.toLowerCase()).join(', ')}.`,
      'd.console': () => 'Eerst moet de kelderdeur open.',
      'd.cipher': () => 'Eerst moet de route in de kelder hersteld zijn.',
      'd.plates': () => 'Eerst moet de deur van BOSLUST open.',
      'd.finale': () => 'Eerst moeten de platen in de wortelgang goed staan.',
    };
    return need[p.id]?.() ?? null;
  }
  openHint(puzzleId?: string) {
    if (this.slice) { this.slice.hints(puzzleId); return; }
    const s = this.state;
    const open = openPuzzles(s);
    if (!open.length) {
      this.ui.showText('Hint', s.finished ? 'Je hebt alles gevonden. Kijk gerust nog rond.' : 'Er is nu niets open om een hint over te geven. Volg de doelregel bovenin.');
      return;
    }
    const t = activeThread(s);
    const tn = threadNext(s, t);
    const preferred = tn.puzzle && open.includes(tn.puzzle) ? tn.puzzle : null;
    const p = open.find((q) => q.id === puzzleId) ?? preferred ?? currentPuzzle(s) ?? open[0];
    const pt = THREADS.find((x) => x.id === p.thread);
    const lastId = [...s.clues].reverse().find((id) => !CLUES[id]?.memory && CLUE_GROUP[id]?.thread === p.thread);
    const pre = this.prerequisite(p);
    this.ui.hints({
      title: p.title,
      hints: p.hints,
      shown: s.hints[p.id] ?? 0,
      choices: open.map((q) => ({ id: q.id, title: q.title })),
      current: p.id,
      thread: pt?.title,
      last: lastId ? `${CLUES[lastId].title}` : null,
      next: pre ?? threadNext(s, p.thread as ThreadId).text ?? p.objective,
      onPick: (id) => this.openHint(id),
      onMore: () => {
        const lvl = viewHint(s, p.id);
        logEvent(s, `hint${lvl}`, p.id);
        this.saveSoon();
      },
    });
  }
  openPause(startScreen = false) {
    const canLock = matchMedia('(pointer: fine)').matches && 'requestPointerLock' in HTMLElement.prototype;
    const canFs = !!document.documentElement.requestFullscreen && !document.fullscreenElement;
    this.ui.pause(this.settings, {
      startScreen,
      playMinutes: Math.round(this.state.stats.activeMs / 60000),
      build: BUILD,
      onChange: (s) => {
        const qualityChanged = s.quality !== this.settings.quality;
        Object.assign(this.settings, s);
        storage.set(SETTINGS_KEY, JSON.stringify(this.settings));
        this.audio.setMuted(s.muted);
        this.applyQuality(qualityChanged);
      },
      onRestart: () => this.wipeAndReload(),
      onPointerLock: canLock && !startScreen ? () => this.input.requestPointerLock() : undefined,
      onFullscreen: canFs ? () => document.documentElement.requestFullscreen?.().catch(() => {}) : undefined,
      onMap: !startScreen && this.state.scene === 'estate' ? () => this.openMap(() => this.openPause()) : undefined,
    });
  }
  private key(code: string) {
    if (code === 'pointerunlock') {
      if (!this.ui.modalOpen && this.running) this.openPause();
      return;
    }
    if (this.ui.modalOpen) {
      if (code === 'Escape') this.ui.closeModal();
      return;
    }
    if (code === 'Escape') this.openPause();
    else if (code === 'KeyE' || code === 'Enter' || code === 'Space') this.doAction();
    else if (code === 'KeyI') this.openBag();
    else if (code === 'KeyN') this.openNotebook();
    else if (code === 'KeyH') this.openHint();
    else if (code === 'KeyF') this.toggleTorch();
    else if (code === 'KeyL') this.input.requestPointerLock();
  }

  // ------------------------------------------------------------------ interaction picking
  private pickAt(ndcX: number, ndcY: number): { it: Interactable; tooFar: boolean } | null {
    const w = this.world;
    if (!w) return null;
    const eye = this.camera.position;
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    this.raycaster.far = 8;
    const hits: THREE.Object3D[] = [];
    for (const it of w.items) {
      if (it.focus.distanceTo(eye) > it.reach + 6) continue;
      if (!visible(it.obj) || w.isCulled(it.obj)) continue; // render culling also removes input eligibility
      it.obj.updateWorldMatrix(true, true); // animated doors/drawers: never pick against a stale pose
      hits.push(...it.hit);
    }
    if (!hits.length) return null;
    const res = this.raycaster.intersectObjects(hits, false);
    for (const h of res) {
      const id = h.object.userData.interactId as string;
      const it = w.byId.get(id);
      if (!it || it.label() === null) continue;
      // line of sight: walls and closed doors between the eye and the hit point block interaction
      const p = h.point;
      if (w.col.segmentBlocked(eye.x, eye.y, -eye.z, p.x, p.y, -p.z, it.ignore)) return null;
      return { it, tooFar: h.distance > it.reach };
    }
    return null;
  }

  private tapAt(clientX: number, clientY: number) {
    if (this.ui.modalOpen) return;
    if (this.slice && performance.now() - this.modalClosedAt < 400) return; // DEV-01: no click-through after closing an overlay
    const r = this.canvas.getBoundingClientRect();
    const p = this.pickAt(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    if (!p) return;
    if (p.tooFar) this.ui.toast('Loop er wat dichter naartoe.');
    else this.perform(p.it);
  }

  doAction() {
    if (this.ui.modalOpen || this.switching) return;
    if (this.target) this.perform(this.target);
  }

  /** Held-item action label for this target, or null when the default action applies. */
  private itemAction(it: Interactable): string | null {
    const sel = this.selected;
    if (!sel || !it.acceptsItems || !it.useItem || !ITEMS[sel]) return null;
    return it.itemLabel ? it.itemLabel(sel) : `Gebruik: ${ITEMS[sel].name}`;
  }

  private perform(it: Interactable) {
    if (this.itemAction(it) !== null) it.useItem!(this.selected!);
    else it.run();
  }

  private actionLabel(it: Interactable): string | null {
    const l = it.label();
    if (l === null) return null;
    const a = this.itemAction(it) ?? l;
    // DEV-01: every verb names its object ("Openen: deur", "Slot bekijken: lade")
    if (this.slice && !a.includes(':')) {
      const noun = it.id.startsWith('door.') ? 'deur' : /drawer|desk|compartment/.test(it.id) ? 'lade' : it.id.startsWith('kitchen.hatch') ? 'luik' : null;
      if (noun) return `${a}: ${noun}`;
    }
    return a;
  }

  // ------------------------------------------------------------------ frame loop
  private frame = (now: number) => {
    if (!this.running) return;
    requestAnimationFrame(this.frame);
    if (document.hidden) return;
    const realMs = Math.max(0, now - this.last); // uncapped wall time: FPS + playtest timing
    const dt = Math.min(0.1, realMs / 1000); // capped simulation step
    this.last = now;
    if (!this.world || this.contextLost) return;
    this.account(Math.min(realMs, 5000)); // off-tab time is excluded via visibilitychange; cap only guards stalls
    this.tick(dt);
    this.renderer.render(this.world.scene, this.camera);
    this.frameMs[this.frameIdx++ % this.frameMs.length] = realMs;
    this.debugFrame(dt);
  };

  /** Playtest timing from real elapsed time: reading panels counts as active, the pause menu as paused. */
  private account(ms: number) {
    const st = this.state.stats;
    if (this.ui.modalKind === 'pause') st.pausedMs += ms;
    else st.activeMs += ms;
    if (this.movedLastTick) st.moveMs += ms;
  }
  private frameMs = new Float32Array(240);
  private frameIdx = 0;
  private movedLastTick = false;
  private hiddenAt = 0;
  /** Median FPS and 95th-percentile frame time over the last ~240 real frames. */
  frameStats() {
    const n = Math.min(this.frameIdx, this.frameMs.length);
    if (!n) return { fps: 0, medianMs: 0, p95Ms: 0, frames: 0 };
    const a = Array.from(this.frameMs.subarray(0, n)).sort((x, y) => x - y);
    const med = a[Math.floor(n / 2)], p95 = a[Math.min(n - 1, Math.floor(n * 0.95))];
    return { fps: med > 0 ? Math.round(1000 / med) : 0, medianMs: +med.toFixed(1), p95Ms: +p95.toFixed(1), frames: n };
  }

  /** One simulation step (input → player → world → picking). Also used by automated tests at a fixed dt. */
  tick(dt: number) {
    this.time += dt;
    const w = this.world;
    if (!w) return;
    const paused = this.ui.modalOpen || this.switching;
    this.movedLastTick = false;
    if (!paused) {
      this.input.sample();
      let mx = this.input.moveX, my = this.input.moveY, run = this.input.runAmt;
      if (this.autopilot) {
        const ap = this.autopilot;
        const dx = ap.x - this.player.x, dz = ap.z - this.player.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.25) {
          mx = my = 0;
        } else {
          // steer like a thumb on the joystick: the move vector is relative to camera yaw
          const want = Math.atan2(dx, dz);
          const rel = want - this.player.yaw;
          const k = Math.min(1, d / 0.8);
          mx = Math.sin(rel) * k;
          my = Math.cos(rel) * k;
          run = ap.run ? 1 : 0;
        }
      }
      const [lx, ly] = this.input.consumeLook();
      this.player.look(lx, ly);
      if (w.id === 'home' && !this.autopilot) {
        // tutorial progress for the coach line (looked around / walked a little)
        this.lookAcc += Math.abs(lx) + Math.abs(ly);
        if (!this.state.flags.tLooked && this.lookAcc > 0.6) { this.state.flags.tLooked = true; this.updateHud(); }
        if (this.state.flags.tLooked && !this.state.flags.tWalked && this.player.distance > 1.5) { this.state.flags.tWalked = true; this.updateHud(); }
      }
      const px = this.player.x, pz = this.player.z;
      this.player.update(dt, mx, my, run, w.col);
      this.movedLastTick = Math.abs(this.player.x - px) + Math.abs(this.player.z - pz) > 1e-4;
    }
    this.player.applyCamera(this.camera);
    this.cullTimer -= dt;
    if (this.cullTimer <= 0) {
      this.cullTimer = 0.12; // DEV-03: indoor outdoor-view test (World.outdoorInView) needs a quick cadence
      w.updateCulling(this.camera.position, this.camera);
      if (w.id === 'estate') this.markVisited();
    }
    w.update(dt, this.time);
    if (this.pool) {
      // DEV-04C-R: the pool ranks a source in view + line of sight first (cone: half the horizontal FOV + 10°)
      const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect) + THREE.MathUtils.degToRad(10);
      this.lightView.dir.copy(this.camera.getWorldDirection(this.lightView.dir)); this.lightView.cosHalf = Math.cos(Math.min(Math.PI * 0.95, half));
      this.pool.update(dt, this.time, w.lamps, this.camera.position, this.extras.rooms, (d) => this.state.open[d] === true, this.lightView);
    }
    tickFires(this.time, this.settings.reducedMotion);
    const targetDusk = Math.min(1, (solvedCount(this.state) / REQUIRED_COUNT) * 0.85 + (this.state.finished ? 0.15 : 0));
    this.dusk += (targetDusk - this.dusk) * Math.min(1, dt * 0.3);
    // art-refresh lighting comparison (opt-in): indoor factor for the environment, gain for fixture light
    this.indoor += ((w.hereRoom !== 'out' ? 1 : 0) - this.indoor) * Math.min(1, dt * 2.5);
    if (this.pool) this.pool.gain = ART.light === 'sample' ? 1 + 0.7 * this.indoor : 1; // DEV-04C: interiors lean on their fixtures (env pulls back sun + fill)
    this.extras.env?.update(this.dusk, this.camera.position, this.indoor);
    this.audio.dusk = this.dusk;
    this.torch.intensity = this.state.lit.torch ? 30 : 0;
    // pick reticle target
    if (!paused) {
      const p = this.pickAt(0, 0);
      const it = p && !p.tooFar ? p.it : null;
      this.target = it;
      const al = it ? this.actionLabel(it) : null;
      this.ui.setTarget(al, al, it && this.itemAction(it) !== null ? this.selected : null);
    }
    this.updateAudio(dt);
    // periodic safe-position save
    this.poseTimer -= dt;
    if (this.poseTimer <= 0) {
      this.poseTimer = 4;
      const sup = w.col.supportHeight(this.player.x, this.player.z, this.player.y, PLAYER.stepUp);
      if (Math.abs(sup - this.player.y) < 0.05) {
        this.state.player[w.id] = this.player.pose();
        this.saveSoon();
      }
    }
  }

  private updateAudio(dt: number) {
    const w = this.world!;
    const eye = this.camera.position;
    let fire = 0, water = 0, steam = 0;
    for (const e of w.emitters) {
      if (!e.on()) continue;
      const v = Math.max(0, 1 - e.pos.distanceTo(eye) / (e.kind === 'water' ? 9 : 10));
      if (e.kind === 'fire') fire = Math.max(fire, v);
      else if (e.kind === 'water') water = Math.max(water, v);
      else steam = Math.max(steam, v);
    }
    const indoor = this.extras.isIndoor?.(this.player.x, this.player.z, this.player.y) ?? true;
    this.audio.update(dt, { indoor, fire, water, steam });
    // footsteps: hooked once (the closure reads the current world's surface lookup), not re-created every frame
    this.player.onStep ??= (e) => this.audio.step(this.extras.surfaceAt?.(this.player.x, this.player.z, this.player.y) ?? 'wood', e.gain, e.foot);
  }

  // ------------------------------------------------------------------ HUD + persistence
  updateHud() {
    const s = this.state;
    this.ui.setNotebookEnabled(has(s, 'notebook'));
    if (s.scene === 'home') {
      this.ui.setChecklist([
        ...ESSENTIALS.map((i) => ({ name: ITEMS[i].name, done: has(s, i) })),
      ]);
      this.ui.setObjective(this.coachLine());
    } else {
      this.ui.setChecklist(null);
      if (s.finished) this.ui.setObjective('Je hebt de verzamelzaal gevonden. Kijk gerust nog rond.');
      else if (this.slice) this.ui.setObjective(this.slice.objectiveLine());
      else {
        const t = activeThread(s);
        const n = threadNext(s, t);
        const title = THREADS.find((x) => x.id === t)?.title;
        this.ui.setObjective(t === 'start' ? n.text : `${title}: ${n.text}`);
      }
    }
  }

  /** Stop saving first: the pagehide handler must not write the old state back during the reload. */
  wipeAndReload() {
    this.running = false;
    clearTimeout(this.saveTimer);
    storage.set(SAVE_KEY, JSON.stringify(this.state));
    this.stashSave();
    location.reload();
  }

  private mapView() {
    return { pose: this.player.pose(), visited: (id: string) => !!this.state.flags[`visited.${id}`], sites: MAP_SITES, labels: !this.slice };
  }
  mapSvg() {
    return estateMapSvg(this.mapView());
  }
  /** Map with level tabs; the basement and the hill appear once discovered. */
  openMap(onBack?: () => void) {
    const v = this.mapView();
    const s = this.state;
    const levels = MAP_LEVELS.filter((l) => l.id !== 'b' || flag(s, 'basementOpen')).filter((l) => l.id !== 'ug' || flag(s, 'boslustOpen'));
    const views = levels.map((l) => ({ id: l.id, label: l.label, svg: l.id === 'estate' ? estateMapSvg(v) : floorPlanSvg(l.id, v) }));
    const room = this.extras.rooms?.roomAt(this.player.x, this.player.y + 0.8, this.player.z) ?? 'out';
    const lv: MapLevel = levelAt(room);
    this.ui.map(views, views.some((x) => x.id === lv) ? lv : 'estate', onBack, 'Blauwe pijl: jij. Vraagtekens: plekken die je nog niet hebt bezocht.');
  }
  /** Mark map landmarks as visited when the player comes near (checked a few times per second). */
  private markVisited() {
    for (const m of MAP_SITES) {
      const k = `visited.${m.id}`;
      if (!this.state.flags[k] && Math.hypot(this.player.x - m.x, this.player.z - m.z) < 9) {
        this.state.flags[k] = true;
        logEvent(this.state, 'visited', m.id);
        this.saveSoon();
      }
    }
  }

  /** In-context tutorial: one short cue at a time; each disappears once the player has done it. */
  private coachLine(): string {
    const s = this.state, f = s.flags, touch = matchMedia('(pointer: coarse)').matches;
    if (!f.tLooked) return touch ? 'Sleep met je duim over de rechterkant om rond te kijken.' : 'Sleep met de muis om rond te kijken (of Pauze → Muis vastzetten).';
    if (!f.tWalked) return touch ? 'Duw met je linkerduim om te lopen. Verder duwen = sneller.' : 'Loop met W A S D of de pijltjes (Shift = rennen).';
    if (!has(s, 'invitation')) return touch ? 'Richt op de envelop op de ronde tafel en tik op de grote knop — of tik direct op de envelop.' : 'Richt op de envelop op de ronde tafel en druk E — of klik erop.';
    if (!s.open['home.drawer'] && !has(s, 'frontKey')) return 'Open de lade van het dressoir tegen de muur.';
    if (!has(s, 'frontKey')) return 'Pak de sleutel uit de lade.';
    const missing = tutorialMissing(s);
    if (missing.length) return `Pak ook nog: ${missing.map((m) => ITEMS[m].name.toLowerCase()).join(', ')}.`;
    if (!f.usedItemTutorial) return 'Klaar om te gaan. Probeer eerst: Tas → lucifers in de hand nemen → kaars aansteken. Of vertrek via de voordeur.';
    return 'Alles ingepakt. Vertrek via de voordeur.';
  }
  private lookAcc = 0;
  private readonly lightView: LightView = { dir: new THREE.Vector3(0, 0, -1), cosHalf: 0.5, blocked: (x0, y0, z0, x1, y1, z1) => !!this.world?.col.segmentBlocked(x0, y0, z0, x1, y1, z1) };

  saveSoon() {
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.saveNow(), 300);
  }
  saveNow() {
    clearTimeout(this.saveTimer);
    if (!this.running) return; // never overwrite a save from the start screen
    if (this.world && !this.switching) {
      const sup = this.world.col.supportHeight(this.player.x, this.player.z, this.player.y, PLAYER.stepUp);
      if (Math.abs(sup - this.player.y) < 0.05) this.state.player[this.world.id] = this.player.pose();
    }
    if (!storage.set(SAVE_KEY, JSON.stringify(this.state))) {
      if (!this.warnedSave) this.ui.toast('Let op: voortgang kan op dit apparaat niet worden bewaard (privévenster?).', 6000);
      this.warnedSave = true;
    }
  }
  private warnedSave = false;

  private copyFeedback(text: string, minutes: number) {
    const s = this.state;
    const st = s.stats;
    const min = (ms: number | null) => (ms === null ? null : +(ms / 60000).toFixed(1));
    const report = {
      game: 'Feh Lu We prototype', build: BUILD, finished: s.finished,
      minutes: { reported: minutes, activeIncludingReading: min(st.activeMs), atFinish: min(st.finishedActiveMs), moving: min(st.moveMs), pausedOrHidden: min(st.pausedMs) },
      hints: s.hints, wrongAttempts: s.wrong, cluesFound: s.clues.length,
      device: navigator.userAgent, quality: this.settings.quality, feedback: text,
      events: s.events,
    };
    const str = JSON.stringify(report, null, 2);
    navigator.clipboard?.writeText(str).then(
      () => this.ui.toast('Gekopieerd! Plak het in de groepsapp.'),
      () => this.ui.showText('Kopieer dit handmatig', str),
    ) ?? this.ui.showText('Kopieer dit handmatig', str);
  }

  // ------------------------------------------------------------------ rendering quality
  applyQuality(rebuildPool = false) {
    const high = this.settings.quality === 'high';
    document.body.classList.toggle('reduced-motion', this.settings.reducedMotion);
    if (this.pool) this.pool.reducedMotion = this.settings.reducedMotion;
    if (this.world) this.world.reducedMotion = this.settings.reducedMotion;
    const dpr = Math.min(window.devicePixelRatio || 1, high ? 1.5 : 1);
    this.renderer.setPixelRatio(dpr);
    const shadowsChanged = this.renderer.shadowMap.enabled !== high;
    this.renderer.shadowMap.enabled = high;
    const mobile = matchMedia('(pointer: coarse)').matches;
    this.extras.env?.setShadows(high, mobile ? 1024 : 2048);
    if (this.world && shadowsChanged) {
      this.world.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m) m.needsUpdate = true;
      });
    }
    if (this.world) {
      if (rebuildPool && this.pool) {
        for (const l of this.pool.lights) { this.world.scene.remove(l); l.dispose(); }
        this.pool = new LightPool(this.world.scene, high ? 4 : 3);
        this.pool.reducedMotion = this.settings.reducedMotion;
      }
    }
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep a sensible horizontal FOV in portrait
    this.camera.fov = w < h ? 82 : 68;
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------ debug (?debug=1)
  private buildDebug() {
    const el = document.createElement('div');
    el.id = 'debug';
    document.getElementById('app')!.appendChild(el);
    this.debugEl = el;
    el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (!b) return;
      if (b.dataset.cp) {
        const cp = this.world?.checkpoints.find((c) => c.name === b.dataset.cp);
        if (cp) this.player.setPose(cp.pose);
      } else if (b.dataset.reset) {
        this.wipeAndReload();
      }
    });
  }
  private debugFrame(dt: number) {
    this.fpsAcc.t += dt;
    if (this.fpsAcc.t >= 0.5) {
      const fs = this.frameStats();
      this.fpsAcc.fps = fs.fps;
      this.fpsAcc.t = 0;
      if (this.debugEl) {
        const info = this.renderer.info.render;
        const f = Object.keys(this.state.flags).filter((k) => this.state.flags[k]).join(', ');
        this.debugEl.innerHTML = `FPS ${fs.fps} (median) · p95 ${fs.p95Ms} ms · calls ${info.calls} · tris ${info.triangles} · veg ${vegPathLabel()}<br>` +
          `pos ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(2)}, ${this.player.z.toFixed(1)} yaw ${(this.player.yaw * 57.3).toFixed(0)}°<br>` +
          `target ${this.target?.id ?? '—'} · room ${this.pool?.here ?? '—'} · lights ${this.pool?.assigned().map((a) => a ?? '·').join(' ') ?? ''}<br>flags: ${f || '—'}<br>` +
          (this.slice ? `${this.slice.debugInfo(this.target?.id ?? null)}<br>` : '') +
          (this.world?.checkpoints.map((c) => `<button data-cp="${c.name}">${c.name}</button>`).join('') ?? '') +
          `<button data-reset="1">reset</button>`;
      }
    }
  }

  /** Flame flutter on (1) or held steady (0) — reduced-motion check. */
  fireMotion() { return FIRE_UNIFORMS.uMotion.value; }

  /** Stats for automated tests and the debug overlay. */
  metrics() {
    const info = this.renderer.info;
    return {
      fps: this.fpsAcc.fps,
      frame: this.frameStats(),
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      multiDraw: CAPS.multiDraw,
      pos: this.player.pose(),
      target: this.target?.id ?? null,
      label: this.target ? this.actionLabel(this.target) : null,
    };
  }
}

function visible(o: THREE.Object3D) {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export const TEST_HOOKS = AUTOTEST || DEBUG;
export { PUZZLES };
