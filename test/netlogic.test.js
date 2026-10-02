import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCode, normalizeCode, peerId, uniqueName, stateFor, rosterProblems } from '../js/netlogic.js';

const players = [
  { id: 0, name: 'Anna', role: 'lupo', alive: true },
  { id: 1, name: 'Bruno', role: 'veggente', alive: true },
  { id: 2, name: 'Carla', role: 'contadino', alive: false },
];

test('il codice lobby ha 4 lettere senza I e O', () => {
  for (let i = 0; i < 200; i++) assert.match(makeCode(), /^[A-HJ-NP-Z]{4}$/);
});

test('normalizeCode e peerId', () => {
  assert.equal(normalizeCode(' ab-cd9e '), 'ABCD');
  assert.equal(peerId('abcd'), 'lupus-ABCD');
});

test('nomi duplicati ricevono un numero', () => {
  assert.equal(uniqueName('Anna', ['Anna']), 'Anna 2');
  assert.equal(uniqueName('Anna', ['Anna', 'Anna 2']), 'Anna 3');
  assert.equal(uniqueName('  ', []), 'Giocatore');
});

test('in lobby nessun ruolo viaggia sulla rete', () => {
  const st = stateFor(players[0], { phase: 'setup' });
  assert.equal(st.phase, 'lobby');
  assert.equal(st.role, undefined);
});

test('ogni telefono vede solo il proprio ruolo', () => {
  const st = stateFor(players[1], { phase: 'night' });
  assert.equal(st.role.id, 'veggente');
  const json = JSON.stringify(st);
  assert.ok(!json.includes('Anna') && !json.includes('Carla') && !json.includes('"contadino"'));
});

test('alba e giorno sono la stessa fase per i cittadini', () => {
  assert.equal(stateFor(players[0], { phase: 'dawn' }).phase, 'day');
  assert.equal(stateFor(players[0], { phase: 'day' }).phase, 'day');
});

test('il morto vede il ruolo solo se revealDead è attivo', () => {
  assert.equal(stateFor(players[2], { phase: 'day' }, { revealDead: true }).role.id, 'contadino');
  const hidden = stateFor(players[2], { phase: 'day' }, { revealDead: false });
  assert.equal(hidden.alive, false);
  assert.equal(hidden.role, undefined);
});

test('a fine partita arriva il vincitore e il proprio ruolo', () => {
  const st = stateFor(players[2], { phase: 'over', winner: 'lupi' }, { revealDead: false });
  assert.equal(st.winner.title, 'Vincono i lupi!');
  assert.equal(st.role.id, 'contadino');
});

test('giocatore sconosciuto: resta in lobby', () => {
  assert.equal(stateFor(undefined, { phase: 'night' }).phase, 'lobby');
});

test('rosterProblems', () => {
  assert.deepEqual(rosterProblems(['lupo', 'contadino', 'contadino', 'veggente']), []);
  assert.ok(rosterProblems(['contadino', 'contadino', 'contadino', 'veggente']).some((p) => p.includes('lupo')));
  assert.ok(rosterProblems(['lupo', 'lupo', 'contadino', 'veggente']).some((p) => p.includes('Troppi')));
  assert.ok(rosterProblems(['lupo', null, 'contadino', 'veggente']).some((p) => p.includes('Manca')));
  assert.ok(rosterProblems(['lupo', 'contadino']).some((p) => p.includes('almeno 4')));
});
