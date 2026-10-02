import { h, confirmBox, fill, add } from '../ui.js';
import { listSounds, addSound, deleteSound, updateSettings, settings } from '../storage.js';
import { SLOTS, cleanName, slotFor } from '../slots.js';
import { speak, canSpeak } from '../voice.js';
import * as audio from '../audio.js';

const PHRASES = [
  'Il villaggio si addormenta. Tutti chiudete gli occhi.',
  'Lupi, aprite gli occhi. Scegliete la vostra vittima.',
  'Lupi, chiudete gli occhi.',
  'Il villaggio si sveglia.',
  'Stanotte non è morto nessuno!',
  'Si apre la discussione. Chi sono i lupi?',
  'Votate chi mandare al rogo.',
  'Silenzio! Non sbirciate!',
];

let editing = false;
let unsubscribe = null;

export function renderSoundbar() {
  const root = h('div', { class: 'screen' });
  const loopsBox = h('div', { class: 'sound-grid' });
  const userBox = h('div');

  const drawLoops = () => {
    fill(loopsBox, ...audio.LOOPS.map((l) => h('button', {
      class: `sound loop ${audio.isLooping(l.id) ? 'on' : ''}`,
      onclick: () => audio.toggleLoop(l.id),
    }, h('span', { class: 'sound-emoji' }, l.emoji), h('span', {}, l.name))));
  };
  drawLoops();
  unsubscribe?.();
  unsubscribe = audio.onLoopsChange(() => {
    if (!loopsBox.isConnected) { unsubscribe(); unsubscribe = null; return; }
    drawLoops();
    drawUser();
  });

  let userSounds = [];
  const fileInput = h('input', {
    type: 'file', accept: 'audio/*', multiple: true, style: { display: 'none' },
    onchange: async () => {
      const slots = { ...settings().slots };
      for (const f of fileInput.files) {
        const item = await addSound(cleanName(f.name), f);
        audio.registerUser(item.id, item.blob);
        userSounds.push(item);
        // Se il nome del file assomiglia a un momento libero (es. "ululato", "Here Comes the Sun"), lo assegna da solo.
        const slot = slotFor(f.name, slots);
        if (slot) slots[slot] = item.id;
      }
      updateSettings({ slots });
      fileInput.value = '';
      drawUser();
    },
  });

  function drawUser() {
    fill(userBox,
      h('div', { class: 'section-title' },
        h('span', {}, '🎵 I tuoi suoni'),
        userSounds.length ? h('button', {
          class: 'btn small ghost',
          onclick: () => { editing = !editing; drawUser(); },
        }, editing ? 'Fatto' : 'Modifica') : null),
      h('div', { class: 'sound-grid' },
        userSounds.map((s) => h('button', {
          class: `sound user ${audio.isUserPlaying(s.id) ? 'on' : ''}`,
          onclick: async () => {
            if (editing) {
              if (await confirmBox(`Eliminare "${s.name}"?`, 'Elimina')) {
                audio.forgetUser(s.id);
                await deleteSound(s.id);
                const slots = { ...settings().slots };
                for (const k of Object.keys(slots)) if (slots[k] === s.id) delete slots[k];
                updateSettings({ slots });
                userSounds = userSounds.filter((x) => x.id !== s.id);
                drawUser();
              }
              return;
            }
            audio.playUser(s.id, s.blob);
          },
        }, h('span', { class: 'sound-emoji' }, editing ? '🗑️' : '🎵'), h('span', {}, s.name))),
        h('button', { class: 'sound add', onclick: () => fileInput.click() },
          h('span', { class: 'sound-emoji' }, '➕'), h('span', {}, 'Aggiungi mp3'))),
      userSounds.length ? null : h('p', { class: 'muted small' },
        'Qui metti i tuoi mp3 (ululato, canzoni…): puoi sceglierne tanti insieme e restano sul telefono, anche offline.'),
      userSounds.length ? slotsPanel() : null,
      fileInput);
  }
  // Quale suono parte da solo in ogni momento della partita.
  function slotsPanel() {
    const assigned = settings().slots || {};
    return h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '📌 Parte da solo'),
      h('p', { class: 'muted small' }, 'Scegli quale suono parte in automatico in ogni momento della partita.'),
      SLOTS.map((slot) => h('label', { class: 'setting' },
        h('span', { class: 'grow' }, `${slot.emoji} ${slot.label}`),
        h('select', {
          onchange: (e) => updateSettings({ slots: { ...settings().slots, [slot.id]: e.target.value || undefined } }),
        },
        h('option', { value: '' }, '— nessuno —'),
        userSounds.map((u) => h('option', { value: u.id, selected: assigned[slot.id] === u.id }, u.name))))));
  }

  drawUser();
  listSounds().then((list) => { userSounds = list; drawUser(); });

  const custom = h('input', { type: 'text', placeholder: 'Scrivi una frase da far dire al narratore…', enterKeyHint: 'send',
    onkeydown: (e) => { if (e.key === 'Enter') speak(custom.value, { force: true }); } });

  add(root,
    h('header', { class: 'game-header' }, h('h1', {}, '🔊 Soundbar')),
    h('div', { class: 'panel' },
      h('div', { class: 'row' },
        h('span', {}, '🔈'),
        h('input', {
          type: 'range', min: 0, max: 1, step: 0.05, value: audio.getVolume(), class: 'grow',
          oninput: (e) => { audio.setVolume(Number(e.target.value)); updateSettings({ volume: Number(e.target.value) }); },
        }),
        h('span', {}, '🔊'),
        h('button', { class: 'btn danger small', onclick: () => audio.stopAll() }, '⏹ Stop'))),
    h('div', { class: 'section-title' }, '🌙 Atmosfera (in loop)'),
    loopsBox,
    userBox,
    canSpeak() ? [
      h('div', { class: 'section-title' }, '🗣️ Frasi del narratore'),
      h('div', { class: 'phrases' }, PHRASES.map((p) => h('button', { class: 'phrase', onclick: () => speak(p, { force: true }) }, p))),
      h('div', { class: 'add-row' }, custom, h('button', { class: 'btn', onclick: () => speak(custom.value, { force: true }) }, 'Leggi')),
    ] : null,
  );
  return root;
}
