import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNight, applyDeaths, checkWin, buildNightSteps, assignRoles, mythomaniacRole } from '../js/rules.js';
import { suggestComposition } from '../js/roles.js';

const make = (roles) => roles.map((role, id) => ({ id, name: `P${id}`, role, alive: true, lover: null }));
const ids = (r) => r.deaths.map((d) => d.id).sort();

test('i lupi uccidono la vittima', () => {
  const ps = make(['lupo', 'contadino', 'veggente']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1 })), [1]);
});

test('la puttana (che dorme con qualcuno) salva la vittima', () => {
  const ps = make(['lupo', 'contadino', 'puttana']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1, protect: 1 })), []);
});

test('cortigiana fuori casa sopravvive se attaccata', () => {
  const ps = make(['lupo', 'cortigiana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1, visit: 2 })), []);
});

test('cortigiana a casa sua (nessuna visita) muore se attaccata', () => {
  const ps = make(['lupo', 'cortigiana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1, visit: null })), [1]);
});

test('cortigiana muore con la vittima dei lupi', () => {
  const ps = make(['lupo', 'cortigiana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, visit: 2 })), [1, 2]);
});

test('cortigiana salva se la puttana protegge la persona visitata', () => {
  const ps = make(['lupo', 'cortigiana', 'contadino', 'puttana']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, visit: 2, protect: 2 })), []);
});

test('cortigiana muore se va da un lupo', () => {
  const ps = make(['lupo', 'cortigiana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, visit: 0 })), [1, 2]);
});

test('criceto immune ai lupi, muore se scrutato', () => {
  const ps = make(['lupo', 'criceto', 'veggente']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1 })), []);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, seer: 1 })), [1, 2]);
});

test('strega: pozione di vita e di morte', () => {
  const ps = make(['lupo', 'contadino', 'strega', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1, witchSave: true, witchKill: 3 })), [3]);
});

test('amanti muoiono insieme, cacciatore segnalato', () => {
  const ps = make(['lupo', 'contadino', 'cacciatore', 'contadino']);
  ps[1].lover = 2; ps[2].lover = 1;
  const r = applyDeaths(ps, [{ id: 1, cause: 'x' }]);
  assert.deepEqual(r.deaths.map((d) => d.id), [1, 2]);
  assert.deepEqual(r.hunters, [2]);
  assert.equal(ps[2].alive, false);
});

test('condizioni di vittoria', () => {
  const ps = make(['lupo', 'contadino', 'contadino']);
  assert.equal(checkWin(ps), null);
  ps[1].alive = false;
  assert.equal(checkWin(ps), 'lupi');
  const vs = make(['lupo', 'contadino', 'criceto']);
  vs[0].alive = false;
  assert.equal(checkWin(vs), 'criceto');
});

test('sequenza notturna ordinata e prima notte', () => {
  const ps = make(['lupo', 'veggente', 'cortigiana', 'cupido', 'medium']);
  const n1 = buildNightSteps(ps, 1).map((s) => s.roleId);
  assert.deepEqual(n1, ['cupido', 'cortigiana', 'lupo', 'veggente']);
  ps[1].alive = false;
  const n2 = buildNightSteps(ps, 2, false).map((s) => s.roleId);
  assert.deepEqual(n2, ['cortigiana', 'lupo', 'medium']);
  const n2b = buildNightSteps(ps, 2, true);
  assert.equal(n2b.find((s) => s.roleId === 'veggente').dead, true);
});

test('composizione consigliata somma ai giocatori', () => {
  for (let n = 4; n <= 24; n++) {
    const c = suggestComposition(n);
    assert.equal(Object.values(c).reduce((a, b) => a + b, 0), n);
    assert.ok(c.contadino >= 0);
  }
  const ps = assignRoles(['a', 'b', 'c', 'd'], { lupo: 1, contadino: 3 });
  assert.equal(ps.filter((p) => p.role === 'lupo').length, 1);
  assert.equal(mythomaniacRole('lupo'), 'lupo');
  assert.equal(mythomaniacRole('puttana'), 'contadino');
});

