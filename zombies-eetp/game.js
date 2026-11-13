// ---------- Juego: jugador, armas, zombies y menús (el mundo está en mundo.js) ----------
const $ = (id) => document.getElementById(id);
const norm = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const viewAngle = (x, z) => norm(Math.atan2(x - P.x, z - P.z) - (P.yaw + Math.PI));

// ---------- Armas ----------
// near: hasta esa distancia (m) hace el daño completo; far: desde esa distancia ya no hace daño
const WEAPONS = {
  pistola: { name: "Pistola", price: 0, mag: 12, reserve: 48, rate: 0.2, reloadT: 1.2, auto: false, pellets: 1, spread: 0, dmg: 1, aim: false, near: 7, far: 12 },
  fal: { name: "FAL", price: 520, mag: 20, reserve: 100, rate: 0.1, reloadT: 2.0, auto: true, pellets: 1, spread: 0.008, dmg: 2, aim: true, near: 45, far: 75 },
  m1: { name: "Carabina M1", price: 260, mag: 15, reserve: 60, rate: 0.22, reloadT: 1.8, auto: false, pellets: 1, spread: 0.012, dmg: 2, aim: true, near: 28, far: 48 },
  chispa: { name: "Pistola de chispa", price: 70, mag: 1, reserve: 15, rate: 1.1, reloadT: 3.0, auto: false, pellets: 1, spread: 0.015, dmg: 3, aim: false, near: 5, far: 9 },
};
const inv = [{ type: "pistola", mag: WEAPONS.pistola.mag, reserve: WEAPONS.pistola.reserve }];
let act = 0;

// Texturas: acero cepillado para el metal y vetas para la madera
function brushTex(base, streak) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 170; k++) {
    g.globalAlpha = 0.06 + Math.random() * 0.14;
    g.fillStyle = Math.random() < 0.6 ? streak : "#000";
    g.fillRect(Math.random() * 128, Math.random() * 128, 20 + Math.random() * 70, 1);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function grainTex(base, line) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 70; k++) {
    g.globalAlpha = 0.12 + Math.random() * 0.22;
    g.fillStyle = line;
    g.fillRect(0, Math.random() * 128, 128, 0.6 + Math.random() * 2);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const gunMat = new THREE.MeshStandardMaterial({ map: brushTex("#4a4f58", "#a4adb8"), roughness: 0.38, metalness: 0.6 });
const blackMat = new THREE.MeshStandardMaterial({ map: brushTex("#1d1e23", "#4a4d56"), roughness: 0.5, metalness: 0.4 });
const woodMat = new THREE.MeshStandardMaterial({ map: grainTex("#6b4426", "#2a170b"), roughness: 0.7 });
const knifeMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.9, roughness: 0.25 });

// Modelos de arma: cañón hacia -z, base en el puño
function makeGun(type) {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    g.add(m);
  };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const C = (r, l) => new THREE.CylinderGeometry(r, r, l, 10);
  const H = Math.PI / 2;
  if (type === "pistola") {
    add(B(0.05, 0.06, 0.3), gunMat, 0, 0.03, -0.13);
    add(B(0.045, 0.04, 0.26), blackMat, 0, -0.02, -0.12);
    add(C(0.011, 0.1), gunMat, 0, 0.03, -0.3, H);
    add(B(0.04, 0.13, 0.06), blackMat, 0, -0.1, -0.02, 0.2);
    add(B(0.012, 0.03, 0.07), blackMat, 0, -0.05, -0.07);
    add(B(0.012, 0.012, 0.012), gunMat, 0, 0.07, -0.27);
  } else if (type === "fal") {
    add(B(0.06, 0.09, 0.42), gunMat, 0, 0.0, -0.2);
    add(C(0.012, 0.4), gunMat, 0, 0.03, -0.6, H);
    add(C(0.018, 0.05), blackMat, 0, 0.03, -0.82, H);
    add(B(0.07, 0.07, 0.28), woodMat, 0, -0.01, -0.46);
    add(B(0.03, 0.03, 0.22), blackMat, 0, 0.08, -0.22);
    add(B(0.04, 0.13, 0.05), blackMat, 0, -0.11, 0.0, 0.25);
    add(B(0.05, 0.07, 0.12), blackMat, 0, 0, 0.07);
    add(B(0.06, 0.1, 0.3), woodMat, 0, -0.02, 0.26);
    add(B(0.065, 0.03, 0.3), woodMat, 0, 0.03, 0.26);
    add(B(0.01, 0.04, 0.01), blackMat, 0, 0.08, -0.5);
  } else if (type === "m1") {
    add(B(0.05, 0.07, 0.26), gunMat, 0, 0.02, -0.1);
    add(C(0.01, 0.36), gunMat, 0, 0.03, -0.42, H);
    add(B(0.01, 0.03, 0.01), blackMat, 0, 0.07, -0.56);
    add(B(0.07, 0.06, 0.18), woodMat, 0, 0, -0.3);
    add(B(0.06, 0.11, 0.26), woodMat, 0, -0.01, 0.2);
    add(B(0.065, 0.12, 0.03), blackMat, 0, -0.01, 0.34);
    add(B(0.07, 0.04, 0.12), woodMat, 0, 0.04, 0.1);
    add(B(0.035, 0.12, 0.05), woodMat, 0, -0.1, -0.02, 0.2);
    add(B(0.02, 0.02, 0.05), blackMat, 0, 0.06, 0.02);
  } else {
    // Pistola de chispa: cañón largo, culata de madera, llave de chispa al costado
    add(C(0.02, 0.42), gunMat, 0, 0.03, -0.3, H);
    add(C(0.028, 0.03), gunMat, 0, 0.03, -0.52, H);
    add(C(0.006, 0.36), woodMat, 0, -0.035, -0.2, H);
    add(B(0.05, 0.03, 0.02), gunMat, 0, 0.03, -0.1);
    add(B(0.06, 0.1, 0.26), woodMat, 0, -0.01, 0.0);
    add(B(0.05, 0.13, 0.06), woodMat, 0, -0.1, 0.06, 0.2);
    add(B(0.01, 0.07, 0.1), gunMat, 0.035, 0.0, -0.02);
    add(B(0.012, 0.03, 0.03), gunMat, 0.04, 0.05, -0.02);
    add(B(0.02, 0.02, 0.07), gunMat, 0, -0.05, -0.02);
  }
  return g;
}

