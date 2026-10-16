// LIB-R01 candidate evidence. Images are rendered by the actual Vite game; no image generation.
// All camera placement is for QA capture only. Traversal tests use actual collision/autopilot.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const OUT = 'docs/lib-r01/review';
mkdirSync(OUT, { recursive: true });
const records = [], errors = [], checks = [];
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0] + 'Feh-Lu-We/?autotest=1';
const chrome = process.env.CHROME || chromium.executablePath();
const browser = await chromium.launch({
  executablePath: chrome, headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
});
const { PI } = Math;
const scenes = [
  ['01-entrance-wide', [83.05, 0.15, 100.0], [78.4, 1.55, 102.3]],
  ['02-reading-lounge', [81.4, 0.15, 99.5], [77.7, 0.9, 103.3]],
  ['03-puzzle-bureau', [77.15, 0.15, 97.35], [74.5, 1.0, 97.35]],
  ['04-window-bay-shelves', [81.25, 0.15, 102.0], [72.75, 1.55, 101.0]],
  ['05-north-builtins', [79.0, 0.15, 105.1], [78.5, 1.6, 109.1]],
  ['06-spiral-from-floor', [79.7, 0.15, 103.8], [81.95, 2.2, 105.3]],
  ['07-spiral-upper-gallery', [83.7, 3.35, 105.2], [81.95, 2.6, 105.3]],
];
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');

async function pageFor(viewport, mobile = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({
    version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'],
    flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true },
    player: { home: null, estate: { x: 82.4, y: 0.15, z: 99.0, yaw: 0, pitch: 0 } },
  })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 150000 });
  await page.evaluate(helpers);
  await page.evaluate(() => { const g=window.__game; if (T.modalOpen()) T.closeModal(); });
  return { page, context };
}
async function capture(page, name, pose, target, withHud=false) {
  const stats = await page.evaluate(({pose,target,withHud}) => {
    const g = window.__game;
    g.player.setPose({x:pose[0], y:pose[1], z:pose[2], yaw:0, pitch:0});
    g.player.y = g.world.col.supportHeight(pose[0],pose[2],pose[1]+0.05,0.42);
    T.lookAt(target[0],target[1],target[2]);
    T.tick(12);
    g.renderer.render(g.world.scene,g.camera);
    if(!withHud) for(const id of ['hud','stick','toast']) {
      const el=document.getElementById(id); if(el) el.style.display='none';
    }
    const m=g.metrics();
    return {name,pose:g.player.pose(),room:g.world.hereRoom,calls:m.calls,triangles:m.triangles,glError:g.renderer.getContext().getError()};
  },{pose,target,withHud});
  await page.waitForTimeout(450);
  await page.screenshot({path:`${OUT}/${name}.jpg`, type:'jpeg',quality:84});
  records.push(stats); console.log('LIB-R01 SCREENSHOT', JSON.stringify(stats));
}

try {
  const { page, context } = await pageFor({width:1280,height:720});
  for(const [name,pose,target] of scenes) await capture(page,name,pose,target);
  // B01 and album still exist at their corresponding *new* world locations and save identifiers.
  const puzzle = await page.evaluate(() => {
    const g=window.__game;
    const ids=['b01.table','library.desk','pk.studyKey','ds01.album','lamp.library'];
    return Object.fromEntries(ids.map(id=>{
      const obj=g.world.byId.get(id);
      if (!obj) return [id,{exists:false}];
      obj.hit?.[0]?.updateWorldMatrix(true,false);
      const v=obj.hit?.[0]?.getWorldPosition(new g.camera.position.constructor());
      return [id,{exists:true,position:v?[v.x,v.y,-v.z]:null}];
    }));
  });
  checks.push({name:'puzzle-and-album-anchors', data:puzzle,pass:Object.values(puzzle).every(v=>v.exists)});
  // Walk actual steps one by one using the game's own autopilot/collision, not teleports.
  const spiral=await page.evaluate(()=>{
    const g=window.__game, steps=26,x=81.95,z=105.3;
    const out=[];
    const start=-Math.PI/2, turn=Math.PI*2.5;
    const pt=i=>{const a=start+(i+0.5)*turn/steps;return [x+0.78*Math.cos(a),z+0.78*Math.sin(a)]};
    const [sx,sz]=pt(0);
    g.player.setPose({x:sx,y:0.15,z:sz-0.25,yaw:0,pitch:0});
    T.tick(6);
    for(let i=0;i<steps;i++){
      const p=pt(i);
      try{ T.walkTo(...p,false,15);out.push({i,feet:+g.player.y.toFixed(3),x:+g.player.x.toFixed(3),z:+g.player.z.toFixed(3)}); }
      catch(e){return {pass:false,at:i,error:e.message,steps:out};}
    }
    try{ T.walkTo(83.38,105.32,false,20); }
    catch(e){return {pass:false,at:'landing',error:e.message,steps:out};}
    return {pass:Math.abs(g.player.y-3.35)<0.30,final:T.pos(),steps:out};
  });
  checks.push({name:'spiral-upstairs-walking',data:spiral,pass:spiral.pass});
  console.log('LIB-R01 STAIR',JSON.stringify(spiral));
  await context.close();
  const {page:mobile,context:mobileContext}=await pageFor({width:390,height:844},true);
  await capture(mobile,'08-mobile-portrait-lounge',[82.6,0.15,99.4],[78.5,1.2,103.4],true);
  await mobileContext.close();
  const {page:landscape,context:landContext}=await pageFor({width:844,height:390},true);
  await capture(landscape,'09-mobile-landscape-desk',[77.3,0.15,97.35],[74.55,1.0,97.35],true);
  await landContext.close();
} catch(e) {
  errors.push('QA script: '+e.stack);
  console.error(e.stack);
} finally {
  writeFileSync(OUT+'/results.json',JSON.stringify({source:'actual candidate branch Vite/Chromium SwiftShader',commit:process.env.GITHUB_SHA??null,records,checks,errors,realDeviceVerified:false},null,2));
  await browser.close();
  await server.close();
}
if(errors.length)process.exitCode=1;
// A non-passing collision check is recorded as a blocker for review, but images still persist.
