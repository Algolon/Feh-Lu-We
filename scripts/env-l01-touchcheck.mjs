// Diagnose the unchanged main suite's F05, without changing input or weakening its assertion.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
const BASELINE=process.argv[2],OUT=process.argv[3];if(!BASELINE||!OUT)throw new Error('Baseline checkout and output required');mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const helpers=readFileSync('scripts/e2e-helpers.js','utf8'),rows=[];
try{
for(const [name,root] of [['production-ae2a036',BASELINE],['prototype-normal-game',process.cwd()]]){
 const server=await preview({root,preview:{host:'127.0.0.1',port:4190,strictPort:true}});
 try{
  for(const corrected of [false]){
   const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await ctx.newPage();
   await p.goto('http://127.0.0.1:4190/Feh-Lu-We/?autotest=1');await p.click('[data-new]');await p.waitForFunction(()=>window.__game?.world);await p.evaluate(helpers);
   const coords=await p.evaluate(()=>{
    T.walk([[3.2,2.5]]);T.lookAt(4.3,0.8,3.05);__game.player.yaw+=0.55;T.tick(2);
    const c=T.hitCenter('pk.torch'),V=__game.camera.position.constructor;
    const project=()=>{const v=new V(c.x,c.y,-c.z).project(__game.camera);return{x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};};
    const stale=project();__game.camera.updateMatrixWorld(true);const current=project();return{stale,current};
   });
   await p.evaluate(()=>{window.__touchTrace=[];for(const type of ['pointerdown','pointerup'])document.addEventListener(type,e=>window.__touchTrace.push({type,at:performance.now(),x:e.clientX,y:e.clientY}),true);});
   const pt=corrected?coords.current:coords.stale,cdp=await ctx.newCDPSession(p);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt.x,y:pt.y,id:9}]});await p.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   const taken=await p.waitForFunction(()=>__game.state.taken.includes('pk.torch'),null,{timeout:2000}).then(()=>true,()=>false);
   rows.push({name,corrected,coords,taken,events:await p.evaluate(()=>window.__touchTrace)});console.log(rows.at(-1));await ctx.close();
  }
 }finally{await new Promise(r=>server.httpServer.close(r));}
}
}finally{await b.close();}
writeFileSync(OUT+'/touch-check.json',JSON.stringify({note:'Existing F05 projects the target immediately after simulated camera movement. A prior explicit matrix-update comparison produced identical coordinates, rejecting a stale-projection explanation. This run measures pointer duration against the existing 350 ms tap limit; no input changes.',rows},null,2));
