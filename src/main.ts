import './ui/style.css';
import { Game, TEST_HOOKS } from './core/game';
import { UI } from './ui/ui';
import { REVIEW } from './core/artflags';
import { reviewState, showReviewStart, mountReviewBar } from './ui/review';
import { showSliceStart } from './slice/start';
import { ROUTE as SLICE_ROUTE } from './slice/placement';

function webglAvailable(): boolean {
  if (new URLSearchParams(location.search).has('nowebgl')) return false; // test hook for the failure path
  try {
    const c = document.createElement('canvas');
    // three.js r163+ WebGLRenderer requires WebGL 2
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function fail(msg: string) {
  new UI().showStart({
    hasSave: false,
    onContinue: () => {},
    onNew: () => {},
    error: `<b>Dit apparaat kan Feh Lu We niet tonen.</b><br><br>${msg}<br><br>Probeer een recente versie van Chrome, Safari, Firefox of Edge, zet hardwareversnelling aan, of probeer een ander apparaat. Je voortgang (als je die had) blijft bewaard.`,
  });
}

function boot() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!webglAvailable()) {
    fail('Je browser ondersteunt geen WebGL (3D-graphics), of het staat uit.');
    return;
  }
  let game: Game;
  try {
    game = new Game(canvas);
  } catch (e) {
    console.error(e);
    fail('Het 3D-beeld kon niet worden gestart.');
    return;
  }
  if (TEST_HOOKS) (window as unknown as { __game: Game }).__game = game;
  if (TEST_HOOKS && REVIEW === 'dev01') (window as unknown as { __dev01Route: unknown }).__dev01Route = SLICE_ROUTE; // e2e walks the as-built route
  let starting = false;
  const begin = async (fresh: boolean) => {
    if (starting) return; // Start/Continue are idempotent while loading
    starting = true;
    document.querySelectorAll<HTMLButtonElement>('#start .btn').forEach((b) => { b.disabled = true; b.classList.add('loading'); });
    const first = document.querySelector<HTMLButtonElement>('#start .btn.primary');
    if (first) first.textContent = 'Laden…';
    await new Promise((r) => setTimeout(r, 30)); // let the loading state paint before the synchronous build
    try {
      await game.start(fresh);
      if (REVIEW && REVIEW !== 'dev01') mountReviewBar(game);
    } catch (e) {
      console.error(e);
      fail('Er ging iets mis bij het laden van de wereld. Herlaad de pagina; je bewaarde voortgang blijft staan.');
    }
  };
  if (REVIEW === 'dev01') {
    // DEV-01 slice review: own save namespace, its own start card (no art comparison bar)
    showSliceStart(game, () => begin(false));
    return;
  }
  if (REVIEW) {
    // art-review mode: sandboxed state (never the player's save), its own start card and comparison bar
    game.state = reviewState();
    showReviewStart(() => begin(false));
    return;
  }
  game.ui.showStart({
    hasSave: game.hasSave(), hasBackup: game.hasBackup(),
    onContinue: () => begin(false), onNew: () => begin(true),
    onRestore: () => { if (game.restoreBackup()) begin(false); },
  });
}

boot();
