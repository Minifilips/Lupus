// Motore audio: grilli e battito sintetizzati con Web Audio (funzionano offline),
// bip del timer e riproduzione degli mp3 caricati dall'utente.

let ctx = null;
let master = null;
let reverb = null;
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
  try {
    // Safari 16.4+: fa suonare l'audio anche con l'interruttore silenzioso attivo.
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch { /* non supportato */ }
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
  userAudios.forEach((a) => { a.volume = Math.min(1, v * (a.rel ?? 1)); });
}

export function getVolume() {
  return volume;
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

function env(param, t, a, peak, d, end = 0.0001) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(peak, t + a);
  param.exponentialRampToValueAtTime(end, t + a + d);
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

// Gli unici suoni sintetizzati rimasti: grilli e battito.
export const LOOPS = [
  { id: 'crickets', name: 'Grilli', emoji: '🦗', start: loopCrickets },
  { id: 'heart', name: 'Battito', emoji: '💓', start: loopHeart },
];

// Restituisce l'atmosfera da usare di notte: quella scelta, i grilli se la scelta non esiste più, null se "nessuna".
export function ambientId(pref) {
  if (pref === 'none') return null;
  return LOOPS.some((l) => l.id === pref) ? pref : 'crickets';
}

export function startLoop(id) {
  if (!unlock() || loops.has(id)) return;
  const l = LOOPS.find((x) => x.id === id);
  if (!l) return;
  loops.set(id, { stop: l.start() });
  notify();
}

export function isLooping(id) {
  return loops.has(id);
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

// Prepara l'audio in anticipo: così play() parte subito dentro il tocco (iOS lo richiede).
export function registerUser(id, blob) {
  let a = userAudios.get(id);
  if (!a) {
    a = new Audio(URL.createObjectURL(blob));
    a.preload = 'auto';
    a.dataset.id = id;
    a.rel = 1;
    a.volume = volume;
    a.onEndCb = null; // da eseguire una sola volta quando finisce da sola
    a.addEventListener('ended', () => {
      const cb = a.onEndCb;
      a.onEndCb = null;
      cb?.();
      notify();
    });
    a.addEventListener('pause', notify);
    a.addEventListener('play', notify);
    userAudios.set(id, a);
  }
  return a;
}

// Pulsante della soundbar: parte da capo, oppure si ferma se sta già suonando.
export function playUser(id, blob) {
  unlock();
  const a = registerUser(id, blob);
  a.onEndCb = null;
  if (!a.paused) {
    a.pause();
    a.currentTime = 0;
  } else {
    a.rel = 1;
    a.volume = volume;
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

// Suono assegnato a un momento della partita. Restituisce false se non è stato caricato.
export function playUserSound(id, { volume: rel = 1, onEnd, restart = true } = {}) {
  const a = userAudios.get(id);
  if (!a) return false;
  unlock();
  a.rel = rel;
  a.volume = Math.min(1, volume * rel);
  if (restart) a.currentTime = 0;
  a.onEndCb = onEnd || null;
  a.play().catch(() => {});
  return true;
}

export function stopUser(id, { rewind = false } = {}) {
  const a = userAudios.get(id);
  if (!a) return;
  a.onEndCb = null;
  a.pause();
  if (rewind) a.currentTime = 0;
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
  userAudios.forEach((a) => { a.onEndCb = null; a.pause(); a.currentTime = 0; });
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
