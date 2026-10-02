import { h } from '../ui.js';

// Prima schermata: chi sei in questa partita?
export function renderMode(app) {
  return h('div', { class: 'screen mode' },
    h('div', { class: 'hero' },
      h('div', { class: 'hero-emoji moon' }, '🐺'),
      h('h1', {}, 'Lupus'),
      h('p', { class: 'muted' }, 'Chi sei in questa partita?')),
    h('div', { class: 'stack' },
      h('button', { class: 'btn big primary', onclick: () => app.setMode('narrator') }, '🎙️ Narratore'),
      h('button', { class: 'btn big', onclick: () => app.setMode('citizen') }, '🧑 Cittadino')),
    h('p', { class: 'muted small center' },
      'Il narratore guida la partita e distribuisce i ruoli. I cittadini entrano con il codice e vedono il proprio ruolo sul loro telefono. Serve internet su tutti i telefoni.'));
}
