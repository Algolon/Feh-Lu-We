// Art-review mode (?review=living). Opt-in only: the normal start screen, save and controls are untouched.
// - State lives in the in-memory sandbox (state.ts `storage`): opening or using a review link never reads,
//   writes, resets or migrates the player's own save.
// - The player starts in the living-room doorway with ordinary touch controls.
// - A small collapsible bar compares the asset set (rebuilds the world at the same pose), the interior lighting
//   treatment and the tone mapping (both live).
import * as THREE from 'three';
import { ART } from '../core/artflags';
import { defaultState, type GameState } from '../core/state';
import { BUILD, type Game } from '../core/game';

export function reviewState(): GameState {
  const s = defaultState();
  s.scene = 'estate';
  s.inventory = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
  s.flags = { leftHome: true };
  s.unlocked = ['lock.door.front'];
  s.open = { 'door.front': true };
  s.clues = ['c.invitation'];
  // in the hall, in the wide arch to the living room, looking at the hearth
  s.player.estate = { x: 85.6, y: 0.15, z: 88.5, yaw: -Math.PI / 2, pitch: -0.04 };
  return s;
}

export function showReviewStart(onStart: () => void) {
  const el = document.getElementById('start')!;
  el.hidden = false;
  el.innerHTML = `<div class="card">
    <h1>Feh Lu We</h1>
    <p class="sub">Kunstreview · woonkamer (voorstel, nog niet goedgekeurd)</p>
    <div class="row"><button class="btn primary" data-review-start>Start review</button></div>
    <p class="note">Je begint in de boog tussen hal en woonkamer, met de gewone besturing. Deze review gebruikt een
    tijdelijke, losse spelstand: jouw eigen opgeslagen spel wordt niet gelezen, overschreven of gewist.
    Met de knop <b>Review</b> bovenaan vergelijk je oud/nieuw, licht en tonemapping.<br>
    <a href="${location.pathname}" style="color:inherit">Naar het gewone spel</a><br>Build ${BUILD}</p>
  </div>`;
  el.querySelector('[data-review-start]')!.addEventListener('click', onStart);
}

export function mountReviewBar(game: Game) {
  const bar = document.createElement('div');
  bar.id = 'review-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Kunstreview');
  document.getElementById('app')!.appendChild(bar);
  let open = false, busy = false;
  const label = () => `${ART.set === 'sample' ? 'Nieuw' : 'Oud'} · licht ${ART.light === 'sample' ? 'nieuw' : 'oud'} · ${ART.tm === 'aces' ? 'ACES' : 'Neutral'}`;
  const render = () => {
    bar.innerHTML = open
      ? `<button data-k="art">${ART.set === 'sample' ? 'Toon oud' : 'Toon nieuw'}</button>
         <button data-k="light">Licht: ${ART.light === 'sample' ? 'nieuw' : 'oud'}</button>
         <button data-k="tm">Tonemap: ${ART.tm === 'aces' ? 'ACES' : 'Neutral'}</button>
         <button data-k="close" aria-label="Inklappen">×</button>`
      : `<button data-k="open">Review: ${label()}</button>`;
  };
  bar.addEventListener('click', async (e) => {
    const k = (e.target as HTMLElement).closest('button')?.dataset.k;
    if (!k || busy) return;
    if (k === 'open' || k === 'close') open = k === 'open';
    if (k === 'light') ART.light = ART.light === 'sample' ? 'base' : 'sample';
    if (k === 'tm') {
      ART.tm = ART.tm === 'aces' ? 'neutral' : 'aces';
      game.renderer.toneMapping = ART.tm === 'neutral' ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
    }
    if (k === 'art') {
      busy = true;
      bar.classList.add('busy');
      ART.set = ART.set === 'sample' ? 'base' : 'sample';
      game.state.player.estate = game.player.pose(); // rebuild at the same pose
      await new Promise((r) => setTimeout(r, 30));
      await game.loadScene('estate');
      busy = false;
      bar.classList.remove('busy');
      game.ui.toast(ART.set === 'sample' ? 'Nieuwe woonkamer' : 'Oorspronkelijke woonkamer');
    }
    render();
  });
  // keep taps on the bar from reaching the look/move zones underneath
  for (const ev of ['pointerdown', 'touchstart'] as const) bar.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
  render();
}
