// Paired same-world baseline/pilot, avoiding LOD hysteresis / startup-pose confounds.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync,writeFileSync } from 'node:fs';
const OUT=process.argv[2]; if(!OUT)throw new Error('Output directory required');mkdirSync(OUT,{recursive:true});
const s=await preview({preview:{host:'127.0.0.1',port:4189,strictPort:true}});
const b=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:915,height:412}}),rows=[];
try{
 for(const fallback of [false,true]){
  await p.goto('http://127.0.0.1:4189/Feh-Lu-We/?autotest=1&review=lighting'+(fallback?'&multidraw=0':''));
  await p.click('[data-review-start]');await p.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
  await p.evaluate(()=>{const g=window.__game;g.running=false;g.settings.quality='low';g.settings.reducedMotion=true;g.applyQuality(true);for(let i=0;i<90;i++)g.tick(1/30);for(const id of ['hud','toast','stick','review-bar']){const el=document.getElementById(id);if(el)el.style.display='none';}});
  for(const mode of ['baseline','pilot'])for(const t of [0,1]){
   const r=await p.evaluate(({mode,t})=>{const g=window.__game,e=g.extras.env;e.mode=mode;e.preview=t;for(let i=0;i<90;i++)g.tick(1/30);const gl=g.renderer.getContext(),px=new Uint8Array(4),ms=[];for(let i=0;i<5;i++)g.renderer.render(g.world.scene,g.camera);for(let i=0;i<11;i++){const a=performance.now();g.renderer.render(g.world.scene,g.camera);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);ms.push(performance.now()-a);}ms.sort((a,b)=>a-b);return{pose:g.player.pose(),calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,softwareMedianMs:ms[5],glError:gl.getError(),shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};},{mode,t});
   const file=`paired-${fallback?'fallback':'multidraw'}-${mode}-${t}.jpg`;await p.screenshot({path:OUT+'/'+file,type:'jpeg',quality:86});rows.push({file,fallback,mode,t,...r});console.log(rows.at(-1));
  }
 }
}finally{await b.close();await new Promise(r=>s.httpServer.close(r));}
writeFileSync(OUT+'/paired.json',JSON.stringify({conditions:'915x412 DPR1 low, same scene/pose/LOD history, baseline and pilot toggled without rebuild. Software timing is not phone FPS.',rows},null,2));
