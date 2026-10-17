// LIGHT-R05: controlled real-scene light ablation diagnostic.
// At the SAME player pose, render the scene with and without the three pooled
// PointLights. Difference isolates direct point-light contribution from
// geometry, portals, camera movement, patches, ambient and world culling.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const ROOT = process.argv[2] ?? 'http://127.0.0.1:4188/Feh-Lu-We/';
const OUT='light-r05-ablation';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--ignore-gpu-blocklist','--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
const segment=(name,pts,yaw,doors=[])=>({name,pts,yaw,doors});
const linear=(a,b,step=.25)=>{
 const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step);
 return Array.from({length:n+1},(_,i)=>({x:a[0]+(b[0]-a[0])*i/n,z:a[1]+(b[1]-a[1])*i/n}));
};
const chain=(...pairs)=>pairs.flatMap((p,i)=>linear(p[0],p[1]).slice(i===0?0:1));
const ROUTES=[
 segment('hall-to-living',linear([92,86.7],[77,86.7]),-Math.PI/2),
 segment('dining-to-kitchen',linear([102,87],[102,96]),0),
 segment('hall-to-library',chain([[90,95],[90,100.5]],[[90,100.5],[78,100.5]]),-Math.PI/2,['door.library'])
];
const save={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.hallChandelier':true,'lamp.livingFloor':true,
 'lamp.library':true,'lamp.libraryChandelier':true},
 flags:{leftHome:true},unlocked:[],open:{}};
const initialize=async(doors)=>{
 await page.goto(ROOT+'?autotest=1',{waitUntil:'domcontentloaded'});
 await page.evaluate((data)=>{localStorage.setItem('fehluwe.save',JSON.stringify(data));
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));},save);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(doors=>{const g=window.__game;g.running=false;
  g.settings.quality='low';g.settings.reducedMotion=true;g.applyQuality(true);
  for(const id of doors)g.state.open[id]=true;
  if(doors.length)g.changed();
 },doors);
};
const next=async(p,yaw)=>{
 return page.evaluate(({p,yaw})=>{
  const g=window.__game,w=g.world;
  g.player.setPose({x:p.x,y:.15,z:p.z,yaw,pitch:-.02});
  for(let i=0;i<3;i++)g.tick(.05);
  const l=g.pool.lights, renderer=g.renderer,gl=renderer.getContext();
  const rect=[Math.floor(gl.drawingBufferWidth*.40),Math.floor(gl.drawingBufferHeight*.38),
              Math.max(2,Math.floor(gl.drawingBufferWidth*.2)),
              Math.max(2,Math.floor(gl.drawingBufferHeight*.2))];
  const rgb=()=>{const pixels=new Uint8Array(rect[2]*rect[3]*4);
   gl.readPixels(...rect,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let sum=0;for(let i=0;i<pixels.length;i+=4)
    sum+=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
   return +(sum/(pixels.length/4)).toFixed(3);
  };
  renderer.render(w.scene,g.camera);
  const on=rgb();
  const intensities=l.map(x=>x.intensity);
  try{
   for(const x of l)x.intensity=0;
   renderer.render(w.scene,g.camera);
   const without=rgb();
   return {x:p.x,z:p.z,room:w.hereRoom,visible:[...w.visibleRooms],
    on,without,pointContribution:+(on-without).toFixed(3),
    ids:g.pool.assigned(),intensities:intensities.map(x=>+x.toFixed(3)),
    indoor:+g.indoor.toFixed(3),gain:+g.pool.gain.toFixed(3)
   };
  }finally{l.forEach((x,i)=>x.intensity=intensities[i]);}
 },{p,yaw});
};
try {
 const routes=[];
 for(const route of ROUTES){
  await initialize(route.doors);
  const samples=[];
  for(const p of route.pts)samples.push(await next(p,route.yaw));
  const metrics={};
  for(const key of ['on','without','pointContribution']){
   const deltas=samples.slice(1).map((v,i)=>({jump:+Math.abs(v[key]-samples[i][key]).toFixed(3),
     x:v.x,z:v.z,from:samples[i][key],to:v[key],roomBefore:samples[i].room,roomAfter:v.room,
     beforeIds:samples[i].ids,afterIds:v.ids}));
   const largest=deltas.sort((a,b)=>b.jump-a.jump).slice(0,5);
   metrics[key]={peak:largest[0]?.jump??0,largest};
  }
  routes.push({id:route.name,metrics,samples});
  console.log('LIGHT_R05_ABLATION '+JSON.stringify({id:route.name,metrics}));
 }
 writeFileSync(OUT+'/trace.json',JSON.stringify({routes,errors},null,2));
 if(errors.length)throw Error(errors.slice(0,5).join(' | '));
}finally{await browser.close();}
