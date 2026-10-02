import { h, confirmBox, fill, add } from '../ui.js';
import { listSounds, addSound, deleteSound, updateSettings, settings } from '../storage.js';
import { SLOTS, cleanName, slotFor, isAudioFile, audioMime } from '../slots.js';
import * as audio from '../audio.js';

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
  let report = null; // esito dell'ultimo caricamento: { ok, failed: [] }

  const explain = (err) => {
    if (err?.name === 'NotReadableError') return 'non riesco a leggerlo (se è su iCloud, aprilo prima nell\'app File per scaricarlo)';
    if (err?.name === 'QuotaExceededError') return 'memoria piena';
    return err?.message || 'errore sconosciuto';
  };

  // Nessun filtro "accept": su iPhone e iPad il filtro audio nasconde o blocca file mp3 validi.
  const fileInput = h('input', {
    type: 'file', multiple: true, style: { display: 'none' },
    onchange: async () => {
      const files = [...fileInput.files];
      fileInput.value = '';
      const slots = { ...settings().slots };
      const failed = [];
      let ok = 0;
      for (const f of files) {
        if (!isAudioFile(f)) { failed.push(`${f.name}: non sembra un file audio`); continue; }
        try {
          // Copia i dati subito e con il tipo giusto: Safari lo richiede per riprodurre l'mp3.
          const blob = new Blob([await f.arrayBuffer()], { type: audioMime(f) });
          const item = await addSound(cleanName(f.name), blob);
          audio.registerUser(item.id, item.blob);
          userSounds.push(item);
          ok++;
          // Se il nome del file assomiglia a un momento libero (es. "ululato", "Here Comes the Sun"), lo assegna da solo.
          const slot = slotFor(f.name, slots);
          if (slot) slots[slot] = item.id;
        } catch (err) {
          failed.push(`${f.name}: ${explain(err)}`);
        }
      }
      updateSettings({ slots });
      report = { ok, failed };
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
      report ? h('div', { class: 'notice' },
        report.ok ? h('div', {}, `✅ Aggiunti ${report.ok} suoni`) : null,
        report.failed.map((f) => h('div', { class: 'warn small' }, `⚠️ ${f}`))) : null,
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
  );
  return root;
}
