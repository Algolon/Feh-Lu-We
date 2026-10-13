// Owner screenshot follow-up. Inferred nearby pose, NOT an exact viewpoint reproduction.
import { preview } from 'vite';import { chromium } from 'playwright-core';import { mkdirSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';import { readFileSync,readdirSync } from 'node:fs';
const OUT=process.argv[2];if(!OUT)throw new Error('Output required');mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4192,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:412,height:733},deviceScaleFactor:1,isMobile:true,hasTouch:true}),errors=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:4192/Feh-Lu-We/?autotest=1&review=lighting');await page.click('[data-review-start]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:180000});
 await page.evaluate(()=>{const g=window.__game;g.running=false;g.settings.reducedMotion=true;g.player.setPose({x:63,y:0,z:13.5,yaw:33*Math.PI/180,pitch:0});});
 await page.click('[data-toggle]');
 for(const [system,diag,quality] of [['baseline','normal','low'],['baseline','normal','high'],['baseline','practicals','low'],['baseline','sun','low'],['baseline','sun','high'],['baseline','hemi','low'],['baseline','no-surfaces','low'],['baseline','normal','low'],['pilot','normal','low']]){
  await page.evaluate(()=>document.getElementById('review-bar').style.visibility='visible');
  await page.selectOption('[data-system]',system);await page.selectOption('[data-diagnostic]',diag);await page.selectOption('[data-quality]',quality);
  const r=await page.evaluate(()=>{const g=window.__game;g.extras.env.preview=.85;g.player.y=g.world.col.supportHeight(g.player.x,g.player.z,.05,.42);for(let i=0;i<120;i++)g.tick(1/30);for(let i=0;i<5;i++)g.renderer.render(g.world.scene,g.camera);for(const id of ['hud','toast','stick','review-bar'])document.getElementById(id)?.style.setProperty('visibility','hidden');return{pose:g.player.pose(),hemi:g.extras.env.hemi.intensity,sun:g.extras.env.sun.intensity,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};});
  const file=`owner-nearby-${system}-${diag}-${quality}.jpg`;await page.screenshot({path:OUT+'/'+file,type:'jpeg',quality:90});rows.push({file,system,diag,quality,...r});console.log(rows.at(-1));
 }
 await page.evaluate(()=>document.getElementById('review-bar').style.visibility='visible');
 const flags=await page.evaluate(()=>JSON.stringify(window.__game.state.flags));
 const download=page.waitForEvent('download');await page.click('[data-report]');const file=await download;await file.saveAs(OUT+'/render-report.json');
 const report=JSON.parse(readFileSync(OUT+'/render-report.json','utf8'));if(report.kind!=='ENV-L01 read-only lighting report'||report.gl.error!==0||report.programs.some(p=>p.linked===false))throw new Error('Invalid report / GL diagnostics');
 const flagsAfter=await page.evaluate(()=>JSON.stringify(window.__game.state.flags));if(flags!==flagsAfter)throw new Error('Report changed flags');
 console.log('Report download verified; linked programs',report.programs.length,'flags unchanged');
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
writeFileSync(OUT+'/owner-check.json',JSON.stringify({conditions:'Software WebGL2; low/high coarse pointer; 412x733 DPR1; dusk 0.85; torch off. Pose inferred from visible BOSLUST lantern/lock; NOT matched to owner camera. Practical-only deliberately zeros both globals as a hypothesis demonstration, NOT a reproduced native fault.',bundleSHA256:Object.fromEntries(readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>[f,createHash('sha256').update(readFileSync('dist/assets/'+f)).digest('hex')])),rows,errors},null,2));
if(errors.length)process.exitCode=1;
