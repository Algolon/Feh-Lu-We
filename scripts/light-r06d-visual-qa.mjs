// LIGHT-R06D visual/art acceptance. Real estate, identical poses, actual save state.
// No deployment; launched against dist/ through GitHub Actions preview server.
// Baseline and pilot builds use identical renderer/settings; optional ?noPoint
// isolates STATE-BOUND surface light from competing dynamic lights.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
const profile=process.env.LIGHT_R06D_PROFILE??'pilot';
const quality=process.env.LIGHT_R06D_QUALITY??'low';
const portrait=process.env.LIGHT_R06D_PORTRAIT==='1';
const suite=process.env.LIGHT_R06D_SUITE??'full';
const root=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const dir=`light-r06d-evidence/${profile}-${quality}-${portrait?'portrait':'landscape'}`;
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--disable-dev-shm-usage'
]});
const page=await browser.newPage({
 viewport:portrait?{width:412,height:915}:{width:915,height:412},deviceScaleFactor:1
});
const faults=[];
page.on('pageerror',e=>faults.push('page:'+e.message));
page.on('console',e=>{if(e.type()==='error')faults.push('console:'+e.text())});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true},flags:{leftHome:true},
 unlocked:[],open:{'door.livLib':false}};
const candidates=[
 {id:'hall-near',pose:{x:87,z:88.5,y:.15,yaw:-Math.PI/2}},
 {id:'hall-far',pose:{x:90,z:88.5,y:.15,yaw:-Math.PI/2}},
 {id:'living-mid',pose:{x:80.5,z:86.7,y:.15,yaw:-Math.PI/2}},
 {id:'living-close',pose:{x:77.6,z:86.7,y:.15,yaw:-Math.PI/2}},
 {id:'living-floor',pose:{x:82.3,z:84.3,y:.15,yaw:-Math.PI/2}},
 // Look TOWARDS the floor lamp/east wall: prior west-facing view gave a
 // near-zero screen delta despite correct logical source-bound uniforms.
 {id:'floor-facing-east',pose:{x:79.5,z:83.6,y:.15,yaw:Math.PI/2}}
];
const periods=[{id:'day',dusk:0},{id:'dusk',dusk:.53},{id:'dark',dusk:.96}];
const variants=[
 {id:'off',fire:false,floor:false},
 {id:'fire',fire:true,floor:false},
 {id:'floor',fire:false,floor:true},
 {id:'both',fire:true,floor:true}
];
const obs=[];const motion=[];const boundary=[];
const round=n=>+n.toFixed(3);
try{
 const flags=profile==='pilot'?'&stableLiving=1&noPoint=1':'';
 await page.goto(root+'?autotest=1'+flags,{waitUntil:'domcontentloaded'});
 await page.evaluate(({state,quality})=>{
  localStorage.setItem('fehluwe.save',JSON.stringify(state));
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality,reducedMotion:true}));
 },{state:SAVE,quality});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(q=>{
  const g=window.__game;
  g.running=false;g.settings.quality=q;g.settings.reducedMotion=true;g.applyQuality(true);
 },quality);
 const render=async(pose,variant,period,doorOpen=false)=>{
  return page.evaluate(({pose,variant,period,doorOpen})=>{
   const g=window.__game,w=g.world;
   g.state.lit['fire.living']=variant.fire;
   g.state.lit['lamp.livingFloor']=variant.floor;
   g.state.open['door.livLib']=doorOpen;
   g.changed();
   g.player.setPose({...pose,pitch:0});
   g.player.applyCamera(g.camera);
   // Update culling and object transforms before freezing the frame.
   w.updateCulling(g.camera.position,g.camera);
   for(let i=0;i<6;i++)g.tick(.05);
   const pool=g.pool.lights,prev=pool.map(l=>l.intensity);
   for(const l of pool)l.intensity=0;
   g.extras.env.update(period.dusk,g.camera.position,w.hereRoom==='out'?0:1);
   const renderer=g.renderer,gl=renderer.getContext();
   const timing=[];
   try{
    for(let i=0;i<5;i++){
      const start=performance.now();
      renderer.render(w.scene,g.camera);
      gl.finish();
      timing.push(performance.now()-start);
    }
    const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
    const x0=Math.floor(width*.36),x1=Math.floor(width*.64);
    const y0=Math.floor(height*.30),y1=Math.floor(height*.70);
    const pixels=new Uint8Array(width*height*4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let total=0,peak=0,bright=0,count=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const j=(y*width+x)*4;
      const value=pixels[j]*.2126+pixels[j+1]*.7152+pixels[j+2]*.0722;
      total+=value;peak=Math.max(peak,value);if(value>245)bright++;count++;
    }
    timing.sort((a,b)=>a-b);
    return {room:w.hereRoom,lum:total/count,peak,over245Pct:bright/count*100,
      frameMs:timing[2],calls:renderer.info.render.calls,tris:renderer.info.render.triangles,
      shaders:renderer.info.programs?.length??null,stable:w.scene.userData.stableLiving?.state?.()??null,
      scope:w.scene.userData.stableScope??null,lightPoolIds:g.pool.assigned?.()??null};
   }finally{
     pool.forEach((l,i)=>l.intensity=prev[i]);
   }
  },{pose,variant,period,doorOpen});
 };
 for(const period of periods){
  for(const site of candidates){
   for(const variant of variants){
    if(suite==='quick'&&period.id!=='day')continue;
    const x=await render(site.pose,variant,period);
    const result={period:period.id,site:site.id,variant:variant.id,...x};
    obs.push(result);
    // One fully matched image for BOTH and OFF per pose/period, plus
    // the independent source comparison at the living centre.
    if(variant.id==='off'||variant.id==='both'||(site.id==='living-mid'&&['fire','floor'].includes(variant.id))){
     await page.screenshot({path:dir+'/'+period.id+'-'+site.id+'-'+variant.id+'.jpg',
       type:'jpeg',quality:83,timeout:120000});
    }
   }
  }
 }
 // A closed solid living↔library door must not transmit fixture light
 // to the library's own walls. An open door may expose visible lit living
 // surfaces but should not illuminate surfaces behind unrelated walls.
 for(const open of [false,true]){
  for(const variant of [variants[0],variants[3]]){
   const pose={x:79,z:96.8,y:.15,yaw:Math.PI};
   const value=await render(pose,variant,periods[0],open);
   boundary.push({doorOpen:open,variant:variant.id,...value});
   await page.screenshot({path:dir+'/library-door-'+(open?'open':'closed')+'-'+variant.id+'.jpg',
     type:'jpeg',quality:82,timeout:120000});
  }
 }
 // Travel from hall into the lit room, stop, turn 360 and reverse to hall.
 // Assert that the persistent source-bound strength NEVER follows room,
 // movement, camera direction or the shared dynamic pool.
 const move=await page.evaluate(()=>{
  const g=window.__game,w=g.world,steps=[];
  g.state.lit['fire.living']=true;g.state.lit['lamp.livingFloor']=true;g.changed();
  const take=(x,z,yaw,phase)=>{
    g.player.setPose({x,z,y:.15,yaw,pitch:0});g.player.applyCamera(g.camera);
    g.tick(.05);
    const stable=w.scene.userData.stableLiving?.state?.()??null;
    steps.push({x:+x.toFixed(2),z:+z.toFixed(2),yaw:+yaw.toFixed(3),phase,room:w.hereRoom,stable});
  };
  for(let i=0;i<=60;i++)take(90-i*(13/60),86.7,-Math.PI/2,'approach');
  for(let i=0;i<=24;i++)take(77,86.7,-Math.PI/2+i*Math.PI/12,'rotate');
  for(let i=0;i<=60;i++)take(77+i*(13/60),86.7,Math.PI/2,'reverse');
  return steps;
 });
 motion.push(...move);
 if(profile==='pilot'){
  if(obs.some(s=>s.stable===null||s.stable.length!==2))
   throw Error('Missing persistent source-bound light in candidate');
  if(motion.some(s=>!s.stable||Math.abs(s.stable[0]-.14)>1e-8||
     Math.abs(s.stable[1]-.10)>1e-8))
   throw Error('Lighting source strength changed while moving, rotating or reversing');
  const hallDay=obs.filter(s=>s.period==='day'&&s.site==='hall-near');
  if(hallDay.find(x=>x.variant==='both').lum-hallDay.find(x=>x.variant==='off').lum<4)
   throw Error('Living room no longer visibly illuminated from hall with PointLights off');
  const lampFacing=obs.filter(s=>s.period==='day'&&s.site==='floor-facing-east');
  if((lampFacing.find(x=>x.variant==='floor')?.lum??0)-
     (lampFacing.find(x=>x.variant==='off')?.lum??0)<1)
   throw Error('Standing lamp has no independently visible room contribution from its facing view');
 }
 const compare={};
 for(const period of periods)for(const site of candidates){
  const rows=obs.filter(x=>x.period===period.id&&x.site===site.id);
  const get=id=>rows.find(x=>x.variant===id);
  if(rows.length!==4)continue;
  compare[period.id+'/'+site.id]={
   fire:round(get('fire').lum-get('off').lum),
   floor:round(get('floor').lum-get('off').lum),
   both:round(get('both').lum-get('off').lum),
   baselineLum:round(get('off').lum),
   bothOver245Pct:round(get('both').over245Pct),
   callsBoth:get('both').calls,trisBoth:get('both').tris,programs:get('both').shaders,
   msMedian:round(get('both').frameMs)
  };
 }
 const result={profile,quality,portrait,suite,obs,boundary,motion,compare,errors:faults};
 writeFileSync(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('LIGHT_R06D_MATRIX '+JSON.stringify({profile,quality,portrait,compare,
  boundary:boundary.map(x=>({doorOpen:x.doorOpen,variant:x.variant,lum:round(x.lum),room:x.room})),
  motionSteps:motion.length,motionStable:motion.every(x=>!x.stable||x.stable.join(',')===motion[0].stable?.join(',')),
  errors:faults}));
 if(faults.length)throw Error(faults.slice(0,4).join(' | '));
}finally{await browser.close();}
