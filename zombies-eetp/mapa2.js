// ---------- Mapa (parte 2): edificios, base del jugador, punto de inicio y puntos de compra ----------
// Base: la única casa con puerta (cerrada al empezar, se abre con F) y ventanas que los zombies rompen.
// Ruinas: casas abiertas por huecos en las paredes, para recorrer el pueblo.
const BUILDINGS = [
  { x0: 33, x1: 39, y0: 26, y1: 31, base: true },
  { x0: 44, x1: 48, y0: 28, y1: 32, ruin: [46, 32] },
  { x0: 36, x1: 41, y0: 44, y1: 48, ruin: [38, 44] },
  { x0: 44, x1: 48, y0: 46, y1: 50, ruin: [46, 46] },
];
for (const b of BUILDINGS) {
  outline(b.x0, b.y0, b.x1, b.y1, "H");
  fill(b.x0 + 1, b.y0 + 1, b.x1 - 1, b.y1 - 1, ".");
  if (b.ruin) {
    // Ruina: hueco de entrada y algunas paredes caídas
    put(b.ruin[0], b.ruin[1], ".");
    for (let j = b.y0; j <= b.y1; j++) for (let i = b.x0; i <= b.x1; i++) {
      const borde = i === b.x0 || i === b.x1 || j === b.y0 || j === b.y1;
      if (borde && rnd() < 0.15) put(i, j, ".");
    }
  }
}

// Base del jugador: ventanas tapiables y puerta cerrada en el lado sur
put(34, 26, "W"); put(38, 26, "W"); put(33, 28, "W"); put(39, 29, "W");
put(36, 31, "D");

// Detalles del campo: un estanque con juncos, arboledas y peñascos sueltos (solo sobre pasto, para no tapar caminos)
for (let j = 20; j <= 28; j++) for (let i = 14; i <= 25; i++) {
  if (ell(i, j, 19, 24, 4.5, 3, 0.2, 2)) put(i, j, "~");
  else if (ell(i, j, 19, 24, 6, 4.2, 0.2, 2) && rnd() < 0.5 && G[j][i] === "g") put(i, j, "r");
}
for (let j = 38; j <= 46; j++) for (let i = 18; i <= 28; i++) {
  if (ell(i, j, 23, 42, 4, 3.5, 0.3, 2) && rnd() < 0.4 && G[j][i] === "g") put(i, j, "T");
}
for (let j = 22; j <= 32; j++) for (let i = 58; i <= 72; i++) {
  if (G[j][i] === "g" && rnd() < 0.06) put(i, j, "#");
}

// ---- Consultas que usa el juego
const START = { i: 36, j: 35 };
// Puntos de compra: dentro de la base, pegados a un muro
const SHOP_CANDS = [
  { i: 35, j: 27, face: "n" },
  { i: 37, j: 27, face: "n" },
  { i: 36, j: 30, face: "s" },
];
