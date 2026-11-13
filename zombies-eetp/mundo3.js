// ---------- Mundo: escena, casa con ventanas y puerta, reglas de ruta y colisión ----------
// (el diseño del mapa está en mapa.js; acá solo se usa)
const CELL = 2, PR = 0.3, EYE = 1.6;

function noiseTex(base, speck, rep = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 900; k++) {
    g.fillStyle = Math.random() < 0.5 ? speck : "rgba(0,0,0,0.6)";
    g.globalAlpha = 0.25 + Math.random() * 0.5;
    g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  return t;
}

// Adentro de algún edificio (base o ruina): ahí no aparecen zombies
const inHouse = (i, j) => BUILDINGS.some((b) => i >= b.x0 && i <= b.x1 && j >= b.y0 && j <= b.y1);
const cellOf = (x, z) => ({ i: Math.round(x / CELL), j: Math.round(z / CELL) });

// Lo que se puede pisar
const PASS = new Set(["g", "p", "b", "r", ".", "m"]);
// Objetos chicos: no bloquean toda la celda, solo chocan donde está el objeto (ver COLLIDERS)
const PROP = new Set(["T", "k", "L", "f", "x"]);
const WINDOWS = new Map();
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const c = G[j][i];
  if (c === "W" || c === "D") WINDOWS.set(i + "," + j, { i, j, door: c === "D", hp: 3, broken: false, open: false, wall: null, planks: null });
}
const winAt = (i, j) => WINDOWS.get(i + "," + j);
const passW = (w) => w.broken || w.open;

const START_CELL = START;
const SHOP = SHOP_CANDS;

// Puntos de aparición: patio pasable, lejos de la casa
const SPAWN_CELLS = [];
for (let j = 1; j < ROWS - 1; j++) for (let i = 1; i < COLS - 1; i++) {
  if (PASS.has(at(i, j)) && !inHouse(i, j) && Math.hypot(i - 36, j - 28.5) > 8) SPAWN_CELLS.push({ i, j });
}

// Cajas de colisión de los objetos chicos, del mismo tamaño que lo que se ve
const COLLIDERS = [];
(function buildColliders() {
  const box = (x, z, h) => COLLIDERS.push({ x0: x - h, x1: x + h, z0: z - h, z1: z + h });
  const bar = (x0, z0, x1, z1) => COLLIDERS.push({ x0, x1, z0, z1 });
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const c = G[j][i], x = i * CELL, z = j * CELL;
    if (c === "T") box(x, z, 0.32);
    else if (c === "k") box(x, z, 0.3);
    else if (c === "L") box(x, z, 0.14);
    else if (c === "x") box(x, z, 0.9);
    else if (c === "f") {
      box(x, z, 0.09);
      if (at(i + 1, j) === "f") bar(x, z - 0.05, x + CELL, z + 0.05);
      if (at(i, j + 1) === "f") bar(x - 0.05, z, x + 0.05, z + CELL);
    }
  }
})();

function blocked(i, j) {
  const c = at(i, j);
  if (c === "W" || c === "D") return !passW(winAt(i, j));
  if (PROP.has(c)) return false;
  return !PASS.has(c);
}
// Costo de ruta: 0 = sólido; ventana o puerta cerrada cuesta más (los zombies van a romperla)
function cost(i, j) {
  const c = at(i, j);
  if (c === "r" || c === "m") return 2;
  if (c === "W" || c === "D") return passW(winAt(i, j)) ? 1 : 6;
  return PASS.has(c) ? 1 : 0;
}
function buildField(pi, pj) {
  const d = new Float32Array(COLS * ROWS).fill(Infinity);
  d[pj * COLS + pi] = 0;
  let changed = true, guard = 0;
  while (changed && guard++ < 300) {
    changed = false;
    for (let j = 1; j < ROWS - 1; j++) for (let i = 1; i < COLS - 1; i++) {
      const c = cost(i, j);
      if (!c) continue;
      const k = j * COLS + i;
      const m = Math.min(d[k - 1], d[k + 1], d[k - COLS], d[k + COLS]) + c;
      if (m < d[k]) { d[k] = m; changed = true; }
    }
  }
  return d;
}
function collide(x, z, r) {
  const ci = Math.round(x / CELL), cj = Math.round(z / CELL), h = CELL / 2;
  for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) {
    if (!blocked(i, j)) continue;
    const bx = i * CELL, bz = j * CELL;
    const px = Math.max(bx - h, Math.min(x, bx + h));
    const pz = Math.max(bz - h, Math.min(z, bz + h));
    const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d > 1e-6) {
      const k = (r - d) / d;
      x += dx * k;
      z += dz * k;
    } else {
      const ox = Math.min(x - (bx - h), bx + h - x);
      const oz = Math.min(z - (bz - h), bz + h - z);
      if (ox < oz) x = x < bx ? bx - h - r : bx + h + r;
      else z = z < bz ? bz - h - r : bz + h + r;
    }
  }
  for (const b of COLLIDERS) {
    if (x < b.x0 - r || x > b.x1 + r || z < b.z0 - r || z > b.z1 + r) continue;
    const px = Math.max(b.x0, Math.min(x, b.x1)), pz = Math.max(b.z0, Math.min(z, b.z1));
    const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d > 1e-6) {
      const k = (r - d) / d;
      x += dx * k;
      z += dz * k;
    } else {
      const ox = Math.min(x - b.x0, b.x1 - x), oz = Math.min(z - b.z0, b.z1 - z);
      if (ox < oz) x = x - b.x0 < b.x1 - x ? b.x0 - r : b.x1 + r;
      else z = z - b.z0 < b.z1 - z ? b.z0 - r : b.z1 + r;
    }
  }
  return { x, z };
}

