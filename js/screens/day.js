import { h, vibrate, confirmBox, add } from '../ui.js';
import { getRole, TEAMS } from '../roles.js';
import { applyDeaths, checkWin, assignRoles, WIN_TEXT } from '../rules.js';
import { settings, updateSettings, load } from '../storage.js';
import { speak } from '../voice.js';
import * as audio from '../audio.js';
import { playMoment, stopMoment } from '../moments.js';
import { gameHeader, newGame } from '../app.js';
import { playerPicker, startNight } from './night.js';

const nameOf = (g, id) => g.players.find((p) => p.id === id)?.name;

function deathCard(g, d) {
  const p = g.players.find((x) => x.id === d.id);
  const r = getRole(p.role);
  return h('div', { class: 'death' },
    h('div', { class: 'death-name' }, `☠️ ${p.name}`),
    h('div', { class: 'small muted' }, `${r.emoji} ${r.name} · ${d.cause}`));
}

// Il cacciatore morto spara. Restituisce null se non c'è nessun cacciatore in attesa.
function hunterUI(app, title) {
  const g = app.game;
  if (!g.pendingHunters.length) return null;
  const hunterId = g.pendingHunters[0];
  return h('div', { class: 'panel hunter' },
    h('div', { class: 'label' }, `🏹 ${nameOf(g, hunterId)} era il cacciatore! Chi colpisce prima di morire?`),
    playerPicker(g.players.filter((p) => p.alive), {
      onPick: async (p) => {
        if (!(await confirmBox(`Il cacciatore spara a ${p.name}?`, '🏹 Spara'))) return;
        const res = applyDeaths(g.players, [{ id: p.id, cause: `Colpito dal cacciatore ${nameOf(g, hunterId)}` }]);
        app.update((game) => {
          game.pendingHunters = [...game.pendingHunters.slice(1), ...res.hunters];
          if (game.phase === 'dawn') game.dawn.deaths.push(...res.deaths);
          else game.lynchDeaths.push(...res.deaths);
          app.log(title, res.deaths.map((d) => `☠️ ${nameOf(game, d.id)} — ${d.cause}`));
          if (!game.pendingHunters.length) game.winner = checkWin(game.players);
        });
      },
    }),
    h('button', {
      class: 'btn small ghost',
      onclick: () => app.update((game) => {
        game.pendingHunters = game.pendingHunters.slice(1);
        if (!game.pendingHunters.length) game.winner = checkWin(game.players);
      }),
    }, 'Non spara a nessuno'));
}

function winnerButton(app) {
  const g = app.game;
  if (!g.winner || g.pendingHunters.length) return null;
  const w = WIN_TEXT[g.winner];
  return h('div', { class: 'panel win' },
    h('div', { class: 'hero-emoji' }, w.emoji),
    h('h2', {}, w.title),
    h('button', {
      class: 'btn big primary',
      onclick: () => {
        speak(`${w.title} ${w.text}`);
        app.update((game) => { game.phase = 'over'; app.log('Fine', [w.title]); });
      },
    }, '🏆 Mostra il finale'));
}

export function renderDawn(app) {
  const g = app.game;
  const deaths = g.dawn?.deaths || [];
  const announce = () => {
    const names = deaths.map((d) => nameOf(g, d.id));
    const txt = names.length
      ? `Il villaggio si sveglia. Stanotte ${names.length > 1 ? 'sono morti' : 'è morto'} ${names.join(' e ')}.`
      : 'Il villaggio si sveglia. Stanotte non è morto nessuno!';
    audio.stopAll(); // ferma la canzone del mattino
    // Con morti parte il suono dell'annuncio, e la voce legge i nomi quando finisce.
    if (names.length && playMoment('death', { onEnd: () => speak(txt) })) return;
    speak(txt);
  };

  return h('div', { class: 'screen dawn' },
    gameHeader(`Alba · Giorno ${g.day}`, `${g.players.filter((p) => p.alive).length} giocatori vivi`),
    h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '🌅 Cosa è successo stanotte'),
      deaths.length ? deaths.map((d) => deathCard(g, d)) : h('div', { class: 'good-text big-text' }, '🎉 Nessun morto!'),
      g.dawn?.notes?.length ? h('ul', { class: 'notes' }, g.dawn.notes.map((n) => h('li', {}, n))) : null,
      h('button', { class: 'btn', onclick: announce }, '📢 Annuncia al villaggio')),
    hunterUI(app, `Notte ${g.night}`),
    winnerButton(app),
    !g.winner && !g.pendingHunters.length ? h('button', {
      class: 'btn big primary',
      onclick: () => app.update((game) => {
        game.phase = 'day';
        game.dayStage = 'discuss';
        game.votes = {};
        game.lynch = null;
        game.lynchDeaths = [];
        timer.reset(settings().dayMinutes * 60);
      }),
    }, '🗣️ Inizia la discussione') : null,
  );
}

