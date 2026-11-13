// ---------- Decoración: lo que se ve en cada zona ----------
const pathTex = noiseTex("#4a3f33", "#6a5a46", 6);
const flagTex = noiseTex("#4a4650", "#2a272e", 3);
const stoneTex = noiseTex("#77727e", "#2d2a33", 3);
const barkTex = noiseTex("#3a2a20", "#5a4232", 2);
const pathMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 1 });
const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.9 });
const castleMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xb9b4b0, roughness: 1 });
const mossyMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0x8d9a86, roughness: 1 });
const rockMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0x6a6670, roughness: 1, flatShading: true });
const slateMat = new THREE.MeshStandardMaterial({ color: 0x2c2a33, roughness: 0.8 });
const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 1 });
const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1f3a26, roughness: 1, flatShading: true });
const canopyDark = new THREE.MeshStandardMaterial({ color: 0x14261b, roughness: 1, flatShading: true });
const grassMat = new THREE.MeshStandardMaterial({ color: 0x3f5c32, roughness: 1 });
const reedMat = new THREE.MeshStandardMaterial({ color: 0x6b7a44, roughness: 1 });
const waterMat = new THREE.MeshStandardMaterial({ color: 0x0d2a33, roughness: 0.12, metalness: 0.5 });
const fountainWater = new THREE.MeshStandardMaterial({ color: 0x3ab6c4, roughness: 0.2, metalness: 0.2, emissive: 0x0a2a30 });
const iron = new THREE.MeshStandardMaterial({ color: 0x1b1b20, roughness: 0.5, metalness: 0.6 });
const purpleGlow = new THREE.MeshBasicMaterial({ color: 0xc86bff });
const warmGlow = new THREE.MeshBasicMaterial({ color: 0xffd060 });

// Adornos que se apagan con la calidad "Bajo" (pasto, niebla, luces extra)
const QUAL = { low: [], light: [] };
const rr = () => Math.random();
const flat = (x, y, z, mat, s = CELL) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  scene.add(m);
  return m;
};
const solid = (m) => { scene.add(m); solidMeshes.push(m); return m; };
function lamp(x, z, color, glowMat) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.8, 6), iron);
  post.position.set(x, 0.9, z);
  scene.add(post);
  solidMeshes.push(post);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), glowMat);
  orb.position.set(x, 1.9, z);
  scene.add(orb);
  const l = new THREE.PointLight(color, 1.0, 10);
  l.position.set(x, 2.0, z);
  scene.add(l);
  QUAL.light.push(l);
}

