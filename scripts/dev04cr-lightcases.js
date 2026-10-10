// DEV-04C-R room-boundary light continuity: shared by scripts/dev04cr-lightwalk.mjs (probe / evidence) and
// scripts/e2e-dev04c.mjs (regression). Each case walks across a room boundary with the real controller while LOOKING AT
// a lit source; every tick it records the source's pooled-light share and whether the source is in view with a clear
// line of sight. Rule: once the source has been continuously visible for 1 s, its light must stay ≥ 50 % — crossing an
// abstract room boundary must not dim or switch off a source you are looking at.
export const LIGHT_CASES = [
  // leaving a room while looking back at its hearth (was: 0.8 → 0 within 2.5 m of the arch)
  { name: 'living→hall, looking back at the hearth', lamp: 'fire.living', y: 0.15, from: [82.8, 88.6], to: [88.0, 88.6], look: [72.7, 0.8, 86.7] },
  // leaving a room while looking back at its table candles
  { name: 'dining→hall, looking back at the table candles', lamp: 'candles.dining', y: 0.15, from: [97.2, 85.2], to: [92.5, 85.2], look: [101.3, 1.2, 85.2] },
  // a source two rooms away down a tunnel (was: no light until the next room was entered)
  { name: 'BOSLUST passage→entry, looking at the descent sconce', lamp: 'fixed.64.15.23.20', y: -3.5, from: [63.0, 37.0], to: [63.0, 30.0], look: [64.15, -2.0, 23.2] },
  // the hall chandelier seen from the upper corridor as it comes into view through the landing door
  { name: 'upper corridor→landing, looking at the hall chandelier', lamp: 'lamp.hallChandelier', y: 3.35, from: [97.5, 98.0], to: [90.5, 98.0], look: [89.9, 4.5, 90] },
];

/** In-page walker (passed to page.evaluate): returns one result per case. */
export function walkLightCases(CASES) {
  const g = window.__game, w = g.world, res = [];
  for (const c of CASES) {
    const lamp = w.lamps.find((l) => l.id === c.lamp);
    if (!lamp) { res.push({ name: c.name, error: 'no lamp ' + c.lamp }); continue; }
    const face = () => { const dx = c.look[0] - g.player.x, dz = c.look[2] - g.player.z; g.player.yaw = Math.atan2(dx, dz); g.player.pitch = Math.atan2(c.look[1] - (g.player.y + 1.65), Math.hypot(dx, dz)); };
    g.player.setPose({ x: c.from[0], y: c.y, z: c.from[1], yaw: 0, pitch: 0 }); g.player.y = w.col.supportHeight(c.from[0], c.from[1], c.y + 0.05, 0.42);
    for (let i = 0; i < 90; i++) { face(); g.tick(1 / 30); }
    g.autopilot = { x: c.to[0], z: c.to[1], run: false };
    const samples = []; let seenFor = 0, bad = 0, seenSamples = 0;
    for (let i = 0; i < 400; i++) {
      face(); g.tick(1 / 30);
      const e = g.camera.position, slot = g.pool.assigned().indexOf(c.lamp);
      const light = slot >= 0 ? g.pool.lights[slot].intensity / (lamp.intensity * g.pool.gain) : 0;
      const seen = !w.col.segmentBlocked(e.x, e.y, -e.z, lamp.pos.x, lamp.pos.y, -lamp.pos.z);
      seenFor = seen ? seenFor + 1 / 30 : 0;
      if (seenFor >= 1) { seenSamples++; if (light < 0.5) bad++; }
      samples.push({ room: w.hereRoom, light: +light.toFixed(2), seen });
      if (Math.hypot(g.player.x - c.to[0], g.player.z - c.to[1]) < 0.3) break;
    }
    g.autopilot = null;
    res.push({ name: c.name, lamp: c.lamp, rooms: [...new Set(samples.map((s) => s.room))], seenSamples, bad, min: Math.min(...samples.map((s) => s.light)),
      trace: samples.filter((_, i) => i % 12 === 0).map((s) => `${s.room}:${s.light}${s.seen ? '' : '(hidden)'}`).join(' ') });
  }
  return res;
}
