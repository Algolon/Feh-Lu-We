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
  const row=await page.evaluate(()=>{const g=window.__game;g.running=false;g.player.setPose({x:74.5,z:82.5,y:.15,yaw:-2.3,pitch:-.5});for(let i=0;i<30;i++)g.tick(1/30);g.world.updateCulling(g.camera.position,g.camera);g.renderer.render(g.world.scene,g.camera);return{audit:g.world.scene.userData.greeneryAudit,gl:g.renderer.getContext().getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,build:g.metrics().build??null,assets:[...document.scripts].filter(s=>s.src).map(s=>s.src)};});
  if(row.audit?.briefCount!==38||row.audit.missing.length||row.audit.placements.length!==49||row.gl||row.shaderFailures)throw Error('Default VEG-R09 failed '+JSON.stringify(row));
  rows.push({fallback,...row});await page.screenshot({path:out+'/'+(fallback?'fallback':'multi')+'.jpg',quality:90});await page.close();
 }
 writeFileSync(out+'/results.json',JSON.stringify({base,checkedAt:new Date().toISOString(),rows,errors},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({base,ok:true,defaultR09:true,paths:rows.length,rooms:38,plants:49,errors}));
}finally{await browser.close();}
