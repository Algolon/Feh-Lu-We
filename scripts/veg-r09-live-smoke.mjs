import {lowViewWithinBudget} from './performance-budget.mjs';
import { chromium } from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.argv[2];if(!base)throw Error('Supply deployment URL');
const out=process.env.E2E_OUT??'docs/veg-r09-release/live';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const rows=[],errors=[];
try{
 for(const fallback of [false,true]){
  const page=await browser.newPage({viewport:{width:960,height:640}});page.setDefaultNavigationTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  // Only test hooks and renderer selection: no vegetation opt-in parameters.
  await page.goto(base+'?autotest=1'+(fallback?'&multidraw=0':''));
  await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],flags:{leftHome:true},unlocked:[],open:{}}));});
  await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
  const audit=await page.evaluate(()=>window.__game.world.scene.userData.greeneryAudit);
  if(audit?.briefCount!==38||audit.missing.length||audit.placements.length!==49)throw Error('Default room planting failed');
  const cons=audit.placements.find(a=>a.room==='cons'),dx=123-cons.x,dz=103-cons.z,d=Math.hypot(dx,dz),cx=cons.x+dx/d*1.6,cz=cons.z+dz/d*1.6;
  for(const [name,x,z,y,yaw,pitch] of [['boslust',52.6,6.4,0,.9,.12],['cons-corner',cx,cz,.15,Math.atan2(cons.x-cx,cons.z-cz),-.5],['hedge',78,77.8,.15,0,-.28],['forecourt',90,67,0,0,-.35],['living',74.5,82.5,.15,-2.3,-.5]]){
   const row=await page.evaluate(({x,z,y,yaw,pitch})=>{const g=window.__game;g.running=false;g.player.setPose({x,z,y,yaw,pitch});for(let i=0;i<30;i++)g.tick(1/30);g.world.updateCulling(g.camera.position,g.camera);const draws=[],original=g.renderer.renderBufferDirect;g.renderer.renderBufferDirect=function(cam,scene,geo,mat,obj,group){const n=obj.isBatchedMesh?Array.from(obj._multiDrawCounts??[]).slice(0,obj._multiDrawCount).reduce((a,b)=>a+b,0):Math.min(geo.drawRange.count,geo.index?.count??geo.attributes.position.count)*(obj.isInstancedMesh?obj.count:1);draws.push({type:obj.type,chunk:obj.userData.chunk,veg:obj.userData.veg,triangles:n/3});return original.call(this,cam,scene,geo,mat,obj,group);};g.renderer.render(g.world.scene,g.camera);g.renderer.renderBufferDirect=original;return{draws:draws.sort((a,b)=>b.triangles-a.triangles).slice(0,20),gl:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,hedgeDetailVisible:g.world.scene.children.filter(m=>m.userData.chunk?.startsWith('frontHedge.')&&!m.userData.regionOff).length,assets:[...document.scripts].filter(s=>s.src).map(s=>s.src)};},{x,z,y,yaw,pitch});
   if(row.gl||row.shaderFailures||!lowViewWithinBudget(row))throw Error('Default VEG-R09 view failed '+name+' '+JSON.stringify(row));
   if(name==='boslust'&&row.hedgeDetailVisible!==0)throw Error('Distant hedge detail still submitted');
   if(name==='hedge'&&row.hedgeDetailVisible===0)throw Error('Near hedge detail disappeared');
   rows.push({name,fallback,audit,...row});await page.screenshot({path:out+'/'+name+'-'+(fallback?'fallback':'multi')+'.jpg',quality:90});
  }await page.close();
 }
 writeFileSync(out+'/results.json',JSON.stringify({base,checkedAt:new Date().toISOString(),rows,errors},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({base,ok:true,defaultR09:true,views:rows.length,rooms:38,plants:49,errors}));
}finally{await browser.close();}
