// Game audio uses WebAudio; outdoor footsteps are edited field recordings embedded in the build.
// Other SFX and ambience remain procedurally synthesised.
// The context is created/resumed only from the Start button (user gesture), and suspended when hidden.

import { renderOutdoorFootstep, type FootstepSurface, type OutdoorFootstepSurface } from './footsteps';
import { FIELD_FOOTSTEPS_MP3, FIELD_FOOTSTEP_CLIPS } from './fieldFootsteps';

type SfxName = string;
// R05: denser, louder water glugs while the breath remains a quiet supporting layer.
export const BONG_HIT_BUBBLES = [0.25, 0.35, 0.47, 0.57, 0.69, 0.77, 0.90, 1.00, 1.12, 1.23, 1.31, 1.44, 1.55, 1.68, 1.80, 1.91, 2.02] as const;
export const BONG_HIT_WATER_LEVEL = 0.145;
export const BONG_HIT_BREATH_LEVEL = 0.045;

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
      // Decode the compact, bundled field-recording bank once. No network/CDN dependency, nor
      // decoding on each step. The backup sound only runs if browser MP3 decoding fails.
      if (!this.fieldStepBank && !this.fieldStepLoading) {
        this.fieldStepLoading = this.loadFieldSteps().finally(() => { this.fieldStepLoading = null; });
      }
      if (this.fieldStepLoading) await this.fieldStepLoading;
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
  private fieldStepBank: AudioBuffer | null = null;
  private fieldStepLoading: Promise<void> | null = null;
  private async loadFieldSteps(): Promise<void> {
    try {
      const raw = atob(FIELD_FOOTSTEPS_MP3);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      this.fieldStepBank = await this.ctx!.decodeAudioData(bytes.buffer);
    } catch {
      // On an unsupported / failed decoder keep movement audible; do not affect other SFX.
      for (const surface of ['grass', 'dirt'] as const) {
        this.outdoorBuffers[surface] = Array.from({ length: 4 }, (_, v) => {
          const pcm = renderOutdoorFootstep(surface, v, this.ctx!.sampleRate);
          const buffer = this.ctx!.createBuffer(1, pcm.length, this.ctx!.sampleRate);
          buffer.getChannelData(0).set(pcm);
          return buffer;
        });
      }
    }
  }
  private readonly outdoorBuffers: Record<OutdoorFootstepSurface, AudioBuffer[]> = { grass: [], dirt: [] };
  private readonly lastOutdoor: Record<OutdoorFootstepSurface, number> = { grass: -1, dirt: -1 };

  private outdoorStep(surface: OutdoorFootstepSurface, gain: number, foot: 0 | 1) {
    const pool = this.outdoorBuffers[surface];
    const clips = FIELD_FOOTSTEP_CLIPS[surface];
    const count = this.fieldStepBank ? clips.length : pool.length;
    if (!count) return;
    let index = Math.floor(Math.random() * count);
    if (count > 1 && index === this.lastOutdoor[surface]) index = (index + 1) % count;
    this.lastOutdoor[surface] = index;
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.fieldStepBank ?? pool[index];
    const pitch = (foot ? 0.986 : 1.014) * (0.98 + Math.random() * 0.04);
    src.playbackRate.value = pitch;
    const vol = Math.max(0, Math.min(1.2, gain)) * (this.fieldStepBank ? (surface === 'grass' ? 0.33 : 0.31) : 0.5)
      * (0.93 + Math.random() * 0.14);
    const volume = c.createGain();
    src.connect(volume).connect(this.master!);
    if (this.fieldStepBank) {
      const [offset, duration] = clips[index];
      const t = c.currentTime, audible = duration / pitch;
      volume.gain.setValueAtTime(0.0001, t);
      volume.gain.linearRampToValueAtTime(vol, t + 0.01);
      volume.gain.setValueAtTime(vol, t + Math.max(0.02, audible - 0.055));
      volume.gain.linearRampToValueAtTime(0.0001, t + audible);
      src.start(t, offset, duration);
    } else {
      volume.gain.value = vol;
      src.start();
    }
  }

  /**
   * One footfall. Outdoors, varied close Foley has a soft heel and a rustle (grass) or a dry
   * compacted crunch (paths). Indoor wood/stone retain their existing sound design.
   */
  step(surface: FootstepSurface, gain = 1, foot: 0 | 1 = 0) {
    if (!this.ready || this.muted) return;
    if (surface === 'grass' || surface === 'dirt') { this.outdoorStep(surface, gain, foot); return; }
    let v = Math.floor(Math.random() * 3);
    if (v === this.lastStep) v = (v + 1) % 3;
    this.lastStep = v;
    const f = (1 + (v - 1) * 0.07) * (foot ? 0.96 : 1.03), g = gain * (0.88 + Math.random() * 0.24);
    if (surface === 'wood') { this.noise(0.1, 'bandpass', 360 * f, 1.2, 0.16 * g); this.noise(0.05, 'lowpass', 160 * f, 0.8, 0.08 * g, 0.012); }
    else if (surface === 'stone') this.noise(0.07, 'bandpass', 1300 * f, 1.5, 0.075 * g);
    else this.noise(0.14, 'highpass', 1700 * f, 0.7, 0.045 * g, 0, 0.012);
  }

  /**
   * Tight low-voltage "bzzz" rather than a hiss/crackle. Three pitched oscillators
   * share a warm filter and a 42 Hz amplitude flutter. No noise buffer or audio
   * download; each call is one ~140 ms buzz aligned to one visual lightning arc.
   */
  private electricBuzz(volume: number) {
    const c = this.ctx!, t = c.currentTime, dur = 0.14;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, t);
    filter.Q.value = 0.65;
    const tremolo = c.createGain();
    tremolo.gain.value = 0.7;
    const flutter = c.createOscillator();
    flutter.type = 'square';
    flutter.frequency.setValueAtTime(42, t);
    const depth = c.createGain();
    depth.gain.value = 0.22;
    flutter.connect(depth).connect(tremolo.gain);

    // Short but recognisably sustained buzz with a small click-free tail.
    const envelope = c.createGain();
    const peak = 0.115 * volume;
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    envelope.gain.setValueAtTime(peak, t + dur - 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    filter.connect(tremolo).connect(envelope).connect(this.master!);

    const voices: { wave: OscillatorType; from: number; to: number; level: number }[] = [
      { wave: 'sawtooth', from: 178, to: 151, level: 0.75 },
      { wave: 'square', from: 356, to: 302, level: 0.17 },
      { wave: 'triangle', from: 89, to: 76, level: 0.27 },
    ];
    for (const voice of voices) {
      const osc = c.createOscillator();
      osc.type = voice.wave;
      osc.frequency.setValueAtTime(voice.from, t);
      osc.frequency.exponentialRampToValueAtTime(voice.to, t + dur);
      const balance = c.createGain();
      balance.gain.value = voice.level;
      osc.connect(balance).connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    }
    flutter.start(t);
    flutter.stop(t + dur + 0.01);
  }

  sfx(name: SfxName, surface: FootstepSurface = 'grass', gain = 1) {
    if (!this.ready || this.muted) return;
    switch (name) {
      case 'step': this.step(surface); break;
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
      case 'bongHit': this.bongHit(); break;
      case 'electric-zap': {
        // Audible "bzzz—bzz": one short pitched buzz for each synchronized lightning pulse.
        const v = Number.isFinite(gain) ? Math.max(0, Math.min(1, gain)) : 0;
        if (v > 0) this.electricBuzz(v);
        break;
      }
      default: break;
    }
  }

  /** R05: the water is the foreground, not a quiet series of synth beeps.
   * Irregular downward-pitched "glugs" sit in a bed of lower wet turbulence,
   * with an occasional coarse splash. No new sound file or engine loops.
   */
  private bongHit() {
    // Inhale remains perceptible, but well underneath the liquid.
    this.noise(1.68, 'bandpass', 620, 0.65, BONG_HIT_BREATH_LEVEL, 0.05, 0.18, 750);
    // Water churning in the lower glass chamber; prevents disconnected beeps.
    this.noise(2.02, 'bandpass', 310, 0.72, 0.125, 0.18, 0.14, 450);
    this.noise(1.90, 'lowpass', 230, 0.85, 0.085, 0.24, 0.13, 330);
    BONG_HIT_BUBBLES.forEach((when, i) => {
      // Rounded resonant water bubble: pitches descend as each bubble bursts.
      const frequency = 124 + ((i * 43) % 93);
      this.tone(frequency, 0.13 + (i % 3) * 0.018, 'sine',
        BONG_HIT_WATER_LEVEL * (0.88 + (i % 4) * 0.06), when, frequency * 0.53);
      // A deeper, wetter splash, not an airy hiss.
      this.noise(0.10 + (i % 3) * 0.012, 'bandpass', 330 + ((i * 97) % 380),
        1.15, 0.088 + (i % 4) * 0.007, when + 0.007, 0.012);
      // Occasional overlapping low gulp for a denser, organically messy burble.
      if (i % 3 === 1) this.noise(0.16, 'lowpass', 270 + (i % 4) * 32,
        0.85, 0.070, when + 0.015, 0.018);
    });
    // A short breath release, kept below the water volume.
    this.noise(0.52, 'bandpass', 950, 0.60, 0.052, 2.19, 0.14, 710);
    this.noise(0.38, 'highpass', 1450, 0.65, 0.018, 2.61, 0.13);
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
