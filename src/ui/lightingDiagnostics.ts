// Read-only render evidence from the temporary lighting review; excludes saved state and puzzle flags.
import * as THREE from 'three';
import type { Game } from '../core/game';
import { BUILD } from '../core/game';
import { ART } from '../core/artflags';
export function lightingReport(game: Game) {
  const r = game.renderer, gl = r.getContext(), env = game.extras.env;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const precision = (kind: number) => {
    const p = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, kind);
    return p && { bits: p.precision, rangeMin: p.rangeMin, rangeMax: p.rangeMax };
  };
  const lights: unknown[] = [];
  game.world?.scene.traverse(o => {
    if (!(o instanceof THREE.Light)) return;
    const hierarchy: { type: string; visible: boolean }[] = [];
    for (let p: THREE.Object3D | null = o; p; p = p.parent) hierarchy.push({ type: p.type, visible: p.visible });
    lights.push({ type: o.type, intensity: o.intensity, color: o.color.toArray(), hierarchy,
      groundColor: o instanceof THREE.HemisphereLight ? o.groundColor.toArray() : undefined });
  });
  const programs = (r.info.programs ?? []).map((entry, index) => {
    // Diagnostic-only introspection of Three's cached program handles; no shader or uniform is modified.
    const p = entry as unknown as { program?: WebGLProgram; vertexShader?: WebGLShader; fragmentShader?: WebGLShader };
    if (!p.program) return { index, unavailable: true };
    const uniforms: { name: string; value: unknown }[] = [];
    const n = gl.getProgramParameter(p.program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const u = gl.getActiveUniform(p.program, i);
      if (!u || !/^(hemisphereLights|directionalLights)\[\d+\]\./.test(u.name)) continue;
      const loc = gl.getUniformLocation(p.program, u.name), value: unknown = loc ? gl.getUniform(p.program, loc) : null;
      uniforms.push({ name: u.name, value: ArrayBuffer.isView(value) ? Array.from(value as Float32Array) : value });
    }
    return { index, linked: !!gl.getProgramParameter(p.program, gl.LINK_STATUS), globalLightUniforms: uniforms,
      vertexLog: p.vertexShader ? gl.getShaderInfoLog(p.vertexShader)?.slice(0, 1000) : null,
      fragmentLog: p.fragmentShader ? gl.getShaderInfoLog(p.fragmentShader)?.slice(0, 1000) : null };
  });
  return { kind: 'ENV-L01 read-only lighting report', build: BUILD, at: new Date().toISOString(),
    userAgent: navigator.userAgent, quality: game.settings.quality, reducedMotion: game.settings.reducedMotion,
    devicePixelRatio: window.devicePixelRatio, renderPixelRatio: r.getPixelRatio(), buffer: r.getDrawingBufferSize(new THREE.Vector2()).toArray(),
    camera: { position: game.camera.position.toArray(), quaternion: game.camera.quaternion.toArray(), fov: game.camera.fov, aspect: game.camera.aspect },
    review: { mode: env?.mode, preview: env?.preview, diagnostic: env?.diagnostic, progressDusk: game.audio.dusk }, art: { ...ART },
    exposure: r.toneMappingExposure, toneMapping: r.toneMapping, shadows: r.shadowMap.enabled,
    gl: { lost: gl.isContextLost(), error: gl.getError(), renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION), shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION), highFloat: precision(gl.HIGH_FLOAT), mediumFloat: precision(gl.MEDIUM_FLOAT), multiDraw: !!gl.getExtension('WEBGL_multi_draw') },
    sceneLights: lights, programs,
    note: 'Programs include cached/unused variants. A scene light value alone does not prove its contribution reached a drawn fragment. The GL error field samples and clears the current error flag. No save/puzzle data collected.' };
}
export function downloadLightingReport(game: Game) {
  const uri = URL.createObjectURL(new Blob([JSON.stringify(lightingReport(game), null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = uri; a.download = 'ENV-L01-render-report.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(uri), 2000);
}