test('prete: si lancia su un lupo, il lupo muore e lui si salva', () => {
  const ps = make(['lupo', 'prete', 'contadino']);
  const r = resolveNight(ps, { priest: 0 });
  assert.deepEqual(ids(r), [0]);
  assert.equal(r.deaths[0].cause, 'Placcato dal prete P1');
});

test('prete: si lancia su un non-lupo e muore lui', () => {
  const ps = make(['lupo', 'prete', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { priest: 2 })), [1]);
});

test('prete: senza lancio non succede niente', () => {
  const ps = make(['lupo', 'prete', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { priest: null })), []);
});

test('prete: placca un lupo mentre i lupi attaccano un altro, muoiono entrambi', () => {
  const ps = make(['lupo', 'lupo', 'prete', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 3, priest: 0 })), [0, 3]);
});

test('prete: la puttana salva la vittima dei lupi ma il lancio sul lupo resta valido', () => {
  const ps = make(['lupo', 'prete', 'puttana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 3, protect: 3, priest: 0 })), [0]);
});

test('il prete si sveglia ogni notte nella sequenza, dopo i lupi e prima della veggente', () => {
  const ps = make(['lupo', 'veggente', 'puttana', 'prete', 'scemo', 'contadino']);
  assert.deepEqual(buildNightSteps(ps, 2).map((st) => st.roleId), ['puttana', 'lupo', 'prete', 'veggente']);
});

test('il vostro gioco: composizione consigliata solo con lupi, veggente, puttana, prete, folle', () => {
  const allowed = new Set(['lupo', 'veggente', 'puttana', 'prete', 'scemo', 'contadino']);
  for (let n = 4; n <= 24; n++) for (const id of Object.keys(suggestComposition(n))) assert.ok(allowed.has(id), `${id} a ${n}`);
  assert.deepEqual(suggestComposition(8), { lupo: 2, veggente: 1, puttana: 1, prete: 1, scemo: 1, contadino: 2 });
});

test('la puttana non ha più vincoli: può proteggere chiunque, anche due notti di fila', () => {
  const ps = make(['lupo', 'puttana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, protect: 2 })), []);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, protect: 2 })), []);
});

test('playlist: ogni voce ha un titolo e link ben formati', async () => {
  const { GROUPS, linksOf } = await import('../js/playlist.js');
  const ids = new Set();
  for (const g of GROUPS) {
    for (const sec of g.sections) {
      assert.ok(!ids.has(sec.id), `id duplicato ${sec.id}`);
      ids.add(sec.id);
      assert.ok(sec.songs.length > 0);
      for (const song of sec.songs) {
        assert.ok(song.title, 'titolo mancante');
        assert.ok(song.fx || song.direct || song.artist, `autore mancante: ${song.title}`);
        const links = linksOf(song);
        assert.ok(links.length >= 1);
        for (const l of links) assert.match(l.url, /^https:\/\/(www\.youtube\.com|open\.spotify\.com)\/[^\s]+$/);
        assert.ok(links.every((l) => !/[()]/.test(l.url) || song.direct), `parentesi nel link: ${song.title}`);
      }
    }
  }
  // Il tuo pezzo parte dal minuto 3:40 (220 secondi).
  const clip = GROUPS[0].sections.find((x) => x.id === 'death').songs.find((x) => x.direct);
  assert.match(clip.url, /watch\?v=J1gH_cjdb60&t=220s$/);
  const { ROLES } = await import('../js/roles.js');
  const covered = new Set(GROUPS.filter((g) => g.id === 'roles' || g.id === 'others').flatMap((g) => g.sections.map((x) => x.id)));
  for (const r of ROLES) assert.ok(covered.has(r.id), `ruolo senza canzoni: ${r.id}`);
});
