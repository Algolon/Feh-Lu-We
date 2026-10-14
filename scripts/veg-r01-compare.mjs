// Actual normal game, deterministic camera replay at player scale. Software timing is not device FPS.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const OUT=process.argv[2]??'docs/veg-r01/probe';mkdirSync(OUT,{recursive:true});
const profiles=(process.env.PROFILES??'baseline,a,b').split(',');
const paths=(process.env.PATHS??'multi,fallback').split(',');
const server=await preview({preview:{host:'127.0.0.1',port:4197,strictPort:true}});
const poses=[
 ['boslust',52.6,6.4,.9,.12],['dense',65,57,-2.25,.12],['garden-edge',124,132,1.05,.12],['treeline',88,66,-2.6,.12],
 ['forest-busy',47.5,5.2,.75,.1],['cons-deck',137,106,-1.57,.05],['cons-corridor',115.8,102.5,-1.57,0],['service',107.9,102.5,-1.57,0],
 ['distant',90,128,1.1,.12],['woodland-east',150,45,1.4,.12],
];
if(process.env.REFERENCE==='1')poses.push(...Object.entries({atticNook:[96.4,94.2,1.08,6.65],atticCommon:[86,97.5,0,6.65],conservatoryInside:[126.3,106,1.57,.15],conservatoryDoorDeck:[137,106,-1.57,.15],wellnessDeck:[132,114,2.27,.15],saunaAccess:[137.6,112.4,-2.44,.15],wickermanClearing:[176.4,59.9,2.53,1.2],wickermanPath:[158,47,1.08,1],frontForecourt:[90,66,0,0],arrivalCourt:[88,62,.07,0],portugalTerrace:[25,152.8,.35,4.15],portugalApproach:[16.6,146.8,.44,4],golfVicinity:[66,57,-2.62,0],golfSpur:[56,47.6,1.22,0]}).map(([n,[x,z,yaw,y]])=>[n,x,z,yaw,.05,y]));
if(process.env.VIEWS){const wanted=process.env.VIEWS.split(',');for(let i=poses.length-1;i>=0;i--)if(!wanted.includes(poses[i][0]))poses.splice(i,1);}
if(process.env.PACEONLY==='1')poses.length=0;
const routes=[['boslust',[52.6,6.4],[60.5,10.5],.9],['dense',[71,62],[62.5,55],-2.25],['garden-edge',[124,132],[134,137],1.05],['treeline',[88,66],[88,56],-2.6]];
let browser;const results=[];
try{
 browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const path of paths)for(const profile of profiles){
  const dir=`${OUT}/${profile}-${path}`;mkdirSync(dir,{recursive:true});
  const page=await browser.newPage({viewport:{width:768,height:432},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:4197/Feh-Lu-We/?autotest=1${profile==='default'?'':`&veglod=${profile}`}${path==='fallback'?'&multidraw=0':''}`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
   localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['frontKey','consKey'],flags:{leftHome:true},unlocked:['lock.door.front','lock.door.consWest'],open:{'door.front':true,'door.consEast':true,'door.consWest':true,'door.service':true,'door.atticStair':true}}));
  });
  await page.reload({waitUntil:'domcontentloaded'});await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:60000});
  await page.evaluate(()=>{window.__game.running=false;});await page.evaluate(readFileSync(new URL('./e2e-helpers.js',import.meta.url),'utf8'));
  await page.evaluate(()=>{
   const g=window.__game;
   window.VEG={
    pose(x,z,yaw,pitch=.12,y){g.player.setPose({x,y:y??g.world.col.supportHeight(x,z,20,.42),z,yaw,pitch});g.player.applyCamera(g.camera);g.world.updateCulling(g.camera.position,g.camera);},
    render(){const t=performance.now();g.renderer.render(g.world.scene,g.camera);return{cpuSubmitMs:performance.now()-t,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};},
    measure(){const w=g.world,s=w.scene;let geometryBytes=0,instanceBytes=0,batchTextureBytes=0;const seen=new Set();s.traverse(o=>{
     if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);for(const a of Object.values(o.geometry.attributes))geometryBytes+=a.array?.byteLength??0;geometryBytes+=o.geometry.index?.array.byteLength??0;}
     instanceBytes+=(o.instanceMatrix?.array.byteLength??0)+(o.instanceColor?.array.byteLength??0);
     for(const k of ['_matricesTexture','_colorsTexture','_indirectTexture'])batchTextureBytes+=o[k]?.image?.data?.byteLength??0;
    });return{geometryBytes,instanceBytes,batchTextureBytes,geometries:g.renderer.info.memory.geometries,textures:g.renderer.info.memory.textures,path:s.userData.vegPath,profile:s.userData.vegProfile,treeCount:s.userData.woodCounts,treeList:s.userData.vegList(),fov:g.camera.fov,dpr:g.renderer.getPixelRatio(),buffer:[g.renderer.domElement.width,g.renderer.domElement.height],shadows:g.renderer.shadowMap.enabled};},
    snapshot(){return g.world.scene.userData.vegSnapshot().filter(t=>!t.bush&&t.visible&&t.distance<90);}
   };
  });
  const views=[];
  for(const [name,x,z,yaw,pitch,y]of poses){
   const row=await page.evaluate(({name,x,z,yaw,pitch,y})=>{const g=window.__game;VEG.pose(x,z,yaw,pitch,y);for(let i=0;i<30;i++)g.tick(1/30);VEG.render();return{name,...VEG.render(),room:g.world.hereRoom,lod:g.world.scene.userData.vegStats(),sample:VEG.snapshot().slice(0,24)};},{name,x,z,yaw,pitch,y});
   if(process.env.SHOTS!=='0')await page.screenshot({path:`${dir}/${name}.jpg`,type:'jpeg',quality:86});views.push(row);
  }
  const memory=await page.evaluate(()=>VEG.measure());
  const moving=[];
  if(process.env.MOVING==='1')for(const[name,start,end,yaw]of routes){
   const frames=[];let saved=0;
   await page.evaluate(({start,yaw})=>{const g=window.__game;VEG.pose(...start,yaw);g.autopilot=null;for(let i=0;i<30;i++)g.tick(1/30);VEG.render();},{start,yaw});
   // Four seconds approach, four seconds backward retreat (view direction retained), two-second lateral turn.
   for(let i=0;i<100;i++){
    const frame=await page.evaluate(({i,start,end,yaw})=>{
     const g=window.__game;const point=i<40?end:start;
     g.autopilot=i<80?{x:point[0],z:point[1],run:false}:null;
     g.player.yaw=i<80?yaw:yaw+Math.sin((i-80)/19*Math.PI*2)*.8;g.player.pitch=.12;
     for(let n=0;n<3;n++)g.tick(1/30);
     g.world.updateCulling(g.camera.position,g.camera);const m=VEG.render();
     return{i,phase:i<40?'approach':i<80?'retreat':'turn',pose:g.player.pose(),...m,treeStats:g.world.scene.userData.vegStats(),trees:VEG.snapshot()};
    },{i,start,end,yaw});
    frames.push(frame);
    if(process.env.VIDEO==='1'){await page.screenshot({path:`${dir}/${name}-${String(saved++).padStart(4,'0')}.jpg`,type:'jpeg',quality:80});}
   }
   moving.push({name,frames});writeFileSync(`${dir}/${name}-frames.json`,JSON.stringify(frames));console.log(JSON.stringify({profile,path,route:name,frames:frames.length}));
  }
  let pacing=null;
  if(process.env.PACEONLY==='1')pacing=await page.evaluate(()=>new Promise(resolve=>{
    const g=window.__game;VEG.pose(52.6,6.4,.9,.12);g.autopilot=null;g.running=true;requestAnimationFrame(g.frame);
    const times=[];let previous=0,frames=0;
    const sample=t=>{if(previous&&frames>8)times.push(t-previous);previous=t;frames++;if(times.length<40)requestAnimationFrame(sample);else{g.running=false;resolve({intervalsMs:times,conditions:'Actual game rAF intervals after 8 warm-up frames; SwiftShader, fixed BOSLUST view, low, 768x432 DPR1. Software environment indicators only; not Samsung capacity.'});}};
    requestAnimationFrame(sample);
  }));
  const shadow=await page.evaluate(()=>{
   const g=window.__game;VEG.pose(52.6,6.4,.9,.12);g.settings.quality='high';g.applyQuality(true);g.tick(0);
   g.renderer.shadowMap.enabled=false;VEG.render();const camera=VEG.render();
   g.renderer.shadowMap.enabled=true;VEG.render();
   const original=g.renderer.shadowMap.render.bind(g.renderer.shadowMap);let shadowCalls=0,shadowTriangles=0;
   g.renderer.shadowMap.render=(...args)=>{const before={...g.renderer.info.render};original(...args);shadowCalls+=g.renderer.info.render.calls-before.calls;shadowTriangles+=g.renderer.info.render.triangles-before.triangles;};
   const combined=VEG.render();g.renderer.shadowMap.render=original;
   const sun=g.extras.env.sun;g.settings.quality='low';g.applyQuality(true);
   return{cameraNoShadows:camera,cameraWithShadows:{calls:combined.calls-shadowCalls,triangles:combined.triangles-shadowTriangles},combined,shadowCalls,shadowTriangles,map:sun.shadow.mapSize.toArray(),conditions:'High-quality 1024px mobile sun shadow control. Shadow renderer counters sampled around its actual pass; camera=combined-minus-shadow, including any conservative fallback superset. Not a mobile-low gate.'};
  });
  const row={profile,path,views,memory,shadow,pacing,errors,moving:moving.map(r=>({name:r.name,frames:r.frames.length}))};results.push(row);writeFileSync(`${dir}/results.json`,JSON.stringify(row,null,2));await page.close();
  console.log(JSON.stringify({profile,path,views:views.map(v=>[v.name,v.calls,v.triangles]),errors}));
 }
 writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));
}finally{await browser?.close();await new Promise(r=>server.httpServer.close(r));}