const GUN_BASE = new THREE.Vector3(0.22, -0.2, -0.42);
const GUN_AIM = new THREE.Vector3(0, -0.16, -0.34);
// Dónde agarra cada arma la mano derecha (agarre), la izquierda (apoyo) y dónde está el cargador
// (o la boca del cañón, para cargar la chispa con la baqueta)
const HANDS = {
  pistola: { grip: [0, -0.1, -0.02], support: [0, -0.08, -0.1], mag: [0, -0.12, -0.02], reload: "mag" },
  fal: { grip: [0, -0.11, 0], support: [0, -0.03, -0.42], mag: [0, -0.12, -0.18], reload: "mag" },
  m1: { grip: [0, -0.1, -0.02], support: [0, -0.02, -0.3], mag: [0, -0.1, -0.1], reload: "mag" },
  chispa: { grip: [0, -0.1, 0.06], support: [0, 0, -0.22], mag: [0, 0.03, -0.52], reload: "ramrod" },
};
const magGeo = new THREE.BoxGeometry(0.045, 0.14, 0.065);
const viewModels = {};
for (const t of Object.keys(WEAPONS)) {
  const g = makeGun(t);
  g.position.copy(GUN_BASE);
  g.visible = false;
  camera.add(g);
  viewModels[t] = g;
  if (HANDS[t].reload === "mag") {
    // Cargador separado del arma: así se puede sacar y poner en la recarga
    const mag = new THREE.Mesh(magGeo, blackMat);
    mag.position.set(...HANDS[t].mag);
    g.add(mag);
    g.userData.mag = mag;
  }
}

// Armas en la pared: pegadas al muro, horizontales
const SHOP_TYPES = ["fal", "m1", "chispa"];
const stations = SHOP.map((s, k) => {
  const type = SHOP_TYPES[k % SHOP_TYPES.length];
  const wz = s.face === "n" ? s.j * CELL - CELL / 2 + 0.05 : s.j * CELL + CELL / 2 - 0.05;
  const g = makeGun(type);
  g.position.set(s.i * CELL, 1.35, wz);
  g.rotation.y = Math.PI / 2;
  scene.add(g);
  const glow = new THREE.PointLight(0xffa040, 0.6, 3);
  glow.position.set(s.i * CELL, 1.9, wz + (s.face === "n" ? 0.4 : -0.4));
  scene.add(glow);
  QUAL.light.push(glow);
  return { type, x: s.i * CELL, z: s.j * CELL };
});

const knife = new THREE.Group();
const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.008), knifeMat);
blade.position.y = 0.12;
const guard = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.03), blackMat);
guard.position.y = 0.01;
const handle = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.1, 0.034), woodMat);
handle.position.y = -0.05;
knife.add(blade, guard, handle);
knife.visible = false;
camera.add(knife);

// ---------- Brazos en primera persona: la derecha sostiene el arma o el cuchillo ----------
const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -0.3, 0);
const SPARE_POS = new THREE.Vector3(-0.22, -0.46, -0.3);   // cartuchera, abajo a la izquierda
const REST_L = new THREE.Vector3(-0.22, -0.47, -0.38);     // mano izquierda suelta (con el cuchillo)
const SHOULDER_R = new THREE.Vector3(0.3, -0.42, -0.08);
const SHOULDER_L = new THREE.Vector3(-0.3, -0.42, -0.08);
const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x2f3328, roughness: 0.9 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0x9a7560, roughness: 0.75 });
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const handGeo = new THREE.BoxGeometry(0.07, 0.085, 0.11);
const seg = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerpV = (a, b, k) => a.clone().lerp(b, k);
let leftTarget = SPARE_POS.clone();
const _lp = new THREE.Vector3();
// Punto local de un arma o del cuchillo, en coordenadas de cámara
function localToCam(obj, lx, ly, lz) {
  return _lp.set(lx, ly, lz).applyEuler(obj.rotation).add(obj.position).clone();
}
function makeArm() {
  const arm = { upper: new THREE.Mesh(cylGeo, sleeveMat), fore: new THREE.Mesh(cylGeo, sleeveMat), hand: new THREE.Mesh(handGeo, skinMat) };
  arm.upper.userData.r = 0.05;
  arm.fore.userData.r = 0.043;
  camera.add(arm.upper, arm.fore, arm.hand);
  return arm;
}
// Tubo entre dos puntos (en coordenadas de cámara)
function limb(m, a, b) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = Math.max(0.001, dir.length());
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  m.scale.set(m.userData.r, len, m.userData.r);
}
const rightArm = makeArm(), leftArm = makeArm();
// El codo queda abajo y hacia atrás entre el hombro y la mano
function placeArm(arm, sh, hand) {
  const elbow = new THREE.Vector3().addVectors(sh, hand).multiplyScalar(0.5).add(new THREE.Vector3(sh.x > 0 ? 0.04 : -0.04, -0.14, 0.05));
  limb(arm.upper, sh, elbow);
  limb(arm.fore, elbow, hand);
  arm.hand.position.copy(hand);
  arm.hand.quaternion.copy(arm.fore.quaternion);
}

// Cargador de repuesto, cargador que sale y cartucho de la chispa
const fallMag = new THREE.Mesh(magGeo, blackMat);
const spareMag = new THREE.Mesh(magGeo, blackMat);
const cartridge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xbfae84, roughness: 0.9 }));
for (const m of [fallMag, spareMag, cartridge]) { m.visible = false; camera.add(m); }

// Inclinación del arma durante la recarga (la recarga empieza en 0 y termina en 1)
function reloadTilt(t, h) {
  if (t < 0) return 0;
  return (h.reload === "mag" ? 0.3 : 0.5) * seg(t, 0, 0.15) * (1 - seg(t, 0.85, 1));
}

