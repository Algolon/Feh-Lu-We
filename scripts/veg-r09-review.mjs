import {lowViewWithinBudget} from './performance-budget.mjs';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.VEG_REVIEW_OUT??'docs/veg-r09-release/visual';mkdirSync(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5202,strictPort:true,hmr:false,watch:null}});await server.listen();let browser;const errors=[],results=[],audits=[];
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const watch=p=>{p.setDefaultNavigationTimeout(180000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
 const p=await browser.newPage({viewport:{width:1440,height:900}});watch(p);
 await p.goto('http://127.0.0.1:5202/Feh-Lu-We/?gardenart=r09&groundart=r07');
 await p.evaluate(async()=>{
  const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js'),I=await import('/Feh-Lu-We/src/world/indoorPlants.ts'),B=await import('/Feh-Lu-We/src/world/kit.ts');
  document.body.innerHTML='<style>body{margin:0;background:#e5e9dd;color:#253c32;font-family:system-ui}header{height:90px;padding:18px 30px;box-sizing:border-box}h1{font-size:25px;margin:0}p{margin:6px 0}</style><header><h1></h1><p></p></header>';
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1440,810);renderer.setClearColor('#e5e9dd');document.body.append(renderer.domElement);
  window.gallery=family=>{
   const scene=new T.Scene(),group=new T.Group(),b=new B.Batcher(),c={b,chunk:'studio'};scene.add(group);scene.add(new T.HemisphereLight('#d1e4f2','#738361',1.1));const sun=new T.DirectionalLight('#fff1d4',2.3);sun.position.set(-3,7,5);scene.add(sun);
   if(family==='leaf-detail'){group.add(new T.Mesh(I.indoorPlantModel('alocasia',0),I.indoorLeafMaterial()));}
   else if(family==='group'){
    for(const [f,x,z,s,st] of [['ficus',-1.2,0,1.4,'stand'],['snake',-.4,.25,1,'wicker'],['alocasia',.6,0,1.2,'wicker'],['zz',1.5,-.1,1,'ceramic'],['cactus',1.2,.65,.7,'clay'],['succulent',.2,.7,.6,'ceramic']])I.addIndoorPlant(c,x,z,st==='stand'?.38*s:0,f,1,s,st);
    I.addIndoorPlant(c,-1.5,-.1,1.8,'pothos',0,.8,'clay',2.6);I.addIndoorPlant(c,1.6,-.1,1.9,'pothos',2,.7,'ceramic',2.6);
   }else for(let v=0;v<3;v++)I.addIndoorPlant(c,(v-1)*1.6,0,family==='pothos'?1.4:0,family,v,1,['clay','ceramic','wicker'][v],family==='pothos'?2.4:undefined);
   b.build(group);const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),dist=Math.max(size.x/(2*Math.tan(.27)*1440/810),(size.y+size.z*.5)/(2*Math.tan(.27)))*1.3;
   const cam=new T.PerspectiveCamera(31,1440/810,.01,200);cam.position.set(dist*.12,center.y+dist*.32,dist);cam.lookAt(center);
   const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshLambertMaterial({color:'#a8b495'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
   document.querySelector('h1').textContent=family==='group'?'Groen in huis · materiaal, silhouet en hoogte':family==='leaf-detail'?'Alocasia · detail van hoofdnerf en zijnerven':family+' · drie modelvariaties';document.querySelector('p').textContent='Werkelijke spelmodellen en materialen · coherente bladnerven · verschillende groeivormen';renderer.render(scene,cam);
   return{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,glError:renderer.getContext().getError()};
  };
 });
 for(const family of ['ficus','snake','alocasia','pothos','cactus','succulent','zz','group','leaf-detail']){results.push({name:family,gallery:true,...await p.evaluate(f=>window.gallery(f),family)});await p.screenshot({path:`${out}/${family}.jpg`,quality:94});}await p.close();
 for(const path of ['multi','fallback'])for(const art of ['r08','r09']){
  const page=await browser.newPage({viewport:{width:960,height:640}});watch(page);
  await page.goto(`http://127.0.0.1:5202/Feh-Lu-We/?autotest=1&vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07&gardenart=${art}${path==='fallback'?'&multidraw=0':''}`);
  await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));});
  await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});await page.evaluate(()=>window.__game.running=false);
  const rooms=await page.evaluate(async()=> (await import('/Feh-Lu-We/src/world/roomdefs.ts')).ROOMS);
  const audit=await page.evaluate(()=>window.__game.world.scene.userData.greeneryAudit);if(audit){audits.push({art,path,...audit});writeFileSync(`${out}/audit-${path}.json`,JSON.stringify(audit,null,2));}
  const poses=[['dense',65,57,undefined,-2.25,.12],['boslust',52.6,6.4,undefined,.9,.12],['hall',90,91,.15,1,-.3],['botanic',104,94.5,3.35,-1.3,-.3],['cons',123,99,.15,0,-.15],['cottage',25,154,4.15,-1,-.1],['planter',90,68,undefined,0,-.65]];
  if(art==='r09')for(const a of audit.placements.filter((a,i,all)=>a.room!=='cottageTerrace'&&all.findIndex(b=>b.room===a.room)===i)){const r=rooms.find(r=>r.id===a.room),dx=(r.x0+r.x1)/2-a.x,dz=(r.z0+r.z1)/2-a.z,d=Math.hypot(dx,dz),cx=a.x+dx/d*1.6,cz=a.z+dz/d*1.6;poses.push([`room-${a.room}`,cx,cz,a.hang?a.y-2.05:a.y,Math.atan2(a.x-cx,a.z-cz),a.hang?.05:-.5]);}
  for(const [name,x,z,y,yaw,pitch] of poses){
   const row=await page.evaluate(({x,z,y,yaw,pitch})=>{const g=window.__game,w=g.world;g.player.setPose({x,z,y:y??w.col.supportHeight(x,z,20,.42),yaw,pitch});for(let i=0;i<30;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};},{x,z,y,yaw,pitch});results.push({name,art,path,...row});if(path==='multi')await page.screenshot({path:`${out}/${art}-${name}.jpg`,quality:90});
  }await page.close();
 }
 for(const path of ['multi','fallback']){
  const page=await browser.newPage({viewport:{width:960,height:640}});watch(page);
  await page.goto(`http://127.0.0.1:5202/Feh-Lu-We/?autotest=1&vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07&gardenart=r09${path==='fallback'?'&multidraw=0':''}`);
  await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.removeItem('fehluwe.save');});await page.reload();await page.click('[data-new]');await page.waitForFunction(()=>window.__game?.world?.id==='home',null,{timeout:180000});await page.evaluate(()=>window.__game.running=false);
  for(const [name,x,z,yaw] of [['home-east',6.8,4.5,.6],['home-west',1.7,1.2,-2.1]]){
   const row=await page.evaluate(({x,z,yaw})=>{const g=window.__game,w=g.world;g.player.setPose({x,z,y:0,yaw,pitch:-.35});for(let i=0;i<30;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};},{x,z,yaw});results.push({name,art:'r09',path,...row});if(path==='multi')await page.screenshot({path:`${out}/r09-${name}.jpg`,quality:90});
  }await page.close();
 }
 writeFileSync(`${out}/results.json`,JSON.stringify({results,audits,errors},null,2));
 console.log(JSON.stringify({errors,missing:audits.map(a=>a.missing),placements:audits.map(a=>a.placements.length),overBudget:results.filter(r=>!r.gallery&&(!lowViewWithinBudget(r))),records:results.length}));
 if(results.some(r=>!r.gallery&&r.art==='r09'&&!lowViewWithinBudget(r))||errors.length||audits.some(a=>a.missing.length)||results.some(r=>r.glError||r.shaderFailures))throw Error('Review failed; see results.json');
}finally{await browser?.close();await server.close();}
