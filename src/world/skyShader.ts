// One procedural dome. Detail compiles only in the ENV-L01 review, never ordinary gameplay.
export const SKY_FRAGMENT = `
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunCol;
uniform float uGlow; uniform float uPilot;
#ifdef ENV_SKY_REVIEW
uniform vec3 uCloudLight; uniform vec3 uCloudShade; uniform float uCloudOpacity;
// Painted cumulus relief: compact polynomial lobes and their analytic gradients.
// No texture sampling, noise octaves, raymarch or animation clock.
vec3 puff(vec2 p, vec2 center, vec2 scale) {
  vec2 q = (p - center) / scale;
  float cap = max(0.0, 1.0 - dot(q, q));
  return vec3(cap * cap, -4.0 * cap * q / scale);
}
vec2 cloudGroup(vec3 d, vec3 center, float size, float variation) {
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), center));
  vec3 up = cross(center, right);
  float facing = dot(d, center);
  vec2 p = vec2(dot(d, right), dot(d, up)) / max(facing, 0.12) / size;
  vec3 field = puff(p, vec2(0.0, -0.10), vec2(0.78, 0.23));
  field += puff(p, vec2(-0.43, 0.02), vec2(0.29, 0.27));
  field += puff(p, vec2(-0.12, 0.17 * variation), vec2(0.33, 0.36));
  field += puff(p, vec2(0.22, 0.08 * variation), vec2(0.31, 0.29 * variation));
  field += puff(p, vec2(0.49, -0.04), vec2(0.24, 0.21));
  field += puff(p, vec2(-0.60, -0.04), vec2(0.18, 0.16));
  field += puff(p, vec2(0.04, 0.27 * variation), vec2(0.18, 0.20));
  float edge = max(fwidth(field.x), 0.012);
  float mask = smoothstep(0.09 - edge, 0.15 + edge, field.x) * smoothstep(0.15, 0.35, facing);
  vec3 normal = normalize(vec3(-field.y, -field.z, 2.5));
  // A broad sky key models bright tops/cool undersides; sun-facing bias fades with the sun.
  vec3 key = normalize(vec3(dot(uSunDir, right) * uGlow, 0.65 + 0.35 * uSunDir.y, 1.1));
  float lit = 0.38 + 0.62 * max(dot(normal, key), 0.0);
  return vec2(mask, lit);
}
vec2 cloudShape(vec3 d) {
  vec2 a = cloudGroup(d, normalize(vec3(-1.9, 1.0, -1.7)), 0.86, 1.0);
  vec2 b = cloudGroup(d, normalize(vec3(1.5, 1.0, -2.2)), 0.70, 0.72);
  vec2 c = cloudGroup(d, normalize(vec3(-0.7, 1.0, 1.6)), 0.76, 1.18);
  vec2 result = a.x > b.x ? a : b;
  result = result.x > c.x ? result : c;
  result.x *= smoothstep(0.08, 0.20, d.y);
  return result;
}
#endif
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y * 1.6 + 0.08, 0.0, 1.0);
  vec3 c = mix(uHorizon, uZenith, pow(h, 0.7));
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  #ifdef ENV_SKY_REVIEW
  if (uPilot > 0.5) {
    float cloud = 0.0;
    if (uCloudOpacity > 0.0) {
      vec2 shape = cloudShape(d);
      cloud = shape.x * uCloudOpacity;
      c = mix(c, mix(uCloudShade, uCloudLight, shape.y), cloud);
    }
    // Slightly enlarged (~1 degree diameter), anti-aliased stylized disc and restrained aureole.
    float edge = max(fwidth(s), 0.000005);
    float disc = smoothstep(0.999962 - edge, 0.999962 + edge, s);
    c += uSunCol * uGlow * (disc * 1.8 + pow(s, 48.0) * 0.18) * (1.0 - cloud * 0.65);
  } else
  #endif
  { c += uSunCol * uGlow * (pow(s, 600.0) * 1.5 + pow(s, 12.0) * 0.35); }
  gl_FragColor = vec4(c, 1.0);
  #ifdef TONE_MAPPING
    if (uPilot > 0.5) gl_FragColor.rgb = toneMapping(gl_FragColor.rgb);
  #endif
  #include <colorspace_fragment>
}`;
