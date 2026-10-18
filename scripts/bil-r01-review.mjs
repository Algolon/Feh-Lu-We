// BIL-R01: independent, real 412px Android-sized software WebGL proof for the
// first-stage billiard table relocation. No puzzle state or saves modified.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const path='docs/development/workstreams/bil-r01/review';
mkdirSync(path,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4264,strictPort:true}});
const browser=await chromium.launch({
 executablePath:process.env.CHROME||chromium.executablePath(),
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
const views=[
 ['gallery-front', {x:90,y:3.35,z:77.5},[90.35,4.1,80.55]],
 ['gallery-west-clearance',{x:87.5,y:3.35,z:80.1},[90.35,4.05,80.55]],
 ['gallery-east-clearance',{x:93.1,y:3.35,z:80.55},[90.35,4.0,80.55]],
 ['gallery-from-hall',{x:90,y:3.35,z:83.25},[90.35,4.0,80.55]],
 ['gallery-cue-end',{x:90.2,y:3.35,z:78.4},[90.35,3.95,80.55]],
 ['old-billiard-room',{x:90.3,y:0.15,z:104.9},[90.1,1.1,107]],
];
const errors=[],results=[];
try {
 const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push('page: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
 await page.goto('http://127.0.0.1:4264/Feh-Lu-We/?autotest=1',{waitUntil:'networkidle',timeout:120000});
 await page.evaluate(()=>{
  localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'high'}));
  localStorage.setItem('fehluwe.save',JSON.stringify({
   version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],
   flags:{leftHome:true},unlocked:['lock.door.front'],open:{'door.front':true,'door.entranceHall':true},
  }));
 });
 await page.reload();
 await page.click('[data-cont]');
 await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const checks=await page.evaluate(()=>{
   const w=window.__game.world, y=3.35, x=90.35, z=80.55;
   const boxes=w.col.colliders.filter(c=>c.kind==='box'&&c.solid&&c.enabled);
   const table=boxes.filter(c=>
      Math.abs(c.minX-(x-.95))<.005 && Math.abs(c.maxX-(x+.95))<.005 &&
      Math.abs(c.minZ-(z-1.75))<.005 && Math.abs(c.maxZ-(z+1.75))<.005 &&
      Math.abs(c.minY-y)<.005 && Math.abs(c.maxY-(y+.95))<.005);
   const old=boxes.filter(c=>
      c.minX<90.1&&c.maxX>90.1&&c.minZ<107&&c.maxZ>107 &&
      c.minY<=.85&&c.maxY>=.85);
   const walk=[
     [87.6,80.55],[93.0,80.55],[90.35,77.3],[90.35,83.25]
   ].map(([wx,wz])=>({x:wx,z:wz,floor:w.col.supportHeight(wx,wz,y,.4),blocked:w.col.overlaps(wx,wz,y,.25,1.75,.35)}));
   return {tableColliders:table.length,oldCenterBlocked:old.length,
     tableCenterBlocked:w.col.overlaps(x,z,y,.25,1.75,.35),
     walk,
     puzzleIds:['billiard.panel','inspect.billiardExamples','lamp.billiard'].map(id=>({id,present:w.byId.has(id)})),
     hasFrontDoor:w.byId.has('door.front'),hasHallDoor:w.byId.has('door.entranceHall')};
 });
 assert.equal(checks.tableColliders,1,'exactly one upper billiard table collider required');
 assert.equal(checks.oldCenterBlocked,0,'old billiard table collider must be gone');
 assert.equal(checks.tableCenterBlocked,true,'new table must block player movement');
 assert.ok(checks.walk.every(w=>Math.abs(w.floor-3.35)<.06&&!w.blocked),'walking clearance missing');
 assert.ok(checks.puzzleIds.every(o=>o.present),'old billiard puzzle equipment is missing');
 for(const [name,stand,at] of views){
  const stats=await page.evaluate(({stand,at})=>{
   const g=window.__game,w=g.world;
   g.running=false;if(g.ui.modalOpen)g.ui.closeModal();
   const yaw=Math.atan2(at[0]-stand.x,at[2]-stand.z);
   const pitch=Math.atan2(at[1]-(stand.y+1.65),Math.hypot(at[0]-stand.x,at[2]-stand.z));
   const pose={...stand,yaw,pitch};
   g.player.setPose(pose);
   for(let i=0;i<14;i++)g.tick(1/30);
   g.player.setPose(pose);g.player.applyCamera(g.camera);w.updateCulling(g.camera.position,g.camera);
   g.renderer.render(w.scene,g.camera);
   return {pose,room:w.hereRoom,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,
      glError:g.renderer.getContext().getError(),visibleRooms:[...w.visibleRooms]};
  },{stand,at});
  results.push({name,...stats});
  console.log('BIL_R01_VIEW '+JSON.stringify({name,...stats}));
  const img=await page.screenshot({path:path+'/'+name+'.jpg',type:'jpeg',quality:83,timeout:90000});
  if(process.env.BIL_R01_THUMB==='1' && ['gallery-front','gallery-west-clearance','gallery-from-hall','old-billiard-room'].includes(name)){
    console.log('BIL_R01_IMAGE_'+name+' '+img.toString('base64'));
  }
 }
 const passed=errors.length===0 && results.every(x=>x.glError===0);
 const report={passed,checks,errors,results};
 writeFileSync(path+'/results.json',JSON.stringify(report,null,2)+'\n');
 console.log('BIL_R01_RESULT '+JSON.stringify({passed,checks,errors,positions:results.map(({name,room,calls,triangles})=>({name,room,calls,triangles}))}));
 if(!passed)process.exitCode=1;
} finally {await browser.close();await server.close();}
