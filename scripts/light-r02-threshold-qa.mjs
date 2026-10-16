// LIGHT-R02 render/selection QA. Same camera with a 53 cm move across the
// dining/kitchen arch, preserving the real three-light mobile budget.
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
mkdirSync('light-r02-qa',{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}};
try {
 await page.goto(base+'?autotest=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.evaluate(save=>localStorage.setItem('fehluwe.save',JSON.stringify(save)),SAVE);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.click('[data-cont]',{timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(()=>{let g=window.__game;g.running=false;g.settings.quality='low';g.applyQuality(true);});
 const rows=[];
 for(const pose of [
  {name:'dining-before',x:101,z:91.85,room:'dining'},
  {name:'kitchen-after',x:101,z:92.38,room:'kitchen'}
 ]) {
  const data=await page.evaluate(p=>{
   const g=window.__game, w=g.world;
   const yaw=Math.atan2(101-p.x,108-p.z);
   g.player.setPose({x:p.x,y:.15,z:p.z,yaw,pitch:.025});
   g.player.applyCamera(g.camera);
   for(let n=0;n<20;n++)g.tick(.05);
   g.renderer.render(w.scene,g.camera);
   return {name:p.name,room:w.hereRoom,visible:[...w.visibleRooms],
    lightSlots:g.pool.lights.length,
    assigned:g.pool.assigned(),
    intensities:g.pool.lights.map(l=>Math.round(l.intensity*100)/100),
    candidates:w.lamps.filter(l=>l.on()).map(l=>({id:l.id,pos:l.pos.toArray(),room:l.room})),
    drawCalls:g.renderer.info.render.calls,
    tris:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError()};
  },pose);
  if(data.room!==pose.room)throw Error('Wrong test room: '+JSON.stringify(data));
  if(data.lightSlots!==3)throw Error('Mobile low: more than 3 point lights allocated');
  if(data.drawCalls>150)throw Error('Budget regression >150 calls: '+JSON.stringify(data));
  if(data.glError!==0)throw Error('WebGL error at threshold');
  rows.push(data);
  console.log('LIGHT_R02_POSE '+JSON.stringify(data));
  await page.screenshot({path:'light-r02-qa/'+pose.name+'.jpg',type:'jpeg',quality:82,timeout:45000});
 }
 if(errors.length)throw Error(errors.join('; '));
 writeFileSync('light-r02-qa/results.json',JSON.stringify(rows,null,2));
 console.log('LIGHT_R02_VISUAL_QA_PASS');
} finally {await page.close();await browser.close();}
