// DEV-04D D3 Asset Track 01: isolated asset review (asset-review.html, dev tooling only; not in the game build, never
// reads or writes a save). It builds ONE asset (a Track 01 candidate or the current production piece) on a neutral
// stage — a plastered wall and a floor, or a bedside top against a wall — and renders it with one of three treatments:
//   standard  the ART-01 interior treatment as the game applies it indoors (Env.update at indoor = 1, dusk 0: interior
//             sky / bounce hemisphere at 0.93, the un-shadowed sun at half strength, one fixture point light with the
//             interior gain 1.7, ACES at exposure 1.15); shared art materials with their authored surfaces;
//   neutral   even white light, Neutral tone mapping, maps removed, vertex colour kept (material breakup only);
//   clay      one grey Lambert, no maps, no vertex colour (form and construction only).
// The capture script (scripts/d3b-asset-views.mjs) drives it through window.__ar.
import * as THREE from 'three';
import { Batcher, getKit, planMatrix } from '../world/kit';
import { makeCtx } from '../world/arch';
import { CollisionWorld } from '../player/collision';
import { artMats } from '../world/artkit';
import { S3_BUILDERS } from '../world/d2props';
import { PROP3D } from '../content/props3d';
import { T01_BUILDERS } from '../world/d3bAssets';
import { FLW_EXPOSURE } from '../world/furniture';

type Mode = 'standard' | 'neutral' | 'clay';
type V3 = [number, number, number];
export interface Shot {
  /** FLW id */
  asset?: string;
  /** Track 01 candidate or current production piece */
  variant?: 't01' | 'prod';
  /** presentation scale (Track 01 builders only) */
  scale?: number;
  /** piece anchor height above the floor (wall pieces: centre; surface pieces: support top) */
  h?: number;
  /** 2D framed preview instead of a 3D asset */
  art?: { src: string; w: number; h: number; rail: number; railCol: string; px: number };
  mode?: Mode;
  stage?: 'wall' | 'bedside' | 'none';
  cam: V3;
  look: V3;
  fov?: number;
}

const canvas = document.getElementById('c') as HTMLCanvasElement;
const label = document.getElementById('label')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 200);
let scene = new THREE.Scene();
const texCache = new Map<string, Promise<THREE.Texture>>();

// interior light values, as Env.update computes them at indoor = 1, dusk = 0 (env.ts A / IN tables)
const HEMI_SKY = new THREE.Color('#cbd9ea').lerp(new THREE.Color('#ece3d4'), 0.7);
const HEMI_GROUND = new THREE.Color('#6c5b40').lerp(new THREE.Color('#8c6a48'), 0.7);

function lights(s: THREE.Scene, mode: Mode, h: number) {
  if (mode === 'standard') {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    s.add(new THREE.HemisphereLight(HEMI_SKY, HEMI_GROUND, 1.5 * (1 - 0.38)));
    const sun = new THREE.DirectionalLight('#ffe9c4', 2.55 * 0.5); // a window to the left, high
    sun.position.set(-4, h + 4, 3.5);
    s.add(sun);
    const fix = new THREE.PointLight(0xffc77a, 3 * 1.7, 8, 1.6); // one wall fixture to the right, LightPool gain 1.7
    fix.position.set(2.6, Math.max(2.2, h + 0.8), 2.6);
    s.add(fix);
  } else {
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    s.add(new THREE.HemisphereLight('#ffffff', '#9a9a9a', 1.7));
    const key = new THREE.DirectionalLight('#ffffff', 1.0);
    key.position.set(-1.5, h + 2.5, 4);
    s.add(key);
  }
}

function stage(b: Batcher, kind: Shot['stage'], h: number) {
  if (kind === 'none') return;
  const k = getKit();
  const add = (mat: THREE.Material, color: string, sx: number, sy: number, sz: number, x: number, y: number, z: number) =>
    b.add(mat, new THREE.BoxGeometry(sx, sy, sz), planMatrix(x, y, z, 0), color, 'stage', false, 0);
  const wallZ = kind === 'bedside' ? 0.35 : 0; // plan z of the wall face (the piece faces plan −z = three +z)
  add(k.M.plaster, '#f3e9d4', 40, 6, 0.2, 0, 3, wallZ + 0.1); // the gallery / room plaster
  add(k.M.wood, '#7a4a2c', 40, 0.1, 24, 0, -0.05, wallZ - 12); // floor boards
  add(k.M.paint, '#e2d6bc', 40, 0.12, 0.03, 0, 0.06, wallZ - 0.015); // skirting
  if (kind === 'bedside') {
    const M = artMats();
    add(M.timber, '#3a2a1e', 0.46, 0.04, 0.4, 0, h - 0.02, 0); // the bedside top (production bedside wood)
    add(M.timber, '#3a2a1e', 0.42, h - 0.04, 0.36, 0, (h - 0.04) / 2, 0.01);
  }
}

function texture(src: string, px: number) {
  const key = `${src}|${px}`;
  if (!texCache.has(key)) texCache.set(key, (async () => {
    // the same resample the FLW atlas build applies (aspect kept, high-quality smoothing, long side = px)
    const img = new Image(); img.src = src; await img.decode();
    const s = px / Math.max(img.width, img.height), c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    const x = c.getContext('2d')!; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  })());
  return texCache.get(key)!;
}

