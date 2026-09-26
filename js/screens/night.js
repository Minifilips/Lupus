import { h, vibrate, fill, add } from '../ui.js';
import { getRole, looksLikeWolf } from '../roles.js';
import { buildNightSteps, resolveNight, applyDeaths, mythomaniacRole, checkWin } from '../rules.js';
import { settings } from '../storage.js';
import { speak, speakSequence } from '../voice.js';
import * as audio from '../audio.js';
import { gameHeader } from '../app.js';

// Griglia di giocatori da toccare. `blocked(p)` restituisce un motivo per disabilitarlo.
export function playerPicker(players, { selected = [], onPick, blocked = () => null, showRole = false }) {
  const sel = Array.isArray(selected) ? selected : [selected];
  return h('div', { class: 'picker' }, players.map((p) => {
    const why = blocked(p);
    return h('button', {
      class: `pick ${sel.includes(p.id) ? 'selected' : ''}`,
      disabled: !!why,
      title: why || '',
      onclick: () => { vibrate(15); onPick(p); },
    }, h('span', { class: 'pick-name' }, p.name),
    showRole ? h('span', { class: 'pick-role' }, getRole(p.role).emoji) : null,
    why ? h('span', { class: 'pick-why' }, why) : null);
  }));
}

export function startNight(app) {
  app.update((g) => {
    g.phase = 'night';
    g.steps = buildNightSteps(g.players, g.night, settings().bluff);
    g.step = -1;
    g.actions = {};
    g.dawn = null;
  });
}

function startAmbient() {
  const a = settings().ambient;
  if (a && a !== 'none') audio.startLoop(a);
}

function stepCall(step) {
  const r = getRole(step.roleId);
  return r.call || `${r.name}, apri gli occhi.`;
}

function stepClose(step) {
  const r = getRole(step.roleId);
  return r.close || `${r.name}, chiudi gli occhi.`;
}

export function renderNight(app) {
  const g = app.game;
  const root = h('div', { class: 'screen night' });
  const alive = g.players.filter((p) => p.alive);

  // Introduzione: il villaggio si addormenta.
  if (g.step < 0) {
    add(root,
      gameHeader(`Notte ${g.night}`, `${alive.length} giocatori vivi`),
      h('div', { class: 'hero' },
        h('div', { class: 'hero-emoji moon' }, '🌕'),
        h('p', {}, 'Quando tutti sono pronti, fai calare la notte.'),
        h('p', { class: 'muted small' }, `Sequenza: ${g.steps.map((s) => getRole(s.roleId).emoji).join(' → ') || 'nessun ruolo notturno'}`)),
      h('button', {
        class: 'btn big primary',
        onclick: () => {
          audio.unlock();
          startAmbient();
          const first = g.steps[0];
          speakSequence(['Il villaggio si addormenta. Tutti chiudete gli occhi.', first && stepCall(first)], 3000);
          if (first) setTimeout(() => audio.play(getRole(first.roleId).night.sound), 3500);
          app.update((game) => { game.step = 0; });
        },
      }, '🌙 Il villaggio si addormenta'),
      quickSounds(),
    );
    return root;
  }

  const step = g.steps[g.step];
  if (!step) {
    add(root, gameHeader(`Notte ${g.night}`), dawnButton(app), quickSounds());
    return root;
  }

  const r = getRole(step.roleId);
  const holders = g.players.filter((p) => p.role === step.roleId);
  const a = g.actions;
  const set = (patch) => app.update((game) => Object.assign(game.actions, patch));

  const body = h('div', { class: 'step-body' });
  if (step.dead) {
    add(body, h('div', { class: 'notice' },
      '☠️ Questo ruolo è morto. Chiamalo lo stesso, aspetta qualche secondo e vai avanti: così nessuno capisce chi è uscito.'));
  } else {
    add(body, actionUI(app, step, r, alive, a, set));
  }

  const isLast = g.step === g.steps.length - 1;
  add(root,
    gameHeader(`Notte ${g.night}`, `Passo ${g.step + 1} di ${g.steps.length}`),
    h('div', { class: 'step-head' },
      h('div', { class: 'step-emoji' }, r.emoji),
      h('div', {},
        h('div', { class: 'step-role' }, r.plural && holders.length > 1 ? r.plural : r.name),
        h('div', { class: 'muted small' }, holders.map((p) => `${p.name}${p.alive ? '' : ' ☠️'}`).join(', ')))),
    h('div', { class: 'call' },
      h('span', {}, `“${stepCall(step)}”`),
      h('button', {
        class: 'btn small ghost',
        onclick: () => { speak(stepCall(step)); audio.play(r.night.sound); },
      }, '🔊 Ripeti')),
    body,
    h('div', { class: 'row step-nav' },
      h('button', {
        class: 'btn ghost',
        onclick: () => app.update((game) => { game.step--; }),
      }, '←'),
      h('button', {
        class: 'btn big primary grow',
        onclick: () => {
          const next = g.steps[g.step + 1];
          speakSequence([stepClose(step), next ? stepCall(next) : null], 2500);
          if (next) setTimeout(() => audio.play(getRole(next.roleId).night.sound), 3000);
          app.update((game) => { game.step++; });
        },
      }, isLast ? '😴 Chiudi gli occhi e vai all’alba' : '😴 Chiudi gli occhi · Avanti')),
    quickSounds(),
  );
  return root;
}

