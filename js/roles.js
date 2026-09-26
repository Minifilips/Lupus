// Definizione dei personaggi.
// team: 'villaggio' | 'lupi' | 'criceto' | 'neutro'
// night: null se il ruolo non si sveglia, altrimenti
//   { order, when: 'first' | 'every' | 'notFirst', action, sound }
// action: 'kill' | 'protect' | 'visit' | 'see' | 'medium' | 'witch'
//         | 'lovers' | 'masons' | 'owl' | 'copy' | 'custom' | 'none'

export const ROLES = [
  {
    id: 'lupo', name: 'Lupo', plural: 'Lupi', emoji: '🐺', team: 'lupi',
    desc: 'Ogni notte i lupi si svegliano insieme e scelgono una vittima da sbranare. Di giorno fingono di essere innocui contadini.',
    night: { order: 50, when: 'every', action: 'kill', sound: 'howl' },
    call: 'Lupi, aprite gli occhi. Scegliete la vostra vittima.',
    close: 'Lupi, chiudete gli occhi.',
  },
  {
    id: 'contadino', name: 'Contadino', plural: 'Contadini', emoji: '🧑‍🌾', team: 'villaggio',
    desc: 'Nessun potere speciale. Di giorno discute e vota per scovare i lupi.',
    night: null,
  },
  {
    id: 'veggente', name: 'Veggente', emoji: '🔮', team: 'villaggio',
    desc: 'Ogni notte indica un giocatore e il narratore le rivela se è un lupo oppure no. Se scruta il criceto mannaro, il criceto muore.',
    night: { order: 60, when: 'every', action: 'see', sound: 'magic' },
    call: 'Veggente, apri gli occhi. Indica chi vuoi scrutare.',
    close: 'Veggente, chiudi gli occhi.',
  },
  {
    id: 'puttana', name: 'Puttana', emoji: '💋', team: 'villaggio',
    desc: 'Ogni notte va a casa di qualcuno. Se i lupi attaccano lei, non è in casa e si salva. Se va dalla vittima dei lupi muore con lei, e muore anche se va a casa di un lupo.',
    night: { order: 20, when: 'every', action: 'visit', sound: 'door' },
    call: 'Puttana, apri gli occhi. Indica da chi vuoi passare la notte.',
    close: 'Puttana, chiudi gli occhi.',
  },
  {
    id: 'guardia', name: 'Guardia', emoji: '🛡️', team: 'villaggio',
    desc: 'Ogni notte protegge un giocatore dall’attacco dei lupi. Non può proteggere sé stessa né la stessa persona due notti di fila.',
    night: { order: 30, when: 'every', action: 'protect', sound: 'shield' },
    call: 'Guardia, apri gli occhi. Indica chi vuoi proteggere.',
    close: 'Guardia, chiudi gli occhi.',
  },
  {
    id: 'medium', name: 'Medium', emoji: '🕯️', team: 'villaggio',
    desc: 'Ogni notte (dalla seconda) il narratore le dice se l’ultimo giocatore eliminato al rogo era un lupo.',
    night: { order: 65, when: 'notFirst', action: 'medium', sound: 'ghost' },
    call: 'Medium, apri gli occhi.',
    close: 'Medium, chiudi gli occhi.',
  },
  {
    id: 'strega', name: 'Strega', emoji: '🧪', team: 'villaggio',
    desc: 'Ha due pozioni da usare una volta sola: una di vita per salvare la vittima dei lupi, una di morte per uccidere chi vuole.',
    night: { order: 70, when: 'every', action: 'witch', sound: 'magic' },
    call: 'Strega, apri gli occhi. Questa è la vittima dei lupi. Vuoi usare una pozione?',
    close: 'Strega, chiudi gli occhi.',
  },
  {
    id: 'cacciatore', name: 'Cacciatore', emoji: '🏹', team: 'villaggio',
    desc: 'Quando muore, di notte o di giorno, spara subito a un giocatore e lo porta con sé.',
    night: null,
  },
  {
    id: 'cupido', name: 'Cupido', emoji: '💘', team: 'villaggio',
    desc: 'La prima notte fa innamorare due giocatori. Se uno degli amanti muore, l’altro muore di dolore.',
    night: { order: 5, when: 'first', action: 'lovers', sound: 'love' },
    call: 'Cupido, apri gli occhi. Indica i due innamorati.',
    close: 'Cupido, chiudi gli occhi.',
  },
  {
    id: 'massone', name: 'Massone', plural: 'Massoni', emoji: '🤝', team: 'villaggio',
    desc: 'La prima notte i massoni si svegliano e si riconoscono: sanno per certo di potersi fidare l’uno dell’altro.',
    night: { order: 10, when: 'first', action: 'masons', sound: 'bell' },
    call: 'Massoni, aprite gli occhi e riconoscetevi.',
    close: 'Massoni, chiudete gli occhi.',
  },
  {
    id: 'gufo', name: 'Gufo', emoji: '🦉', team: 'lupi',
    desc: 'Tifa per i lupi. Ogni notte indica un giocatore che il giorno dopo finisce automaticamente in ballottaggio.',
    night: { order: 75, when: 'every', action: 'owl', sound: 'owl' },
    call: 'Gufo, apri gli occhi. Indica chi mandare in ballottaggio.',
    close: 'Gufo, chiudi gli occhi.',
  },
  {
    id: 'criceto', name: 'Criceto mannaro', emoji: '🐹', team: 'criceto',
    desc: 'Gioca da solo. I lupi non possono ucciderlo, ma muore se la veggente lo scruta. Vince se è ancora vivo quando la partita finisce.',
    night: null,
  },
  {
    id: 'indemoniato', name: 'Indemoniato', emoji: '😈', team: 'lupi',
    desc: 'È umano, e per la veggente non risulta lupo, ma vince con i lupi. Non sa chi sono.',
    night: null,
  },
  {
    id: 'mitomane', name: 'Mitomane', emoji: '🎭', team: 'villaggio',
    desc: 'La prima notte indica un giocatore: se è un lupo diventa lupo, se è la veggente diventa veggente, altrimenti resta un semplice contadino.',
    night: { order: 8, when: 'first', action: 'copy', sound: 'magic' },
    call: 'Mitomane, apri gli occhi. Indica chi vuoi imitare.',
    close: 'Mitomane, chiudi gli occhi.',
  },
  {
    id: 'bambina', name: 'Bambina', emoji: '👧', team: 'villaggio',
    desc: 'Mentre i lupi sono svegli può sbirciare di nascosto. Se la beccano, però, i lupi la notano…',
    night: null,
  },
  {
    id: 'scemo', name: 'Scemo del villaggio', emoji: '🤪', team: 'neutro',
    desc: 'Gioca da solo e vince se riesce a farsi mandare al rogo dal villaggio.',
    night: null,
  },
  {
    id: 'sindaco', name: 'Sindaco', emoji: '🎩', team: 'villaggio',
    desc: 'Il suo voto al rogo vale doppio. In caso di pareggio decide lui.',
    night: null,
  },
];