// ---------- Escena ----------
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x1a2233, 22, 80);
const camera = new THREE.PerspectiveCamera(72, 1.6, 0.05, 260);
camera.rotation.order = "YXZ";
scene.add(camera);
scene.add(new THREE.HemisphereLight(0x5a6c9c, 0x1a1410, 0.7));
const moon = new THREE.DirectionalLight(0xaebfff, 0.8);
moon.position.set(-12, 25, 8);
scene.add(moon);
const torch = new THREE.SpotLight(0xffe3b8, 1.2, 22, Math.PI / 5, 0.5, 1.5);
torch.target.position.set(0, 0, -6);
camera.add(torch);
camera.add(torch.target);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(COLS * CELL + 200, ROWS * CELL + 200),
  new THREE.MeshStandardMaterial({ map: noiseTex("#24341f", "#3a4d33", 40), roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(((COLS - 1) * CELL) / 2, 0, ((ROWS - 1) * CELL) / 2);
scene.add(ground);

// Piso del mapa pintado desde la grilla: colores suaves y bordes mezclados (sin cuadrículas marcadas)
(function paintGround() {
  const S = 16;
  const c = document.createElement("canvas");
  c.width = COLS * S;
  c.height = ROWS * S;
  const g = c.getContext("2d");
  const color = {
    g: "#3d5a30", T: "#2c4526", "#": "#1c1f1a", ".": "#6f6b74", p: "#62503a", r: "#34492b",
    "~": "#11303b", m: "#2b2e1d", b: "#5a3b22", k: "#38512f", f: "#3d5a30", "=": "#6d6870", C: "#5d5a63",
    H: "#7a7166", W: "#7a7166", D: "#7a7166", x: "#4c4a44", S: "#6d6870", L: "#3d5a30",
  };
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    g.fillStyle = color[G[j][i]] || "#3d5a30";
    g.fillRect(i * S, j * S, S, S);
    for (let k = 0; k < 4; k++) {
      g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.05)";
      g.fillRect(i * S + Math.random() * S, j * S + Math.random() * S, 3, 3);
    }
  }
  const b = document.createElement("canvas");
  b.width = c.width;
  b.height = c.height;
  const bg = b.getContext("2d");
  bg.filter = "blur(4px)";
  bg.drawImage(c, 0, 0);
  g.globalAlpha = 0.5;
  g.drawImage(b, 0, 0);
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(COLS * CELL, ROWS * CELL),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(((COLS - 1) * CELL) / 2, 0.02, ((ROWS - 1) * CELL) / 2);
  scene.add(m);
})();

const houseMat = new THREE.MeshStandardMaterial({ map: noiseTex("#8a7f70", "#4a4238", 2), color: 0xffffff, roughness: 1 });
const plankMat = new THREE.MeshStandardMaterial({ map: noiseTex("#5a3b22", "#8a5e36", 1), roughness: 0.9 });
const solidMeshes = [];
function place(geo, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.y = o.ry ?? 0;
  if (o.rx) m.rotation.x = o.rx;
  if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  scene.add(m);
  return m;
}
// Pared de un bloque por celda (las celdas contiguas forman un muro continuo)
function wallBox(i, j, win, mat = houseMat, h = 2.6) {
  const m = place(new THREE.BoxGeometry(CELL * 1.01, h, CELL * 1.01), mat, i * CELL, h / 2, j * CELL);
  m.userData.win = win || null;
  solidMeshes.push(m);
  return m;
}
// Tablas delante de la ventana o de la puerta, del lado de afuera
function makeBoards(w) {
  const g = new THREE.Group();
  const horiz = !inHouse(w.i, w.j - 1) || !inHouse(w.i, w.j + 1);
  const outN = !inHouse(w.i, w.j - 1), outW = !inHouse(w.i - 1, w.j);
  const ox = horiz ? 0 : (outW ? -1.4 : 1.4);
  const oz = horiz ? (outN ? -1.4 : 1.4) : 0;
  for (let k = 0; k < 3; k++) {
    const geo = horiz ? new THREE.BoxGeometry(CELL * 0.9, 0.3, 0.12) : new THREE.BoxGeometry(0.12, 0.3, CELL * 0.9);
    const b = new THREE.Mesh(geo, plankMat);
    b.position.set(ox, 0.6 + k * 0.6, oz);
    b.rotation.z = k % 2 ? 0.04 : -0.03;
    g.add(b);
  }
  g.position.set(w.i * CELL, 0, w.j * CELL);
  scene.add(g);
  return g;
}
// Muro y tablas, o hueco si está roto / abierto
function setGap(w, gap) {
  if (gap) {
    if (w.wall) scene.remove(w.wall);
    if (w.planks) scene.remove(w.planks);
    w.wall = null;
    w.planks = null;
  } else {
    if (!w.wall) w.wall = wallBox(w.i, w.j, w, houseMat);
    if (!w.planks) w.planks = makeBoards(w);
  }
}
function buildWindow(w) {
  w.broken = false;
  w.open = false;
  w.hp = 3;
  setGap(w, false);
}
function breakWindow(w) {
  w.broken = true;
  setGap(w, true);
}
function toggleDoor(w) {
  if (w.broken) return;
  w.open = !w.open;
  setGap(w, w.open);
}
function resetWindows() {
  for (const w of WINDOWS.values()) buildWindow(w);
}
for (const w of WINDOWS.values()) buildWindow(w);

