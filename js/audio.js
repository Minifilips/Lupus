// Motore audio: effetti sintetizzati con Web Audio (niente file, funziona offline)
// più riproduzione degli mp3 caricati dall'utente.

let ctx = null;
let master = null;
let reverb = null;
let noiseBuf = null;
let volume = 0.8;
const loops = new Map(); // id -> { stop }
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function onLoopsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Va chiamata dentro un gesto dell'utente (iOS sblocca l'audio solo così).
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.8, 2.5);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    reverb.connect(wet).connect(master);
    noiseBuf = makeNoise(3);
    // Trucco iOS: un buffer silenzioso fa partire davvero il contesto.
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, 22050);
    s.connect(ctx.destination);
    s.start(0);
  }
  if (ctx.state !== 'running') ctx.resume();
  return ctx;
}

export function setVolume(v) {
  volume = v;
  if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  userAudios.forEach((a) => { a.volume = v; });
}

export function getVolume() {
  return volume;
}

function makeNoise(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function impulse(seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

// Uscita di un suono: dry verso il master + mandata al riverbero.
function out(send = 0.5) {
  const g = ctx.createGain();
  g.connect(master);
  if (send > 0) {
    const s = ctx.createGain();
    s.gain.value = send;
    g.connect(s).connect(reverb);
  }
  return g;
}

function noise(loop = true) {
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf;
  n.loop = loop;
  n.loopStart = Math.random();
  return n;
}

function env(param, t, a, peak, d, end = 0.0001) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(peak, t + a);
  param.exponentialRampToValueAtTime(end, t + a + d);
}

// ---------- Effetti singoli ----------

function howl(t = ctx.currentTime, base = 1) {
  const o = out(0.9);
  o.gain.value = 0.5;
  [0, 7].forEach((det, i) => {
    const osc = ctx.createOscillator();
    osc.type = i ? 'triangle' : 'sawtooth';
    const f = osc.frequency;
    const b = 280 * base;
    f.setValueAtTime(b, t);
    f.exponentialRampToValueAtTime(b * 2.1, t + 0.7);
    f.linearRampToValueAtTime(b * 2.3, t + 2.0);
    f.exponentialRampToValueAtTime(b * 1.5, t + 3.2);
    osc.detune.value = det;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.5;
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(12, t + 1.5);
    vib.connect(vg).connect(f);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    env(g.gain, t, 0.5, i ? 0.5 : 0.25, 2.8);
    osc.connect(bp).connect(g).connect(o);
    osc.start(t); vib.start(t);
    osc.stop(t + 3.5); vib.stop(t + 3.5);
  });
}

function owl(t = ctx.currentTime) {
  const o = out(0.7);
  const notes = [[0, 0.35], [0.5, 0.25], [0.8, 0.6]];
  notes.forEach(([dt, len]) => {
    const s = t + dt;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, s);
    osc.frequency.exponentialRampToValueAtTime(340, s + len);
    const g = ctx.createGain();
    env(g.gain, s, 0.05, 0.5, len);
    osc.connect(g).connect(o);
    osc.start(s);
    osc.stop(s + len + 0.1);
  });
}

function bell(t = ctx.currentTime, times = 3) {
  const o = out(0.6);
  const partials = [0.5, 1, 1.19, 1.56, 2, 2.51, 2.66, 3.01];
  for (let k = 0; k < times; k++) {
    const s = t + k * 1.6;
    partials.forEach((p, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = 330 * p;
      const g = ctx.createGain();
      env(g.gain, s, 0.005, 0.25 / (i + 1), 3.5 - i * 0.3);
      osc.connect(g).connect(o);
      osc.start(s);
      osc.stop(s + 4);
    });
  }
}

