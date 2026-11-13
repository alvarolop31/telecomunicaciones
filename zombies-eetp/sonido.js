// ---------- Sonido: disparos por arma, zombies con paneo según la distancia, ambiente y power-ups (sintetizado, sin archivos) ----------
const Sonido = (function () {
  let ctx = null, master = null, noiseBuf = null, echoIn = null, on = true;
  let tGroan = 5, tCreak = 9;
  const lis = { x: 0, z: 0, yaw: 0 }; // dónde está el jugador y hacia dónde mira
  try { on = localStorage.getItem("eetp-sonido") !== "off"; } catch (_) {}

  // Cada arma: chasquido (freq, q), golpe grave (thump) y cola de eco (tail)
  const SHOTS = {
    pistola: { dur: 0.16, vol: 0.42, freq: 2600, q: 0.7, thump: 150, tail: 0.5 },
    fal: { dur: 0.2, vol: 0.5, freq: 1900, q: 0.6, thump: 110, tail: 0.6 },
    m1: { dur: 0.26, vol: 0.55, freq: 1500, q: 0.8, thump: 90, tail: 0.7 },
    chispa: { dur: 0.5, vol: 0.6, freq: 900, q: 0.5, thump: 60, tail: 1.0, click: true },
  };

  function tone(type, f, t, dur, vol, fEnd, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.1, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function burst(t, dur, vol, freq, q, dest) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest || master);
    s.start(t, Math.random() * 2, dur + 0.05);
  }

  // Canal de salida de un sonido: más bajo si está lejos y corrido a la izquierda o derecha
  function canal(x, z) {
    let pan = 0, vol = 1;
    if (x !== undefined) {
      const dx = x - lis.x, dz = z - lis.z, d = Math.hypot(dx, dz);
      vol = Math.max(0.12, 1 - d / 30);
      // Derecha de la cámara: (cos yaw, -sin yaw), igual que en update()
      if (d > 0.01) pan = Math.max(-1, Math.min(1, (dx * Math.cos(lis.yaw) - dz * Math.sin(lis.yaw)) / d)) * 0.8;
    }
    const g = ctx.createGain(), sg = ctx.createGain();
    g.gain.value = vol;
    sg.gain.value = 0.18;
    g.connect(sg);
    sg.connect(echoIn);
    let p = null;
    if (ctx.createStereoPanner) {
      p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      p.connect(master);
    } else {
      g.connect(master);
    }
    // Se desconecta solo después de sonar, así no se acumulan nodos con las ráfagas
    setTimeout(() => { try { g.disconnect(); sg.disconnect(); if (p) p.disconnect(); } catch (_) {} }, 3000);
    return g;
  }

  function groan(x, z) {
    const t = ctx.currentTime + 0.02, dest = canal(x, z);
    tone("triangle", 95 + Math.random() * 35, t, 1.7, 0.06, 52, dest);
    burst(t, 1.5, 0.03, 280, 3, dest);
  }

  function creak(x, z) {
    burst(ctx.currentTime + 0.02, 1.1, 0.03, 1100 + Math.random() * 700, 9, canal(x, z));
  }

  function ambient() {
    // Viento filtrado que sube y baja despacio
    const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    s.loop = true;
    lp.type = "lowpass";
    lp.frequency.value = 420;
    g.gain.value = 0.07;
    s.connect(lp);
    lp.connect(g);
    g.connect(master);
    s.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.07;
    lg.gain.value = 0.035;
    lfo.connect(lg);
    lg.connect(g.gain);
    lfo.start();
    // Zumbido grave de fondo
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 49;
    og.gain.value = 0.03;
    o.connect(og);
    og.connect(master);
    o.start();
  }

  function iniciar() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = on ? 0.5 : 0;
        master.connect(ctx.destination);
        // Eco corto para los disparos y gritos
        echoIn = ctx.createGain();
        const dl = ctx.createDelay(1), fb = ctx.createGain(), back = ctx.createGain();
        dl.delayTime.value = 0.23;
        fb.gain.value = 0.3;
        back.gain.value = 0.22;
        echoIn.connect(dl);
        dl.connect(fb);
        fb.connect(dl);
        dl.connect(back);
        back.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        ambient();
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch (_) {}
  }

  // Se llama cada cuadro: ambiente de zombies cercanos (suave, no invasivo) y crujidos
  function tick(dt, jugando, zs, x, z, yaw) {
    lis.x = x; lis.z = z; lis.yaw = yaw;
    if (!ctx || !jugando) return;
    tGroan -= dt;
    if (tGroan <= 0) {
      tGroan = 5 + Math.random() * 8;
      const z0 = zs && zs.length ? zs[Math.floor(Math.random() * zs.length)] : null;
      if (z0 && Math.hypot(z0.x - x, z0.z - z) < 26) groan(z0.x, z0.z);
    }
    tCreak -= dt;
    if (tCreak <= 0) { tCreak = 8 + Math.random() * 9; creak(); }
  }

  // Disparo del jugador: chasquido, golpe grave y cola; la pistola de chispa tiene llave antes
  function disparo(tipo) {
    if (!ctx) return;
    const p = SHOTS[tipo] || SHOTS.pistola;
    const t = ctx.currentTime + 0.01, dest = canal();
    let t2 = t;
    if (p.click) { burst(t, 0.04, 0.3, 5000, 1, dest); t2 = t + 0.04; }
    burst(t2, p.dur, p.vol, p.freq, p.q, dest);
    tone("sine", p.thump, t2, 0.35, p.vol, p.thump * 0.35, dest);
    burst(t2 + 0.05, p.dur * p.tail * 3, p.vol * 0.22, 500, 0.6, dest);
  }

  // Gatillo sin munición
  function vacio() {
    if (!ctx) return;
    burst(ctx.currentTime, 0.04, 0.12, 3000, 6, canal());
  }

  // Zombie herido: grito corto, con paneo hacia donde está
  function golpe(x, z) {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01, dest = canal(x, z);
    tone("sawtooth", 260 + Math.random() * 120, t, 0.35, 0.04, 150, dest);
    burst(t, 0.3, 0.05, 1100, 2, dest);
  }

  // Zombie que cae: gemido largo que baja
  function muerte(x, z) {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01, dest = canal(x, z);
    tone("triangle", 150 + Math.random() * 40, t, 1.2, 0.08, 45, dest);
    burst(t, 0.8, 0.05, 300, 2.5, dest);
  }

  // Power-ups
  function recoger() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01, d = canal();
    tone("triangle", 880, t, 0.2, 0.09, null, d);
    tone("triangle", 1320, t + 0.09, 0.3, 0.09, null, d);
  }

  function instaKill() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01, d = canal();
    tone("sawtooth", 60, t, 0.9, 0.05, 900, d);
    burst(t, 0.9, 0.1, 3000, 6, d);
  }

  function bomba() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01, d = canal();
    burst(t, 1.6, 0.9, 120, 0.6, d);
    tone("sine", 55, t, 1.6, 0.8, 25, d);
    burst(t + 0.1, 1.0, 0.35, 800, 1.2, d);
  }

  // Confirmación al pasar de oleada
  function oleada() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => tone("triangle", f, t + k * 0.16, 1.4, 0.12));
  }

  function setOn(v) {
    on = v;
    try { localStorage.setItem("eetp-sonido", v ? "on" : "off"); } catch (_) {}
    if (master) master.gain.setTargetAtTime(v ? 0.5 : 0, ctx.currentTime, 0.05);
  }

  return {
    iniciar, tick, oleada, setOn,
    disparo, vacio, golpe, muerte, recoger, instaKill, bomba,
    get on() { return on; },
  };
})();
