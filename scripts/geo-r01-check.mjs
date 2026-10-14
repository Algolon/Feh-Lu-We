// GEO-R01 deterministic normal-render captures and structural probes; no production debug UI.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const OUT = process.argv[2];
if (!OUT) throw Error('Supply an output directory');
mkdirSync(OUT, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4196, strictPort: true } });
let browser;
const cases = [
  ['service-threshold-east',107.9,102.5,Math.PI/2,true,true],
  ['service-threshold-west',107.9,102.5,-Math.PI/2,true,true],
  ['corridor-west',110,102.5,-Math.PI/2,true,true],
  ['kitchen-east',106,102.5,Math.PI/2,true,true],
  ['cons-threshold-west',115.8,102.5,-Math.PI/2,true,true],
  ['cons-threshold-east',115.8,102.5,Math.PI/2,true,true],
  ['cons-closed-west',117,102.5,-Math.PI/2,false,false],
  ['corridor-closed-east',114.5,102.5,Math.PI/2,false,false],
  ['kitchen-closed-east',106,102.5,Math.PI/2,false,false],
  ['corridor-closed-west',110,102.5,-Math.PI/2,false,false],
  ['wing-floor-gap',108.75,103.5,-Math.PI/2,true,true,-1.25],
  ['wing-wall-gap',108.2,102.5,Math.PI,true,true],
  ['wing-join-up',108.25,102.5,Math.PI/2,true,true,.8],
  ['kitchen-dining',101,93,Math.PI,true,true],
  ['dining-kitchen',101,90,0,true,true],
  ['garden-kitchen',101,111,Math.PI,true,true],
  ['garden-cons',132,106,-Math.PI/2,false,false],
];
const errors=[],rows=[];
try {
  browser = await chromium.launch({executablePath:process.env.CHROME ?? '/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:412,height:820},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4196/Feh-Lu-We/?autotest=1');
  await page.evaluate(()=>{
    localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));
    localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['frontKey','consKey'],flags:{leftHome:true},unlocked:['lock.door.front','lock.door.consWest'],open:{'door.front':true},player:{estate:{x:106,y:.15,z:102.5,yaw:1.57,pitch:0}}}));
  });
  await page.reload();await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:60000});
  await page.evaluate(()=>{window.__game.running=false;});
  for (const [name,x,z,yaw,service,cons,pitch=0] of cases) {
    const row=await page.evaluate(({name,x,z,yaw,service,cons,pitch})=>{
      const g=window.__game,w=g.world,V=g.camera.position.constructor;
      g.state.open['door.service']=service;g.state.open['door.consWest']=cons;g.state.open['door.kitchenBack']=name==='garden-kitchen';g.state.open['door.front']=false;
      // Settle door animation away from every swept leaf before moving the camera to the capture pose.
      g.player.setPose({x:106,y:.15,z:100,yaw:0,pitch:0});w.syncAll();
      for(let i=0;i<30;i++)g.tick(1/30);
      g.player.setPose({x,y:.15,z,yaw,pitch});
      for(let i=0;i<30;i++)g.tick(1/30);
      w.updateCulling(g.camera.position,g.camera);w.scene.updateMatrixWorld(true);
      g.renderer.render(w.scene,g.camera);
      const active=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
      const rc=new g.raycaster.constructor();
      const hit=(x,y,z,dx,dy,dz,far=8,visible=true)=>{
        rc.set(new V(x,y,-z),new V(dx,dy,-dz));rc.far=far;
        const h=rc.intersectObjects(w.scene.children,true).find(h=>h.object.userData.static&&!h.object.material?.transparent&&(!visible||active(h.object)));
        return h?{distance:+h.distance.toFixed(3),chunk:h.object.userData.chunk,normal:h.face.normal.toArray()}:null;
      };
      return {name,pose:g.player.pose(),here:w.hereRoom,visible:[...w.visibleRooms],mIn:w.scene.children.filter(o=>o.userData.chunk==='mIn').map(o=>o.visible),calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,
        floor:hit(x,1,z,0,-1,0,2),ceiling:hit(x,2,z,0,1,0),rawFloor:hit(x,1,z,0,-1,0,2,false),rawCeiling:hit(x,2,z,0,1,0,8,false),gl:g.renderer.getContext().getError()};
    },{name,x,z,yaw,service,cons,pitch});
    await page.evaluate(row=>{
      let el=document.getElementById('geo-diagnostic');if(!el){el=document.createElement('pre');el.id='geo-diagnostic';el.style.cssText='position:fixed;left:4px;right:4px;top:68px;z-index:9999;background:#000c;color:#9ff;padding:7px;font:11px monospace;white-space:pre-wrap;pointer-events:none';document.body.append(el);}
      el.textContent=`GEO-R01 ${row.name}\nroom=${row.here} mIn=${row.mIn.every(Boolean)}\n${row.calls} calls / ${row.triangles} triangles\nvisible=${row.visible.join(',')}`;
    },row);
    await page.screenshot({path:`${OUT}/${name}.jpg`,type:'jpeg',quality:85});
    rows.push(row);console.log(JSON.stringify(row));
  }
  const checks=[];
  if(process.env.VALIDATE==='1') {
    await page.evaluate(readFileSync(new URL('./e2e-helpers.js',import.meta.url),'utf8'));
    checks.push(...await page.evaluate(()=>{
      const g=window.__game,w=g.world,V=g.camera.position.constructor,checks=[];
      const check=(name,ok,detail)=>checks.push({name,ok,detail});
      const place=(x,z,yaw=0,pitch=0)=>{g.player.setPose({x,y:.15,z,yaw,pitch});g.tick(0);w.updateCulling(g.camera.position,g.camera);w.scene.updateMatrixWorld(true);};
      g.state.open={'door.service':true,'door.consWest':true};place(106,102.5);w.syncAll();T.wait(1);
      const bad=[];
      for(const x of [107.5,107.7,107.9,108.1,108.35,115.5,115.7,115.9,116.1]) for(const z of [102.32,102.5,102.68]) for(const yaw of [0,Math.PI/2,Math.PI,3*Math.PI/2]) for(const pitch of [-.6,0,.6]) {
        place(x,z,yaw,pitch);
        if(w.hereRoom==='out'||!w.scene.children.filter(o=>o.userData.chunk==='mIn').every(o=>o.visible))bad.push({x,z,yaw,pitch,room:w.hereRoom});
      }
      check('324 lateral/turn/pitch threshold samples remain indoors with structure',bad.length===0,bad);
      const rc=new g.raycaster.constructor();
      const hit=(x,y,z,dx,dy,dz,far)=>{
        rc.set(new V(x,y,-z),new V(dx,dy,-dz));rc.far=far;
        return rc.intersectObjects(w.scene.children,true).find(h=>h.object.userData.chunk==='mIn'&&h.object.visible&&!h.object.material.transparent);
      };
      const seams=[];
      for(const x of [108.05,108.2,108.35]) for(const z of [93,99,102.5,103.5,105,109]) {
        place(x,z);const f=hit(x,.5,z,0,-1,0,1),c=hit(x,3.4,z,0,1,0,1);
        if(!f||Math.abs(f.point.y-.15)>.02||!c||Math.abs(c.point.y-3.55)>.02)seams.push({x,z,f:f?.point.y,c:c?.point.y});
      }
      check('wing floor/ceiling join: 18 paired front-face ray probes',seams.length===0,seams);
      const walls=[];
      for(const f of [101,104]) for(const x of [108.05,108.2,108.35]) for(const sign of [-1,1]) {
        place(x,f+sign*.5);const h=hit(x,1.5,f+sign*.5,0,0,-sign,1);
        if(!h||Math.abs(h.distance-.42)>.04||!w.col.segmentBlocked(x,1.5,f-.5,x,1.5,f+.5))walls.push({x,f,sign,d:h?.distance});
      }
      check('partition joins: 12 two-sided rays plus collision occlusion',walls.length===0,walls);
      const routes=[['door.service',[106,102.5],[110,102.5]],['door.consWest',[114.5,102.5],[117,102.5]],['door.kitchenBack',[101,108.5],[101,111]],['door.consEast',[129,106],[131,106]]];
      for(const [door,a,b] of routes) {
        g.state.open[door]=true;place(...a);w.syncAll();T.wait(1);
        try{T.walkTo(...b);T.walkTo(...a);check(`${door}: open traverse both directions`,true,T.pos());}catch(e){check(`${door}: open traverse both directions`,false,String(e));}
        g.state.open[door]=false;place(106,100);w.syncAll();T.wait(1);place(...a);
        check(`${door}: leaf collider closed before traversal`,w.col.colliders.filter(c=>c.tag===door).every(c=>c.enabled));
        try{T.walkTo(...b,false,4);check(`${door}: closed collision`,false,T.pos());}catch{check(`${door}: closed collision`,Math.hypot(g.player.x-b[0],g.player.z-b[1])>.5,T.pos());}
      }
      check('camera near plane remains inside capsule radius',g.camera.near<.3,{near:g.camera.near,radius:.3});
      return checks;
    }));
    for(const row of rows) {
      if(!row.name.startsWith('garden-'))checks.push({name:`${row.name}: interior structure retained`,ok:row.mIn.every(Boolean)});
      checks.push({name:`${row.name}: WebGL error`,ok:row.gl===0});
    }
  }
  writeFileSync(`${OUT}/results.json`,JSON.stringify({conditions:'Normal gameplay renderer; Chromium SwiftShader, low quality, 412x820 DPR1, fixed poses; not physical phone performance.',rows,checks,errors},null,2));
  if(checks.some(c=>!c.ok))throw Error(JSON.stringify(checks.filter(c=>!c.ok)));
  if(errors.length)throw Error(errors.join('\n'));
} finally {await browser?.close();await new Promise(r=>server.httpServer.close(r));}