// Recarga: saca el cargador, toma el de repuesto de la cartuchera y lo mete.
// En la chispa: toma el cartucho, lo mete por la boca del cañón y empuja con la baqueta.
function reloadProps(t, h, gun) {
  const sup = localToCam(gun, ...h.support);
  const well = localToCam(gun, ...h.mag);
  const mag = gun.userData.mag;
  let left = sup;
  fallMag.visible = spareMag.visible = cartridge.visible = false;
  if (mag) mag.visible = true;
  if (t >= 0) {
    if (h.reload === "mag") {
      if (t < 0.12) left = lerpV(sup, well, seg(t, 0, 0.12));
      else if (t < 0.3) left = lerpV(well, well.clone().add(DOWN), seg(t, 0.12, 0.3));
      else if (t < 0.5) left = lerpV(well.clone().add(DOWN), SPARE_POS, seg(t, 0.3, 0.5));
      else if (t < 0.66) left = lerpV(SPARE_POS, well, seg(t, 0.5, 0.66));
      else if (t < 0.88) left = well.clone();
      else left = lerpV(well, sup, seg(t, 0.88, 1));
      if (t >= 0.12 && t < 0.5) {
        fallMag.visible = true;
        const k = seg(t, 0.3, 0.5);
        fallMag.position.copy(t < 0.3 ? left : new THREE.Vector3(well.x, well.y - 0.3 - 0.6 * k, well.z + 0.05 * k));
      }
      if (t >= 0.3 && t < 0.8) {
        spareMag.visible = true;
        spareMag.position.copy(t < 0.5 ? SPARE_POS : left);
      }
      if (mag) mag.visible = t < 0.12 || t >= 0.8;
    } else {
      if (t < 0.2) left = lerpV(sup, SPARE_POS, seg(t, 0, 0.2));
      else if (t < 0.4) left = lerpV(SPARE_POS, well, seg(t, 0.2, 0.4));
      else if (t < 0.75) left = well.clone().add(new THREE.Vector3(0, 0, 0.2 * Math.abs(Math.sin((t - 0.4) * Math.PI * 6))));
      else left = lerpV(well, sup, seg(t, 0.75, 1));
      if (t >= 0.1 && t < 0.4) {
        cartridge.visible = true;
        cartridge.position.copy(left);
      }
    }
  }
  leftTarget = left;
}

// ---------- Zombies ----------
const zombies = [];
const corpses = [];
const zEye = new THREE.MeshBasicMaterial({ color: 0xff3b2e });
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const KINDS = {
  normal: { torso: 0x41573a, skin: 0x8c9b7a, scale: 1, speed: 1, hp: 1 },
  corredor: { torso: 0x5a3a2e, skin: 0xa8a07a, scale: 0.9, speed: 1.35, hp: 0.7 },
  tanque: { torso: 0x2c3a46, skin: 0x6f7f66, scale: 1.25, speed: 0.7, hp: 2 },
};

function makeZombie(x, z, hp, speed, kind) {
  const g = new THREE.Group();
  g.scale.setScalar(kind.scale);
  const skin = new THREE.MeshStandardMaterial({ color: kind.skin, roughness: 0.8 });
  const torsoMat = new THREE.MeshStandardMaterial({ color: kind.torso, roughness: 1 });
  const box = (w, h, d, mat, bx, by, bz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(bx, by, bz);
    g.add(m);
    return m;
  };
  box(0.5, 0.7, 0.28, torsoMat, 0, 1.05, 0);
  const head = box(0.3, 0.32, 0.3, skin, 0, 1.6, 0);
  box(0.05, 0.03, 0.02, zEye, -0.07, 1.62, 0.16);
  box(0.05, 0.03, 0.02, zEye, 0.07, 1.62, 0.16);
  const armL = box(0.14, 0.6, 0.14, skin, -0.34, 1.1, 0.2);
  const armR = box(0.14, 0.6, 0.14, skin, 0.34, 1.1, 0.2);
  const legL = box(0.18, 0.8, 0.2, torsoMat, -0.13, 0.4, 0);
  const legR = box(0.18, 0.8, 0.2, torsoMat, 0.13, 0.4, 0);
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), hitMat);
  hitbox.position.y = 0.9;
  g.add(hitbox);
  g.position.set(x, -1.6, z);
  scene.add(g);
  const zo = {
    group: g, x, z, hp, hitbox, torsoMat, head, armL, armR, legs: [legL, legR],
    speed: speed * (0.9 + Math.random() * 0.25), phase: Math.random() * 6,
    hurt: 0, atk: 0, walk: 0, stagger: 0, rise: 0.9,
  };
  hitbox.userData.zombie = zo;
  zombies.push(zo);
}

function removeZombie(zo) {
  const k = zombies.indexOf(zo);
  if (k >= 0) zombies.splice(k, 1);
}

function killZombie(zo, quiet = false) {
  if (!quiet) Sonido.muerte(zo.x, zo.z);
  removeZombie(zo);
  P.score += 100;
  P.money += 15;
  corpses.push({ group: zo.group, legs: zo.legs, armL: zo.armL, armR: zo.armR, t: 0 });
  zo.group.position.set(zo.x, 0, zo.z);
  dropPower(zo.x, zo.z);
}

function damageZombie(zo, amount) {
  zo.hp -= amount;
  zo.hurt = 0.12;
  zo.stagger = 0.2;
  if (zo.hp <= 0) killZombie(zo);
  else Sonido.golpe(zo.x, zo.z);
}

const waveStats = (w) => ({
  count: 3 + w * 2,
  speed: Math.min(3.4, 1.1 + w * 0.12),
  hp: 2 + Math.floor(w / 2),
});

// ---------- Estado ----------
const P = {
  x: START.i * CELL, z: START.j * CELL, yaw: 0, pitch: 0,
  hp: 100, stamina: 100, money: 0, score: 0, wave: 0,
  cool: 0, flash: 0, reload: 0, reloadDur: 1, kick: 0, walk: 0, side: 0,
  instaT: 0, bombs: 0,
};
const keys = {};
const sway = { x: 0, y: 0 }; // el arma se queda un poco atrás cuando movés el mouse
let state = "menu";
let phase = "cool", cool = 4, toSpawn = 0, spawnT = 0, dmgFlash = 0, time = 0;
let knifeT = -1, knifeHit = false, aiming = false, aimT = 0, mouseHeld = false;
let field = null, fieldKey = "";

