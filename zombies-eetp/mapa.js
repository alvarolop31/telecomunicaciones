// ---------- Mapa (parte 1): terreno por zonas de formas irregulares, caminos, río con puentes y pantano ----------
// Leyenda de celdas:
// g pasto · . piedra · p camino · r juncos · m barro · ~ río · b puente
// # roca · T árbol · k lápida · f reja · = muro de castillo · C piedra o torre
// H muro de edificio · W ventana · D puerta · x escombros · S fuente · L farol
// (los edificios, la base y el punto de inicio están en mapa2.js)
const COLS = 80, ROWS = 60;

// Ruido suave y determinista (0..1) para que los bordes no sean rectos
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7 + 17.3) * 43758.5453; return s - Math.floor(s); };
const noise = (x, y, s) => {
  const xi = Math.floor(x / s), yi = Math.floor(y / s);
  const xf = x / s - xi, yf = y / s - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const top = a + (b - a) * u, bot = c + (d - c) * u;
  return top + (bot - top) * v;
};
// Elipse con borde irregular: true si la celda cae adentro
const ell = (i, j, cx, cy, rx, ry, amp = 0.12, s = 3) =>
  Math.hypot((i - cx) / rx, (j - cy) / ry) < 1 + amp * (noise(i, j, s) * 2 - 1);

let seedV = 777;
const rnd = () => ((seedV = (seedV * 16807) % 2147483647) / 2147483647);

const G = [];
for (let j = 0; j < ROWS; j++) { G.push([]); for (let i = 0; i < COLS; i++) G[j].push("#"); }
const inside = (i, j) => i >= 1 && j >= 1 && i <= COLS - 2 && j <= ROWS - 2;
const put = (i, j, c) => { if (inside(i, j)) G[j][i] = c; };
const fill = (x0, y0, x1, y1, c) => { for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) put(i, j, c); };
const outline = (x0, y0, x1, y1, c) => {
  for (let i = x0; i <= x1; i++) { put(i, y0, c); put(i, y1, c); }
  for (let j = y0; j <= y1; j++) { put(x0, j, c); put(x1, j, c); }
};
const at = (i, j) => (i < 0 || j < 0 || i >= COLS || j >= ROWS ? "#" : G[j][i]);
// Camino de ancho 2 entre puntos, con leve zigzag para que no sea recto
const road = (pts) => {
  for (let k = 0; k < pts.length - 1; k++) {
    const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
    const horiz = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      const wob = Math.round(Math.sin(t * Math.PI * 3 + k) * 0.6);
      const x = Math.round(x0 + (x1 - x0) * t + (horiz ? 0 : wob));
      const y = Math.round(y0 + (y1 - y0) * t + (horiz ? wob : 0));
      put(x, y, "p");
      put(x + (horiz ? 0 : 1), y + (horiz ? 1 : 0), "p");
    }
  }
};

// 1. Base de pasto con borde de árboles y rocas irregular
fill(1, 1, COLS - 2, ROWS - 2, "g");
for (let j = 1; j <= ROWS - 2; j++) for (let i = 1; i <= COLS - 2; i++) {
  const edge = Math.min(i, j, COLS - 1 - i, ROWS - 1 - j);
  if (edge === 1) put(i, j, noise(i, j, 2) > 0.5 ? "T" : "#");
  else if (edge === 2 && noise(i, j, 2) > 0.72) put(i, j, "T");
}

// 2. Bosque del noroeste: árboles irregulares con claros
for (let j = 2; j <= 24; j++) for (let i = 2; i <= 27; i++) {
  if (ell(i, j, 14, 13, 11, 10, 0.25, 3) && rnd() < 0.36) put(i, j, "T");
}

// 3. Cementerio (norte): cerco ovalado con portones, lápidas y cripta
for (let j = 1; j <= 15; j++) for (let i = 22; i <= 44; i++) {
  if (ell(i, j, 33, 9, 7.2, 4, 0.06, 3)) put(i, j, "g");
  else if (ell(i, j, 33, 9, 8.6, 5, 0.06, 3)) put(i, j, "f");
}
for (let j = 6; j <= 12; j++) for (let i = 27; i <= 39; i++) {
  if (ell(i, j, 33, 9, 6.2, 3.1, 0.06, 3) && rnd() < 0.55) put(i, j, "k");
}
fill(32, 7, 33, 8, "C");
put(33, 14, "p"); // portón sur
put(41, 9, "p");   // portón este
put(25, 9, "p");   // portón oeste

