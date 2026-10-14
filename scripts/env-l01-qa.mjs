// One immutable build; existing gameplay suites run sequentially with a shared preview namespace.
import { preview } from 'vite';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';
const OUT = process.argv[2] ?? 'scripts/out/env-l01-qa'; mkdirSync(OUT,{recursive:true});
const CHROME = process.env.CHROME ?? '/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell';
const bundle = () => Object.fromEntries(readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>[f,createHash('sha256').update(readFileSync(`dist/assets/${f}`)).digest('hex')]));
const suites = process.argv[3]?.split(',') ?? ['e2e','e2e-dev04c','e2e-dev04d'];
if (suites.some(name => !['e2e','e2e-dev04c','e2e-dev04d'].includes(name))) throw new Error('Unknown suite');
const before = bundle(), results = [];
const server = await preview({ preview: { host:'127.0.0.1',port:4188,strictPort:true } });
const BASE = 'http://127.0.0.1:4188/Feh-Lu-We/';
try {
  const browser = await chromium.launch({ executablePath:CHROME,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const page = await browser.newPage({viewport:{width:915,height:412}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(BASE+'?autotest=1&review=lighting&phase=0.667');
  const sentinel = { 'fehluwe.save':'OWNER-SAVE-SENTINEL', 'fehluwe.save.prev':'OWNER-BACKUP-SENTINEL', 'fehluwe.settings':JSON.stringify({quality:'low'}) };
  await page.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);},sentinel);
  await page.reload(); await page.click('[data-review-start]'); await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
  await page.evaluate(()=>{window.__game.running=false;});
  await page.click('[data-toggle]');
  const gameFlags = await page.evaluate(()=>JSON.stringify(window.__game.state.flags));
  for (const phase of ['0','0.3333333333333333','0.6666666666666666','1']) { await page.click(`[data-phase="${phase}"]`); await page.evaluate(()=>{const g=window.__game;for(let i=0;i<60;i++)g.tick(1/30);g.renderer.render(g.world.scene,g.camera);}); }
  await page.selectOption('[data-system]','baseline'); await page.selectOption('[data-system]','pilot');
  await page.selectOption('[data-quality]','high'); await page.selectOption('[data-quality]','low');
  await page.selectOption('[data-view]','Hal'); await page.selectOption('[data-view]','BOSLUST');
  const review = await page.evaluate(({sentinel,gameFlags})=>{
    const g=window.__game;for(let i=0;i<90;i++)g.tick(1/30);g.renderer.render(g.world.scene,g.camera);g.saveNow();
    const flags=JSON.stringify(g.state.flags);
    // Location visits are normal non-puzzle observation flags; lighting selection must not solve puzzles.
    const solved = Object.keys(g.state.flags).filter(k=>g.state.flags[k] && !['leftHome'].includes(k) && !k.startsWith('visited.'));
    return {saveIntact:Object.entries(sentinel).every(([k,v])=>localStorage.getItem(k)===v),solved,preview:g.extras.env.preview,
      room:g.world.hereRoom, quality:g.settings.quality, sun:g.extras.env.sun.intensity, pool:g.pool.lights.length,
      shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,glError:g.renderer.getContext().getError(),flagsBefore:gameFlags,flagsAfter:flags};
  },{sentinel,gameFlags});
  results.push({name:'lighting review controls / save isolation',ok:review.saveIntact && !review.solved.length && review.preview===1 && review.quality==='low' && review.sun===0 && review.pool===3 && !review.shaderFailures && !review.glError && !errors.length,review,errors});
  console.log(JSON.stringify(results.at(-1)));
  await browser.close();
  for (const name of suites) {
    const dir = `${OUT}/${name}`;mkdirSync(dir,{recursive:true});
    const log = [];
    const exitCode = await new Promise(resolve=>{
      const child=spawn(process.execPath,[`scripts/${name}.mjs`,BASE],{env:{...process.env,CHROME,E2E_OUT:dir},stdio:['ignore','pipe','pipe']});
      for(const pipe of [child.stdout,child.stderr])pipe.on('data',data=>{log.push(data.toString());process.stdout.write(data);});
      child.on('close',resolve);
    });
    writeFileSync(`${dir}/run.log`,log.join('')); results.push({name,exitCode,ok:exitCode===0});
    writeFileSync(`${OUT}/summary.json`,JSON.stringify({before,after:bundle(),results},null,2));
  }
} finally { await new Promise(r=>server.httpServer.close(r)); }
writeFileSync(`${OUT}/summary.json`,JSON.stringify({before,after:bundle(),results},null,2));
if (JSON.stringify(before)!==JSON.stringify(bundle()) || results.some(r=>!r.ok)) process.exitCode=1;
