// LIB-STAIR-R06 real-game validation: screenshots + actual player path + guard physics.
// Visual screenshots are from the running Vite scene in Chromium software WebGL, not mockups.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const OUT='docs/lib-stair-r06/review';
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
    ['01-r06-stair-overview',[79.9,.15,103.5],[81.95,2.0,105.3]],
    ['02-r06-top-post-removed',[82.98,3.35,105.24],[82.99,3.95,104.65]],
    ['03-r06-triangle-from-above',[83.15,3.35,105.18],[82.30,3.30,105.07]],
    ['04-r06-landing-from-gallery',[83.65,3.35,105.20],[82.28,3.35,105.17]],
    ['05-r06-right-baluster-foot',[82.87,3.35,105.29],[82.47,3.12,105.01]],
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
    return {pass:results.every(s=>s.radial<1.00)&&topN.z<105.70&&topS.z>104.99,
      results,topNorth:topN,topSouth:topS};
  });
  checks.push({name:'physical-outer-rail-and-upper-sides',pass:rail.pass,data:rail});
  // R02: gallery entry stays open despite side guard and the final stair-to-rail
  // transition physically closes the outside edge near the top two treads.
  const upper=await page.evaluate(()=>{
    const col=window.__game.world.col,results=[];
    const x=81.95,z=105.3,turn=Math.PI*2.5;
    for(const i of [22,23]) {
      const a=-Math.PI/2+(i+.5)*turn/26;
      const p={x:x+.78*Math.cos(a),y:.15+(i+1)*3.2/26,z:z+.78*Math.sin(a)};
      col.move(p,.8*Math.cos(a),.8*Math.sin(a),.30,1.75,.42);
      results.push({step:i,radius:Math.hypot(p.x-x,p.z-z)});
    }
    const opening={x:82.85,y:3.35,z:105.28};
    col.move(opening,.38,0,.3,1.75,.42);
    return {pass:results.every(r=>r.radius<1.00)&&opening.x>83.12,results,opening};
  });
  checks.push({name:'r02-top-two-treads-guarded-gallery-opening-clear',data:upper,pass:upper.pass});
  // R05: one clean north-side guard joining the central newel to the existing
  // gallery corner. There must be NO leftover R03/R04 duplicate rail clusters.
  const refGuard=await page.evaluate(()=>{
    const col=window.__game.world.col;
    const rail=col.colliders.filter(c=>c.tag==='lib-stair.r05-simple-north-guard');
    const legacy=col.colliders.filter(c=>c.tag?.startsWith('lib-stair.r03')||
      c.tag==='lib-stair.r04-post-closure');
    const midpoint={x:82.295,z:105.645,y:3.35};
    const guarded=col.overlaps(midpoint.x,midpoint.z,midpoint.y,.22,1.75,.42);
    const free={x:82.85,z:105.24,y:3.35};
    col.move(free,.53,0,.30,1.75,.42);
    const reachesNewel=rail.some(c=>c.minX<81.99&&c.minZ<105.34);
    const reachesGallery=rail.some(c=>c.maxX>82.59&&c.maxZ>105.94);
    const galleryHeight=rail.every(c=>c.minY>=3.35&&c.maxY<=4.50);
    return {pass:rail.length===6&&legacy.length===0&&reachesNewel&&
      reachesGallery&&galleryHeight&&guarded&&free.x>83.17,
      railSections:rail.length,legacySections:legacy.length,
      reachesNewel,reachesGallery,galleryHeight,guarded,free};
  });
  checks.push({name:'r05-reference-single-rail-post-to-gallery-with-open-exit',
    pass:refGuard.pass,data:refGuard});
  // R06: the yellow-marked triangle now offers real collision-floor support
  // only at gallery height; the staircase below must not snap upward.
  const triangle=await page.evaluate(()=>{
    const col=window.__game.world.col;
    const x=(81.95+82.64+82.64)/3,z=(105.3+105.3+104.66)/3;
    const top=col.supportHeight(x,z,3.35,.42);
    const below=col.supportHeight(x,z,1.6,.42);
    const exit={x:82.93,y:3.35,z:105.25};
    col.move(exit,.45,0,.30,1.75,.42);
    return {pass:Math.abs(top-3.35)<.01 && below<2.1 && exit.x>83.15,
      centroid:{x,z},top,below,exit};
  });
  checks.push({name:'r06-triangular-floor-walkable-no-phantom-low-floor',pass:triangle.pass,data:triangle});
  console.log('STAIR R06 TRIANGLE',JSON.stringify(triangle));
  console.log('STAIR R05 REFERENCE GUARD',JSON.stringify(refGuard));
  console.log('STAIR GUARDS',JSON.stringify(rail));
  await context.close();

  const {page:mobile,context:mobileContext}=await open({width:390,height:844},true);
  await shot(mobile,'05-mobile-portrait-stair',[79.95,.15,103.5],[81.95,2.0,105.3],true);
  await shot(mobile,'06-r06-mobile-top',[83.18,3.35,105.23],[82.18,3.26,105.07],true);
  await shot(mobile,'07-r06-mobile-south-post',[83.18,3.35,105.23],[83.15,3.65,104.60],true);
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