// Recalcula el mapa de rutas cuando el jugador cambia de celda
function refreshField() {
  const c = cellOf(P.x, P.z), key = c.i + "," + c.j;
  if (!field || key !== fieldKey) {
    field = buildField(c.i, c.j);
    fieldKey = key;
  }
}

// Siguiente celda de la ruta: la vecina con menor distancia al jugador
function nextStep(zo) {
  const here = cellOf(zo.x, zo.z);
  let best = field[here.j * COLS + here.i], bi = here.i, bj = here.j;
  for (const [di, dj] of DIRS) {
    const ni = here.i + di, nj = here.j + dj;
    if (ni < 0 || nj < 0 || ni >= COLS || nj >= ROWS) continue;
    const v = field[nj * COLS + ni];
    if (v < best) { best = v; bi = ni; bj = nj; }
  }
  return { i: bi, j: bj };
}

function spawnZombie() {
  if (!field) return false;
  const ok = SPAWN_CELLS.filter((c) => {
    const x = c.i * CELL, z = c.j * CELL;
    const dd = Math.hypot(x - P.x, z - P.z);
    return dd > 16 && dd < 40 &&
      Math.abs(viewAngle(x, z)) > 1.1 &&
      isFinite(field[c.j * COLS + c.i]) &&
      !zombies.some((o) => Math.hypot(o.x - x, o.z - z) < 2.5);
  });
  if (!ok.length) return false;
  const c = ok[Math.floor(Math.random() * ok.length)];
  const s = waveStats(P.wave);
  const r = Math.random();
  const kind = r < 0.6 ? KINDS.normal : r < 0.85 ? KINDS.corredor : KINDS.tanque;
  makeZombie(c.i * CELL, c.j * CELL, Math.max(1, Math.round(s.hp * kind.hp)), s.speed * kind.speed, kind);
  return true;
}

function nextWave() {
  P.wave++;
  toSpawn = waveStats(P.wave).count;
  spawnT = 0.5;
}

function updateWaves(dt) {
  if (phase === "cool") {
    cool -= dt;
    if (cool <= 0) { nextWave(); phase = "fight"; }
  } else if (toSpawn === 0 && zombies.length === 0) {
    phase = "cool";
    cool = 10;
    Sonido.oleada();
  }
  if (toSpawn > 0) {
    spawnT -= dt;
    if (spawnT <= 0) {
      if (spawnZombie()) {
        toSpawn--;
        spawnT = Math.max(0.4, 1.8 - P.wave * 0.07);
      } else {
        spawnT = 0.5;
      }
    }
  }
}

function updateZombie(zo, dt) {
  zo.hurt = Math.max(0, zo.hurt - dt);
  zo.stagger = Math.max(0, zo.stagger - dt);
  zo.atk = Math.max(0, zo.atk - dt);
  zo.torsoMat.emissive.setRGB(zo.hurt > 0 ? 0.5 : 0, 0, 0);

  if (zo.rise > 0) {
    zo.rise = Math.max(0, zo.rise - dt);
    zo.group.position.set(zo.x, -1.6 * (zo.rise / 0.9), zo.z);
    return;
  }

  const dP = Math.hypot(P.x - zo.x, P.z - zo.z);
  zo.group.rotation.y = Math.atan2(P.x - zo.x, P.z - zo.z);

  // Destino: el siguiente paso de la ruta, o el jugador si está cerca
  let tx = P.x, tz = P.z, chewing = null;
  if (field && dP > 1.0) {
    const n = nextStep(zo);
    const here = cellOf(zo.x, zo.z);
    if (n.i !== here.i || n.j !== here.j) {
      tx = n.i * CELL;
      tz = n.j * CELL;
      const w = winAt(n.i, n.j);
      if (w && !passW(w)) chewing = w;
    }
  }
  const dT = Math.hypot(tx - zo.x, tz - zo.z);

  if (chewing && dT < 1.9) {
    // Está frente a una ventana: rompe las tablas
    chewing.hp -= dt * 1.2;
    if (chewing.planks) chewing.planks.position.y = Math.sin(time * 40) * 0.03;
    zo.walk += dt * 2;
    if (chewing.hp <= 0) {
      breakWindow(chewing);
      field = null;
    }
  } else if (dP < 1.0) {
    if (zo.atk <= 0) {
      P.hp -= 10;
      dmgFlash = 0.35;
      zo.atk = 1;
    }
  } else if (zo.stagger <= 0) {
    // Se mueve por la ruta, separándose de los otros zombies para no apilarse
    let sx = 0, sz = 0;
    for (const o of zombies) {
      if (o === zo) continue;
      const ox = zo.x - o.x, oz = zo.z - o.z, od = Math.hypot(ox, oz);
      if (od > 0 && od < 0.7) { sx += (ox / od) * (0.7 - od); sz += (oz / od) * (0.7 - od); }
    }
    const dx = tx - zo.x, dz = tz - zo.z, d = Math.hypot(dx, dz) || 1e-6;
    const sp = zo.speed * (dP < 4 ? 1.3 : 1) * dt;
    const c = collide(zo.x + (dx / d) * sp + sx * dt * 4, zo.z + (dz / d) * sp + sz * dt * 4, 0.3);
    zo.x = c.x;
    zo.z = c.z;
    zo.walk += dt * zo.speed * 4;
  }

  // Animación: paso pesado con balanceo, brazos al frente y estirada al atacar
  const bob = Math.abs(Math.sin(zo.walk)) * 0.05;
  zo.group.position.set(zo.x, bob, zo.z);
  zo.group.rotation.z = Math.sin(zo.walk) * 0.025;
  zo.legs[0].rotation.x = Math.sin(zo.walk) * 0.9;
  zo.legs[1].rotation.x = -Math.sin(zo.walk) * 0.9;
  const lunge = zo.atk > 0.6 ? -0.5 : 0;
  zo.armL.rotation.x = zo.armR.rotation.x = -1.2 + lunge + Math.sin(zo.walk) * 0.3 + (zo.stagger > 0 ? -0.5 : 0);
  zo.head.rotation.z = Math.sin(time * 3 + zo.phase) * 0.08;
  zo.head.rotation.x = Math.sin(zo.walk * 0.5 + zo.phase) * 0.1;
}

