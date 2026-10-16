// ART-MOBILE-R03: browser smoke for the opt-in mobile diagnostics panel.
// Simulated mobile viewport/Chromium is NOT physical-Android GPU validation.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const dir='art-mobile-qa';mkdirSync(dir,{recursive:true});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}};
const rows=[];
try {
 for(const [mode,query] of [
  ['mobile-full','?autotest=1&artdiag=1'],
  ['mobile-compact','?autotest=1&artdiag=1&artmode=compact'],
  ['desktop-normal','?autotest=1']]) {
  const mobile=mode.startsWith('mobile');
  const page=await browser.newPage({viewport:mobile?{width:412,height:915}:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+query,{waitUntil:'domcontentloaded'});
  await page.evaluate(s=>localStorage.setItem('fehluwe.save',JSON.stringify(s)),SAVE);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.click('[data-cont]',{timeout:45000});
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:90000});
  await page.waitForFunction(()=>{
    const mats=new Set();window.__game.world.scene.traverse(o=>{if(o.material?.userData?.flwAtlas)mats.add(o.material);});
    return [...mats].some(m=>m.userData.flwAtlasLoad?.state==='ready');
  },null,{timeout:33000});
  let info=await page.evaluate(()=>{
    let material;window.__game.world.scene.traverse(o=>{if(o.material?.userData?.flwAtlas)material=o.material;});
    return {image:[material.map.image.width,material.map.image.height],mode:material.userData.flwAtlasLoad.mode,
      state:material.userData.flwAtlasLoad.state,textureVersion:material.map.version,
      diagnostic:!!document.querySelector('#flw-art-diagnostics')};
  });
  if(mobile){
    await page.click('#flw-art-diagnostics button');
    const diagnostics=JSON.parse(await page.locator('#flw-art-diag-output').textContent());
    info={...info,diags:{cpu:diagnostics.cpu,gpu:diagnostics.gpu,maxTextureSize:diagnostics.maxTextureSize}};
    if(info.diags.cpu?.std<5||info.diags.gpu?.stats?.std<5||info.diags.gpu?.glError!==0)throw Error('GPU art diagnostic failed: '+JSON.stringify(info));
  }
  if(mode==='mobile-compact'&&info.image.join('x')!=='1024x480')throw Error('Compact atlas resolution wrong: '+JSON.stringify(info));
  if(mode!=='mobile-compact'&&info.image.join('x')!=='2048x960')throw Error('Full atlas resolution wrong: '+JSON.stringify(info));
  if(info.diagnostic!==mobile)throw Error('Diagnostic overlay leaked into normal gameplay');
  if(errors.length)throw Error('Page errors: '+errors.join('; '));
  await page.screenshot({path:dir+'/'+mode+'.png'});
  rows.push({mode,pass:true,...info});console.log('ART_MOBILE_QA '+JSON.stringify(rows.at(-1)));
  await page.close();
 }
}finally{await browser.close();}
console.log('ART_MOBILE_QA_PASS '+JSON.stringify(rows.map(x=>x.mode)));
