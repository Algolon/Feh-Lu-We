// Game orchestrator: renderer + loop, input → player, interaction picking, save/restore, scenes, UI glue.
import * as THREE from 'three';
import {
  type GameState, type Settings, type SceneId, type PlayerPose, SAVE_KEY, SETTINGS_KEY, defaultState, parseSave, parseSettings, storage, addClue, has,
} from './state';
import { Input } from '../player/input';
import { Player, PLAYER } from '../player/player';
import { World, LightPool, type GameApi, type Interactable } from '../interactions/world';
import { UI } from '../ui/ui';
import { Audio } from '../audio/audio';
import {
  type Outcome, type Sfx, PUZZLES, currentPuzzle, viewHint, tutorialMissing, leaveHome as leaveHomeRule, submitCode, LOCK_OPTIONS,
  placeInSlot, takeFromSlot, submitBilliard, solvedCount,
} from '../puzzles/rules';
import { ITEMS, ESSENTIALS } from '../content/items';
import { MEMORIES } from '../content/memories';
import { buildHome } from '../world/home';
import { buildEstate, estateMapSvg } from '../world/estate';
import type { Env } from '../world/env';

export interface SceneExtras {
  env?: Env;
  isIndoor?: (x: number, z: number, y: number) => boolean;
  surfaceAt?: (x: number, z: number, y: number) => 'grass' | 'wood' | 'stone';
}

const DEBUG = new URLSearchParams(location.search).has('debug');
const AUTOTEST = new URLSearchParams(location.search).has('autotest');

