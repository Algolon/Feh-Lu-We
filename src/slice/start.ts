// DEV-01 review start card (?review=dev01). Its own save namespace (fehluwe.dev01.*): continuing, starting a new
// test, or starting from a COPY of the player's own save. The player's own save is read, never written.
import type { Game } from '../core/game';
import { BUILD } from '../core/game';
import { SAVE_KEY, BACKUP_KEY, storage, parseSave, readMainSave } from '../core/state';
import { freshSliceState, importMainSave, sl } from './model';
import { CONTENT_STATUS } from './content';

export function showSliceStart(game: Game, begin: () => void) {
  const el = document.getElementById('start')!;
  el.hidden = false;
  const cur = parseSave(storage.get(SAVE_KEY));
  const hasCur = !!cur && cur.scene === 'estate';
  const main = importMainSave(readMainSave());
  el.innerHTML = `<div class="card">
    <h1>Feh Lu We</h1>
    <p class="sub">Testversie DEV-01 · hal, bibliotheek en de kamers boven</p>
    <div class="row">
      ${hasCur ? '<button class="btn primary" data-cont>Verder met deze test</button>' : ''}
      <button class="btn ${hasCur ? '' : 'primary'}" data-new>Nieuwe test</button>
      ${main ? '<button class="btn" data-copy>Start met een kopie van mijn eigen spel</button>' : ''}
    </div>
    <p class="note">Je begint op het voorplein met een ingepakte tas. Deze test bewaart apart van je eigen spel:
    je eigen opgeslagen spel wordt hooguit gelezen (bij “kopie”), nooit veranderd of gewist.<br>
    Inhoud van deze test is voorlopig. <a href="${location.pathname}" style="color:inherit">Naar het gewone spel</a><br>Build ${BUILD}</p>
    <p class="note" hidden>${CONTENT_STATUS}</p>
  </div>`;
  const go = () => { el.querySelectorAll('button').forEach((b) => { b.disabled = true; }); begin(); };
  el.querySelector('[data-cont]')?.addEventListener('click', () => { game.state = cur!; sl(game.state); go(); });
  el.querySelector('[data-new]')?.addEventListener('click', () => {
    const prev = storage.get(SAVE_KEY);
    if (prev && parseSave(prev)) storage.set(BACKUP_KEY, prev); // a previous test is set aside (dev01 namespace only)
    game.state = freshSliceState();
    go();
  });
  el.querySelector('[data-copy]')?.addEventListener('click', () => { game.state = importMainSave(readMainSave())!; go(); });
}
