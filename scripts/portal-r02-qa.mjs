// PORTAL-R02: paired real-world camera poses on either side of dining/kitchen arch.
// Captures the actual visible outdoor rooms, LOS-derived woodland window cone, and render budgets.
import { chromium } from 'playwright-core';
import { mkdirSync,writeFileSync } from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const BASE=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const dir='portal-r02-qa';mkdirSync(dir,{recursive:true});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}};
const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(BASE+'?autotest=1',{waitUntil:'domcontentloaded'});
 await page.evaluate(save=>localStorage.setItem('fehluwe.save',JSON.stringify(save)),SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.click('[data-cont]',{timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(()=>{const g=window.__game;g.running=false;g.settings.quality='low';g.applyQuality(true)});
 const rows=[];
 for(const pose of [{id:'dining-before',x:101,z:91.85,expected:'dining'},{id:'kitchen-after',x:101,z:92.38,expected:'kitchen'}]){
  const row=await page.evaluate(pose=>{
   const g=window.__game,w=g.world;
   const yaw=Math.atan2(97.5-pose.x,109.8-pose.z);
   g.player.setPose({x:pose.x,y:0.15,z:pose.z,yaw,pitch:0.02});
   g.player.applyCamera(g.camera);
   g.camera.updateMatrixWorld(true);
   w.updateCulling(g.camera.position,g.camera);
   g.renderer.render(w.scene,g.camera);
   return {id:pose.id,here:w.hereRoom,visibleRooms:[...w.visibleRooms],outVisible:w.visibleRooms.has('out'),
     sightlineWindows:w.outdoorWindows?.length??0,drawCalls:g.renderer.info.render.calls,
     tris:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError()};
  },pose);
  console.log('PORTAL_R02 '+JSON.stringify(row));
  if(row.here!==pose.expected||!row.outVisible||row.sightlineWindows===0||row.glError!==0)
    throw Error('Missing visible garden sightline at threshold: '+JSON.stringify(row));
  if(row.drawCalls>150||row.tris>750000)
    console.warn('PORTAL_R02_BUDGET_WARNING '+JSON.stringify(row));
  await page.screenshot({path:dir+'/'+pose.id+'.jpg',type:'jpeg',quality:83,timeout:60000});
  rows.push(row);
 }
 if(errors.length)throw Error('Page errors: '+errors.join(';'));
 writeFileSync(dir+'/results.json',JSON.stringify(rows,null,2));
 console.log('PORTAL_R02_PASS paired threshold sightlines');
}finally{await page.close();await browser.close();}
