// Rendering capabilities, detected from the live WebGL context (never from the browser name).
//
//   ?multidraw=0   diagnostic: hide WEBGL_multi_draw from the WebGL context BEFORE the renderer is created, as if
//                  the device lacked it. The BOSLUST sample then takes its instanced fallback path (and three.js
//                  takes its own per-instance BatchedMesh fallback anywhere else). Works with ?debug=1 and review.
//
// With no parameter nothing is patched and the context is used as the browser provides it.
import type * as THREE from 'three';

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const FORCE_NO_MULTIDRAW = q.get('multidraw') === '0';

export const CAPS = {
  /** WEBGL_multi_draw usable: many geometries in one draw call (BatchedMesh). */
  multiDraw: true,
  /** The fallback was forced by ?multidraw=0 (the device itself may support multi-draw). */
  forced: false,
};

const HIDDEN = 'WEBGL_multi_draw';
const patched = new WeakSet<object>();
/**
 * Make every WebGL context created from now on report WEBGL_multi_draw as unavailable (getExtension → null, not
 * listed in getSupportedExtensions). Called before the renderer is created, only when ?multidraw=0.
 */
export function hideMultiDraw() {
  if (typeof HTMLCanvasElement === 'undefined') return;
  const proto = HTMLCanvasElement.prototype as unknown as { getContext: (this: HTMLCanvasElement, id: string, o?: unknown) => unknown };
  const orig = proto.getContext;
  proto.getContext = function (id: string, o?: unknown) {
    const ctx = orig.call(this, id, o) as (WebGLRenderingContext & WebGL2RenderingContext) | null;
    if (ctx && /webgl/.test(id) && !patched.has(ctx)) {
      patched.add(ctx);
      const ge = ctx.getExtension.bind(ctx), gs = ctx.getSupportedExtensions.bind(ctx);
      ctx.getExtension = ((name: string) => (name === HIDDEN ? null : ge(name))) as typeof ctx.getExtension;
      ctx.getSupportedExtensions = () => (gs() ?? []).filter((n) => n !== HIDDEN);
    }
    return ctx;
  };
}

/** Read the capabilities from the renderer's context (after creation). */
export function detectCaps(renderer: THREE.WebGLRenderer) {
  CAPS.multiDraw = renderer.extensions.has(HIDDEN);
  CAPS.forced = FORCE_NO_MULTIDRAW;
}

/** Short label for the debug overlay and the review bar. */
export const vegPathLabel = () => (CAPS.multiDraw ? 'multi-draw' : `instanced fallback${CAPS.forced ? ' (forced)' : ''}`);