function gong(t = ctx.currentTime) {
  const o = out(0.9);
  [55, 82, 110, 147, 196].forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = i ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(f * 1.02, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 1);
    const g = ctx.createGain();
    env(g.gain, t, 0.01, 0.5 / (i + 1), 5);
    osc.connect(g).connect(o);
    osc.start(t);
    osc.stop(t + 5.5);
  });
  const n = noise(false);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  const g = ctx.createGain();
  env(g.gain, t, 0.005, 0.6, 0.4);
  n.connect(lp).connect(g).connect(o);
  n.start(t);
  n.stop(t + 0.6);
}

function thump(t, o, f = 60, peak = 1) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(f * 1.6, t);
  osc.frequency.exponentialRampToValueAtTime(f, t + 0.08);
  const g = ctx.createGain();
  env(g.gain, t, 0.01, peak, 0.22);
  osc.connect(g).connect(o);
  osc.start(t);
  osc.stop(t + 0.3);
}

function door(t = ctx.currentTime) {
  const o = out(0.4);
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const len = 1.6;
  let f = 90;
  for (let x = 0; x < len; x += 0.03) {
    f = Math.max(50, Math.min(220, f + (Math.random() - 0.4) * 30));
    osc.frequency.setValueAtTime(f, t + x);
  }
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1400;
  bp.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.7, t + 0.2);
  g.gain.setValueAtTime(0.7, t + len - 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  osc.connect(bp).connect(g).connect(o);
  osc.start(t);
  osc.stop(t + len);
  thump(t + len + 0.05, out(0.5), 70, 0.8);
}

function magic(t = ctx.currentTime) {
  const o = out(0.8);
  const scale = [0, 3, 7, 10, 12, 15, 19, 22, 24];
  scale.forEach((st, i) => {
    const s = t + i * 0.08;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 523 * Math.pow(2, st / 12);
    const g = ctx.createGain();
    env(g.gain, s, 0.01, 0.15, 1.2);
    osc.connect(g).connect(o);
    osc.start(s);
    osc.stop(s + 1.3);
  });
}

function ghost(t = ctx.currentTime) {
  const o = out(1);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.linearRampToValueAtTime(900, t + 1);
  osc.frequency.linearRampToValueAtTime(500, t + 2.5);
  const vib = ctx.createOscillator();
  vib.frequency.value = 6;
  const vg = ctx.createGain();
  vg.gain.value = 25;
  vib.connect(vg).connect(osc.frequency);
  const g = ctx.createGain();
  env(g.gain, t, 0.6, 0.2, 2.2);
  osc.connect(g).connect(o);
  osc.start(t); vib.start(t);
  osc.stop(t + 3); vib.stop(t + 3);
}

function love(t = ctx.currentTime) {
  const o = out(0.6);
  [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45]].forEach(([f, dt]) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = ctx.createGain();
    env(g.gain, t + dt, 0.02, 0.25, 0.9);
    osc.connect(g).connect(o);
    osc.start(t + dt);
    osc.stop(t + dt + 1);
  });
}

function shield(t = ctx.currentTime) {
  const o = out(0.7);
  [220, 330, 440].forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 1.2);
    const g = ctx.createGain();
    env(g.gain, t, 0.01, 0.08, 1.4);
    osc.connect(lp).connect(g).connect(o);
    osc.start(t);
    osc.stop(t + 1.5);
  });
}

function scream(t = ctx.currentTime) {
  const o = out(0.8);
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.3);
  osc.frequency.exponentialRampToValueAtTime(400, t + 1.4);
  const vib = ctx.createOscillator();
  vib.frequency.value = 9;
  const vg = ctx.createGain();
  vg.gain.value = 40;
  vib.connect(vg).connect(osc.frequency);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1500;
  bp.Q.value = 2;
  const g = ctx.createGain();
  env(g.gain, t, 0.05, 0.35, 1.4);
  osc.connect(bp).connect(g).connect(o);
  osc.start(t); vib.start(t);
  osc.stop(t + 1.6); vib.stop(t + 1.6);
}

function dawn(t = ctx.currentTime) {
  const o = out(0.6);
  [392, 494, 587, 784].forEach((f, i) => {
    const s = t + i * 0.35;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = ctx.createGain();
    env(g.gain, s, 0.05, 0.25, 2);
    osc.connect(g).connect(o);
    osc.start(s);
    osc.stop(s + 2.2);
  });
}

