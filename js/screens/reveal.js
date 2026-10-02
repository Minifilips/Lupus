import { h, vibrate, add } from '../ui.js';
import { getRole, TEAMS } from '../roles.js';
import { gameHeader, showOverview } from '../app.js';
import { startNight } from './night.js';
import * as net from '../net.js';

// Chi ha il telefono collegato riceve il ruolo da solo: qui si passa il telefono solo agli altri.
function nextManual(g, from) {
  let i = from;
  while (i < g.players.length && net.isOnline(g.players[i].name)) i++;
  return i;
}

// Stato dei telefoni collegati: chi ha già visto la propria carta.
function phonesPanel(g) {
  const info = net.hostInfo();
  const list = g.players.filter((p) => net.isOnline(p.name));
  if (!info.active || !list.length) return null;
  const seen = (name) => info.members.find((m) => m.name === name)?.seen;
  return h('div', { class: 'panel phones' },
    h('div', { class: 'section-title' }, `📲 Telefoni (${list.filter((p) => seen(p.name)).length}/${list.length} hanno visto la carta)`),
    list.map((p) => h('div', { class: 'row' }, h('span', {}, p.name), h('span', {}, seen(p.name) ? '✅ visto' : '⏳ non ancora'))));
}

// "Passa il telefono": ognuno vede il proprio ruolo e poi lo copre.
export function renderReveal(app) {
  const g = app.game;
  const root = h('div', { class: 'screen' });
  const i = nextManual(g, g.revealIndex);
  g.revealIndex = i;

  if (i >= g.players.length) {
    add(root,
      gameHeader('Ruoli distribuiti', 'Tutti hanno visto la propria carta'),
      h('div', { class: 'hero' },
        h('div', { class: 'hero-emoji' }, '🌙'),
        h('p', {}, 'Ridai il telefono al narratore.'),
        h('p', { class: 'muted small' }, 'Il narratore può controllare i ruoli con il pulsante "👁 Master".')),
      phonesPanel(g),
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

  add(root, gameHeader('Scopri il tuo ruolo', `Giocatore ${i + 1} di ${g.players.length}`), phonesPanel(g));

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
