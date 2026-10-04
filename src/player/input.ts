// Unified input: left-thumb floating joystick, right-side drag-to-look with tap detection,
// keyboard (WASD/arrows), mouse drag or optional pointer lock. Each touch is owned by pointerId so
// moving and looking work simultaneously. All active input is cleared on cancel/blur/hide/resize.

export interface InputSettings { lookSensitivity: number; moveSensitivity: number; invertY: boolean }

export class Input {
  moveX = 0; // strafe -1..1 (right +)
  moveY = 0; // forward -1..1
  run = false;
  lookDX = 0; // accumulated radians since last frame
  lookDY = 0;
  enabled = true;
  onTap: ((clientX: number, clientY: number) => void) | null = null;
  onAction: (() => void) | null = null;
  onKey: ((key: string) => void) | null = null;
  pointerLocked = false;

  private keys = new Set<string>();
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private stickVec = { x: 0, y: 0 };
  private lookId: number | null = null;
  private lookLast = { x: 0, y: 0 };
  private lookStart = { x: 0, y: 0, t: 0, moved: 0 };
  private readonly stickRadius = 60;
  private disposers: (() => void)[] = [];

  constructor(
    private moveZone: HTMLElement,
    private lookZone: HTMLElement,
    private canvas: HTMLCanvasElement,
    private stickBase: HTMLElement,
    private stickKnob: HTMLElement,
    public settings: InputSettings,
  ) {
    this.bind(moveZone, 'pointerdown', (e) => this.stickDown(e as PointerEvent));
    this.bind(moveZone, 'pointermove', (e) => this.stickMove(e as PointerEvent));
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) this.bind(moveZone, ev, (e) => this.stickUp(e as PointerEvent));
    this.bind(lookZone, 'pointerdown', (e) => this.lookDown(e as PointerEvent));
    this.bind(lookZone, 'pointermove', (e) => this.lookMove(e as PointerEvent));
    this.bind(lookZone, 'pointerup', (e) => this.lookUp(e as PointerEvent, false));
    for (const ev of ['pointercancel', 'lostpointercapture']) this.bind(lookZone, ev, (e) => this.lookUp(e as PointerEvent, true));
    this.bind(window, 'keydown', (e) => this.keyDown(e as KeyboardEvent));
    this.bind(window, 'keyup', (e) => this.keys.delete((e as KeyboardEvent).code));
    this.bind(window, 'blur', () => this.clear());
    this.bind(document, 'visibilitychange', () => this.clear());
    this.bind(window, 'resize', () => this.clear());
    this.bind(window, 'orientationchange', () => this.clear());
    this.bind(document, 'mousemove', (e) => {
      if (!this.pointerLocked || !this.enabled) return;
      const me = e as MouseEvent;
      this.addLook(me.movementX, me.movementY, 0.0022);
    });
    this.bind(document, 'pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas || document.pointerLockElement === this.lookZone;
      if (!this.pointerLocked) this.onKey?.('pointerunlock');
    });
    for (const z of [moveZone, lookZone]) this.bind(z, 'contextmenu', (e) => e.preventDefault());
  }

  private bind(t: EventTarget, ev: string, fn: (e: Event) => void) {
    const opts = ev.startsWith('pointer') || ev.startsWith('touch') ? { passive: false } : undefined;
    t.addEventListener(ev, fn, opts);
    this.disposers.push(() => t.removeEventListener(ev, fn));
  }

  dispose() {
    for (const d of this.disposers) d();
    this.disposers = [];
  }

  /** Clear all active input so movement can never remain stuck. */
  clear() {
    this.keys.clear();
    this.stickId = null;
    this.stickVec.x = this.stickVec.y = 0;
    this.lookId = null;
    this.lookDX = this.lookDY = 0;
    this.stickBase.classList.remove('active');
    this.stickKnob.style.transform = 'translate(-50%, -50%)';
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.clear();
  }

  requestPointerLock() {
    try {
      const p = this.lookZone.requestPointerLock?.() as unknown as Promise<void> | undefined;
      p?.catch?.(() => {});
    } catch {
      /* unsupported */
    }
  }
  exitPointerLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  private stickDown(e: PointerEvent) {
    if (!this.enabled || this.stickId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.stickId = e.pointerId;
    try { this.moveZone.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    this.stickOrigin = { x: e.clientX, y: e.clientY };
    this.stickVec = { x: 0, y: 0 };
    this.stickBase.style.left = `${e.clientX}px`;
    this.stickBase.style.top = `${e.clientY}px`;
    this.stickBase.classList.add('active');
  }
  private stickMove(e: PointerEvent) {
    if (e.pointerId !== this.stickId) return;
    e.preventDefault();
    let dx = e.clientX - this.stickOrigin.x, dy = e.clientY - this.stickOrigin.y;
    const d = Math.hypot(dx, dy);
    if (d > this.stickRadius) {
      dx = (dx / d) * this.stickRadius;
      dy = (dy / d) * this.stickRadius;
    }
    this.stickVec = { x: dx / this.stickRadius, y: dy / this.stickRadius };
    this.stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
  private stickUp(e: PointerEvent) {
    if (e.pointerId !== this.stickId) return;
    this.stickId = null;
    this.stickVec = { x: 0, y: 0 };
    this.stickBase.classList.remove('active');
    this.stickKnob.style.transform = 'translate(-50%, -50%)';
  }

  private lookDown(e: PointerEvent) {
    if (!this.enabled) return;
    if (this.pointerLocked) {
      // with pointer lock, a click means "act on the reticle target"
      if (e.button === 0) this.onAction?.();
      return;
    }
    if (this.lookId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.lookId = e.pointerId;
    try { this.lookZone.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    this.lookLast = { x: e.clientX, y: e.clientY };
    this.lookStart = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
  }
  private lookMove(e: PointerEvent) {
    if (e.pointerId !== this.lookId) return;
    e.preventDefault();
    const dx = e.clientX - this.lookLast.x, dy = e.clientY - this.lookLast.y;
    this.lookLast = { x: e.clientX, y: e.clientY };
    this.lookStart.moved = Math.max(this.lookStart.moved, Math.hypot(e.clientX - this.lookStart.x, e.clientY - this.lookStart.y));
    // touch drag: ~0.28° per px at sensitivity 1
    this.addLook(dx, dy, e.pointerType === 'mouse' ? 0.0045 : 0.0055);
  }
  private lookUp(e: PointerEvent, cancelled: boolean) {
    if (e.pointerId !== this.lookId) return;
    this.lookId = null;
    const dt = performance.now() - this.lookStart.t;
    // A tap is short and nearly stationary; anything else was a look drag.
    if (!cancelled && this.enabled && this.lookStart.moved < 12 && dt < 350) this.onTap?.(e.clientX, e.clientY);
  }

  private addLook(dx: number, dy: number, k: number) {
    const s = k * this.settings.lookSensitivity;
    this.lookDX += dx * s;
    this.lookDY += dy * s * (this.settings.invertY ? -1 : 1);
  }

  private keyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (!e.repeat) this.onKey?.(e.code);
  }

  /** Called once per frame. Computes the analogue move vector (deadzone + curve). */
  sample() {
    let x = 0, y = 0;
    if (this.enabled) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
      const kl = Math.hypot(x, y);
      if (kl > 1) { x /= kl; y /= kl; }
      this.run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
      if (this.stickId !== null) {
        const sx = this.stickVec.x, sy = -this.stickVec.y;
        const m = Math.hypot(sx, sy);
        const dead = 0.14;
        if (m > dead) {
          const mm = Math.min(1, ((m - dead) / (1 - dead)) * this.settings.moveSensitivity);
          x = (sx / m) * mm;
          y = (sy / m) * mm;
          this.run = mm > 0.97; // push to the rim to jog
        }
      }
    }
    this.moveX = x;
    this.moveY = y;
  }

  consumeLook(): [number, number] {
    const r: [number, number] = [this.lookDX, this.lookDY];
    this.lookDX = this.lookDY = 0;
    return r;
  }

  /** For automated tests: inject a move vector (same path as joystick/keyboard). */
  injectMove(x: number, y: number, run = false) {
    this.moveX = x;
    this.moveY = y;
    this.run = run;
  }
}