export const TEAMS = {
  villaggio: { name: 'Villaggio', color: '#4caf50' },
  lupi: { name: 'Lupi', color: '#e53935' },
  criceto: { name: 'Criceto', color: '#ffb300' },
  neutro: { name: 'Solitario', color: '#ab47bc' },
};

let customRoles = [];

export function setCustomRoles(list) {
  customRoles = (list || []).map((r) => ({
    ...r,
    custom: true,
    night: r.wakes ? { order: Number(r.order) || 80, when: r.when || 'every', action: 'custom', sound: 'magic', target: !!r.needsTarget } : null,
    call: `${r.name}, apri gli occhi.`,
    close: `${r.name}, chiudi gli occhi.`,
  }));
}

export function allRoles() {
  return [...ROLES, ...customRoles];
}

export function getRole(id) {
  return allRoles().find((r) => r.id === id) || ROLES[1];
}

// Un giocatore "sembra lupo" alla veggente?
export function looksLikeWolf(roleId) {
  return roleId === 'lupo';
}

// Composizione consigliata per N giocatori.
export function suggestComposition(n) {
  const c = {};
  if (n < 4) return { lupo: 1, contadino: Math.max(0, n - 1) };
  c.lupo = n < 8 ? 1 : Math.floor(n / 4);
  if (n >= 5) c.veggente = 1;
  if (n >= 7) c.guardia = 1;
  if (n >= 8) c.puttana = 1;
  if (n >= 9) c.medium = 1;
  if (n >= 10) c.cacciatore = 1;
  if (n >= 11) c.indemoniato = 1;
  if (n >= 12) c.massone = 2;
  if (n >= 13) c.criceto = 1;
  if (n >= 15) c.gufo = 1;
  const used = Object.values(c).reduce((a, b) => a + b, 0);
  c.contadino = n - used;
  return c;
}
