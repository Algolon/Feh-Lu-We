// Matched ground texture review on top of the accepted R05 vegetation.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = 'docs/veg-r07'; mkdirSync(out, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5199, strictPort: true } });
await server.listen();
let browser;
const errors = [], models = [], results = [];
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); watch(page);page.setDefaultNavigationTimeout(180000);
  await page.goto('http://127.0.0.1:5199/Feh-Lu-We/?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07');
  await page.evaluate(async () => {
    const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js'),K=await import('/Feh-Lu-We/src/world/textures.ts'),S=await import('/Feh-Lu-We/src/world/surfaces.ts');
    const old=K.makeTextures(false,false),soft=K.makeTextures(true,false),fresh=K.makeTextures(true,true);
    document.body.innerHTML='<style>body{margin:0;background:#e5e9dd;color:#253c32;font-family:system-ui}header{height:90px;box-sizing:border-box;padding:18px 30px}h1{font-size:25px;margin:0}p{margin:6px 0;font-size:15px}</style><header><h1></h1><p></p></header>';
    const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1440,810);renderer.setClearColor('#e5e9dd');renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
    window.showGround=(kind,repeat)=>{
      const scene=new T.Scene();scene.add(new T.HemisphereLight('#d1e4f2','#738361',1.1));const sun=new T.DirectionalLight('#fff1d4',2.3);sun.position.set(-3,7,5);scene.add(sun);const rows=[];
      for(const [detail,texture,x] of [['original',old[kind],-5.5],['r06',soft[kind],0],['r07',fresh[kind],5.5]]){
        const map=texture.clone();map.repeat.set(repeat,repeat);map.needsUpdate=true;
        const material=S.surface(new T.MeshLambertMaterial({map}), 'ground');
        const mesh=new T.Mesh(new T.PlaneGeometry(5.2,6.5),material);mesh.rotation.x=-Math.PI/2;mesh.position.x=x;scene.add(mesh);
        const canvas=texture.image,px=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,mean=[0,0,0];
        for(let i=0;i<px.length;i+=4)for(let c=0;c<3;c++)mean[c]+=px[i+c]/(px.length/4);
        rows.push({kind,detail,repeat,width:canvas.width,height:canvas.height,meanRGB:mean});
      }
      const camera=new T.PerspectiveCamera(36,1440/810,.01,200);camera.position.set(0,14,13);camera.lookAt(0,0,0);
      document.querySelector('h1').textContent=(kind==='grass'?'Grasvelden':'Zandpaden')+' · '+(repeat===1?'oppervlak':'herhaling over meerdere tegels');document.querySelector('p').textContent='Links: oorspronkelijke textuur · midden: te zachte R06 · rechts: nieuwe kleurvariatie';
      renderer.render(scene,camera);return rows;
    };
  });
  for(const kind of ['grass','dirt'])for(const repeat of [1,3]){
    models.push(...await page.evaluate(([kind,repeat])=>window.showGround(kind,repeat),[kind,repeat]));await page.screenshot({path:`${out}/${kind}-${repeat===1?'compare':'repeat'}.jpg`,quality:94});
  }
  await page.close();
  if (process.env.GALLERY_ONLY !== '1') {
    for (const path of ['multi']) for (const art of ['previous','r07']) {
      const p = await browser.newPage({viewport:{width:960,height:640},isMobile:true,hasTouch:true}); watch(p);p.setDefaultNavigationTimeout(180000);
      await p.goto(`http://127.0.0.1:5199/Feh-Lu-We/?autotest=1&vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05${art==='r07'?'&groundart=r07':'&groundart=r06'}${path==='fallback'?'&multidraw=0':''}`);
      await p.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));});
      await p.reload(); await p.click('[data-cont]'); await p.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000}); await p.evaluate(()=>window.__game.running=false);
      const inventory=await p.evaluate(()=>window.__game.world.scene.userData.vegList()); writeFileSync(`${out}/${art}-${path}-inventory.json`,JSON.stringify(inventory));
      for (const [name,x,z,yaw,pitch] of [['dense',65,57,-2.25,.12],['garden',124,132,1.05,.12],['boslust',52.6,6.4,.9,.12],['woodland-east',150,45,1.4,.12],['ground-dense',65,57,-2.25,-.65],['ground-garden',124,132,1.05,-.65]]) {
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
