// Playlist consigliata per ogni momento della partita e per ogni ruolo.
// Sono link di ricerca (YouTube / Spotify): il primo risultato è quasi sempre il brano giusto.
// chosen: scelta già fatta · fun: scelta comica.

// encodeURIComponent lascia passare le parentesi, che rompono i link nei file Markdown.
const enc = (q) => encodeURIComponent(q).replace(/\(/g, '%28').replace(/\)/g, '%29');

export const ytUrl = (q) => `https://www.youtube.com/results?search_query=${enc(q)}`;
export const spotifyUrl = (q) => `https://open.spotify.com/search/${enc(q)}`;

const s = (title, artist, opts = {}) => ({ title, artist, ...opts });
// Effetto sonoro: solo YouTube, la query è in inglese per trovare più risultati.
const fx = (title, query) => ({ title, query, fx: true });
// Link diretto a un video (con eventuale nota sul punto da usare).
const direct = (title, url, note, opts = {}) => ({ title, url, note, direct: true, ...opts });

export const MOMENTS = [
  { id: 'sleep', emoji: '🌙', title: 'Il villaggio si addormenta', songs: [
    s('Brahms’ Lullaby', 'Brahms', { chosen: true }),
  ] },
  { id: 'night', emoji: '🌌', title: 'Notte (sottofondo): tre nuove idee', songs: [
    s('Laura Palmer’s Theme (Twin Peaks)', 'Angelo Badalamenti'),
    s('Helvegen', 'Wardruna'),
    s('Profondo Rosso', 'Goblin'),
  ] },
  { id: 'dawn', emoji: '🌅', title: 'Mattina / il villaggio si sveglia', songs: [
    s('Here Comes the Sun', 'The Beatles', { chosen: true }),
    s('Morning Mood', 'Grieg', { chosen: true }),
  ] },
  { id: 'death', emoji: '⚰️', title: 'Annuncio dei morti (colpo di scena)', songs: [
    direct('Il tuo pezzo, dal minuto 3:40 al 3:55', 'https://www.youtube.com/watch?v=J1gH_cjdb60&t=220s', 'Si apre già al 3:40: fermalo al 3:55.', { chosen: true }),
    s('Marche funèbre', 'Chopin', { chosen: true }),
  ] },
  { id: 'talk', emoji: '🗣️', title: 'Discussione con timer', songs: [
    s('Cotton Eye Joe', 'Rednex', { chosen: true, fun: true }),
  ] },
];

// Ruoli che usate di solito.
export const ROLE_SONGS = [
  { id: 'lupo', emoji: '🐺', title: 'Lupi', songs: [
    fx('Ululato classico', 'wolf howl sound effect'),
  ] },
  { id: 'contadino', emoji: '🧑‍🌾', title: 'Contadino', songs: [
    s('Cotton Eye Joe', 'Rednex', { chosen: true, fun: true }),
  ] },
  { id: 'veggente', emoji: '🔮', title: 'Veggente (nuove idee)', songs: [
    s('Eye in the Sky', 'The Alan Parsons Project', { fun: true }),
    s('Black Magic Woman', 'Santana'),
    s('Crystal Ball', 'Keane'),
  ] },
  { id: 'puttana', emoji: '💋', title: 'Puttana (quella che dorme con qualcuno)', songs: [
    s('Roxanne', 'The Police', { fun: true }),
    s('Bocca di rosa', 'Fabrizio De André', { fun: true }),
    s('Via del Campo', 'Fabrizio De André', { fun: true }),
    s('Can-can (Galop infernal)', 'Offenbach', { fun: true }),
    s('Lady Marmalade', 'Labelle', { fun: true }),
    s('Careless Whisper', 'George Michael', { fun: true }),
    s('Je t’aime… moi non plus', 'Serge Gainsbourg e Jane Birkin', { fun: true }),
    s('I Will Always Love You', 'Whitney Houston', { fun: true }),
  ] },
  { id: 'prete', emoji: '⛪', title: 'Prete kamikaze', songs: [
    s('Jump', 'Van Halen', { fun: true }),
    s('La cavalcata delle Valchirie', 'Wagner', { fun: true }),
    s('Ave Maria', 'Schubert'),
  ] },
  { id: 'scemo', emoji: '🤪', title: 'Folle (scemo del villaggio)', songs: [
    s('Yakety Sax (Benny Hill)', 'Boots Randolph', { fun: true }),
    s('Axel F', 'Crazy Frog', { fun: true }),
    s('Crazy', 'Gnarls Barkley', { fun: true }),
  ] },
];

