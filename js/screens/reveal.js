import { h, vibrate, add } from '../ui.js';
import { getRole, TEAMS } from '../roles.js';
import { gameHeader, showOverview } from '../app.js';
import { startNight } from './night.js';

// "Passa il telefono": ognuno vede il proprio ruolo e poi lo copre.
export function renderReveal(app) {
  const g = app.game;
  const root = h('div', { class: 'screen' });
  const i = g.revealIndex;

  if (i >= g.players.length) {
    add(root,
      gameHeader('Ruoli distribuiti', 'Tutti hanno visto la propria carta'),
      h('div', { class: 'hero' },
        h('div', { class: 'hero-emoji' }, '🌙'),
        h('p', {}, 'Ridai il telefono al narratore.'),
        h('p', { class: 'muted small' }, 'Il narratore può controllare i ruoli con il pulsante "👁 Master".')),
      h('div', { class: 'stack' },
        h('button', { class: 'btn big primary', onclick: () => startNight(app) }, '🌙 Inizia la prima notte'),
        h('button', { class: 'btn ghost', onclick: showOverview }, '👁 Riepilogo ruoli (solo narratore)'),
        h('button', {
          class: 'btn ghost',
          onclick: () => app.update((game) => { game.revealIndex = 0; game.revealShown = false; }),
        }, '↺ Ricomincia la distribuzione')),
    );
    return root;
  }

  const p = g.players[i];
  const r = getRole(p.role);

  add(root, gameHeader('Scopri il tuo ruolo', `Giocatore ${i + 1} di ${g.players.length}`));

  if (!g.revealShown) {
    add(root,
      h('div', { class: 'pass' },
        h('div', { class: 'muted' }, 'Passa il telefono a'),
        h('div', { class: 'pass-name' }, p.name),
        h('button', {
          class: 'card back',
          onclick: () => { vibrate(20); app.update((game) => { game.revealShown = true; }); },
        }, h('div', { class: 'card-back-emoji' }, '🐺'), h('div', {}, 'Tocca per vedere il tuo ruolo')),
        h('p', { class: 'muted small center' }, 'Assicurati che nessun altro stia guardando!')),
    );
  } else {
    const team = TEAMS[r.team];
    add(root,
      h('div', { class: 'pass' },
        h('div', { class: 'pass-name small-name' }, p.name),
        h('div', { class: 'card front flip', style: { borderColor: team?.color } },
          h('div', { class: 'card-emoji' }, r.emoji),
          h('div', { class: 'card-role' }, r.name),
          h('div', { class: 'card-team', style: { color: team?.color } }, `Squadra: ${team?.name}`),
          h('p', { class: 'card-desc' }, r.desc)),
        h('button', {
          class: 'btn big',
          onclick: () => app.update((game) => { game.revealShown = false; game.revealIndex++; }),
        }, '🙈 Ho visto, copri e passa')),
    );
  }
  return root;
}
