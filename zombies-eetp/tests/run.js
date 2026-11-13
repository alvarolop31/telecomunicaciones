// Arnés: ejecuta los scripts del juego con un THREE falso para detectar errores de ejecución.
const vm = require('vm'), fs = require('fs');
const dir = __dirname + '/..';

function dummy() {
  const h = {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then' || typeof k === 'symbol') return undefined;
      if (k === 'x' || k === 'y' || k === 'z') return 0;
      return dummy();
    },
    set() { return true; },
    apply() { return dummy(); },
    construct() { return dummy(); },
  };
  return new Proxy(function () {}, h);
}
function Raycaster() { this.setFromCamera = () => {}; this.intersectObjects = () => []; }
const THREE = new Proxy({}, { get: (t, k) => (k === 'Raycaster' ? Raycaster : dummy()) });

const sandbox = {
  THREE,
  document: dummy(),
  localStorage: { getItem: () => null, setItem() {} },
  performance: { now: () => 0 },
  devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720,
  addEventListener() {}, requestAnimationFrame() {},
  console,
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const files = ['mapa.js', 'mapa2.js', 'mundo3.js', 'decor2.js', 'sonido.js', 'game.js'];
for (const f of files) {
  const src = fs.readFileSync(dir + '/' + f, 'utf8');
  vm.runInContext(src, sandbox, { filename: f });
}
const run = (code) => vm.runInContext(code, sandbox);
console.log('LOAD OK');
console.log('spawn cells:', run('SPAWN_CELLS.length'), 'windows:', run('WINDOWS.size'), 'colliders:', run('COLLIDERS.length'), 'stations:', run('stations.length'));

// Partida: iniciar, caminar, disparar, recargar, cuchillo, comprar, puertas y muchas oleadas
run(`
  start();
  setQuality('bajo'); setQuality('medio'); setQuality('alto');
  let now = 0;
  const step = (n, keysOn) => { for (let k = 0; k < n; k++) { now += 16.7; keys.KeyW = !!keysOn; keys.KeyA = k % 90 < 20; keys.KeyD = k % 90 > 60; frame(now); } keys.KeyW = keys.KeyA = keys.KeyD = false; };
  step(120, true);
  P.money = 2000;
  buy(stations[0]); buy(stations[1]);
  switchTo(1); switchTo(0);
  mouseHeld = true; step(60); mouseHeld = false;
  startReload(); step(220);
  switchTo(1); startReload(); step(260);
  startKnife(); step(40);
  step(400, true);
  P.reload = 0;
  // Sobreviví a varias oleadas para que aparezcan zombies y choquen con las ventanas
  for (let k = 0; k < 2500 && state === 'play'; k++) { P.hp = 100; now += 16.7; keys.KeyW = (k % 300) < 200; keys.KeyA = (k % 400) < 60; keys.KeyD = (k % 500) > 440; frame(now); }
  keys.KeyW = keys.KeyA = keys.KeyD = false;
  const broken = [...WINDOWS.values()].filter((w) => w.broken).length;
  console.log('wave', P.wave, 'zombies', zombies.length, 'kills', P.score, 'money', P.money, 'broken windows', broken, 'state', state);
  setQuality('bajo'); step(10); setQuality('alto');
  Sonido.setOn(false); Sonido.setOn(true);
  quit(); start(); step(5);
`);
console.log('PLAY OK');

// Power-ups: bomba sobre zombies cercanos, recogida de munición, insta-kill y disparo con insta-kill
run(`
  start();
  for (let k = 0; k < 6; k++) makeZombie(P.x + 4 + k * 0.5, P.z + 3, 1, 1, KINDS.normal);
  P.bombs = 2;
  const antes = zombies.length;
  useBomb();
  makePickup('ammo', P.x, P.z);
  makePickup('insta', P.x, P.z);
  makePickup('bomb', P.x, P.z);
  let t3 = 1000000;
  for (let k = 0; k < 30; k++) { t3 += 16.7; frame(t3); }
  console.log('bomba: zombies antes', antes, 'despues', zombies.length, '| bombas', P.bombs, '| insta', P.instaT.toFixed(1), '| pickups', pickups.length, '| msg:', msgText);
  makeZombie(P.x + 3, P.z, 1, 1, KINDS.normal);
  P.instaT = 10; mouseHeld = true; fire(); mouseHeld = false;
  killZombie(zombies[zombies.length - 1]);
  for (let k = 0; k < 2000; k++) { t3 += 16.7; frame(t3); }
  console.log('final: fx', fx.length, 'pickups', pickups.length, 'zombies', zombies.length);
  quit();
`);
console.log('POWERUPS OK');
