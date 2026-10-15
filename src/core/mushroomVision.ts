import * as T from 'three';
/** One camera-only pass. Scene lights/fog/time remain owned by the environment.
 * No render target or extra draw outside the field. Depth fog preserves nearby path silhouettes.
 * No history buffer: trails deliberately omitted for mobile cost/readability. */
export class MushroomVision {
  intensity=0;
  private target:T.WebGLRenderTarget|null=null;
  private size=new T.Vector2();
  private scene=new T.Scene();
  private camera=new T.Camera();
  private uniforms={image:{value:null as T.Texture|null},depth:{value:null as T.Texture|null},amount:{value:0},clock:{value:0},motion:{value:1},high:{value:0},distort:{value:1},near:{value:.08},far:{value:450},pixel:{value:new T.Vector2()}};
  private material=new T.ShaderMaterial({uniforms:this.uniforms,depthTest:false,depthWrite:false,toneMapped:true,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`
    precision highp float;
    uniform sampler2D image,depth;uniform float amount,clock,motion,high,distort,near,far;uniform vec2 pixel;varying vec2 vUv;
    float distanceAt(vec2 uv){float z=texture2D(depth,uv).r;return near*far/(far-z*(far-near));}
    vec3 hueRotate(vec3 color,float angle){vec3 axis=vec3(.57735027);float c=cos(angle),s=sin(angle);return max(vec3(0.),color*c+cross(axis,color)*s+axis*dot(axis,color)*(1.-c));}
    void main(){
      vec2 uv=vUv,centre=uv-.5;float edge=dot(centre,centre);
      float breathing=clock*.43;
      float lens=amount*motion*distort,angle=sin(clock*.31)*.045*lens;
      centre=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*centre;
      uv=.5+centre*(1.+sin(clock*.38)*.035*lens);
      vec2 wave=vec2(sin(uv.y*15.+breathing)+sin(uv.y*7.-breathing*.7),cos(uv.x*12.-breathing));
      uv=clamp(uv+wave*.0135*amount*motion*distort,vec2(.002),vec2(.998));
      vec2 ca=centre*.024*amount*distort;
      vec3 base=texture2D(image,uv).rgb;
      vec3 col=vec3(texture2D(image,clamp(uv+ca,vec2(0.),vec2(1.))).r,base.g,texture2D(image,clamp(uv-ca,vec2(0.),vec2(1.))).b);
      float d=distanceAt(uv);
      float fog=(1.-exp(-max(0.,d-3.)*(.078+sin(clock*.12)*.006*motion)))*amount*.94;
      vec3 mist=mix(vec3(.022,.065,.079),vec3(.079,.043,.105),.5+.35*sin(uv.y*5.+clock*.09*motion));
      // Low frequency colour drift; no flashing or luminance oscillation.
      vec3 tint=vec3(.80+.06*sin(clock*.16*motion),.89+.07*sin(clock*.11*motion+2.),1.08);
      col=mix(col,col*tint,amount*.75);
      vec3 spectral=hueRotate(col,.72*sin(clock*.24*motion)+.24*sin(uv.y*5.-clock*.18*motion));
      float luminance=dot(spectral,vec3(.2126,.7152,.0722));
      spectral=max(vec3(0.),mix(vec3(luminance),spectral,1.45));
      col=mix(col,spectral,amount*.85);
      col*=1.-amount*.37;
      col=mix(col,mist,fog);
      // Single-pass highlight diffusion: 4 taps on low, 8 on high; no full bloom pyramid.
      vec3 glow=vec3(0.);vec2 stepUV=pixel*(7.+high*5.);
      glow+=max(texture2D(image,clamp(uv+vec2(stepUV.x,0.),vec2(0.),vec2(1.))).rgb-.50,0.);
      glow+=max(texture2D(image,clamp(uv-vec2(stepUV.x,0.),vec2(0.),vec2(1.))).rgb-.50,0.);
      glow+=max(texture2D(image,clamp(uv+vec2(0.,stepUV.y),vec2(0.),vec2(1.))).rgb-.50,0.);
      glow+=max(texture2D(image,clamp(uv-vec2(0.,stepUV.y),vec2(0.),vec2(1.))).rgb-.50,0.);
      if(high>.5){for(int i=0;i<4;i++){vec2 off=vec2(i<2?-1.:1.,mod(float(i),2.)<.5?-1.:1.);glow+=max(texture2D(image,clamp(uv+off*stepUV,vec2(0.),vec2(1.))).rgb-.50,0.);}}
      col+=glow*amount*.42/(1.+high);
      col=mix(col,col*vec3(.70,.60,.86)+vec3(.013,.002,.024),smoothstep(.13,.47,edge)*amount*.55);
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  constructor(){const m=new T.Mesh(new T.PlaneGeometry(2,2),this.material);m.frustumCulled=false;this.scene.add(m);}
  reset(){this.target?.dispose();this.target=null;this.intensity=0;}
  render(renderer:T.WebGLRenderer,scene:T.Scene,camera:T.PerspectiveCamera,time:number,reduced:boolean,distortion:boolean,high:boolean){
    if(this.intensity===0){renderer.render(scene,camera);return;}
    renderer.getDrawingBufferSize(this.size);
    // Low quality renders the pass at 80% linear resolution, bounded by existing device DPR.
    const scale=high?1:.8,w=Math.max(1,Math.floor(this.size.x*scale)),h=Math.max(1,Math.floor(this.size.y*scale));
    if(!this.target){this.target=new T.WebGLRenderTarget(w,h,{depthBuffer:true});this.target.depthTexture=new T.DepthTexture(w,h,T.UnsignedIntType);}
    if(this.target.width!==w||this.target.height!==h)this.target.setSize(w,h);
    const u=this.uniforms;u.image.value=this.target.texture;u.depth.value=this.target.depthTexture!;u.amount.value=this.intensity;u.clock.value=reduced?0:time;u.motion.value=reduced?0:1;u.distort.value=distortion&&!reduced?1:0;u.high.value=high?1:0;u.near.value=camera.near;u.far.value=camera.far;u.pixel.value.set(1/w,1/h);
    // Preserve aggregate metrics across the scene and fullscreen draw.
    const auto=renderer.info.autoReset;renderer.info.autoReset=false;renderer.info.reset();
    const previous=renderer.getRenderTarget();
    try{renderer.setRenderTarget(this.target);renderer.render(scene,camera);renderer.setRenderTarget(previous);renderer.render(this.scene,this.camera);}
    finally{renderer.setRenderTarget(previous);renderer.info.autoReset=auto;}
  }
}