function updateCorpses(dt) {
  for (const c of corpses.slice()) {
    c.t += dt;
    c.group.rotation.x = -Math.min(1, c.t * 3) * (Math.PI / 2);
    const fade = Math.max(0, 1 - c.t);
    c.legs[0].rotation.x = Math.sin(c.t * 14) * 0.5 * fade;
    c.legs[1].rotation.x = Math.sin(c.t * 11 + 1) * 0.5 * fade;
    c.armL.rotation.x = Math.sin(c.t * 9 + 2) * 0.6 * fade;
    c.armR.rotation.x = Math.sin(c.t * 12) * 0.6 * fade;
    if (c.t > 8) {
      scene.remove(c.group);
      corpses.splice(corpses.indexOf(c), 1);
    }
  }
}

// ---------- Disparo, recarga, cuchillo y compra ----------
const ray = new THREE.Raycaster();

function startReload() {
  const w = inv[act], d = WEAPONS[w.type];
  if (P.reload > 0 || w.mag === d.mag || w.reserve <= 0) return;
  P.reload = d.reloadT;
  P.reloadDur = d.reloadT;
}

// Daño según el calibre: completo de cerca, cero de lejos
function falloff(d, dist) {
  if (dist <= d.near) return 1;
  if (dist >= d.far) return 0;
  return (d.far - dist) / (d.far - d.near);
}

function fire() {
  const w = inv[act], d = WEAPONS[w.type];
  if (state !== "play" || P.cool > 0 || P.reload > 0 || knifeT >= 0) return;
  if (w.mag <= 0) {
    startReload();
    if (w.reserve <= 0) { Sonido.vacio(); P.cool = 0.3; }
    return;
  }
  w.mag--;
  P.cool = d.rate;
  P.flash = 0.05;
  P.kick = 1;
  Sonido.disparo(w.type);
  const spread = d.spread * (aiming && d.aim ? 0.4 : 1);
  const targets = solidMeshes.filter((m) => m.parent).concat(zombies.map((z) => z.hitbox));
  const dmgBy = new Map();
  for (let k = 0; k < d.pellets; k++) {
    ray.setFromCamera(new THREE.Vector2((Math.random() * 2 - 1) * spread, (Math.random() * 2 - 1) * spread), camera);
    const hit = ray.intersectObjects(targets, false)[0];
    if (hit && hit.object.userData.zombie) {
      const zo = hit.object.userData.zombie;
      dmgBy.set(zo, (dmgBy.get(zo) || 0) + (P.instaT > 0 ? 999 : d.dmg * falloff(d, hit.distance)));
    }
  }
  for (const [zo, dmg] of dmgBy) if (dmg > 0) damageZombie(zo, dmg);
}

function startKnife() {
  if (state !== "play" || knifeT >= 0) return;
  knifeT = 0;
  knifeHit = false;
}

function knifeSwing() {
  for (const zo of zombies.slice()) {
    const d = Math.hypot(zo.x - P.x, zo.z - P.z);
    if (d < 1.9 && Math.abs(viewAngle(zo.x, zo.z)) < 0.9) damageZombie(zo, P.instaT > 0 ? 999 : 2);
  }
}

function nearStation() {
  let best = null, bd = 2.6;
  for (const s of stations) {
    const d = Math.hypot(s.x - P.x, s.z - P.z);
    if (d < bd && Math.abs(viewAngle(s.x, s.z)) < 0.9) { best = s; bd = d; }
  }
  return best;
}

function nearBrokenWindow() {
  let best = null, bd = 2.2;
  for (const w of WINDOWS.values()) {
    if (!w.broken) continue;
    const d = Math.hypot(w.i * CELL - P.x, w.j * CELL - P.z);
    if (d < bd) { best = w; bd = d; }
  }
  return best;
}

function nearDoor() {
  for (const w of WINDOWS.values()) {
    if (w.door && Math.hypot(w.i * CELL - P.x, w.j * CELL - P.z) < 2.4) return w;
  }
  return null;
}

function stationPrompt(st) {
  const d = WEAPONS[st.type];
  if (inv.some((w) => w.type === st.type)) return `Ya tenés la ${d.name.toLowerCase()}`;
  if (P.money < d.price) return `${d.name}: te faltan $${d.price - P.money}`;
  return inv.length < 2
    ? `E: comprar ${d.name} ($${d.price})`
    : `E: cambiar ${WEAPONS[inv[act].type].name} por ${d.name} ($${d.price})`;
}

function buy(st) {
  const d = WEAPONS[st.type];
  if (inv.some((w) => w.type === st.type) || P.money < d.price) return;
  P.money -= d.price;
  const nw = { type: st.type, mag: d.mag, reserve: d.reserve };
  if (inv.length < 2) {
    inv.push(nw);
    act = inv.length - 1;
  } else {
    inv[act] = nw;
  }
  P.reload = 0;
  syncView();
}

function switchTo(idx) {
  if (!inv[idx] || idx === act || P.reload > 0) return;
  act = idx;
  syncView();
}

function syncView() {
  const cur = inv[act].type;
  for (const t in viewModels) viewModels[t].visible = t === cur;
}

// ---------- Menús: título, Iniciar/Continuar y Desconectar ----------
function lock() {
  try {
    const r = canvas.requestPointerLock();
    if (r && r.catch) r.catch(() => {});
  } catch (_) {}
}

function goFullscreen() {
  try {
    const r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    if (r && r.catch) r.catch(() => {});
  } catch (_) {}
}

function freePointer() {
  try { document.exitPointerLock(); } catch (_) {}
}

let menuMode = "menu";
const QUALS = { alto: 1.5, medio: 1, bajo: 0.6 };
let Q = "alto";
try { Q = localStorage.getItem("eetp-graficos") || "alto"; } catch (_) {}
if (!QUALS[Q]) Q = "alto";

