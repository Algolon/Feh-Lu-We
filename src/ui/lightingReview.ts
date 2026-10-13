// ENV-L01 sandbox. Uses existing review storage isolation; no real save or puzzle completion edits.
import { defaultState } from '../core/state';
import type { Game } from '../core/game';
import { BUILD } from '../core/game';
import type * as THREE from 'three';
import { LIGHTING_PHASES } from '../world/lightingPhases';
import { terrainHeight } from '../world/terrain';
import { vegPathLabel } from '../core/caps';
import { downloadLightingReport } from './lightingDiagnostics';

const D = Math.PI / 180;
export const LIGHTING_VIEWS = {
  BOSLUST: { x: 63, y: 0, z: 11.5, yaw: 0, pitch: 0.05 },
  Aanloop: { x: 51.5, y: 0, z: 7.6, yaw: 55 * D, pitch: 0.04 },
  Tuin: { x: 90, y: 0, z: 123, yaw: 0, pitch: -0.03 },
  Landhuis: { x: 90, y: 0, z: 60, yaw: 0, pitch: 0.05 },
  Bospad: { x: 120, y: 0, z: 13.6, yaw: 85 * D, pitch: 0.02 },
  Hal: { x: 90, y: 0.15, z: 84.6, yaw: 0, pitch: 0.05 },
  Woonkamer: { x: 83.4, y: 0.15, z: 87.2, yaw: -90 * D, pitch: -0.06 },
  Sterrenkamer: { x: 83.6, y: 3.35, z: 88.4, yaw: -60 * D, pitch: -0.08 },
};
export function lightingReviewState() {
  const s = defaultState();
  s.scene = 'estate'; s.inventory = ['frontKey', 'torch', 'matches', 'notebook'];
  s.flags = { leftHome: true }; s.unlocked = ['lock.door.front']; s.open = { 'door.front': true };
  s.player.estate = { ...LIGHTING_VIEWS.BOSLUST, y: terrainHeight(63, 11.5) };
  return s;
}
export function showLightingStart(onStart: () => void) {
  const el = document.getElementById('start')!;
  el.hidden = false;
  el.innerHTML = `<div class="card"><h1>Feh Lu We · ENV-L01</h1>
    <p class="sub">Lighting & sky review · prototype</p>
    <p>Vergelijk vier lichtfasen op vaste locaties, of loop vrij rond. De schuif verandert alleen het licht.
    Je eigen opgeslagen spel wordt niet gelezen of gewijzigd; de review gebruikt een tijdelijke spelstand.</p>
    <button class="btn primary" data-review-start>Start review</button>
    <p class="note">Nog geen bevestigde fix voor de gemelde Android-renderfout.<br>
    <a href="${location.pathname}" style="color:inherit">Naar het gewone spel</a> · Build ${BUILD}</p></div>`;
  el.querySelector('[data-review-start]')!.addEventListener('click', onStart);
}
export function mountLightingReview(game: Game) {
  const env = game.extras.env;
  if (!env) return;
  const q = new URLSearchParams(location.search), initial = Number(q.get('phase') ?? 0);
  const surfaceDefines = new Map<THREE.Material, Record<string, unknown>>();
  env.preview = Number.isFinite(initial) ? Math.max(0, Math.min(1, initial)) : 0;
  env.mode = q.get('system') === 'baseline' ? 'baseline' : 'pilot';
  const bar = document.createElement('div'); bar.id = 'review-bar';
  bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'ENV-L01 lighting review');
  // Styling belongs to this dev-only panel; gameplay HUD/notebook CSS stays untouched.
  Object.assign(bar.style, { maxWidth: '96vw', width: 'max-content', padding: '5px', borderRadius: '12px', background: 'rgba(15,25,35,.86)' });
  bar.innerHTML = `<button data-toggle>ENV-L01 ▾</button><div data-controls hidden style="max-width:90vw">
    <div style="display:flex;flex-wrap:wrap;gap:4px">${LIGHTING_PHASES.map((p, i) => `<button data-phase="${i / 3}">${i + 1} · ${p.name}</button>`).join('')}</div>
    <label>Fase <input aria-label="Continue lichtfase" type="range" min="0" max="1" step="0.005" value="${env.preview}"></label>
    <label>Systeem <select data-system><option value="pilot">Vier fasen</option><option value="baseline">Productie</option></select></label>
    <label>Locatie <select data-view>${Object.keys(LIGHTING_VIEWS).map(v => `<option>${v}</option>`).join('')}</select></label>
    <label>Kwaliteit <select data-quality><option value="low">Low</option><option value="high">High</option></select></label>
    <label>Diagnose <select data-diagnostic><option value="normal">Normaal</option><option value="hemi">Hemisphere only</option><option value="sun">Directional only</option><option value="practicals">Alleen lokale lampen (test)</option><option value="no-surfaces">Zonder authored surface shader</option><option value="no-fog">Zonder mist</option><option value="no-shadows">Zonder schaduwen</option></select></label>
    <button data-report>Download renderdiagnose</button>
    <button data-progress>Volg puzzelvoortgang</button>
    <a href="${location.pathname}" style="color:white">Verlaat review</a>
    <span class="info" data-info></span></div>`;
  document.getElementById('app')!.appendChild(bar);
  const slider = bar.querySelector<HTMLInputElement>('input')!, controls = bar.querySelector<HTMLElement>('[data-controls]')!;
  const system = bar.querySelector<HTMLSelectElement>('[data-system]')!, quality = bar.querySelector<HTMLSelectElement>('[data-quality]')!;
  system.value = env.mode; quality.value = game.settings.quality;
  const info = () => { bar.querySelector('[data-info]')!.textContent = `${env.mode} · ${env.preview === null ? 'voortgang' : env.preview.toFixed(3)} · ${vegPathLabel()} · ${BUILD}`; };
  const setPhase = (v: number) => { env.preview = v; slider.value = String(v); info(); };
  bar.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (b?.hasAttribute('data-toggle')) controls.hidden = !controls.hidden;
    if (b?.dataset.phase !== undefined) setPhase(Number(b.dataset.phase));
    if (b?.hasAttribute('data-progress')) { env.preview = null; info(); }
    if (b?.hasAttribute('data-report')) downloadLightingReport(game);
  });
  slider.addEventListener('input', () => setPhase(Number(slider.value)));
  system.addEventListener('change', () => { env.mode = system.value === 'baseline' ? 'baseline' : 'pilot'; info(); });
  quality.addEventListener('change', () => { game.settings.quality = quality.value === 'high' ? 'high' : 'low'; game.applyQuality(true); });
  bar.querySelector<HTMLSelectElement>('[data-diagnostic]')!.addEventListener('change', e => {
    env.diagnostic = (e.target as HTMLSelectElement).value as typeof env.diagnostic;
    // Restore exact original defines when leaving the one shader-isolation test.
    for (const [mat, defines] of surfaceDefines) {
      (mat as THREE.Material & { defines: Record<string, unknown> }).defines = { ...defines }; mat.needsUpdate = true;
    }
    if (env.diagnostic === 'no-surfaces') game.world?.scene.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const mm = mat as THREE.Material & { defines?: Record<string, unknown> };
        if (!mm.defines?.FLW_SURFACE) continue;
        if (!surfaceDefines.has(mat)) surfaceDefines.set(mat, { ...mm.defines });
        mm.defines = { ...mm.defines }; delete mm.defines.FLW_SURFACE; mm.needsUpdate = true;
      }
    });
  });
  bar.querySelector<HTMLSelectElement>('[data-view]')!.addEventListener('change', e => {
    const pose = LIGHTING_VIEWS[(e.target as HTMLSelectElement).value as keyof typeof LIGHTING_VIEWS];
    game.player.setPose(pose); game.player.y = game.world!.col.supportHeight(pose.x, pose.z, pose.y + 0.05, 0.42);
  });
  for (const ev of ['pointerdown', 'touchstart', 'keydown'] as const) bar.addEventListener(ev, e => e.stopPropagation(), { passive: true });
  info();
}
