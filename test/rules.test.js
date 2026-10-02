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

test('la guardia salva la vittima', () => {
  const ps = make(['lupo', 'contadino', 'guardia']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1, guard: 1 })), []);
});

test('puttana fuori casa sopravvive se attaccata', () => {
  const ps = make(['lupo', 'puttana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1, harlot: 2 })), []);
});

test('puttana a casa sua (nessuna visita) muore se attaccata', () => {
  const ps = make(['lupo', 'puttana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 1, harlot: null })), [1]);
});

test('puttana muore con la vittima dei lupi', () => {
  const ps = make(['lupo', 'puttana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, harlot: 2 })), [1, 2]);
});

test('puttana salva se la guardia protegge la persona visitata', () => {
  const ps = make(['lupo', 'puttana', 'contadino', 'guardia']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, harlot: 2, guard: 2 })), []);
});

test('puttana muore se va da un lupo', () => {
  const ps = make(['lupo', 'puttana', 'contadino']);
  assert.deepEqual(ids(resolveNight(ps, { wolves: 2, harlot: 0 })), [1, 2]);
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
  const ps = make(['lupo', 'veggente', 'puttana', 'cupido', 'medium']);
  const n1 = buildNightSteps(ps, 1).map((s) => s.roleId);
  assert.deepEqual(n1, ['cupido', 'puttana', 'lupo', 'veggente']);
  ps[1].alive = false;
  const n2 = buildNightSteps(ps, 2, false).map((s) => s.roleId);
  assert.deepEqual(n2, ['puttana', 'lupo', 'medium']);
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
  assert.equal(mythomaniacRole('guardia'), 'contadino');
});

test('playlist: ogni voce ha un titolo e link di ricerca ben formati', async () => {
  const { GROUPS, queryOf, ytUrl, spotifyUrl } = await import('../js/playlist.js');
  const ids = new Set();
  for (const g of GROUPS) {
    for (const sec of g.sections) {
      assert.ok(!ids.has(sec.id), `id duplicato ${sec.id}`);
      ids.add(sec.id);
      assert.ok(sec.songs.length > 0);
      for (const song of sec.songs) {
        assert.ok(song.title, 'titolo mancante');
        assert.ok(song.fx ? song.query : song.artist, `autore/query mancante: ${song.title}`);
        const q = queryOf(song);
        assert.match(ytUrl(q), /^https:\/\/www\.youtube\.com\/results\?search_query=[^\s&]+$/);
        assert.match(spotifyUrl(q), /^https:\/\/open\.spotify\.com\/search\/[^\s/]+$/);
      }
    }
  }
  const { ROLES } = await import('../js/roles.js');
  const covered = new Set(GROUPS.find((g) => g.id === 'roles').sections.map((x) => x.id));
  for (const r of ROLES) assert.ok(covered.has(r.id), `ruolo senza canzoni: ${r.id}`);
});
