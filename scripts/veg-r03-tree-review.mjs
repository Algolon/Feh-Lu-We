// Matched approved-oak/full-family tree study; uses actual game models and materials.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = 'docs/veg-r03/trees'; mkdirSync(out, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5195, strictPort: true } });
await server.listen();
let browser;
const errors = [], models = [], results = [];
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); watch(page);
  await page.goto('http://127.0.0.1:5195/Feh-Lu-We/?vegstyle=woodland-r02&treeart=trees-r03');
  await page.evaluate(async () => {
    const T = await import('/Feh-Lu-We/node_modules/.vite/deps/three.js');
    const K = await import('/Feh-Lu-We/src/world/woodkit.ts');
    document.body.innerHTML = '<style>body{margin:0;background:#e5e9dd;color:#253c32;font-family:system-ui}header{height:90px;box-sizing:border-box;padding:18px 30px}h1{font-size:25px;margin:0}p{margin:6px 0;font-size:15px}</style><header><h1></h1><p></p></header>';
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(1440,810); renderer.setClearColor('#e5e9dd'); renderer.outputColorSpace = T.SRGBColorSpace; document.body.append(renderer.domElement);
    window.showTrees = (mode, species, variant = 0) => {
      const scene = new T.Scene(), group = new T.Group(); scene.add(group);
      scene.add(new T.HemisphereLight('#d1e4f2','#738361',1.35)); const sun = new T.DirectionalLight('#fff1d4',2.25); sun.position.set(-8,15,9); scene.add(sun);
      const specs = mode === 'palettes' ? [0,1,2].map(v=>({v,art:'trees-r03',x:(v-1)*10})) : [{v:variant,art:'oak-r03',x:-5.2},{v:variant,art:'trees-r03',x:5.2}];
      const rows = [];
      for (const {v,art,x} of specs) {
        const model = K.referenceTreeModel(species,v,'near','outline',art); const counts={species,v,art};
        for (const [part,g] of Object.entries(model)) {
          const mat = K.woodMats().tree.clone(); mat.onBeforeCompile = K.woodMats().tree.onBeforeCompile; mat.customProgramCacheKey = K.woodMats().tree.customProgramCacheKey; mat.color.set((part==='wood'?K.BARK_TINT:K.LEAF_TINT)[species]);
          const mesh = new T.Mesh(g,mat); mesh.position.x=x; mesh.rotation.y=.7; group.add(mesh); counts[part]=(g.index?.count??g.attributes.position.count)/3;
        } rows.push(counts);
      }
      const floor = new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshLambertMaterial({color:'#adba96'})); floor.rotation.x=-Math.PI/2; floor.position.y=-.03; scene.add(floor);
      const camera = new T.PerspectiveCamera(31,1440/810,.01,200);
      if(mode==='trunks'){const y=species==='pine'?5.3:3.2;camera.position.set(0,y,19);camera.lookAt(0,y-.2,0);}
      else {const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()); const d=Math.max(size.y/(2*Math.tan(.27)),size.x/(2*Math.tan(.27)*(1440/810)))*1.12+size.z*.5; camera.position.set(0,c.y+d*.10,d);camera.lookAt(0,c.y,0);}
      const name={beech:'Beuk',pine:'Grove den',birch:'Berk',oak:'Eik'}[species];
      document.querySelector('h1').textContent=name+' · '+(mode==='palettes'?'drie natuurlijke kleurvarianten':mode==='trunks'?'stam en vertakking':'vorm en loof');
      document.querySelector('p').textContent=mode==='palettes'?'Drie echte modelvarianten · dezelfde verlichting':'Links: vorige versie · rechts: nieuwe bomenstudie · identieke verlichting';
      renderer.render(scene,camera); return rows;
    };
  });
  for (const species of ['beech','pine','birch']) for (const mode of ['compare','trunks','palettes']) {
    models.push(...await page.evaluate(([mode,species])=>window.showTrees(mode,species),[mode,species]));
    await page.screenshot({path:`${out}/${species}-${mode}.jpg`,quality:94});
  }
  await page.close();
  if (process.env.GALLERY_ONLY !== '1') {
    for (const path of ['multi','fallback']) for (const art of ['oak-r03','trees-r03']) {
      const p = await browser.newPage({viewport:{width:960,height:640},isMobile:true,hasTouch:true}); watch(p);
      await p.goto(`http://127.0.0.1:5195/Feh-Lu-We/?autotest=1&vegstyle=woodland-r02&treeart=${art}${path==='fallback'?'&multidraw=0':''}`);
      await p.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));});
      await p.reload(); await p.click('[data-cont]'); await p.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000}); await p.evaluate(()=>window.__game.running=false);
      const inventory=await p.evaluate(()=>window.__game.world.scene.userData.vegList()); writeFileSync(`${out}/${art}-${path}-inventory.json`,JSON.stringify(inventory));
      for (const [name,x,z,yaw,pitch] of [['dense',65,57,-2.25,.12],['garden',124,132,1.05,.12],['boslust',52.6,6.4,.9,.12],['woodland-east',150,45,1.4,.12]]) {
        const row=await p.evaluate(({x,z,yaw,pitch})=>{const g=window.__game,w=g.world;g.player.setPose({x,z,y:w.col.supportHeight(x,z,20,.42),yaw,pitch});for(let i=0;i<30;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,actualPath:w.scene.userData.vegPath,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};},{x,z,yaw,pitch});
        results.push({name,art,path,...row}); if(path==='multi')await p.screenshot({path:`${out}/${art}-${name}.jpg`,quality:92});
      }
      const shadow=await p.evaluate(()=>{const g=window.__game,w=g.world;g.settings.quality='high';g.applyQuality(true);g.extras.env.preview=0;g.player.setPose({x:65,z:57,y:w.col.supportHeight(65,57,20,.42),yaw:-2.25,pitch:.12});for(let i=0;i<10;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,shadows:g.renderer.shadowMap.enabled,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};});
      results.push({name:'dense-high',art,path,...shadow});if(path==='multi')await p.screenshot({path:`${out}/${art}-dense-high.jpg`,quality:92});
      await p.close();
    }
  }
  writeFileSync(`${out}/results.json`,JSON.stringify({models,results,errors},null,2));
  if(errors.length||results.some(r=>r.glError||r.shaderFailures))throw new Error('Rendering errors: see results.json');
  console.log(JSON.stringify({models,results,errors}));
} finally { await browser?.close(); await server.close(); }
