// LIB-STAIR-R01 real-game validation: screenshots + actual player path + guard physics.
// Visual screenshots are from the running Vite scene in Chromium software WebGL, not mockups.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const OUT='docs/lib-stair-r01/review';
mkdirSync(OUT,{recursive:true});
const errors=[],screens=[],checks=[];
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:false}});
await server.listen();
const url=server.resolvedUrls.local[0]+'Feh-Lu-We/?autotest=1';
const browser=await chromium.launch({
  executablePath:process.env.CHROME||chromium.executablePath(),headless:true,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']
});
const helpers=readFileSync(new URL('./e2e-helpers.js',import.meta.url),'utf8');
async function open(viewport,mobile=false){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  await page.goto(url);
  await page.evaluate(()=>localStorage.setItem('fehluwe.save',JSON.stringify({
    version:4,scene:'estate',inventory:['invitation','torch','matches','notebook','frontKey'],
    flags:{leftHome:true},unlocked:['lock.door.front'],open:{'door.front':true},
    player:{home:null,estate:{x:81.3,y:0.15,z:103.8,yaw:0,pitch:0}}
  })));
  await page.reload();await page.click('[data-cont]');
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:150000});
  await page.evaluate(helpers);
  await page.evaluate(()=>{if(T.modalOpen())T.closeModal();});
  return {context,page};
}
async function shot(page,name,pose,lookAt,hud=false){
  const metrics=await page.evaluate(({pose,lookAt,hud})=>{
    const g=window.__game;
    g.player.setPose({x:pose[0],y:pose[1],z:pose[2],yaw:0,pitch:0});
    T.lookAt(lookAt[0],lookAt[1],lookAt[2]);T.tick(8);
    if(!hud)for(const id of ['hud','stick','toast']){const el=document.getElementById(id);if(el)el.style.display='none';}
    g.renderer.render(g.world.scene,g.camera);const m=g.metrics();
    return {calls:m.calls,triangles:m.triangles,room:g.world.hereRoom,glError:g.renderer.getContext().getError()};
  },{pose,lookAt,hud});
  await page.screenshot({path:`${OUT}/${name}.jpg`,type:'jpeg',quality:85});
  screens.push({name,...metrics});console.log('STAIR SHOT',JSON.stringify({name,...metrics}));
}
try{
  const {page,context}=await open({width:1280,height:720});
  for(const [name,pose,target] of [
    ['01-full-stair-below',[79.9,.15,103.5],[81.95,2.0,105.3]],
    ['02-closed-treads-and-post',[81.0,.15,104.1],[81.95,1.3,105.3]],
    ['03-upper-bridge-from-gallery',[84.05,3.35,105.28],[82.75,3.58,105.23]],
    ['04-stair-from-landing',[82.98,3.35,105.24],[81.95,1.7,105.3]],
  ])await shot(page,name,pose,target);

  const traversal=await page.evaluate(()=>{
    const g=window.__game,steps=26,x=81.95,z=105.3, rise=3.2/26,positions=[];
    const at=i=>{const a=-Math.PI/2+(i+.5)*Math.PI*2.5/steps;return [x+.78*Math.cos(a),z+.78*Math.sin(a)]};
    // Enter from inside room along the open tangential mouth, not from inside the stair.
    g.player.setPose({x:81.34,y:.15,z:104.43,yaw:0,pitch:0});T.tick(5);
    try{
      for(let i=0;i<steps;i++){
        const p=at(i);T.walkTo(...p,false,18);
        positions.push({step:i,...T.pos()});
      }
      T.walkTo(83.46,105.25,false,15);
      const up=T.pos();
      // Walk back from the gallery: validate the bridge is a two-way connection.
      T.walkTo(82.97,105.26,false,15);
      for(let i=steps-1;i>=0;i--)T.walkTo(...at(i),false,18);
      T.walkTo(81.34,104.43,false,15);
      const down=T.pos();
      return {pass:Math.abs(up.y-3.35)<.14&&Math.abs(down.y-.15)<.14,
              up,down,positions,expectedRise:rise};
    }catch(e){return {pass:false,error:e.message,pos:T.pos(),positions};}
  });
  checks.push({name:'entrance-to-gallery-and-return',pass:traversal.pass,data:traversal});
  console.log('STAIR TRAVERSAL',JSON.stringify(traversal));

  // Step support/guard checks use precisely the game's live collision world and
  // the production player capsule radius .30, height 1.75, stepUp .42.
  const rail=await page.evaluate(()=>{
    const col=window.__game.world.col,x=81.95,z=105.3,results=[];
    for(const i of [3,8,13,18,22]){
      const a=-Math.PI/2+(i+.5)*Math.PI*2.5/26;
      const b={x:x+.78*Math.cos(a),y:.15+(i+1)*3.2/26,z:z+.78*Math.sin(a)};
      col.move(b,.9*Math.cos(a),.9*Math.sin(a),.3,1.75,.42);
      const radial=Math.hypot(b.x-x,b.z-z);
      results.push({step:i,radial});
    }
    const topN={x:82.98,y:3.35,z:105.26};
    const topS={...topN};
    col.move(topN,0,.9,.3,1.75,.42);
    col.move(topS,0,-.9,.3,1.75,.42);
    return {pass:results.every(s=>s.radial<1.00)&&topN.z<105.52&&topS.z>104.99,
      results,topNorth:topN,topSouth:topS};
  });
  checks.push({name:'physical-outer-rail-and-upper-sides',pass:rail.pass,data:rail});
  console.log('STAIR GUARDS',JSON.stringify(rail));
  await context.close();

  const {page:mobile,context:mobileContext}=await open({width:390,height:844},true);
  await shot(mobile,'05-mobile-portrait-stair',[79.95,.15,103.5],[81.95,2.0,105.3],true);
  await mobileContext.close();
}catch(e){errors.push('QA: '+e.stack);console.error(e.stack);}
finally{
  writeFileSync(OUT+'/results.json',JSON.stringify({
    source:'Real candidate game scene (Chromium / SwiftShader); not a real Android device',
    commit:process.env.GITHUB_SHA??null,checks,screens,errors,realAndroidVerified:false
  },null,2));
  await browser.close();await server.close();
}
if(errors.length||checks.some(x=>!x.pass))process.exitCode=1;
