import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:4196,strictPort:true}});await server.listen();
const browser=await chromium.launch({executablePath:process.env.VFC_BROWSER_PATH||undefined});const errors=[],checks=[];
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4196/Feh-Lu-We/docs/vfc01/index.html');
 for(const variant of ['selected-equal','selected-crisp','V1','V2','V3','V4']){
  await page.selectOption('#case',variant);const cameras=await page.locator('#camera option').evaluateAll(xs=>xs.map(x=>x.value));
  for(const camera of cameras){await page.selectOption('#camera',camera);
   for(const mode of variant.startsWith('selected')?['colour']:['colour','clay','neutral']){if(!variant.startsWith('selected'))await page.selectOption('#mode',mode);await page.waitForFunction(()=>['before','after'].every(id=>{const im=document.getElementById(id);return im.complete&&im.naturalWidth===915&&im.naturalHeight===412}));checks.push({variant,camera,mode,ok:true});}
  }
 }
 await page.selectOption('#case','selected-equal');await page.selectOption('#camera','cottage-front');
 const links=await page.locator('a[href],video source[src]').evaluateAll(xs=>[...new Set(xs.map(x=>x.href||x.src))]);
 for(const url of links){const response=await page.request.get(url);if(!response.ok())throw new Error(`${response.status()} ${url}`);}
 await page.screenshot({path:path.join(os.tmpdir(),'vfc-gallery-qa.png'),fullPage:false});
 fs.writeFileSync('docs/vfc01/validation/gallery.json',JSON.stringify({checks,linksVerified:links.length,errors,videoValidation:'HTTP availability here; ffprobe and full decode in package.py. Headless browser H264 playback is not asserted.'},null,2));
 if(errors.length)throw new Error(errors.join('\n'));console.log(`${checks.length} matched comparisons, ${links.length} links, no page errors`);
}finally{await browser.close();await server.close();}