// ---------- Timer (sopravvive ai re-render) ----------

const timer = {
  total: 180,
  left: 180,
  running: false,
  id: null,
  reset(sec) {
    this.stop();
    stopMoment('talk', { rewind: true });
    this.total = sec;
    this.left = sec;
    this.paint();
  },
  start() {
    if (this.running || this.left <= 0) return;
    this.running = true;
    playMoment('talk', { restart: false });
    this.id = setInterval(() => {
      this.left--;
      if (this.left <= 10 && this.left > 0) audio.beep(false);
      if (this.left <= 0) {
        this.left = 0;
        this.stop();
        audio.beep(true);
        vibrate([200, 100, 200]);
        speak('Tempo scaduto!');
      }
      this.paint();
    }, 1000);
    this.paint();
  },
  stop() {
    this.running = false;
    clearInterval(this.id);
    stopMoment('talk');
    this.paint();
  },
  paint() {
    const el = document.getElementById('timer-display');
    if (!el) return;
    const m = Math.floor(this.left / 60);
    const s = String(this.left % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    el.classList.toggle('urgent', this.left <= 10);
    const btn = document.getElementById('timer-toggle');
    if (btn) btn.textContent = this.running ? '⏸ Pausa' : '▶️ Via';
  },
};

function timerUI() {
  const minutes = settings().dayMinutes;
  const el = h('div', { class: 'panel timer' },
    h('div', { id: 'timer-display', class: 'timer-display' }, '0:00'),
    h('div', { class: 'row' },
      h('button', { id: 'timer-toggle', class: 'btn primary', onclick: () => (timer.running ? timer.stop() : timer.start()) }, '▶️ Via'),
      h('button', { class: 'btn ghost', onclick: () => { timer.left += 30; timer.paint(); } }, '+30s'),
      h('button', { class: 'btn ghost', onclick: () => timer.reset(settings().dayMinutes * 60) }, '↺')),
    h('div', { class: 'row small muted' },
      'Durata:',
      [1, 2, 3, 5, 8].map((m) => h('button', {
        class: `chip-btn ${m === minutes ? 'on' : ''}`,
        onclick: (e) => {
          updateSettings({ dayMinutes: m });
          timer.reset(m * 60);
          e.target.parentElement.querySelectorAll('.chip-btn').forEach((b) => b.classList.toggle('on', b === e.target));
        },
      }, `${m}'`))));
  queueMicrotask(() => timer.paint());
  return el;
}

export function renderDay(app) {
  const g = app.game;
  const alive = g.players.filter((p) => p.alive);
  const title = `Giorno ${g.day}`;
  const root = h('div', { class: 'screen day' }, gameHeader(title, `${alive.length} giocatori vivi`));

  if (g.dayStage === 'after') {
    const deaths = g.lynchDeaths || [];
    add(root,
      h('div', { class: 'panel' },
        h('div', { class: 'section-title' }, '🔥 Rogo'),
        deaths.length ? deaths.map((d) => deathCard(g, d)) : h('div', { class: 'muted' }, 'Oggi nessuno è stato mandato al rogo.')),
      hunterUI(app, title),
      winnerButton(app),
      !g.winner && !g.pendingHunters.length ? h('button', {
        class: 'btn big primary',
        onclick: () => {
          timer.stop();
          g.night++;
          startNight(app);
        },
      }, '🌙 Cala la notte') : null);
    return root;
  }

  if (g.owlMark != null && g.players.find((p) => p.id === g.owlMark)?.alive) {
    add(root, h('div', { class: 'notice' }, `🦉 Il gufo ha indicato ${nameOf(g, g.owlMark)}: è automaticamente in ballottaggio.`));
  }

  add(root, timerUI());

  // Conteggio voti.
  const votes = g.votes || {};
  const max = Math.max(0, ...Object.values(votes));
  add(root, h('div', { class: 'panel' },
    h('div', { class: 'section-title' },
      h('span', {}, '🗳️ Voti'),
      h('button', { class: 'btn small ghost', onclick: () => app.update((game) => { game.votes = {}; }) }, 'Azzera')),
    h('div', { class: 'votes' }, alive.map((p) => {
      const v = votes[p.id] || 0;
      const setV = (n) => app.update((game) => { game.votes = { ...game.votes, [p.id]: Math.max(0, n) }; });
      return h('div', { class: `vote-row ${v && v === max ? 'lead' : ''}` },
        h('span', { class: 'grow' }, p.name, p.role === 'sindaco' ? h('span', { class: 'small muted' }, ' 🎩 voto x2') : ''),
        h('button', { class: 'round', disabled: !v, onclick: () => setV(v - 1) }, '−'),
        h('span', { class: 'counter-num' }, v),
        h('button', { class: 'round', onclick: () => { vibrate(10); setV(v + 1); } }, '+'));
    }))));

  // Scelta del rogo.
  const leader = max > 0 ? alive.filter((p) => (votes[p.id] || 0) === max) : [];
  add(root, h('div', { class: 'panel' },
    h('div', { class: 'section-title' }, '🔥 Chi va al rogo?'),
    leader.length > 1 ? h('div', { class: 'warn small' }, `Pareggio tra ${leader.map((p) => p.name).join(', ')}: ballottaggio o decide il sindaco.`) : null,
    playerPicker(alive, {
      selected: g.lynch ?? (leader.length === 1 ? leader[0].id : null),
      onPick: (p) => app.update((game) => { game.lynch = p.id; }),
    }),
    h('div', { class: 'row' },
      h('button', {
        class: 'btn ghost',
        onclick: () => lynch(app, null),
      }, 'Nessuno'),
      h('button', {
        class: 'btn danger grow',
        onclick: () => {
          const id = g.lynch ?? (leader.length === 1 ? leader[0].id : null);
          if (id != null) lynch(app, id);
        },
      }, '🔥 Manda al rogo'))));
  return root;
}

async function lynch(app, id) {
  const g = app.game;
  const title = `Giorno ${g.day}`;
  if (id != null && !(await confirmBox(`Mandare al rogo ${nameOf(g, id)}?`, '🔥 Al rogo'))) return;
  timer.stop();
  if (id == null) {
    app.update((game) => {
      game.dayStage = 'after';
      game.lynchDeaths = [];
      game.lastLynched = null;
      app.log(title, ['Nessuno al rogo']);
    });
    return;
  }
  const p = g.players.find((x) => x.id === id);
  speak(`${p.name} è stato mandato al rogo.`);
  app.update((game) => {
    game.lastLynched = id;
    if (p.role === 'scemo') {
      game.players.find((x) => x.id === id).alive = false;
      game.winner = 'scemo';
      game.lynchDeaths = [{ id, cause: 'Mandato al rogo' }];
      game.pendingHunters = [];
      game.dayStage = 'after';
      app.log(title, [`🔥 ${p.name} (scemo del villaggio) mandato al rogo`]);
      return;
    }
    const res = applyDeaths(game.players, [{ id, cause: 'Mandato al rogo' }]);
    game.lynchDeaths = res.deaths;
    game.pendingHunters = res.hunters;
    game.dayStage = 'after';
    game.winner = res.hunters.length ? null : checkWin(game.players);
    app.log(title, res.deaths.map((d) => `🔥 ${nameOf(game, d.id)} — ${d.cause}`));
  });
}

export function renderOver(app) {
  const g = app.game;
  const w = WIN_TEXT[g.winner] || WIN_TEXT.nessuno;
  const byTeam = {};
  g.players.forEach((p) => { (byTeam[getRole(p.role).team] ||= []).push(p); });

  return h('div', { class: 'screen over' },
    h('div', { class: 'hero' },
      h('div', { class: 'hero-emoji' }, w.emoji),
      h('h1', {}, w.title),
      h('p', { class: 'muted' }, w.text)),
    h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '🎭 Tutti i ruoli'),
      Object.entries(byTeam).map(([team, ps]) => h('div', {},
        h('div', { class: 'small', style: { color: TEAMS[team]?.color } }, TEAMS[team]?.name),
        ps.map((p) => h('div', { class: `ov-row ${p.alive ? '' : 'dead'}` },
          h('span', { class: 'ov-emoji' }, getRole(p.role).emoji),
          h('span', { class: 'grow' }, p.name, p.lover != null ? ' 💘' : ''),
          h('span', { class: 'small muted' }, getRole(p.role).name, p.alive ? '' : ' ☠️')))))),
    h('div', { class: 'panel' },
      h('div', { class: 'section-title' }, '📜 Cronaca della partita'),
      g.log.map((e) => h('div', { class: 'log-entry' }, h('b', {}, e.title), h('ul', {}, e.lines.map((l) => h('li', {}, l)))))),
    h('div', { class: 'stack' },
      h('button', {
        class: 'btn big primary',
        onclick: () => {
          const names = g.players.map((p) => p.name);
          const comp = load('composition', {});
          const total = Object.values(comp).reduce((a, b) => a + b, 0);
          app.game = newGame();
          if (total === names.length) {
            app.game.players = assignRoles(names, comp);
            app.game.phase = 'reveal';
            app.game.log = [{ title: 'Inizio partita', lines: [`${names.length} giocatori`] }];
          }
          app.update();
        },
      }, '🔁 Rigioca (stessi giocatori e ruoli)'),
      h('button', { class: 'btn ghost', onclick: () => { app.game = newGame(); app.update(); } }, '⚙️ Cambia giocatori o ruoli')));
}
