// Reproduce missing visual evidence only. Retain earlier telemetry unchanged.
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {cameras} from './vfc01-cameras.mjs';

const task=process.argv[2]??'selected';
const root='docs/vfc01',read=p=>JSON.parse(fs.readFileSync(`${root}/${p}`,'utf8'));
const sourceRevision=execFileSync('git',['rev-parse',process.env.VFC_SOURCE_REV||'HEAD'],{encoding:'utf8'}).trim();
const sourceTree=execFileSync('git',['rev-parse',sourceRevision+':src/vfc01'],{encoding:'utf8'}).trim();
const ledgerPath=`${root}/RECOVERY_CAPTURES.json`;
const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):{generation:'Recovery reproduction; original files unavailable',timingPolicy:'Earlier measurements remain unchanged. These are image/sequence reproductions, not new timing benchmarks.',captures:[]};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vfc01-recovery-'));
const historicalSource={name:'vfc01-committed-capture-source',enforce:'pre',load(id){const clean=id.split('?')[0],rel=path.relative(process.cwd(),clean).replaceAll(path.sep,'/');if(process.env.VFC_SOURCE_REV&&/^src\/vfc01\/[^/]+\.(ts|css)$/.test(rel))return execFileSync('git',['show',sourceRevision+':'+rel],{encoding:'utf8'});}};
const server=await createServer({plugins:[historicalSource],logLevel:'error',server:{host:'127.0.0.1',port:4199,strictPort:true}});
let browser,page;
const errors=[];
function saveLedger(){fs.writeFileSync(ledgerPath+'.tmp',JSON.stringify(ledger,null,2)+'\n');fs.renameSync(ledgerPath+'.tmp',ledgerPath);}
function record(file,row,observed,params,extra={}){
 const keys=['cameraCalls','cameraTriangles','sourceTriangles','textureBytes','dpr'];
 const differences=Object.fromEntries(keys.filter(k=>row[k]!==undefined&&row[k]!==observed[k]).map(k=>[k,{prior:row[k],now:observed[k]}]));
 const entry={path:file,sourceRevision,sourceTree,capturedAt:new Date().toISOString(),params,camera:row.camera,pose:row.pose,method:'Original placement/light warm-up; eight extra static renders without timing fences (no animation ticks); viewport 915×412, FOV 70; lossless WebP from CSS screenshot. SwiftShader; not physical-phone evidence.',observed:Object.fromEntries(keys.map(k=>[k,observed[k]])),differences,...extra};
 ledger.captures=ledger.captures.filter(x=>x.path!==file);ledger.captures.push(entry);saveLedger();
 if(Object.keys(differences).length&&!extra.sequenceIndex&&!extra.allowDifferences)throw new Error(`Count/configuration mismatch for ${file}: ${JSON.stringify(differences)}`);
 console.log('captured',file);
}
async function load(params){console.log('loading',JSON.stringify(params));await page.goto('http://127.0.0.1:4199/Feh-Lu-We/vfc01.html?'+new URLSearchParams({auto:'1',...params}),{timeout:90000});await page.waitForFunction(()=>window.__vfc?.ready,null,{timeout:180000});await page.evaluate(()=>{for(const id of ['hud','vfc-bar','stick','zone-move','zone-look']){const e=document.getElementById(id);if(e)e.style.display='none';}});console.log('ready',JSON.stringify(params));}
async function place(row,warm=false){return page.evaluate(({row,warm})=>{const v=window.__vfc;let s=row.pose?v.placePose(row.pose):v.place(row.camera);if(warm){for(let i=0;i<8;i++)v.render();s=v.stats();}return {cameraCalls:s.cameraCalls,cameraTriangles:s.cameraTriangles,sourceTriangles:s.sourceTriangles,textureBytes:s.textureBytes,dpr:s.dpr};},{row,warm});}
async function shot(file){const out=`${root}/${file}`;fs.mkdirSync(path.dirname(out),{recursive:true});const png=path.join(tmp,'frame.png');await page.screenshot({path:png,timeout:60000});execFileSync('python3',['-c','from PIL import Image;import sys,os;im=Image.open(sys.argv[1]);im.save(sys.argv[2]+".tmp",format="WEBP",lossless=True,method=4,exact=True);assert im.tobytes()==Image.open(sys.argv[2]+".tmp").tobytes();os.replace(sys.argv[2]+".tmp",sys.argv[2])',png,out],{timeout:60000});}
try{
 await server.listen();browser=await chromium.launch({executablePath:process.env.VFC_BROWSER_PATH||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],timeout:25000});
 page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(String(e)));
 if(task==='selected'){
  const data=read('compare/selected.json');let active='';
  for(const row of data.rows.filter(r=>data.rows.some(x=>x.label===r.label&&!fs.existsSync(`${root}/${x.image}`)))){if(active!==row.label){await load(row.params);active=row.label;}
   const withPose={...row,pose:row.camera==='cottage-front'?data.frontPose:undefined};if(fs.existsSync(`${root}/${row.image}`)){await place(withPose);continue;}const observed=await place(withPose,true);await shot(row.image);record(row.image,withPose,observed,row.params);
  }
 }else if(task==='matrix'){
  const matrix=read('compare/matrix.json').rows;let active='';for(const row of matrix.filter(r=>matrix.some(x=>x.variant===r.variant&&x.mode===r.mode&&!fs.existsSync(`${root}/${x.image}`)))){const key=row.variant+'-'+row.mode;
   const params={v:row.variant,mode:row.mode};if(active!==key){await load(params);active=key;}if(fs.existsSync(`${root}/${row.image}`)){await place(row);continue;}const observed=await place(row);await shot(row.image);record(row.image,row,observed,params);
  }
 }else if(task==='sweeps'){
  let active='';for(const row of read('compare/sweeps.json').rows){if(!row.image||fs.existsSync(`${root}/${row.image}`))continue;
   const params=row.kind==='dpr'?{v:'V3',dpr:String(row.value)}:{v:'V3',...row.params};const key=JSON.stringify(params);if(active!==key){await load(params);active=key;}
   const observed=await place(row,true);await shot(row.image);record(row.image,row,observed,params,{comparability:'Captured from unchanged final VFC source. Historical broad controls used 62e6ab7 before final corrections; VFC_SOURCE_REV can serve those exact committed modules without editing source. Timings are not attached to this reproduction.'});
  }
 }else if(task==='ktx'){
  await load({v:'V3'});
  for(const row of read('compare/ktx.json').rows){const file=`compare/ktx-${row.kind}-${row.camera}.webp`;if(fs.existsSync(`${root}/${file}`))continue;await place(row);const observed=await page.evaluate(async k=>{const s=await window.__vfc.ktx(k);return {cameraCalls:s.cameraCalls,cameraTriangles:s.cameraTriangles,sourceTriangles:s.sourceTriangles,textureBytes:s.textureBytes,dpr:s.dpr};},row.kind);await shot(file);record(file,row,observed,{v:'V3',ktx:row.kind},{comparability:'Existing recovered ETC1S and decoded WebP assets retained; original load timings are unchanged.'});}
 }else if(task==='video'){
  const [variant,kind]=process.argv[3]?.split(':')??[];if(!['V3','V4'].includes(variant)||!['vegetation','hero','architecture','small'].includes(kind))throw new Error('video requires V3:vegetation (or another documented pair)');
  const rows=read('combined-lod/sequences.json').rows.filter(r=>r.variant===variant&&r.kind===kind).sort((a,b)=>a.index-b.index);if(!rows.length)throw new Error('No recorded sequence');
  const params={v:variant,lodtest:'1','hero-test':'1'};await load(params);const keyframes=new Set([0,Math.floor(rows.length/2),rows.length-1]),observations=[];
  const allSteps=read('combined-lod/sequences.json').rows.filter(r=>r.variant===variant);if(kind!=='small'){for(const row of allSteps){if(row.kind===kind)break;await place(row);}}
  for(const row of rows){const observed=await place(row);const png=path.join(tmp,`${String(row.index).padStart(3,'0')}.png`);await page.screenshot({path:png,timeout:60000});
   const keys=['cameraCalls','cameraTriangles'];const dif=keys.filter(k=>row[k]!==observed[k]);observations.push({index:row.index,observed,prior:{cameraCalls:row.cameraCalls,cameraTriangles:row.cameraTriangles},differingFields:dif});if(dif.length)console.log('sequence difference',row.index,dif.map(k=>[k,row[k],observed[k]]));
   if(keyframes.has(row.index)){const file=`combined-lod/${variant}-${kind}-${row.index}.webp`;if(!fs.existsSync(`${root}/${file}`)){await shot(file);record(file,row,observed,params,{sequenceIndex:row.index,allowDifferences:true,comparability:'Exact recorded deterministic pose; final unchanged VFC source. Previous broad LOD run may predate final draw-order corrections.'});}}
  }
  const file=`combined-lod/${variant}-${kind}.mp4`;execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','4','-i',path.join(tmp,'%03d.png'),'-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-threads','2','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',`${root}/${file}`],{timeout:120000});
  execFileSync('ffmpeg',['-v','error','-i',`${root}/${file}`,'-f','null','-'],{timeout:60000});ledger.captures.push({path:file,sourceRevision,sourceTree,capturedAt:new Date().toISOString(),params,steps:rows.map(r=>({index:r.index,pose:r.pose,distance:r.distance})),observations,method:'Exact recorded sequence order and poses, 4 presentation fps; 915×412 content padded to 916×412. New recovery capture, not original video or gameplay FPS.'});saveLedger();console.log('captured',file);
 }else throw new Error(`Unknown task ${task}`);
 if(errors.length)throw new Error(errors.join('\n'));
}finally{if(browser)await browser.close();await server.close();}
