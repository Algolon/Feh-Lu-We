// TEMPORARY (DEV-01 playtest on GitHub Pages) — deployment only, not game code.
// Injects an entry guard into the BUILT dist/index.html: every page load must run with ?review=dev01; when the
// parameter is missing or has another value, loading stops and the page redirects to the same URL with
// review=dev01 (other parameters are kept). The review build saves only under fehluwe.dev01.*, so the normal game
// (which would write fehluwe.save) never starts on this deployment. Run after `npm run build`.
// Remove together with the workflow change in .github/workflows/deploy-pages.yml when the playtest ends.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const file = 'dist/index.html';
const html = readFileSync(file, 'utf8');
const MARK = 'DEV-01 playtest entry guard';
if (html.includes(MARK)) throw new Error('guard already present');
const anchor = '<script type="module"';
if (html.split(anchor).length !== 2) throw new Error('expected exactly one module script in dist/index.html');
const guard = `<script>/* ${MARK} (deployment only) */(function(){var u=new URL(location.href);` +
  `if(u.searchParams.get('review')!=='dev01'){u.searchParams.set('review','dev01');if(window.stop)window.stop();location.replace(u.href);}})();</script>\n    `;
writeFileSync(file, html.replace(anchor, guard + anchor));
// print what is deployed, so the CI log can be compared with a locally verified build
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
for (const f of ['index.html', ...readdirSync('dist/assets').map((a) => `assets/${a}`)]) console.log(`${sha(`dist/${f}`)}  ${f}`);
