// VEG-R10F — Read-only verification of the actual ivy in the interactive estate.
// Crucial: the leaf-gallery screenshots cannot tell us whether these batches are on the house at all.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const out='docs/veg-r10f/review';
mkdirSync(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5221,strictPort:true,hmr:false,watch:null}});
await server.listen();
let browser;
const errors=[],results=[];
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||chromium.executablePath(),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const base='http://127.0.0.1:5221/Feh-Lu-We/';
 await page.goto(base+'?autotest=1&quality=high');
 await page.evaluate(()=>{
   localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'high',reducedMotion:true}));
   localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));
 });
 await page.reload();await page.click('[data-cont]');
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
 await page.evaluate(()=>window.__game.running=false);
 const scene=await page.evaluate(async()=>{
   const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js');
   const E=await import('/Feh-Lu-We/src/world/exteriorGreenery.ts');
   const w=window.__game.world;
   const material=E.ivyLeafMaterial();
   const found=[];
   w.scene.updateMatrixWorld(true);
   w.scene.traverse(o=>{
     if(!o.isMesh)return;
     const mats=Array.isArray(o.material)?o.material:[o.material];
     if(mats.some(m=>m===material||m.map===material.map)){
       const bb=new T.Box3().setFromObject(o);
       found.push({name:o.name,visible:o.visible,chunk:o.userData.chunk,triangleCount:o.geometry.attributes.position.count/3,box:{min:bb.min.toArray(),max:bb.max.toArray()},materialIsIvy:!!mats.find(m=>m===material)});
     }
   });
   return {found,siteCount:E.climberPlan().length,siteLeafCount:E.climberPlan().map(s=>({face:s.face,root:s.root,leaves:s.leaves.length})),gameScene:w.id,sceneChildren:w.scene.children.length};
 });
 results.push({type:'mesh-bounds',...scene});
 const views=[
   ['west-exterior',70.8,86.1,72.2,86.1],
   ['north-exterior',85.1,112,85.1,109.8],
   ['entrance',86.4,76.9,86.4,80],
   ['east-of-west',74.1,86.1,72.2,86.1],
 ];
 for(const [name,x,z,tx,tz] of views){
   const row=await page.evaluate(({x,z,tx,tz})=>{
     const g=window.__game,w=g.world;
     const ground=w.col.supportHeight(x,z,20,.42);
     const y=Number.isFinite(ground)?ground:g.player.pos.y;
     g.player.setPose({x,z,y,yaw:Math.atan2(tx-x,tz-z),pitch:-.12});
     for(let i=0;i<15;i++)g.tick(1/30);
     w.updateCulling(g.camera.position,g.camera);
     g.renderer.render(w.scene,g.camera);
     return {camera:g.camera.position.toArray(),ground,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError()};
   },{x,z,tx,tz});
   results.push({type:'view',name,...row});
   await page.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:79});
 }
 // Same in-game camera, same geometry, same light: isolate the actual venation material.
 const compare=await page.evaluate(async()=>{
   const E=await import('/Feh-Lu-We/src/world/exteriorGreenery.ts');
   const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js');
   const g=window.__game,w=g.world;
   const current=E.ivyLeafMaterial();
   const ivy=[];
   w.scene.traverse(o=>{if(o.isMesh&&o.material===current)ivy.push(o);});
   const baseline=current.clone();baseline.map=null;baseline.needsUpdate=true;
   const x=85.1,z=112,tx=85.1,tz=109.8;
   const ground=w.col.supportHeight(x,z,20,.42);
   const y=Number.isFinite(ground)?ground:g.player.pos.y;
   g.player.setPose({x,z,y,yaw:Math.atan2(tx-x,tz-z),pitch:-.12});
   for(let i=0;i<10;i++)g.tick(1/30);
   g.dusk=0;g.extras.env?.update(0,g.camera.position,0);
   w.updateCulling(g.camera.position,g.camera);
   ivy.forEach(o=>{o.material=baseline;});
   window.__vegR10f={ivy,current,baseline};
   g.renderer.render(w.scene,g.camera);
   return {meshCount:ivy.length,baselineMaterial:baseline.uuid,originalMaterial:current.uuid};
 });
 results.push({type:'material-compare',...compare});
 await page.screenshot({path:`${out}/north-before-texture.jpg`,type:'jpeg',quality:86});
 await page.evaluate(async()=>{
   const {ivy,current}=window.__vegR10f;
   const g=window.__game,w=g.world;
   ivy.forEach(o=>{o.material=current;});
   // Above selection deliberately checks geometry to avoid touching wall/architecture.
   g.extras.env?.update(0,g.camera.position,0);
   g.renderer.render(w.scene,g.camera);
 });
 await page.screenshot({path:`${out}/north-after-texture.jpg`,type:'jpeg',quality:86});
 await page.close();
 writeFileSync(`${out}/results.json`,JSON.stringify({errors,results},null,2));
 if(process.env.VEG_R10F_PRINT_EVIDENCE==='1')for(const name of ['west-exterior','north-exterior']){
   console.log('VEG_R10F_JPEG_'+name.replace(/-/g,'_')+'='+readFileSync(`${out}/${name}.jpg`).toString('base64'));
 }
 console.log('VEG_R10F_RESULTS='+JSON.stringify({errors,results}));
 if(errors.length||results.some(r=>r.glError!==undefined&&r.glError!==0))throw Error('Browser render failures in real estate: '+errors.join(';'));
}finally{await browser?.close();await server.close();}
