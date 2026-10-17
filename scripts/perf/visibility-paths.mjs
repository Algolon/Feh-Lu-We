// PERF-R02 measurement paths (non-functional tooling). Plan coordinates (x east, z north), floor height y as a hint.
// LEGACY_PATHS are byte-for-byte the paths of scripts/dev04d-walk-budget.mjs (so Mode C reproduces it); the PERF-R02
// paths add the main stair, the attic stair, the gallery sightlines and the hall's open well.

export const LEGACY_PATHS = [
  ['up-west', 3.35, [[90, 99.5], [85.9, 95.0], [85.9, 90.2], [83.4, 90.2], [78.5, 90.6], [75.4, 89.6], [80.4, 92.6], [83.6, 90.4], [85.9, 90.2], [85.9, 82.2], [83.4, 82.2], [79.4, 82.4], [76.2, 83.0], [82.6, 84.0], [85.9, 82.2], [90, 82.2]]],
  ['up-east', 3.35, [[90, 100.2], [87.5, 103.0], [87.5, 105.0], [88.6, 107.4], [87.5, 103.0], [92.5, 98.6], [96.5, 97.3], [101.0, 97.3], [101.0, 99.6], [104.0, 100.8], [103.0, 104.5], [100.4, 103.6], [101.0, 99.6]]],
  ['hall', 0.15, [[90, 81.8], [90, 88.0], [89.5, 95.0], [90, 99.5]]],
  ['library', 0.15, [[84.0, 95.6], [78.0, 99.8], [74.2, 106.0], [80.0, 107.2], [83.4, 101.0]]],
];

// y per waypoint where the path changes floor (stairs); otherwise the path's floor hint
export const PERF_PATHS = [
  // hall floor → main stair (x 93–95, z 86.5→95.5) → landing
  ['stair', 0.15, [[90, 85.0], [94.0, 85.6], [94.0, 88.0, 0.86], [94.0, 92.0, 2.28], [94.0, 95.4, 3.35], [92.0, 97.5, 3.35], [89.0, 100.0, 3.35]]],
  // landing → corridor → attic stair (two flights, x 95–99, z 99.8–102.3) → attic landing → common attic
  ['attic', 3.35, [[92.0, 98.0], [97.2, 97.4], [97.2, 99.5], [97.2, 102.0, 4.85], [95.8, 102.2, 5.0], [95.8, 100.0, 6.5], [93.5, 99.0, 6.65], [88.0, 98.0, 6.65], [84.0, 96.0, 6.65]]],
  // landing → library gallery (door.libGallery) and back along the long diagonal
  ['gallery', 3.35, [[92.0, 100.0], [86.0, 100.0], [83.0, 100.5], [76.0, 104.0], [80.0, 97.0], [86.0, 99.0]]],
  // the hall's open well: standing points under the galleries (Mode A / B look up / down here)
  ['well', 0.15, [[90, 84.5], [90, 88.0], [88.0, 92.0], [91.5, 95.0]]],
];

// PERF-R02 release (WINDOW-R02 see-through windows): garden walks past the doorway regions' windows, 5–7 m out,
// facing the facade (the study / botanic / library / gallery / linen interiors are seen only through the glass)
export const WINDOW_PATHS = [
  ['win-north', 0, [[70.0, 116.0], [78.5, 116.0], [86.0, 116.0], [98.0, 116.0], [104.0, 116.0]]],
  ['win-west', 0, [[65.5, 94.0], [65.5, 101.0], [65.5, 108.0]]],
  ['win-south', 0, [[96.0, 74.0], [101.5, 74.0], [106.0, 74.0], [113.5, 80.0], [113.5, 87.0], [113.5, 93.0]]],
];

// PERF-R03-A (exterior greenery): the front approach and forecourt (hedges, both sides), the ground-floor front rooms
// and the kitchen with their windows / back door, and the upstairs front and west rooms (windows over the hedges and
// along the climber walls). Look-arounds at every waypoint (legacy samples) face each window.
export const EXT_PATHS = [
  ['front-approach', 0, [[90.0, 62.0], [90.0, 72.0], [78.0, 75.5], [102.0, 75.5], [90.0, 77.5]]],
  ['ground-front', 0.15, [[78.5, 84.0], [80.0, 90.5], [90.0, 86.0], [101.0, 84.0], [101.0, 90.0]]],
  ['kitchen', 0.15, [[101.0, 96.0], [101.0, 106.0], [97.0, 108.5]]],
  ['upper-rooms', 3.35, [[78.0, 83.5], [76.0, 91.0], [98.0, 86.0], [104.0, 86.0], [75.0, 104.0]]],
];

