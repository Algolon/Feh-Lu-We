// Most sounds are WebAudio-generated; outdoor footfalls use edited, embedded field recordings;
// the user-authorized bong hit also plays its own bundled MP3.
// The context is created/resumed only from the Start button (user gesture), and suspended when hidden.

import type { RitualMix } from '../world/wickerRitual';
import { renderOutdoorFootstep, selectOutdoorFootstepVariant, selectGrassPitchVariant, GRASS_PITCH_RATIOS, type FootstepSurface, type OutdoorFootstepSurface } from './footsteps';
import { FIELD_FOOTSTEPS_MP3, FIELD_FOOTSTEP_CLIPS } from './fieldFootsteps';
import { GRASS_R04_MP3, GRASS_R04_CLIPS, DIRT_PATH_GAIN } from './grassR04';

type SfxName = string;
type RitualVoice = { src: AudioScheduledSourceNode; f: BiquadFilterNode | null; g: GainNode };

/** Self-hosted, unmodified sound from the user's authorized Myinstants reference. */
export const BONG_RIPPIE_ASSET = 'audio/bong-rippie.mp3';
// R05: denser, louder water glugs while the breath remains a quiet supporting layer.
export const BONG_HIT_BUBBLES = [0.25, 0.35, 0.47, 0.57, 0.69, 0.77, 0.90, 1.00, 1.12, 1.23, 1.31, 1.44, 1.55, 1.68, 1.80, 1.91, 2.02] as const;
export const BONG_HIT_WATER_LEVEL = 0.145;
export const BONG_HIT_BREATH_LEVEL = 0.045;