// Cielo: montañas lejanas y luna
(function buildSky() {
  const cx = ((COLS - 1) * CELL) / 2, cz = ((ROWS - 1) * CELL) / 2;
  const mountain = new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 1, flatShading: true });
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    const r = 128 + (k % 3) * 6;
    const h = 26 + ((k * 37) % 13);
    const m = new THREE.Mesh(new THREE.ConeGeometry(12 + (k % 4) * 2, h, 6), mountain);
    m.position.set(cx + Math.cos(a) * r, h / 2 - 2, cz + Math.sin(a) * r);
    scene.add(m);
  }
  const moonM = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false }));
  moonM.position.set(cx - 55, 46, cz - 55);
  scene.add(moonM);
  // Cielo: degradé violeta, nubes que se corren, halo de luna y relámpagos lejanos
  const grad = document.createElement("canvas");
  grad.width = 4;
  grad.height = 256;
  const gg = grad.getContext("2d");
  const gsk = gg.createLinearGradient(0, 0, 0, 256);
  gsk.addColorStop(0, "#06061a");
  gsk.addColorStop(0.5, "#1a1636");
  gsk.addColorStop(0.78, "#3b2a46");
  gsk.addColorStop(1, "#15101c");
  gg.fillStyle = gsk;
  gg.fillRect(0, 0, 4, 256);
  const skyMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(grad), side: THREE.BackSide, fog: false, depthWrite: false });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), skyMat);
  dome.position.set(cx, 0, cz);
  scene.add(dome);

  const cc = document.createElement("canvas");
  cc.width = cc.height = 256;
  const cg = cc.getContext("2d");
  for (let k = 0; k < 26; k++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 30 + Math.random() * 50;
    for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) {
      const rg = cg.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      rg.addColorStop(0, "rgba(255,255,255,0.5)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      cg.fillStyle = rg;
      cg.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
  const cloudTex = new THREE.CanvasTexture(cc);
  cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;
  cloudTex.repeat.set(3, 3);
  const cloudMat = new THREE.MeshBasicMaterial({ map: cloudTex, color: 0x5a5470, transparent: true, opacity: 0.7, depthWrite: false, fog: false });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.set(cx, 58, cz);
  scene.add(clouds);

  const hc = document.createElement("canvas");
  hc.width = hc.height = 128;
  const hg = hc.getContext("2d");
  const hr = hg.createRadialGradient(64, 64, 10, 64, 64, 64);
  hr.addColorStop(0, "rgba(220,230,255,0.9)");
  hr.addColorStop(0.3, "rgba(160,170,255,0.35)");
  hr.addColorStop(1, "rgba(120,120,200,0)");
  hg.fillStyle = hr;
  hg.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), fog: false, depthWrite: false, transparent: true }));
  halo.scale.set(34, 34, 1);
  halo.position.set(cx - 55, 46, cz - 55);
  scene.add(halo);

  const bolt = new THREE.DirectionalLight(0xb8c4ff, 0);
  bolt.position.set(0, 1, 0.2);
  scene.add(bolt);
  let nextBolt = 14, boltT = 0, bolt2 = 0;
  window.updateSky = function (dt) {
    cloudTex.offset.x += dt * 0.004;
    cloudTex.offset.y += dt * 0.0015;
    nextBolt -= dt;
    if (nextBolt <= 0) { boltT = 0.35; bolt2 = 0.18; nextBolt = 12 + Math.random() * 25; }
    boltT = Math.max(0, boltT - dt);
    bolt2 = Math.max(0, bolt2 - dt);
    const f = Math.min(1, (boltT > 0 ? boltT / 0.35 : 0) + (bolt2 > 0 ? 0.5 : 0));
    bolt.intensity = f * 2.2;
    skyMat.color.setRGB(1 + f * 0.6, 1 + f * 0.6, 1 + f * 0.9);
    cloudMat.color.setRGB(0.35 + f * 0.45, 0.33 + f * 0.45, 0.44 + f * 0.5);
  };
})();
