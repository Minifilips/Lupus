// Momenti della partita in cui può partire da solo un suono caricato dall'utente.
// match: parole del nome del file che lo assegnano in automatico a quel momento.
// volume: livello relativo (1 = come impostato nella soundbar).
export const SLOTS = [
  { id: 'sleep', emoji: '🌙', label: 'Il villaggio si addormenta', match: /brahms|lullaby|ninna|addorment/i, volume: 0.45 },
  { id: 'wolves', emoji: '🐺', label: 'Lupi (ululato)', match: /ulula|howl|wolf|wolves|lupo|lupi/i, volume: 1 },
  { id: 'dawn', emoji: '🌅', label: 'Mattina (il villaggio si sveglia)', match: /here comes|morning|mattina|beatles/i, volume: 0.8 },
  { id: 'death', emoji: '⚰️', label: 'Annuncio dei morti', match: /annuncio|morti|death/i, volume: 1 },
  { id: 'talk', emoji: '🗣️', label: 'Discussione (col timer)', match: /cotton|rednex|discussion/i, volume: 0.6 },
];

// Nome leggibile dal nome del file: niente estensione, underscore, "Official Video", ecc.
export function cleanName(filename) {
  let n = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const cut = n.search(/\b(official|music video|HD|remaster(ed)?|lyrics?)\b/i);
  if (cut > 8) n = n.slice(0, cut);
  n = n.replace(/[\s\-–.]+$/, '').trim();
  return (n || filename).slice(0, 48);
}

// Primo momento libero che corrisponde al nome del file, o null.
// assigned: { slotId: soundId } già occupati.
export function slotFor(filename, assigned = {}) {
  const name = filename.replace(/_/g, ' ');
  const slot = SLOTS.find((s) => !assigned[s.id] && s.match.test(name));
  return slot ? slot.id : null;
}

const MIME_BY_EXT = {
  mp3: 'audio/mpeg', m4a: 'audio/mp4', m4b: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac',
  wav: 'audio/wav', aif: 'audio/aiff', aiff: 'audio/aiff', caf: 'audio/x-caf',
  ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac', webm: 'audio/webm',
};

const extOf = (name) => (name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

// Su iPhone e iPad il tipo del file spesso è vuoto: lo ricava dall'estensione.
export function isAudioFile({ name = '', type = '' }) {
  return /^(audio|video)\//.test(type) || extOf(name) in MIME_BY_EXT;
}

export function audioMime({ name = '', type = '' }) {
  if (/^audio\//.test(type)) return type;
  return MIME_BY_EXT[extOf(name)] || 'audio/mpeg';
}
