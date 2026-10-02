import { h, modal, confirmBox, keepAwake, fill, add } from './ui.js';
import { load, save, settings } from './storage.js';
import { getRole, setCustomRoles, TEAMS } from './roles.js';
import * as audio from './audio.js';
import { renderSetup } from './screens/setup.js';
import { renderReveal } from './screens/reveal.js';
import { renderNight } from './screens/night.js';
import { renderDawn, renderDay, renderOver } from './screens/day.js';
import { renderSoundbar } from './screens/soundbar.js';
import { renderMusic } from './screens/music.js';
import { renderRoles } from './screens/roles-info.js';
import { renderSettings } from './screens/settings.js';

setCustomRoles(load('customRoles', []));
audio.setVolume(settings().volume);

const TABS = [
  { id: 'game', label: 'Partita', icon: '🌕' },
  { id: 'sounds', label: 'Soundbar', icon: '🔊' },
  { id: 'music', label: 'Musica', icon: '🎵' },
  { id: 'roles', label: 'Ruoli', icon: '🎭' },
  { id: 'settings', label: 'Opzioni', icon: '⚙️' },
];

export function newGame(players = []) {
  return {
    phase: 'setup',
    players,
    composition: load('composition', {}),
    revealIndex: 0,
    revealShown: false,
    night: 1,
    day: 0,
    steps: [],
    step: -1,
    actions: {},
    witch: { life: true, death: true },
    priestUsed: false,
    lastLynched: null,
    owlMark: null,
    dawn: null,
    pendingHunters: [],
    votes: {},
    dayStage: 'discuss',
    lynch: null,
    log: [],
    winner: null,
  };
}

// Migrazione dei ruoli rinominati: la vecchia 'puttana' (che visita) è la 'cortigiana',
// la vecchia 'guardia' (che protegge) è la 'puttana'. Si applica una sola volta.
const RENAMED = { puttana: 'cortigiana', guardia: 'puttana' };
const RENAMED_ACTIONS = { harlot: 'visit', guard: 'protect' };

function migrate() {
  if (load('rolesVersion', 1) >= 2) return;
  const comp = load('composition', null);
  if (comp) {
    const out = {};
    for (const [k, v] of Object.entries(comp)) out[RENAMED[k] || k] = v;
    save('composition', out);
  }
  const game = load('game', null);
  if (game?.players) {
    game.players.forEach((p) => { p.role = RENAMED[p.role] || p.role; });
    (game.steps || []).forEach((st) => { st.roleId = RENAMED[st.roleId] || st.roleId; });
    const acts = {};
    for (const [k, v] of Object.entries(game.actions || {})) acts[RENAMED_ACTIONS[k] || k] = v;
    game.actions = acts;
    delete game.lastGuard;
    game.priestUsed = !!game.priestUsed;
    save('game', game);
  }
  save('rolesVersion', 2);
}
migrate();

export const app = {
  game: load('game', null) || newGame(),
  tab: load('tab', 'game'),
  save() {
    save('game', this.game);
  },
  update(fn) {
    fn?.(this.game);
    this.save();
    this.render();
  },
  setTab(id) {
    this.tab = id;
    save('tab', id);
    this.render();
    window.scrollTo(0, 0);
  },
  log(title, lines) {
    const last = this.game.log[this.game.log.length - 1];
    if (last && last.title === title) last.lines.push(...lines);
    else this.game.log.push({ title, lines: [...lines] });
  },
  render,
};

const main = document.getElementById('main');
const nav = document.getElementById('tabs');

function render() {
  const g = app.game;
  fill(main);
  let screen;
  if (app.tab === 'game') {
    const byPhase = {
      setup: renderSetup, reveal: renderReveal, night: renderNight,
      dawn: renderDawn, day: renderDay, over: renderOver,
    };
    screen = (byPhase[g.phase] || renderSetup)(app);
  } else if (app.tab === 'sounds') screen = renderSoundbar(app);
  else if (app.tab === 'music') screen = renderMusic(app);
  else if (app.tab === 'roles') screen = renderRoles(app);
  else screen = renderSettings(app);
  add(main, screen);

  fill(nav, ...TABS.map((t) => h('button', {
    class: `tab ${app.tab === t.id ? 'active' : ''}`,
    onclick: () => app.setTab(t.id),
  }, h('span', { class: 'tab-icon' }, t.icon), h('span', {}, t.label))));

  document.body.dataset.phase = app.tab === 'game' ? g.phase : 'other';
  keepAwake(['night', 'dawn', 'day'].includes(g.phase));
}

// Barra in alto nelle schermate di partita: fase + riepilogo segreto per il narratore.
export function gameHeader(title, subtitle) {
  return h('header', { class: 'game-header' },
    h('div', {},
      h('h1', {}, title),
      subtitle ? h('div', { class: 'muted small' }, subtitle) : null),
    app.game.players.length && app.game.phase !== 'setup'
      ? h('button', { class: 'btn small ghost', onclick: showOverview }, '👁 Master')
      : null);
}

// Riepilogo ruoli per il narratore, con correzione manuale vivo/morto e registro.
export function showOverview() {
  const g = app.game;
  let close;
  const list = h('div', { class: 'overview' }, g.players.map((p) => {
    const r = getRole(p.role);
    return h('div', { class: `ov-row ${p.alive ? '' : 'dead'}` },
      h('span', { class: 'ov-emoji' }, r.emoji),
      h('div', { class: 'grow' },
        h('div', { class: 'ov-name' }, p.name, p.lover != null ? ' 💘' : ''),
        h('div', { class: 'small', style: { color: TEAMS[r.team]?.color } }, r.name)),
      h('button', {
        class: 'btn small ghost',
        onclick: () => { p.alive = !p.alive; app.save(); close(); app.render(); showOverview(); },
      }, p.alive ? '☠️ Uccidi' : '❤️ Resuscita'));
  }));
  const logView = h('div', { class: 'log' }, g.log.length
    ? g.log.map((e) => h('div', { class: 'log-entry' }, h('b', {}, e.title), h('ul', {}, e.lines.map((l) => h('li', {}, l)))))
    : h('p', { class: 'muted' }, 'Ancora niente nel registro.'));
  close = modal([
    h('h2', {}, '👁 Solo per il narratore'),
    list,
    h('h3', {}, '📜 Registro'),
    logView,
    h('div', { class: 'row' },
      h('button', {
        class: 'btn ghost danger-text',
        onclick: async () => {
          close();
          if (await confirmBox('Abbandonare la partita in corso?', 'Abbandona')) {
            app.game = newGame();
            audio.stopAll();
            app.update();
          }
        },
      }, 'Abbandona partita'),
      h('button', { class: 'btn', onclick: () => close() }, 'Chiudi')),
  ]);
}

// Service worker per funzionare offline.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

document.addEventListener('visibilitychange', () => {
  // Il blocco dello schermo si perde quando l'app va in background.
  if (document.visibilityState === 'visible') keepAwake(['night', 'dawn', 'day'].includes(app.game.phase));
});

// Il primo tocco sblocca l'audio su iOS.
document.addEventListener('pointerdown', () => audio.unlock(), { once: true, capture: true });

render();
