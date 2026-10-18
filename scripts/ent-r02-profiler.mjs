// ENT-R02-PROFILE — diagnostic only; no game code, collisions or art is modified.
// Render single-frame cost deltas after masking *actual* visible meshes by tag.
// Do not use a masked frame as an aesthetic or visual QA acceptance image.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const out='docs/development/workstreams/ent-r02/profiler';
mkdirSync(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4239,strictPort:true}});
const browser=await chromium.launch({
  executablePath:process.env.CHROME || chromium.executablePath(),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
const poses=[
  ['gallery-wide',93,3.35,83,89,4.5,78.3],
  ['gallery-to-window',88.2,3.35,83,90,4.8,76.55],
];
try{
const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4239/Feh-Lu-We/?autotest=1',{waitUntil:'networkidle',timeout:120000});
await page.evaluate(()=>{
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'high'}));
  localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['frontKey'],flags:{leftHome:true},unlocked:['lock.door.front'],open:{'door.front':true}}));
});
await page.reload();await page.click('[data-cont]');
await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
const all=[];
for(const [name,x,y,z,tx,ty,tz] of poses){
  const result=await page.evaluate((p)=>{
    const g=window.__game,w=g.world;
    g.running=false;if(g.ui.modalOpen)g.ui.closeModal();
    const [name,x,y,z,tx,ty,tz]=p;
    const yaw=Math.atan2(tx-x,tz-z),pitch=Math.atan2(ty-(y+1.65),Math.hypot(tx-x,tz-z));
    const pose={x,y,z,yaw,pitch};
    g.player.setPose(pose);
    for(let i=0;i<12;i++)g.tick(1/30);
    g.player.setPose(pose);g.player.applyCamera(g.camera);w.updateCulling(g.camera.position,g.camera);
    g.renderer.render(w.scene,g.camera);
    // Freeze the frame-hooks while benchmarking, or the instanced fallback re-enables
    // intentionally hidden meshes in onBeforeRender(), invalidating the measurement.
    const originalOnBefore=w.scene.onBeforeRender;
    w.scene.onBeforeRender=()=>{};
    const render=()=>{g.renderer.render(w.scene,g.camera);return {calls:g.renderer.info.render.calls,tris:g.renderer.info.render.triangles};};
    const base=render(),groups=new Map(),tags={},shown=[];
    const effectiveVisible=(o)=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;};
    const keyOf=(o)=>{
      const d=o.userData;
      if(d.vegPart)return 'vegetation:'+d.vegPart;
      if(d.forestRocks)return 'vegetation:rocks';
      if(d.deadWood)return 'vegetation:deadwood';
      if(d.understory)return 'vegetation:understory';
      if(d.vegPath)return 'vegetation:other';
      if(d.chunk)return 'chunk:'+d.chunk;
      if(d.region)return 'region:'+d.region;
      if(d.opaqueAggregate)return 'opaque-aggregate';
      if(o.parent?.userData?.chunk)return 'parent-chunk:'+o.parent.userData.chunk;
      return 'unclassified:'+o.type;
    };
    w.scene.traverse(o=>{
      if(!o.isMesh||!effectiveVisible(o))return;
      const k=keyOf(o);
      if(!groups.has(k))groups.set(k,[]);
      groups.get(k).push(o);
      tags[k]=(tags[k]??0)+1;
      shown.push(o);
    });
    const measurements=[];
    const sorted=[...groups].sort((a,b)=>b[1].length-a[1].length).slice(0,10);
    for(const [key,objects] of sorted){
      for(const o of objects)o.visible=false;
      const off=render();
      for(const o of objects)o.visible=true;
      const check=render();
      measurements.push({key,meshes:objects.length,savedCalls:base.calls-off.calls,savedTriangles:base.tris-off.tris,restored:check.calls===base.calls&&check.tris===base.tris});
    }
    w.scene.onBeforeRender=originalOnBefore;
    return {name,pose,room:w.hereRoom,visibleRooms:[...w.visibleRooms],outdoorWindows:w.outdoorWindows,
      vegetation:w.scene.userData.vegStats?.(),base,meshCount:shown.length,tags,
      measurements:measurements.sort((a,b)=>b.savedTriangles-a.savedTriangles)};
  },[name,x,y,z,tx,ty,tz]);
  all.push(result);
  console.log('ENT_R02_PROFILE '+JSON.stringify(result));
}
writeFileSync(out+'/render-by-group.json',JSON.stringify({all,errors},null,2)+'\n');
if(errors.length)process.exitCode=1;
}finally{await browser.close();await server.close();}
