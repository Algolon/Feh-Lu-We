// Art-review mode (?review=living | ?review=boslust). Opt-in only: the normal start screen, save and controls
// are untouched.
// - State lives in the in-memory sandbox (state.ts `storage`): opening or using a review link never reads,
//   writes, resets or migrates the player's own save.
// - living: the player starts in the living-room doorway; boslust: at the fork signpost, with temporary
//   progress (route restored, letter strip) so the cipher cover and door can be tried. Ordinary touch controls.
// - A small collapsible bar compares the asset set (rebuilds the world at the same pose), the interior lighting
//   treatment and the tone mapping (both live).
import * as THREE from 'three';
import { ART, REVIEW } from '../core/artflags';
import { defaultState, type GameState } from '../core/state';
import { BUILD, type Game } from '../core/game';
import { vegPathLabel } from '../core/caps';
import { terrainHeight } from '../world/terrain';

export function reviewState(): GameState {
  const s = defaultState();
  if (REVIEW === 'boslust') {
    s.scene = 'estate';
    // temporary progress for this sandbox only: what the normal game requires before the BOSLUST cover opens
    s.inventory = ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'cipherStrip'];
    s.flags = { leftHome: true, routeRestored: true };
    s.clues = ['c.invitation', 'c.routeRestored', 'c.letterstrook'];
    // just south-west of the fork signpost, looking up the side path towards the hill
    // a step south-west of the signpost, on the path, looking past it up the side path (the "fork" checkpoint
    // itself stands inside the signpost's collider, so the game would move the player elsewhere)
    s.player.estate = { x: 53.2, y: terrainHeight(53.2, 6.8), z: 6.8, yaw: 0.75, pitch: -0.03 };
    return s;
  }
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
    <p class="sub">Kunstreview · ${REVIEW === 'boslust' ? 'het pad naar BOSLUST' : 'woonkamer'} (voorstel, nog niet goedgekeurd)</p>
    <div class="row"><button class="btn primary" data-review-start>Start review</button></div>
    <p class="note">${REVIEW === 'boslust'
      ? 'Je begint bij de wegwijzer op de splitsing, met de gewone besturing. Volg het zijpad naar de heuvel. Voor deze review heb je de letterstrook al en is de route hersteld, zodat je het klepje en de deur kunt proberen.'
      : 'Je begint in de boog tussen hal en woonkamer, met de gewone besturing.'} Deze review gebruikt een
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
  const ext = REVIEW === 'boslust';
  const isNew = () => (ext ? ART.ext : ART.set) === 'sample';
  const label = () => `${isNew() ? 'Nieuw' : 'Oud'} · licht ${ART.light === 'sample' ? 'nieuw' : 'oud'} · ${ART.tm === 'aces' ? 'ACES' : 'Neutral'}`;
  const render = () => {
    bar.innerHTML = open
      ? `<button data-k="art">${isNew() ? 'Toon oud' : 'Toon nieuw'}</button>
         <button data-k="light">Licht: ${ART.light === 'sample' ? 'nieuw' : 'oud'}</button>
         <button data-k="tm">Tonemap: ${ART.tm === 'aces' ? 'ACES' : 'Neutral'}</button>
         <button data-k="close" aria-label="Inklappen">×</button>${ext ? `<span class="info">tekenen: ${vegPathLabel()} · ${BUILD}</span>` : ''}`
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
      if (ext) ART.ext = ART.ext === 'sample' ? 'base' : 'sample';
      else ART.set = ART.set === 'sample' ? 'base' : 'sample';
      game.state.player.estate = game.player.pose(); // rebuild at the same pose
      await new Promise((r) => setTimeout(r, 30));
      await game.loadScene('estate');
      busy = false;
      bar.classList.remove('busy');
      game.ui.toast(ext ? (isNew() ? 'Nieuwe aanloop naar BOSLUST' : 'Oorspronkelijke aanloop') : isNew() ? 'Nieuwe woonkamer' : 'Oorspronkelijke woonkamer');
    }
    render();
  });
  // keep taps on the bar from reaching the look/move zones underneath
  for (const ev of ['pointerdown', 'touchstart'] as const) bar.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
  render();
}
