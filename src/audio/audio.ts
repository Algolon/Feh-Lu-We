// All sound is synthesised with WebAudio at runtime: no audio files, no licensing questions.
// The context is created/resumed only from the Start button (user gesture), and suspended when hidden.

import type { RitualMix } from '../world/wickerRitual';

type SfxName = string;
type RitualVoice = { src: AudioScheduledSourceNode; f: BiquadFilterNode | null; g: GainNode };

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private loops: Record<string, { gain: GainNode; target: number }> = {};
  private muted = false;
  private nextAmbient = 8;
  private time = 0;
  ambience: 'home' | 'estate' = 'home';
  dusk = 0; // 0 afternoon .. 1 evening; shifts ambience towards unease

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Must be called from a user gesture. */
  async unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.8;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = last * 0.6 + w * 0.4; d[i] = last; }
        this.startLoops();
      }
      if (this.ctx.state !== 'running') await this.ctx.resume();
    } catch {
      /* audio is optional */
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  suspend() { this.ctx?.suspend().catch(() => {}); }
  resume() { if (this.ctx && !this.muted) this.ctx.resume().catch(() => {}); }

  private noise(dur: number, filterType: BiquadFilterType, freq: number, q: number, vol: number, when = 0, attack = 0.005, freqEnd?: number) {
    const c = this.ctx!, t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = filterType;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, freqEnd?: number) {
    const c = this.ctx!, t = c.currentTime + when;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private lastStep = -1;
  /**
   * One footfall. Small per-step variation (filter ±7 %, level ±12 %, the two feet a touch apart) so a walk never
   * sounds like one sample repeated; never two of the same variant in a row.
   */
  step(surface: 'grass' | 'wood' | 'stone', gain = 1, foot: 0 | 1 = 0) {
    if (!this.ready || this.muted) return;
    let v = Math.floor(Math.random() * 3);
    if (v === this.lastStep) v = (v + 1) % 3;
    this.lastStep = v;
    const f = (1 + (v - 1) * 0.07) * (foot ? 0.96 : 1.03), g = gain * (0.88 + Math.random() * 0.24);
    if (surface === 'wood') { this.noise(0.1, 'bandpass', 360 * f, 1.2, 0.16 * g); this.noise(0.05, 'lowpass', 160 * f, 0.8, 0.08 * g, 0.012); }
    else if (surface === 'stone') this.noise(0.07, 'bandpass', 1300 * f, 1.5, 0.075 * g);
    else this.noise(0.14, 'highpass', 1700 * f, 0.7, 0.045 * g, 0, 0.012);
  }

  sfx(name: SfxName, surface: 'grass' | 'wood' | 'stone' = 'grass') {
    if (!this.ready || this.muted) return;
    switch (name) {
      case 'step':
        if (surface === 'wood') this.noise(0.09, 'bandpass', 380, 1.2, 0.18);
        else if (surface === 'stone') this.noise(0.06, 'bandpass', 1400, 1.5, 0.08);
        else this.noise(0.12, 'highpass', 1800, 0.7, 0.05);
        break;
      case 'click': this.tone(1200, 0.05, 'square', 0.05); break;
      case 'switch': this.tone(900, 0.04, 'square', 0.06); this.tone(600, 0.04, 'square', 0.04, 0.05); break;
      case 'pickup': this.tone(660, 0.12, 'sine', 0.18); this.tone(990, 0.2, 'sine', 0.15, 0.08); break;
      case 'success': [523, 659, 784].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.15, i * 0.09)); break;
      case 'chime': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.9, 'sine', 0.12, i * 0.14)); break;
      case 'fail': this.tone(180, 0.25, 'triangle', 0.2, 0, 120); break;
      case 'locked': for (let i = 0; i < 3; i++) this.noise(0.05, 'bandpass', 2400, 4, 0.12, i * 0.07); break;
      case 'unlock': this.noise(0.05, 'bandpass', 3000, 5, 0.15); this.tone(880, 0.3, 'sine', 0.12, 0.08); break;
      case 'door': this.tone(140, 0.5, 'sawtooth', 0.025, 0, 220); this.noise(0.4, 'bandpass', 600, 3, 0.06, 0, 0.05); break;
      case 'drawer': this.noise(0.35, 'bandpass', 500, 1, 0.12, 0, 0.03, 300); break;
      case 'fire': this.noise(0.8, 'lowpass', 400, 0.7, 0.35, 0, 0.1, 2000); break;
      case 'crank': for (let i = 0; i < 8; i++) this.noise(0.04, 'bandpass', 1800, 6, 0.12, i * 0.11); break;
      case 'steam': this.noise(1.5, 'highpass', 3000, 0.5, 0.15, 0, 0.2); break;
      case 'water': this.noise(0.5, 'lowpass', 700, 1, 0.1, 0, 0.1); break;
      default: break;
    }
  }

  private startLoops() {
    const c = this.ctx!;
    const mk = (name: string, type: BiquadFilterType, freq: number, q: number) => {
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain();
      g.gain.value = 0;
      src.connect(f).connect(g).connect(this.master!);
      src.start();
      this.loops[name] = { gain: g, target: 0 };
      return f;
    };
    mk('wind', 'lowpass', 500, 0.5);
    mk('fire', 'bandpass', 900, 0.6);
    mk('water', 'lowpass', 500, 0.8);
    mk('steam', 'highpass', 2500, 0.4);
    mk('room', 'lowpass', 180, 0.3);
  }

  /** Per-frame: set loop volumes from proximity, schedule sparse ambient events. */
  update(dt: number, levels: { indoor: boolean; fire: number; water: number; steam: number }) {
    if (!this.ready) return;
    this.time += dt;
    const set = (n: string, v: number) => {
      const l = this.loops[n];
      if (!l) return;
      if (Math.abs(l.target - v) > 0.003) {
        l.target = v;
        l.gain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.3);
      }
    };
    const outdoor = this.ambience === 'estate' && !levels.indoor;
    set('wind', outdoor ? 0.05 + 0.03 * Math.sin(this.time * 0.2) + this.dusk * 0.03 : 0.01);
    set('room', levels.indoor ? 0.05 : 0);
    // crackle: a noise floor plus random pops
    set('fire', levels.fire * 0.12);
    if (levels.fire > 0.05 && Math.random() < dt * 9 * levels.fire) this.noise(0.03, 'highpass', 2500, 1, 0.15 * levels.fire);
    set('water', levels.water * 0.06);
    set('steam', levels.steam * 0.05);
    this.nextAmbient -= dt;
    if (this.nextAmbient <= 0) {
      this.nextAmbient = 6 + Math.random() * 10;
      if (this.ambience === 'estate') this.ambientEvent(outdoor);
    }
  }

  // ------------------------------------------------------------------ DEV-04D W01: the Wickerman ritual layer
  // Own node graph (≤ 5 continuous voices: fire body, air, ember hiss = filtered loops on the shared noise buffer; the
  // drone = two oscillators a fifth apart), built on ignition and released ≈ 2.5 s after the mix falls silent or the
  // player leaves its range. Transients (crackle, deep snaps, the slow frame-drum pulse) are scheduled one-shots. The
  // campfire / candle `fire` loop is untouched. Levels come from the pure mix (wickerRitual.ritualMix) × distance gain.
  private rit: { out: GainNode; body: RitualVoice; air: RitualVoice; hiss: RitualVoice; drone: RitualVoice[]; droneGain: GainNode; idle: number } | null = null;
  private pulseIn = 0;
  /** True while the ritual nodes exist (tests / QA: created on ignition, released after the aftermath). */
  get ritualActive() { return !!this.rit; }

  ritual(dt: number, m: RitualMix | null, gain: { fire: number; close: number }, events: string[]) {
    if (!this.ready) return;
    if (!this.muted) for (const e of events) this.ritualEvent(e, Math.max(gain.fire, 0.15));
    const audible = !!m && gain.fire > 0.002 && m.body + m.air + m.hiss + m.drone + m.snap > 0.002;
    if (audible && !this.rit) this.buildRitual();
    const R = this.rit;
    if (!R) return;
    const c = this.ctx!, t = c.currentTime, M = m ?? { body: 0, crackle: 0, snap: 0, drone: 0, pulse: 0, air: 0, hiss: 0 }, f = gain.fire, cl = gain.close;
    const set = (p: AudioParam, v: number, tc = 0.3) => p.setTargetAtTime(v, t, tc);
    set(R.body.g.gain, 0.15 * M.body * f); set(R.body.f!.frequency, 300 + 600 * M.body, 0.8);
    set(R.air.g.gain, 0.045 * M.air * f * (0.75 + 0.25 * Math.sin(this.time * 0.37))); set(R.air.f!.frequency, 520 + 160 * Math.sin(this.time * 0.21), 1);
    set(R.hiss.g.gain, 0.022 * M.hiss * f);
    set(R.droneGain.gain, 0.04 * M.drone * cl, 1.5);
    if (!this.muted && audible) {
      // burning willow: quick high clicks, denser with the flames (≤ ~6 / s), and rarer deep cracks (a thump + a click)
      if (Math.random() < dt * 6 * M.crackle) this.noise(0.025 + Math.random() * 0.02, 'highpass', 2200 + Math.random() * 1500, 1, (0.05 + Math.random() * 0.07) * M.crackle * f);
      if (Math.random() < dt * 0.3 * M.snap) { this.noise(0.18, 'bandpass', 160 + Math.random() * 60, 1.4, 0.16 * f); this.noise(0.04, 'highpass', 1800, 1, 0.12 * f, 0.01); }
      // the pulse: a soft frame-drum heartbeat, ~1.9 s in the build, ~1.5 s at the peak; never faster
      this.pulseIn -= dt;
      if (M.pulse > 0.05 && cl > 0.01 && this.pulseIn <= 0) { this.tone(70, 0.4, 'sine', 0.09 * M.pulse * cl, 0, 48); this.pulseIn = 1.9 - 0.4 * M.pulse; }
    }
    R.idle = audible ? 0 : R.idle + dt;
    if (R.idle > 2.5) this.releaseRitual();
  }

  private buildRitual() {
    const c = this.ctx!, t = c.currentTime;
    const out = c.createGain(); out.gain.value = 1; out.connect(this.master!);
    const loop = (type: BiquadFilterType, freq: number, q: number): RitualVoice => {
      const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(f).connect(g).connect(out); src.start(t, Math.random() * 1.5);
      return { src, f, g };
    };
    const droneGain = c.createGain(); droneGain.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; lp.Q.value = 0.5;
    droneGain.connect(lp).connect(out);
    const osc = (type: OscillatorType, freq: number, level: number): RitualVoice => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = c.createGain(); g.gain.value = level;
      o.connect(g).connect(droneGain); o.start(t);
      return { src: o, f: null, g };
    };
    // a fifth apart (55 Hz triangle + 82.4 Hz sine, 0.3 Hz beat): a bed you feel more than hear
    this.rit = { out, body: loop('lowpass', 300, 0.7), air: loop('bandpass', 600, 0.7), hiss: loop('highpass', 3600, 0.5), drone: [osc('triangle', 55, 0.8), osc('sine', 82.7, 0.6)], droneGain, idle: 0 };
    this.pulseIn = 0.8;
  }

  private releaseRitual() {
    const R = this.rit, c = this.ctx;
    if (!R || !c) return;
    this.rit = null;
    const t = c.currentTime;
    R.out.gain.setTargetAtTime(0, t, 0.15); // fade, never cut
    for (const v of [R.body, R.air, R.hiss, ...R.drone]) { v.src.stop(t + 0.8); v.src.onended = () => { v.src.disconnect(); v.f?.disconnect(); v.g.disconnect(); }; }
    setTimeout(() => { R.droneGain.disconnect(); R.out.disconnect(); }, 1200);
  }

  /** One-shot ritual sounds (soft, restrained; `k` = distance gain). */
  private ritualEvent(name: string, k: number) {
    switch (name) {
      case 'match': this.noise(0.07, 'bandpass', 2600, 2, 0.12 * k); this.noise(0.4, 'lowpass', 900, 0.8, 0.07 * k, 0.05, 0.03, 2200); break;
      case 'strike': this.noise(0.16, 'lowpass', 750, 0.9, 0.045 * k, 0, 0.02, 1400); break; // a candle catches
      case 'puff': this.noise(0.24, 'lowpass', 520, 0.7, 0.045 * k, 0, 0.03, 180); break; // a candle goes out
      case 'ignite': this.noise(1.3, 'lowpass', 280, 0.8, 0.2 * k, 0.15, 0.3, 1500); break; // the hay takes: a soft whoomp
      case 'settle': this.tone(62, 0.7, 'sine', 0.07 * k, 0, 40); for (let i = 0; i < 6; i++) this.noise(0.05, 'bandpass', 900 + Math.random() * 900, 1.2, 0.05 * k, 0.15 + i * 0.09 + Math.random() * 0.05); break;
      case 'brush': for (let i = 0; i < 3; i++) this.noise(0.3, 'bandpass', 1500, 0.8, 0.075 * k, i * 0.55, 0.06, 650); for (let i = 0; i < 5; i++) this.noise(0.05, 'bandpass', 700 + Math.random() * 500, 1, 0.04 * k, 0.2 + i * 0.3); break;
      case 'rustle': for (let i = 0; i < 5; i++) this.noise(0.07 + Math.random() * 0.05, 'highpass', 1900 + Math.random() * 900, 0.6, 0.05 * k, i * 0.06 + Math.random() * 0.03, 0.01); break;
      case 'refill': for (let i = 0; i < 10; i++) this.noise(0.08 + Math.random() * 0.06, 'bandpass', 1500 + Math.random() * 900, 0.7, 0.05 * k, i * 0.15 + Math.random() * 0.05, 0.015); break;
      default: break;
    }
  }

  private ambientEvent(outdoor: boolean) {
    const r = Math.random();
    // Afternoon: birds. As dusk grows: owls, a far-off door, a single music-box note.
    if (outdoor && r > this.dusk * 0.8) {
      const base = 2400 + Math.random() * 1600;
      for (let i = 0; i < 2 + Math.floor(Math.random() * 4); i++) this.tone(base, 0.08, 'sine', 0.025, i * 0.12, base * (1.2 + Math.random() * 0.3));
    } else if (r < 0.33) {
      this.tone(380, 0.35, 'sine', 0.04, 0, 330);
      this.tone(380, 0.5, 'sine', 0.035, 0.5, 300);
    } else if (r < 0.66) {
      this.noise(0.12, 'lowpass', 200, 1, 0.12);
      this.noise(0.12, 'lowpass', 200, 1, 0.1, 0.3);
    } else {
      this.tone(1318, 1.4, 'sine', 0.02);
    }
  }
}
