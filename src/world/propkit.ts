// DEV-04B visual convergence: the shared prop families. One authored grammar for the recurring small assets of the
// estate — books, rugs, game boxes, crate contents (bottles, produce, groceries) — built as a small set of cached,
// parameterised geometries that are placed through the art kit's `Asm` (merged into each area's batch: no draw calls
// per prop). Variation comes from construction (size class, hard / soft cover, spine design, lid proportions, bottle
// type), not from recolouring alone.
//
// Conventions (art kit): three.js local space, the piece facing −z (forward), y up, origin at the base centre.
// Textures are value/colour atlases sampled through custom UVs, one material per family (propMats).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, type Rng } from '../core/rng';
import { Asm, artMats, softBox, lathe, cushion, projectUV } from './artkit';

// ------------------------------------------------------------------------------------------------ cache + audits
const GC = new Map<string, THREE.BufferGeometry>();
export function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = GC.get(key);
  if (!g) { g = make(); g.userData.shared = true; GC.set(key, g); }
  return g;
}
const f3 = (v: number) => v.toFixed(3);

/**
 * Mesh audit (pure; used by tests and the DEV-04B suite): welds by position and counts edges. `open` = edges used by
 * one triangle (a hole: a hollow or open-ended object), `flipped` = edges used twice in the SAME direction (a part
 * whose triangles face the wrong way / an inverted normal).
 */
export function meshAudit(g0: THREE.BufferGeometry) {
  const g = g0;
  const p = g.attributes.position as THREE.BufferAttribute;
  const key = (i: number) => `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`;
  const id = new Map<string, number>();
  const vid = (i: number) => { const k = key(i); let v = id.get(k); if (v == null) { v = id.size; id.set(k, v); } return v; };
  const idx = g.index ? Array.from(g.index.array) : [...Array(p.count).keys()];
  const dir = new Map<string, number>();
  let tris = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = vid(idx[t]), b = vid(idx[t + 1]), c = vid(idx[t + 2]);
    if (a === b || b === c || a === c) continue; // degenerate (welded) triangle
    tris++;
    for (const [u, v] of [[a, b], [b, c], [c, a]]) { const k = `${u}>${v}`; dir.set(k, (dir.get(k) ?? 0) + 1); }
  }
  let open = 0, flipped = 0;
  for (const [k, n] of dir) {
    const [u, v] = k.split('>');
    const back = dir.get(`${v}>${u}`) ?? 0;
    if (n > 1) flipped += n - 1;
    if (back === 0) open++;
  }
  return { tris, open, flipped };
}

// ------------------------------------------------------------------------------------------------ textures
function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
function tex(c: HTMLCanvasElement, wrap = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  return t;
}
const grey = (v: number) => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };

