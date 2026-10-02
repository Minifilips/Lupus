// Logica di gioco pura (niente DOM): testabile con node.
import { allRoles, getRole } from './roles.js';

const find = (players, id) => players.find((p) => p.id === id);

// Costruisce la sequenza della notte in base ai ruoli in partita.
// Con `bluff` vengono chiamati anche i ruoli morti, così nessuno capisce chi è uscito.
export function buildNightSteps(players, nightNum, bluff = true) {
  const steps = [];
  for (const role of allRoles()) {
    if (!role.night) continue;
    const { when } = role.night;
    if (when === 'first' && nightNum !== 1) continue;
    if (when === 'notFirst' && nightNum === 1) continue;
    const holders = players.filter((p) => p.role === role.id);
    if (!holders.length) continue;
    const alive = holders.filter((p) => p.alive);
    if (!alive.length && !bluff) continue;
    steps.push({ roleId: role.id, order: role.night.order, dead: !alive.length });
  }
  steps.sort((a, b) => a.order - b.order);
  return steps;
}

// Calcola chi muore all'alba dalle azioni notturne. Non modifica i giocatori.
// a = { wolves, protect, visit, seer, witchSave, witchKill, priest }
//   protect: chi salva la puttana dormendo da lui; visit: dove va la cortigiana
export function resolveNight(players, a) {
  const deaths = [];
  const notes = [];
  const alive = (id) => !!find(players, id)?.alive;
  const add = (id, cause) => {
    if (id != null && alive(id) && !deaths.some((d) => d.id === id)) deaths.push({ id, cause });
  };

  const courtesan = players.find((p) => p.alive && p.role === 'cortigiana');
  const courtesanAway = !!courtesan && a.visit != null && a.visit !== courtesan.id;

  const v = a.wolves;
  let victimKilled = false;
  if (v != null && alive(v)) {
    const vp = find(players, v);
    if (a.protect === v) notes.push(`La puttana ha salvato ${vp.name}.`);
    else if (vp.role === 'criceto') notes.push(`${vp.name} è il criceto mannaro: i lupi non possono ucciderlo.`);
    else if (courtesan && v === courtesan.id && courtesanAway) notes.push(`${vp.name} (cortigiana) non era in casa: si salva.`);
    else if (a.witchSave) notes.push(`La strega ha salvato ${vp.name}.`);
    else { add(v, 'Sbranato dai lupi'); victimKilled = true; }
  }

  if (courtesanAway) {
    const host = find(players, a.visit);
    if (victimKilled && a.visit === v) add(courtesan.id, `Era a casa di ${host.name}, la vittima dei lupi`);
    else if (host && host.role === 'lupo') add(courtesan.id, `È andata a casa di un lupo (${host.name})`);
  }

  if (a.seer != null) {
    const s = find(players, a.seer);
    if (s && s.role === 'criceto') add(s.id, 'Scrutato dalla veggente');
  }

  if (a.witchKill != null) add(a.witchKill, 'Avvelenato dalla strega');

  // Il prete si lancia (una sola volta): su un lupo lo uccide, su chiunque altro muore lui.
  if (a.priest != null) {
    const priest = players.find((p) => p.alive && p.role === 'prete');
    const target = find(players, a.priest);
    if (priest && target?.alive) {
      if (target.role === 'lupo') {
        add(target.id, `Placcato dal prete ${priest.name}`);
        notes.push(`${priest.name} (prete) si è lanciato su ${target.name}: era un lupo!`);
      } else {
        add(priest.id, `Si è lanciato su ${target.name}, che non era un lupo`);
      }
    }
  }

  return { deaths, notes };
}

// Applica le morti (con effetto a catena degli innamorati). Modifica i giocatori.
// Restituisce tutte le morti effettive e i cacciatori che devono sparare.
export function applyDeaths(players, deaths) {
  const all = [];
  const queue = [...deaths];
  while (queue.length) {
    const d = queue.shift();
    const p = find(players, d.id);
    if (!p || !p.alive) continue;
    p.alive = false;
    all.push(d);
    if (p.lover != null) {
      const partner = find(players, p.lover);
      if (partner?.alive) queue.push({ id: partner.id, cause: `Morto di dolore per ${p.name}` });
    }
  }
  const hunters = all.filter((d) => find(players, d.id).role === 'cacciatore').map((d) => d.id);
  return { deaths: all, hunters };
}

// Mitomane: la prima notte copia il ruolo del bersaglio.
export function mythomaniacRole(targetRole) {
  if (targetRole === 'lupo') return 'lupo';
  if (targetRole === 'veggente') return 'veggente';
  return 'contadino';
}

// Controlla se qualcuno ha vinto. Restituisce null se la partita continua.
export function checkWin(players) {
  const alive = players.filter((p) => p.alive);
  if (!alive.length) return 'nessuno';
  const wolves = alive.filter((p) => p.role === 'lupo').length;
  const others = alive.length - wolves;
  if (alive.length === 2 && alive.every((p) => p.lover != null) && alive[0].lover === alive[1].id) {
    const teams = new Set(alive.map((p) => getRole(p.role).team));
    if (teams.size > 1) return 'amanti';
  }
  let winner = null;
  if (wolves === 0) winner = 'villaggio';
  else if (wolves >= others) winner = 'lupi';
  if (winner && alive.some((p) => p.role === 'criceto')) winner = 'criceto';
  return winner;
}

export const WIN_TEXT = {
  villaggio: { emoji: '🏡', title: 'Vince il villaggio!', text: 'Tutti i lupi sono stati eliminati.' },
  lupi: { emoji: '🐺', title: 'Vincono i lupi!', text: 'I lupi sono tanti quanti gli abitanti rimasti.' },
  criceto: { emoji: '🐹', title: 'Vince il criceto mannaro!', text: 'La partita è finita e il criceto è ancora vivo.' },
  scemo: { emoji: '🤪', title: 'Vince lo scemo del villaggio!', text: 'Il villaggio lo ha mandato al rogo… proprio quello che voleva.' },
  amanti: { emoji: '💘', title: 'Vincono gli amanti!', text: 'Sono rimasti solo loro due.' },
  nessuno: { emoji: '💀', title: 'Nessun sopravvissuto', text: 'Il villaggio è deserto.' },
};

// Mescola (Fisher–Yates).
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Assegna i ruoli: composition = { roleId: count }
export function assignRoles(names, composition) {
  const deck = [];
  for (const [id, n] of Object.entries(composition)) for (let i = 0; i < n; i++) deck.push(id);
  const roles = shuffle(deck);
  return names.map((name, i) => ({ id: i, name, role: roles[i], alive: true, lover: null }));
}
