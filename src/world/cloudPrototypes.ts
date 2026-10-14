// SKY-C01 review candidates. Original authored profiles; no third-party pixels.
// Shared placement/compositing makes the procedural vs mask comparison meaningful.
import { SKY_FRAGMENT } from './skyShader';
export type CloudVariant = 'production' | 'procedural' | 'masks';
export const CLOUD_VARIANTS: readonly CloudVariant[] = ['production', 'procedural', 'masks'];
export const CLOUD_LAYOUT = [
  // azimuth, elevation, tangent half-width, horizontal aspect, in-plane angle, shape identity
  [15, 28, .40, 1.12, -.035, 0], [66, 42, .31, .95, .055, 1],
  [116, 24, .49, 1.18, -.025, 2], [166, 35, .34, .91, .04, 3],
  [215, 23, .42, 1.08, -.05, 4], [268, 49, .36, 1.02, .035, 5],
  [309, 27, .29, 1.06, -.06, 6], [350, 55, .25, .93, .065, 7],
] as const;
const f = (v: number) => v.toFixed(7);
// Four unequal shoulders, each (x, height, width); not a repeated seven-sphere construction.
const shoulders = [
  [-.55,.18,.34, -.13,.42,.28, .40,.19,.45, .72,.07,.20],
  [-.60,.08,.25, -.23,.22,.31, .24,.53,.25, .60,.15,.29],
  [-.67,.15,.27, -.33,.23,.34, .23,.16,.42, .63,.24,.25],
  [-.58,.15,.26, -.18,.39,.25, .21,.16,.20, .57,.40,.23],
  [-.63,.09,.27, -.24,.17,.30, .28,.32,.45, .68,.10,.25],
  [-.68,.12,.25, -.33,.49,.24, .12,.29,.34, .56,.16,.26],
  [-.64,.18,.25, -.16,.25,.47, .37,.13,.25, .71,.08,.18],
  [-.55,.12,.28, -.14,.27,.27, .32,.34,.30, .68,.10,.20],
];
const shapeBranches = shoulders.map((a, i) => `${i === 0 ? 'if' : 'else if'} (id < ${f(i + .5)}) {
  top += ${Array.from({length:4},(_,j)=>`${f(a[j*3+1])} * shoulder(p.x, ${f(a[j*3])}, ${f(a[j*3+2])})`).join(' + ')};
}`).join('\n');
const PROCEDURAL = `
float shoulder(float x, float center, float width) { float q=(x-center)/width; return exp(-q*q); }
vec3 candidateShape(vec2 p, float id) {
  // Two bounded contour scales, no hash or noise octaves. Warp cannot fragment the mass.
  p.y += 0.018 * sin(p.x * 16.0 + id * 2.7) + 0.008 * sin(p.x * 31.0 - id);
  p.x += 0.012 * sin(p.y * 13.0 + id);
  float envelope = sqrt(max(0.0, 1.0 - p.x*p.x));
  float top = 0.09;
  ${shapeBranches}
  top *= envelope;
  float base = (-0.12 + 0.025*sin(p.x*5.0+id) + 0.014*sin(p.x*12.0-id)) * envelope;
  float distance = min(min(top-p.y, p.y-base), 1.0-abs(p.x));
  float aa = max(fwidth(distance), 0.004);
  float mask = smoothstep(-aa, aa, distance);
  float height = clamp((p.y-base)/max(top-base,0.04),0.0,1.0);
  // Wide paint planes rather than a height-field normal (which created crater-like relief).
  float plane = 0.5 + 0.24*sin(p.x*6.0 + p.y*4.0 + id*1.7);
  return vec3(mask, height, plane);
}`;
const MASKS = `
uniform sampler2D uCloudAtlas;
vec3 candidateShape(vec2 p, float id) {
  vec2 uv = (p + vec2(1.15,0.65)) / vec2(2.30,1.45);
  // Transparent gutters plus per-tile clamp: never sample a neighbouring archetype.
  uv = clamp(uv,vec2(0.015),vec2(0.985));
  vec2 cell = vec2(mod(id,4.0),1.0-floor(id/4.0));
  vec3 data = texture2D(uCloudAtlas,(cell+uv)/vec2(4.0,2.0)).rgb;
  return data;
}`;
const COMMON = `
vec2 candidateGroup(vec3 d, vec3 center, float size, float aspect, float angle, float id) {
  float facing = dot(d,center);
  if (facing < 0.55) return vec2(0.0);
  vec3 right = normalize(cross(vec3(0.0,1.0,0.0),center));
  vec3 up = cross(center,right);
  vec2 p = vec2(dot(d,right)/aspect,dot(d,up))/facing/size;
  p = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
  if (abs(p.x)>1.13 || p.y< -0.63 || p.y>0.78) return vec2(0.0);
  vec3 shape = candidateShape(p,id);
  float sideKey = dot(uSunDir,right)*uGlow;
  float lit = 0.43 + 0.38*smoothstep(0.08,0.86,shape.y) + 0.10*(shape.z-0.5)
    + 0.055*sideKey*p.x;
  return vec2(shape.x,clamp(lit,0.38,0.91));
}
vec2 cloudShape(vec3 d) {
  vec2 result=vec2(0.0);
  ${CLOUD_LAYOUT.map(([az,el,size,aspect,angle,id])=>{
    const a=az*Math.PI/180,e=el*Math.PI/180;
    return `vec2 c${id}=candidateGroup(d,vec3(${f(Math.sin(a)*Math.cos(e))},${f(Math.sin(e))},${f(-Math.cos(a)*Math.cos(e))}),${f(size)},${f(aspect)},${f(angle)},${f(id)}); result=result.x>c${id}.x?result:c${id};`;
  }).join('\n')}
  result.x *= smoothstep(0.08,0.20,d.y);
  return result;
}`;
// Only replace the cloud functions: approved background, sun and colour pipeline stay byte-identical.
export function cloudFragment(variant: CloudVariant): string {
  if (variant === 'production') return SKY_FRAGMENT;
  const start = SKY_FRAGMENT.indexOf('// Painted cumulus relief:');
  const end = SKY_FRAGMENT.indexOf('\n#endif', start);
  return SKY_FRAGMENT.slice(0,start) + (variant === 'procedural' ? PROCEDURAL : MASKS) + COMMON + SKY_FRAGMENT.slice(end);
}
