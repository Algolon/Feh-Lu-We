// BOSLUST-R05 — touch-native controls laid over the *real* 3D metal lock.
// Guides track the projected 3D wheels. No digit dialog or duplicate code UI.
import { DRAG_SLOP_PX, swipeWheelSteps } from './boslustTouch';

export interface BoslustFocusHandlers {
  tap: (x: number, y: number, isTouch: boolean) => void;
  steps: (x: number, y: number, amount: number, isTouch: boolean) => void;
  leave: () => void;
}

export class BoslustFocusHud {
  readonly root: HTMLDivElement;
  private pointer: { id: number; x: number; y: number; lastSteps: number; moved: boolean; isTouch: boolean } | null = null;
  private guides: HTMLElement[] = [];
  private selected = -1;

  constructor(parent: HTMLElement, handlers: BoslustFocusHandlers) {
    this.root = document.createElement('div');
    this.root.id = 'boslust-focus';
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', 'BOSLUST cijferslot, draai de vier metalen wieltjes');
    this.root.classList.toggle('touch-mode', matchMedia('(pointer: coarse), (any-pointer: coarse)').matches);
    this.root.innerHTML = `<div class="boslust-touchplane" aria-hidden="true"></div>
      <div class="boslust-wheel-guides" aria-hidden="true">${Array.from({ length: 4 }, (_, i) =>
        `<div class="boslust-guide" data-wheel="${i}"><span class="boslust-chevron up">⌃</span><span class="boslust-chevron down">⌄</span></div>`).join('')}</div>
      <div class="boslust-focus-head"><span>BOSLUST · Cijferslot</span>
        <button type="button" class="boslust-back" aria-label="Verlaat de close-up van het cijferslot">← Terug</button>
      </div>
      <div class="boslust-focus-foot">
        <span class="boslust-mobile-hint">Tik boven of onder een cijfer, of veeg omhoog of omlaag. Draai daarna aan de knop.</span>
        <span class="boslust-desktop-hint">Klik of scroll op een cijferwiel · draai de metalen knop om te proberen</span>
        <span class="boslust-key-hint">← → kies wiel · ↑ ↓ draai · E probeer · Esc terug</span>
      </div>`;
    parent.appendChild(this.root);
    this.guides = [...this.root.querySelectorAll<HTMLElement>('.boslust-guide')];
    const plane = this.root.querySelector<HTMLElement>('.boslust-touchplane')!;

    this.root.querySelector<HTMLButtonElement>('.boslust-back')!.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation(); handlers.leave();
    });

    plane.addEventListener('pointerdown', e => {
      if (this.pointer || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
      if (isTouch) this.root.classList.add('touch-mode');
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, lastSteps: 0, moved: false, isTouch };
      plane.setPointerCapture(e.pointerId);
    });
    plane.addEventListener('pointermove', e => {
      const p = this.pointer;
      if (!p || e.pointerId !== p.id) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.moved ||= Math.hypot(dx, dy) > DRAG_SLOP_PX;
      // Sideways swipes are ignored: never accidentally turn two adjacent wheels.
      if (Math.abs(dx) > Math.max(25, Math.abs(dy) * 0.8)) return;
      const total = swipeWheelSteps(p.y, e.clientY);
      const delta = total - p.lastSteps;
      if (delta !== 0) {
        p.lastSteps = total;
        handlers.steps(p.x, p.y, delta, p.isTouch); // always lock to wheel under pointerdown
      }
    });
    plane.addEventListener('pointerup', e => {
      const p = this.pointer;
      if (!p || e.pointerId !== p.id) return;
      this.pointer = null;
      e.preventDefault();
      if (!p.moved) handlers.tap(p.x, p.y, p.isTouch);
      // Drag gestures are handled in real-time; no duplicate click on release.
    });
    const cancel = (e: PointerEvent) => {
      if (this.pointer?.id === e.pointerId) this.pointer = null;
    };
    plane.addEventListener('pointercancel', cancel);
    plane.addEventListener('lostpointercapture', cancel);
    plane.addEventListener('wheel', e => {
      e.preventDefault();
      handlers.steps(e.clientX, e.clientY, e.deltaY < 0 ? 1 : -1, false);
    }, { passive: false });
  }

  setWheelPositions(positions: readonly ({ x: number; y: number } | null)[]) {
    this.guides.forEach((guide, i) => {
      const p = positions[i];
      guide.hidden = !p;
      if (!p) return;
      guide.style.left = `${p.x}px`;
      guide.style.top = `${p.y}px`;
    });
  }

  setSelected(index: number) {
    if (this.selected === index) return;
    this.selected = index;
    this.guides.forEach((el, i) => el.classList.toggle('active', i === index));
  }

  destroy() { this.pointer = null; this.root.remove(); }
}