// Calidad: "Bajo" reduce la resolución y apaga pasto, niebla y luces extra
function setQuality(nivel) {
  Q = nivel;
  try { localStorage.setItem("eetp-graficos", nivel); } catch (_) {}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUALS[nivel]));
  const alto = nivel !== "bajo";
  for (const o of QUAL.low) o.visible = alto;
  for (const l of QUAL.light) l.visible = alto;
  resize();
}

function showMenu(mode) {
  menuMode = mode;
  $("overlay").hidden = false;
  $("ov-title").textContent = mode === "dead" ? "Caíste" : "Zombies con la EETP";
  $("ov-text").textContent =
    mode === "dead" ? `Llegaste a la oleada ${P.wave} con ${P.score} puntos.` :
    mode === "pause" ? "Juego en pausa." :
    "Defendé el edificio. Los zombies vienen desde el patio, rompen las tablas de las ventanas y entran. Reparalas con F.";
  $("btn-go").textContent = mode === "pause" ? "Continuar" : mode === "dead" ? "Volver a empezar" : "Iniciar";
  $("btn-quit").hidden = mode === "menu";
  $("ov-hint").textContent = mode === "menu"
    ? "WASD mover · Shift correr · Mouse mirar · Click disparar · Click der. apuntar · V cuchillo · 1/2 armas · R recargar · E comprar · F reparar ventana · G bomba · Esc pausar"
    : "";
}

function refreshOpts() {
  $("btn-gfx").textContent = "Gráficos: " + { alto: "Alto", medio: "Medio", bajo: "Bajo" }[Q];
  $("btn-snd").textContent = "Sonido: " + (Sonido.on ? "Sí" : "No");
}

function showOpts() {
  $("ov-title").textContent = "Opciones";
  $("btns").hidden = true;
  $("ov-text").hidden = true;
  $("ov-hint").hidden = true;
  $("av-pick").hidden = true;
  $("opts").hidden = false;
  refreshOpts();
}

function hideOpts() {
  $("opts").hidden = true;
  $("btns").hidden = false;
  $("ov-text").hidden = false;
  $("ov-hint").hidden = false;
  $("av-pick").hidden = false;
  showMenu(menuMode);
}

function pause() {
  if (state !== "play") return;
  state = "pause";
  for (const k in keys) keys[k] = false;
  aiming = false;
  mouseHeld = false;
  freePointer();
  showMenu("pause");
}

function resume() {
  Sonido.iniciar();
  state = "play";
  $("overlay").hidden = true;
  lock();
}

function clearBoard() {
  zombies.slice().forEach((z) => { scene.remove(z.group); removeZombie(z); });
  corpses.splice(0).forEach((c) => scene.remove(c.group));
  pickups.splice(0).forEach((p) => scene.remove(p.group));
  fx.splice(0).forEach((f) => scene.remove(f.m));
  msgT = 0;
}

function start() {
  Sonido.iniciar();
  clearBoard();
  resetWindows();
  Object.assign(P, {
    x: START.i * CELL, z: START.j * CELL, yaw: 0, pitch: 0,
    hp: 100, stamina: 100, money: 0, score: 0, wave: 0,
    cool: 0, flash: 0, reload: 0, kick: 0, walk: 0, instaT: 0, bombs: 0,
  });
  inv.length = 0;
  inv.push({ type: "pistola", mag: WEAPONS.pistola.mag, reserve: WEAPONS.pistola.reserve });
  act = 0;
  syncView();
  toSpawn = 0;
  phase = "cool";
  cool = 4;
  knifeT = -1;
  field = null;
  state = "play";
  $("overlay").hidden = true;
  goFullscreen();
  lock();
}

function quit() {
  clearBoard();
  state = "menu";
  aiming = false;
  mouseHeld = false;
  freePointer();
  showMenu("menu");
}

function die() {
  state = "dead";
  aiming = false;
  mouseHeld = false;
  for (const k in keys) keys[k] = false;
  freePointer();
  showMenu("dead");
}

// ---------- Power-ups: munición máxima, insta-kill y bomba (los sueltan los zombies al morir) ----------
const PU = {
  ammo: { color: 0xc9a227, name: "Munición máxima" },
  insta: { color: 0xff3b2e, name: "Insta-kill" },
  bomb: { color: 0xc86bff, name: "Bomba" },
};
const DROP_CHANCE = 0.12;
const pickups = [];
const fx = [];
let msgT = 0, msgText = "";
function msg(t) { msgText = t; msgT = 2.5; }

function makePickup(kind, x, z) {
  const c = PU[kind].color;
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22),
    new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.3 })
  );
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 6, 20), new THREE.MeshBasicMaterial({ color: c }));
  ring.rotation.x = Math.PI / 2;
  g.add(core, ring);
  g.position.set(x, 0.8, z);
  scene.add(g);
  pickups.push({ kind, group: g, core, t: 0, x, z });
}

// Al morir, el zombie suelta un power-up con cierta probabilidad (40% munición, 35% insta-kill, 25% bomba)
function dropPower(x, z) {
  if (Math.random() > DROP_CHANCE) return;
  const r = Math.random();
  makePickup(r < 0.4 ? "ammo" : r < 0.75 ? "insta" : "bomb", x, z);
}

function removePickup(p) {
  scene.remove(p.group);
  const k = pickups.indexOf(p);
  if (k >= 0) pickups.splice(k, 1);
}

function takePickup(p) {
  removePickup(p);
  if (p.kind === "ammo") {
    for (const w of inv) { const d = WEAPONS[w.type]; w.mag = d.mag; w.reserve = d.reserve; }
    Sonido.recoger();
    msg("Munición máxima: todas las armas recargadas");
  } else if (p.kind === "insta") {
    P.instaT = 10;
    Sonido.instaKill();
    msg("Insta-kill: 10 segundos");
  } else {
    P.bombs = Math.min(3, P.bombs + 1);
    Sonido.recoger();
    msg("Bomba lista: apretá G (tenés " + P.bombs + ")");
  }
}

function updatePickups(dt) {
  for (const p of pickups.slice()) {
    p.t += dt;
    p.core.rotation.y += dt * 2;
    p.group.position.y = 0.8 + Math.sin(p.t * 3) * 0.1;
    p.group.visible = p.t < 12 || Math.floor(p.t * 8) % 2 === 0; // parpadea antes de desaparecer
    if (p.t > 15) { removePickup(p); continue; }
    if (Math.hypot(p.x - P.x, p.z - P.z) < 1.2) takePickup(p);
  }
}