function actionUI(app, step, r, alive, a, set) {
  const g = app.game;
  const me = g.players.filter((p) => p.role === step.roleId && p.alive).map((p) => p.id);
  const box = h('div');
  const action = r.night.action;
  const byId = (id) => g.players.find((p) => p.id === id);

  switch (action) {
    case 'kill':
      add(box,
        h('div', { class: 'label' }, 'Chi sbranano i lupi?'),
        playerPicker(alive, {
          selected: a.wolves,
          blocked: (p) => (p.role === 'lupo' ? 'lupo' : null),
          onPick: (p) => set({ wolves: a.wolves === p.id ? null : p.id }),
        }));
      break;
    case 'visit':
      add(box,
        h('div', { class: 'label' }, 'Da chi passa la notte la puttana?'),
        playerPicker(alive, {
          selected: a.harlot,
          blocked: (p) => (me.includes(p.id) ? 'lei' : null),
          onPick: (p) => set({ harlot: a.harlot === p.id ? null : p.id }),
        }),
        h('div', { class: 'muted small' }, a.harlot == null ? 'Nessuna scelta: resta a casa sua.' : ''));
      break;
    case 'protect':
      add(box,
        h('div', { class: 'label' }, 'Chi protegge la guardia?'),
        playerPicker(alive, {
          selected: a.guard,
          blocked: (p) => (me.includes(p.id) ? 'sé stessa' : p.id === g.lastGuard ? 'ieri' : null),
          onPick: (p) => set({ guard: a.guard === p.id ? null : p.id }),
        }));
      break;
    case 'see': {
      add(box,
        h('div', { class: 'label' }, 'Chi scruta la veggente?'),
        playerPicker(alive, {
          selected: a.seer,
          blocked: (p) => (me.includes(p.id) ? 'lei' : null),
          onPick: (p) => set({ seer: a.seer === p.id ? null : p.id }),
        }));
      if (a.seer != null) {
        const t = byId(a.seer);
        const wolf = looksLikeWolf(t.role);
        add(box, h('div', { class: `verdict ${wolf ? 'bad' : 'good'}` },
          wolf ? `🐺 ${t.name} È UN LUPO` : `😇 ${t.name} NON è un lupo`,
          h('div', { class: 'small' }, wolf ? 'Fai pollice in giù 👎' : 'Fai pollice in su 👍')));
      }
      break;
    }
    case 'medium': {
      const t = g.lastLynched != null ? byId(g.lastLynched) : null;
      add(box, t
        ? h('div', { class: `verdict ${looksLikeWolf(t.role) ? 'bad' : 'good'}` },
          looksLikeWolf(t.role) ? `🐺 ${t.name} era un LUPO` : `😇 ${t.name} NON era un lupo`,
          h('div', { class: 'small' }, looksLikeWolf(t.role) ? 'Pollice in giù 👎' : 'Pollice in su 👍'))
        : h('div', { class: 'notice' }, 'Ieri nessuno è stato mandato al rogo: fai segno di no.'));
      break;
    }
    case 'witch': {
      const victim = a.wolves != null ? byId(a.wolves) : null;
      add(box,
        h('div', { class: 'notice' }, victim ? `🐺 I lupi hanno scelto: ${victim.name}${a.guard === victim.id ? ' (protetto dalla guardia)' : ''}` : 'I lupi non hanno scelto nessuno.'),
        g.witch.life && victim ? h('button', {
          class: `btn ${a.witchSave ? 'primary' : 'ghost'}`,
          onclick: () => set({ witchSave: !a.witchSave, witchKill: a.witchKill === victim.id ? null : a.witchKill }),
        }, a.witchSave ? `💚 Salva ${victim.name} ✓` : `💚 Usa la pozione di vita su ${victim.name}`) : null,
        !g.witch.life ? h('div', { class: 'muted small' }, 'Pozione di vita già usata.') : null,
        g.witch.death ? [
          h('div', { class: 'label' }, '☠️ Pozione di morte (opzionale)'),
          playerPicker(alive, {
            selected: a.witchKill,
            blocked: (p) => (me.includes(p.id) ? 'lei' : a.witchSave && p.id === a.wolves ? 'salvato' : null),
            onPick: (p) => set({ witchKill: a.witchKill === p.id ? null : p.id }),
          }),
        ] : h('div', { class: 'muted small' }, 'Pozione di morte già usata.'));
      break;
    }
    case 'lovers': {
      const sel = a.lovers || [];
      add(box,
        h('div', { class: 'label' }, `Scegli i due innamorati (${sel.length}/2)`),
        playerPicker(alive, {
          selected: sel,
          onPick: (p) => {
            let next = sel.includes(p.id) ? sel.filter((x) => x !== p.id) : [...sel, p.id];
            if (next.length > 2) next = next.slice(-2);
            set({ lovers: next });
          },
        }),
        sel.length === 2 ? h('div', { class: 'muted small' }, 'Tocca la spalla dei due innamorati: si sveglieranno e si guarderanno.') : null);
      break;
    }
    case 'masons':
      add(box, h('div', { class: 'notice' }, `I massoni si riconoscono: ${g.players.filter((p) => p.role === 'massone').map((p) => p.name).join(', ')}`));
      break;
    case 'owl':
      add(box,
        h('div', { class: 'label' }, 'Chi manda in ballottaggio il gufo?'),
        playerPicker(alive, {
          selected: a.owl,
          onPick: (p) => set({ owl: a.owl === p.id ? null : p.id }),
        }));
      break;
    case 'copy': {
      add(box,
        h('div', { class: 'label' }, 'Chi vuole imitare il mitomane?'),
        playerPicker(alive, {
          selected: a.copy,
          blocked: (p) => (me.includes(p.id) ? 'lui' : null),
          onPick: (p) => set({ copy: a.copy === p.id ? null : p.id }),
        }));
      if (a.copy != null) {
        const nr = getRole(mythomaniacRole(byId(a.copy).role));
        add(box, h('div', { class: 'notice' }, `All’alba diventerà: ${nr.emoji} ${nr.name}. Faglielo capire con un gesto.`));
      }
      break;
    }
    case 'custom':
      if (r.night.target) {
        const key = `custom_${r.id}`;
        add(box,
          h('div', { class: 'label' }, `Chi sceglie ${r.name}?`),
          playerPicker(alive, {
            selected: a[key],
            onPick: (p) => set({ [key]: a[key] === p.id ? null : p.id }),
          }));
      } else {
        add(box, h('div', { class: 'notice' }, r.desc || 'Nessuna azione da registrare.'));
      }
      break;
    default:
      break;
  }
  return box;
}

