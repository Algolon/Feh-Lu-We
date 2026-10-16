// ART-R04: reproduce the WebGL2 immutable-storage regression on a REAL renderer.
// Hold the actual atlas network response so the 4x4 fallback is ALLOCATED on the GPU first.
// Releasing it must produce a different Texture instance with a colourful GPU image.
import { chromium } from 'playwright-core';

const BASE=process.argv[2]??'http://127.0.0.1:4188/Feh-Lu-We/';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const cases=[
  {name:'full',query:'?autotest=1&artdiag=1',size:[2048,960]},
  {name:'compact',query:'?autotest=1&artdiag=1&artmode=compact',size:[1024,480]},
];
try{
for(const spec of cases) {
 const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+spec.query,{waitUntil:'domcontentloaded',timeout:45000});
 await page.evaluate(()=>localStorage.setItem('fehluwe.save',JSON.stringify({
   version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
   flags:{leftHome:true},unlocked:[],open:{}
 })));
 await page.reload({waitUntil:'domcontentloaded'});
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 let observed=0;
 await page.route('**/flw-d2-atlas*.webp*',async route=>{
   observed++;
   await gate;
   await route.continue();
 });
 try{
  await page.click('[data-cont]',{timeout:45000});
  await page.waitForFunction(()=>window.__game?.world?.id==='estate',null,{timeout:120000});
  const placeholder=await page.evaluate(()=>{
    const g=window.__game;
    let mat;
    g.world.scene.traverse(o=>{if(o.material?.userData?.flwAtlas)mat=o.material;});
    if(!mat)throw Error('No painting material in the built estate');
    if(mat.map.image.width!==4 || mat.map.image.height!==4)
      throw Error('Atlas arrived before 4px fallback validation');
    g.renderer.initTexture(mat.map); // force 4x4 immutable GPU storage before the real image arrives
    const status={uuid:mat.map.uuid,size:[mat.map.image.width,mat.map.image.height],
      textureVersion:mat.map.version,glError:g.renderer.getContext().getError()};
    window.__artOldTextureUUID=mat.map.uuid;
    return status;
  });
  if(placeholder.glError!==0)throw Error('GL error during forced placeholder texture allocation');
  release();
  await page.waitForFunction(expected=>{
    let mat; window.__game.world.scene.traverse(o=>{if(o.material?.userData?.flwAtlas)mat=o.material;});
    if(!mat||mat.userData.flwAtlasLoad?.state!=='ready')return false;
    const img=mat.map?.image;
    return mat.map.uuid!==window.__artOldTextureUUID
      && (img?.naturalWidth??img?.width)===expected[0]
      && (img?.naturalHeight??img?.height)===expected[1];
  },spec.size,{timeout:35000});
  await page.evaluate(()=>document.querySelector('#flw-art-diagnostics button').click());
  const diag=JSON.parse(await page.locator('#flw-art-diag-output').textContent());
  if(diag.cpu?.std<8||diag.gpu?.stats?.std<8||diag.gpu?.stats?.contrast<30||diag.gpu?.glError!==0)
   throw Error('Atlas not correctly sampled on GPU: '+JSON.stringify(diag));
  if(!observed)throw Error('Atlas request was not intercepted');
  if(errors.length)throw Error('Page errors: '+errors.join('; '));
  console.log('ART_GPU_REALLOCATION_PASS '+JSON.stringify({
   case:spec.name,placeholder,realSize:diag.image,textureVersion:diag.textureVersion,
   cpu:diag.cpu,gpu:diag.gpu,requests:observed
  }));
 }finally{
  release?.();
  await page.close();
 }
}
}finally{await browser.close();}
