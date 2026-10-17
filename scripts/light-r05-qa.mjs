// LIGHT-R05 actual-world QA: controlled routes, per-source point lights, visual probes.
// Run against an actual built Vite preview (no mocked rooms). Baseline and candidate
// run exactly this harness on identical save, dt, camera pose and quality.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const name = process.env.LIGHT_R05_PROFILE || 'candidate';
const url = process.argv[2] || 'http://127.0.0.1:4188/Feh-Lu-We/';
const out = 'light-r05-qa/' + name;
mkdirSync(out,{recursive:true});
const browser = await chromium.launch({headless:true,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
const page = await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const SOURCE='fire.living';
const route=(id,a,b,z,n=61)=>({id,n,yaw:-Math.PI/2,points:Array.from({length:n},(_,i)=>({x:a+(b-a)*i/(n-1),z}))});
const path=(id,waypoints,yaw,opens=[])=>{
 const points=[];
 for(let p=1;p<waypoints.length;p++){
  const a=waypoints[p-1],b=waypoints[p],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25);
  for(let i=p===1?0:1;i<=n;i++)points.push({x:a[0]+(b[0]-a[0])*i/n,z:a[1]+(b[1]-a[1])*i/n});
 }
 return {id,points,yaw,opens};
};
const ROUTES=[
 route('hall-to-living',92,77,86.7),
 route('living-to-hall',77,92,86.7),
 // Door is at X 89.5..90.5, Z=104, connecting the lobby to billiard.
 // The prior straight-X test at Z=100 crossed a solid wall into the basement stair.
 path('hall-to-billiard',[[90.0,95.0],[90.0,100.5],[90.0,107.0]],0,['door.billiard']),
 route('dining-to-hall',97.2,92.5,85.2),
 // Library door at X=85, Z=100.5; travel through rear lobby, not through the west wall.
 path('hall-to-library',[[90.0,95.0],[90.0,100.5],[78.0,100.5]],-Math.PI/2,['door.library']),
 path('dining-to-kitchen',[[102,87],[102,96]],0)
];
const save={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.hallChandelier':true,'lamp.livingFloor':true,
 'lamp.library':true,'lamp.libraryChandelier':true},flags:{leftHome:true},unlocked:[],open:{}};
const read=async (x,z,t,shot=false,yaw=-Math.PI/2)=>{
 return await page.evaluate(({x,z,t,shot,yaw})=>{
  const g=window.__game, w=g.world;
  g.player.setPose({x,y:.15,z,yaw,pitch:-.02});
  g.tick(.05);
  const slots=g.pool.assigned(), lights=g.pool.lights;
  const ids=slots.map((id,i)=>({id,strength:+lights[i].intensity.toFixed(3)}));
  const fire=slots.indexOf('fire.living');
  let pixels=null;
  if(shot) {
   g.renderer.render(w.scene,g.camera);
   const gl=g.renderer.getContext();
   const rect=[Math.floor(gl.drawingBufferWidth*.40),Math.floor(gl.drawingBufferHeight*.38),
               Math.max(2,Math.floor(gl.drawingBufferWidth*.2)),Math.max(2,Math.floor(gl.drawingBufferHeight*.2))];
   const data=new Uint8Array(rect[2]*rect[3]*4);
   gl.readPixels(...rect,gl.RGBA,gl.UNSIGNED_BYTE,data);
   let sum=0;
   for(let i=0;i<data.length;i+=4)sum+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
   pixels=+(sum/(data.length/4)).toFixed(3);
  }
  return {x,z,t,room:w.hereRoom,visible:[...w.visibleRooms],fire:+(fire<0?0:lights[fire].intensity).toFixed(3),
   slots:ids,pixels,indoor:+g.indoor.toFixed(3),gain:+g.pool.gain.toFixed(3),
   calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
 },{x,z,t,shot,yaw});
};
try {
 await page.goto(url+'?autotest=1',{waitUntil:'domcontentloaded'});
 await page.evaluate(s=>{localStorage.setItem('fehluwe.save',JSON.stringify(s));
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));},save);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(()=>{const g=window.__game;g.running=false;
  g.settings.quality='low';g.applyQuality(true);g.state.lit['fire.living']=true;g.changed();});
 const results=[];
 for(const r of ROUTES){
  // Reset pool on each route to avoid conditioning from previous trajectory.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-cont]').click({timeout:45000});
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  await page.evaluate(opens=>{
    const g=window.__game;g.running=false;g.settings.quality='low';g.applyQuality(true);
    for(const door of opens)g.state.open[door]=true;
    if(opens.length)g.changed();
  },r.opens||[]);
  const rows=[];
  for(let i=0;i<r.points.length;i++){
   const p=r.points[i];
   for(let f=0;f<3;f++) rows.push(await read(p.x,p.z,(i*3+f)*.05,f===2,r.yaw));
   if(i%12===0){
    await page.screenshot({path:out+'/'+r.id+'-'+String(i).padStart(2,'0')+'.jpg',
     type:'jpeg',quality:68,timeout:60000});
   }
  }
  const traces=rows.filter((x,i)=>i%3===2), shifts=[];
  for(let i=1;i<traces.length;i++){
   const a=traces[i-1],b=traces[i];
   if(a.slots.map(s=>s.id).join()!==b.slots.map(s=>s.id).join())shifts.push({x:b.x,z:b.z,from:a.slots.map(s=>s.id),to:b.slots.map(s=>s.id)});
  }
  const maxLightJump=traces.reduce((v,x,i)=>i?Math.max(v,Math.abs(x.fire-traces[i-1].fire)):0,0);
  const maxPixelJump=traces.reduce((v,x,i)=>i?Math.max(v,Math.abs((x.pixels??0)-(traces[i-1].pixels??0))):0,0);
  results.push({id:r.id,changes:shifts,peakFireJump:+maxLightJump.toFixed(3),
   peakPixelJump:+maxPixelJump.toFixed(3),samples:traces.map(x=>({
    x:+x.x.toFixed(3),z:+x.z.toFixed(3),room:x.room,fire:x.fire,
    ids:x.slots.map(s=>s.id),intensity:x.slots.map(s=>s.strength),pixel:x.pixels,
    calls:x.calls,triangles:x.triangles}))});
  console.log('LIGHT_R05_ROUTE '+JSON.stringify({profile:name,id:r.id,
    peakFireJump:maxLightJump,peakPixelJump:maxPixelJump,
    changes:shifts,fireNear:traces.filter(x=>x.x<=82&&x.x>=78).map(x=>[+x.x.toFixed(2),x.fire])}));
 }
 const still=[];
 const pos={x:83,z:86.7};
 for(let i=0;i<120;i++){
  const yaw=2*Math.PI*i/120;
  still.push(await page.evaluate(({yaw,pos})=>{
   const g=window.__game;
   g.player.setPose({...pos,y:.15,yaw,pitch:0});g.tick(.05);
   return {ids:g.pool.assigned().join(),room:g.world.hereRoom};
  },{yaw,pos}));
 }
 const distinct=[...new Set(still.slice(30).map(x=>x.ids))];
 console.log('LIGHT_R05_STATIONARY '+JSON.stringify({profile:name,distinct,errors}));
 const data={profile:name,baseUrl:url,routes:results,stationary:distinct,errors};
 writeFileSync(out+'/trace.json',JSON.stringify(data,null,2));
 if(errors.length)throw Error('Browser console/page errors: '+errors.join(';').slice(0,400));
 if(distinct.length>1)throw Error('Camera rotation reassigned stationary lights');
}finally{await browser.close()}