export function beep(high = false) {
  if (!unlock()) return;
  const t = ctx.currentTime;
  const o = out(0);
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = high ? 1320 : 880;
  const g = ctx.createGain();
  env(g.gain, t, 0.005, 0.25, high ? 0.8 : 0.15);
  osc.connect(g).connect(o);
  osc.start(t);
  osc.stop(t + 1);
}

// ---------- Loop d'ambiente ----------

function loopCrickets() {
  const o = out(0.3);
  o.gain.value = 0.35;
  let alive = true;
  const chirp = (s, f) => {
    for (let k = 0; k < 3; k++) {
      const st = s + k * 0.045;
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      const g = ctx.createGain();
      env(g.gain, st, 0.004, 0.12, 0.03);
      osc.connect(g).connect(o);
      osc.start(st);
      osc.stop(st + 0.05);
    }
  };
  const tick = () => {
    if (!alive) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 4; i++) chirp(t + i * 0.25 + Math.random() * 0.05, 4200 + Math.random() * 500);
    if (Math.random() < 0.6) chirp(t + 0.12, 5100);
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => { alive = false; clearInterval(id); fadeOut(o); };
}

function loopWind() {
  const o = out(0.2);
  const n = noise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 500;
  bp.Q.value = 3;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lg = ctx.createGain();
  lg.gain.value = 350;
  lfo.connect(lg).connect(bp.frequency);
  const amp = ctx.createGain();
  amp.gain.value = 0.5;
  const lfo2 = ctx.createOscillator();
  lfo2.frequency.value = 0.07;
  const lg2 = ctx.createGain();
  lg2.gain.value = 0.3;
  lfo2.connect(lg2).connect(amp.gain);
  n.connect(bp).connect(amp).connect(o);
  fadeIn(o, 0.9);
  n.start(); lfo.start(); lfo2.start();
  return () => { fadeOut(o); setTimeout(() => { n.stop(); lfo.stop(); lfo2.stop(); }, 1500); };
}

function loopRain() {
  const o = out(0.2);
  const n = noise();
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 900;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.value = 0.25;
  n.connect(hp).connect(lp).connect(g).connect(o);
  fadeIn(o, 1);
  n.start();
  let alive = true;
  const drops = () => {
    if (!alive) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 12; i++) {
      const s = t + Math.random() * 0.5;
      const d = noise(false);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2000 + Math.random() * 3000;
      bp.Q.value = 8;
      const dg = ctx.createGain();
      env(dg.gain, s, 0.002, 0.4, 0.04);
      d.connect(bp).connect(dg).connect(o);
      d.start(s);
      d.stop(s + 0.06);
    }
  };
  const id = setInterval(drops, 500);
  return () => { alive = false; clearInterval(id); fadeOut(o); setTimeout(() => n.stop(), 1500); };
}

function loopHeart() {
  const o = out(0.1);
  let alive = true;
  const beat = () => {
    if (!alive) return;
    const t = ctx.currentTime + 0.05;
    thump(t, o, 55, 1);
    thump(t + 0.22, o, 50, 0.7);
  };
  beat();
  const id = setInterval(beat, 900);
  return () => { alive = false; clearInterval(id); };
}

function loopDrone() {
  const o = out(0.5);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lg = ctx.createGain();
  lg.gain.value = 250;
  lfo.connect(lg).connect(lp.frequency);
  const oscs = [55, 55.7, 82.4, 110.5].map((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    osc.connect(lp);
    osc.start();
    return osc;
  });
  const g = ctx.createGain();
  g.gain.value = 0.18;
  lp.connect(g).connect(o);
  fadeIn(o, 1);
  lfo.start();
  return () => { fadeOut(o); setTimeout(() => { oscs.forEach((x) => x.stop()); lfo.stop(); }, 1500); };
}

