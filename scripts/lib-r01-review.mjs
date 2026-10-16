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
  // R02 furniture close views, fixed positions for before/after owner comparison.
  ['12-secretary-chair-oblique', [77.4, 0.15, 96.2], [74.75, 0.89, 97.65]],
  ['13-wing-chair-faces-rug', [78.05, 0.15, 101.4], [75.8, 0.88, 102.75]],
  ['14-sofa-tufting-near', [78.0, 0.15, 101.45], [78.75, 0.79, 103.76]],
  ['15-spiral-sculpted-treads', [80.6, 0.15, 102.6], [81.95, 1.75, 105.3]],
];
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');

async function pageFor(viewport, mobile = false, dev01 = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url + (dev01 ? '&review=dev01' : ''));
  if (dev01) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click('[data-new]');
  } else {
    await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({
      version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'],
      flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true },
      player: { home: null, estate: { x: 82.4, y: 0.15, z: 99.0, yaw: 0, pitch: 0 } },
    })));
    await page.reload();
    await page.click('[data-cont]');
  }
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
    return {pose:g.player.pose(),room:g.world.hereRoom,calls:m.calls,triangles:m.triangles,glError:g.renderer.getContext().getError()};
  },{pose,target,withHud});
  await page.waitForTimeout(450);
  await page.screenshot({path:`${OUT}/${name}.jpg`, type:'jpeg',quality:84});
  records.push({name,...stats}); console.log('LIB-R01 SCREENSHOT', JSON.stringify({name,...stats}));
}

try {
  const { page, context } = await pageFor({width:1280,height:720});
  for(const [name,pose,target] of scenes) await capture(page,name,pose,target);
  // B01 and album still exist at their corresponding *new* world locations and save identifiers.
  const puzzle = await page.evaluate(() => {
    const g=window.__game;
    const ids=['library.catalog','library.desk','pk.studyKey','lamp.library','inspect.cipherExample'];
    return Object.fromEntries(ids.map(id=>{
      const obj=g.world.byId.get(id);
      if (!obj) return [id,{exists:false}];
      obj.hit?.[0]?.updateWorldMatrix(true,false);
      const v=obj.hit?.[0]?.getWorldPosition(new g.camera.position.constructor());
      return [id,{exists:true,position:v?[v.x,v.y,-v.z]:null}];
    }));
  });
  checks.push({name:'production-puzzle-and-lamp-anchors', data:puzzle,pass:Object.values(puzzle).every(v=>v.exists)});
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
  const descent=await page.evaluate(()=>{
    const g=window.__game, steps=26, x=81.95, z=105.3, p=[];
    const point=i=>{const a=-Math.PI/2+(i+.5)*Math.PI*2.5/steps;return [x+.78*Math.cos(a),z+.78*Math.sin(a)]};
    for(let i=steps-1;i>=0;i--){
      try{T.walkTo(...point(i),false,15);p.push({step:i,y:+g.player.y.toFixed(3)});}
      catch(e){return {pass:false,step:i,error:e.message,path:p};}
    }
    try{T.walkTo(82.0,103.8,false,20);}
    catch(e){return {pass:false,step:'exit-to-ground',error:e.message,path:p};}
    return {pass:Math.abs(g.player.y-0.15)<0.14,final:T.pos(),path:p};
  });
  checks.push({name:'spiral-downstairs-walking',data:descent,pass:descent.pass});
  console.log('LIB-R01 DESCENT',JSON.stringify(descent));
  await page.evaluate(()=>{const g=window.__game;g.settings.quality='low';g.applyQuality(true);});
  await capture(page,'11-desktop-low-comparison',[83.05,0.15,100.0],[78.4,1.55,102.3]);
  await context.close();
  const {page:mobile,context:mobileContext}=await pageFor({width:390,height:844},true);
  await capture(mobile,'08-mobile-portrait-lounge',[82.6,0.15,99.4],[78.5,1.2,103.4],true);
  await mobileContext.close();
  const {page:landscape,context:landContext}=await pageFor({width:844,height:390},true);
  await capture(landscape,'09-mobile-landscape-desk',[77.3,0.15,97.35],[74.55,1.0,97.35],true);
  await landContext.close();
  // Canonical B01+DS01 build is opt-in via review=dev01. Never confuse these
  // optional slice interactables with the production catalogue IDs.
  const review = await pageFor({width:1280,height:720},false,true);
  await capture(review.page,'10-b01-review-desk',[76.65,0.15,97.35],[74.55,0.93,97.35]);
  const v = await review.page.evaluate(()=>{
    const g=window.__game, ids=['b01.table','library.desk','pk.studyKey','ds01.album','lamp.library'];
    return Object.fromEntries(ids.map(id=>[id,{exists:g.world.byId.has(id)}]));
  });
  checks.push({name:'dev01-b01-ds01-anchors',data:v,pass:Object.values(v).every(x=>x.exists)});
  console.log('LIB-R01 DEV01',JSON.stringify(v));
  const targetability=await review.page.evaluate(()=>{
    const g=window.__game,out={};
    for(const [id,x,z] of [['b01.table',75.95,97.35],['ds01.album',75.75,106.6]]){
      g.player.setPose({x,y:0.15,z,yaw:0,pitch:0});T.tick(8);
      T.lookAtId(id);const m=g.metrics();
      out[id]={target:m.target,label:m.label,pass:m.target===id};
    }
    return out;
  });
  checks.push({name:'dev01-playable-reticle-targets',data:targetability,pass:Object.values(targetability).every(x=>x.pass)});
  console.log('LIB-R01 TARGETS',JSON.stringify(targetability));
  await review.context.close();
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
