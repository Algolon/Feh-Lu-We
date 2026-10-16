// BOSLUST-R05 QA — real Chromium touch events on the actual 3D lock.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT='scripts/out/boslust-r05';
mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let page;
const result={};
function assert(x,label){if(!x)throw Error(label);}
const logs=[];
try {
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  page=await ctx.newPage();
  page.on('pageerror',e=>logs.push(String(e)));
  await page.goto('http://127.0.0.1:4173/Feh-Lu-We/?autotest=1&multidraw=0');
  await page.evaluate(()=>{
    localStorage.setItem('fehluwe.save',JSON.stringify({
      version:4,scene:'estate',
      inventory:['invitation','torch','matches','notebook','frontKey','cipherStrip'],
      flags:{leftHome:true,routeRestored:true},unlocked:['lock.door.front'],open:{'door.front':true},
      clues:['c.routeRestored','c.letterstrook'],
      player:{home:null,estate:{x:64.42,y:0,z:16.6,yaw:0.25,pitch:-0.24}}
    }));
    localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
  });
  await page.reload();await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  await page.evaluate(()=>{
    const g=window.__game;
    g.world.byId.get('boslust.lock').run(); // key + clue opens cover
  });
  await page.waitForTimeout(600);
  await page.evaluate(()=>window.__game.tick(1/30));
  const state=()=>page.evaluate(()=>{
    const g=window.__game,root=document.querySelector('#boslust-focus');
    return {code:[0,1,2,3].map(i=>g.state.dials['boslust.wheel.'+i]??0),
      focus:g.isBoslustInspecting,modal:g.ui.modalOpen, mobile:root?.classList.contains('touch-mode'),
      guides:[...document.querySelectorAll('.boslust-guide')].map(x=>({
        hidden:x.hidden,left:x.style.left,top:x.style.top,opacity:getComputedStyle(x).opacity,active:x.classList.contains('active')})),
      mobileHint:getComputedStyle(document.querySelector('.boslust-mobile-hint')).display,
      desktopHint:getComputedStyle(document.querySelector('.boslust-desktop-hint')).display,
      keyboardHint:getComputedStyle(document.querySelector('.boslust-key-hint')).display,
      back:document.querySelector('.boslust-back').getBoundingClientRect().toJSON(),
      calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
  });
  const projection=(id,dy=0)=>page.evaluate(({id,dy})=>{
    const g=window.__game, it=g.world.byId.get(id), obj=it.obj;
    obj.updateWorldMatrix(true,false);g.camera.updateMatrixWorld(true);
    const v=new g.camera.position.constructor(0,dy,0).applyMatrix4(obj.matrixWorld).project(g.camera);
    const rect=document.getElementById('game').getBoundingClientRect();
    const x=rect.left+(v.x+1)*.5*rect.width,y=rect.top+(1-v.y)*.5*rect.height;
    const found=g.pickAt(v.x,v.y);
    return {x,y,hit:found?.it.id??null,localY:found?.point?obj.worldToLocal(found.point.clone()).y:null};
  },{id,dy});
  result.initial=await state();
  console.log('initial',JSON.stringify(result.initial));
  assert(result.initial.focus && !result.initial.modal,'no immersive focus');
  assert(result.initial.mobile && result.initial.mobileHint!=='none' && result.initial.keyboardHint==='none' && result.initial.desktopHint==='none','keyboard hints still visible on mobile');
  assert(result.initial.guides.every(x=>!x.hidden&&x.opacity!=='0'),'wheel guides missing');
  assert(result.initial.back.height>=48,'back tap target too short');
  for(const i of [0,1,2,3]){
    const p=await projection('boslust.wheel.'+i);
    assert(p.hit==='boslust.wheel.'+i,'wheel '+i+' targeting overlap '+p.hit);
  }
  const knob=await projection('boslust.knob');
  assert(knob.hit==='boslust.knob','knob target overlap');
  await page.screenshot({path:OUT+'/01-mobile-idle.png',timeout:120000});
  const top=await projection('boslust.wheel.0',0.060);
  const bottom=await projection('boslust.wheel.0',-0.060);
  console.log('zones',top,bottom);
  assert(top.hit==='boslust.wheel.0'&&top.localY>0,'top missed wheel');
  assert(bottom.hit==='boslust.wheel.0'&&bottom.localY<0,'bottom missed wheel');
  await page.touchscreen.tap(top.x,top.y);
  result.top=await state();
  assert(result.top.code[0]===1,'top tap must advance digit');
  await page.touchscreen.tap(bottom.x,bottom.y);
  result.bottom=await state();
  assert(result.bottom.code[0]===0,'bottom tap must reverse digit');
  const wheel1=await projection('boslust.wheel.1');
  const cdp=await ctx.newCDPSession(page);
  const id=21;
  const touch=(type,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:wheel1.x,y,id}],modifiers:0});
  await touch('touchStart',wheel1.y);
  for(const offset of [18,36,54,72,96])await touch('touchMove',wheel1.y-offset);
  await touch('touchEnd',wheel1.y-96);
  result.swipe=await state();
  console.log('after-swipe',JSON.stringify(result.swipe));
  assert(result.swipe.code[1]===3,'up swipe should turn 3 detents, got '+result.swipe.code[1]);
  assert(result.swipe.guides[1].active,'wheel 2 should highlight');
  await page.screenshot({path:OUT+'/02-mobile-swiped.png',timeout:120000});
  await page.touchscreen.tap(knob.x,knob.y);
  result.wrong=await page.evaluate(()=>({
    wrong:window.__game.state.wrong.boslust,open:!!window.__game.state.flags.boslustOpen,
    focus:window.__game.isBoslustInspecting
  }));
  assert(result.wrong.wrong===1&&!result.wrong.open&&result.wrong.focus,'wrong knob attempt');
  await page.evaluate(()=>{const g=window.__game;[2,4,1,3].forEach((d,i)=>g.state.dials['boslust.wheel.'+i]=d);g.changed();});
  await page.touchscreen.tap(knob.x,knob.y);
  result.solved=await page.evaluate(()=>({
    open:!!window.__game.state.flags.boslustOpen,door:!!window.__game.state.open['door.boslust'],
    focus:window.__game.isBoslustInspecting
  }));
  console.log('solved',result.solved);
  assert(result.solved.open&&result.solved.door&&!result.solved.focus,'right code did not unlock');
  // Release the heavy mobile WebGL scene before starting desktop: software
  // renderers cannot reliably initialize two estate scenes concurrently.
  await ctx.close();
  // Desktop regression: keyboard copy, fine-pointer tap remains +1.
  const dpage=await browser.newPage({viewport:{width:1100,height:730}});
  await dpage.goto('http://127.0.0.1:4173/Feh-Lu-We/?autotest=1&multidraw=0');
  await dpage.evaluate(()=>{
    localStorage.setItem('fehluwe.save',JSON.stringify({
      version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey','cipherStrip'],
      flags:{leftHome:true,routeRestored:true},unlocked:['lock.door.front'],open:{'door.front':true},
      clues:['c.routeRestored','c.letterstrook'],player:{home:null,estate:{x:64.42,y:0,z:16.6,yaw:0.25,pitch:-0.24}}
    }));
    localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
  });
  await dpage.reload({waitUntil:'domcontentloaded',timeout:90000});await dpage.click('[data-cont]');
  await dpage.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  await dpage.evaluate(()=>{window.__game.world.byId.get('boslust.lock').run();window.__game.tick(1/30);});
  await dpage.waitForTimeout(300);
  result.desktop=await dpage.evaluate(()=>{
    const root=document.querySelector('#boslust-focus');
    return {desktop:getComputedStyle(document.querySelector('.boslust-desktop-hint')).display,
      keyboard:getComputedStyle(document.querySelector('.boslust-key-hint')).display,
      guides:[...document.querySelectorAll('.boslust-guide')].map(x=>getComputedStyle(x).opacity),
      focus:window.__game.isBoslustInspecting};
  });
  assert(result.desktop.desktop!=='none'&&result.desktop.keyboard!=='none','desktop hint missing');
  assert(result.desktop.guides.every(x=>x==='0'),'touch guides leaked on desktop');
  await dpage.close();
  assert(!logs.length,'JS errors: '+logs.join(';'));
  writeFileSync(OUT+'/results.json',JSON.stringify({...result,logs},null,2));
} finally {await browser.close();await new Promise(ok=>server.httpServer.close(ok));}
