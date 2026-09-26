// Voce del narratore con la sintesi vocale del telefono (italiano).
import { settings } from './storage.js';

let voice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  const it = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('it'));
  voice = it.find((v) => /alice|federica|luca|paola/i.test(v.name)) || it[0] || null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function canSpeak() {
  return 'speechSynthesis' in window;
}

let seq = 0;
let seqTimer = null;

function utter(text, onend) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'it-IT';
  if (voice) u.voice = voice;
  u.rate = settings().voiceRate;
  u.pitch = settings().voicePitch;
  u.volume = 1;
  if (onend) {
    // Safari a volte non emette "end": stima della durata come riserva.
    let fired = false;
    const fire = () => { if (!fired) { fired = true; onend(); } };
    u.onend = fire;
    u.onerror = fire;
    seqTimer = setTimeout(fire, 1500 + (text.length * 85) / settings().voiceRate);
  }
  speechSynthesis.speak(u);
}

function reset() {
  seq++;
  clearTimeout(seqTimer);
  speechSynthesis.cancel();
}

export function speak(text, { force = false } = {}) {
  if (!canSpeak() || !text) return;
  if (!force && !settings().voice) return;
  reset();
  utter(text);
}

// Legge più frasi con una pausa tra una e l'altra (es. "chiudete gli occhi" … "apri gli occhi").
export function speakSequence(texts, gapMs = 2000) {
  if (!canSpeak() || !settings().voice) return;
  reset();
  const my = seq;
  const list = texts.filter(Boolean);
  const next = (i) => {
    if (my !== seq || i >= list.length) return;
    utter(list[i], () => {
      clearTimeout(seqTimer);
      if (my === seq) seqTimer = setTimeout(() => next(i + 1), gapMs);
    });
  };
  next(0);
}

export function stopSpeaking() {
  if (canSpeak()) reset();
}
