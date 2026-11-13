// Dibuja el mapa y comprueba que todas las zonas sean alcanzables desde el inicio (sin cruzar muros, ventanas ni puertas cerradas)
const vm = require('vm'), fs = require('fs');
const dir = __dirname + '/..';
const ctx = {};
vm.createContext(ctx);
for (const f of ['mapa.js', 'mapa2.js']) vm.runInContext(fs.readFileSync(dir + '/' + f, 'utf8'), ctx, { filename: f });
const run = (c) => vm.runInContext(c, ctx);
const COLS = run('COLS'), ROWS = run('ROWS'), G = run('G');
const PASSABLE = new Set(['g', 'p', 'b', 'r', '.', 'm', 'T', 'k', 'L', 'x']);
const at = (i, j) => (i < 0 || j < 0 || i >= COLS || j >= ROWS ? '#' : G[j][i]);
const reach = (si, sj, extra = new Set()) => {
  const seen = new Set([si + ',' + sj]), q = [[si, sj]];
  while (q.length) {
    const [i, j] = q.shift();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, k = ni + ',' + nj;
      if (seen.has(k)) continue;
      const c = at(ni, nj);
      if (!(PASSABLE.has(c) || extra.has(c))) continue;
      seen.add(k); q.push([ni, nj]);
    }
  }
  return seen;
};
const START = run('START');
const zonas = {
  plaza: [40, 36], base_interior: [36, 28], ruina_este: [46, 30], castillo: [8, 37], cementerio: [33, 9],
  bosque: [10, 12], granja: [16, 53], huerto: [33, 53], pantano: [68, 44], cantera: [67, 12], colina: [72, 34],
};
const ok = reach(START.i, START.j);
const okDoor = reach(START.i, START.j, new Set(['D']));
for (const [nombre, [i, j]] of Object.entries(zonas)) {
  const c = at(i, j);
  const llega = ok.has(i + ',' + j) || (nombre === 'base_interior' && okDoor.has(i + ',' + j));
  console.log(nombre.padEnd(14), `(${i},${j})`, 'celda', c, llega ? 'ALCANZABLE' : 'NO ALCANZABLE (si es base: hay que abrir la puerta con F)');
}
let cuentaB = 0; for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (G[j][i] === 'b') cuentaB++;
console.log('celdas de puente:', cuentaB, '| celdas de río:', (() => { let n = 0; for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (G[j][i] === '~') n++; return n; })());
console.log('');
for (let j = 0; j < ROWS; j++) {
  let line = '';
  for (let i = 0; i < COLS; i++) line += (i === START.i && j === START.j) ? '@' : G[j][i];
  console.log(String(j).padStart(2, ' ') + ' ' + line);
}
