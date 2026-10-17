// LIGHT-R08 portable Android hardware capture — INCLUDED IN REVIEW ZIP ONLY.
// Only activates on ?r08Device=1. No remote requests, tracking, analytics or upload.
// Install in packaged preview/index.html; requires user to run the game on their
// *physical* phone. FPS/frame-duration is real browser performance; GPU ms,
// temperature and wattage CANNOT be inferred from this timer alone.
(() => {
 if(!new URLSearchParams(location.search).has('r08Device'))return;
 const node=document.createElement('section');
 node.setAttribute('aria-label','LIGHT-R08 fysieke toestelmeting');
 node.style.cssText='position:fixed;right:8px;bottom:8px;z-index:99999;max-width:260px;'+
   'background:#172024ea;color:white;padding:10px;border:1px solid #bd9563;'+
   'border-radius:9px;font:12px/1.5 system-ui;box-shadow:0 4px 12px #0006;';
 node.innerHTML=`<strong>LIGHT-R08 · Android</strong>
 <div style="opacity:.8">Meet 60 seconden terwijl je de route loopt.</div>
 <label>Route
 <select id="r08-route" style="width:100%;color:#172024;padding:3px">
  <option>Hall → woonkamer → hall</option>
  <option>Woonkamer · stilstaan + 360°</option>
  <option>Bibliotheekdeur dicht/open</option>
  <option>Langdurig rondlopen</option>
 </select></label>
 <div style="display:flex;gap:5px;margin-top:5px">
  <button id="r08-start" type="button">Start 60 s</button>
  <button id="r08-stop" type="button" disabled>Stop + JSON</button>
 </div><div id="r08-status" aria-live="polite">Gereed voor meting</div>`;
 document.body.appendChild(node);
 const startButton=node.querySelector('#r08-start');
 const stopButton=node.querySelector('#r08-stop');
 const label=node.querySelector('#r08-route');
 const status=node.querySelector('#r08-status');
 for(const b of [startButton,stopButton])
  b.style.cssText='background:#e6c79a;color:#172024;border:0;padding:5px;border-radius:4px;font-weight:bold;';
 let run=null;
 const pct=(array,p)=>{if(!array.length)return null;const xs=[...array].sort((a,b)=>a-b);
   return +xs[Math.min(xs.length-1,Math.floor((xs.length-1)*p))].toFixed(2);};
 const round=(x)=>+x.toFixed(2);
 const submit=()=>{
  if(!run)return;
  const current=run;run=null;
  startButton.disabled=false;stopButton.disabled=true;
  const g=window.__game;
  const d=current.frames.filter(v=>Number.isFinite(v)&&v>0&&v<5000);
  const out={
   test:'LIGHT-R08 physical-device frame-time capture',
   hardwareVerified:false,
   touchPointerObserved:matchMedia('(pointer:coarse)').matches,
   caveat:'This JSON alone cannot verify a physical device: record actual hardware/model outside the test. rAF timing is browser frame pacing, NOT exclusive GPU time or thermal wattage.',
   created:new Date().toISOString(),elapsedSeconds:round((performance.now()-current.start)/1000),
   URL:location.pathname+location.search,
   device:{userAgent:navigator.userAgent,dpr:devicePixelRatio,
    viewport:[innerWidth,innerHeight],hardwareConcurrency:navigator.hardwareConcurrency,
    deviceMemory:navigator.deviceMemory??null},
   scenario:current.scenario,
   game:{quality:g?.settings?.quality??'unknown',
    sourceWeights:g?.world?.scene?.userData?.stableLiving?.state?.()??null},
   metrics:{sampledFrames:d.length,meanFps:d.length?round(1000/(d.reduce((s,v)=>s+v,0)/d.length)):null,
    medianFrameMs:pct(d,.5),p95FrameMs:pct(d,.95),p99FrameMs:pct(d,.99),
    over33MsPct:d.length?round(100*d.filter(v=>v>33.34).length/d.length):null},
   viewSamples:current.samples
  };
  status.textContent=`Klaar: ${out.metrics.meanFps??'?'} FPS gemiddeld`;
  const objectUrl=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=objectUrl;
  link.download='light-r08-'+(g?.settings?.quality??'quality')+'-'+Date.now()+'.json';
  link.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
 };
 const frame=(time)=>{
  if(!run)return;
  if(run.previous)run.frames.push(time-run.previous);
  run.previous=time;
  if(time-run.lastSample>=1000){
   const g=window.__game;
   const info=g?.renderer?.info;
   run.samples.push({second:round((time-run.start)/1000),
     room:g?.world?.hereRoom??null,
     calls:info?.render?.calls??null,triangles:info?.render?.triangles??null,
     shaders:info?.programs?.length??null,
     materials:g?.world?.scene?.userData?.stableScope?.createdMaterialClones??0});
   run.lastSample=time;
   status.textContent=`${Math.min(60,Math.floor((time-run.start)/1000))}/60 s · ${run.samples.at(-1).calls??'?'} calls`;
  }
  if(time-run.start>=60000){submit();return;}
  requestAnimationFrame(frame);
 };
 startButton.addEventListener('click',()=>{
  if(run)return;
  if(!window.__game?.world){status.textContent='Start eerst de game';return;}
  run={start:performance.now(),previous:0,lastSample:performance.now(),frames:[],samples:[],scenario:label.value};
  startButton.disabled=true;stopButton.disabled=false;
  requestAnimationFrame(frame);
 });
 stopButton.addEventListener('click',submit);
})();
