// VEG-R10E visual gate: identical ivy geometry rendered with original vs new material.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const out='docs/veg-r10e/review';mkdirSync(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5217,strictPort:true,hmr:false,watch:null}});
await server.listen();let browser;const errors=[],results=[];
try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||chromium.executablePath(),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:540,height:720},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:5217/Feh-Lu-We/?autotest=1');
  await page.evaluate(async()=>{
    const THREE=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js');
    const E=await import('/Feh-Lu-We/src/world/exteriorGreenery.ts');
    document.body.innerHTML='<style>body{margin:0;background:#d6d9ca} canvas{display:block}</style>';
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    renderer.setSize(540,720);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#d6d9ca');
    document.body.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
    scene.add(new THREE.HemisphereLight('#f7fbe9','#74876b',1.45));
    const sun=new THREE.DirectionalLight('#fff4d5',1.8);sun.position.set(-2,6,4);scene.add(sun);
    const oldMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
    const newMat=E.ivyLeafMaterial();
    const camera=new THREE.PerspectiveCamera(32,540/720,.1,50);
    const raw=E.climberLeafGeo();
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(8,7),new THREE.MeshLambertMaterial({color:'#e1d8c6',side:THREE.DoubleSide}));
    wall.position.z=-.19;wall.position.y=2.25;group.add(wall);
    const sampleSite=E.climberPlan().find(s=>s.face==='N'&&Math.abs(s.root-85)<.001);
    if(!sampleSite||!sampleSite.leaves.length)throw Error('missing authored ivy site');
    const palette=['#63834e','#6b8d54','#78965b','#587749'];
    const meshes=[];
    // Representative handful of the REAL deterministic ivy leaves, not invented test shapes.
    for(const l of sampleSite.leaves.filter(l=>Math.abs(l.at-85)<.50&&l.y>1.05&&l.y<3.55).slice(0,105)){
      const g=raw.clone();
      g.scale(l.size,l.size,l.size);g.rotateX(l.tilt);g.rotateZ(-l.angle);
      g.translate(-(l.at-85),l.y,l.depth);
      const tint=new THREE.Color(palette[l.tone]),col=g.attributes.color;
      for(let i=0;i<col.count;i++)col.setXYZ(i,col.getX(i)*tint.r,col.getY(i)*tint.g,col.getZ(i)*tint.b);
      const mesh=new THREE.Mesh(g,oldMat);group.add(mesh);meshes.push(mesh);
    }
    const close=raw.clone(),col=close.attributes.color,tint=new THREE.Color('#78965b');
    for(let i=0;i<col.count;i++)col.setXYZ(i,col.getX(i)*tint.r,col.getY(i)*tint.g,col.getZ(i)*tint.b);
    const one=new THREE.Mesh(close,oldMat);scene.add(one);one.position.y=1.5;
    window.captureIvy=(type,after)=>{
      const single=type==='single';
      group.visible=!single;one.visible=single;
      for(const m of meshes)m.material=after?newMat:oldMat;
      one.material=after?newMat:oldMat;
      if(single){one.scale.set(1.28,1.28,1.28);camera.position.set(.1,1.45,5.2);camera.lookAt(0,1.5,0);}
      else{camera.position.set(0,2.25,4.4);camera.lookAt(0,2.0,0);}
      renderer.render(scene,camera);
      return {type,after,leaves:single?1:meshes.length,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,glError:renderer.getContext().getError(),posCount:raw.attributes.position.count,uvCount:raw.attributes.uv.count};
    };
  });
  for(const type of ['single','patch'])for(const after of [false,true]){
    const name=`${type}-${after?'after':'before'}`;
    results.push({name,...await page.evaluate(({type,after})=>window.captureIvy(type,after),{type,after})});
    await page.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:88});
  }
  await page.close();
  writeFileSync(`${out}/results.json`,JSON.stringify({results,errors},null,2));
  if(errors.length||results.some(r=>r.glError!==0||r.posCount!==102||r.uvCount!==102))throw Error(JSON.stringify({errors,results}));
  if(process.env.VEG_R10E_PRINT_EVIDENCE==='1')for(const name of ['single-before','single-after','patch-before','patch-after'])
    console.log('VEG_R10E_JPEG_'+name.replace(/-/g,'_')+'='+readFileSync(`${out}/${name}.jpg`).toString('base64'));
  console.log('VEG_R10E_RESULTS='+JSON.stringify(results));
}finally{await browser?.close();await server.close();}