/** Book-cloth spine atlas: SPINES designs + one plain column (value only, multiplied by the cover colour). */
export const SPINES = 8;
const SPINE_COLS = SPINES + 1;
function spineTex() {
  const CW = 32, H = 256, [c, x] = canvas(CW * SPINE_COLS, H), r = mulberry32(501);
  for (let col = 0; col < SPINE_COLS; col++) {
    const X = col * CW;
    x.fillStyle = grey(0.93); x.fillRect(X, 0, CW, H);
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.03})`; x.fillRect(X + r() * CW, r() * H, 1, 2 + r() * 6); } // cloth grain
    if (col === SPINES) continue; // the plain cover cloth
    // raised band: a light ridge with a shadow under it (y measured from the top of the canvas = top of the spine)
    const band = (y: number, k = 1) => { x.fillStyle = grey(1.0 * k); x.fillRect(X, y, CW, 3); x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(X, y + 3, CW, 2); };
    const label = (y: number, h: number, v: number) => { x.fillStyle = grey(v); x.fillRect(X + 4, y, CW - 8, h); x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1; x.strokeRect(X + 4.5, y + 0.5, CW - 9, h - 1); };
    const title = (y: number, n = 3) => { x.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < n; i++) x.fillRect(X + 9 + r() * 3, y + i * 7, CW - 20 - r() * 6, 2); };
    switch (col) {
      case 0: band(18); band(H - 24); label(44, 40, 0.68); title(52, 3); break; // classic: bands + dark label
      case 1: for (const y of [20, 62, 104, 146, 188, 230]) band(y); break; // five raised cords
      case 2: label(30, 56, 1.0); x.fillStyle = 'rgba(0,0,0,0.45)'; for (let i = 0; i < 3; i++) x.fillRect(X + 9, 44 + i * 10, CW - 18, 2); break; // paper label
      case 3: x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(X, 10, CW, 2); x.fillRect(X, H - 12, CW, 2); title(40, 4); break; // paperback
      case 4: band(16); band(H - 22); x.fillStyle = 'rgba(255,255,255,0.4)'; for (let y = 60; y < H - 40; y += 34) { x.beginPath(); x.moveTo(X + CW / 2, y); x.lineTo(X + CW - 8, y + 9); x.lineTo(X + CW / 2, y + 18); x.lineTo(X + 8, y + 9); x.fill(); } break; // tooled lozenges
      case 5: x.fillStyle = grey(0.62); x.fillRect(X, 0, CW, 36); x.fillRect(X, H - 36, CW, 36); band(36); band(H - 40); title(70, 3); break; // quarter binding
      case 6: x.fillStyle = grey(0.7); x.fillRect(X, 96, CW, 30); title(102, 2); break; // title strip
      case 7: band(24); label(60, 26, 0.72); band(H - 30); for (let y = 120; y < H - 50; y += 14) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(X + CW / 2 - 2, y, 4, 4); } break; // stamped dots
    }
  }
  return c;
}
/** Paper block: fine page lines across U (one repeat = 8 cm across the block's thickness). */
function paperTex() {
  const [c, x] = canvas(128, 8), r = mulberry32(502);
  for (let i = 0; i < 32; i++) { x.fillStyle = grey(0.95 + r() * 0.05); x.fillRect(i * 4, 0, 3, 8); x.fillStyle = grey(0.74 + r() * 0.08); x.fillRect(i * 4 + 3, 0, 1, 8); }
  return c;
}

/** Rug family: one atlas, RUG cells (2 columns × 4 rows of 192 × 288 px); each design has its own border structure. */
export const RUG = { medallion: 0, kilim: 1, lattice: 2, field: 3, runner: 4, runnerEnd: 5, oval: 6, hanging: 7 } as const;
export type RugPattern = keyof typeof RUG;
const RCW = 192, RCH = 288;
function rugTex() {
  const [c, x] = canvas(RCW * 2, RCH * 4), r = mulberry32(503);
  const cell = (i: number) => [(i % 2) * RCW, Math.floor(i / 2) * RCH] as const;
  const diamond = (cx: number, cy: number, w: number, h: number) => { x.beginPath(); x.moveTo(cx, cy - h); x.lineTo(cx + w, cy); x.lineTo(cx, cy + h); x.lineTo(cx - w, cy); x.closePath(); x.fill(); };
  const frame = (X: number, Y: number, ins: number, w: number, col: string) => { x.fillStyle = col; x.fillRect(X + ins, Y + ins, RCW - 2 * ins, w); x.fillRect(X + ins, Y + RCH - ins - w, RCW - 2 * ins, w); x.fillRect(X + ins, Y + ins, w, RCH - 2 * ins); x.fillRect(X + RCW - ins - w, Y + ins, w, RCH - 2 * ins); };
  const pile = (X: number, Y: number, w = RCW, h = RCH) => { for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.05})`; x.fillRect(X + r() * w, Y + r() * h, 2, 1); } };
  // 0 medallion: madder field, indigo border with a running lozenge, a restrained medallion
  { const [X, Y] = cell(0);
    x.fillStyle = '#8c4a3a'; x.fillRect(X, Y, RCW, RCH);
    x.fillStyle = '#d8c8a4'; x.fillRect(X, Y, RCW, RCH); x.fillStyle = '#3e4a5c'; x.fillRect(X + 8, Y + 8, RCW - 16, RCH - 16);
    x.fillStyle = '#8c4a3a'; x.fillRect(X + 30, Y + 30, RCW - 60, RCH - 60);
    x.fillStyle = 'rgba(210,180,122,0.8)'; for (let i = 0; i < 9; i++) { diamond(X + 24 + i * 18, Y + 19, 5, 5); diamond(X + 24 + i * 18, Y + RCH - 19, 5, 5); } for (let j = 0; j < 14; j++) { diamond(X + 19, Y + 34 + j * 17, 5, 5); diamond(X + RCW - 19, Y + 34 + j * 17, 5, 5); }
    x.save(); x.translate(X + RCW / 2, Y + RCH / 2);
    x.fillStyle = '#3e4a5c'; diamond(0, 0, 48, 72); x.fillStyle = '#b8814a'; diamond(0, 0, 32, 48); x.fillStyle = '#8c4a3a'; diamond(0, 0, 16, 24); x.restore();
    x.fillStyle = 'rgba(216,200,164,0.35)'; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) diamond(X + RCW / 2 + dx * 52, Y + RCH / 2 + dy * 90, 12, 18);
    pile(X, Y); }
  // 1 kilim: natural wool with horizontal bands of stepped triangles in rust / ochre / indigo
  { const [X, Y] = cell(1);
    x.fillStyle = '#d9c9a8'; x.fillRect(X, Y, RCW, RCH);
    const bands = ['#9c4a30', '#c08a3c', '#3f4f62', '#9c4a30', '#5d6b4a', '#c08a3c', '#3f4f62'];
    bands.forEach((col, i) => {
      const y = Y + 18 + i * 38;
      x.fillStyle = col; x.fillRect(X, y, RCW, 6);
      for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(X + k * 24, y + 6); x.lineTo(X + k * 24 + 12, y + 20); x.lineTo(X + k * 24 + 24, y + 6); x.fill(); }
      x.fillStyle = 'rgba(60,40,30,0.45)'; x.fillRect(X, y + 26, RCW, 2);
    });
    pile(X, Y); }
  // 2 lattice: deep green field with an ochre diamond trellis, a double guard border in cream and rust
  { const [X, Y] = cell(2);
    x.fillStyle = '#3f5442'; x.fillRect(X, Y, RCW, RCH);
    x.save(); x.beginPath(); x.rect(X + 26, Y + 26, RCW - 52, RCH - 52); x.clip();
    x.strokeStyle = 'rgba(196,160,92,0.75)'; x.lineWidth = 3;
    for (let k = -12; k < 20; k++) { x.beginPath(); x.moveTo(X + k * 28, Y); x.lineTo(X + k * 28 + RCH * 0.7, Y + RCH); x.stroke(); x.beginPath(); x.moveTo(X + k * 28, Y + RCH); x.lineTo(X + k * 28 + RCH * 0.7, Y); x.stroke(); }
    x.fillStyle = 'rgba(160,80,60,0.8)'; for (let j = 0; j < 12; j++) for (let k = 0; k < 8; k++) diamond(X + 14 + k * 28 + (j % 2) * 14, Y + 10 + j * 24, 3, 3);
    x.restore();
    frame(X, Y, 0, 10, '#d4c4a0'); frame(X, Y, 10, 8, '#8c3f30'); frame(X, Y, 18, 8, '#d4c4a0');
    pile(X, Y); }
  // 3 field: an almost plain field (warm grey-brown) with one narrow border line: the calm rug for bedrooms / studies
  { const [X, Y] = cell(3);
    x.fillStyle = '#a8957a'; x.fillRect(X, Y, RCW, RCH);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},0.04)`; x.fillRect(X, Y + r() * RCH, RCW, 2 + r() * 6); } // abrash
    frame(X, Y, 12, 4, '#6e5a44'); frame(X, Y, 22, 2, '#e2d4b4');
    pile(X, Y); }
  // 4 runner middle (tiles along V): madder field, repeating octagonal guls, indigo side borders only
  { const [X, Y] = cell(4);
    x.fillStyle = '#7e3c32'; x.fillRect(X, Y, RCW, RCH);
    x.fillStyle = '#2f3b4e'; x.fillRect(X, Y, 26, RCH); x.fillRect(X + RCW - 26, Y, 26, RCH);
    x.fillStyle = '#d4bf94'; x.fillRect(X + 26, Y, 4, RCH); x.fillRect(X + RCW - 30, Y, 4, RCH);
    x.fillStyle = 'rgba(212,191,148,0.7)'; for (let j = 0; j < 9; j++) { diamond(X + 13, Y + 16 + j * 32, 5, 7); diamond(X + RCW - 13, Y + 16 + j * 32, 5, 7); }
    for (let j = 0; j < 3; j++) { const cy = Y + 48 + j * 96; x.fillStyle = '#c99a52'; diamond(X + RCW / 2, cy, 46, 34); x.fillStyle = '#2f3b4e'; diamond(X + RCW / 2, cy, 30, 22); x.fillStyle = '#7e3c32'; diamond(X + RCW / 2, cy, 14, 10); }
    pile(X, Y); }
  // 5 runner end: the middle's side borders plus an end border (at the top of the cell = the rug's end)
  { const [X, Y] = cell(5);
    x.drawImage(c, cell(4)[0], cell(4)[1], RCW, RCH, X, Y, RCW, RCH);
    x.fillStyle = '#2f3b4e'; x.fillRect(X, Y, RCW, 26); x.fillStyle = '#d4bf94'; x.fillRect(X + 26, Y + 26, RCW - 52, 4);
    x.fillStyle = 'rgba(212,191,148,0.7)'; for (let k = 0; k < 6; k++) diamond(X + 30 + k * 26, Y + 13, 7, 5); }
  // 6 oval braided: concentric braided rings (drawn into the ellipse that the oval geometry maps)
  { const [X, Y] = cell(6);
    x.fillStyle = '#7a6a58'; x.fillRect(X, Y, RCW, RCH);
    const rings = ['#6f5a46', '#a8946c', '#5d6f7a', '#c4b28c', '#8a5a44', '#a8946c', '#4f5f6a', '#c4b28c', '#7a6a58', '#b08a5a', '#5d6f7a'];
    rings.forEach((col, i) => { const k = 1 - i / rings.length; x.fillStyle = col; x.beginPath(); x.ellipse(X + RCW / 2, Y + RCH / 2, (RCW / 2) * k, (RCH / 2) * k, 0, 0, Math.PI * 2); x.fill(); });
    x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 1;
    for (let i = 0; i < rings.length; i++) { const k = 1 - i / rings.length; for (let a = 0; a < 64; a++) { const t = (a / 64) * Math.PI * 2; x.beginPath(); x.moveTo(X + RCW / 2 + Math.cos(t) * (RCW / 2) * k, Y + RCH / 2 + Math.sin(t) * (RCH / 2) * k); x.lineTo(X + RCW / 2 + Math.cos(t + 0.06) * (RCW / 2) * (k - 0.04), Y + RCH / 2 + Math.sin(t + 0.06) * (RCH / 2) * (k - 0.04)); x.stroke(); } } }
  // 7 woven hanging: a tree of life on indigo with a rust border; the bottom 24 px are the fringe strip
  { const [X, Y] = cell(7);
    x.fillStyle = '#2f3d52'; x.fillRect(X, Y, RCW, RCH - 24);
    frame(X, Y - 0, 0, 12, '#9c4a30');
    x.fillStyle = '#c9a25a'; x.fillRect(X + RCW / 2 - 3, Y + 60, 6, RCH - 110);
    for (let j = 0; j < 6; j++) { const y = Y + 70 + j * 28, w = 18 + (5 - Math.abs(j - 2)) * 9; x.fillStyle = j % 2 ? '#c9a25a' : '#9fae7a'; diamond(X + RCW / 2 - w, y, 12, 7); diamond(X + RCW / 2 + w, y, 12, 7); }
    x.fillStyle = '#e2d4b4'; diamond(X + RCW / 2, Y + 44, 16, 16);
    x.fillStyle = '#e6dcc4'; x.fillRect(X, Y + RCH - 24, RCW, 24);
    x.strokeStyle = 'rgba(120,100,70,0.6)'; x.lineWidth = 1; for (let k = 0; k < RCW; k += 3) { x.beginPath(); x.moveTo(X + k, Y + RCH - 24); x.lineTo(X + k + (r() - 0.5) * 2, Y + RCH); x.stroke(); }
    pile(X, Y, RCW, RCH - 24); }
  return c;
}

/** Printed game-box lids: GAME_ART abstract designs (no commercial artwork), 4 × 2 cells of 128 px. */
export const GAME_ART = 8;
function printTex() {
  const S = 128, [c, x] = canvas(S * 4, S * 2), r = mulberry32(504);
  const palettes = [['#2f5a7a', '#e8c547', '#f2ead8'], ['#7a2e2a', '#e8b06a', '#f2ead8'], ['#3f6b3a', '#c9d48a', '#2b2622'], ['#e07a3a', '#2f3f5f', '#f2ead8'],
    ['#5a3a6a', '#d8a8c8', '#f2ead8'], ['#2b2622', '#c9a14e', '#d84a3a'], ['#3a7a8a', '#f2e2b8', '#c4553d'], ['#c8a050', '#5a3a22', '#f2ead8']];
  for (let i = 0; i < GAME_ART; i++) {
    const X = (i % 4) * S, Y = Math.floor(i / 4) * S, [bg, a, b] = palettes[i];
    x.fillStyle = bg; x.fillRect(X, Y, S, S);
    x.save(); x.beginPath(); x.rect(X + 6, Y + 6, S - 12, S - 12); x.clip();
    x.fillStyle = a; x.strokeStyle = a; x.lineWidth = 4;
    switch (i) {
      case 0: for (let j = 0; j < 5; j++) for (let k = 0; k < 5; k++) { const cx = X + 16 + k * 24 + (j % 2) * 12, cy = Y + 30 + j * 20; x.beginPath(); for (let q = 0; q < 6; q++) { const t = (q / 6) * Math.PI * 2; x.lineTo(cx + Math.cos(t) * 10, cy + Math.sin(t) * 10); } x.closePath(); x.globalAlpha = r() > 0.4 ? 1 : 0.4; x.fill(); } x.globalAlpha = 1; break; // hex map
      case 1: for (let k = 0; k < 5; k++) { x.save(); x.translate(X + S / 2, Y + S * 0.8); x.rotate(-0.6 + k * 0.3); x.fillStyle = k % 2 ? a : b; x.fillRect(-14, -70, 28, 44); x.restore(); } break; // fan of cards
      case 2: x.beginPath(); x.moveTo(X, Y + S); x.lineTo(X + 40, Y + 50); x.lineTo(X + 70, Y + 80); x.lineTo(X + 100, Y + 40); x.lineTo(X + S, Y + S); x.fill(); x.fillStyle = b; x.beginPath(); x.arc(X + 96, Y + 28, 10, 0, 7); x.fill(); break; // mountains
      case 3: for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(X + 10, Y + 30 + k * 22); x.bezierCurveTo(X + 50, Y + 10 + k * 22, X + 80, Y + 60 + k * 22, X + S - 10, Y + 30 + k * 22); x.stroke(); } x.fillStyle = b; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(X + 18 + k * 19, Y + 40 + (k % 3) * 22, 5, 0, 7); x.fill(); } break; // routes
      case 4: x.fillStyle = b; for (let k = 0; k < 3; k++) { x.fillRect(X + 18 + k * 34, Y + 40, 26, 26); } x.fillStyle = a; for (let k = 0; k < 3; k++) for (let q = 0; q <= k; q++) { x.beginPath(); x.arc(X + 25 + k * 34 + q * 6, Y + 47 + q * 6, 3, 0, 7); x.fill(); } break; // dice
      case 5: x.fillRect(X + 30, Y + 56, 68, 50); for (let k = 0; k < 4; k++) x.fillRect(X + 30 + k * 20, Y + 44, 10, 14); x.fillStyle = b; x.fillRect(X + 56, Y + 80, 16, 26); break; // castle
      case 6: for (let k = 0; k < 6; k++) { x.beginPath(); for (let q = 0; q <= 16; q++) x.lineTo(X + q * 8, Y + 40 + k * 14 + Math.sin(q * 0.9 + k) * 5); x.stroke(); } x.fillStyle = b; x.beginPath(); x.moveTo(X + 50, Y + 36); x.lineTo(X + 64, Y + 6 + 10); x.lineTo(X + 64, Y + 36); x.fill(); break; // waves + sail
      case 7: for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) { x.fillStyle = (j + k) % 2 ? a : b; x.fillRect(X + 14 + k * 25, Y + 24 + j * 22, 22, 19); } break; // tiles
    }
    x.restore();
    x.fillStyle = b; x.globalAlpha = 0.9; x.fillRect(X + 10, Y + 8, S - 20, 14); x.globalAlpha = 1; // title band (no lettering)
    x.fillStyle = bg; for (let k = 0; k < 4; k++) x.fillRect(X + 16 + k * 24, Y + 13, 16, 4);
  }
  return c;
}

/**
 * One atlas for every family (DEV-04B draw-call budget: the families cost ONE extra material per area, not four).
 * Each generator authors UVs in its own sheet ([0,1]², v = 1 at the sheet's top) and `toAtlas` moves them into the
 * sheet's rectangle (canvas pixels: x, y from the top, w, h); 16 px gutters keep mip levels from bleeding.
 */
const ATLAS = 1024;
export const SHEETS = { rug: [0, 0, 320, 960], spine: [336, 0, 288, 256], print: [336, 272, 512, 256], paper: [336, 544, 256, 16] } as const;
export type Sheet = keyof typeof SHEETS;
export function toAtlas(g: THREE.BufferGeometry, sheet: Sheet) {
  const [X, Y, W, H] = SHEETS[sheet], uv = g.attributes.uv as THREE.BufferAttribute, k = 0.5 / ATLAS;
  for (let i = 0; i < uv.count; i++) {
    const u = THREE.MathUtils.clamp(uv.getX(i), 0, 1), v = THREE.MathUtils.clamp(uv.getY(i), 0, 1);
    uv.setXY(i, THREE.MathUtils.clamp((X + u * W) / ATLAS, X / ATLAS + k, (X + W) / ATLAS - k), THREE.MathUtils.clamp(1 - (Y + (1 - v) * H) / ATLAS, 1 - (Y + H) / ATLAS + k, 1 - Y / ATLAS - k));
  }
  g.userData.atlas = sheet;
  return g;
}
function atlasTex() {
  const [c, x] = canvas(ATLAS, ATLAS);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, ATLAS, ATLAS);
  const put = (src: HTMLCanvasElement, sheet: Sheet) => { const [X, Y, W, H] = SHEETS[sheet]; x.drawImage(src, X, Y, W, H); };
  put(rugTex(), 'rug'); put(spineTex(), 'spine'); put(printTex(), 'print'); put(paperTex(), 'paper');
  return tex(c);
}

export interface PropMats { props: THREE.MeshLambertMaterial; cloth: THREE.MeshLambertMaterial; paper: THREE.MeshLambertMaterial; rug: THREE.MeshLambertMaterial; print: THREE.MeshLambertMaterial }
let pm: PropMats | null = null;
/** The DEV-04B family material (Lambert, vertex colour × the atlas): one draw call per area for all the families. */
export function propMats(): PropMats {
  if (pm) return pm;
  const props = new THREE.MeshLambertMaterial({ vertexColors: true, map: atlasTex() });
  pm = { props, cloth: props, paper: props, rug: props, print: props };
  return pm;
}

// ------------------------------------------------------------------------------------------------ books
/** Size classes (height, depth) and thickness classes; covers: hard (boards overhang the block, rounded spine) or soft. */
export const BOOK_H = { small: [0.19, 0.13], medium: [0.235, 0.16], tall: [0.29, 0.2], folio: [0.36, 0.26] } as const;
export const BOOK_T = { thin: 0.02, medium: 0.032, thick: 0.048, tome: 0.07 } as const;
export type BookSize = keyof typeof BOOK_H;
export type BookThick = keyof typeof BOOK_T;
export interface BookSpec { size: BookSize; thick: BookThick; hard: boolean; design: number }
const coverT = (s: BookSpec) => (s.hard ? 0.0035 : 0.0016);
const overhang = (s: BookSpec) => (s.hard ? 0.003 : 0.0006);
export const bookDims = (s: BookSpec) => ({ h: BOOK_H[s.size][0], d: BOOK_H[s.size][1], t: BOOK_T[s.thick] });

/**
 * The cover shell of a standing book: boards + spine as one closed U-shaped solid (extruded), spine at local −z,
 * bottom at y 0. Hard covers have a rounded spine; the spine face maps to spine design `design`, everything else
 * to the plain cloth column.
 */
export function bookCoverGeo(s: BookSpec) {
  return cached(`bookCover${s.size}${s.thick}${s.hard}${s.design}`, () => {
    const { h, d, t } = bookDims(s), cb = coverT(s);
    const bulge = s.hard ? Math.min(t * 0.32, 0.011) : 0;
    const zs = -d / 2 + bulge; // where the boards' straight part meets the spine
    // plan profile (x across the thickness, z along the depth); shape y = −z so the extruded solid's z is the plan z
    const outer: [number, number][] = [[-t / 2, d / 2], [-t / 2, zs]];
    const zi = s.hard ? zs : -d / 2 + cb; // a soft cover's flat spine still has its board thickness
    const inner: [number, number][] = [[t / 2 - cb, d / 2], [t / 2 - cb, zi]];
    const curve = (rx: number, apex: number) => {
      const n = t > 0.03 ? 3 : 1, pts: [number, number][] = [];
      for (let i = 1; i <= n; i++) { const a = Math.PI - (Math.PI * i) / (n + 1); pts.push([Math.cos(a) * rx, zs - Math.sin(a) * (zs - apex)]); }
      return pts;
    };
    if (s.hard) outer.push(...curve(t / 2, -d / 2));
    outer.push([t / 2, zs], [t / 2, d / 2]);
    if (s.hard) inner.push(...curve(t / 2 - cb, -d / 2 + cb).reverse());
    inner.push([-t / 2 + cb, zi], [-t / 2 + cb, d / 2]);
    const pts = [...outer, ...inner];
    const shape = new THREE.Shape(pts.map(([px, pz]) => new THREE.Vector2(px, -pz)));
    const g0 = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 1 });
    g0.rotateX(-Math.PI / 2); // extrusion → +y; shape y (−z) → z
    const g = g0.index ? g0.toNonIndexed() : g0;
    g.computeVertexNormals();
    const p = g.attributes.position as THREE.BufferAttribute, nn = g.attributes.normal as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i += 3) {
      const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3, ny = Math.abs(nn.getY(i));
      const spine = ny < 0.5 && cz < zs + (s.hard ? -1e-4 : 1e-4) && nn.getZ(i) < -0.2;
      for (let q = 0; q < 3; q++) {
        const k = i + q;
        if (spine) uv.set([(s.design % SPINES + 0.1 + 0.8 * THREE.MathUtils.clamp(p.getX(k) / t + 0.5, 0, 1)) / SPINE_COLS, p.getY(k) / h], k * 2);
        else uv.set([(SPINES + 0.5) / SPINE_COLS, 0.3 + p.getY(k) * 0.5], k * 2);
      }
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    // smooth the rounded spine, keep the board faces flat
    return toAtlas(smoothSpine(g), 'spine');
  });
}
/** Re-normal the spine facets of a non-indexed cover so the rounding shades as a curve. */
function smoothSpine(g: THREE.BufferGeometry) {
  const sm = mergeVertices(g.clone().deleteAttribute('normal').deleteAttribute('uv'), 1e-6);
  sm.computeVertexNormals();
  const p = g.attributes.position as THREE.BufferAttribute, n = g.attributes.normal as THREE.BufferAttribute, sp = sm.attributes.position as THREE.BufferAttribute, sn = sm.attributes.normal as THREE.BufferAttribute;
  const map = new Map<string, number>();
  for (let i = 0; i < sp.count; i++) map.set(`${sp.getX(i).toFixed(5)},${sp.getY(i).toFixed(5)},${sp.getZ(i).toFixed(5)}`, i);
  for (let i = 0; i < p.count; i += 3) {
    if (Math.abs(n.getY(i)) > 0.5 || n.getZ(i) > -0.25) continue; // only the forward-facing (spine) side walls
    if (Math.abs(n.getZ(i)) > 0.999) continue; // a flat soft spine stays flat
    for (let q = 0; q < 3; q++) { const j = map.get(`${p.getX(i + q).toFixed(5)},${p.getY(i + q).toFixed(5)},${p.getZ(i + q).toFixed(5)}`); if (j != null) { const v = new THREE.Vector3(sn.getX(j), 0, sn.getZ(j)).normalize(); n.setXYZ(i + q, v.x, v.y, v.z); } }
  }
  sm.dispose();
  return g;
}
/** The paper block inside a cover: recessed by the overhang at the top, bottom and fore-edge; page lines across it. */
export function bookBlockGeo(s: BookSpec) {
  return cached(`bookBlock${s.size}${s.thick}${s.hard}`, () => {
    const { h, d, t } = bookDims(s), cb = coverT(s), ov = overhang(s), bulge = s.hard ? Math.min(t * 0.32, 0.011) : 0;
    const bw = t - 2 * cb - 0.0006, z0 = -d / 2 + Math.max(bulge, cb), z1 = d / 2 - ov, bh = h - 2 * ov;
    const g = new THREE.BoxGeometry(bw, bh, z1 - z0).toNonIndexed().translate(0, ov + bh / 2, (z0 + z1) / 2);
    const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) uv.set([p.getX(i) / 0.08 + 0.5, 0.5], i * 2);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return toAtlas(g, 'paper');
  });
}
/**
 * Shelf variant of a standing book: only the faces a shelf leaves visible (both boards' outer sides, the spine, the
 * cover's U-shaped top rim and the top of the paper block) — the bottom stands on the shelf, the fore-edge faces the
 * case's back. 14–26 triangles instead of 64; books lying flat, leaning or loose use the closed solid.
 */
export function shelfBookGeo(s: BookSpec) {
  const key = `shelfBook${s.size}${s.thick}${s.hard}${s.design}`;
  const cover = cached(key, () => {
    const { h, d, t } = bookDims(s), cb = coverT(s), bulge = s.hard ? Math.min(t * 0.32, 0.011) : 0, zs = -d / 2 + bulge;
    const prof = (rx: number, apex: number, inset: number) => {
      const pts: [number, number][] = [[-rx, d / 2], [-rx, zs]];
      const n = !s.hard ? 0 : t > 0.03 ? 3 : 1;
      for (let i = 1; i <= n; i++) { const a = Math.PI - (Math.PI * i) / (n + 1); pts.push([Math.cos(a) * rx, zs - Math.sin(a) * (zs - apex)]); }
      pts.push([rx, zs], [rx, d / 2]);
      void inset;
      return pts;
    };
    const O = prof(t / 2, -d / 2, 0), I = prof(t / 2 - cb, -d / 2 + cb, cb);
    if (!s.hard) { I[1][1] = -d / 2 + cb; I[2][1] = -d / 2 + cb; } // flat soft spine: the rim keeps the board thickness
    const pos: number[] = [], uv: number[] = [];
    const plain = [(SPINES + 0.5) / SPINE_COLS, 0.5];
    const tri = (a: number[], b: number[], c: number[], ua: number[], ub: number[], uc: number[]) => { pos.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...uc); };
    for (let k = 0; k < O.length - 1; k++) {
      const [x0, z0] = O[k], [x1, z1] = O[k + 1];
      const spine = k > 0 && k < O.length - 2;
      const u = (x: number) => (spine ? [(s.design % SPINES + 0.1 + 0.8 * THREE.MathUtils.clamp(x / t + 0.5, 0, 1)) / SPINE_COLS, 0] : plain);
      const A = [x0, 0, z0], B = [x1, 0, z1], C = [x1, h, z1], D = [x0, h, z0];
      const uA = spine ? u(x0) : plain, uB = spine ? u(x1) : plain, uC = spine ? [u(x1)[0], 1] : plain, uD = spine ? [u(x0)[0], 1] : plain;
      // outward: the profile runs fore-left → spine → fore-right, i.e. clockwise seen from above in three space
      tri(A, C, B, uA, uC, uB); tri(A, D, C, uA, uD, uC);
      // the U rim on top
      const [ix0, iz0] = I[k], [ix1, iz1] = I[k + 1];
      tri([x0, h, z0], [ix1, h, iz1], [x1, h, z1], plain, plain, plain); tri([x0, h, z0], [ix0, h, iz0], [ix1, h, iz1], plain, plain, plain);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return toAtlas(orientUp(g), 'spine');
  });
  const block = cached(`shelfBlock${s.size}${s.thick}${s.hard}`, () => {
    const { h, d, t } = bookDims(s), cb = coverT(s), ov = overhang(s), bulge = s.hard ? Math.min(t * 0.32, 0.011) : 0;
    const bw = t / 2 - cb - 0.0003, z0 = -d / 2 + Math.max(bulge, cb), z1 = d / 2 - ov, y = h - ov;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-bw, y, z0, -bw, y, z1, bw, y, z1, -bw, y, z0, bw, y, z1, bw, y, z0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0.5 - bw / 0.08, 0, 0.5 - bw / 0.08, 1, 0.5 + bw / 0.08, 1, 0.5 - bw / 0.08, 0, 0.5 + bw / 0.08, 1, 0.5 + bw / 0.08, 0], 2));
    g.computeVertexNormals();
    return toAtlas(orientUp(g), 'paper');
  });
  return { cover, block };
}
/** Make every triangle of a hand-built open shell face away from the book's vertical axis / upward (robust winding). */
function orientUp(g: THREE.BufferGeometry) {
  const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(m.subVectors(c, a));
    const ctr = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    const out = Math.abs(n.y) > Math.hypot(n.x, n.z) ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(ctr.x, 0, ctr.z + 0.0001);
    if (n.dot(out) < 0) {
      for (const at of [p, uv]) { const k = at.itemSize; for (let q = 0; q < k; q++) { const t0 = at.getComponent(i + 1, q); at.setComponent(i + 1, q, at.getComponent(i + 2, q)); at.setComponent(i + 2, q, t0); } }
    }
  }
  g.computeVertexNormals();
  return g;
}
/** Place a standing shelf book (cheap variant). */
export function addShelfBook(a: Asm, s: BookSpec, color: THREE.ColorRepresentation, lx: number, ly: number, lz: number, paper: THREE.ColorRepresentation = PAPER.aged) {
  const P = propMats(), g = shelfBookGeo(s);
  a.add(P.cloth, color, g.cover, lx, ly, lz);
  a.add(P.paper, paper, g.block, lx, ly, lz);
  return bookDims(s);
}
/** A book lying on its back cover (thickness vertical), spine toward local −z: the stacked / table orientation. */
function flat(g: THREE.BufferGeometry, key: string, s: BookSpec) {
  return cached(`${key}Flat`, () => { const { h } = bookDims(s); return g.clone().rotateZ(Math.PI / 2).translate(h / 2, bookDims(s).t / 2, 0); });
}
export const PAPER = { fresh: '#efe6d0', aged: '#ddcba4', old: '#cdb789' } as const;

/** Place one book: standing (default) or lying flat; `lean` tips a standing book about its bottom edge (radians, ±). */
export function addBook(a: Asm, s: BookSpec, color: THREE.ColorRepresentation, lx: number, ly: number, lz: number, o: { ry?: number; lean?: number; flat?: boolean; paper?: THREE.ColorRepresentation } = {}) {
  const P = propMats(), { h, t } = bookDims(s), paper = o.paper ?? PAPER.aged;
  let cover = bookCoverGeo(s), block = bookBlockGeo(s);
  if (o.flat) { cover = flat(cover, `bookCover${s.size}${s.thick}${s.hard}${s.design}`, s); block = flat(block, `bookBlock${s.size}${s.thick}${s.hard}`, s); }
  const lean = o.lean ?? 0;
  // tipped about the bottom centre: lift by the half-thickness swing so the low corner stays on the shelf
  const dy = lean ? Math.sin(Math.abs(lean)) * (t / 2) : 0;
  a.add(P.cloth, color, cover, lx, ly + dy, lz, { ry: o.ry, rz: -lean });
  a.add(P.paper, paper, block, lx, ly + dy, lz, { ry: o.ry, rz: -lean });
  return { h, t };
}

/** Deterministic spec picker for a run of books: a "set" shares size, cover and design; singles vary. */
export function bookSpec(r: Rng, o: { sizes?: BookSize[]; thick?: BookThick[]; hardShare?: number } = {}): BookSpec {
  const sizes = o.sizes ?? ['small', 'medium', 'medium', 'tall', 'tall'];
  const th = o.thick ?? ['thin', 'medium', 'medium', 'thick', 'tome'];
  return { size: sizes[Math.floor(r() * sizes.length)], thick: th[Math.floor(r() * th.length)], hard: r() < (o.hardShare ?? 0.75), design: Math.floor(r() * SPINES) };
}

/**
 * Open book (reading / lectern): two cover boards lying flat with an overhang, the page block in two halves that
 * curve up into the gutter (the spine), the outer pages a little lower. Width across both halves = 2·d, length h.
 * Spine runs along local z; origin at the bottom centre.
 */
export function openBookGeo(size: BookSize = 'medium', thick: BookThick = 'medium') {
  return cached(`openBook${size}${thick}`, () => {
    const [h, d] = BOOK_H[size], t = BOOK_T[thick], cb = 0.0035, half = t / 2 - cb;
    const parts: THREE.BufferGeometry[] = [];
    for (const s of [-1, 1]) {
      const pg = new THREE.BoxGeometry(d - 0.004, half, h - 0.006, 8, 1, 1).toNonIndexed();
      const p = pg.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = THREE.MathUtils.clamp((p.getX(i) + (d - 0.004) / 2) / (d - 0.004), 0, 1); // 0 at the gutter side … 1 at the fore-edge (before mirroring)
        const top = p.getY(i) > 0;
        const lift = top ? half * 0.9 * Math.pow(1 - u, 2.2) - 0.004 * u : 0;
        p.setY(i, p.getY(i) + half / 2 + cb + lift);
        p.setX(i, s * (0.004 + u * (d - 0.004)));
      }
      pg.computeVertexNormals();
      const uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) uv.set([Math.abs(pg.attributes.normal.getY(i)) > 0.7 ? 0.42 : p.getY(i) / 0.08 + 0.3, 0.5], i * 2);
      pg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      parts.push(s < 0 ? flipWinding(pg) : pg); // the left half is mirrored: restore its winding
    }
    const g = mergeGeometries(parts)!;
    parts.forEach((q) => q.dispose());
    return toAtlas(g, 'paper');
  });
}
/** Its cover: two boards (with the overhang) and the spine strip under the gutter. */
export function openCoverGeo(size: BookSize = 'medium') {
  return cached(`openCover${size}`, () => {
    const [h, d] = BOOK_H[size], cb = 0.0035, parts: THREE.BufferGeometry[] = [];
    for (const s of [-1, 1]) parts.push(new THREE.BoxGeometry(d + 0.003, cb, h).toNonIndexed().translate(s * (d / 2 + 0.003), cb / 2, 0));
    parts.push(new THREE.BoxGeometry(0.012, cb, h).toNonIndexed().translate(0, cb / 2 - 0.0005, 0));
    const g = mergeGeometries(parts)!;
    parts.forEach((q) => q.dispose());
    const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) uv.set([(SPINES + 0.5) / SPINE_COLS, 0.5], i * 2);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return toAtlas(g, 'spine');
  });
}
function flipWinding(g: THREE.BufferGeometry) {
  for (const name of Object.keys(g.attributes)) {
    const at = g.attributes[name] as THREE.BufferAttribute, n = at.itemSize, arr = at.array as Float32Array;
    for (let i = 0; i < at.count; i += 3) for (let k = 0; k < n; k++) { const t0 = arr[(i + 1) * n + k]; arr[(i + 1) * n + k] = arr[(i + 2) * n + k]; arr[(i + 2) * n + k] = t0; }
  }
  g.computeVertexNormals();
  return g;
}
export function addOpenBook(a: Asm, color: THREE.ColorRepresentation, lx: number, ly: number, lz: number, o: { ry?: number; rx?: number; size?: BookSize; paper?: THREE.ColorRepresentation } = {}) {
  const P = propMats();
  a.add(P.cloth, color, openCoverGeo(o.size), lx, ly, lz, { ry: o.ry, rx: o.rx });
  a.add(P.paper, o.paper ?? PAPER.aged, openBookGeo(o.size), lx, ly, lz, { ry: o.ry, rx: o.rx });
}

/** A horizontal stack (largest at the bottom, each turned a little): returns its height. */
export function addBookStack(a: Asm, r: Rng, colors: readonly string[], lx: number, ly: number, lz: number, n: number, o: { ry?: number; sizes?: BookSize[] } = {}) {
  const sizes = (o.sizes ?? ['tall', 'medium', 'medium', 'small', 'small']).slice();
  let y = ly;
  for (let i = 0; i < n; i++) {
    const s: BookSpec = { size: sizes[Math.min(i, sizes.length - 1)], thick: (['medium', 'thick', 'thin', 'medium'] as const)[Math.floor(r() * 4)], hard: r() < 0.8, design: Math.floor(r() * SPINES) };
    addBook(a, s, colors[Math.floor(r() * colors.length)], lx + (r() - 0.5) * 0.012, y, lz + (r() - 0.5) * 0.01, { flat: true, ry: (o.ry ?? 0) + (r() - 0.5) * 0.18 });
    y += bookDims(s).t;
  }
  return y - ly;
}

// ------------------------------------------------------------------------------------------------ rugs
/**
 * A rug: an 8 mm pile slab mapped to one atlas design (the design carries its own border), optional fringe at the
 * short ends; `runner` rugs tile their middle cell along the length with an end cell at each end; `oval` is a braided
 * ellipse. Laid flat at `y` (its underside), heading `yaw`, w across × d along.
 */
export function rugGeo(pattern: RugPattern, w: number, d: number, fringe = false) {
  return cached(`rug${pattern}${f3(w)}${f3(d)}${fringe}`, () => {
    const cellUV = (i: number, u: number, v: number): [number, number] => [((i % 2) + u) / 2, 1 - (Math.floor(i / 2) + v) / 4];
    const parts: THREE.BufferGeometry[] = [];
    const slab = (x0: number, x1: number, z0: number, z1: number, cell: number, v0: number, v1: number) => {
      const g = new THREE.BoxGeometry(x1 - x0, 0.008, z1 - z0).toNonIndexed().translate((x0 + x1) / 2, 0.004, (z0 + z1) / 2);
      const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        const u = THREE.MathUtils.clamp((p.getX(i) + w / 2) / w, 0.002, 0.998), t = (p.getZ(i) - z0) / (z1 - z0);
        uv.set(cellUV(cell, u, THREE.MathUtils.clamp(v0 + (v1 - v0) * t, 0.002, 0.998)), i * 2);
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      parts.push(g);
    };
    if (pattern === 'oval') {
      const seg = 28, pos: number[] = [], uv: number[] = [];
      for (let i = 0; i < seg; i++) for (const [a0, a1] of [[i, i + 1]]) {
        const t0 = (a0 / seg) * Math.PI * 2, t1 = (a1 / seg) * Math.PI * 2;
        const pts: [number, number][] = [[0, 0], [Math.cos(t1), Math.sin(t1)], [Math.cos(t0), Math.sin(t0)]];
        for (const [cx, cz] of pts) { pos.push((cx * w) / 2, 0.006, (cz * d) / 2); uv.push(...cellUV(RUG.oval, 0.5 + cx * 0.497, 0.5 + cz * 0.497)); }
        // the rim (a 6 mm edge)
        for (const [cx, cz, y] of [[Math.cos(t0), Math.sin(t0), 0.006], [Math.cos(t1), Math.sin(t1), 0.006], [Math.cos(t1), Math.sin(t1), 0], [Math.cos(t0), Math.sin(t0), 0.006], [Math.cos(t1), Math.sin(t1), 0], [Math.cos(t0), Math.sin(t0), 0]] as const) { pos.push((cx * w) / 2, y, (cz * d) / 2); uv.push(...cellUV(RUG.oval, 0.5 + cx * 0.49, 0.5 + cz * 0.49)); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      parts.push(g);
    } else if (pattern === 'runner') {
      const L = w * 1.5, ends = Math.min(L, d / 2), mid = d - 2 * ends, n = Math.max(0, Math.round(mid / L)), seg = n ? mid / n : 0;
      slab(-w / 2, w / 2, -d / 2, -d / 2 + ends, RUG.runnerEnd, 0, ends / L);
      for (let i = 0; i < n; i++) slab(-w / 2, w / 2, -d / 2 + ends + i * seg, -d / 2 + ends + (i + 1) * seg, RUG.runner, 0, seg / L);
      slab(-w / 2, w / 2, d / 2 - ends, d / 2, RUG.runnerEnd, ends / L, 0);
    } else slab(-w / 2, w / 2, -d / 2, d / 2, RUG[pattern], 0, 1);
    if (fringe && pattern !== 'oval') for (const s of [-1, 1]) {
      const g = new THREE.PlaneGeometry(w - 0.04, 0.05).rotateX(-Math.PI / 2).translate(0, 0.002, s * (d / 2 + 0.025));
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, ...cellUV(RUG.hanging, 0.05 + uv.getX(i) * 0.9, s > 0 ? 1 - uv.getY(i) * (22 / RCH) : 1 - (1 - uv.getY(i)) * (22 / RCH)));
      parts.push(g.toNonIndexed());
    }
    const g = mergeGeometries(parts.map((q) => { for (const k of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(k)) q.deleteAttribute(k); return q; }))!;
    parts.forEach((q) => q.dispose());
    return toAtlas(g, 'rug');
  });
}

// ------------------------------------------------------------------------------------------------ game boxes
/**
 * A board-game box: a base tray and a lid that overlaps it by 2 cm (the lid edge shows as a step), the printed lid
 * top mapped to one of GAME_ART designs, the lid's sides a band of its colour. `open`: the lid stands leaning
 * beside the base and the base shows a card deck and a token tray.
 */
export function gameLidGeo(w: number, d: number, h: number, art: number) {
  return cached(`gameLid${f3(w)}${f3(d)}${f3(h)}${art}`, () => {
    const g = softBox(w, h, d, 0.003, 1, 1).toNonIndexed();
    const p = g.attributes.position as THREE.BufferAttribute, n = g.attributes.normal as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
    const cu = (art % 4) / 4, cv = 1 - (Math.floor(art / 4) + 1) / 2;
    for (let i = 0; i < p.count; i++) {
      if (n.getY(i) > 0.7) uv.set([cu + (0.02 + 0.96 * (p.getX(i) / w + 0.5)) / 4, cv + (0.02 + 0.96 * (0.5 - p.getZ(i) / d)) / 2], i * 2);
      else uv.set([cu + 0.02 / 4, cv + 0.5 / 2], i * 2); // the lid sides take the design's background colour
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return toAtlas(g, 'print');
  });
}
export interface GameBox { w: number; d: number; h: number; art: number; base: string }
export const GAME_BOXES: GameBox[] = [
  { w: 0.3, d: 0.3, h: 0.075, art: 0, base: '#2a3a4a' }, { w: 0.4, d: 0.27, h: 0.07, art: 3, base: '#7a3a1a' },
  { w: 0.29, d: 0.29, h: 0.1, art: 5, base: '#2b2622' }, { w: 0.18, d: 0.12, h: 0.045, art: 1, base: '#5a1e1a' },
  { w: 0.38, d: 0.26, h: 0.06, art: 6, base: '#1f4a54' }, { w: 0.27, d: 0.19, h: 0.055, art: 4, base: '#3a2a4a' },
  { w: 0.32, d: 0.22, h: 0.085, art: 2, base: '#2a3a24' }, { w: 0.24, d: 0.24, h: 0.06, art: 7, base: '#6a4a1a' },
];
export function addGameBox(a: Asm, b: GameBox, lx: number, ly: number, lz: number, o: { ry?: number; open?: boolean } = {}) {
  const M = artMats(), P = propMats(), lidH = Math.min(0.03, b.h * 0.45);
  const base = cached(`gameBase${f3(b.w)}${f3(b.d)}${f3(b.h)}`, () => projectUV(softBox(b.w - 0.006, b.h - 0.004, b.d - 0.006, 0.002, 1, 1), 1));
  if (!o.open) {
    a.add(M.paint, b.base, base, lx, ly + (b.h - 0.004) / 2, lz, { ry: o.ry });
    a.add(P.print, '#ffffff', gameLidGeo(b.w, b.d, lidH, b.art), lx, ly + b.h - lidH / 2, lz, { ry: o.ry });
    return b.h;
  }
  // open: the base with its insert (a card deck, a tray of tokens), the lid propped up behind it
  a.add(M.paint, b.base, base, lx, ly + (b.h - 0.004) / 2, lz, { ry: o.ry });
  a.add(M.paint, '#e8dcc0', cached(`gameInsert${f3(b.w)}${f3(b.d)}`, () => new THREE.BoxGeometry(b.w - 0.03, 0.004, b.d - 0.03)), lx, ly + b.h - 0.01, lz, { ry: o.ry });
  a.add(M.paint, '#f2ead8', cached('cardDeck', () => projectUV(softBox(0.063, 0.03, 0.088, 0.003, 1, 1), 1)), lx - b.w * 0.2, ly + b.h - 0.008 + 0.015, lz, { ry: o.ry });
  for (let i = 0; i < 6; i++) a.add(M.ceramic, ['#c4553d', '#3f6fa8', '#e8c547', '#4f8a3a'][i % 4], cached('token', () => lathe([[0.001, 0], [0.011, 0], [0.011, 0.008], [0.001, 0.008]], 8)), lx + b.w * 0.12 + (i % 3) * 0.03, ly + b.h - 0.008, lz + (Math.floor(i / 3) - 0.5) * 0.04, { ry: o.ry });
  return b.h;
}

// ------------------------------------------------------------------------------------------------ bottles + groceries
/** Bottle family (lathe: body, shoulder, neck, lip; the cap / crown is separate). Heights in metres. */
export const BOTTLES = {
  beer: [[0.001, 0], [0.03, 0], [0.032, 0.004], [0.032, 0.15], [0.026, 0.185], [0.0135, 0.205], [0.0125, 0.235], [0.0145, 0.24], [0.001, 0.24]],
  wine: [[0.001, 0], [0.036, 0], [0.038, 0.006], [0.038, 0.2], [0.03, 0.235], [0.015, 0.255], [0.014, 0.3], [0.016, 0.31], [0.001, 0.31]],
  squat: [[0.001, 0], [0.045, 0], [0.047, 0.006], [0.047, 0.12], [0.03, 0.15], [0.016, 0.16], [0.015, 0.19], [0.018, 0.195], [0.001, 0.195]],
  jar: [[0.001, 0], [0.045, 0], [0.047, 0.005], [0.047, 0.11], [0.04, 0.125], [0.04, 0.135], [0.001, 0.135]],
  milk: [[0.001, 0], [0.033, 0], [0.035, 0.005], [0.035, 0.13], [0.022, 0.17], [0.018, 0.2], [0.02, 0.205], [0.001, 0.205]],
} as const;
export type BottleKind = keyof typeof BOTTLES;
export const bottleGeoOf = (k: BottleKind) => cached(`bottle.${k}`, () => lathe(BOTTLES[k].map(([r, y]) => [r, y]) as [number, number][], 8));
export const capGeo = () => cached('crownCap', () => new THREE.CylinderGeometry(0.0155, 0.0155, 0.008, 8, 1).translate(0, 0.004, 0));
export const bottleTop = (k: BottleKind) => BOTTLES[k][BOTTLES[k].length - 1][1];

/**
 * A crate of beer: an open-topped plastic crate (walls with hand-grip slots, a moulded rim, cell dividers) holding
 * 4 × 6 brown bottles standing on its floor with crown caps; the shoulders and necks rise above the dividers. One
 * bottle may be missing. 0.42 × 0.3 (local x × z), 0.29 high.
 */
export function addBeerCrate(a: Asm, color: THREE.ColorRepresentation, lx: number, ly: number, lz: number, o: { ry?: number; missing?: number[]; glass?: string; cap?: string; covered?: boolean } = {}) {
  const M = artMats(), W = 0.42, D = 0.3, H = 0.29, t = 0.012, dk = new THREE.Color(color).multiplyScalar(0.72);
  const rot = o.ry ?? 0, cs = Math.cos(rot), sn = Math.sin(rot);
  const at = (dx: number, dz: number): [number, number] => [lx + dx * cs + dz * sn, lz - dx * sn + dz * cs];
  const wall = (w: number, d: number, h: number) => cached(`bcWall${f3(w)}${f3(d)}${f3(h)}`, () => projectUV(new THREE.BoxGeometry(w, h, d).toNonIndexed(), 1));
  const P = (g: THREE.BufferGeometry, col: THREE.ColorRepresentation, dx: number, dy: number, dz: number, mat: THREE.Material = M.paint) => { const [x, z] = at(dx, dz); a.add(mat, col, g, x, ly + dy, z, { ry: rot }); };
  P(wall(W - 2 * t, D - 2 * t, 0.012), dk, 0, 0.006, 0); // floor
  for (const s of [-1, 1]) {
    P(wall(W, t, H - 0.07), color, 0, (H - 0.07) / 2, s * (D / 2 - t / 2)); // long walls (lower part)
    P(wall(t, D - 2 * t, H - 0.07), color, s * (W / 2 - t / 2), (H - 0.07) / 2, 0); // short walls (lower part)
    // upper band with the grip slot: two posts each side of the slot on the short walls, solid on the long walls
    P(wall(W, t, 0.07), color, 0, H - 0.035, s * (D / 2 - t / 2));
    for (const q of [-1, 1]) P(wall(t, (D - 2 * t - 0.12) / 2, 0.07), color, s * (W / 2 - t / 2), H - 0.035, q * ((D - 2 * t) / 4 + 0.03));
    P(wall(t, 0.12, 0.022), color, s * (W / 2 - t / 2), H - 0.011, 0); // bar over the grip slot
    P(wall(0.016, 0.1, 0.012), dk, s * (W / 2 - t - 0.008), H - 0.05, 0); // the grip's inner lip
  }
  P(wall(W + 0.006, 0.01, 0.012), dk, 0, H - 0.006, -D / 2 + 0.005); P(wall(W + 0.006, 0.01, 0.012), dk, 0, H - 0.006, D / 2 - 0.005);
  // dividers (a grid of thin walls up to 0.17)
  const cw = (W - 2 * t) / 6, cd = (D - 2 * t) / 4;
  for (let i = 1; i < 6; i++) P(wall(0.004, D - 2 * t, 0.17), dk, -W / 2 + t + i * cw, 0.012 + 0.085, 0);
  for (let j = 1; j < 4; j++) P(wall(W - 2 * t, 0.004, 0.17), dk, 0, 0.012 + 0.085, -D / 2 + t + j * cd);
  // bottles: only what can be seen is built — the shoulder and neck above the dividers (a crate under another
  // crate shows none); a missing bottle leaves its cell empty down to the dark floor
  if (o.covered) return H;
  const miss = new Set(o.missing ?? []);
  const neck = cached('beerNeck', () => lathe([[0.001, 0.13], [0.0315, 0.13], [0.032, 0.15], [0.026, 0.185], [0.0135, 0.205], [0.0125, 0.234], [0.0145, 0.24], [0.001, 0.24]], 8));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
    if (miss.has(i * 4 + j)) continue;
    const dx = -W / 2 + t + cw * (i + 0.5), dz = -D / 2 + t + cd * (j + 0.5);
    P(neck, o.glass ?? '#5a3414', dx, 0.012, dz, M.ceramic);
    P(capGeo(), o.cap ?? '#c9a14e', dx, 0.012 + bottleTop('beer'), dz, M.brass);
  }
  return H;
}

/** Groceries for an open crate: produce, loaves, cartons, tins and bottles packed onto its floor (not identical). */
export type CrateLoad = 'apples' | 'oranges' | 'potatoes' | 'veg' | 'bread' | 'pantry' | 'drinks' | 'mixed';
export function addCrateLoad(a: Asm, load: CrateLoad, seed: number, lx: number, floorY: number, lz: number, o: { ry?: number; w?: number; d?: number; topY?: number } = {}) {
  const M = artMats(), r = mulberry32(seed), W = (o.w ?? 0.36) - 0.02, D = (o.d ?? 0.56) - 0.02, top = (o.topY ?? floorY + 0.25) - floorY;
  const rot = o.ry ?? 0, cs = Math.cos(rot), sn = Math.sin(rot);
  const put = (mat: THREE.Material, col: THREE.ColorRepresentation, g: THREE.BufferGeometry, dx: number, dy: number, dz: number, q: { rx?: number; ry?: number; rz?: number; s?: [number, number, number] } = {}) =>
    a.add(mat, col, g, lx + dx * cs + dz * sn, floorY + dy, lz - dx * sn + dz * cs, { ...q, ry: rot + (q.ry ?? 0) });
  const fruit = (rad: number) => cached(`fruit${f3(rad)}`, () => new THREE.SphereGeometry(rad, 6, 4)); // 36 triangles: round enough at crate distance
  // a heap: the crate is filled up to `fill` of its depth; only what can be seen is built — a bed at the fill level
  // (the shadowed produce underneath) and the top layer on it, crowned in the middle
  const pile = (rad: number, cols: string[], fill: number) => {
    const fy = Math.max(0, top * fill - rad * 1.7);
    if (fy > 0.01) put(M.paint, new THREE.Color(cols[0]).multiplyScalar(0.45), cached(`bed${f3(W)}${f3(D)}${f3(fy)}`, () => new THREE.BoxGeometry(W - 0.004, fy, D - 0.004).toNonIndexed()), 0, fy / 2, 0);
    const nx = Math.max(1, Math.floor(W / (rad * 2.02))), nz = Math.max(1, Math.floor(D / (rad * 2.02)));
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < nx - layer; i++) for (let j = 0; j < nz - layer; j++) {
      const dx = -W / 2 + rad + (i + layer * 0.5) * ((W - 2 * rad) / Math.max(1, nx - 1)), dz = -D / 2 + rad + (j + layer * 0.5) * ((D - 2 * rad) / Math.max(1, nz - 1));
      if (layer && (Math.abs(dx) > W * 0.3 || Math.abs(dz) > D * 0.32 || r() < 0.25)) continue;
      put(M.paint, new THREE.Color(cols[Math.floor(r() * cols.length)]).multiplyScalar(0.9 + r() * 0.2), fruit(rad * (0.9 + r() * 0.15)), dx + (r() - 0.5) * rad * 0.2, fy + rad * 0.92 + layer * rad * 1.45, dz + (r() - 0.5) * rad * 0.2, { ry: r() * 6 });
    }
  };
  switch (load) {
    case 'apples': pile(0.04, ['#b8382a', '#c8502e', '#8aa040', '#a8302a'], 0.95); break;
    case 'oranges': pile(0.042, ['#e8902a', '#e0a030', '#d8802a'], 0.9); break;
    case 'potatoes': pile(0.035, ['#b8955a', '#a8844a', '#c4a46a'], 0.85); break;
    case 'veg': { // leeks lying along the crate, a cabbage, carrots
      for (let i = 0; i < 4; i++) { put(M.paint, '#e8e4cc', cached('leek', () => lathe([[0.001, 0], [0.018, 0.01], [0.02, 0.2], [0.022, 0.24], [0.001, 0.25]], 7).rotateX(Math.PI / 2).translate(0, 0, -0.12)), -W / 2 + 0.05 + i * 0.045, 0.022, -0.02, { ry: (r() - 0.5) * 0.2 }); put(M.paint, '#4f7a34', cached('leekTop', () => lathe([[0.001, 0], [0.024, 0], [0.03, 0.18], [0.001, 0.2]], 6).rotateX(Math.PI / 2).translate(0, 0, 0.12)), -W / 2 + 0.05 + i * 0.045, 0.024, -0.02, { ry: (r() - 0.5) * 0.2 }); }
      put(M.paint, '#7a9a4a', cached('cabbage', () => new THREE.IcosahedronGeometry(0.075, 1)), W / 2 - 0.09, 0.07, D / 2 - 0.12);
      for (let i = 0; i < 5; i++) put(M.paint, '#d8722a', cached('carrot', () => new THREE.ConeGeometry(0.014, 0.15, 6).rotateZ(Math.PI / 2)), W / 2 - 0.1, 0.016 + (i % 2) * 0.02, -D / 2 + 0.08 + i * 0.03, { ry: (r() - 0.5) * 0.5 });
      break; }
    case 'bread': for (let i = 0; i < 3; i++) put(M.paint, ['#c08a4a', '#a8743a', '#d0a060'][i], cached('loaf', () => projectUV(cushion(0.12, 0.08, 0.22, 0.04, 0.03, 'top', 1, 2), 0.25)), -W / 2 + 0.07 + i * 0.11, 0.04, (r() - 0.5) * 0.1, { ry: (r() - 0.5) * 0.3 });
      put(M.paint, '#e2d2a8', cached('paperBag', () => projectUV(softBox(0.14, 0.24, 0.09, 0.01, 1, 1), 1)), W / 2 - 0.08, 0.12, D / 2 - 0.08, { rz: 0.06 }); break;
    case 'pantry': for (let i = 0; i < 6; i++) { const dx = -W / 2 + 0.05 + (i % 3) * 0.12, dz = -D / 2 + 0.1 + Math.floor(i / 3) * 0.2; if (i % 2) put(M.brass, '#b8b8b0', cached('tin', () => new THREE.CylinderGeometry(0.037, 0.037, 0.11, 10).translate(0, 0.055, 0)), dx, 0.012, dz); else put(M.paint, ['#e8dcc0', '#c4553d', '#3f6fa8'][i % 3], cached('carton', () => projectUV(softBox(0.07, 0.19, 0.05, 0.004, 1, 1), 1).translate(0, 0.095, 0)), dx, 0.012, dz, { ry: r() * 0.4 }); }
      put(M.paint, '#f2ead8', cached('flourBag', () => projectUV(cushion(0.13, 0.2, 0.09, 0.03, 0.01, 'top', 1, 3), 0.25).translate(0, 0.1, 0)), W / 2 - 0.08, 0.012, D / 2 - 0.1); break;
    case 'drinks': for (let i = 0; i < 6; i++) { const k: BottleKind = i % 3 === 2 ? 'milk' : 'wine'; put(M.ceramic, k === 'milk' ? '#efe9dc' : ['#2f5a2a', '#5a1e1e'][i % 2], bottleGeoOf(k), -W / 2 + 0.05 + (i % 3) * 0.12, 0.012, -D / 2 + 0.1 + Math.floor(i / 3) * 0.2); } break;
    case 'mixed': pile(0.04, ['#b8382a', '#8aa040'], 0.35); put(M.paint, '#c08a4a', cached('loaf', () => projectUV(cushion(0.12, 0.08, 0.22, 0.04, 0.03, 'top', 1, 2), 0.25)), 0.06, 0.1, 0.12, { ry: 0.3, rz: 0.15 }); put(M.paint, '#c4553d', cached('carton', () => projectUV(softBox(0.07, 0.19, 0.05, 0.004, 1, 1), 1).translate(0, 0.095, 0)), -0.1, 0.012, 0.18, { ry: 0.2 }); break;
  }
}

/**
 * Red plastic shopping crate (0.6 × 0.4 × 0.3), long side along local z: floor, ribbed walls with slots between the
 * ribs, a rolled rim, a hand-grip slot in each short side (the DEV-03 crate). `load` fills it; a crate with another
 * crate on top (`covered`) carries nothing visible.
 */
export function addShoppingCrate(a: Asm, lx: number, ly: number, lz: number, o: { ry?: number; load?: CrateLoad; seed?: number; color?: string } = {}) {
  const M = artMats(), red = o.color ?? '#c8322a', dk = new THREE.Color(red).multiplyScalar(0.6);
  const rot = o.ry ?? 0, cs = Math.cos(rot), sn = Math.sin(rot);
  const bx = (w: number, h: number, d: number) => cached(`scBx${f3(w)}${f3(h)}${f3(d)}`, () => projectUV(new THREE.BoxGeometry(w, h, d).toNonIndexed(), 1));
  const P = (g: THREE.BufferGeometry, col: THREE.ColorRepresentation, dx: number, dy: number, dz: number) => a.add(M.paint, col, g, lx + dx * cs + dz * sn, ly + dy, lz - dx * sn + dz * cs, { ry: rot });
  P(bx(0.38, 0.02, 0.58), dk, 0, 0.01, 0);
  for (const s2 of [-1, 1]) {
    P(bx(0.4, 0.035, 0.02), red, 0, 0.2875, s2 * 0.29);
    P(bx(0.02, 0.035, 0.6), red, s2 * 0.19, 0.2875, 0);
    for (const yy of [0.025, 0.115, 0.2]) { P(bx(0.4, 0.04, 0.016), red, 0, yy, s2 * 0.292); P(bx(0.016, 0.04, 0.6), red, s2 * 0.192, yy, 0); }
    // corner posts on the long sides, one centre post on each side (the ends had a second, doubled post at each corner)
    P(bx(0.04, 0.3, 0.018), red, 0, 0.15, s2 * 0.291);
    for (const q of [-1, 0, 1]) P(bx(0.018, 0.3, 0.04), red, s2 * 0.191, 0.15, q * 0.27);
    P(bx(0.12, 0.035, 0.022), '#3a1210', 0, 0.245, s2 * 0.294);
  }
  if (o.load) addCrateLoad(a, o.load, o.seed ?? 1, lx, ly + 0.02, lz, { ry: rot, w: 0.36, d: 0.56, topY: ly + 0.28 });
}

// ------------------------------------------------------------------------------------------------ bedding
/**
 * A soft sheet (duvet, turned-down band, throw) lying on a block whose top is at y 0 and whose half-width is `hx`:
 * flat on the top, it rolls over the long edges with a centre-line radius just over half its thickness and hangs
 * `drop` metres down the sides; past `footZ` (if given) it rolls over the foot end the same way. The bend is applied
 * to the sheet's centre surface with every vertex kept at its offset along the bent normal, so the sheet keeps its
 * thickness (no folded-flat or self-intersecting edges). Plan frame: z runs from `z0` toward the foot (+z); the
 * result is mirrored into the art-kit frame (forward = −z). Pure geometry (tests use it).
 */
export function drapeGeo(hx: number, z0: number, z1: number, t: number, drop: number, footZ: number | null = null, footDrop = drop) {
  const Rc = t / 2 + 0.008, arc = (Rc * Math.PI) / 2;
  const sideL = arc + Math.max(0, drop - Rc), footL = footZ == null ? 0 : arc + Math.max(0, footDrop - Rc);
  const zEnd = footZ == null ? z1 : footZ + footL;
  // stations: dense through the rolls, sparse on the flat
  const half = [0, hx * 0.5, hx * 0.85, hx, hx + arc * 0.34, hx + arc * 0.67, hx + arc, hx + sideL];
  const xs = [...half.slice(1).reverse().map((v) => -v), ...half];
  const zs: number[] = [];
  const flatEnd = footZ ?? zEnd, nf = Math.max(1, Math.round((flatEnd - z0) / 0.45));
  for (let i = 0; i <= nf; i++) zs.push(z0 + ((flatEnd - z0) * i) / nf);
  if (footZ != null) for (const q of [arc * 0.34, arc * 0.67, arc, footL]) zs.push(footZ + q);
  const bend = (u: number, off: number): [number, number] => {
    if (u <= 0) return [u, t / 2 + off];
    if (u <= arc) { const th = u / Rc; return [(Rc + off) * Math.sin(th), t / 2 - Rc + (Rc + off) * Math.cos(th)]; }
    return [Rc + off, t / 2 - Rc - (u - arc)];
  };
  const P = (x: number, z: number, off: number): [number, number, number] => {
    let X = x, Y = t / 2 + off, Z = z;
    const ax = Math.abs(x) - hx;
    if (ax > 0) { const [o, yy] = bend(ax, off); X = Math.sign(x) * (hx + o); Y = yy; }
    if (footZ != null && z > footZ) { const [o, yy] = bend(z - footZ, Y - t / 2); Z = footZ + o; Y = yy; }
    return [X, Y, -Z]; // into the art-kit frame (forward = −z)
  };
  const pos: number[] = [], idx: number[] = [], nx = xs.length, nz = zs.length;
  const grid = (off: number) => { const base = pos.length / 3; for (const z of zs) for (const x of xs) pos.push(...P(x, z, off)); return base; };
  const top = grid(t / 2), bot = grid(-t / 2);
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a0 = j * nx + i, a1 = a0 + 1, b0 = a0 + nx, b1 = b0 + 1;
    idx.push(top + a0, top + a1, top + b1, top + a0, top + b1, top + b0); // after the z mirror these face up
    idx.push(bot + a0, bot + b1, bot + a1, bot + a0, bot + b0, bot + b1);
  }
  // hem walls round the perimeter (own vertices: crisp edge)
  const ring: number[] = [];
  for (let i = 0; i < nx; i++) ring.push(i); for (let j = 1; j < nz; j++) ring.push(j * nx + nx - 1);
  for (let i = nx - 2; i >= 0; i--) ring.push((nz - 1) * nx + i); for (let j = nz - 2; j > 0; j--) ring.push(j * nx);
  for (let k = 0; k < ring.length; k++) {
    const q0 = ring[k], q1 = ring[(k + 1) % ring.length], vb = pos.length / 3;
    for (const q of [top + q0, top + q1, bot + q1, bot + q0]) pos.push(pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]);
    idx.push(vb, vb + 2, vb + 1, vb, vb + 3, vb + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const out = g.toNonIndexed();
  out.computeVertexNormals();
  // smooth normals for the cloth surfaces (from the indexed version), flat for the hem
  const sm = g.attributes.normal as THREE.BufferAttribute, on = out.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < idx.length; i++) if (idx[i] < 2 * nx * nz) on.setXYZ(i, sm.getX(idx[i]), sm.getY(idx[i]), sm.getZ(idx[i]));
  g.dispose();
  return projectUV(out, 0.25);
}
