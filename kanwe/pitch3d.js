/* ==========================================================================
   3D PITCH VIEWER — used only in the "Why train with Coach Santana" section.
   Broadcast / tracking style: a striped soccer pitch with goals, position
   markers and tracked pass lines with reception rings. Three illustrative
   views — Private, Small group, Team — show how the space can change.
   Loaded lazily by main.js.
   Units: 1 = 1 m. Pitch length runs along X (halfway line at x = 0).
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const C = {
  bg: 0x17232F, grass: 0x1D5444, grassB: 0x22604E, ground: 0x13202A, white: 0xF5F0E6,
  player: 0xBBD64A, coach: 0xD8693E, cone: 0xD8693E,
};
const L = 105, W = 68; // pitch size
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function webgl() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

export function mountPitch(root) {
  if (!webgl()) { root.classList.add('no-webgl'); return null; }
  const canvas = root.querySelector('.viewer__canvas');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => root.clientWidth < 760;

  /* ---------- Renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 140, 300);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 800);

  scene.add(new THREE.HemisphereLight(0xF5F0E6, C.bg, 0.65));
  const key = new THREE.DirectionalLight(0xF5F0E6, 2.5);
  key.position.set(-40, 80, 36);
  key.castShadow = true;
  key.shadow.mapSize.set(small() ? 1024 : 2048, small() ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -70, right: 70, top: 50, bottom: -50, near: 10, far: 220 });
  key.shadow.radius = 4;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x5E7470, 0.8);
  fill.position.set(50, 30, -40);
  scene.add(fill);

  /* ---------- Textures ---------- */
  const radial = (inner, outer) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  };
  // mowing stripes + a little grain
  const grassTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 256;
    const g = cv.getContext('2d');
    const a = new THREE.Color(C.grass), b = new THREE.Color(C.grassB);
    const bands = 14;
    for (let i = 0; i < bands; i++) { g.fillStyle = `#${(i % 2 ? a : b).getHexString()}`; g.fillRect((i / bands) * 1024, 0, 1024 / bands + 1, 256); }
    const img = g.getImageData(0, 0, 1024, 256);
    for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 10; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  })();
  const roundRect = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };
  const label = (text, accent) => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d');
    g.font = '700 40px "Plus Jakarta Sans", Inter, Arial, sans-serif';
    const w = Math.min(500, g.measureText(text).width + 84);
    const x = (512 - w) / 2;
    g.fillStyle = 'rgba(20,42,54,0.9)';
    roundRect(g, x, 22, w, 84, 14); g.fill();
    g.fillStyle = accent;
    g.fillRect(x + 28, 56, 16, 16);
    g.fillStyle = '#F5F0E6';
    g.textBaseline = 'middle';
    g.fillText(text, x + 58, 67);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.set(11, 2.75, 1);
    s.renderOrder = 10;
    return s;
  };

  /* ---------- Pitch ---------- */
  const flat = (w, d, mat, y) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  flat(600, 600, new THREE.MeshStandardMaterial({ color: C.ground, roughness: 1 }), 0);
  flat(L + 12, W + 12, new THREE.MeshStandardMaterial({ color: C.grassB, roughness: 0.95 }), 0.01);
  flat(L, W, new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 }), 0.02);

  const lineMat = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.6, emissive: 0x202623 });
  const line = (x1, z1, x2, z2, w = 0.24) => {
    const len = Math.hypot(x2 - x1, z2 - z1) + w;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), lineMat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -Math.atan2(z2 - z1, x2 - x1);
    m.position.set((x1 + x2) / 2, 0.04, (z1 + z2) / 2);
    m.receiveShadow = true;
    scene.add(m);
  };
  const ring = (x, z, r, a0 = 0, a1 = Math.PI * 2, w = 0.24) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - w / 2, r + w / 2, 96, 1, a0, a1 - a0), lineMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.04, z);
    scene.add(m);
  };
  const hl = L / 2, hw = W / 2;
  line(-hl, -hw, hl, -hw); line(-hl, hw, hl, hw); line(-hl, -hw, -hl, hw); line(hl, -hw, hl, hw);
  line(0, -hw, 0, hw);
  ring(0, 0, 9.15);
  ring(0, 0, 0.3, 0, Math.PI * 2, 0.6);
  [-1, 1].forEach((s) => {
    const gx = s * hl;
    // penalty area, goal area, spot and arc
    line(gx, -20.16, gx - s * 16.5, -20.16); line(gx, 20.16, gx - s * 16.5, 20.16); line(gx - s * 16.5, -20.16, gx - s * 16.5, 20.16);
    line(gx, -9.16, gx - s * 5.5, -9.16); line(gx, 9.16, gx - s * 5.5, 9.16); line(gx - s * 5.5, -9.16, gx - s * 5.5, 9.16);
    ring(gx - s * 11, 0, 0.3, 0, Math.PI * 2, 0.6);
    const a = Math.acos(5.5 / 9.15);
    // the arc outside the box: RingGeometry angles run counter-clockwise from +X in the XY plane (Y becomes −Z)
    if (s < 0) ring(gx - s * 11, 0, 9.15, -a, a); else ring(gx - s * 11, 0, 9.15, Math.PI - a, Math.PI + a);
  });

  // Goals: posts, crossbar and a light net
  const postMat = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.4, metalness: 0.2 });
  const netMat = new THREE.MeshBasicMaterial({ color: C.white, transparent: true, opacity: 0.16, side: THREE.DoubleSide, wireframe: true });
  [-1, 1].forEach((s) => {
    const gx = s * hl;
    const g = new THREE.Group();
    [-3.66, 3.66].forEach((z) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.44, 12), postMat);
      p.position.set(0, 1.22, z); p.castShadow = true; g.add(p);
    });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 7.32, 12), postMat);
    bar.rotation.x = Math.PI / 2; bar.position.set(0, 2.44, 0); bar.castShadow = true; g.add(bar);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44, 14, 5), netMat);
    back.position.set(s * 2, 1.22, 0); back.rotation.y = Math.PI / 2; g.add(back);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(2, 7.32, 4, 14), netMat);
    top.rotation.x = -Math.PI / 2; top.position.set(s * 1, 2.44, 0); g.add(top);
    g.position.x = gx;
    scene.add(g);
  });

  /* ---------- Ball (panelled) + contact shadow ---------- */
  const ballTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = '#F5F0E6'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#17232F';
    const pent = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); };
    for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) pent(((i + (row % 2) * 0.5) / 5) * 512, 40 + row * 88, 26);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.5 }));
  ball.castShadow = true;
  scene.add(ball);
  const ballShadow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: radial('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.y = 0.05;
  scene.add(ballShadow);

  /* ---------- Cones (individual view) ---------- */
  const coneMat = new THREE.MeshStandardMaterial({ color: C.cone, roughness: 0.6 });
  const cones = new THREE.Group();
  const CONES = [[-36, -6], [-36, 6], [-28, -6], [-28, 6], [-32, 0], [-40, 0]];
  CONES.forEach(([x, z]) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 20), coneMat);
    c.position.set(x, 0.35, z); c.castShadow = true; cones.add(c);
  });
  scene.add(cones);

  /* ---------- Position markers ---------- */
  const glowTex = radial('rgba(255,255,255,0.55)', 'rgba(255,255,255,0)');
  const marker = (color, text, accent) => {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.06;
    const rg = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }));
    rg.rotation.x = -Math.PI / 2; rg.position.y = 0.07;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 6.5), new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }));
    pin.position.y = 2.2;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshBasicMaterial({ color }));
    head.position.y = 4.45;
    g.add(glow, disc, rg, pin, head);
    let tag = null;
    if (text) { tag = label(text, accent); tag.position.y = 6.2; g.add(tag); }
    scene.add(g);
    return { g, ring: rg, tag, pos: new THREE.Vector3(), target: new THREE.Vector3(), vis: 0, visTarget: 0 };
  };
  const coach = marker(C.coach, 'COACH', '#D8693E');
  const PLAYERS = Array.from({ length: 11 }, (_, i) => marker(C.player, i === 0 ? 'PLAYER' : '', '#BBD64A'));
  const place = (m, x, z, snap) => { m.target.set(x, 0, z); if (snap) m.pos.set(x, 0, z); };

  // Group view: the rondo circle
  const rondo = new THREE.Mesh(new THREE.RingGeometry(10.8, 11.1, 96), new THREE.MeshBasicMaterial({ color: C.player, transparent: true, opacity: 0, depthWrite: false }));
  rondo.rotation.x = -Math.PI / 2;
  rondo.position.set(-22, 0.06, 0);
  scene.add(rondo);

  /* ---------- Tracked passes ---------- */
  const TUBE_SEG = 80, RAD_SEG = 6;
  const passes = [];
  const rings = [];
  let pass = null;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  const arc = (a, b, peak) => {
    const c = a.clone().lerp(b, 0.5);
    c.y = 2 * peak - (a.y + b.y) / 2;
    return new THREE.QuadraticBezierCurve3(a, c, b);
  };
  const makePass = (from, to, peak, dur, color) => {
    const a = new THREE.Vector3(from.pos.x, 0.55, from.pos.z);
    const b = new THREE.Vector3(to.target.x, 0.55, to.target.z);
    const curve = arc(a, b, peak);
    const geo = new THREE.TubeGeometry(curve, TUBE_SEG, 0.09, RAD_SEG, false);
    geo.setDrawRange(0, 0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }));
    scene.add(mesh);
    const p = { from, to, curve, dur, t: 0, mesh, geo, fade: -1 };
    passes.push(p);
    return p;
  };
  const addRing = (p, color) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, depthWrite: false }));
    r.rotation.x = -Math.PI / 2;
    r.position.set(p.x, 0.09, p.z);
    scene.add(r);
    rings.push({ r, age: 0 });
  };
  const clearPasses = () => {
    timers.forEach(clearTimeout); timers.length = 0;
    passes.forEach((p) => { scene.remove(p.mesh); p.geo.dispose(); p.mesh.material.dispose(); });
    passes.length = 0;
    rings.forEach((r) => { scene.remove(r.r); r.r.geometry.dispose(); r.r.material.dispose(); });
    rings.length = 0;
    pass = null;
  };

  /* ---------- Modes ---------- */
  let mode = 'individual';
  let coneIdx = 0;
  let squad = [];
  const VIEWS = {
    individual: { az: -22, el: 34, r: 56, target: [-29, 0, 0] },
    group: { az: -50, el: 36, r: 74, target: [-22, 0, 0] },
    team: { az: -28, el: 48, r: 150, target: [0, 0, 0] },
  };
  const RONDO = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return [-22 + Math.cos(a) * 11, Math.sin(a) * 11]; });
  // a generic team shape across one half and into the other (illustrative only)
  const SHAPE = [[-48, 0], [-34, -22], [-36, -8], [-36, 8], [-34, 22], [-18, -14], [-20, 0], [-18, 14], [-2, -22], [2, 0], [-2, 22]];

  const individualPass = (from) => {
    const to = from === coach ? PLAYERS[0] : coach;
    if (to === PLAYERS[0]) { coneIdx = (coneIdx + 1) % CONES.length; const [x, z] = CONES[coneIdx]; place(PLAYERS[0], x + 1.6, z); }
    pass = makePass(from, to, rand(0.4, 1.2), 1.15, from === coach ? C.coach : C.player);
  };
  const groupPass = (from) => {
    const others = squad.filter((m) => m !== from);
    const to = pick(others);
    pass = makePass(from, to, rand(0.3, 1.6), 0.95, C.player);
  };
  const teamPass = (from) => {
    const i = squad.indexOf(from);
    // mostly forward or sideways; the keeper restarts it
    const pool = squad.filter((m, k) => k !== i && Math.abs(SHAPE[k][0] - SHAPE[i][0]) < 26 && SHAPE[k][0] >= SHAPE[i][0] - 6);
    const to = i >= 8 || !pool.length ? squad[0] : pick(pool);
    const far = Math.hypot(to.target.x - from.pos.x, to.target.z - from.pos.z);
    pass = makePass(from, to, far > 22 ? rand(3, 6) : rand(0.3, 1.4), 0.7 + far * 0.03, C.player);
  };
  const nextPass = (from) => {
    if (mode === 'individual') individualPass(from);
    else if (mode === 'group') groupPass(from);
    else teamPass(from);
  };

  const drag = { az: 0, el: 0, active: false, x: 0, y: 0, idle: 10 };

  // Reduced motion: one representative, fully drawn pass pattern per mode
  const staticFrame = () => {
    const draw = (a, b, peak, color) => { const p = makePass(a, b, peak, 1, color); p.geo.setDrawRange(0, Infinity); addRing(b.target, color); };
    if (mode === 'individual') draw(coach, PLAYERS[0], 0.8, C.coach);
    else if (mode === 'group') { draw(squad[0], squad[2], 0.8, C.player); draw(squad[2], squad[4], 0.8, C.player); }
    else { draw(squad[2], squad[6], 1, C.player); draw(squad[6], squad[9], 3, C.player); }
    [coach, ...PLAYERS].forEach((p) => { p.pos.copy(p.target); p.vis = p.visTarget; });
    pass = null;
  };

  const setMode = (m) => {
    mode = m;
    clearPasses();
    drag.az = 0; drag.el = 0;
    PLAYERS.forEach((p) => { p.visTarget = 0; });
    coach.visTarget = 1;
    cones.visible = m === 'individual';
    if (m === 'individual') {
      place(coach, -22, 0, true);
      coneIdx = 0;
      place(PLAYERS[0], CONES[0][0] + 1.6, CONES[0][1], true);
      PLAYERS[0].visTarget = 1;
      squad = [PLAYERS[0]];
      if (!reduce) later(() => { if (mode === 'individual' && !pass) individualPass(coach); }, 500);
    } else if (m === 'group') {
      squad = PLAYERS.slice(0, 6);
      squad.forEach((p, i) => { place(p, RONDO[i][0], RONDO[i][1], true); p.visTarget = 1; });
      place(coach, -22, -19, true);
      if (!reduce) later(() => { if (mode === 'group' && !pass) groupPass(squad[0]); }, 500);
    } else {
      squad = PLAYERS.slice();
      squad.forEach((p, i) => { place(p, SHAPE[i][0], SHAPE[i][1], true); p.visTarget = 1; });
      place(coach, -6, -hw - 3, true);
      if (!reduce) later(() => { if (mode === 'team' && !pass) teamPass(squad[0]); }, 600);
    }
    PLAYERS[0].tag.visible = m === 'individual';
    if (reduce) staticFrame();
  };

  /* ---------- Camera + drag to rotate ---------- */
  const cam = { az: VIEWS.individual.az, el: VIEWS.individual.el, r: VIEWS.individual.r, target: new THREE.Vector3(...VIEWS.individual.target) };
  canvas.addEventListener('pointerdown', (e) => { drag.active = true; drag.x = e.clientX; drag.y = e.clientY; canvas.setPointerCapture(e.pointerId); root.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag.active) return;
    drag.az = THREE.MathUtils.clamp(drag.az - (e.clientX - drag.x) * 0.25, -75, 75);
    if (e.pointerType === 'mouse') drag.el = THREE.MathUtils.clamp(drag.el + (e.clientY - drag.y) * 0.15, -16, 26);
    drag.x = e.clientX; drag.y = e.clientY; drag.idle = 0;
  });
  const endDrag = () => { drag.active = false; root.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* ---------- Size / visibility ---------- */
  const resize = () => {
    const w = canvas.clientWidth || root.clientWidth, h = canvas.clientHeight || root.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = small() ? 46 : 32;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let visible = false;
  let running = false;

  function tick() {
    if (!visible) { running = false; return; }
    running = true;
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    // Camera
    const v = VIEWS[mode];
    if (!drag.active) drag.idle += dt;
    const drift = reduce || drag.idle < 3 ? 0 : Math.sin(time * 0.16) * 6;
    const k = reduce ? 1 : 1 - Math.pow(0.02, dt);
    const rScale = small() ? 0.95 : 1;
    cam.az += (v.az + drag.az + drift - cam.az) * k;
    cam.el += (v.el + drag.el - cam.el) * k;
    cam.r += (v.r * rScale - cam.r) * k;
    cam.target.lerp(tmp.set(...v.target), k);
    const az = THREE.MathUtils.degToRad(cam.az), el = THREE.MathUtils.degToRad(cam.el);
    camera.position.set(cam.target.x + Math.sin(az) * Math.cos(el) * cam.r, cam.target.y + Math.sin(el) * cam.r, cam.target.z + Math.cos(az) * Math.cos(el) * cam.r);
    camera.lookAt(cam.target);

    // Markers (labels scale up a little in the wide team view so they stay readable)
    const tagScale = mode === 'team' ? 1.7 : mode === 'group' ? 1.25 : 1;
    [coach, ...PLAYERS].forEach((m) => {
      const kk = reduce ? 1 : Math.min(1, dt * 2.6);
      m.pos.lerp(m.target, kk);
      m.vis += (m.visTarget - m.vis) * (reduce ? 1 : Math.min(1, dt * 5));
      m.g.position.copy(m.pos);
      m.g.scale.setScalar(Math.max(0.001, m.vis) * (mode === 'team' ? 1.35 : 1));
      m.g.visible = m.vis > 0.02;
      m.ring.scale.setScalar(reduce ? 1 : 1 + Math.sin(time * 3 + m.pos.x) * 0.04);
      if (m.tag) m.tag.scale.set(11 * tagScale, 2.75 * tagScale, 1);
    });
    rondo.material.opacity += ((mode === 'group' ? 0.55 : 0) - rondo.material.opacity) * (reduce ? 1 : Math.min(1, dt * 4));

    // Passing
    ball.visible = !!pass || reduce;
    if (!reduce && pass) {
      pass.t += dt;
      const f = Math.min(1, pass.t / pass.dur);
      pass.curve.getPoint(f, ball.position);
      pass.geo.setDrawRange(0, Math.floor(f * TUBE_SEG) * RAD_SEG * 6);
      ball.rotation.z -= dt * 10;
      if (f >= 1) {
        addRing(pass.to.target, pass.mesh.material.color.getHex());
        pass.fade = 0;
        const next = pass.to;
        pass = null;
        later(() => { if (!pass) nextPass(next); }, mode === 'individual' ? 520 : 260);
      }
    } else if (reduce) {
      ball.position.set(coach.pos.x + 1.2, 0.55, coach.pos.z + 1);
    }
    if (!pass && !reduce) {
      // the ball waits at the receiver's feet between passes
      const holder = passes.length ? passes[passes.length - 1].to : null;
      if (holder) { ball.visible = true; ball.position.set(holder.pos.x + 0.9, 0.55, holder.pos.z); }
    }
    ballShadow.visible = ball.visible;
    ballShadow.position.set(ball.position.x, 0.05, ball.position.z);
    ballShadow.scale.setScalar(1 + ball.position.y * 0.08);
    ballShadow.material.opacity = Math.max(0.15, 1 - ball.position.y * 0.1);

    // Fade old pass lines and reception rings
    if (!reduce) {
      for (let i = passes.length - 1; i >= 0; i--) {
        const p = passes[i];
        if (p === pass || p.fade < 0) continue;
        p.fade += dt;
        p.mesh.material.opacity = Math.max(0, 0.95 - p.fade * 0.32);
        if (p.mesh.material.opacity <= 0 && i !== passes.length - 1) { scene.remove(p.mesh); p.geo.dispose(); p.mesh.material.dispose(); passes.splice(i, 1); }
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.age += dt;
        r.r.scale.setScalar(1 + r.age * 4);
        r.r.material.opacity = Math.max(0, 1 - r.age * 1.1);
        if (r.age > 1.2) { scene.remove(r.r); r.r.geometry.dispose(); r.r.material.dispose(); rings.splice(i, 1); }
      }
    }

    renderer.render(scene, camera);
    root.classList.add('is-ready');
  }

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !running) { clock.getDelta(); requestAnimationFrame(tick); }
  }, { rootMargin: '100px' }).observe(root);

  setMode('individual');
  return { setMode };
}