for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const t = G[j][i], x = i * CELL, z = j * CELL;
  const border = i === 0 || j === 0 || i === COLS - 1 || j === ROWS - 1;

  if (t === "g") {
    if (rr() < 0.07) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 5), grassMat);
      tuft.position.set(x + (rr() - 0.5) * 1.4, 0.13, z + (rr() - 0.5) * 1.4);
      scene.add(tuft);
      QUAL.low.push(tuft);
    }
  } else if (t === "~") {
    flat(x, 0.04, z, waterMat);
  } else if (t === "r" || t === "m") {
    // Juncos en la orilla: tallos finos y altos, sin bloquear el paso
    for (let k = 0; k < 4; k++) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9 + rr() * 0.7, 4), reedMat);
      st.position.set(x + (rr() - 0.5) * 1.6, 0.6, z + (rr() - 0.5) * 1.6);
      st.rotation.z = (rr() - 0.5) * 0.25;
      scene.add(st);
    }
  } else if (t === "b") {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.14, CELL * 0.9), plankMat);
    deck.position.set(x, 0.12, z);
    scene.add(deck);
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.5, 0.08), plankMat);
      rail.position.set(x, 0.42, z + s * CELL * 0.45);
      scene.add(rail);
    }
  } else if (t === "T") {
    // Árbol: tronco y copa de conífera oscura
    const trunk = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.0, 6), trunkMat));
    trunk.position.set(x, 1.0, z);
    const c1 = solid(new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.0, 7), canopyMat));
    c1.position.set(x, 3.2, z);
    c1.rotation.y = rr() * 6;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.2, 7), canopyDark);
    c2.position.set(x, 4.3, z);
    scene.add(c2);
  } else if (t === "k") {
    // Lápida con la parte de arriba redondeada
    const tomb = new THREE.Group();
    const mat = rr() < 0.5 ? castleMat : mossyMat;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.2), mat);
    body.position.y = 0.45;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 10), mat);
    top.rotation.x = Math.PI / 2;
    top.position.y = 0.9;
    tomb.add(body, top);
    tomb.position.set(x, 0, z);
    tomb.rotation.y = (rr() - 0.5) * 0.4;
    scene.add(tomb);
    solidMeshes.push(body);
  } else if (t === "f") {
    // Reja: postes y barras hacia las rejas vecinas
    solid(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), iron)).position.set(x, 0.6, z);
    if (at(i + 1, j) === "f") {
      for (const y of [0.45, 0.9]) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.07, 0.06), iron);
        r.position.set(x + CELL / 2, y, z);
        scene.add(r);
      }
    }
    if (at(i, j + 1) === "f") {
      for (const y of [0.45, 0.9]) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, CELL), iron);
        r.position.set(x, y, z + CELL / 2);
        scene.add(r);
      }
    }
  } else if (t === "C") {
    // Cripta: bloque de piedra con techo de pirámide
    solid(place(new THREE.BoxGeometry(CELL * 0.98, 2.2, CELL * 0.98), castleMat, x, 1.1, z));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(CELL * 0.75, 1.2, 4), slateMat);
    roof.position.set(x, 2.8, z);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);
  } else if (t === "x") {
    // Ruina: muro roto de altura variable
    const h = 0.9 + rr() * 1.1;
    const w = solid(new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.9, h, CELL * 0.9), mossyMat));
    w.position.set(x, h / 2, z);
    w.rotation.y = Math.floor(rr() * 4) * Math.PI / 2 + (rr() - 0.5) * 0.2;
  } else if (t === "S") {
    // Fuente: pileta de piedra con agua; la celda central tiene la columna
    solid(place(new THREE.BoxGeometry(CELL, 0.45, CELL), castleMat, x, 0.22, z));
    flat(x, 0.46, z, fountainWater);
    if (at(i - 1, j) === "S" && at(i + 1, j) === "S" && at(i, j - 1) === "S" && at(i, j + 1) === "S") {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.9, 8), castleMat);
      col.position.set(x, 1.4, z);
      scene.add(col);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 10), castleMat);
      top.position.set(x, 2.4, z);
      scene.add(top);
    }
  } else if (t === "L") {
    lamp(x, z, 0xffb060, warmGlow);
  } else if (t === "=") {
    // Muralla con almenas cada dos celdas
    wallBox(i, j, null, castleMat, 2.4);
    if ((i + j) % 2 === 0) place(new THREE.BoxGeometry(CELL * 0.5, 0.5, CELL * 0.5), castleMat, x, 2.65, z);
  } else if (t === "H") {
    wallBox(i, j, null, houseMat, 2.6);
  } else if (t === "#") {
    if (border) solid(place(new THREE.BoxGeometry(CELL * 1.02, 6, CELL * 1.02), rockMat, x, 3, z));
    else {
      const h = 2.4 + rr() * 1.6;
      const r = solid(place(new THREE.BoxGeometry(CELL * 1.02, h, CELL * 1.02), rockMat, x, h / 2, z));
      r.rotation.y = rr() * 0.4;
    }
  }
}

// Techo plano de la casa
for (const b of BUILDINGS) {
  if (b.ruin) continue; // las ruinas quedan sin techo
  for (let j = b.y0; j <= b.y1; j++) for (let i = b.x0; i <= b.x1; i++) {
    place(new THREE.BoxGeometry(CELL * 1.02, 0.3, CELL * 1.02), slateMat, i * CELL, 2.85, j * CELL);
  }
}

// Luces de la cripta del cementerio y del brasero de la casa
lamp(30 * CELL, 9 * CELL, 0xc86bff, purpleGlow);
const brazier = new THREE.PointLight(0xff9a3c, 1.2, 12);
brazier.position.set(36 * CELL, 2.2, 28 * CELL);
scene.add(brazier);
QUAL.light.push(brazier);

// Niebla baja: manchas suaves sobre el suelo
(function buildFog() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(170,165,190,0.6)");
  gr.addColorStop(1, "rgba(170,165,190,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.4, depthWrite: false });
  for (let k = 0; k < 24; k++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(rr() * COLS * CELL, 0.5 + rr() * 0.6, rr() * ROWS * CELL);
    scene.add(m);
    QUAL.low.push(m);
  }
})();
