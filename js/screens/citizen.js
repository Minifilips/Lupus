import { h, add, vibrate, confirmBox } from '../ui.js';
import * as net from '../net.js';
import { normalizeCode } from '../netlogic.js';

let cardOpen = false;

function card(role) {
  return h('div', { class: 'card front flip', style: { borderColor: role.teamColor } },
    h('div', { class: 'card-emoji' }, role.emoji),
    h('div', { class: 'card-role' }, role.name),
    h('div', { class: 'card-team', style: { color: role.teamColor } }, `Squadra: ${role.team}`),
    h('p', { class: 'card-desc' }, role.desc));
}

function footer(app) {
  return h('div', { class: 'citizen-foot' },
    h('button', {
      class: 'btn small ghost',
      onclick: async () => {
        if (await confirmBox('Uscire dalla partita?', 'Esci')) { cardOpen = false; net.leaveLobby(); app.render(); }
      },
    }, '↩︎ Esci dalla partita'),
    h('button', { class: 'btn small ghost', onclick: () => { net.leaveLobby(); app.setMode(null); } }, 'Cambia modalità'));
}

function joinForm(app, status) {
  const code = h('input', {
    type: 'text', placeholder: 'CODICE', maxLength: 4, autocapitalize: 'characters', autocomplete: 'off', class: 'code-input',
    oninput: (e) => { e.target.value = normalizeCode(e.target.value); },
  });
  const name = h('input', { type: 'text', placeholder: 'Il tuo nome', maxLength: 20, autocapitalize: 'words', autocomplete: 'off' });
  const go = () => {
    if (normalizeCode(code.value).length < 4 || !name.value.trim()) return;
    vibrate(30);
    net.joinLobby(code.value, name.value);
  };
  return h('div', { class: 'screen' },
    h('header', { class: 'game-header' }, h('div', {}, h('h1', {}, 'Entra nella partita'), h('div', { class: 'muted small' }, 'Chiedi il codice al narratore'))),
    h('div', { class: 'panel' }, code, name,
      status === 'notfound' ? h('div', { class: 'warn small' }, 'Nessuna lobby con questo codice. Controlla il codice e riprova.') : null,
      status === 'error' ? h('div', { class: 'warn small' }, 'Impossibile usare la rete su questo browser.') : null,
      h('button', { class: 'btn big primary', onclick: go }, 'Entra')),
    footer(app));
}

export function renderCitizen(app) {
  const { session, status, state } = net.clientInfo();
  if (!session || status === 'notfound' || status === 'error') return joinForm(app, status);

  const root = h('div', { class: `screen citizen ${state?.phase === 'night' ? 'citizen-night' : ''}` });
  const banner = status === 'connected' ? null
    : h('div', { class: 'notice center' }, status === 'reconnecting' ? '📡 Connessione persa, riconnessione…' : '📡 Connessione al narratore…');

  if (!state) {
    add(root, banner, h('div', { class: 'hero' }, h('div', { class: 'hero-emoji' }, '📡'), h('p', {}, `Ciao ${session.name}!`)), footer(app));
    return root;
  }

  const dead = state.alive === false;
  const role = state.role;
  const reveal = (open) => h('div', { class: 'pass' },
    open ? card(role)
      : h('button', {
        class: 'card back',
        onclick: () => { vibrate(20); cardOpen = true; net.sendSeen(); app.render(); },
      }, h('div', { class: 'card-back-emoji' }, '🐺'), h('div', {}, 'Tocca per vedere il tuo ruolo')),
    open ? h('button', { class: 'btn big', onclick: () => { cardOpen = false; app.render(); } }, '🙈 Copri la carta') : null);

  switch (state.phase) {
    case 'lobby':
      cardOpen = false;
      add(root, banner,
        h('div', { class: 'hero' },
          h('div', { class: 'hero-emoji' }, '⏳'),
          h('h2', {}, `Ciao ${state.name || session.name}!`),
          h('p', {}, 'Sei nella lobby. Aspetta che il narratore distribuisca i ruoli.'),
          h('p', { class: 'muted small' }, `Codice ${session.code}`)));
      break;
    case 'reveal':
      add(root, banner, h('header', { class: 'game-header' }, h('h1', {}, `${state.name}, il tuo ruolo`)),
        role ? reveal(cardOpen) : null,
        h('p', { class: 'muted small center' }, 'Assicurati che nessun altro stia guardando!'));
      break;
    case 'night':
      cardOpen = false;
      add(root, banner,
        h('div', { class: 'hero' },
          h('div', { class: 'hero-emoji moon' }, dead ? '☠️' : '🌙'),
          h('h2', {}, dead ? 'Sei stato eliminato' : 'È notte'),
          h('p', { class: 'muted' }, dead ? 'Resta in silenzio e ascolta.' : 'Chiudi gli occhi e non sbirciare. Il narratore ti chiamerà se serve.')));
      break;
    case 'day':
      add(root, banner,
        h('div', { class: 'hero' },
          h('div', { class: 'hero-emoji' }, dead ? '☠️' : '☀️'),
          h('h2', {}, dead ? 'Sei stato eliminato' : 'Il villaggio è sveglio'),
          h('p', { class: 'muted' }, dead ? 'Non puoi più parlare né votare.' : 'Discuti e vota con gli altri.')),
        role ? reveal(cardOpen) : null);
      break;
    case 'over':
      add(root, banner,
        h('div', { class: 'hero' },
          h('div', { class: 'hero-emoji' }, state.winner?.emoji || '🏁'),
          h('h2', {}, state.winner?.title || 'Partita finita'),
          h('p', { class: 'muted' }, state.winner?.text || '')),
        role ? h('div', { class: 'pass' }, h('div', { class: 'muted' }, 'Il tuo ruolo era'), card(role)) : null);
      break;
    default:
      break;
  }
  add(root, footer(app));
  return root;
}
