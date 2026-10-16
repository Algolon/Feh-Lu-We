// Compare exact fixed camera poses against pre-change mainline; software WebGL only.
// Run with BASE=http://127.0.0.1:4175/Feh-Lu-We/ from the candidate checkout.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:4175/Feh-Lu-We/';
const OUT = 'docs/development/workstreams/portal-r01/review';
mkdirSync(OUT, { recursive: true });
const same = JSON.parse(readFileSync(OUT + '/results.json', 'utf8')).results.filter(r => r.screenshot);
const poses = [
 { x: 90.8, y: 0.15, z: 96.55, yaw: Math.PI/2, pitch: 0.02 },
 { x: 98.0, y: 0.15, z: 96.55, yaw: -Math.PI/2, pitch: 0.02 },
 { x: 101.3, y: 0.15, z: 96.1, yaw: -2.30, pitch: -0.04 },
 { x: 99.0, y: 0.15, z: 101.1, yaw: -Math.PI/2, pitch: -0.01 }
];
const browser = await chromium.launch({
  executablePath: process.env.CHROME || chromium.executablePath(),
  headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']
});
try {
 const page = await browser.newPage({viewport:{width:1050,height:655}});
 await page.goto(BASE + '?autotest=1');
 await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({
  version: 4, scene: 'estate', inventory: ['invitation','torch','matches','notebook','frontKey'],
  flags:{leftHome:true}, unlocked:['lock.door.front'], open:{'door.front':true}
 })));
 await page.reload();
 await page.click('[data-cont]');
 await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, {timeout:150000});
 const rows=[];
 for(let i=0;i<poses.length;i++){
  const data=await page.evaluate(p=>{
   const g=window.__game;
   g.player.setPose(p);
   g.player.y=g.world.col.supportHeight(p.x,p.z,p.y+0.05,0.42);
   for(let k=0;k<60;k++)g.tick(1/30);
   g.renderer.render(g.world.scene,g.camera);
   return {room:g.world.hereRoom,calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles};
  },poses[i]);
  rows.push({view:same[i].screenshot,baseline:data,candidate:{calls:same[i].calls,triangles:same[i].triangles},
   delta:{calls:same[i].calls-data.calls,triangles:same[i].triangles-data.triangles}});
  console.log('COMPARE', JSON.stringify(rows[i]));
 }
 writeFileSync(OUT+'/baseline-comparison.json',JSON.stringify({
  baseline:'6c52b770705389db4aa14e923123e6d569b58488',candidate:'portal-r01',renderer:'Chromium software WebGL',rows
 },null,2));
 await page.close();
}finally{await browser.close();}
