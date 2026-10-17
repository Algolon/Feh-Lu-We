// PERF-R02 visibility probe (page side; non-functional tooling, injected by scripts/perf/visibility-harness.mjs).
// Installs window.VP: pose control through the game's own update path, renderer counters per frame, attribution of
// submitted camera geometry to regions / chunks / batches, region state, and timing of World.updateCulling.
// Nothing here ships in the game bundle; it only reads (and, for the attribution frame, briefly toggles) state.
(() => {
  if (window.VP) return;
  const g = () => window.__game;
  const w = () => window.__game.world;

  // --- updateCulling timing (CPU, ms) -------------------------------------------------------------------------
  const cull = { calls: 0, ms: [], last: 0 };
  {
    const world = w(), orig = world.updateCulling.bind(world);
    world.updateCulling = (eye, cam) => { const t0 = performance.now(); orig(eye, cam); const t = performance.now() - t0; cull.calls++; cull.last = t; cull.ms.push(t); };
  }

  // --- per-draw attribution ------------------------------------------------------------------------------------
  // The exact renderer.info delta of every renderBufferDirect call is attributed to a category, so the categories
  // always sum to the renderer's own counters.
  let attrib = null;
  {
    const r = g().renderer, orig = r.renderBufferDirect.bind(r);
    r.renderBufferDirect = (camera, scene, geometry, material, object, group) => {
      if (!attrib) return orig(camera, scene, geometry, material, object, group);
      const i = r.info.render, c0 = i.calls, t0 = i.triangles;
      orig(camera, scene, geometry, material, object, group);
      const k = category(object), e = (attrib[k] ??= { calls: 0, triangles: 0 });
      e.calls += i.calls - c0; e.triangles += i.triangles - t0;
    };
  }
  function category(o) {
    for (let p = o; p; p = p.parent) {
      const u = p.userData || {};
      if (u.opaqueAggregate) return 'opaqueBatch';
      if (u.chunk) return `chunk:${u.chunk}`;
      if (u.vegPart || u.artTrees || u.vegPath) return `veg:${u.vegPart || (u.artTrees ? 'trees' : '')}${u.vegPath ? '/' + u.vegPath : ''}${u.vegKind ? '/' + u.vegKind : ''}`;
      if (u.region) return `region:${u.region}/${p.name || p.type}`;
      if (p.parent === w().scene) return `obj:${p.name || p.type}`;
    }
    return `obj:${o.name || o.type}`;
  }

  // --- state helpers -------------------------------------------------------------------------------------------
  const tick = (dt) => g().tick(dt);
  function setPose(p) {
    // support height first, so the eye-height smoothing starts at the floor the pose stands on
    const y = w().col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    g().player.setPose({ x: p.x, y, z: p.z, yaw: p.yaw, pitch: p.pitch ?? 0 });
  }
  function setDoors(mode, list) {
    const st = g().state;
    for (const id of w().byId.keys()) if (id.startsWith('door.')) st.open[id] = mode === 'open' ? true : mode === 'closed' ? false : (list || []).includes(id);
    w().syncAll();
    for (let i = 0; i < 45; i++) tick(1 / 30); // leaves finish swinging
  }
  const regionState = () => w().regions.map((r) => ({ rooms: [...r.rooms], chunks: [...new Set(r.meshes.map((m) => m.userData.chunk || m.userData.region).filter(Boolean))], on: r.on }));
  const activeRegions = () => regionState().filter((r) => r.on).map((r) => r.chunks.join('+')).filter(Boolean);

  /** Render one frame exactly as the game does (the post path included) and read the camera counters. */
  function renderFrame({ breakdown = false } = {}) {
    const G = g(), r = G.renderer;
    G.mushroomVision.render(r, w().scene, G.camera, G.time, G.settings.reducedMotion, G.settings.mushroomDistortion, G.settings.quality === 'high');
    const i = r.info.render, out = { calls: i.calls, triangles: i.triangles };
    if (breakdown) {
      // Attribution frame: same state, opaque batching off for this frame only (it merges calls across chunks; the
      // triangles are identical), every draw attributed. Restored immediately.
      const ob = w().scene.userData.opaqueBatches, was = ob?.enabled;
      if (ob) ob.enabled = false;
      attrib = {};
      G.mushroomVision.render(r, w().scene, G.camera, G.time, G.settings.reducedMotion, G.settings.mushroomDistortion, G.settings.quality === 'high');
      out.unbatched = { calls: r.info.render.calls, triangles: r.info.render.triangles };
      out.by = attrib; attrib = null;
      if (ob) ob.enabled = was;
    }
    return out;
  }
  const meta = () => {
    const G = g(), r = G.renderer, gl = r.getContext();
    return { build: (document.querySelector('script[src*="index-"]')?.src || '').split('/').pop(), viewport: [innerWidth, innerHeight], buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], dpr: r.getPixelRatio(), quality: G.settings.quality, shadows: r.shadowMap.enabled, batching: !!w().scene.userData.opaqueBatches?.enabled };
  };
  const poseNow = () => { const pl = g().player; return { x: +pl.x.toFixed(3), y: +pl.y.toFixed(3), z: +pl.z.toFixed(3), yaw: +pl.yaw.toFixed(4), pitch: +pl.pitch.toFixed(4) }; };

  window.VP = {
    meta, setPose, setDoors, tick, renderFrame, regionState, activeRegions, poseNow,
    cullStats: () => ({ calls: cull.calls, last: cull.last }),
    takeCullMs: () => { const a = cull.ms.slice(); cull.ms.length = 0; return a; },
    /** Force the next tick to run the game's culling for the current pose (the game's own order inside tick). */
    forceCullNextTick: () => { g().cullTimer = 0; },
    cullTimer: () => g().cullTimer,
    room: () => w().hereRoom,
  };
})();
