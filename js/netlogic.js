// Logica pura del gioco in rete (testabile senza browser): codici lobby, cosa vede ogni telefono,
// controlli sull'assegnazione dei ruoli.
import { getRole, TEAMS } from './roles.js';
import { WIN_TEXT } from './rules.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // niente I e O: si confondono con 1 e 0

export function makeCode(rand = Math.random) {
  let c = '';
  for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
  return c;
}

export const normalizeCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

export const peerId = (code) => `lupus-${normalizeCode(code)}`;

// Nome unico tra quelli già presi ("Anna", "Anna 2", …).
export function uniqueName(name, taken) {
  const base = String(name || '').trim().slice(0, 20) || 'Giocatore';
  let n = base;
  let i = 2;
  while (taken.includes(n)) n = `${base} ${i++}`;
  return n;
}

const PHASES = { setup: 'lobby', reveal: 'reveal', night: 'night', dawn: 'day', day: 'day', over: 'over' };

function roleCard(roleId) {
  const r = getRole(roleId);
  const t = TEAMS[r.team];
  return { id: r.id, name: r.name, emoji: r.emoji, desc: r.desc, team: t?.name || '', teamColor: t?.color || '#888' };
}

// Cosa può vedere il telefono di UN giocatore. Mai il ruolo degli altri.
export function stateFor(player, game, { revealDead = true } = {}) {
  const phase = PHASES[game.phase] || 'lobby';
  if (!player || phase === 'lobby') return { phase: 'lobby', name: player?.name };
  const st = { phase, name: player.name, alive: player.alive };
  if (phase === 'over') {
    const w = WIN_TEXT[game.winner];
    st.winner = w ? { emoji: w.emoji, title: w.title, text: w.text } : null;
    st.role = roleCard(player.role);
    return st;
  }
  if (!player.alive && !revealDead) return st;
  st.role = roleCard(player.role);
  return st;
}

// Problemi dell'assegnazione dei ruoli (a mano o casuale). Elenco vuoto = tutto a posto.
export function rosterProblems(roles) {
  const n = roles.length;
  const out = [];
  if (n < 4) out.push('Servono almeno 4 giocatori.');
  if (roles.some((r) => !r)) out.push('Manca il ruolo a qualcuno.');
  const wolves = roles.filter((r) => r === 'lupo').length;
  if (!wolves) out.push('Serve almeno un lupo.');
  if (wolves && n >= 4 && wolves * 2 >= n) out.push('Troppi lupi: vincerebbero subito.');
  return out;
}