async function framedArt(s: THREE.Scene, b: Batcher, a: NonNullable<Shot['art']>, h: number) {
  const M = artMats(), d = 0.035, r = a.rail, z = -0.0;
  for (const [sx, sy, x, y] of [[a.w + 2 * r, r, 0, h + a.h / 2 + r / 2], [a.w + 2 * r, r, 0, h - a.h / 2 - r / 2], [r, a.h, -a.w / 2 - r / 2, h], [r, a.h, a.w / 2 + r / 2, h]] as const)
    b.add(M.timber, new THREE.BoxGeometry(sx, sy, d), planMatrix(x, y, z - d / 2, 0), a.railCol, 'art', true, 0);
  const t = await texture(a.src, a.px);
  // the canvas: MeshLambert with the image, as the production atlas material (a Lambert page lit like the wall)
  const mat = new THREE.MeshLambertMaterial({ map: t });
  mat.color.setScalar(FLW_EXPOSURE); // the production FLW atlas material's albedo gain (furniture.ts flwAtlas)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.h), mat);
  m.position.set(0, h, 0.012);
  m.userData.asset = true;
  s.add(m);
}

/** Build the asset into its own batcher; returns the anchor transform used. */
function asset(b: Batcher, shot: Shot, h: number) {
  const id = shot.asset!, sc = shot.scale ?? 1;
  if (shot.variant === 'prod') {
    // the production builder places the piece at its world anchor: build it there, then move that anchor onto ours
    const p = PROP3D[id], ctx = makeCtx(new CollisionWorld(), 'asset', b);
    S3_BUILDERS[id](ctx);
    return new THREE.Matrix4().multiplyMatrices(planMatrix(0, h, 0, Math.PI).clone(), planMatrix(p.x, p.y, p.z, p.yaw).clone().invert());
  }
  const def = T01_BUILDERS[id as keyof typeof T01_BUILDERS];
  def.build(b, 'asset', 0, h, 0, Math.PI, sc); // facing plan −z = three +z: towards the review camera
  return new THREE.Matrix4();
}

function applyMode(s: THREE.Scene, mode: Mode) {
  if (mode === 'standard') return;
  const cache = new Map<string, THREE.Material>();
  s.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.material || Array.isArray(m.material)) return;
    const src = m.material as THREE.MeshLambertMaterial;
    const keepMap = mode === 'neutral' && m.userData.asset && !!src.map && !src.vertexColors; // 2D canvases keep their image in neutral
    const vc = mode === 'neutral' && !!src.vertexColors, key = `${vc}|${keepMap ? src.uuid : ''}`;
    if (!cache.has(key)) {
      const c = src.clone();
      if (!keepMap) c.map = null;
      c.vertexColors = vc;
      if ((c as THREE.MeshLambertMaterial).color) (c as THREE.MeshLambertMaterial).color.set(mode === 'clay' ? '#bdb6ab' : '#ffffff');
      if ((c as unknown as THREE.MeshPhongMaterial).specular) (c as unknown as THREE.MeshPhongMaterial).specular.set('#222222');
      c.needsUpdate = true;
      cache.set(key, c);
    }
    m.material = cache.get(key)!;
  });
}

async function show(shot: Shot) {
  scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#2b2118');
  const mode = shot.mode ?? 'standard', h = shot.h ?? 1.65;
  lights(scene, mode, h);
  const sb = new Batcher();
  stage(sb, shot.stage ?? 'wall', h);
  sb.build(scene, false);
  const ab = new Batcher(), group = new THREE.Group();
  let assetMeshes: THREE.Mesh[] = [];
  if (shot.art) await framedArt(scene, ab, shot.art, h);
  if (shot.asset) group.matrix.copy(asset(ab, shot, h));
  group.matrixAutoUpdate = false;
  scene.add(group);
  assetMeshes = ab.build(group, false);
  assetMeshes.forEach((m) => (m.userData.asset = true));
  // cost of the asset alone (what it would add to a room chunk): triangles and the shared materials it batches into
  let tris = 0;
  const mats = new Set<string>();
  for (const m of assetMeshes) {
    const g = m.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    const mm = m.material as THREE.Material;
    mats.add(mm.userData.surface ?? mm.type);
  }
  applyMode(scene, mode);
  const w = window.innerWidth, hh = window.innerHeight;
  renderer.setSize(w, hh, false);
  camera.aspect = w / hh;
  camera.fov = shot.fov ?? 68;
  camera.position.set(...shot.cam);
  camera.lookAt(new THREE.Vector3(...shot.look));
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  renderer.getContext().finish();
  label.textContent = '';
  return { tris, materials: [...mats], meshes: assetMeshes.length, frame: renderer.info.render.triangles };
}

declare global { interface Window { __ar: { show: typeof show; ready: boolean; label: (s: string) => void } } }
window.__ar = { show, ready: true, label: (s: string) => { label.textContent = s; } };
