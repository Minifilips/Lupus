// Persistenza: localStorage per stato e impostazioni, IndexedDB per gli mp3.

const KEY = 'lupus.';

export function load(name, fallback) {
  try {
    const raw = localStorage.getItem(KEY + name);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(name, value) {
  try {
    if (value === undefined) localStorage.removeItem(KEY + name);
    else localStorage.setItem(KEY + name, JSON.stringify(value));
  } catch {
    // Spazio pieno o storage disabilitato: l'app continua senza salvare.
  }
}

const DEFAULT_SETTINGS = {
  voice: true,
  voiceRate: 0.9,
  voicePitch: 0.9,
  bluff: true,
  ambient: 'crickets',
  dayMinutes: 3,
  volume: 0.8,
};

let current = { ...DEFAULT_SETTINGS, ...load('settings', {}) };

export function settings() {
  return current;
}

export function updateSettings(patch) {
  current = { ...current, ...patch };
  save('settings', current);
}

// ---------- IndexedDB per i suoni personalizzati ----------

let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('lupus', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('sounds', { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return db().then((d) => new Promise((resolve, reject) => {
    const t = d.transaction('sounds', mode);
    const r = fn(t.objectStore('sounds'));
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => reject(t.error);
  }));
}

export function listSounds() {
  return tx('readonly', (s) => s.getAll()).catch(() => []);
}

export function addSound(name, blob) {
  const item = { id: `u${Date.now()}`, name, blob };
  return tx('readwrite', (s) => s.put(item)).then(() => item);
}

export function deleteSound(id) {
  return tx('readwrite', (s) => s.delete(id));
}
