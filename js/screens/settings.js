import { h, confirmBox } from '../ui.js';
import { settings, updateSettings } from '../storage.js';
import { speak, canSpeak } from '../voice.js';
import * as audio from '../audio.js';

function toggle(label, key, hint) {
  const input = h('input', {
    type: 'checkbox', checked: !!settings()[key],
    onchange: (e) => updateSettings({ [key]: e.target.checked }),
  });
  return h('label', { class: 'setting' },
    h('div', { class: 'grow' }, h('div', {}, label), hint ? h('div', { class: 'small muted' }, hint) : null),
    h('span', { class: 'switch' }, input, h('span', { class: 'slider' })));
}

function range(label, key, min, max, step) {
  const out = h('span', { class: 'small muted' }, settings()[key]);
  return h('label', { class: 'setting column' },
    h('div', { class: 'row' }, h('span', { class: 'grow' }, label), out),
    h('input', {
      type: 'range', min, max, step, value: settings()[key],
      oninput: (e) => { updateSettings({ [key]: Number(e.target.value) }); out.textContent = e.target.value; },
    }));
}

export function renderSettings() {
  const s = settings();
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;

  return h('div', { class: 'screen' },
    h('header', { class: 'game-header' }, h('h1', {}, '⚙️ Opzioni')),

    h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '🗣️ Voce del narratore'),
      canSpeak() ? [
        toggle('Narrazione automatica', 'voice', 'Durante la notte l’app chiama i ruoli ad alta voce'),
        range('Velocità', 'voiceRate', 0.6, 1.3, 0.05),
        range('Tono', 'voicePitch', 0.5, 1.5, 0.05),
        h('button', { class: 'btn ghost', onclick: () => speak('Il villaggio si addormenta. Lupi, aprite gli occhi.', { force: true }) }, '▶️ Prova la voce'),
      ] : h('p', { class: 'muted' }, 'La sintesi vocale non è disponibile su questo browser.')),

    h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '🌙 Notte'),
      toggle('Chiama anche i ruoli morti', 'bluff', 'Così nessuno capisce chi è uscito dal gioco'),
      h('label', { class: 'setting' },
        h('span', { class: 'grow' }, 'Sottofondo notturno'),
        h('select', {
          onchange: (e) => updateSettings({ ambient: e.target.value }),
        },
        h('option', { value: 'none', selected: s.ambient === 'none' }, 'Nessuno'),
        audio.LOOPS.map((l) => h('option', { value: l.id, selected: s.ambient === l.id }, `${l.emoji} ${l.name}`))))),

    h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '📲 Installa sull’iPhone'),
      standalone
        ? h('p', {}, '✅ L’app è già installata sulla schermata Home.')
        : h('ol', { class: 'small' },
          h('li', {}, 'Apri questa pagina con Safari.'),
          h('li', {}, 'Tocca il pulsante Condividi (il quadrato con la freccia in su).'),
          h('li', {}, 'Scegli “Aggiungi alla schermata Home”.'),
          h('li', {}, 'Apri Lupus dall’icona: funziona anche senza internet.')),
      h('p', { class: 'small muted' }, 'Consiglio: disattiva la modalità silenziosa (interruttore laterale) per sentire i suoni.')),

    h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '🧹 Dati'),
      h('button', {
        class: 'btn ghost danger-text',
        onclick: async () => {
          if (!(await confirmBox('Cancellare partita, giocatori salvati, ruoli personalizzati e impostazioni? (i suoni caricati restano)', 'Cancella tutto'))) return;
          Object.keys(localStorage).filter((k) => k.startsWith('lupus.')).forEach((k) => localStorage.removeItem(k));
          location.reload();
        },
      }, 'Cancella tutti i dati')),

    h('p', { class: 'center small muted' }, 'Lupus · app del narratore'));
}
