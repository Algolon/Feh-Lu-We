// Matched real-geometry studio views, followed by normal game camera probes. Software renderer ≠ phone FPS.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = 'docs/veg-r02'; mkdirSync(out, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5192, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [], results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5192/Feh-Lu-We/?vegstyle=birch-r02');
  const gallery = await page.evaluate(async () => {
    const T = await import('/Feh-Lu-We/node_modules/.vite/deps/three.js');
    const K = await import('/Feh-Lu-We/src/world/woodkit.ts');
    document.body.innerHTML = '<style>body{margin:0;background:#e8ecdf;font-family:system-ui;color:#263d32}header{height:85px;padding:24px 40px;box-sizing:border-box}h1{margin:0;font-size:25px}p{margin:5px 0;font-size:14px}#labels{position:absolute;top:96px;width:100%;display:flex;justify-content:space-around;font-weight:600}footer{position:absolute;bottom:15px;left:40px;font-size:14px}</style><header><h1>VEG-R02 · Berk — stijlproef</h1><p>Dezelfde drie stam- en takmodellen · links bestaand loof, rechts bladgeometrie · echte Three.js-modellen</p></header><div id="labels"><span>Bestaand</span><span>Nieuwe stijlproef</span></div><footer>Drie vaste varianten · geen AI-impressie · prototype, nog niet live</footer>';
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(1500, 990); renderer.setClearColor('#e8ecdf'); renderer.outputColorSpace = T.SRGBColorSpace;
    document.body.append(renderer.domElement);
    const scene = new T.Scene(); scene.add(new T.HemisphereLight('#d5edff', '#788666', 2));
    const sun = new T.DirectionalLight('#fff1d1', 2.1); sun.position.set(-8, 20, 12); scene.add(sun);
    const camera = new T.PerspectiveCamera(34, 1500/990, .1, 200); camera.position.set(0, 11.5, 42); camera.lookAt(0, 5.2, 0);
    const ground = new T.Mesh(new T.PlaneGeometry(100, 100), new T.MeshLambertMaterial({ color: '#b8c7a0' }));
    ground.rotation.x=-Math.PI/2; ground.position.y=-.1; scene.add(ground);
    const mats=K.woodMats(), rows=[];
    for(const style of ['baseline','reference'])for(let v=0;v<3;v++){
      const m=style==='baseline'?K.treeModel('birch',v,'near','outline'):K.birchReferenceModel(v,'near');
      const x=(style==='baseline'?-10:10)+(v-1)*5.8;
      const z=v===1?-1.5:0;
      for(const [kind,g] of Object.entries(m)){
        const mesh=new T.Mesh(g,mats.tree); mesh.position.set(x,0,z); mesh.rotation.y=.7;
        const tint=new T.Color(kind==='wood'?K.BARK_TINT.birch:K.LEAF_TINT.birch);mesh.material=mats.tree.clone();mesh.material.onBeforeCompile=mats.tree.onBeforeCompile;mesh.material.customProgramCacheKey=mats.tree.customProgramCacheKey;mesh.material.color.copy(tint);scene.add(mesh);
      }
      rows.push({style,v,wood:(m.wood.index?.count??m.wood.attributes.position.count)/3,leaves:(m.leaves.index?.count??m.leaves.attributes.position.count)/3});
    }
    renderer.render(scene,camera);
    window.review={renderer,scene,camera};return rows;
  });
  await page.screenshot({ path: `${out}/birch-lineup.png` });
  await page.evaluate(()=>{const {camera,renderer,scene}=window.review;camera.position.set(9,7.5,13);camera.lookAt(10,6.4,0);camera.fov=42;camera.updateProjectionMatrix();renderer.render(scene,camera);document.querySelector('#labels').style.display='none';document.querySelector('h1').textContent='VEG-R02 · Berk — loof en bast van dichtbij';document.querySelector('p').textContent='Nieuwe kroon met bladsilhouetten en zichtbare takken · gedeelde textuur · bestaande stamgeometrie';});
  await page.screenshot({ path: `${out}/birch-detail.png` });
  writeFileSync(`${out}/models.json`, JSON.stringify(gallery,null,2));
  await page.close();
  if (process.env.GALLERY_ONLY === '1') process.exitCode = 0;
  else
  for(const path of ['multi','fallback'])for(const style of ['baseline','birch-r02']){
    const p=await browser.newPage({viewport:{width:960,height:640},isMobile:true,hasTouch:true});
    p.on('pageerror',e=>errors.push(e.message));
    await p.goto(`http://127.0.0.1:5192/Feh-Lu-We/?autotest=1&vegstyle=${style}${path==='fallback'?'&multidraw=0':''}`);
    await p.evaluate(()=>{
      localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
      localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));
    });
    await p.reload();await p.click('[data-cont]');await p.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
    await p.evaluate(()=>window.__game.running=false);
    const probe=await p.evaluate(()=>({list:window.__game.world.scene.userData.vegList(),counts:window.__game.world.scene.userData.woodCounts}));
    if(!results.length)writeFileSync(`${out}/inventory.json`,JSON.stringify(probe,null,2));
    const birches=probe.list.filter(t=>t.key.startsWith('birch.')&&t.x>15&&t.x<180&&t.z>25&&t.z<160);
    const target=birches.sort((a,b)=>b.z-a.z)[0];
    const poses=[['garden',124,132,1.05,.12],['dense',65,57,-2.25,.12],['boslust',52.6,6.4,.9,.12]];
    if(target) poses.unshift(['birch',target.x,target.z-10,0,.35]);
    for(const[name,x,z,yaw,pitch]of poses){
      const row=await p.evaluate(({name,x,z,yaw,pitch})=>{
        const g=window.__game,w=g.world;g.player.setPose({x,z,y:w.col.supportHeight(x,z,20,.42),yaw,pitch});
        for(let i=0;i<30;i++)g.tick(1/30);
        w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);
        return{name,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,actualPath:w.scene.userData.vegPath};
      },{name,x,z,yaw,pitch});results.push({style,path,...row});
      if(path==='multi')await p.screenshot({path:`${out}/${style}-${name}.jpg`,quality:90});
    }
    if(target){
      const motion=await p.evaluate(({target})=>{
        const g=window.__game,w=g.world,frames=[];
        for(const distance of [10,16,22,25,32,36,40,55,70,90,70,55,40,36,32,25,22,16,10]){
          const x=target.x,z=target.z-distance;
          g.player.setPose({x,z,y:w.col.supportHeight(x,z,20,.42),yaw:0,pitch:.1});
          for(let i=0;i<3;i++)g.tick(1/30);
          w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);
          frames.push({distance,triangles:g.renderer.info.render.triangles,calls:g.renderer.info.render.calls,
            tree:w.scene.userData.vegSnapshot().find(t=>t.key===target.key&&Math.hypot(t.x-target.x,t.z-target.z)<.1)});
        }
        return frames;
      },{target});
      writeFileSync(`${out}/${style}-${path}-lod-sweep.json`,JSON.stringify(motion,null,2));
      const high=await p.evaluate(({target})=>{
        const g=window.__game,w=g.world;g.settings.quality='high';g.applyQuality(true);
        const x=target.x,z=target.z-10;g.player.setPose({x,z,y:w.col.supportHeight(x,z,20,.42),yaw:0,pitch:.35});
        for(let i=0;i<10;i++)g.tick(1/30);
        w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);
        let depthMeshes=0;w.scene.traverse(o=>{if(o.customDepthMaterial)depthMeshes++;});
        return {name:'birch-high',calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,shadows:g.renderer.shadowMap.enabled,depthMeshes};
      },{target});results.push({style,path,...high});
      if(path==='multi')await p.screenshot({path:`${out}/${style}-birch-high.jpg`,quality:90});
    }
    await p.close();
    console.log(JSON.stringify({style,path,results:results.filter(r=>r.style===style&&r.path===path)}));
  }
  if(process.env.GALLERY_ONLY!=='1')writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));
} finally { await browser.close(); await server.close(); }
