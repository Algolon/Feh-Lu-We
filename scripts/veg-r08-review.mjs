// Matched accepted vegetation / shrub and dead-wood study; uses actual game models and materials.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = 'docs/veg-r08'; mkdirSync(out, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5201, strictPort: true } });
await server.listen();
let browser;
const errors = [], models = [], results = [];
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); watch(page);page.setDefaultNavigationTimeout(180000);
  await page.goto('http://127.0.0.1:5201/Feh-Lu-We/?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07&gardenart=r08');
  await page.evaluate(async () => {
    const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js'),K=await import('/Feh-Lu-We/src/world/woodkit.ts');
    document.body.innerHTML='<style>body{margin:0;background:#e5e9dd;color:#253c32;font-family:system-ui}header{height:90px;box-sizing:border-box;padding:18px 30px}h1{font-size:25px;margin:0}p{margin:6px 0;font-size:15px}</style><header><h1></h1><p></p></header>';
    const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1440,810);renderer.setClearColor('#e5e9dd');renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
    const names={fern:'Varens',grass:'Gras en zaadpluimen',bilberry:'Bosbes',foxglove:'Vingerhoedskruid',lily:'Lelietje-van-dalen',anemone:'Bosanemoon'};
    window.showPlants=(kind,mode)=>{
      const scene=new T.Scene(),group=new T.Group();scene.add(group);scene.add(new T.HemisphereLight('#d1e4f2','#738361',1.1));const sun=new T.DirectionalLight('#fff1d4',2.3);sun.position.set(-3,7,5);scene.add(sun);
      const rows=[],n=mode==='closeup'?1:K.PLANT_VARIANTS[kind],spacing=kind==='fern'?1.9:kind==='grass'?.7:kind==='foxglove'?.85:.68;
      for(let v=0;v<n;v++)for(const detail of (mode==='compare'?[false,true]:[true])){
        const g=K.referencePlantModel(kind,v,true,detail),mesh=new T.Mesh(g,K.woodMats().flat);mesh.position.set((v-(n-1)/2)*spacing,0,mode==='compare'?(detail?-.75:.75):0);mesh.rotation.y=.4;group.add(mesh);rows.push({kind,v,detail,triangles:g.attributes.position.count/3});
      }
      const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
      const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshLambertMaterial({color:'#adba96'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
      const dist=Math.max(size.x/(2*Math.tan(.27)*(1440/810)),(size.y+size.z*.55)/(2*Math.tan(.27)))*1.2;
      const camera=new T.PerspectiveCamera(31,1440/810,.01,200);camera.position.set(0,c.y+dist*.52,dist);camera.lookAt(c);
      document.querySelector('h1').textContent=names[kind]+(mode==='closeup'?' · detail':' · '+n+' modelvarianten');document.querySelector('p').textContent=mode==='compare'?'Voorste rij: vorige versie · achterste rij: nieuwe vormen en kleuren · identieke verlichting':'Nieuwe bodemplanten · echte spelmodellen en spelmateriaal';
      renderer.render(scene,camera);const glError=renderer.getContext().getError();if(glError)throw new Error('Gallery GL '+glError);return rows;
    };
  });
  for(const kind of ['fern','grass','bilberry','foxglove','lily','anemone'])for(const mode of ['compare','variants','closeup']){
    models.push(...await page.evaluate(([kind,mode])=>window.showPlants(kind,mode),[kind,mode]));await page.screenshot({path:`${out}/${kind}-${mode}.jpg`,quality:94});
  }
  await page.evaluate(async()=>{
    const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js'),K=await import('/Feh-Lu-We/src/world/woodkit.ts'),F=await import('/Feh-Lu-We/src/world/furniture.ts'),B=await import('/Feh-Lu-We/src/world/kit.ts');
    const canvas=document.querySelector('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1440,810);renderer.setClearColor('#e5e9dd');renderer.outputColorSpace=T.SRGBColorSpace;
    window.showGarden=kind=>{
      const scene=new T.Scene(),group=new T.Group();scene.add(group);scene.add(new T.HemisphereLight('#d1e4f2','#738361',1.1));const sun=new T.DirectionalLight('#fff1d4',2.3);sun.position.set(-3,7,5);scene.add(sun);const rows=[];
      for(const detail of [false,true]){
        if(kind==='pots'){
          const b=new B.Batcher(),sub=new T.Group();F.plant({b,chunk:'studio',col:{addCircle(){}}},detail?1.1:-1.1,0,0,1,'#c9774a',detail);b.build(sub);group.add(sub);
        }else{
          const g=K.referenceHedgeModel(3,detail),mat=K.woodMats().tree,mesh=new T.Mesh(g,mat);mat.color.set('#3f5f34');mesh.position.z=detail?-1:1;group.add(mesh);rows.push({kind,detail,triangles:(g.index?.count??g.attributes.position.count)/3});
        }
      }
      const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),dist=Math.max(size.x/(2*Math.tan(.27)*(1440/810)),(size.y+size.z*.55)/(2*Math.tan(.27)))*1.3;
      const camera=new T.PerspectiveCamera(31,1440/810,.01,200);camera.position.set(dist*.12,c.y+dist*.40,dist);camera.lookAt(c);document.querySelector('h1').textContent=kind==='pots'?'Potten · aarde en kamerplanten':'Geknipte haag · bladeren rondom';document.querySelector('p').textContent=kind==='pots'?'Links: oude spelmodel · rechts: nieuwe pot met aarde en gebogen bladeren':'Voor: oude haag · achter: nieuwe haag';renderer.render(scene,camera);return rows;
    };
  });
  for(const kind of ['pots','hedge']){models.push(...await page.evaluate(kind=>window.showGarden(kind),kind));await page.screenshot({path:`${out}/${kind}-compare.jpg`,quality:94});}
  await page.close();
  if (process.env.GALLERY_ONLY !== '1') {
    for (const path of ['multi','fallback']) for (const art of ['previous','r08']) {
      const p = await browser.newPage({viewport:{width:960,height:640},isMobile:true,hasTouch:true}); watch(p);p.setDefaultNavigationTimeout(180000);
      await p.goto(`http://127.0.0.1:5201/Feh-Lu-We/?autotest=1&vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07${art==='r08'?'&gardenart=r08':''}${path==='fallback'?'&multidraw=0':''}`);
      await p.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));});
      await p.reload(); await p.click('[data-cont]'); await p.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000}); await p.evaluate(()=>window.__game.running=false);
      const inventory=await p.evaluate(()=>window.__game.world.scene.userData.vegList()); writeFileSync(`${out}/${art}-${path}-inventory.json`,JSON.stringify(inventory));
      for (const [name,x,z,yaw,pitch] of [['dense',65,57,-2.25,.12],['garden',124,132,1.05,.12],['boslust',52.6,6.4,.9,.12],['woodland-east',150,45,1.4,.12],['ground-dense',65,57,-2.25,-.65],['ground-garden',124,132,1.05,-.65],['forecourt',90,67,0,-.35],['planter',90,68,0,-.65],['hedge',78,77.8,0,-.28],['hall-pot',86.2,82.2,-2.4,-.45],['botanic',104,94.5,-1.3,-.3],['conservatory',123,99,0,-.15]]) {
        const row=await p.evaluate(({name,x,z,yaw,pitch})=>{const g=window.__game,w=g.world;g.player.setPose({x,z,y:name==='botanic'?3.35:['hall-pot','conservatory'].includes(name)?.15:w.col.supportHeight(x,z,20,.42),yaw,pitch});for(let i=0;i<30;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,actualPath:w.scene.userData.vegPath,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};},{name,x,z,yaw,pitch});
        results.push({name,art,path,...row}); if(path==='multi')await p.screenshot({path:`${out}/${art}-${name}.jpg`,quality:92});
      }
      const shadow=await p.evaluate(()=>{const g=window.__game,w=g.world;g.settings.quality='high';g.applyQuality(true);g.extras.env.preview=0;g.player.setPose({x:65,z:57,y:w.col.supportHeight(65,57,20,.42),yaw:-2.25,pitch:.12});for(let i=0;i<10;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,shadows:g.renderer.shadowMap.enabled,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};});
      results.push({name:'dense-high',art,path,...shadow});if(path==='multi')await p.screenshot({path:`${out}/${art}-dense-high.jpg`,quality:92});
      await p.close();
    }
  }
  if(process.env.GALLERY_ONLY!=='1')for(const path of ['multi','fallback'])for(const art of ['previous','r08']){
    const p=await browser.newPage({viewport:{width:960,height:640}});watch(p);p.setDefaultNavigationTimeout(180000);
    await p.goto(`http://127.0.0.1:5201/Feh-Lu-We/?autotest=1&vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07${art==='r08'?'&gardenart=r08':''}${path==='fallback'?'&multidraw=0':''}`);
    await p.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'home',inventory:[],flags:{},unlocked:[],open:{}}));});
    await p.reload();await p.click('[data-new]');await p.waitForFunction(()=>window.__game?.world?.id==='home',null,{timeout:180000});await p.evaluate(()=>window.__game.running=false);
    for(const [name,x,z,yaw] of [['home-east',6.8,4.5,.6],['home-west',1.7,1.2,-2.1]]){
      const row=await p.evaluate(({x,z,yaw})=>{const g=window.__game,w=g.world;g.player.setPose({x,z,y:0,yaw,pitch:-.35});for(let i=0;i<30;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return {calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};},{x,z,yaw});
      results.push({name,art,path,...row});if(path==='multi')await p.screenshot({path:`${out}/${art}-${name}.jpg`,quality:92});
    }await p.close();
  }
  writeFileSync(`${out}/results.json`,JSON.stringify({models,results,errors},null,2));
  if(errors.length||results.some(r=>r.glError||r.shaderFailures))throw new Error('Rendering errors: see results.json');
  console.log(JSON.stringify({models,results,errors}));
} finally { await browser?.close(); await server.close(); }
