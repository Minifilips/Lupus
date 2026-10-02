import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLOTS, cleanName, slotFor } from '../js/slots.js';

const FILES = {
  clip: 'Annuncio_dei_morti_3-40_-_3-55.mp3',
  chopin: 'Chopin_-_Marche_Fune_bre_Funeral_March.mp3',
  cotton: 'Rednex_-_Cotton_Eye_Joe_Official_Music_Video_HD_-_RednexMusic_com.mp3',
  sun: 'The_Beatles_-_Here_Comes_The_Sun_2019_Mix.mp3',
  howl: 'The_Wolfs_Howl_Gives_You_Chills._The_Good_Kind..mp3',
};

test('i file si assegnano da soli al momento giusto', () => {
  assert.equal(slotFor(FILES.clip), 'death');
  assert.equal(slotFor(FILES.cotton), 'talk');
  assert.equal(slotFor(FILES.sun), 'dawn');
  assert.equal(slotFor(FILES.howl), 'wolves');
  assert.equal(slotFor('Brahms_Lullaby.mp3'), 'sleep');
});

test('Chopin non finisce nell’annuncio dei morti: resta un pulsante manuale', () => {
  assert.equal(slotFor(FILES.chopin), null);
});

test('un momento già occupato non viene sovrascritto', () => {
  assert.equal(slotFor(FILES.howl, { wolves: 'u1' }), null);
});

test('nomi leggibili', () => {
  assert.equal(cleanName(FILES.clip), 'Annuncio dei morti 3-40 - 3-55');
  assert.equal(cleanName(FILES.cotton), 'Rednex - Cotton Eye Joe');
  assert.equal(cleanName(FILES.sun), 'The Beatles - Here Comes The Sun 2019 Mix');
  assert.equal(cleanName(FILES.howl), 'The Wolfs Howl Gives You Chills. The Good Kind');
});

test('ogni momento ha id unico, etichetta e volume valido', () => {
  const ids = new Set(SLOTS.map((s) => s.id));
  assert.equal(ids.size, SLOTS.length);
  for (const s of SLOTS) assert.ok(s.label && s.volume > 0 && s.volume <= 1);
});
