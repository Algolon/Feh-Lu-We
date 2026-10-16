// R03 temporary visual + interaction QA. Real game build on SwiftShader.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT='scripts/out/boslust-r03';mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let page; const errors=[];
const log=(label,x)=>{const msg=JSON.stringify({label,...x}); console.log(msg);return msg;};
try {
  page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/Feh-Lu-We/?autotest=1&multidraw=0');
  await page.evaluate(()=>{
    const pose={x:64.65,y:0,z:16.53,yaw:0.14,pitch:-0.32};
    localStorage.setItem('fehluwe.save',JSON.stringify({
      version:4,scene:'estate',
      inventory:['invitation','torch','matches','notebook','frontKey','cipherStrip'],
      flags:{leftHome:true,routeRestored:true},
      unlocked:['lock.door.front'],open:{'door.front':true},
      clues:['c.routeRestored','c.letterstrook'],player:{home:null,estate:pose}
    }));
    localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  await page.waitForTimeout(1800);
  const before=await page.evaluate(()=>{
    const g=window.__game;
    g.player.x=64.65; g.player.z=16.53; g.player.y=0; g.player.yaw=0.14; g.player.pitch=-0.32;
    const ids=['boslust.lock','boslust.knob',...Array.from({length:4},(_,i)=>'boslust.wheel.'+i)];
    return Object.fromEntries(ids.map(id=>[id,g.world.byId.has(id)]));
  });
  log('interactables',before);
  if (Object.values(before).some(v=>!v))throw Error('Missing world interactable');

  const checks=await page.evaluate(()=>{
    const g=window.__game;
    const blocked=g.world.byId.get('boslust.wheel.0').label() === null;
    g.state.flags.boslustCover=true;
    g.world.syncAll();
    return {blockedBefore:blocked,wheel:g.world.byId.get('boslust.wheel.0').label(),
      knob:g.world.byId.get('boslust.knob').label()};
  });
  log('cover-gating',checks);
  if (!checks.blockedBefore||!checks.wheel||!checks.knob)throw Error('Cover gate invalid');
  await page.waitForTimeout(1300);
  await page.screenshot({path:OUT+'/01-open-initial.png',timeout:120000});
  const wheel=await page.evaluate(()=>{
    const g=window.__game;
    const ids=['boslust.wheel.0','boslust.wheel.1','boslust.wheel.2','boslust.wheel.3','boslust.knob'];
    const picks={};
    for (const id of ids) {
      const it=g.world.byId.get(id);
      g.camera.updateMatrixWorld();
      it.obj.updateMatrixWorld(true,true);
      const pt=it.hit[0].getWorldPosition(new g.camera.position.constructor()).project(g.camera);
      const found=g.pickAt(pt.x,pt.y);
      picks[id]={ndc:[+pt.x.toFixed(3),+pt.y.toFixed(3)],hit:found?.it?.id??null};
    }
    g.world.byId.get('boslust.wheel.0').run();
    g.world.byId.get('boslust.wheel.1').run();
    const after=[0,1,2,3].map(i=>g.state.dials['boslust.wheel.'+i]??0);
    return {picks,after};
  });
  log('wheel-turns-and-targeting',wheel);
  if (JSON.stringify(wheel.after)!=='[1,1,0,0]')throw Error('World wheel action did not update saved code');
  await page.waitForTimeout(1000);
  await page.screenshot({path:OUT+'/02-open-wheels-1100.png',timeout:120000});

  const modal=await page.evaluate(()=>{
    const g=window.__game; g.openPanel('boslust');
    return [...document.querySelectorAll('.dials.digits .face.num')].map(el=>el.textContent.trim());
  });
  log('panel-initial', {modal});
  if (modal.join('')!=='1100')throw Error('Modal did not get world digit draft');
  await page.click('[data-up="2"]');
  const synced=await page.evaluate(()=>({digits:[0,1,2,3].map(i=>window.__game.state.dials['boslust.wheel.'+i]??0)}));
  log('panel-updates-world',synced);
  if(synced.digits.join('')!=='1110')throw Error('Panel did not synchronize to world');
  await page.click('[data-close]');
  const wrong=await page.evaluate(()=>{
    const g=window.__game;
    const was=g.tryBoslustCode();
    return {success:was,tries:g.state.wrong.boslust,unlocked:!!g.state.flags.boslustOpen};
  });
  log('wrong-code',wrong);
  if(wrong.success||wrong.unlocked||!wrong.tries)throw Error('Wrong combination accepted');

  // Set 2413 via the actual panel, then try the physical knob.
  const solved=await page.evaluate(()=>{
    const g=window.__game;
    for(const [i,n] of [2,4,1,3].entries())g.state.dials['boslust.wheel.'+i]=n;
    g.changed();
    g.world.byId.get('boslust.knob').run();
    return {open:!!g.state.flags.boslustOpen,door:!!g.state.open['door.boslust'],
      number:[0,1,2,3].map(i=>g.state.dials['boslust.wheel.'+i])};
  });
  log('physical-knob-solves',solved);
  if(!solved.open||!solved.door)throw Error('Knob failed to submit solution');
  await page.waitForTimeout(950);
  await page.screenshot({path:OUT+'/03-open-solved.png',timeout:120000});
  const perf=await page.evaluate(()=>{
    const g=window.__game;return {calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,
      dialsDisabled:g.world.byId.get('boslust.wheel.0').label()===null,
      knobDisabled:g.world.byId.get('boslust.knob').label()===null};
  });
  log('performance-and-closed-actions',perf);
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(800);
  await page.screenshot({path:OUT+'/04-mobile-portrait.png',timeout:120000});
  writeFileSync(OUT+'/results.json',JSON.stringify({checks,wheel,modal,synced,wrong,solved,perf,errors},null,2));
  if(!perf.dialsDisabled||!perf.knobDisabled||errors.length)throw Error('Post-solve or runtime error');
} finally {
 await browser.close();
 await new Promise(resolve=>server.httpServer.close(resolve));
}
