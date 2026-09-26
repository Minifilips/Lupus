import { h, vibrate, fill, add } from '../ui.js';
import { load, save } from '../storage.js';
import { allRoles, suggestComposition, TEAMS } from '../roles.js';
import { assignRoles } from '../rules.js';
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
      h('div', { class: 'chips' }, names.map((n, i) => h('span', { class: 'chip' }, n,
        h('button', {
          class: 'chip-x', 'aria-label': `Rimuovi ${n}`,
          onclick: () => { names.splice(i, 1); saveNames(); draw(); },
        }, '✕')))),
      names.length ? h('button', {
        class: 'btn small ghost',
        onclick: () => { names = []; saveNames(); draw(); },
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
        onclick: () => {
          vibrate(40);
          app.update((game) => {
            game.players = assignRoles(names, comp);
            game.phase = 'reveal';
            game.revealIndex = 0;
            game.revealShown = false;
            game.log = [{ title: 'Inizio partita', lines: [`${names.length} giocatori`] }];
          });
        },
      }, '🎲 Distribuisci i ruoli'),
    );
  }

  draw();
  add(root, gameHeader('Nuova partita', 'Aggiungi i giocatori e scegli i ruoli'), playersBox, rolesBox, footer);
  return root;
}