// Ruoli che l'app ha ma che non usate ancora.
export const OTHER_ROLE_SONGS = [
  { id: 'cortigiana', emoji: '🌹', title: 'Cortigiana', songs: [
    s('Pretty Woman', 'Roy Orbison', { fun: true }),
    s('Lola', 'The Kinks', { fun: true }),
  ] },
  { id: 'medium', emoji: '🕯️', title: 'Medium', songs: [
    s('Danse Macabre', 'Saint-Saëns'),
    s('Ghostbusters', 'Ray Parker Jr.', { fun: true }),
    s('Tubular Bells', 'Mike Oldfield'),
  ] },
  { id: 'strega', emoji: '🧪', title: 'Strega', songs: [
    s('Witchy Woman', 'Eagles'),
    s('Season of the Witch', 'Donovan'),
  ] },
  { id: 'cacciatore', emoji: '🏹', title: 'Cacciatore', songs: [
    s('Il buono, il brutto, il cattivo', 'Ennio Morricone'),
    s('L’estasi dell’oro', 'Ennio Morricone'),
  ] },
  { id: 'cupido', emoji: '💘', title: 'Cupido', songs: [
    s('Can’t Help Falling in Love', 'Elvis Presley'),
    s('Love Is in the Air', 'John Paul Young'),
    s('Cupid', 'Sam Cooke'),
  ] },
  { id: 'massone', emoji: '🤝', title: 'Massoni', songs: [
    s('Masked Ball (Eyes Wide Shut)', 'Jocelyn Pook'),
    s('Mission: Impossible Theme', 'Lalo Schifrin'),
  ] },
  { id: 'gufo', emoji: '🦉', title: 'Gufo', songs: [
    s('Hedwig’s Theme', 'John Williams'),
  ] },
  { id: 'criceto', emoji: '🐹', title: 'Criceto mannaro', songs: [
    s('Hampster Dance Song', 'Hampton the Hampster', { fun: true }),
  ] },
  { id: 'indemoniato', emoji: '😈', title: 'Indemoniato', songs: [
    s('Sympathy for the Devil', 'The Rolling Stones'),
    s('Highway to Hell', 'AC/DC'),
  ] },
  { id: 'mitomane', emoji: '🎭', title: 'Mitomane', songs: [
    s('Karma Chameleon', 'Culture Club', { fun: true }),
  ] },
  { id: 'bambina', emoji: '👧', title: 'Bambina che sbircia', songs: [
    s('In the Hall of the Mountain King', 'Grieg'),
    s('The Pink Panther Theme', 'Henry Mancini', { fun: true }),
  ] },
  { id: 'sindaco', emoji: '🎩', title: 'Sindaco', songs: [
    s('Il Padrino (tema)', 'Nino Rota'),
    s('Hail to the Chief', 'Marine Band'),
  ] },
];

// Effetti solo per i ruoli e i momenti che usate.
export const EFFECTS = [
  { id: 'fx-night', emoji: '🌌', title: 'Notte e ambiente', songs: [
    fx('Ululato classico', 'wolf howl sound effect'),
    fx('Branco di lupi in lontananza', 'wolf pack howling night forest'),
    fx('12 rintocchi di mezzanotte', 'church bell midnight 12 chimes'),
    fx('Temporale e pioggia', 'rain thunderstorm ambience'),
  ] },
  { id: 'fx-morning', emoji: '🌅', title: 'Sonno e mattina', songs: [
    fx('Russare', 'snoring sound effect'),
    fx('Gallo che canta', 'rooster crow sound effect'),
  ] },
  { id: 'fx-roles', emoji: '🎭', title: 'I vostri ruoli', songs: [
    fx('Puttana: letto che cigola', 'bed creaking sound effect'),
    fx('Veggente: sfera di cristallo', 'crystal ball magic chime sound effect'),
    fx('Prete: campana a morto', 'single church bell toll sound effect'),
    fx('Prete: lancio kamikaze', 'wilhelm scream'),
    fx('Folle: risata pazza', 'crazy laugh sound effect'),
  ] },
  { id: 'fx-day', emoji: '🗣️', title: 'Giorno e votazione', songs: [
    fx('Rullo di tamburi', 'drum roll sound effect'),
    fx('Martelletto', 'gavel sound effect'),
    fx('Fanfara', 'fanfare sound effect'),
  ] },
  { id: 'fx-fun', emoji: '😂', title: 'Colpi di scena comici', songs: [
    fx('Dun dun dun', 'dun dun dun sound effect'),
    fx('Disco che gratta', 'record scratch sound effect'),
    fx('Trombone triste', 'sad trombone sound effect'),
  ] },
];

export const GROUPS = [
  { id: 'moments', label: 'Momenti', sections: MOMENTS },
  { id: 'roles', label: 'Ruoli', sections: ROLE_SONGS },
  { id: 'others', label: 'Altri', sections: OTHER_ROLE_SONGS },
  { id: 'effects', label: 'Effetti', sections: EFFECTS },
];

// Link di una voce: [{ label, url }]. Gli effetti e i link diretti hanno solo YouTube.
export function linksOf(song) {
  if (song.direct) return [{ kind: 'yt', label: '▶ YouTube', url: song.url }];
  const q = song.fx ? song.query : `${song.title} ${song.artist}`;
  const links = [{ kind: 'yt', label: '▶ YouTube', url: ytUrl(q) }];
  if (!song.fx) links.push({ kind: 'sp', label: '🎧 Spotify', url: spotifyUrl(q) });
  return links;
}
