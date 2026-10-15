import { preview } from 'vite';
import { chromium } from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.argv[2]??'docs/development/workstreams/ext-r02/before';mkdirSync(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4218,strictPort:true}});
const browser=await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true,isMobile:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4218/Feh-Lu-We/?autotest=1');
 await page.evaluate(()=>{localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low'}));localStorage.setItem('fehluwe.save',JSON.stringify({version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],flags:{leftHome:true},unlocked:['lock.door.front'],open:{'door.front':true}}));});
 await page.reload();await page.click('[data-cont]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
 const rows=[];
 for(const [name,x,z,target] of [['garden',90,127,[90,4.1,110]],['conservatory',121,94,[114,1.8,100]]]){
 const result=await page.evaluate(({x,z,target})=>{
 const g=window.__game;g.player.setPose({x,y:0,z,yaw:Math.atan2(target[0]-x,target[2]-z),pitch:0});g.player.y=g.world.col.supportHeight(x,z,.15,.42);g.player.pitch=Math.atan2(target[1]-(g.player.y+1.65),Math.hypot(target[0]-x,target[2]-z));for(let i=0;i<20;i++)g.tick(1/30);
 const drawn=[],old=[];
 g.world.scene.traverse(o=>{if(!o.isMesh&&!o.isBatchedMesh)return;const cb=o.onBeforeRender;old.push([o,cb]);o.onBeforeRender=function(r,s,c,geo,mat,group){cb.call(this,r,s,c,geo,mat,group);drawn.push({uuid:o.uuid,name:o.name,type:o.type,ud:o.userData,mat:mat.uuid,matType:mat.type,map:mat.map?.uuid,surface:mat.userData.surface,transparent:mat.transparent,triangles:(group?.count??geo.index?.count??geo.attributes.position.count)/3,instances:o.count,shadow:o.castShadow,static:o.userData.static});};});
 g.renderer.render(g.world.scene,g.camera);const metrics={...g.renderer.info.render};old.forEach(([o,cb])=>o.onBeforeRender=cb);
 return {metrics,drawn,room:g.world.hereRoom};
 },{x,z,target});rows.push({name,...result});console.log(name,JSON.stringify(result.metrics));await page.screenshot({path:`${out}/${name}.jpg`});
 }
 writeFileSync(`${out}/profile.json`,JSON.stringify({rows,errors},null,2));
}finally{await browser.close();await server.close();}
