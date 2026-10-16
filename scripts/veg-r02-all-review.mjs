// Complete vegetation-family studio + matched estate replay. Software rendering is not physical-device FPS.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const portrait=process.env.PORTRAIT_ONLY==='1';
const stress=process.env.STRESS_ONLY==='1';
const out=portrait?'docs/veg-r02/all/portrait':stress?'docs/veg-r02/all/stress':'docs/veg-r02/all';mkdirSync(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5193,strictPort:true}});await server.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],results=[],models=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
try{
  if(process.env.NO_GALLERY!=='1'&&!portrait&&!stress){
  const p=await browser.newPage({viewport:{width:1440,height:820}});watch(p);
  await p.goto('http://127.0.0.1:5193/Feh-Lu-We/?vegstyle=woodland-r02');
  await p.evaluate(async()=>{
    const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js'),K=await import('/Feh-Lu-We/src/world/woodkit.ts');
    document.body.innerHTML='<style>body{margin:0;background:#e7ecdf;font-family:system-ui;color:#263c32}header{height:90px;padding:20px 32px;box-sizing:border-box}h1{margin:0;font-size:25px}p{margin:5px 0;font-size:14px}#labels{position:absolute;top:95px;display:flex;width:100%;justify-content:space-around;font-weight:600}</style><header><h1></h1><p>Echte Three.js-modellen · dezelfde varianten, plaatsing en verlichting</p></header><div id="labels"><span>Bestaand</span><span>VEG-R02</span></div>';
    const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1440,730);renderer.setClearColor('#e7ecdf');renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
    window.studio={T,K,renderer,group:null};
    window.renderFamily=(kind,family,title)=>{
      const {T,K,renderer}=window.studio;if(window.studio.group){window.studio.group.traverse(o=>{o.geometry?.dispose();if(o.material&&!o.material.userData.shared)o.material.dispose();});}
      const scene=new T.Scene(),group=new T.Group();scene.add(group);window.studio.group=group;
      scene.add(new T.HemisphereLight('#cbe4f4','#6c805f',1.3));const sun=new T.DirectionalLight('#fff0cd',2.2);sun.position.set(-8,18,12);scene.add(sun);
      const mats=K.woodMats(),rows=[],spacing=kind==='tree'?8.3:kind==='bush'?2.8:1.0;
      for(const style of ['baseline','reference'])for(let v=0;v<(kind==='plant'?K.PLANT_VARIANTS[family]:3);v++){
        const x=(style==='baseline'?-2:2)*spacing+(v-1)*spacing;
        let model;
        if(kind==='tree')model=(style==='baseline'?K.treeModel:K.referenceTreeModel)(family,v,'near','outline');
        else if(kind==='bush')model=(style==='baseline'?K.bushModel:K.referenceBushModel)(family,v,'near');
        else model={plant:(style==='baseline'?K.plantModel:K.referencePlantModel)(family,v)};
        const counts={};
        for(const [part,g]of Object.entries(model)){
          let m;
          if(part==='plant')m=mats.flat.clone();
          else {m=mats.tree.clone();m.onBeforeCompile=mats.tree.onBeforeCompile;m.customProgramCacheKey=mats.tree.customProgramCacheKey;m.color.set((part==='wood'?K.BARK_TINT:K.LEAF_TINT)[family]);}
          const mesh=new T.Mesh(g,m);mesh.position.x=x;mesh.rotation.y=.7;mesh.userData={style,v};group.add(mesh);counts[part]=(g.index?.count??g.attributes.position.count)/3;
        }rows.push({kind,family,style,v,...counts});
      }
      // One matched representative is easier to inspect than six tiny trees; model data still covers all variants.
      for(const o of [...group.children]){if(o.userData.v){group.remove(o);o.geometry.dispose();o.material.dispose();}else o.position.x=(o.userData.style==='baseline'?-1:1)*spacing*.9;}
      const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3());
      const dist=Math.max(size.y/(2*Math.tan(.27)),size.x/(2*Math.tan(.27)*(1440/730)))*1.12+size.z*.5;
      const camera=new T.PerspectiveCamera(31,1440/730,.01,300);camera.position.set(0,centre.y+dist*.10,dist);camera.lookAt(0,centre.y,0);
      const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshLambertMaterial({color:'#a9bd92'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
      document.querySelector('h1').textContent='VEG-R02 · '+title;document.querySelector('p').textContent='Echte Three.js-modellen · representatieve variant · identieke verlichting';renderer.render(scene,camera);return rows;
    };
    window.renderProps=()=>{
      const{T,K,renderer}=window.studio,scene=new T.Scene();scene.add(new T.HemisphereLight('#d0e7fa','#78875f',1.5));const sun=new T.DirectionalLight('#fff1d0',2.5);sun.position.set(-6,12,8);scene.add(sun);
      const specs=[['Cipres',K.referenceCypressModel(),[-4,0,0],[.8,3,.8],'#3c6741'],['Vormsnoei',K.referenceTopiaryModel(),[-2,0,0],[1.2,1.2,1.2],'#52773d'],['Haag',K.referenceHedgeModel(3),[1,0,-1.4],[1,1,1],'#496d36'],['Stronk',K.referenceStumpModel(),[-2.6,0,2],[.65,.65,.65],'#947b60'],['Stam',K.logModel(91,2.7,.28),[-.7,0,1.8],[1,1,1],'#8b7a62'],['Tak',K.referenceBranchModel(2),[2,0,1.6],[1,1,1],'#8b7a62']];
      for(const[name,g,pos,scale,color]of specs){const m=K.woodMats().tree.clone();m.onBeforeCompile=K.woodMats().tree.onBeforeCompile;m.customProgramCacheKey=K.woodMats().tree.customProgramCacheKey;m.color.set(color);const o=new T.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);scene.add(o);}
      const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshLambertMaterial({color:'#b1bf9d'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;scene.add(floor);
      const camera=new T.PerspectiveCamera(33,1440/730,.1,100);camera.position.set(4.5,7.5,12);camera.lookAt(-.5,.9,0);document.querySelector('h1').textContent='VEG-R02 · Tuingroen, stronken en dood hout';document.querySelector('#labels').style.display='none';document.querySelector('p').textContent='Cipres · vormsnoei · haag · stronk met jaarringen · liggende stam · afgevallen tak';renderer.render(scene,camera);
    };
  });
  for(const[kind,family,title]of [['tree','oak','Eik'],['tree','beech','Beuk'],['tree','birch','Berk'],['tree','pine','Grove den'],['bush','hazel','Hazelaar'],['bush','holly','Hulst'],['plant','fern','Varens'],['plant','grass','Gras'],['plant','bilberry','Bosbes'],['plant','foxglove','Vingerhoedskruid'],['plant','lily','Lelietje-van-dalen'],['plant','anemone','Bosanemoon']]){
    models.push(...await p.evaluate(([k,f,t])=>window.renderFamily(k,f,t),[kind,family,title]));await p.screenshot({path:`${out}/models-${family}.jpg`,quality:92});
  }
  await p.evaluate(()=>window.renderProps());await p.screenshot({path:`${out}/models-props.jpg`,quality:92});await p.close();
  writeFileSync(`${out}/models.json`,JSON.stringify(models,null,2));
  }
  if(process.env.GALLERY_ONLY!=='1'){
  let poses=[['birch',110.5,148.76,0,.32],['garden',124,132,1.05,.12],['dense',65,57,-2.25,.12],['boslust',52.6,6.4,.9,.12],['forecourt',90,68,0,.05],['lake',78,137,0,.08],['woodland-east',150,45,1.4,.12]];
  if(portrait)poses=poses.filter(p=>['dense','boslust','forecourt'].includes(p[0]));
  if(stress)poses=[['busy-boslust',47.5,5.2,.75,.1],['cons-deck',137,106,-1.57,.05,.15],['cons-corridor',115.8,102.5,-1.57,0,.15],['service',107.9,102.5,-1.57,0,.15],['shed',50,44,-2.2,0],['long-garden',92,136,Math.PI*.9,0],['library',82.4,97.5,-.8,.05,.15]];
  for(const path of ['multi','fallback'])for(const style of portrait?['woodland-r02']:['baseline','woodland-r02']){
    const page=await browser.newPage({viewport:portrait?{width:412,height:915}:{width:960,height:640},isMobile:true,hasTouch:true});watch(page);
    await page.goto(`http://127.0.0.1:5193/Feh-Lu-We/?autotest=1&vegstyle=${style}${path==='fallback'?'&multidraw=0':''}`);
    await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));});
    await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});await page.evaluate(()=>window.__game.running=false);
    const inventory=await page.evaluate(()=>({list:window.__game.world.scene.userData.vegList(),counts:window.__game.world.scene.userData.woodCounts}));writeFileSync(`${out}/${style}-${path}-inventory.json`,JSON.stringify(inventory,null,2));
    for(const[name,x,z,yaw,pitch,yOverride]of poses){
      const row=await page.evaluate(({name,x,z,yaw,pitch,yOverride})=>{
        const g=window.__game,w=g.world;g.player.setPose({x,z,y:yOverride??w.col.supportHeight(x,z,20,.42),yaw,pitch});for(let i=0;i<30;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);
        return{name,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,actualPath:w.scene.userData.vegPath,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};
      },{name,x,z,yaw,pitch,yOverride});results.push({style,path,...row});if(path==='multi')await page.screenshot({path:`${out}/${style}-${name}.jpg`,quality:90});
    }
    // Discrete approach/retreat plus azimuths: all LOD bands, then every side of a crown.
    const sweep=await page.evaluate(()=>{
      const g=window.__game,w=g.world,rows=[];
      for(const distance of [10,16,22,25,32,36,40,55,70,90,70,40,25,16,10]){
        const x=110.5,z=158.76-distance;g.player.setPose({x,z,y:w.col.supportHeight(x,z,20,.42),yaw:0,pitch:.1});for(let i=0;i<3;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);rows.push({distance,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,trees:w.scene.userData.vegSnapshot().filter(t=>t.visible&&!t.bush).slice(0,4)});
      }return rows;
    });writeFileSync(`${out}/${style}-${path}-sweep.json`,JSON.stringify(sweep,null,2));
    if(style==='woodland-r02'&&!portrait&&!stress)for(const phase of [0,1/3,2/3,1]){
      const row=await page.evaluate(phase=>{const g=window.__game,w=g.world;g.player.setPose({x:65,z:57,y:w.col.supportHeight(65,57,20,.42),yaw:-2.25,pitch:.12});for(let i=0;i<3;i++)g.tick(1/30);g.extras.env.preview=phase;g.extras.env.update(phase,g.camera.position,0);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{phase,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError()};},phase);results.push({style,path,name:'phase',...row});if(path==='multi')await page.screenshot({path:`${out}/phase-${Math.round(phase*3)}.jpg`,quality:90});
    }
    const shadow=await page.evaluate(()=>{const g=window.__game,w=g.world;g.settings.quality='high';g.applyQuality(true);g.extras.env.preview=0;g.player.setPose({x:90,z:68,y:0,yaw:0,pitch:.05});for(let i=0;i<10;i++)g.tick(1/30);w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,shadows:g.renderer.shadowMap.enabled,glError:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};});results.push({style,path,name:'forecourt-high',...shadow});if(path==='multi')await page.screenshot({path:`${out}/${style}-forecourt-high.jpg`,quality:90});
    console.log(JSON.stringify({style,path,views:results.filter(r=>r.style===style&&r.path===path).map(r=>[r.name,r.calls,r.triangles,r.glError])}));await page.close();
  }
  writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2));
  if(errors.length||results.some(r=>r.glError||r.shaderFailures))throw Error('Page, shader or WebGL errors: '+errors.join('\n'));
  }
}finally{await browser.close();await server.close();}
