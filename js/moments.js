// Fa partire i suoni assegnati ai momenti della partita (vedi slots.js).
import { settings } from './storage.js';
import { SLOTS } from './slots.js';
import * as audio from './audio.js';

const slotSound = (slotId) => settings().slots?.[slotId] || null;

// Va chiamata dentro un gesto dell'utente (tocco). Restituisce true se c'è un suono assegnato.
export function playMoment(slotId, { onEnd, restart = true } = {}) {
  const id = slotSound(slotId);
  if (!id) return false;
  const slot = SLOTS.find((s) => s.id === slotId);
  return audio.playUserSound(id, { volume: slot?.volume ?? 1, onEnd, restart });
}

export function stopMoment(slotId, { rewind = false } = {}) {
  const id = slotSound(slotId);
  if (id) audio.stopUser(id, { rewind });
}