export const ALL_PATHS = [...LEGACY_PATHS, ...PERF_PATHS, ...WINDOW_PATHS, ...EXT_PATHS];

/** Door states: every door shut; every door open (stress); a realistic set (the rooms a player walks into upstairs). */
export const DOOR_SETS = {
  closed: { mode: 'closed' },
  open: { mode: 'open' },
  partial: { mode: 'list', list: ['door.reis', 'door.sterren', 'door.libGallery', 'door.study', 'door.storage', 'door.atticStair', 'door.library', 'door.livLib', 'door.bath'] },
};

const at = (p, y) => ({ x: p[0], z: p[1], y: p[2] ?? y });

/** Legacy samples (dev04d-walk-budget.mjs): eight-way turn at every waypoint, then STEP-metre steps facing travel. */
export function legacySamples(pts, y, step = 0.4, pitches = [0]) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = at(pts[i], y);
    for (let k = 0; k < 8; k++) for (const pitch of pitches) out.push({ ...a, yaw: (k / 8) * Math.PI * 2, pitch, turn: true });
    if (i === pts.length - 1) break;
    const b = at(pts[i + 1], y), L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.round(L / step)), yaw = Math.atan2(b.x - a.x, b.z - a.z);
    for (let s = 0; s < n; s++) out.push({ x: a.x + ((b.x - a.x) * s) / n, y: a.y + ((b.y - a.y) * s) / n, z: a.z + ((b.z - a.z) * s) / n, yaw, pitch: -0.04 });
  }
  return out;
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/**
 * Continuous trajectory, one pose per rendered frame (Mode A): walk at `speed` m/s along the path, the heading easing
 * toward the travel direction at `turnRate` rad/s (it turns before it walks on when a corner is sharper than ~30°),
 * and at the listed waypoints (`lookAround`: 'corners' = first, last and every corner; 'first'; 'all'; 'none') a full
 * look-around at `turnRate`, with a look up
 * (+0.5 rad) and down (−0.35 rad) at `lookUp` waypoints. Deterministic: the frame sequence depends only on the inputs.
 */
export function trajectory(pts, y, { fps = 30, speed = 3.2, turnRate = Math.PI, lookAround = 'corners', lookUp = [] } = {}) {
  const dt = 1 / fps, frames = [];
  let yaw = null, pitch = 0, cur = at(pts[0], y);
  const push = (tag) => frames.push({ x: +cur.x.toFixed(4), y: +cur.y.toFixed(4), z: +cur.z.toFixed(4), yaw: +yaw.toFixed(5), pitch: +pitch.toFixed(5), tag });
  const turnTo = (target, tag) => { while (Math.abs(wrap(target - yaw)) > 1e-3) { const d = wrap(target - yaw); yaw = wrap(yaw + Math.sign(d) * Math.min(Math.abs(d), turnRate * dt)); push(tag); } };
  const pitchTo = (target, tag) => { while (Math.abs(target - pitch) > 1e-3) { const d = target - pitch; pitch += Math.sign(d) * Math.min(Math.abs(d), turnRate * 0.6 * dt); push(tag); } };
  for (let i = 0; i < pts.length; i++) {
    const a = at(pts[i], y), b = i + 1 < pts.length ? at(pts[i + 1], y) : null;
    cur = { ...a };
    const travel = b ? Math.atan2(b.x - a.x, b.z - a.z) : yaw ?? 0;
    if (yaw === null) { yaw = travel; push('start'); }
    const corner = i === 0 || i === pts.length - 1 || (b && Math.abs(wrap(travel - yaw)) > Math.PI / 6);
    if (lookAround === 'all' || (lookAround === 'corners' && corner) || (lookAround === 'first' && i === 0)) {
      const start = yaw; for (let k = 1; k <= 4; k++) turnTo(wrap(start + (k * Math.PI) / 2), 'look');
    }
    if (lookUp.includes(i)) { pitchTo(0.5, 'up'); pitchTo(-0.35, 'down'); pitchTo(0, 'level'); }
    if (!b) break;
    if (Math.abs(wrap(travel - yaw)) > Math.PI / 6) turnTo(travel, 'turn');
    const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / (speed * dt)));
    for (let s = 1; s <= n; s++) {
      cur = { x: a.x + ((b.x - a.x) * s) / n, y: a.y + ((b.y - a.y) * s) / n, z: a.z + ((b.z - a.z) * s) / n };
      const d = wrap(travel - yaw); yaw = wrap(yaw + Math.sign(d) * Math.min(Math.abs(d), turnRate * dt));
      push('walk');
    }
  }
  return frames;
}
