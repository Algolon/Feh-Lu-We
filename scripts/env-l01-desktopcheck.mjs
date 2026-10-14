// Additional desktop aspect check: fixed poses, both systems in one scene, same geometry/materials.
import { preview } from 'vite';import { chromium } from 'playwright-core';import { mkdirSync,writeFileSync } from 'node:fs';
const OUT=process.argv[2];if(!OUT)throw new Error('Output required');mkdirSync(OUT,{recursive:true});
const s=await preview({preview:{host:'127.0.0.1',port:4191,strictPort:true}});
const b=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}}),rows=[],errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
await p.goto('http://127.0.0.1:4191/Feh-Lu-We/?autotest=1&review=lighting');await p.click('[data-review-start]');await p.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
await p.evaluate(()=>{const g=window.__game;g.running=false;g.settings.quality='low';g.settings.reducedMotion=true;g.applyQuality(true);for(const id of ['hud','toast','stick','review-bar']){const el=document.getElementById(id);if(el)el.style.display='none';}});
for(const [name,pose] of Object.entries({boslust:{x:63,y:0,z:11.5,yaw:0,pitch:.05},garden:{x:90,y:0,z:123,yaw:0,pitch:-.03}}))for(const mode of ['baseline','pilot'])for(const t of [0,1]){
 const r=await p.evaluate(({pose,mode,t})=>{const g=window.__game;g.player.setPose(pose);g.player.y=g.world.col.supportHeight(pose.x,pose.z,pose.y+.05,.42);g.extras.env.mode=mode;g.extras.env.preview=t;for(let i=0;i<90;i++)g.tick(1/30);for(let i=0;i<4;i++)g.renderer.render(g.world.scene,g.camera);return{pose:g.player.pose(),calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,shaderFailures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length,glError:g.renderer.getContext().getError()};},{pose,mode,t});
 const file=`desktop-${name}-${mode}-${t}.jpg`;await p.screenshot({path:OUT+'/'+file,type:'jpeg',quality:86});rows.push({file,name,mode,t,...r});console.log(rows.at(-1));
}
}finally{await b.close();await new Promise(r=>s.httpServer.close(r));}
writeFileSync(OUT+'/desktop.json',JSON.stringify({viewport:{width:1280,height:720},quality:'low',DPR:1,conditions:'Both systems in the prototype review; baseline uses unchanged production light path. Same camera, different aspect from the 915x412 phone matrix.',rows,errors},null,2));
