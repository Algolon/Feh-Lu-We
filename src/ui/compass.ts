/**
 * A quiet bearing-only HUD. Plan coordinates are X east and Z north:
 * player yaw 0 = N, +PI/2 = O. No quest or location markers.
 * DOM/CSS only: does not add meshes, textures or draw calls.
 */
export function normalizeHeading(yaw: number): number {
  if (!Number.isFinite(yaw)) return 0;
  return ((yaw * 180 / Math.PI) % 360 + 360) % 360;
}

export const COMPASS_DIRECTIONS = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'] as const;

export class CompassHud {
  private readonly root: HTMLDivElement;
  private readonly track: HTMLDivElement;
  private readonly ticks: Array<{ angle: number; element: HTMLSpanElement }> = [];
  private scale = 1.6;
  private lastHeading = NaN;
  private lastTurnAt = -Infinity;

  constructor(hud: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'wa-compass';
    this.root.setAttribute('aria-hidden', 'true');
    this.root.innerHTML = '<div class="wa-compass-viewport"><div class="wa-compass-track"></div></div><span class="wa-compass-center"></span>';
    this.track = this.root.querySelector<HTMLDivElement>('.wa-compass-track')!;
    // Three copies let the compass wrap seamlessly through 0/360 degrees.
    for (let angle = -360; angle <= 720; angle += 15) {
      const el = document.createElement('span');
      el.className = 'wa-compass-tick';
      const major = angle % 45 === 0;
      const mark = document.createElement('span');
      mark.className = major ? 'wa-compass-mark major' : 'wa-compass-mark';
      el.appendChild(mark);
      if (major) {
        const label = document.createElement('span');
        label.className = 'wa-compass-label';
        label.textContent = COMPASS_DIRECTIONS[((angle / 45) % 8 + 8) % 8];
        el.appendChild(label);
      }
      this.track.appendChild(el);
      this.ticks.push({ angle, element: el });
    }
    hud.appendChild(this.root);
    window.addEventListener('resize', () => this.layout());
    window.addEventListener('orientationchange', () => this.layout());
    this.layout();
  }

  private layout() {
    this.scale = matchMedia('(orientation: portrait)').matches ? 1.08 : 1.6;
    for (const { angle, element } of this.ticks) element.style.left = `${angle * this.scale}px`;
    if (Number.isFinite(this.lastHeading)) this.track.style.transform = `translate3d(${-this.lastHeading * this.scale}px,0,0)`;
  }

  update(yaw: number, enabled: boolean, reducedMotion: boolean) {
    this.root.hidden = !enabled;
    if (!enabled) return;
    const heading = normalizeHeading(yaw);
    const now = performance.now();
    const delta = Math.abs(((heading - this.lastHeading + 540) % 360) - 180);
    if (!Number.isFinite(this.lastHeading) || delta >= 0.12) {
      this.lastHeading = heading;
      this.lastTurnAt = now;
      this.track.style.transform = `translate3d(${-heading * this.scale}px,0,0)`;
    }
    this.root.classList.toggle('turning', !reducedMotion && now - this.lastTurnAt < 520);
    this.root.classList.toggle('no-motion', reducedMotion);
  }
}
