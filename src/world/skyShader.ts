// One procedural dome. Detail compiles only in the ENV-L01 review, never ordinary gameplay.
export const SKY_FRAGMENT = `
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunCol;
uniform float uGlow; uniform float uPilot;
#ifdef ENV_SKY_REVIEW
uniform vec3 uCloudLight; uniform vec3 uCloudShade; uniform float uCloudOpacity;
// Broad authored lobes, no texture sampling, noise octaves, raymarch or animation clock.
float lobe(vec2 p, vec2 center, vec2 scale) {
  vec2 q = (p - center) / scale;
  return 1.0 - smoothstep(0.20, 1.0, dot(q, q));
}
float cloudShape(vec3 d) {
  vec2 p = d.xz / max(d.y, 0.12);
  float a = max(lobe(p, vec2(-1.9, -1.7), vec2(1.4, 0.40)), lobe(p, vec2(-1.1, -1.6), vec2(0.85, 0.52)));
  float b = max(lobe(p, vec2(1.5, -2.2), vec2(1.7, 0.48)), lobe(p, vec2(2.3, -2.1), vec2(0.95, 0.60)));
  float c = max(lobe(p, vec2(-0.7, 1.6), vec2(1.8, 0.40)), lobe(p, vec2(0.25, 1.7), vec2(0.8, 0.52)));
  return max(max(a, b), c) * smoothstep(0.10, 0.24, d.y);
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
      cloud = cloudShape(d) * uCloudOpacity;
      // The stretched layer carries a soft cooler underside, selective sun-facing warmth.
      float lit = clamp(0.45 + 0.35 * s + 0.20 * d.y, 0.0, 1.0);
      c = mix(c, mix(uCloudShade, uCloudLight, lit), cloud);
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
