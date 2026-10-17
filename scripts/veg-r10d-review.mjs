// VEG-R10D visual acceptance probe: actual entranceLeafGeo/entrancePlantPlan and real estate camera.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const out=process.env.VEG_R10D_OUT??'docs/veg-r10d/review';
mkdirSync(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5216,strictPort:true,hmr:false,watch:null}});
await server.listen();
let browser;const errors=[],results=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const base='http://127.0.0.1:5216/Feh-Lu-We/';
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||chromium.executablePath(),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const studio=await browser.newPage({viewport:{width:720,height:760}});watch(studio);
 await studio.goto(base+'?autotest=1');
 await studio.evaluate(async()=>{
   const T=await import('/Feh-Lu-We/node_modules/.vite/deps/three.js');
   const E=await import('/Feh-Lu-We/src/world/exteriorGreenery.ts');
   document.body.innerHTML='<style>body{margin:0;background:#e6e5dd}canvas{display:block;margin:auto}</style>';
   const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
   renderer.setSize(720,760);renderer.setClearColor('#e6e5dd');renderer.outputColorSpace=T.SRGBColorSpace;
   document.body.appendChild(renderer.domElement);
   const scene=new T.Scene(),group=new T.Group();scene.add(group);
   scene.add(new T.HemisphereLight('#e6f0dd','#6e7258',2.1));
   const sun=new T.DirectionalLight('#fff4da',2.4);sun.position.set(-2,7,5);scene.add(sun);
   const stone=new T.MeshLambertMaterial({color:'#ded8c9'}),soilMat=new T.MeshLambertMaterial({color:'#514735'});
   const foliage=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
   const bark=new T.MeshLambertMaterial({color:'#66543c'});
   const profile=[[.001,0],[.39,0],[.39,.10],[.32,.13],[.28,.23],[.30,.59],[.38,.66],[.39,.75],[.31,.75],[.29,.67],[.27,.61],[.001,.61]];
   const urn=new T.Mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),16),stone);
   urn.position.y=.03;group.add(urn);
   const earth=new T.Mesh(new T.CylinderGeometry(.275,.275,.02,16),soilMat);earth.position.y=.65;group.add(earth);
   const plan=E.entrancePlantPlan(231),raw=E.entranceLeafGeo();
   const greens=['#739653','#7fa05f','#648b50','#87a768'];
   for(const b of plan.branches){const g=new T.TubeGeometry(new T.CatmullRomCurve3(b.points),8,b.radius,5,false);group.add(new T.Mesh(g,bark));}
   for(const l of plan.leaves){
     const g=raw.clone();g.scale(l.size,l.size,l.size);g.rotateX(l.tilt);g.rotateZ(l.angle);g.rotateY(l.yaw);g.translate(l.centre.x,l.centre.y,l.centre.z);
     const tint=new T.Color(greens[l.tone]),col=g.attributes.color;
     for(let i=0;i<col.count;i++)col.setXYZ(i,col.getX(i)*tint.r,col.getY(i)*tint.g,col.getZ(i)*tint.b);
     group.add(new T.Mesh(g,foliage));
     const stalk=new T.TubeGeometry(new T.CatmullRomCurve3([l.attachment,l.base]),1,.0032,5,false);group.add(new T.Mesh(stalk,bark));
   }
   const floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.MeshLambertMaterial({color:'#abb19e'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.014;scene.add(floor);
   const camera=new T.PerspectiveCamera(36,720/760,.01,100);
   window.urnView=(view)=>{if(view==='oblique')camera.position.set(2.2,1.85,3.0);else camera.position.set(0,1.7,3.5);camera.lookAt(0,.96,0);renderer.render(scene,camera);return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,glError:renderer.getContext().getError(),leafCount:plan.leaves.length,branches:plan.branches.length};};
   window.urnLeafClose=()=>{
     group.visible=false;floor.visible=false;
     const leaf=raw.clone(),col=leaf.attributes.color,tint=new T.Color('#739653');
     for(let i=0;i<col.count;i++)col.setXYZ(i,col.getX(i)*tint.r,col.getY(i)*tint.g,col.getZ(i)*tint.b);
     const mesh=new T.Mesh(leaf,foliage);mesh.scale.set(1.45,1.45,1.45);mesh.position.y=.65;scene.add(mesh);
     camera.position.set(.35,.75,4.8);camera.lookAt(0,.65,0);renderer.render(scene,camera);
     return {triangles:renderer.info.render.triangles,glError:renderer.getContext().getError()};
   };
 });
 for(const pose of ['front','oblique']){
   const row=await studio.evaluate(p=>window.urnView(p),pose);results.push({kind:'studio',pose,...row});
   await studio.screenshot({path:`${out}/${pose}.jpg`,quality:84,type:'jpeg'});
 }
 results.push({kind:'leaf',...await studio.evaluate(()=>window.urnLeafClose())});
 await studio.screenshot({path:`${out}/leaf.jpg`,quality:88,type:'jpeg'});
 await studio.close();

 const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:1});watch(page);
 await page.goto(base+'?autotest=1&quality=high');
 await page.evaluate(()=>{
   localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'high',reducedMotion:true}));
   localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));
 });
 await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
 await page.evaluate(()=>window.__game.running=false);
 for(const [name,x,z,tx,tz] of [['left-front',86.7,76.5,86.7,78.15],['left-oblique',85.5,76.7,86.7,78.15],['right-front',93.3,76.5,93.3,78.15]]){
   const row=await page.evaluate(({x,z,tx,tz})=>{
     const g=window.__game,w=g.world,y=w.col.supportHeight(x,z,20,.42);
     g.player.setPose({x,z,y,yaw:Math.atan2(tx-x,tz-z),pitch:-.26});
     for(let i=0;i<15;i++)g.tick(1/30);
     w.updateCulling(g.camera.position,g.camera);g.renderer.render(w.scene,g.camera);
     return{calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,glError:g.renderer.getContext().getError()};
   },{x,z,tx,tz});
   results.push({kind:'estate',name,...row});
   await page.screenshot({path:`${out}/${name}.jpg`,quality:76,type:'jpeg'});
 }
 await page.close();
 writeFileSync(`${out}/results.json`,JSON.stringify({errors,results},null,2));
 if(errors.length||results.some(r=>r.glError!==0))throw Error(JSON.stringify({errors,results}));
 // Small JPEGs are also available in CI logs for human review before any merge.
 if(process.env.VEG_R10D_PRINT_EVIDENCE==='1'){
   for(const name of ['front','leaf','left-front']){
     const raw=readFileSync(`${out}/${name}.jpg`);
     console.log('VEG_R10D_JPEG_'+name.replace(/-/g,'_')+'='+raw.toString('base64'));
   }
 }
 console.log('VEG_R10D_RESULTS='+JSON.stringify(results));
}finally{await browser?.close();await server.close();}
