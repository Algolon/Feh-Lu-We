// BOSLUST-R04: tiny diegetic input surface, not a dialog or a canvas copy.
// Touch/mouse hits use the game's real 3D raycaster; buttons only explain/exit.
export interface BoslustFocusHandlers {
  tap: (x: number, y: number, step?: 1 | -1) => void;
  wheel: (x: number, y: number, step: 1 | -1) => void;
  leave: () => void;
}
export class BoslustFocusHud {
  readonly root: HTMLDivElement;
  private pointer: { id: number; x: number; y: number; moved: boolean } | null = null;
  constructor(parent: HTMLElement, handlers: BoslustFocusHandlers) {
    this.root = document.createElement('div');
    this.root.id = 'boslust-focus';
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', 'BOSLUST combinatieslot; draai de cijfers rechtstreeks op het slot');
    this.root.innerHTML = `<div class="boslust-touchplane" aria-hidden="true"></div>
      <div class="boslust-focus-head"><span>BOSLUST · Cijferslot</span>
      <button type="button" class="boslust-back" aria-label="Stop met het cijferslot bekijken">← Terug</button></div>
      <div class="boslust-focus-foot">
        <span class="boslust-hint">Tik of sleep op de cijfers om te draaien · draai de metalen knop om te proberen</span>
        <span class="boslust-key-hint">← → kies wiel · ↑ ↓ draai · E probeer · Esc terug</span>
      </div>`;
    parent.appendChild(this.root);
    const plane = this.root.querySelector<HTMLElement>('.boslust-touchplane')!;
    this.root.querySelector<HTMLButtonElement>('.boslust-back')!.addEventListener('click', (e) => {
      e.stopPropagation(); handlers.leave();
    });
    plane.addEventListener('pointerdown', e => {
      if (this.pointer || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      plane.setPointerCapture(e.pointerId);
    });
    plane.addEventListener('pointermove', e => {
      if (e.pointerId !== this.pointer?.id) return;
      this.pointer.moved ||= Math.hypot(e.clientX - this.pointer.x, e.clientY - this.pointer.y) > 16;
    });
    plane.addEventListener('pointerup', e => {
      if (e.pointerId !== this.pointer?.id) return;
      const start = this.pointer; this.pointer = null;
      e.preventDefault();
      const delta = e.clientY - start.y;
      if (start.moved && Math.abs(delta) < 18) return; // sideways swipes aren't wheel turns
      handlers.tap(start.x, start.y, Math.abs(delta) >= 18 ? (delta < 0 ? 1 : -1) : undefined);
    });
    const cancel = (e: PointerEvent) => { if (this.pointer?.id === e.pointerId) this.pointer = null; };
    plane.addEventListener('pointercancel', cancel);
    plane.addEventListener('lostpointercapture', cancel);
    plane.addEventListener('wheel', e => {
      e.preventDefault();
      handlers.wheel(e.clientX, e.clientY, e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
    // Do not steal keyboard focus from existing controls; keyboard arrows and Esc are
    // handled by the game's input dispatcher while the player is movement-locked.
  }
  destroy() { this.pointer = null; this.root.remove(); }
}
