import { h, confirmBox, fill, add } from '../ui.js';
import { ROLES, TEAMS, setCustomRoles, allRoles } from '../roles.js';
import { load, save } from '../storage.js';

const WHEN = { every: 'ogni notte', first: 'solo la prima notte', notFirst: 'dalla seconda notte' };

function roleCard(r, onDelete) {
  const team = TEAMS[r.team];
  return h('div', { class: 'role-card', style: { borderLeftColor: team?.color } },
    h('div', { class: 'role-card-head' },
      h('span', { class: 'role-card-emoji' }, r.emoji),
      h('div', { class: 'grow' },
        h('div', { class: 'role-card-name' }, r.name),
        h('div', { class: 'small', style: { color: team?.color } },
          team?.name, r.night ? ` · si sveglia ${WHEN[r.night.when]}` : ' · non si sveglia di notte')),
      onDelete ? h('button', { class: 'btn small ghost', onclick: onDelete }, '🗑️') : null),
    r.desc ? h('p', { class: 'small' }, r.desc) : null);
}

export function renderRoles(app) {
  const root = h('div', { class: 'screen' });
  const customBox = h('div');
  let custom = load('customRoles', []);

  const persist = () => {
    save('customRoles', custom);
    setCustomRoles(custom);
  };

  function drawCustom() {
    fill(customBox,
      h('div', { class: 'section-title' }, '✏️ Ruoli personalizzati'),
      custom.length ? custom.map((r) => roleCard(allRoles().find((x) => x.id === r.id), async () => {
        if (!(await confirmBox(`Eliminare il ruolo "${r.name}"?`, 'Elimina'))) return;
        custom = custom.filter((x) => x.id !== r.id);
        const comp = app.game.composition;
        delete comp[r.id];
        persist();
        save('composition', comp);
        app.save();
        drawCustom();
      })) : h('p', { class: 'muted small' }, 'Inventa i tuoi personaggi: compariranno nella preparazione e, se si svegliano, anche nella notte guidata.'),
      editor());
  }

  function editor() {
    const name = h('input', { type: 'text', placeholder: 'Nome (es. Vampiro)', maxLength: 24 });
    const emoji = h('input', { type: 'text', placeholder: '🧛', maxLength: 4, class: 'emoji-input' });
    const team = h('select', {}, Object.entries(TEAMS).map(([id, t]) => h('option', { value: id }, t.name)));
    const desc = h('textarea', { placeholder: 'Cosa fa questo ruolo?', rows: 2 });
    const wakes = h('input', { type: 'checkbox' });
    const target = h('input', { type: 'checkbox', checked: true });
    const when = h('select', {}, Object.entries(WHEN).map(([id, t]) => h('option', { value: id }, t)));
    const order = h('select', {},
      h('option', { value: 15 }, 'prima dei lupi'),
      h('option', { value: 55 }, 'subito dopo i lupi'),
      h('option', { value: 80, selected: true }, 'alla fine della notte'));
    const nightOpts = h('div', { class: 'stack', style: { display: 'none' } },
      h('label', { class: 'check' }, target, ' Sceglie un giocatore'),
      h('label', {}, 'Quando: ', when),
      h('label', {}, 'Ordine: ', order));
    wakes.addEventListener('change', () => { nightOpts.style.display = wakes.checked ? '' : 'none'; });

    return h('div', { class: 'panel editor' },
      h('div', { class: 'label' }, '➕ Nuovo ruolo'),
      h('div', { class: 'add-row' }, emoji, name),
      h('label', {}, 'Squadra: ', team),
      desc,
      h('label', { class: 'check' }, wakes, ' Si sveglia di notte'),
      nightOpts,
      h('button', {
        class: 'btn primary',
        onclick: () => {
          const n = name.value.trim();
          if (!n) { name.focus(); return; }
          custom.push({
            id: `custom_${Date.now()}`,
            name: n,
            emoji: emoji.value.trim() || '❓',
            team: team.value,
            desc: desc.value.trim(),
            wakes: wakes.checked,
            needsTarget: target.checked,
            when: when.value,
            order: Number(order.value),
          });
          persist();
          drawCustom();
        },
      }, 'Salva ruolo'));
  }

  drawCustom();
  add(root,
    h('header', { class: 'game-header' }, h('h1', {}, '🎭 Personaggi')),
    h('div', { class: 'role-list' }, ROLES.map((r) => roleCard(r))),
    customBox);
  return root;
}
