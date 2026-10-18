// LIGHT-R08 real-scene hall/library A/B against approved LIGHT-R06D.
// All pooled PointLights OFF to prove steady fixture contribution is independent
// of the player's room, camera and the limited dynamic light budget.
// Software Chromium/SwiftShader is NOT a physical Android performance test.
import { chromium } from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const variant=process.env.LIGHT_R08_PROFILE??'r08';
const FAST=process.env.LIGHT_R08_FAST==='1';
const WITH_POOL=process.env.LIGHT_R08_WITH_POOL==='1';
const quality=process.env.LIGHT_R08_QUALITY??'low';
const portrait=process.env.LIGHT_R08_PORTRAIT==='1';
const out='light-r08-evidence/'+variant+'-'+quality+(portrait?'-portrait':'-landscape')+(WITH_POOL?'-normal-gameplay':'-isolated');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:portrait?{width:412,height:915}:{width:915,height:412},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push('page:'+e.message));
page.on('console',e=>{if(e.type()==='error')errors.push('console:'+e.text());});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true,'lamp.hallChandelier':true,
 'lamp.hallConsole':false,'lamp.libraryChandelier':true,'lamp.library':true},
 flags:{leftHome:true},unlocked:[],open:{'door.front':true}};
const ids=['lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library'];
const cases=[
 // Point toward the chandelier from the NORTH, not away from it.
 {id:'hall-chandelier',pose:{x:89.9,z:94,y:.15,yaw:Math.PI,pitch:.19}},
 {id:'hall-away',pose:{x:90,z:92,y:.15,yaw:0,pitch:.19}},
 {id:'hall-console',pose:{x:90,z:87,y:.15,yaw:-Math.PI/2,pitch:-.02}},
 {id:'hall-through-living',pose:{x:87,z:88.5,y:.15,yaw:-Math.PI/2,pitch:0}},
 {id:'library-reading',pose:{x:78,z:103.5,y:.15,yaw:Math.PI,pitch:-.04}},
 // Directly face the banker's lamp at the rear of the west-wall bureau.
 // The general library-reading ROI is too far from this small task light.
 {id:'library-desk',pose:{x:76.2,z:99.65,y:.15,yaw:-Math.PI/2,pitch:-.10}},
 {id:'library-gallery',pose:{x:79,z:102,y:3.6,yaw:Math.PI,pitch:-.16}},
 {id:'library-to-living',pose:{x:79,z:96.6,y:.15,yaw:Math.PI,pitch:0}},
 {id:'lobby-to-library',pose:{x:89,z:100.7,y:.15,yaw:-Math.PI/2,pitch:0}},
];
const phases=[{id:'day',v:0},{id:'dusk',v:.53},{id:'dark',v:.96}];
const lights=[
 {id:'off',bits:[false,false,false,false]},
 {id:'hall',bits:[true,false,false,false]},
 {id:'console',bits:[false,true,false,false]},
 {id:'library',bits:[false,false,true,false]},
 {id:'desk',bits:[false,false,false,true]},
 {id:'both',bits:[true,true,true,true]},
];
const all=[];const round=x=>+x.toFixed(3);
try{
 const suffix=variant==='r08'?'&stableRooms=1':'&stableLiving=1';
 await page.goto(base+'?autotest=1'+suffix+(WITH_POOL?'':'&noPoint=1'),{waitUntil:'domcontentloaded'});
 await page.evaluate(({save,quality})=>{
   localStorage.setItem('fehluwe.save',JSON.stringify(save));
   localStorage.setItem('fehluwe.settings',JSON.stringify({quality,reducedMotion:true}));
 },{save:SAVE,quality});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(q=>{
    const g=window.__game;g.running=false;
    g.settings.quality=q;g.settings.reducedMotion=true;g.applyQuality(true);
 },quality);
 const capture=async(testCase,phase,lamps,doors)=>{
  return await page.evaluate(({pose,phase,lamps,doors,withPool})=>{
    const g=window.__game,w=g.world;
    const ids=['lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library'];
    ids.forEach((id,i)=>g.state.lit[id]=lamps[i]);
    g.state.open['door.library']=doors.library;
    g.state.open['door.livLib']=doors.livLib;
    g.changed();
    g.player.setPose({...pose});g.player.applyCamera(g.camera);
    w.updateCulling(g.camera.position,g.camera);
    for(let i=0;i<5;i++)g.tick(.05);
    const pool=g.pool.lights,prior=pool.map(l=>l.intensity);
    if(!withPool)pool.forEach(l=>l.intensity=0);
    g.extras.env.update(phase,g.camera.position,1);
    const renderer=g.renderer,gl=renderer.getContext();
    try{
      for(let i=0;i<3;i++)renderer.render(w.scene,g.camera);
      const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
      const px=new Uint8Array(W*H*4);
      gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
      let lum=0,top=0,bright=0,n=0;
      for(let y=Math.floor(H*.24);y<Math.floor(H*.76);y++)
        for(let x=Math.floor(W*.24);x<Math.floor(W*.76);x++){
          let p=(y*W+x)*4;let v=px[p]*.2126+px[p+1]*.7152+px[p+2]*.0722;
          lum+=v;top=Math.max(top,v);if(v>245)bright++;n++;
        }
      const scope=w.scene.userData.stableScope??null;
      return {lum:lum/n,peak:top,over245:100*bright/n,room:w.hereRoom,
        stableRooms:w.scene.userData.stableRooms?.state?.()??null,
        living:w.scene.userData.stableLiving?.state?.()??null,
        chunks:scope?.chunks??null,clones:scope?.createdMaterialClones??null,
        calls:renderer.info.render.calls,tris:renderer.info.render.triangles,
        programs:renderer.info.programs?.length??null,
        activePool:g.pool.assigned?.()??null,glError:gl.getError()};
    }finally{pool.forEach((l,i)=>l.intensity=prior[i]);}
  },{pose:testCase.pose,phase:phase.v,lamps:lamps.bits,doors,withPool:WITH_POOL});
 };
 for(const phase of (FAST?phases.filter(x=>x.id==='day'):phases))
 for(const site of (FAST?cases.filter(x=>['hall-chandelier','hall-console','library-reading','library-desk','library-to-living'].includes(x.id)):cases)){
   const doors={library:false,livLib:false};
   for(const state of lights){
      const r=await capture(site,phase,state,doors);
      all.push({phase:phase.id,view:site.id,source:state.id,...r});
      if(['off','hall','library','both'].includes(state.id) &&
           (!FAST || ['off','both'].includes(state.id)) &&
           (phase.id!=='dusk'||state.id==='both')){
        await page.screenshot({path:out+'/'+phase.id+'-'+site.id+'-'+state.id+'.jpg',
          type:'jpeg',quality:82,timeout:120000});
      }
   }
 }
 const portals=[];
 for(const door of [false,true]){
   for(const view of cases.filter(x=>['library-to-living','lobby-to-library'].includes(x.id))){
    for(const state of [lights[0],lights[1],lights[3],lights[5]]){
     const doors={library:door,livLib:door};
     const res=await capture(view,phases[0],state,doors);
     portals.push({door,view:view.id,source:state.id,...res});
     if(state.id==='off'||state.id==='both')await page.screenshot({path:out+'/-portal-'+view.id+'-'+(door?'open':'shut')+'-'+state.id+'.jpg',
        type:'jpeg',quality:82,timeout:120000});
    }
   }
 }
 // Verify moving across a threshold and rotating 360 never changes fixture
 // strength or includes those sources in a scarce PointLight slot.
 const move=await page.evaluate(()=>{
    const g=window.__game,w=g.world,records=[],ids=[
     'lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library'];
    ids.forEach(id=>g.state.lit[id]=true);g.changed();
    const frame=(x,z,yaw,phase)=>{
      g.player.setPose({x,z,y:.15,yaw,pitch:0});g.player.applyCamera(g.camera);
      g.tick(.05);
      records.push({phase,x,z,room:w.hereRoom,state:w.scene.userData.stableRooms?.state?.()??null,
       pool:g.pool.assigned?.()??null});
    };
    for(let i=0;i<=45;i++)frame(91-i*14/45,90,-Math.PI/2,'hall-living');
    for(let i=0;i<=24;i++)frame(77,90,-Math.PI/2+i*Math.PI/12,'turn');
    for(let i=0;i<=45;i++)frame(77+i*14/45,90,Math.PI/2,'return');
    return records;
 });
 const summary={};
 for(const phase of phases)for(const site of cases){
  const rows=all.filter(x=>x.phase===phase.id&&x.view===site.id);
  // The short real-WebGL smoke deliberately skips other phases and views.
  if(!rows.length)continue;
  const off=rows.find(x=>x.source==='off');
  if(!off)throw Error('R08 missing OFF reference for '+phase.id+'/'+site.id);
  const entries={};
  for(const row of rows)entries[row.source]=round(row.lum-off.lum);
  summary[phase.id+'/'+site.id]={
    delta:entries,baseline:round(off.lum),calls:rows.find(x=>x.source==='both').calls,
    tris:rows.find(x=>x.source==='both').tris,programs:rows.find(x=>x.source==='both').programs};
 }
 // Write and print raw visual evidence BEFORE enforcing thresholds, so a
 // failing artistic gate never discards the actual on/off measurements.
 const result={variant,quality,portrait,fast:FAST,normalGameplay:WITH_POOL,all,portals,movement:move,summary,errors};
 writeFileSync(out+'/results.json',JSON.stringify(result,null,2));
 console.log('LIGHT_R08_SUMMARY '+JSON.stringify({variant,quality,portrait,fast:FAST,normalGameplay:WITH_POOL,summary,
    scope:all[0]?.chunks,clones:all[0]?.clones,movementStable:move.every(x=>!x.state||x.state.join(',')===move[0].state?.join(',')),
    portals:portals.map(x=>({open:x.door,view:x.view,source:x.source,lum:round(x.lum)})),
    errors
 }));
 if(errors.length||all.some(x=>x.glError!==0))throw Error('WebGL/errors: '+JSON.stringify({errors,glErrors:all.filter(x=>x.glError!==0).length}));
 if(variant==='r08'){
   if(all.some(x=>!x.stableRooms||x.stableRooms.length!==4||
     !x.chunks?.mHall||!x.chunks?.mLib))
     throw Error('Missing R08 localized shader/chunks or source state');
   const states=move.map(x=>x.state?.join(','));
   if(states.some(s=>s!==states[0]))throw Error('R08 light strength changed while walking or looking');
   if(move.some(x=>x.pool?.some(id=>ids.includes(id))))
     throw Error('R08 light occupying pooled PointLight slot');
   // Specific rooms must light visibly. Sources may be distant from particular
   // camera ROIs, so verify at least one meaningful view for each room.
   const delta=(phase,view,source)=>summary[phase+'/'+view]?.delta[source]??0;
   // Luminance is diagnostic rather than a target to force an exaggerated
   // orange light wash. Gate against realistically VIEWED source surfaces at
   // Low/landscape; on High/portrait the central ROI sees different surfaces.
   if(quality==='low'&&!portrait){
     if(!WITH_POOL && Math.max(delta('day','hall-chandelier','hall'),delta('day','hall-console','hall'))<1.4)
       throw Error('Hall chandelier base light not visible from a source-facing camera');
     if(!WITH_POOL && Math.max(delta('day','library-reading','library'),delta('day','library-gallery','library'))<1.5)
       throw Error('Library chandelier base light not visible with PointLights OFF');
     // Additional table sources each need their OWN visible contribution.
     if(!WITH_POOL && delta('day','hall-console','console')<.25)
       throw Error('Hall console lamp contributes no perceptible authored light');
     // The small task light is deliberately judged from its actual desk
     // sightline, not from the opposite side of the reading lounge.
     if(!WITH_POOL && Math.max(delta('day','library-reading','desk'),delta('day','library-desk','desk'))<.2)
       throw Error('Library reading lamp contributes no perceptible authored light');
   }
   // A shut library door must not let a separate room's source illuminate
   // the wall on our side. The open portal should reveal the lit room beyond.
   for(const view of (!WITH_POOL?['library-to-living','lobby-to-library']:[])){
     const dark=portals.find(x=>!x.door&&x.view===view&&x.source==='off');
     const otherSource=view==='library-to-living'?'hall':'library';
     const occluded=portals.find(x=>!x.door&&x.view===view&&x.source===otherSource);
     if(!dark||!occluded)throw Error('R08 missing solid-door on/off QA');
     if(Math.abs(occluded.lum-dark.lum)>1.0)
       throw Error('A closed door leaks another room\'s light: '+JSON.stringify({view,delta:occluded.lum-dark.lum}));
   }
 }

}finally{await browser.close();}
