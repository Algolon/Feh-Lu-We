// BOSLUST-R04: direct diegetic interaction / camera / stone keep-out QA in actual game.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT='scripts/out/boslust-r04';
mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errors=[], record={};
const check=(test,message)=>{if(!test)throw new Error(message);};
let page;
try {
  page=await browser.newPage({viewport:{width:1100,height:730},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/Feh-Lu-We/?autotest=1&multidraw=0');
  await page.evaluate(()=>{
    localStorage.setItem('fehluwe.save',JSON.stringify({
      version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey','cipherStrip'],
      flags:{leftHome:true,routeRestored:true},unlocked:['lock.door.front'],open:{'door.front':true},
      clues:['c.routeRestored','c.letterstrook'],
      player:{home:null,estate:{x:64.42,y:0,z:16.60,yaw:0.25,pitch:-0.24}}
    }));
    localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  await page.waitForTimeout(900);
  record.site=await page.evaluate(()=>{
    const g=window.__game;const obj=g.world.byId.get('boslust.lock').obj;
    return {lock:obj.position.toArray(),player:g.player.pose(),before:g.state.flags.boslustCover,
      modal:g.ui.modalOpen,hasHud:!!document.querySelector('#boslust-focus')};
  });
  console.log('site',record.site);
  check(Math.abs(record.site.lock[1]-1.64)<.01,'Lock not raised');
  check(!record.site.before,'Cover should start locked');
  // World action as if player reached the lock; uses canonical cover+strip gate.
  record.enter=await page.evaluate(()=>{
    const g=window.__game;g.world.byId.get('boslust.lock').run();
    return {inspecting:g.isBoslustInspecting,cover:!!g.state.flags.boslustCover,
      modal:g.ui.modalOpen,hud:!!document.querySelector('#boslust-focus'),paused:g.input.enabled};
  });
  console.log('enter',record.enter);
  check(record.enter.inspecting&&record.enter.cover&&!record.enter.modal&&record.enter.hud&&!record.enter.paused,'Not a modal-free locked zoom');
  await page.waitForTimeout(1400);
  record.aim=await page.evaluate(()=>{
    const g=window.__game; const obj=g.world.byId.get('boslust.lock').obj;
    const pts=[[-.50,-.23],[-.50,.23],[.50,-.23],[.50,.23]];
    obj.updateWorldMatrix(true,true);
    const corners=pts.map(([x,y])=>new g.camera.position.constructor(x,y,.28).applyMatrix4(obj.matrixWorld).project(g.camera).toArray());
    return {position:g.camera.position.toArray(),fov:g.camera.fov,aspect:g.camera.aspect,
      corners, saved:g.player.pose(),
      calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
  });
  console.log('aim',record.aim);
  check(record.aim.corners.every(p=>Math.abs(p[0])<.95&&Math.abs(p[1])<.9),'Landscape closeup clips casing');
  await page.screenshot({path:OUT+'/01-desktop-closeup.png',timeout:120000});
  const project=async id=>await page.evaluate((id)=>{
    const g=window.__game;const it=g.world.byId.get(id);const p=it.hit[0].getWorldPosition(new g.camera.position.constructor()).project(g.camera);
    const r=document.getElementById('game').getBoundingClientRect();
    return {x:r.left+(p.x+1)*.5*r.width,y:r.top+(1-p.y)*.5*r.height,ndc:[p.x,p.y],
      found:g.pickAt(p.x,p.y)?.it.id??null};
  },id);
  record.targets={};
  for(const id of ['boslust.knob',...Array.from({length:4},(_,i)=>'boslust.wheel.'+i)]){
    record.targets[id]=await project(id);
    check(record.targets[id].found===id,'Raycast overlaps '+id+' → '+record.targets[id].found);
  }
  console.log('targets',record.targets);
  await page.mouse.click(record.targets['boslust.wheel.0'].x,record.targets['boslust.wheel.0'].y);
  record.tap=await page.evaluate(()=>window.__game.state.dials['boslust.wheel.0']);
  check(record.tap===1,'Direct click failed to turn wheel');
  await page.mouse.move(record.targets['boslust.wheel.0'].x,record.targets['boslust.wheel.0'].y);
  await page.mouse.wheel(0,-120);
  record.scroll=await page.evaluate(()=>window.__game.state.dials['boslust.wheel.0']);
  check(record.scroll===2,'Desktop scroll failed');
  const w2=record.targets['boslust.wheel.1'];
  await page.mouse.move(w2.x,w2.y+30); await page.mouse.down(); await page.mouse.move(w2.x,w2.y-30,{steps:4}); await page.mouse.up();
  record.drag=await page.evaluate(()=>window.__game.state.dials['boslust.wheel.1']);
  check(record.drag===1,'Vertical drag failed');
  await page.waitForTimeout(400);
  await page.screenshot({path:OUT+'/02-desktop-wheels-2100.png',timeout:120000});
  record.persist=await page.evaluate(()=>{
    const g=window.__game;g.changed();return {code:[0,1,2,3].map(i=>g.state.dials['boslust.wheel.'+i]??0),
      popup:!!document.querySelector('.dials.digits'),pose:g.player.pose()};
  });
  check(record.persist.code.join('')==='2100'&&!record.persist.popup,'Code did not stay in world');
  // Portrait: same scene, same in-world view, verify full assembly visible.
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(1100);
  record.mobile=await page.evaluate(()=>{
    const g=window.__game,lock=g.world.byId.get('boslust.lock').obj;
    lock.updateWorldMatrix(true,true);
    const projected=[[-.50,-.23],[-.50,.23],[.50,-.23],[.50,.23]].map(([x,y])=>
      new g.camera.position.constructor(x,y,.28).applyMatrix4(lock.matrixWorld).project(g.camera).toArray());
    return {fov:g.camera.fov,projected,modal:g.ui.modalOpen,
      back:!!document.querySelector('.boslust-back'),lockY:lock.position.y};
  });
  console.log('mobile',record.mobile);
  check(record.mobile.projected.every(p=>Math.abs(p[0])<.95&&Math.abs(p[1])<.88),'Portrait closeup clips casing');
  await page.screenshot({path:OUT+'/03-mobile-closeup.png',timeout:120000});
  // Back must restore same player pose, normal camera and controls without saving any camera teleport.
  await page.click('.boslust-back');
  await page.waitForTimeout(700);
  record.back=await page.evaluate(()=>{
    const g=window.__game;return {inspecting:g.isBoslustInspecting,focus:!!g.boslustFocus,
      enabled:g.input.enabled,player:g.player.pose(),fov:g.camera.fov,
      hud:!!document.querySelector('#boslust-focus')};
  });
  console.log('back',record.back);
  check(!record.back.inspecting&&!record.back.focus&&record.back.enabled&&!record.back.hud,'Closeup did not fully exit');
  check(Math.abs(record.back.player.x-record.site.player.x)<.02&&Math.abs(record.back.player.z-record.site.player.z)<.02,'Inspect moved the player');
  // Re-enter without cover popup, trigger knob via visible world target after zoom settles.
  await page.evaluate(()=>window.__game.enterBoslustInspect());
  await page.waitForTimeout(800);
  const knob=await project('boslust.knob');
  await page.mouse.click(knob.x,knob.y);
  record.wrong=await page.evaluate(()=>{
    const g=window.__game;return {tries:g.state.wrong.boslust,open:!!g.state.flags.boslustOpen,
      focus:g.isBoslustInspecting};
  });
  check(record.wrong.tries===1&&!record.wrong.open&&record.wrong.focus,'Wrong knob should stay in zoom');
  // Complete with the same world code and press actual 3D knob through pointer surface.
  await page.evaluate(()=>{
    const g=window.__game;
    for(const [i,n] of [2,4,1,3].entries())g.state.dials['boslust.wheel.'+i]=n;
    g.changed();
  });
  await page.waitForTimeout(500);
  await page.mouse.click(knob.x,knob.y);
  record.solved=await page.evaluate(()=>{
    const g=window.__game;return {open:!!g.state.flags.boslustOpen,door:!!g.state.open['door.boslust'],
      focus:g.isBoslustInspecting,code:[0,1,2,3].map(i=>g.state.dials['boslust.wheel.'+i])};
  });
  console.log('solved',record.solved);
  check(record.solved.open&&record.solved.door&&!record.solved.focus,'Knob should solve and exit');
  writeFileSync(OUT+'/evidence.json',JSON.stringify({record,errors},null,2));
  check(!errors.length,'Browser errors '+errors.join(';'));
} finally {
  await browser.close();
  await new Promise(resolve=>server.httpServer.close(resolve));
}
