// Injected into the page by scripts/e2e.mjs. Drives the game through its real input paths:
// movement = joystick-equivalent move vector through collision (fixed-step), looking = yaw/pitch
// like a drag, acting = the same action as the on-screen button. No teleports, no state edits.
window.T = (() => {
  const G = () => window.__game;
  const DT = 1 / 30;
  const v = (x, y, z) => ({ x, y, z });
  function tick(n = 1) { for (let i = 0; i < n; i++) G().tick(DT); window.__simTicks = (window.__simTicks ?? 0) + n; }
  function pos() { const p = G().player; return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) }; }
  function walkTo(x, z, run = false, maxSec = 90) {
    const g = G();
    g.autopilot = { x, z, run };
    let last = { x: g.player.x, z: g.player.z }, still = 0;
    for (let i = 0; i < maxSec / DT; i++) {
      g.tick(DT);
      window.__simTicks = (window.__simTicks ?? 0) + 1;
      const d = Math.hypot(g.player.x - x, g.player.z - z);
      if (d < 0.3) { g.autopilot = null; tick(3); return pos(); }
      const m = Math.hypot(g.player.x - last.x, g.player.z - last.z);
      still = m < 0.002 ? still + DT : 0;
      last = { x: g.player.x, z: g.player.z };
      if (still > 1.5) { g.autopilot = null; throw new Error(`stuck walking to (${x},${z}) at ${JSON.stringify(pos())}`); }
    }
    g.autopilot = null;
    throw new Error(`timeout walking to (${x},${z}) at ${JSON.stringify(pos())}`);
  }
  function walk(points, run = false) { for (const [x, z] of points) walkTo(x, z, run); return pos(); }
  /** Point the view at a plan-space point (x east, y up, z north). */
  function lookAt(x, y, z) {
    const p = G().player;
    const dx = x - p.x, dz = z - p.z;
    p.yaw = Math.atan2(dx, dz);
    p.pitch = Math.atan2(y - (p.y + 1.65), Math.hypot(dx, dz));
    tick(2);
  }
  function hitCenter(id) {
    const it = G().world.byId.get(id);
    if (!it) throw new Error(`no interactable ${id}`);
    const h = it.hit[0];
    h.updateWorldMatrix(true, false);
    const wp = h.getWorldPosition(new h.position.constructor());
    return v(wp.x, wp.y, -wp.z);
  }
  function lookAtId(id) { const c = hitCenter(id); lookAt(c.x, c.y, c.z); return c; }
  /** Aim at an interactable and press the action button; asserts the reticle really targets it. */
  function act(id, expectLabel) {
    if (id) lookAtId(id);
    const m = G().metrics();
    if (id && m.target !== id) throw new Error(`expected target ${id} but reticle shows ${m.target} (${m.label}) at ${JSON.stringify(pos())}`);
    if (expectLabel && !(m.label ?? '').includes(expectLabel)) throw new Error(`expected label containing "${expectLabel}" but got "${m.label}"`);
    G().doAction();
    tick(2);
    return m.label;
  }
  function select(item) { G().select(item); tick(1); }
  function modalOpen() { return !document.getElementById('overlay').hidden; }
  function closeModal() { if (modalOpen()) G().ui.closeModal(); tick(1); }
  function click(sel) {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`no element ${sel}`);
    el.click();
  }
  function wait(sec) { tick(Math.round(sec / DT)); }
  return { tick, pos, walkTo, walk, lookAt, lookAtId, act, select, modalOpen, closeModal, click, wait, G, hitCenter };
})();