function dawnButton(app) {
  return h('div', { class: 'hero' },
    h('div', { class: 'hero-emoji' }, '🌅'),
    h('p', {}, 'La notte è finita.'),
    h('button', { class: 'btn big primary', onclick: () => finishNight(app) }, '☀️ Il villaggio si sveglia'));
}

// Risolve le azioni della notte e passa all'alba.
export function finishNight(app) {
  const g = app.game;
  const a = g.actions;
  const name = (id) => g.players.find((p) => p.id === id)?.name;
  const lines = [];

  if (a.copy != null) {
    const mito = g.players.find((p) => p.role === 'mitomane' && p.alive);
    const target = g.players.find((p) => p.id === a.copy);
    if (mito && target) {
      mito.role = mythomaniacRole(target.role);
      lines.push(`🎭 ${mito.name} (mitomane) ha imitato ${target.name} ed è diventato ${getRole(mito.role).name}`);
    }
  }
  if (a.lovers?.length === 2) {
    const [x, y] = a.lovers;
    g.players.find((p) => p.id === x).lover = y;
    g.players.find((p) => p.id === y).lover = x;
    lines.push(`💘 Innamorati: ${name(x)} e ${name(y)}`);
  }
  if (a.harlot != null) lines.push(`💋 La puttana è andata da ${name(a.harlot)}`);
  if (a.guard != null) lines.push(`🛡️ La guardia ha protetto ${name(a.guard)}`);
  if (a.wolves != null) lines.push(`🐺 I lupi hanno attaccato ${name(a.wolves)}`);
  if (a.seer != null) lines.push(`🔮 La veggente ha scrutato ${name(a.seer)}`);
  if (a.witchSave) lines.push('🧪 La strega ha usato la pozione di vita');
  if (a.witchKill != null) lines.push(`🧪 La strega ha avvelenato ${name(a.witchKill)}`);
  if (a.owl != null) lines.push(`🦉 Il gufo ha indicato ${name(a.owl)}`);

  const { deaths, notes } = resolveNight(g.players, a);
  const res = applyDeaths(g.players, deaths);

  if (a.witchSave) g.witch.life = false;
  if (a.witchKill != null) g.witch.death = false;
  g.lastGuard = a.guard ?? null;
  g.owlMark = a.owl ?? null;
  g.day = g.night;
  g.dawn = { deaths: res.deaths, notes };
  g.pendingHunters = res.hunters;
  g.phase = 'dawn';
  g.winner = res.hunters.length ? null : checkWin(g.players);

  lines.push(...notes.map((n) => `ℹ️ ${n}`));
  lines.push(...res.deaths.map((d) => `☠️ ${name(d.id)} — ${d.cause}`));
  if (!res.deaths.length) lines.push('Nessun morto');
  app.log(`Notte ${g.night}`, lines);

  audio.stopAll();
  setTimeout(() => audio.play('dawn'), 150);
  app.save();
  app.render();
}

// Barra dei suoni rapidi durante la notte.
function quickSounds() {
  const bar = h('div', { class: 'quick-sounds' });
  const draw = () => {
    fill(bar,
      ...['howl', 'owl', 'door', 'scream', 'heartbeat'].map((id) => {
        if (id === 'heartbeat') {
          return h('button', {
            class: `qs ${audio.isLooping('heart') ? 'on' : ''}`,
            onclick: () => { audio.toggleLoop('heart'); draw(); },
          }, '💓');
        }
        const s = audio.SOUNDS.find((x) => x.id === id);
        return h('button', { class: 'qs', onclick: () => audio.play(id) }, s.emoji);
      }),
      h('button', {
        class: `qs ${audio.isLooping(settings().ambient) ? 'on' : ''}`,
        onclick: () => { const a = settings().ambient; if (a && a !== 'none') audio.toggleLoop(a); draw(); },
      }, audio.LOOPS.find((l) => l.id === settings().ambient)?.emoji || '🦗'),
      h('button', { class: 'qs', onclick: () => { audio.stopAll(); draw(); } }, '⏹'),
    );
  };
  draw();
  return bar;
}
