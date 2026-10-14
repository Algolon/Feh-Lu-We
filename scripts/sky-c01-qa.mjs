// Browser contract checks beyond the capture matrix. Uses disposable review storage only.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync,writeFileSync,readFileSync,readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const out=process.argv[2];if(!out)throw Error('Explicit output directory required');mkdirSync(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:4207,strictPort:true}});
let browser;const checks=[],errors=[];
const sha=s=>createHash('sha256').update(s).digest('hex');
const build=Object.fromEntries(readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>[f,sha(readFileSync('dist/assets/'+f))]));
try{
 browser=await chromium.launch({executablePath:process.env.CHROME??'/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 async function start(){await page.goto('http://127.0.0.1:4207/Feh-Lu-We/?autotest=1&review=lighting&sky=masks');await page.click('[data-review-start]');await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:60000});await page.evaluate(()=>{const g=window.__game;g.running=false;g.settings.quality='low';g.settings.reducedMotion=true;g.applyQuality(true);g.tick(0);});await page.waitForFunction(()=>window.__game.world.scene.children.find(o=>o.material?.uniforms?.uCloudAtlas)?.material.uniforms.uCloudAtlas.value?.image?.naturalWidth===1024);await page.click('[data-toggle]');}
 await start();
 const sentinel={'fehluwe.save':'SKYC01-REVIEW-SAVE','fehluwe.save.prev':'SKYC01-REVIEW-BACKUP'};
 await page.evaluate(s=>Object.entries(s).forEach(([k,v])=>localStorage.setItem(k,v)),sentinel);
 const sourceFlags=await page.evaluate(()=>JSON.stringify(window.__game.state.flags));
 const check=(name,ok,details)=>{checks.push({name,ok,details});if(!ok)throw Error(name);};
 async function skyFrame(target=page){return target.evaluate(()=>{const g=window.__game,e=g.extras.env;g.player.setPose({x:90,y:0,z:60,yaw:0,pitch:.22});g.player.y=0;g.tick(0);e.update(e.preview??0,g.camera.position,0);const sky=g.world.scene.children.find(o=>o.material?.uniforms?.uZenith);const visible=g.world.scene.children.map(o=>o.visible);g.world.scene.children.forEach(o=>{if(o!==sky)o.visible=false;});g.renderer.render(g.world.scene,g.camera);const pixels=g.renderer.domElement.toDataURL('image/png');g.world.scene.children.forEach((o,i)=>o.visible=visible[i]);return{pixels,cloud:e.clouds,variant:e.cloudVariant,gl:g.renderer.getContext().getError(),failures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};});}
 const off=[];
 for(const variant of ['production','procedural','masks']){
  await page.selectOption('[data-sky]',variant);await page.uncheck('[data-clouds]');const f=await skyFrame();off.push(sha(f.pixels));check('UI selector / cloud off '+variant,f.variant===variant&&!f.cloud&&!f.gl&&!f.failures,{hash:off.at(-1)});
  await page.check('[data-clouds]');const on=await skyFrame();check('UI cloud on changes sky '+variant,sha(on.pixels)!==off.at(-1),{hash:sha(on.pixels)});
 }
 check('Cloud-off framebuffer equal across all variants',new Set(off).size===1,off);
 const continuity=await page.evaluate(()=>{const g=window.__game,e=g.extras.env,rows=[];for(const variant of ['procedural','masks'])for(let i=0;i<=60;i++){e.cloudVariant=variant;e.preview=i/60;e.update(i/60,g.camera.position,0);g.renderer.render(g.world.scene,g.camera);rows.push({variant,t:i/60,sun:e.sun.intensity,gl:g.renderer.getContext().getError(),failures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length});}return rows;});
 check('122 continuous phase samples compile/render',continuity.every(r=>!r.gl&&!r.failures&&Number.isFinite(r.sun)),{samples:continuity.length});
 const reload=[];
 for(const variant of ['procedural','masks']){await page.selectOption('[data-sky]',variant);await page.evaluate(()=>window.__game.extras.env.preview=0);reload.push({variant,before:sha((await skyFrame()).pixels)});}
 await start();
 for(const r of reload){await page.selectOption('[data-sky]',r.variant);r.after=sha((await skyFrame()).pixels);check('Deterministic reload '+r.variant,r.before===r.after,r);}
 check('No solved puzzle flags added by cloud/phase controls',await page.evaluate(flags=>Object.keys(window.__game.state.flags).filter(k=>!k.startsWith('visited.')).every(k=>JSON.parse(flags)[k]===window.__game.state.flags[k]),sourceFlags),{});
 check('Actual review save preserves normal save and backup',await page.evaluate(s=>{const g=window.__game;g.running=true;g.saveNow();g.running=false;return Object.entries(s).every(([k,v])=>localStorage.getItem(k)===v);},sentinel),{});
 // Normal game query must not select candidates or fetch their texture; start real home game.
 const ctx=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true});const normal=await ctx.newPage();const requests=[];normal.on('request',r=>{if(r.url().includes('sky-c01-cloud-atlas'))requests.push(r.url());});
 await normal.goto('http://127.0.0.1:4207/Feh-Lu-We/?autotest=1&sky=masks');await normal.click('[data-new]');await normal.waitForFunction(()=>window.__game?.world?.id==='home',null,{timeout:30000});
 check('Normal tutorial entry and no mask request/review panel',requests.length===0&&await normal.evaluate(()=>!document.getElementById('review-bar')&&!!window.__game.world),{atlasRequests:requests.length});
 await normal.evaluate(()=>{window.__game.running=false;const s=structuredClone(window.__game.state);s.scene='estate';s.flags={leftHome:true};s.inventory=['frontKey','torch','matches','notebook'];s.unlocked=['lock.door.front'];s.open={'door.front':true};s.player.estate={x:90,y:0,z:123,yaw:0,pitch:.22};localStorage.setItem('fehluwe.save',JSON.stringify(s));localStorage.setItem('fehluwe.settings',JSON.stringify({quality:'low',reducedMotion:true}));});
 await normal.reload();await normal.click('[data-cont]');await normal.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:60000});
 await normal.evaluate(()=>window.__game.running=false);
  const normalPhases=await normal.evaluate(()=>{const g=window.__game,e=g.extras.env,rows=[];for(const pose of [{x:63,y:0,z:11.5,yaw:0,pitch:.05},{x:90,y:0,z:123,yaw:0,pitch:.22}])for(let i=0;i<4;i++){g.player.setPose(pose);g.tick(0);g.dusk=i/3;g.indoor=0;e.cloudVariant='masks';e.preview=1-i/3;e.mode='baseline';e.diagnostic='practicals';g.tick(0);g.renderer.render(g.world.scene,g.camera);const sky=g.world.scene.children.find(o=>o.material?.uniforms?.uZenith);rows.push({t:i/3,hemi:e.hemi.intensity,sun:e.sun.intensity,pilot:sky.material.uniforms.uPilot.value,atlas:sky.material.uniforms.uCloudAtlas.value!==null,approvedAShader:sky.material.fragmentShader.includes('float shoulder(float x, float center, float width)'),gl:g.renderer.getContext().getError(),failures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length});}const flags=JSON.stringify(g.state.flags);const light=[e.sun.intensity,e.hemi.intensity,...g.world.scene.fog.color.toArray()];e.clouds=false;g.tick(0);const sky=g.world.scene.children.find(o=>o.material?.uniforms?.uZenith);return{rows,off:sky.material.uniforms.uCloudOpacity.value,flagsIntact:flags===JSON.stringify(g.state.flags),lightIntact:JSON.stringify(light)===JSON.stringify([e.sun.intensity,e.hemi.intensity,...g.world.scene.fog.color.toArray()])};});
  check('Normal estate uses approved A, ignores SKY/ENV overrides and allocates no atlas',normalPhases.rows.every(r=>r.approvedAShader&&!r.atlas&&r.pilot===1&&r.hemi>.5&&!r.gl&&!r.failures&&(r.t<2/3||r.sun===0))&&requests.length===0,normalPhases);
 check('Normal cosmetic cloud toggle preserves flags/light',normalPhases.off===0&&normalPhases.flagsIntact&&normalPhases.lightIntact,{});
 await normal.evaluate(()=>{const g=window.__game;g.dusk=0;g.extras.env.preview=0;g.extras.env.clouds=true;});
 const normalHash=sha((await skyFrame(normal)).pixels),reviewHash=reload.find(r=>r.variant==='procedural').after;
 check('Normal A exactly matches reviewed A sky framebuffer',normalHash===reviewHash,{normalHash,reviewHash});
 const day=await normal.evaluate(()=>{const g=window.__game;g.renderer.render(g.world.scene,g.camera);return g.renderer.domElement.toDataURL('image/jpeg',.91).split(',')[1];});
 writeFileSync(out+'/normal-a-daylight.jpg',Buffer.from(day,'base64'));
 await normal.evaluate(()=>{const g=window.__game;g.settings.quality='high';g.applyQuality(true);});await normal.setViewportSize({width:412,height:733});
 // Wait for actual resize event. The inherited ENV smoke's immediate assertion can race it.
 await normal.waitForFunction(()=>window.__game.camera.aspect<1,null,{timeout:5000});
 const portrait=await normal.evaluate(()=>{const g=window.__game;g.tick(0);g.renderer.render(g.world.scene,g.camera);return{aspect:g.camera.aspect,gl:g.renderer.getContext().getError(),failures:g.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).length};});
 check('Normal High portrait compiles after resize settles',portrait.aspect<1&&!portrait.gl&&!portrait.failures,portrait);
 const dusk=await normal.evaluate(()=>{const g=window.__game;g.dusk=1;g.tick(0);g.renderer.render(g.world.scene,g.camera);return g.renderer.domElement.toDataURL('image/jpeg',.91).split(',')[1];});
 writeFileSync(out+'/normal-a-dusk-portrait.jpg',Buffer.from(dusk,'base64'));
 await ctx.close();check('No browser errors',errors.length===0,errors);
 writeFileSync(out+'/review-qa.json',JSON.stringify({build,browser:browser.version(),checks,errors,conditions:'Actual game UI selectors and WebGL2 SwiftShader; sky-only deterministic framebuffer checks. Normal tutorial started separately with sky=masks query. Not physical Android or complete walkthrough.'},null,2));
 console.log(JSON.stringify({ok:true,checks:checks.length}));
}finally{await browser?.close();await new Promise(r=>server.httpServer.close(r));}