function boom(x, z) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.85, depthWrite: false })
  );
  m.position.set(x, 1, z);
  scene.add(m);
  fx.push({ m, t: 0 });
  Sonido.bomba();
}

function updateFx(dt) {
  for (const f of fx.slice()) {
    f.t += dt;
    const k = f.t / 0.7;
    f.m.scale.setScalar(0.5 + k * 9);
    f.m.material.opacity = Math.max(0, 0.85 * (1 - k));
    if (k >= 1) {
      scene.remove(f.m);
      fx.splice(fx.indexOf(f), 1);
    }
  }
}

// Bomba (tecla G): mata hasta 20 zombies a la vez, los más cercanos
function useBomb() {
  if (state !== "play" || P.bombs <= 0) return;
  P.bombs--;
  const near = zombies.slice().sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z)).slice(0, 20);
  let cx = P.x, cz = P.z;
  if (near.length) {
    cx = near.reduce((s, z) => s + z.x, 0) / near.length;
    cz = near.reduce((s, z) => s + z.z, 0) / near.length;
  }
  boom(cx, cz);
  for (const zo of near) killZombie(zo, true);
  msg(`Bomba: ${near.length} zombies eliminados`);
}

function hudPw() {
  const st = [];
  if (P.instaT > 0) st.push(`INSTA-KILL ${Math.ceil(P.instaT)} s`);
  if (P.bombs > 0) st.push(`BOMBA x${P.bombs} (G)`);
  const lines = [st.join("  ·  "), msgT > 0 ? msgText : ""].filter(Boolean);
  $("pw").textContent = state === "play" ? lines.join("\n") : "";
}

// ---------- Actualización ----------
function update(dt) {
  if (keys.ArrowLeft) P.yaw += 2.2 * dt;
  if (keys.ArrowRight) P.yaw -= 2.2 * dt;

  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
  const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  let mx = 0, mz = 0;
  if (keys.KeyW) { mx += fx; mz += fz; }
  if (keys.KeyS) { mx -= fx; mz -= fz; }
  if (keys.KeyD) { mx += rx; mz += rz; }
  if (keys.KeyA) { mx -= rx; mz -= rz; }
  const len = Math.hypot(mx, mz);
  const sprint = (keys.ShiftLeft || keys.ShiftRight) && len > 0 && P.stamina > 5;
  P.stamina = sprint ? Math.max(0, P.stamina - 25 * dt) : Math.min(100, P.stamina + 15 * dt);
  if (len > 0) {
    const sp = (sprint ? 5.2 : 3) * dt;
    const c = collide(P.x + (mx / len) * sp, P.z + (mz / len) * sp, PR);
    P.x = c.x;
    P.z = c.z;
    P.walk += dt * (sprint ? 12 : 8);
  }
  // Inclinación lateral al caminar de costado
  P.side += ((len > 0 ? (mx * rx + mz * rz) / len : 0) - P.side) * Math.min(1, dt * 8);

  P.cool = Math.max(0, P.cool - dt);
  P.instaT = Math.max(0, P.instaT - dt);
  msgT = Math.max(0, msgT - dt);
  P.flash = Math.max(0, P.flash - dt);
  P.kick = Math.max(0, P.kick - dt * 8);
  dmgFlash = Math.max(0, dmgFlash - dt);

  if (P.reload > 0) {
    P.reload -= dt;
    if (P.reload <= 0) {
      P.reload = 0;
      const w = inv[act], d = WEAPONS[w.type];
      const take = Math.min(d.mag - w.mag, w.reserve);
      w.mag += take;
      w.reserve -= take;
    }
  }

  if (knifeT >= 0) {
    knifeT += dt;
    const p = Math.min(1, knifeT / 0.5);
    if (!knifeHit && p >= 0.4) { knifeHit = true; knifeSwing(); }
    if (p >= 1) { knifeT = -1; knife.visible = false; }
  }

  if ((mouseHeld || keys.Space) && WEAPONS[inv[act].type].auto) fire();

  const wantAim = aiming && WEAPONS[inv[act].type].aim ? 1 : 0;
  aimT += (wantAim - aimT) * Math.min(1, dt * 10);

  refreshField();
  updateWaves(dt);
  for (const zo of zombies.slice()) updateZombie(zo, dt);
  if (P.hp <= 0) die();
}

// Cámara, arma, cuchillo: recarga, apuntado y tajada (el arma desaparece durante la tajada)
function animateView(dt) {
  const idle = Math.sin(time * 1.4) * 0.002;
  const step = Math.abs(Math.sin(P.walk)) * 0.02;
  camera.position.set(P.x, EYE + idle - step * (1 - aimT), P.z);
  camera.rotation.set(P.pitch + Math.sin(P.walk * 2) * 0.003 * (1 - aimT), P.yaw, -P.side * 0.012 + Math.sin(P.walk) * 0.002);
  sway.x += (0 - sway.x) * Math.min(1, dt * 6);
  sway.y += (0 - sway.y) * Math.min(1, dt * 6);
  camera.fov = 72 - 20 * aimT;
  camera.updateProjectionMatrix();

  const gun = viewModels[inv[act].type];
  const bob = Math.sin(P.walk) * 0.005 * (1 - aimT);
  const h = HANDS[inv[act].type];
  const t = P.reload > 0 ? 1 - P.reload / P.reloadDur : -1;
  const tilt = reloadTilt(t, h);
  const drop = 0;
  gun.position.set(
    GUN_BASE.x + (GUN_AIM.x - GUN_BASE.x) * aimT + bob + sway.x,
    GUN_BASE.y + (GUN_AIM.y - GUN_BASE.y) * aimT - drop + sway.y,
    GUN_BASE.z + (GUN_AIM.z - GUN_BASE.z) * aimT + P.kick * 0.03
  );
  gun.rotation.set(tilt - P.kick * 0.05, 0, 0);
  reloadProps(t, h, gun);

  const knifing = knifeT >= 0;
  syncView();
  for (const t in viewModels) viewModels[t].visible = viewModels[t].visible && !knifing;
  if (knifing) {
    const s = Math.min(1, knifeT / 0.5);
    const e = s * s * (3 - 2 * s);
    knife.visible = true;
    knife.position.set(0.45 - 0.95 * e, -0.3 + 0.22 * Math.sin(Math.PI * e), -0.45);
    knife.rotation.set(0, 0, 0.9 - 1.8 * e);
  }
  // Brazos: la derecha sostiene el arma o el cuchillo por el mango; la izquierda, el cargador o el apoyo
  const grip = knifing ? localToCam(knife, 0, -0.05, 0) : localToCam(gun, ...h.grip);
  placeArm(rightArm, SHOULDER_R, grip);
  placeArm(leftArm, SHOULDER_L, knifing ? REST_L : leftTarget);
}

