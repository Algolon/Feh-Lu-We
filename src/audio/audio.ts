// All sound is synthesised with WebAudio at runtime: no audio files, no licensing questions.
// The context is created/resumed only from the Start button (user gesture), and suspended when hidden.

type SfxName = string;

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
