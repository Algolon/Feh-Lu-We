// Opt-in, read-only diagnostic for real phone GPUs: ?artdiag=1.
// Exposes only atlas/render capabilities, never save data or personal information.
import * as THREE from 'three';
import type { Game } from './game';

function stats(data: Uint8Array | Uint8ClampedArray) {
  let sum=0, sum2=0, n=0, min=255, max=0;
  for(let i=0;i<data.length;i+=4) {
    const v=data[i]*.299+data[i+1]*.587+data[i+2]*.114;
    n++;sum+=v;sum2+=v*v;min=Math.min(min,v);max=Math.max(max,v);
  }
  return {mean:Math.round(sum/n*100)/100,contrast:Math.round((max-min)*100)/100,std:Math.round(Math.sqrt(Math.max(0,sum2/n-(sum/n)**2))*100)/100};
}

function gpuSample(renderer: THREE.WebGLRenderer, texture: THREE.Texture) {
  const target=new THREE.WebGLRenderTarget(64,32,{depthBuffer:false,stencilBuffer:false});
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0.1,10);
  camera.position.z=2;
  const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});
  const geometry=new THREE.PlaneGeometry(2,2);
  scene.add(new THREE.Mesh(geometry,material));
  const previous=renderer.getRenderTarget();
  try {
    renderer.setRenderTarget(target);
    renderer.render(scene,camera);
    const pixels=new Uint8Array(64*32*4);
    renderer.readRenderTargetPixels(target,0,0,64,32,pixels);
    return {stats:stats(pixels),glError:renderer.getContext().getError()};
  } finally {
    renderer.setRenderTarget(previous);
    geometry.dispose();
    material.dispose();
    target.dispose();
  }
}

export function installArtDiagnostics(game: Game) {
  if(new URLSearchParams(location.search).get('artdiag')!=='1')return;
  const host=document.createElement('section');
  host.id='flw-art-diagnostics';
  host.setAttribute('aria-label','Schilderijdiagnose');
  host.style.cssText='position:fixed;left:8px;top:8px;z-index:2147483647;width:min(370px,calc(100vw - 16px));max-height:49vh;overflow:auto;background:rgba(18,24,27,.96);color:#f8f0dd;padding:10px;border:1px solid #c99b61;border-radius:8px;box-shadow:0 3px 12px #0009;font:12px/1.35 monospace;box-sizing:border-box';
  const title=document.createElement('div');
  title.textContent='FLW · schilderijdiagnose (alleen testmodus)';
  title.style.cssText='font-weight:700;margin-bottom:5px';
  const label=document.createElement('pre');
  label.id='flw-art-diag-output';
  label.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0 8px';
  const controls=document.createElement('div');
  controls.style.cssText='display:flex;gap:6px;flex-wrap:wrap';
  const update=document.createElement('button'),copy=document.createElement('button'),collapse=document.createElement('button');
  for(const b of [update,copy,collapse])b.style.cssText='background:#c99b61;color:#211e1a;border:0;padding:7px;border-radius:4px;font:inherit;cursor:pointer';
  update.textContent='Meet GPU';copy.textContent='Kopieer';collapse.textContent='Inklappen';
  controls.append(update,copy,collapse);host.append(title,label,controls);document.body.append(host);
  let last: Record<string,unknown>={message:'Spel starten om atlasgegevens te meten'};
  let lastGpu: ReturnType<typeof gpuSample> | string = 'Druk op Meet GPU';
  const collect=(gpu:boolean)=>{
    const gl=game.renderer.getContext();
    const materials=new Set<THREE.Material>();
    game.world?.scene.traverse(o=>{
      const m=(o as THREE.Mesh).material;
      if(!m)return;
      for(const mat of (Array.isArray(m)?m:[m]))
        if(mat?.userData?.flwAtlas)materials.add(mat);
    });
    const mat=[...materials][0] as THREE.MeshLambertMaterial | undefined;
    const image=mat?.map?.image as HTMLImageElement | HTMLCanvasElement | undefined;
    const width=image instanceof HTMLImageElement?image.naturalWidth:image?.width??0;
    const height=image instanceof HTMLImageElement?image.naturalHeight:image?.height??0;
    let cpu:ReturnType<typeof stats>|string='niet geladen';
    if(image && width>4 && height>4) {
      try {
        const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        if(ctx){ctx.drawImage(image,0,0,64,32);cpu=stats(ctx.getImageData(0,0,64,32).data);}
        else cpu='2D canvas niet beschikbaar';
      }catch(e){cpu='CPU-fout: '+String(e);}
      if(gpu&&mat?.map){
        try{lastGpu=gpuSample(game.renderer,mat.map);}
        catch(e){lastGpu='GPU-fout: '+String(e);}
      }
    }
    last={
      build:document.querySelector('meta[name="flw-build"]')?.getAttribute('content')??'zie GitHub release',
      mode:new URLSearchParams(location.search).get('artmode')??'full',
      scene:game.world?.id??'nog niet gestart',
      status:mat?.userData?.flwAtlasLoad??'nog niet aangemaakt',
      image:[width,height],textureVersion:mat?.map?.version??null,
      webgl2:game.renderer.capabilities.isWebGL2,
      maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),
      quality:game.settings.quality,
      dpr:game.renderer.getPixelRatio(),
      cpu,gpu:lastGpu
    };
    label.textContent=JSON.stringify(last,null,2);
  };
  update.onclick=()=>collect(true);
  copy.onclick=()=>{
    const content=JSON.stringify(last,null,2);
    void navigator.clipboard?.writeText(content).then(()=>{copy.textContent='Gekopieerd';}).catch(()=>{copy.textContent='Maak screenshot';});
  };
  collapse.onclick=()=>{
    const hidden=label.style.display!=='none';
    label.style.display=hidden?'none':'block';
    update.style.display=hidden?'none':'';
    copy.style.display=hidden?'none':'';
    collapse.textContent=hidden?'Uitklappen':'Inklappen';
  };
  collect(false);
  window.setInterval(()=>{if(label.style.display!=='none')collect(false)},2500);
}
