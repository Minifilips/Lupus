import { h, vibrate, fill, add, modal, confirmBox } from '../ui.js';
import { load, save } from '../storage.js';
import { allRoles, suggestComposition, TEAMS } from '../roles.js';
import { assignRoles } from '../rules.js';
import { rosterProblems } from '../netlogic.js';
import * as net from '../net.js';
import { gameHeader } from '../app.js';

export function renderSetup(app) {
  const g = app.game;
  let names = load('players', []);
  const comp = g.composition;

  const saveNames = () => save('players', names);
  const saveComp = () => { save('composition', comp); app.save(); };

  const root = h('div', { class: 'screen' });
  const input = h('input', {
    type: 'text', placeholder: 'Nome del giocatore', maxLength: 20, enterKeyHint: 'done',
    autocapitalize: 'words', autocomplete: 'off',
    onkeydown: (e) => { if (e.key === 'Enter') addName(); },
  });

  function addName() {
    const v = input.value.trim();
    if (!v) return;
    let name = v;
    let n = 2;
    while (names.includes(name)) name = `${v} ${n++}`;
    names.push(name);
    saveNames();
    input.value = '';
    draw();
    input.focus();
  }

  const playersBox = h('div');
  const rolesBox = h('div');
  const footer = h('div', { class: 'sticky-footer' });

  function total() {
    return Object.values(comp).reduce((a, b) => a + (b || 0), 0);
  }

  function draw() {
    fill(playersBox,
      h('div', { class: 'section-title' }, `👥 Giocatori (${names.length})`),
      h('div', { class: 'add-row' }, input, h('button', { class: 'btn', onclick: addName }, 'Aggiungi')),
      h('div', { class: 'chips' }, names.map((n, i) => h('span', { class: 'chip' },
        net.hostActive() ? h('span', { class: `dot ${net.isOnline(n) ? 'on' : ''}` }) : null, n,
        h('button', {
          class: 'chip-x', 'aria-label': `Rimuovi ${n}`,
          onclick: () => { names.splice(i, 1); saveNames(); net.removeMember(n); draw(); },
        }, '✕')))),
      names.length ? h('button', {
        class: 'btn small ghost',
        onclick: () => { names.forEach((n) => net.removeMember(n)); names = []; saveNames(); draw(); },
      }, 'Svuota lista') : null,
    );

    const t = total();
    const n = names.length;
    fill(rolesBox,
      h('div', { class: 'section-title' },
        h('span', {}, `🎭 Ruoli `, h('span', { class: t === n ? 'ok' : 'warn' }, `${t} / ${n}`)),
        h('button', {
          class: 'btn small',
          disabled: n < 4,
          onclick: () => {
            for (const k of Object.keys(comp)) delete comp[k];
            Object.assign(comp, suggestComposition(n));
            saveComp();
            draw();
          },
        }, '⚖️ Bilancia')),
      h('div', { class: 'role-counters' }, allRoles().map((r) => {
        const c = comp[r.id] || 0;
        const set = (v) => { comp[r.id] = Math.max(0, v); if (!comp[r.id]) delete comp[r.id]; saveComp(); draw(); };
        return h('div', { class: `counter ${c ? 'on' : ''}` },
          h('span', { class: 'counter-emoji' }, r.emoji),
          h('div', { class: 'grow' },
            h('div', { class: 'counter-name' }, r.name),
            h('div', { class: 'small', style: { color: TEAMS[r.team]?.color } }, TEAMS[r.team]?.name)),
          h('button', { class: 'round', onclick: () => set(c - 1), disabled: !c, 'aria-label': 'meno' }, '−'),
          h('span', { class: 'counter-num' }, c),
          h('button', { class: 'round', onclick: () => set(c + 1), 'aria-label': 'più' }, '+'));
      })),
    );

    const problems = [];
    if (n < 4) problems.push('Servono almeno 4 giocatori.');
    if (!comp.lupo) problems.push('Serve almeno un lupo.');
    if (t !== n) problems.push(`I ruoli (${t}) devono essere tanti quanti i giocatori (${n}).`);
    if ((comp.lupo || 0) * 2 >= n && n >= 4) problems.push('Troppi lupi: vincerebbero subito.');

    fill(footer,
      problems.length ? h('div', { class: 'warn small center' }, problems[0]) : null,
      h('button', {
        class: 'btn big primary',
        disabled: problems.length > 0,
        onclick: () => begin(assignRoles(names, comp)),
      }, '🎲 Distribuisci a caso'),
      h('button', { class: 'btn', disabled: n < 4, onclick: manualAssign }, '✋ Assegna i ruoli a mano'),
    );
  }

  function begin(players) {
    vibrate(40);
    net.resetSeen();
    app.update((game) => {
      game.players = players;
      game.phase = 'reveal';
      game.revealIndex = 0;
      game.revealShown = false;
      game.log = [{ title: 'Inizio partita', lines: [`${players.length} giocatori`] }];
    });
  }

  // Il narratore sceglie a mano il ruolo di ognuno (si parte dalla distribuzione casuale, se valida).
  function manualAssign() {
    const n = names.length;
    const valid = total() === n && !rosterProblems(Object.entries(comp).flatMap(([id, c]) => Array(c).fill(id))).length;
    const roles = valid ? assignRoles(names, comp).map((p) => p.role) : names.map(() => null);
    const status = h('div', { class: 'small center' });
    const go = h('button', { class: 'btn big primary' }, '✅ Conferma e distribuisci');
    const check = () => {
      const pr = rosterProblems(roles);
      fill(status, pr.length ? h('span', { class: 'warn' }, pr[0]) : h('span', { class: 'ok' }, 'Ruoli a posto'));
      go.disabled = pr.length > 0;
    };
    const close = modal([
      h('h2', {}, '✋ Assegna i ruoli'),
      h('div', {}, names.map((name, i) => h('div', { class: 'assign-row' },
        h('span', { class: 'grow' }, net.isOnline(name) ? '📱 ' : '', name),
        h('select', { onchange: (e) => { roles[i] = e.target.value || null; check(); } },
          h('option', { value: '' }, '— scegli —'),
          allRoles().map((r) => h('option', { value: r.id, selected: roles[i] === r.id }, `${r.emoji} ${r.name}`)))))),
      status,
      go,
      h('button', { class: 'btn ghost', onclick: () => close() }, 'Annulla'),
    ]);
    go.onclick = () => {
      close();
      begin(names.map((name, i) => ({ id: i, name, role: roles[i], alive: true, lover: null })));
    };
    check();
  }

  // Lobby online: i giocatori entrano col codice dal loro telefono.
  const lobbyBox = h('div', { class: 'panel' });
  let lobbyError = '';
  function drawLobby() {
    const info = net.hostInfo();
    fill(lobbyBox,
      h('div', { class: 'section-title' }, '📲 Lobby online'),
      info.active ? [
        h('div', { class: 'code' }, info.code),
        h('p', { class: 'muted small center' }, 'I giocatori aprono l’app, scelgono Cittadino e inseriscono questo codice.'),
        h('button', {
          class: 'btn small ghost',
          onclick: async () => {
            if (await confirmBox('Chiudere la lobby? I telefoni collegati verranno scollegati.', 'Chiudi')) { net.stopHost(); drawLobby(); draw(); }
          },
        }, 'Chiudi lobby'),
      ] : [
        h('p', { class: 'muted small' }, 'Ognuno vede il proprio ruolo sul proprio telefono (serve internet su tutti). Puoi anche giocare con un solo telefono: aggiungi i nomi qui sotto.'),
        lobbyError ? h('div', { class: 'warn small' }, lobbyError) : null,
        h('button', {
          class: 'btn',
          onclick: () => {
            lobbyError = '';
            net.startHost().then(() => { drawLobby(); draw(); }).catch(() => { lobbyError = 'Impossibile aprire la lobby: controlla la connessione.'; drawLobby(); });
          },
        }, '📲 Apri lobby'),
      ]);
  }
  const unsub = net.subscribe(() => {
    if (!root.isConnected) { unsub(); return; }
    names = load('players', []);
    drawLobby();
    draw();
  });
  drawLobby();

  draw();
  add(root, gameHeader('Nuova partita', 'Aggiungi i giocatori e scegli i ruoli'), lobbyBox, playersBox, rolesBox, footer);
  return root;
}