function hud() {
  const w = inv[act], d = WEAPONS[w.type];
  $("wave").textContent = P.wave || "–";
  $("next").textContent = state !== "play" ? "" : phase === "cool" ? `Próxima oleada en ${Math.ceil(cool)} s` : `Quedan ${zombies.length + toSpawn} zombies`;
  $("score").textContent = P.score;
  $("money").textContent = "$" + P.money;
  $("hp-fill").style.width = Math.max(0, P.hp) + "%";
  $("st-fill").style.width = P.stamina + "%";
  $("stwrap").style.opacity = state === "play" && P.stamina < 99 ? 1 : 0;
  $("wname").textContent = d.name;
  $("ammo").textContent = `${w.mag} / ${w.reserve}`;
  $("reloading").hidden = P.reload <= 0;
  $("hurt").style.opacity = Math.min(1, dmgFlash * 2);
  const st = state === "play" ? nearStation() : null;
  const dr = state === "play" && !st ? nearDoor() : null;
  const win = state === "play" && !st && !dr ? nearBrokenWindow() : null;
  $("prompt").textContent = st ? stationPrompt(st) :
    dr ? (dr.broken ? (P.money >= 5 ? "F: reparar puerta ($5)" : "Puerta rota: te faltan $5") : dr.open ? "F: cerrar puerta" : "F: abrir puerta") :
    win ? (P.money >= 5 ? "F: reparar ventana ($5)" : "Reparar ventana: te faltan $5") : "";
}

// ---------- Tamaño: el canvas ocupa toda la pantalla ----------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

// ---------- Eventos ----------
document.addEventListener("mousemove", (e) => {
  if (state === "play" && document.pointerLockElement === canvas) {
    P.yaw -= e.movementX * 0.002;
    sway.x = Math.max(-0.02, Math.min(0.02, sway.x - e.movementX * 0.0004));
    sway.y = Math.max(-0.015, Math.min(0.015, sway.y - e.movementY * 0.0004));
    P.pitch = Math.max(-1.4, Math.min(1.4, P.pitch - e.movementY * 0.002));
  }
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement !== canvas && state === "play") pause();
});

$("btn-go").addEventListener("click", () => (state === "pause" ? resume() : start()));
$("btn-quit").addEventListener("click", quit);
$("btn-opts").addEventListener("click", showOpts);
$("btn-back").addEventListener("click", hideOpts);
$("btn-gfx").addEventListener("click", () => {
  const orden = ["alto", "medio", "bajo"];
  setQuality(orden[(orden.indexOf(Q) + 1) % orden.length]);
  refreshOpts();
});
$("btn-snd").addEventListener("click", () => { Sonido.setOn(!Sonido.on); refreshOpts(); });

$("av-file").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const img = $("av-img");
  img.src = URL.createObjectURL(f);
  img.hidden = false;
});

$("wrap").addEventListener("contextmenu", (e) => e.preventDefault());

$("wrap").addEventListener("mousedown", (e) => {
  if (e.target.closest && e.target.closest("#btns, #av-pick, #opts")) return;
  e.preventDefault();
  if (state !== "play") return;
  if (e.button === 0) {
    mouseHeld = true;
    fire();
    if (document.pointerLockElement !== canvas) lock();
  } else if (e.button === 2 && WEAPONS[inv[act].type].aim) {
    aiming = true;
  }
});

addEventListener("mouseup", (e) => {
  if (e.button === 0) mouseHeld = false;
  if (e.button === 2) aiming = false;
});

const PREVENT = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
addEventListener("keydown", (e) => {
  if (PREVENT.includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === "Escape") {
    if (state === "play") pause();
    else if (state === "pause") resume();
    return;
  }
  if ((e.code === "Enter" || e.code === "Space") && (state === "menu" || state === "dead") && $("opts").hidden) {
    start();
    return;
  }
  if (state !== "play") return;
  if (e.code === "Space") fire();
  else if (e.code === "KeyR") startReload();
  else if (e.code === "KeyV") startKnife();
  else if (e.code === "KeyE") {
    const st = nearStation();
    if (st) buy(st);
  } else if (e.code === "KeyF") {
    const dr = nearDoor();
    const w = nearBrokenWindow();
    if (dr && dr.broken) {
      if (P.money >= 5) { P.money -= 5; buildWindow(dr); field = null; }
    } else if (dr) {
      toggleDoor(dr);
      field = null;
    } else if (w && P.money >= 5) {
      P.money -= 5;
      buildWindow(w);
      field = null;
    }
  } else if (e.code === "Digit1") switchTo(0);
  else if (e.code === "Digit2") switchTo(1);
  else if (e.code === "KeyG") useBomb();
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
addEventListener("blur", () => { for (const k in keys) keys[k] = false; mouseHeld = false; });

// ---------- Bucle principal ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  Sonido.tick(dt, state === "play", zombies, P.x, P.z, P.yaw);
  if (state === "play") {
    time += dt;
    update(dt);
    updateCorpses(dt);
    updatePickups(dt);
    updateFx(dt);
  }
  animateView(dt);
  updateSky(dt);
  renderer.render(scene, camera);
  hud();
  hudPw();
  requestAnimationFrame(frame);
}

syncView();
setQuality(Q);
showMenu("menu");
requestAnimationFrame(frame);