function loopWolves() {
  let alive = true;
  let timer;
  const next = () => {
    if (!alive) return;
    howl(ctx.currentTime, 0.85 + Math.random() * 0.4);
    timer = setTimeout(next, 5000 + Math.random() * 7000);
  };
  next();
  return () => { alive = false; clearTimeout(timer); };
}

function fadeIn(g, to) {
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(to, t + 1.5);
}

function fadeOut(g) {
  const t = ctx.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  setTimeout(() => g.disconnect(), 1400);
}

// ---------- Catalogo ----------

export const SOUNDS = [
  { id: 'howl', name: 'Ululato', emoji: '🐺', play: () => howl() },
  { id: 'owl', name: 'Gufo', emoji: '🦉', play: () => owl() },
  { id: 'bell', name: 'Campana', emoji: '🔔', play: () => bell() },
  { id: 'gong', name: 'Morte', emoji: '💀', play: () => gong() },
  { id: 'scream', name: 'Urlo', emoji: '😱', play: () => scream() },
  { id: 'door', name: 'Porta', emoji: '🚪', play: () => door() },
  { id: 'magic', name: 'Magia', emoji: '✨', play: () => magic() },
  { id: 'ghost', name: 'Fantasma', emoji: '👻', play: () => ghost() },
  { id: 'love', name: 'Amore', emoji: '💘', play: () => love() },
  { id: 'shield', name: 'Scudo', emoji: '🛡️', play: () => shield() },
  { id: 'dawn', name: 'Alba', emoji: '🌅', play: () => dawn() },
];

export const LOOPS = [
  { id: 'crickets', name: 'Grilli', emoji: '🦗', start: loopCrickets },
  { id: 'wind', name: 'Vento', emoji: '🌬️', start: loopWind },
  { id: 'rain', name: 'Pioggia', emoji: '🌧️', start: loopRain },
  { id: 'drone', name: 'Tensione', emoji: '🌑', start: loopDrone },
  { id: 'heart', name: 'Battito', emoji: '💓', start: loopHeart },
  { id: 'wolves', name: 'Branco', emoji: '🌕', start: loopWolves },
];

export function play(id) {
  if (!unlock()) return;
  const s = SOUNDS.find((x) => x.id === id);
  if (s) s.play();
}

export function isLooping(id) {
  return loops.has(id);
}

export function startLoop(id) {
  if (!unlock() || loops.has(id)) return;
  const l = LOOPS.find((x) => x.id === id);
  if (!l) return;
  loops.set(id, { stop: l.start() });
  notify();
}

export function stopLoop(id) {
  const l = loops.get(id);
  if (!l) return;
  l.stop();
  loops.delete(id);
  notify();
}

export function toggleLoop(id) {
  if (loops.has(id)) stopLoop(id);
  else startLoop(id);
}

// ---------- mp3 dell'utente ----------

const userAudios = new Map(); // id -> HTMLAudioElement

export function playUser(id, blob) {
  unlock();
  let a = userAudios.get(id);
  if (!a) {
    a = new Audio(URL.createObjectURL(blob));
    a.volume = volume;
    a.addEventListener('ended', notify);
    a.addEventListener('pause', notify);
    a.addEventListener('play', notify);
    userAudios.set(id, a);
  }
  if (!a.paused) {
    a.pause();
    a.currentTime = 0;
  } else {
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

export function isUserPlaying(id) {
  const a = userAudios.get(id);
  return !!a && !a.paused;
}

export function forgetUser(id) {
  const a = userAudios.get(id);
  if (a) {
    a.pause();
    URL.revokeObjectURL(a.src);
    userAudios.delete(id);
  }
}

export function stopAll() {
  [...loops.keys()].forEach(stopLoop);
  userAudios.forEach((a) => { a.pause(); a.currentTime = 0; });
  if (ctx) {
    // Taglia anche gli effetti in corso ricreando il master.
    const old = master;
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.8, 2.5);
    reverb.connect(wet).connect(master);
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    setTimeout(() => old.disconnect(), 300);
  }
  notify();
}