// 4. Castillo en ruinas (oeste): muralla con torres, portones y brechas
outline(2, 30, 15, 44, "=");
fill(3, 31, 14, 43, "g");
fill(2, 30, 3, 31, "C"); fill(14, 30, 15, 31, "C"); fill(2, 43, 3, 44, "C"); fill(14, 43, 15, 44, "C");
put(8, 30, "p"); put(9, 30, "p");     // portón norte
put(15, 37, "p"); put(15, 38, "p");   // portón este
for (let j = 31; j <= 43; j++) for (let i = 3; i <= 14; i++) if (rnd() < 0.05) put(i, j, "x");
for (let j = 30; j <= 44; j++) for (let i = 2; i <= 15; i++) if (G[j][i] === "=" && rnd() < 0.08) put(i, j, "g");

// 5. Granja (suroeste): corral de cerco ovalado con portón y silo
for (let j = 46; j <= 58; j++) for (let i = 4; i <= 27; i++) {
  if (ell(i, j, 16, 53, 10, 5.5, 0.08, 2)) { if (rnd() < 0.05) put(i, j, "T"); }
  else if (ell(i, j, 16, 53, 10.6, 6.1, 0.08, 2)) put(i, j, "f");
}
put(16, 47, "p");
fill(20, 50, 21, 51, "C");

// 6. Pantano (este): barro, juncos y charcos
for (let j = 36; j <= 52; j++) for (let i = 58; i <= 77; i++) {
  if (ell(i, j, 68, 44, 9, 7, 0.3, 3)) put(i, j, rnd() < 0.2 ? "r" : "m");
}
for (let j = 36; j <= 52; j++) for (let i = 58; i <= 77; i++) {
  if (G[j][i] === "m" && rnd() < 0.03) put(i, j, "~");
}

// 7. Cantera (noreste): piedra suelta con peñascos
for (let j = 4; j <= 20; j++) for (let i = 58; i <= 76; i++) {
  if (ell(i, j, 67, 12, 8.5, 6.5, 0.2, 3)) {
    put(i, j, ".");
    if (rnd() < 0.2) put(i, j, "#");
  }
}

// 8. Colina (este): torre de vigía en la cima y arboleda suelta
fill(73, 33, 74, 34, "C");
for (let j = 26; j <= 42; j++) for (let i = 70; i <= 77; i++) {
  if (G[j][i] === "g" && rnd() < 0.08) put(i, j, "T");
}

// 9. Huerto (sur del pueblo): filas de árboles algo desordenadas
for (let j = 52; j <= 56; j += 2) for (let i = 26; i <= 40; i += 3) {
  if (rnd() < 0.85) put(i + (j % 4 === 0 ? 1 : 0), j, "T");
}

// 10. Plaza del pueblo, con fuente en el centro y faroles
for (let j = 1; j <= ROWS - 2; j++) for (let i = 1; i <= COLS - 2; i++) {
  if (ell(i, j, 42, 38, 6.5, 5, 0.12, 2)) put(i, j, ".");
}
put(42, 38, "S"); put(41, 38, "S"); put(43, 38, "S"); put(42, 37, "S"); put(42, 39, "S");
put(35, 42, "L"); put(49, 36, "L"); put(42, 31, "L"); put(31, 38, "L");

// 11. Caminos entre zonas (antes que el río y los edificios)
road([[36, 32], [36, 36], [40, 39]]);                    // puerta de la base -> plaza
road([[15, 37], [28, 37], [34, 38]]);                    // portón este del castillo -> plaza
road([[8, 29], [8, 22], [12, 18], [22, 16], [25, 10]]);  // castillo norte -> bosque -> cementerio
road([[33, 14], [30, 22], [30, 31], [34, 34], [37, 36]]); // cementerio sur -> oeste de la base -> plaza
road([[41, 9], [50, 12], [56, 20]]);                     // cementerio este -> cantera
road([[49, 38], [62, 40], [66, 44]]);                    // plaza -> pantano
road([[49, 30], [60, 24], [66, 14]]);                    // plaza norte -> cantera
road([[35, 40], [26, 44], [16, 47]]);                    // plaza -> corral de la granja
road([[42, 44], [34, 50], [32, 53]]);                    // plaza -> huerto
road([[66, 44], [73, 36], [74, 33]]);                    // pantano -> torre de la colina

// 12. Río que serpentea de norte a sur. Donde un camino lo cruza, la fila es un puente
const riverCx = (j) => 52 + Math.round(3 * Math.sin(j / 4));
for (let j = 1; j <= ROWS - 2; j++) {
  const c = riverCx(j);
  const span = [c - 1, c, c + 1];
  const hayCamino = span.some((i) => G[j][i] === "p" || G[j][i] === "b");
  for (const i of span) put(i, j, hayCamino ? "b" : "~");
  if (rnd() < 0.8) put(c - 2, j, "r");
  if (rnd() < 0.8) put(c + 2, j, "r");
}