/** Handpan voice: [frequency multiple, peak level, decay (s), detune (cents)]. */
export const HANDPAN_PARTIALS: readonly [number, number, number, number][] = [
  [1, 1, 3.4, 0], [1, 0.3, 3.0, 4], [2, 0.42, 2.1, 1], [3, 0.17, 1.2, -2], [5.3, 0.04, 0.35, 0],
];

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private bongRippieClip: AudioBuffer | null = null;
  private bongRippieLoading: Promise<void> | null = null;
  private loops: Record<string, { gain: GainNode; target: number }> = {};
  private muted = false;
  mushroom = 0;
  private groveBus: GainNode | null = null;
  private groveVoices: OscillatorNode[] = [];
  private groveNext = 0;
  private groveChord = -1;
  private groveNote = 0;
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
      // Preload only after the Start gesture has unlocked Web Audio. The MP3 is
      // self-hosted by GitHub Pages and cached/decoded once for repeat hits.
      // Decode the compact, bundled field-recording bank once. No network/CDN dependency, nor
      // decoding on each step. The backup sound only runs if browser MP3 decoding fails.
      if (!this.fieldStepBank && !this.fieldStepLoading) {
        this.fieldStepLoading = this.loadFieldSteps().finally(() => { this.fieldStepLoading = null; });
      }
      if (this.fieldStepLoading) await this.fieldStepLoading;
      if (!this.grassR04Bank && !this.grassR04Loading) {
        this.grassR04Loading = this.loadGrassR04().finally(() => { this.grassR04Loading = null; });
      }
      if (this.grassR04Loading) await this.grassR04Loading;
      this.preloadBongRippie();
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

  private voices = 0;
  /**
   * One handpan stroke. A tuned steel note carries its fundamental, the octave and the compound fifth (3×), each
   * decaying on its own clock (the fundamental rings longest), a faint detuned twin for the slow shimmer, a short
   * inharmonic ping for the metal, and a soft hand-noise transient. Lowpassed per voice for warmth. Returns false
   * when nothing sounds (muted, no context); rapid playing is capped so a burst of taps cannot pile up voices.
   */
  handpan(freq: number, vel = 1): boolean {
    if (!this.ready || this.muted) return false;
    if (this.voices >= 10) return true;
    const c = this.ctx!, t = c.currentTime, v = Math.max(0.05, Math.min(1, vel)) * (0.88 + Math.random() * 0.12);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, freq * 10); lp.Q.value = 0.4;
    const out = c.createGain();
    out.gain.value = 0.2 * v;
    out.connect(lp).connect(this.master!);
    const ring = freq < 200 ? 1.35 : 1; // the ding rings on
    let longest = 0;
    for (const [mult, amp, decay, cents] of HANDPAN_PARTIALS) {
      const o = c.createOscillator(), g = c.createGain(), d = decay * ring;
      o.type = 'sine';
      o.frequency.value = freq * mult;
      o.detune.value = cents;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + d + 0.05);
      longest = Math.max(longest, d);
    }
    this.noise(0.035, 'bandpass', 1900, 0.9, 0.05 * v);
    this.voices++;
    setTimeout(() => { this.voices = Math.max(0, this.voices - 1); }, longest * 1000);
    return true;
  }

  private lastStep = -1;
  private fieldStepBank: AudioBuffer | null = null;
  private fieldStepLoading: Promise<void> | null = null;
  private grassR04Bank: AudioBuffer | null = null;
  private grassR04Loading: Promise<void> | null = null;

  private async loadGrassR04(): Promise<void> {
    try {
      const encoded = atob(GRASS_R04_MP3);
      const bytes = new Uint8Array(encoded.length);
      for (let i = 0; i < encoded.length; i++) bytes[i] = encoded.charCodeAt(i);
      this.grassR04Bank = await this.ctx!.decodeAudioData(bytes.buffer);
    } catch {
      // The original grass sample bank remains the fallback if MP3 decoding fails.
      this.grassR04Bank = null;
    }
  }
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
  private lastGrassPitch = -1;

  private outdoorStep(surface: OutdoorFootstepSurface, gain: number, foot: 0 | 1) {
    const pool = this.outdoorBuffers[surface];
    const useSteadyGrass = surface === 'grass' && !!this.grassR04Bank;
    const bank = useSteadyGrass ? this.grassR04Bank : this.fieldStepBank;
    const clips = useSteadyGrass ? GRASS_R04_CLIPS : FIELD_FOOTSTEP_CLIPS[surface];
    const count = bank ? clips.length : pool.length;
    if (!count) return;
    // Only the first grass recording sounds right: reuse it on every step.
    // Dirt retains its approved no-repeat variation.
    const index = selectOutdoorFootstepVariant(surface, count, this.lastOutdoor[surface], Math.random());
    this.lastOutdoor[surface] = index;

    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = bank ?? pool[index];
    // Every grass step reuses the first approved recording, selecting one of three
    // subtle semitone pitches. Never repeat a pitch twice consecutively.
    // Step onset is still driven only by gait.ts, not playback rate.
    let pitch: number;
    if (surface === 'grass') {
      this.lastGrassPitch = selectGrassPitchVariant(this.lastGrassPitch, Math.random());
      pitch = GRASS_PITCH_RATIOS[this.lastGrassPitch];
    } else {
      // Dirt retains its previously approved random pitch and left/right modulation.
      pitch = (foot ? 0.986 : 1.014) * (0.98 + Math.random() * 0.04);
    }
    src.playbackRate.value = pitch;
    const surfaceMix = surface === 'grass' ? (bank ? 0.33 : 0.5) : (bank ? DIRT_PATH_GAIN : 0.35);
    const vol = Math.max(0, Math.min(1.2, gain)) * surfaceMix
      * (surface === 'grass' ? 1 : 0.93 + Math.random() * 0.14);
    const volume = c.createGain();
    src.connect(volume).connect(this.master!);

    if (bank) {
      const [offset, duration] = clips[index];
      const t = c.currentTime, audible = duration / pitch;
      volume.gain.setValueAtTime(0.0001, t);
      volume.gain.linearRampToValueAtTime(vol, t + 0.01);
      volume.gain.setValueAtTime(vol, t + Math.max(0.02, audible - (surface === 'grass' ? 0.045 : 0.055)));
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
      case 'bongHit': void this.playBongRippie(); break;
      case 'electric-zap': {
        // Audible "bzzz—bzz": one short pitched buzz for each synchronized lightning pulse.
        const v = Number.isFinite(gain) ? Math.max(0, Math.min(1, gain)) : 0;
        if (v > 0) this.electricBuzz(v);
        break;
      }
      default: break;
    }
  }

  /** Decode the bundled original MP3 exactly once, independent of Myinstants uptime. */
  private preloadBongRippie() {
    if (this.bongRippieLoading || !this.ctx) return;
    const ctx = this.ctx;
    const url = `${import.meta.env.BASE_URL}${BONG_RIPPIE_ASSET}`;
    this.bongRippieLoading = (async () => {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Bong audio HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      this.bongRippieClip = await ctx.decodeAudioData(bytes);
    })().catch(error => {
      console.warn('Could not load the bundled Bong Rippie sample; using sound fallback.', error);
    });
  }

  /** Normal path: play the exact sample, full duration, no oscillator layers. */
  private async playBongRippie() {
    if (!this.ready || this.muted || !this.ctx) return;
    if (!this.bongRippieLoading) this.preloadBongRippie();
    if (this.bongRippieLoading && !this.bongRippieClip) await this.bongRippieLoading;
    if (!this.ready || this.muted || !this.ctx) return;
    if (!this.bongRippieClip) {
      // Graceful audio-only fallback for an unsupported browser codec.
      this.bongHit();
      return;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = this.bongRippieClip;
    source.connect(this.master!);
    source.start();
  }

  /** R05 fallback: the water is the foreground, not a quiet series of synth beeps.
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
    // Original suspended/add9 progression, no recorded music. All voices and echo
    // return BEFORE the grove bus, so leaving/pause/mute fades the whole soundscape.
    this.groveBus = c.createGain(); this.groveBus.gain.value = 0;
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1250;
    this.groveBus.connect(filter).connect(this.master!);
    for (let i=0; i<5; i++) {
      const o=c.createOscillator(), gain=c.createGain(), pan=c.createStereoPanner();
      o.type='sine'; o.frequency.value=[146.83,220,293.66,329.63,440][i];
      o.detune.value=(i-2)*3.2; gain.gain.value=i<2?.085:.045; pan.pan.value=(i-2)*.28;
      o.connect(gain).connect(pan).connect(this.groveBus);o.start();this.groveVoices.push(o);
    }
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
    const grove = Math.max(0, Math.min(1, this.mushroom));
    this.groveBus?.gain.setTargetAtTime(grove * 0.5, this.ctx!.currentTime, grove === 0 ? 0.18 : 0.8);
    if (grove > 0.02) {
      const chord = Math.floor(this.time / 18) % 4;
      if (chord !== this.groveChord) {
        this.groveChord = chord;
        const notes = [[50,57,62,64,69], [48,55,60,62,67], [53,60,65,67,72], [50,57,62,65,69]][chord];
        this.groveVoices.forEach((o,i) => o.frequency.setTargetAtTime(440 * 2 ** ((notes[i]-69)/12), this.ctx!.currentTime, 3));
      }
      this.groveNext -= dt;
      if (this.groveNext <= 0 && !this.muted) {
        this.groveNext = 4.5 + (this.groveNote % 3) * 1.7;
        const melody=[74,81,76,69,79,77,72,76], midi=melody[this.groveNote++ % melody.length];
        this.groveChime(440 * 2 ** ((midi-69)/12));
      }
    }
    const outdoor = this.ambience === 'estate' && !levels.indoor;
    set('wind', outdoor ? (0.05 + 0.03 * Math.sin(this.time * 0.2) + this.dusk * 0.03) * (1 - grove * 0.8) : 0.01);
    set('room', levels.indoor ? 0.05 : 0);
    // crackle: a noise floor plus random pops
    set('fire', levels.fire * 0.12);
    if (levels.fire > 0.05 && Math.random() < dt * 9 * levels.fire) this.noise(0.03, 'highpass', 2500, 1, 0.15 * levels.fire);
    set('water', levels.water * 0.06);
    set('steam', levels.steam * 0.05);
    this.nextAmbient -= dt;
    if (this.nextAmbient <= 0) {
      this.nextAmbient = 6 + Math.random() * 10;
      if (this.ambience === 'estate' && grove < 0.25) this.ambientEvent(outdoor);
    }
  }

  private groveChime(frequency: number) {
    if (!this.ctx || !this.groveBus) return;
    const c=this.ctx,t=c.currentTime;
    // Soft attack, inharmonic glass overtone, staggered echoes with finite lifetimes.
    for (let i=0;i<4;i++) {
      const o=c.createOscillator(), gain=c.createGain(), pan=c.createStereoPanner();
      const start=t+i*.43;
      o.frequency.value=frequency*(i===1?2.002:1);o.type='sine';
      gain.gain.setValueAtTime(0.0001,start);
      gain.gain.exponentialRampToValueAtTime(.065/(i+1),start+.32);
      gain.gain.exponentialRampToValueAtTime(.0001,start+4.2);
      pan.pan.value=Math.sin(this.groveNote+i)*.65;
      o.connect(gain).connect(pan).connect(this.groveBus);o.start(start);o.stop(start+4.3);
      o.onended=()=>{o.disconnect();gain.disconnect();pan.disconnect();};
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
