// LIGHT-R06D authentic gameplay (NOT noPoint) preview smoke.
// Unlike the strict light ablation, this keeps other estate lights active,
// so author can judge overall warmth and pooling without double-counting the
// source-bound fireplace and floor lamp. Modelled mobile viewports, not real GPU.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const profile=process.env.LIGHT_R06D_PROFILE??'pilot';
const quality=process.env.LIGHT_R06D_QUALITY??'low';
const portrait=process.env.LIGHT_R06D_PORTRAIT==='1';
const url=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const dir=`light-r06d-gameplay/${profile}-${quality}-${portrait?'portrait':'landscape'}`;
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--ignore-gpu-blocklist','--disable-dev-shm-usage'
]});
const page=await browser.newPage({viewport:portrait?{width:412,height:915}:{width:915,height:412}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
const SAVE={version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
 lit:{'fire.living':true,'lamp.livingFloor':true},flags:{leftHome:true},unlocked:[],open:{}};
const scenes=[
 {id:'hall-to-living',p:{x:87,z:88.5,y:.15,yaw:-Math.PI/2}},
 {id:'living-west-wall',p:{x:80.5,z:86.7,y:.15,yaw:-Math.PI/2}},
 {id:'floorlamp-east-wall',p:{x:79.5,z:83.6,y:.15,yaw:Math.PI/2}},
 {id:'closed-library',p:{x:79,z:96.8,y:.15,yaw:Math.PI}},
];
const periods=[['day',0],['dusk',.53],['dark',.96]];
const out=[];
try{
 await page.goto(url+'?autotest=1'+(profile==='pilot'?'&stableLiving=1':''),{waitUntil:'domcontentloaded'});
 await page.evaluate(({s,q})=>{
  localStorage.setItem('fehluwe.save',JSON.stringify(s));
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality:q,reducedMotion:true}));
 },{s:SAVE,q:quality});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-cont]').click({timeout:45000});
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 await page.evaluate(q=>{const g=window.__game;g.running=false;g.settings.quality=q;g.settings.reducedMotion=true;g.applyQuality(true);},quality);
 for(const [phase,dusk] of periods){
  for(const spot of scenes){
   for(const enabled of [false,true]){
    const v=await page.evaluate(({p,dusk,enabled})=>{
     const g=window.__game,w=g.world;
     g.state.lit['fire.living']=enabled;g.state.lit['lamp.livingFloor']=enabled;
     g.changed();
     g.player.setPose({...p,pitch:0});g.player.applyCamera(g.camera);
     w.updateCulling(g.camera.position,g.camera);
     for(let i=0;i<15;i++)g.tick(.05);
     g.extras.env.update(dusk,g.camera.position,w.hereRoom==='out'?0:1);
     g.renderer.render(w.scene,g.camera);
     return {room:w.hereRoom,lightIds:g.pool.assigned(),stable:w.scene.userData.stableLiving?.state()??null,
       calls:g.renderer.info.render.calls,tris:g.renderer.info.render.triangles,
       programs:g.renderer.info.programs?.length??null,phase:dusk};
    },{p:spot.p,dusk,enabled});
    if(profile==='pilot'){
     if(!v.stable)throw Error('Game preview missing source-bound fixture');
     if(v.lightIds.some(id=>['fire.living','lamp.livingFloor'].includes(id)))
       throw Error('Source-bound fixture double-counted by dynamic LightPool '+JSON.stringify(v.lightIds));
    }
    out.push({phase,site:spot.id,enabled,...v});
    await page.screenshot({path:dir+'/'+phase+'-'+spot.id+'-'+(enabled?'on':'off')+'.jpg',
      type:'jpeg',quality:84,timeout:120000});
   }
  }
 }
 const result={profile,quality,portrait,out,errors};
 writeFileSync(dir+'/result.json',JSON.stringify(result,null,2));
 console.log('LIGHT_R06D_GAMEPLAY '+JSON.stringify({profile,quality,portrait,
   cases:out.length,rooms:[...new Set(out.map(x=>x.room))],
   calls:out.filter(x=>x.enabled).map(x=>({site:x.site,phase:x.phase,n:x.calls,tri:x.tris,source:x.stable})),
   errors}));
 if(errors.length)throw Error(errors.slice(0,4).join(' | '));
}finally{await browser.close();}
