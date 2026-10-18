// LIGHT-R08B: physical library surfaces, no intersecting transparent discs.
// Captures same-build A/B via ?r08SurfaceFix=0 vs default, so game content,
// renderer, time, camera and interactive state are identical.
// Real Chromium/SwiftShader renders: useful for visual correctness, not
// physical Android GPU/thermal measurements.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const base=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const quality=process.env.LIGHT_R08B_QUALITY??'low';
const portrait=process.env.LIGHT_R08B_PORTRAIT==='1';
const variant=process.env.LIGHT_R08B_VARIANT??'fixed';
const corrected=variant==='fixed';
const out=`light-r08b-evidence/${variant}-${quality}-${portrait?'portrait':'landscape'}`;
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--ignore-gpu-blocklist','--disable-dev-shm-usage'
]});
const page=await browser.newPage({
 viewport:portrait?{width:412,height:915}:{width:915,height:412},
 deviceScaleFactor:1
});
const errors=[];
page.on('pageerror',e=>errors.push('page:'+e.message));
page.on('console',e=>{if(e.type()==='error')errors.push('console:'+e.text())});
const SAVE={version:4,scene:'estate',
 inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true,
  'lamp.libraryChandelier':true,'lamp.library':true},
 flags:{leftHome:true},unlocked:[],open:{'door.library':false,'door.livLib':false}};
const positions=[
 {id:'library-desk-front',pose:{x:75.1,z:99.35,y:.15,yaw:-Math.PI/2,pitch:-.30}},
 {id:'library-desk-near',pose:{x:74.2,z:99.5,y:.15,yaw:-Math.PI/2,pitch:-.46}},
 {id:'library-carpet-facing',pose:{x:78,z:104.0,y:.15,yaw:Math.PI,pitch:-.40}},
 {id:'library-carpet-side',pose:{x:81,z:103.3,y:.15,yaw:-Math.PI/2,pitch:-.46}},
 {id:'library-carpet-close',pose:{x:78.2,z:103.2,y:.15,yaw:Math.PI,pitch:-.64}},
 {id:'library-overview',pose:{x:80,z:106.2,y:.15,yaw:Math.PI,pitch:-.15}},
];
const phases=[{name:'day',time:0},{name:'dark',time:.96}];
const states=[
 {id:'off',desk:false,chandelier:false},
 {id:'desk',desk:true,chandelier:false},
 {id:'chandelier',desk:false,chandelier:true},
 {id:'on',desk:true,chandelier:true}
];
const data=[];const round=n=>Number(n.toFixed(3));
try{
 const suffix=corrected?'':'&r08SurfaceFix=0';
 await page.goto(base+'?autotest=1&stableRooms=1'+suffix,{waitUntil:'domcontentloaded'});
 await page.evaluate(({save,quality})=>{
   localStorage.setItem('fehluwe.save',JSON.stringify(save));
   localStorage.setItem('fehluwe.settings',JSON.stringify({quality,reducedMotion:true}));
 },{save:SAVE,quality});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(q=>{
   const g=window.__game;
   g.running=false;
   g.settings.quality=q;g.settings.reducedMotion=true;
   g.applyQuality(true);
 },quality);
 const audit=await page.evaluate(()=>{
   const g=window.__game;
   const patches=g.world.patches.items||[];
   const find=(x,z,y)=>patches.filter(p=>
      Math.abs(p.x-x)<.04&&Math.abs(p.z-z)<.04&&Math.abs(p.y-y)<.04);
   return {
    // LightPatches receives PLAN coordinates; model coordinates use negative z.
    banker:find(73.04,99.72,.82).map(p=>({r:p.r,y:p.y,soft:p.soft})),
    chandelier:find(78.4,101,.03).map(p=>({r:p.r,y:p.y,soft:p.soft})),
    totalPatches:patches.length,
    scope:g.world.scene.userData.stableScope??null,
    roomLights:g.world.scene.userData.stableRooms?.state?.()??null
   };
 });
 if(corrected && (audit.banker.length||audit.chandelier.length))
   throw Error('R08B is still drawing floating/intersecting transparent light discs: '+JSON.stringify(audit));
 if(!corrected && (!audit.banker.length||!audit.chandelier.length))
   throw Error('R08 baseline does not contain the expected pair of legacy patches');
 for(const phase of phases){
  for(const site of positions){
   for(const state of states){
    const result=await page.evaluate(({pose,phase,state})=>{
      const g=window.__game,w=g.world;
      g.state.lit['lamp.library']=state.desk;
      g.state.lit['lamp.libraryChandelier']=state.chandelier;
      g.changed();
      g.player.setPose({...pose});g.player.applyCamera(g.camera);
      w.updateCulling(g.camera.position,g.camera);
      for(let i=0;i<4;i++)g.tick(.05);
      g.extras.env.update(phase,g.camera.position,1);
      const render=g.renderer,gl=render.getContext();
      for(let i=0;i<2;i++)render.render(w.scene,g.camera);
      const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
      const pixels=new Uint8Array(W*H*4);
      gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let sum=0,n=0,over=0;
      for(let y=Math.floor(H*.28);y<Math.floor(H*.72);y++)
       for(let x=Math.floor(W*.27);x<Math.floor(W*.73);x++){
        const j=(y*W+x)*4;
        const v=pixels[j]*.2126+pixels[j+1]*.7152+pixels[j+2]*.0722;
        sum+=v;over+=v>245?1:0;n++;
       }
      return {room:w.hereRoom,lum:sum/n,over245:100*over/n,
        calls:render.info.render.calls,tris:render.info.render.triangles,
        programs:render.info.programs?.length??null,
        sourceWeights:w.scene.userData.stableRooms?.state?.()??null,
        webglError:gl.getError()};
    },{pose:site.pose,phase:phase.time,state});
    data.push({phase:phase.name,site:site.id,state:state.id,...result});
    if(result.webglError)throw Error('WebGL error '+result.webglError);
    if(phase.name==='day'||state.id==='on'){
      await page.screenshot({
       path:`${out}/${phase.name}-${site.id}-${state.id}.jpg`,
       type:'jpeg',quality:82,timeout:60000
      });
    }
   }
  }
 }
 const summary={};
 for(const phase of phases)for(const site of positions){
   const rows=data.filter(x=>x.site===site.id&&x.phase===phase.name);
   const off=rows.find(x=>x.state==='off');
   summary[phase.name+'/'+site.id]={
      base:round(off.lum),
      desk:round(rows.find(x=>x.state==='desk').lum-off.lum),
      chandelier:round(rows.find(x=>x.state==='chandelier').lum-off.lum),
      both:round(rows.find(x=>x.state==='on').lum-off.lum),
      calls:rows.find(x=>x.state==='on').calls,
      triangles:rows.find(x=>x.state==='on').tris,
      programs:rows.find(x=>x.state==='on').programs
   };
 }
 if(errors.length)throw Error('JS/shader errors '+JSON.stringify(errors.slice(0,4)));
 writeFileSync(out+'/report.json',JSON.stringify({
   variant,quality,portrait,corrected,audit,data,summary,errors
 },null,2));
 console.log('LIGHT_R08B_SUMMARY '+JSON.stringify({
   variant,quality,portrait,audit,summary,errors
 }));
}finally{await browser.close();}