export class Game implements GameApi {
  state: GameState;
  settings: Settings;
  selected: string | null = null;
  readonly playerRadius = PLAYER.radius;
  readonly ui = new UI();
  readonly audio = new Audio();
  readonly player = new Player();
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
  private fpsAcc = { n: 0, t: 0, fps: 0 };
  private debugEl: HTMLDivElement | null = null;
  private dusk = 0;
  autopilot: { x: number; z: number; run: boolean } | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.settings = parseSettings(storage.get(SETTINGS_KEY), coarse);
    this.state = parseSave(storage.get(SAVE_KEY)) ?? defaultState();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.settings.quality === 'high', powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.ui.toast('Het beeld is even weggevallen. Herlaad de pagina als het niet terugkomt; je voortgang is bewaard.', 8000);
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
        this.audio.suspend();
        this.saveNow();
      } else if (this.running) {
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
    await this.audio.unlock();
    this.audio.setMuted(this.settings.muted);
    if (fresh) {
      storage.remove(SAVE_KEY);
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
    if (this.state.finished) this.ui.toast('Je hebt het weekend al gevonden. Kijk gerust nog rond.');
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
    world.syncAll();
    world.setupCulling();
    this.cullTimer = 0;
    this.restorePose(world, this.state.player[id]);
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
  changed() {
    if (this.selected && !has(this.state, this.selected)) this.select(null);
    this.world?.syncAll();
    this.updateHud();
    this.saveSoon();
  }
  inspect(clueId: string) {
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
      this.saveNow();
    }
    this.sfx('chime');
    const minutes = Math.round(this.state.stats.playMs / 60000);
    const hints = Object.values(this.state.hints).reduce((a, b) => a + b, 0);
    const wrong = Object.values(this.state.wrong).reduce((a, b) => a + b, 0);
    this.ui.ending({
      title: 'Iedereen is er',
      text: `${MEMORIES['mem.cottage.ending'].text}\n\nDe tafel is gedekt, de kaarsen branden en buiten hoor je stemmen dichterbij komen. Weer een Veluwe Weekend.`,
      minutes, hints, wrong,
      onFeedback: (text) => this.copyFeedback(text, minutes),
      onContinue: () => {},
    });
  }

  openPanel(kind: string) {
    const s = this.state;
    const opens: Record<string, string> = { drawerLock: 'hall.drawer', studyLock: 'study.compartment', cabinetPanel: 'cab.upper' };
    const tryCode = (p: 'drawerLock' | 'studyLock' | 'cabinetPanel') => (seq: string[]) => {
      const r = submitCode(s, p, seq);
      if (r.ok) s.open[opens[p]] = true; // the solved lock springs open by itself
      this.act(r);
      return r.ok;
    };
    if (kind === 'drawerLock') {
      this.ui.dialLock('Slot op de lade', 'Drie draaiwieltjes met tekeningetjes. Zet ze in de goede volgorde.', LOCK_OPTIONS.drawerLock, 3, tryCode('drawerLock'));
    } else if (kind === 'studyLock') {
      this.ui.buttonLock('Slot op het bureau', 'Drie koperen knoppen: put, schuur en vuur. Druk ze in de goede volgorde.', LOCK_OPTIONS.studyLock, 3, tryCode('studyLock'));
    } else if (kind === 'cabinetPanel') {
      this.ui.buttonLock('Paneel op de bovenkast', 'Vier tegelknoppen. Druk een reeks van vier.', LOCK_OPTIONS.cabinetPanel, 4, tryCode('cabinetPanel'));
    } else if (kind === 'slots') {
      const open = () => this.ui.slots({
        left: s.slots.left ?? null, right: s.slots.right ?? null,
        candidates: s.inventory.filter((i) => !ESSENTIALS.includes(i) && !['fragment'].includes(i)),
        hint: s.clues.includes('c.fragment') ? 'Je denkt aan de snipper: links wat uit het bos komt, rechts wat uit het huis komt.' : 'Twee lege nissen in de muur, elk met een ondiepe uitsparing.',
        onPlace: (slot, item) => {
          const r = placeInSlot(s, slot, item);
          if (s.flags.cottageSolved) s.open['door.gathering'] = true;
          this.act(r);
          if (s.flags.cottageSolved) this.ui.closeModal();
          else open();
        },
        onTake: (slot) => { this.act(takeFromSlot(s, slot)); open(); },
      });
      open();
    } else if (kind === 'billiard') {
      this.ui.billiard((cells) => {
        const r = submitBilliard(s, cells);
        this.act(r);
        if (r.ok) setTimeout(() => this.ui.showClue('mem.billiard.scoreboard', true), 600);
        return r.ok;
      });
    }
  }

  // ------------------------------------------------------------------ player-facing menus
  select(item: string | null) {
    this.selected = item;
    this.ui.setHeld(item ? ITEMS[item].name : null, item ? ITEMS[item].icon : '');
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
  openNotebook() {
    if (!has(this.state, 'notebook')) {
      this.ui.toast('Je hebt je notitieboek nog niet. Het ligt op de tafel.');
      return;
    }
    this.ui.notebook(this.state.clues, this.state.scene === 'estate' ? () => this.ui.map(estateMapSvg()) : undefined);
  }
  openHint() {
    const p = currentPuzzle(this.state);
    if (!p) {
      this.ui.showText('Hint', 'Je hebt alles gevonden. Kijk gerust nog rond.');
      return;
    }
    this.ui.hints(p.title, p.hints, this.state.hints[p.id] ?? 0, () => {
      viewHint(this.state, p.id);
      this.saveSoon();
    });
  }
  openPause() {
    const canLock = matchMedia('(pointer: fine)').matches && 'requestPointerLock' in HTMLElement.prototype;
    const canFs = !!document.documentElement.requestFullscreen && !document.fullscreenElement;
    this.ui.pause(this.settings, {
      playMinutes: Math.round(this.state.stats.playMs / 60000),
      onChange: (s) => {
        const qualityChanged = s.quality !== this.settings.quality;
        Object.assign(this.settings, s);
        storage.set(SETTINGS_KEY, JSON.stringify(this.settings));
        this.audio.setMuted(s.muted);
        this.applyQuality(qualityChanged);
      },
      onRestart: () => this.wipeAndReload(),
      onPointerLock: canLock ? () => this.input.requestPointerLock() : undefined,
      onFullscreen: canFs ? () => document.documentElement.requestFullscreen?.().catch(() => {}) : undefined,
      onMap: this.state.scene === 'estate' ? () => this.ui.map(estateMapSvg()) : undefined,
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
      if (!visible(it.obj)) continue;
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

  private perform(it: Interactable) {
    if (this.selected && it.acceptsItems && it.useItem) it.useItem(this.selected);
    else it.run();
  }

  private actionLabel(it: Interactable): string | null {
    const l = it.label();
    if (l === null) return null;
    if (this.selected && it.acceptsItems) return `Gebruik: ${ITEMS[this.selected].name}`;
    return l;
  }

  // ------------------------------------------------------------------ frame loop
  private frame = (now: number) => {
    if (!this.running) return;
    requestAnimationFrame(this.frame);
    if (document.hidden) return;
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (!this.world) return;
    this.tick(dt);
    this.renderer.render(this.world.scene, this.camera);
    this.debugFrame(dt);
  };

  /** One simulation step (input → player → world → picking). Also used by automated tests at a fixed dt. */
  tick(dt: number) {
    this.time += dt;
    const w = this.world;
    if (!w) return;
    const paused = this.ui.modalOpen || this.switching;
    if (!paused) {
      this.state.stats.playMs += dt * 1000;
      this.input.sample();
      let mx = this.input.moveX, my = this.input.moveY, run = this.input.run;
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
          run = ap.run;
        }
      }
      const [lx, ly] = this.input.consumeLook();
      this.player.look(lx, ly);
      this.player.update(dt, mx, my, run, w.col);
    }
    this.player.applyCamera(this.camera);
    this.cullTimer -= dt;
    if (this.cullTimer <= 0) {
      this.cullTimer = 0.25;
      w.updateCulling(this.camera.position);
    }
    w.update(dt, this.time);
    this.pool?.update(dt, this.time, w.lamps, this.camera.position);
    const targetDusk = Math.min(1, (solvedCount(this.state) / 8) * 0.85 + (this.state.finished ? 0.15 : 0));
    this.dusk += (targetDusk - this.dusk) * Math.min(1, dt * 0.3);
    this.extras.env?.update(this.dusk, this.camera.position);
    this.audio.dusk = this.dusk;
    this.torch.intensity = this.state.lit.torch ? 30 : 0;
    // pick reticle target
    if (!paused) {
      const p = this.pickAt(0, 0);
      const it = p && !p.tooFar ? p.it : null;
      this.target = it;
      const al = it ? this.actionLabel(it) : null;
      this.ui.setTarget(al, al);
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
    this.player.onStep = () => this.audio.sfx('step', this.extras.surfaceAt?.(this.player.x, this.player.z, this.player.y) ?? 'wood');
  }

  // ------------------------------------------------------------------ HUD + persistence
  updateHud() {
    const s = this.state;
    this.ui.setNotebookEnabled(has(s, 'notebook'));
    if (s.scene === 'home') {
      this.ui.setChecklist([
        ...ESSENTIALS.map((i) => ({ name: ITEMS[i].name, done: has(s, i) })),
      ]);
      const missing = tutorialMissing(s);
      this.ui.setObjective(missing.length ? 'Pak je spullen voor het weekend.' : 'Alles ingepakt. Vertrek via de voordeur.');
    } else {
      this.ui.setChecklist(null);
      const p = currentPuzzle(s);
      this.ui.setObjective(s.finished ? 'Iedereen komt samen in het huisje.' : p ? p.objective : 'Ga naar het huisje bij de vijver.');
    }
  }

  /** Stop saving first: the pagehide handler must not write the old state back during the reload. */
  wipeAndReload() {
    this.running = false;
    clearTimeout(this.saveTimer);
    storage.remove(SAVE_KEY);
    location.reload();
  }

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
    const report = {
      game: 'Feh Lu We prototype', minutes, finished: s.finished, hints: s.hints, wrongAttempts: s.wrong,
      cluesFound: s.clues.length, device: navigator.userAgent, quality: this.settings.quality, feedback: text,
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
    this.fpsAcc.n++;
    this.fpsAcc.t += dt;
    if (this.fpsAcc.t >= 0.5) {
      this.fpsAcc.fps = Math.round(this.fpsAcc.n / this.fpsAcc.t);
      this.fpsAcc.n = 0;
      this.fpsAcc.t = 0;
      if (this.debugEl) {
        const info = this.renderer.info.render;
        const f = Object.keys(this.state.flags).filter((k) => this.state.flags[k]).join(', ');
        this.debugEl.innerHTML = `FPS ${this.fpsAcc.fps} · calls ${info.calls} · tris ${info.triangles}<br>` +
          `pos ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(2)}, ${this.player.z.toFixed(1)} yaw ${(this.player.yaw * 57.3).toFixed(0)}°<br>` +
          `target ${this.target?.id ?? '—'}<br>flags: ${f || '—'}<br>` +
          (this.world?.checkpoints.map((c) => `<button data-cp="${c.name}">${c.name}</button>`).join('') ?? '') +
          `<button data-reset="1">reset</button>`;
      }
    }
  }

  /** Stats for automated tests and the debug overlay. */
  metrics() {
    const info = this.renderer.info;
    return {
      fps: this.fpsAcc.fps,
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
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
