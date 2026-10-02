// Playlist consigliata per ogni momento della partita e per ogni ruolo.
// Sono link di ricerca (YouTube / Spotify): il primo risultato è quasi sempre il brano giusto.
// fun: true = scelta comica.

export const ytUrl = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const spotifyUrl = (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`;

const s = (title, artist, fun = false) => ({ title, artist, fun });
// Effetto sonoro: solo YouTube, la query è in inglese per trovare più risultati.
const fx = (title, query) => ({ title, query, fx: true });

export const MOMENTS = [
  { id: 'sleep', emoji: '🌙', title: 'Il villaggio si addormenta', songs: [
    s('Brahms’ Lullaby', 'Brahms'),
    s('Mr. Sandman', 'The Chordettes', true),
    s('Eine kleine Nachtmusik', 'Mozart', true),
  ] },
  { id: 'night', emoji: '🌌', title: 'Notte (sottofondo)', songs: [
    s('Clair de Lune', 'Debussy'),
    s('Moonlight Sonata (1° movimento)', 'Beethoven'),
    s('Nocturne Op. 9 n. 2', 'Chopin'),
  ] },
  { id: 'dawn', emoji: '🌅', title: 'Mattina / il villaggio si sveglia', songs: [
    s('Concerning Hobbits', 'Howard Shore'),
    s('Morning Mood', 'Grieg'),
    s('Here Comes the Sun', 'The Beatles', true),
  ] },
  { id: 'twist', emoji: '⚡', title: 'Colpo di scena / annuncio dei morti', songs: [
    s('O Fortuna (Carmina Burana)', 'Carl Orff'),
    s('Dies Irae (Requiem)', 'Verdi'),
    s('The Murder (Psycho)', 'Bernard Herrmann'),
    s('Duel of the Fates', 'John Williams'),
  ] },
  { id: 'talk', emoji: '🗣️', title: 'Discussione con timer', songs: [
    s('Think! (Jeopardy)', 'Merv Griffin', true),
    s('The Final Countdown', 'Europe', true),
  ] },
  { id: 'lynch', emoji: '🔥', title: 'Rogo', songs: [
    s('Marche funèbre', 'Chopin'),
    s('Funeral March of a Marionette', 'Gounod'),
    s('Ring of Fire', 'Johnny Cash', true),
    s('Disco Inferno', 'The Trammps', true),
  ] },
  { id: 'winvillage', emoji: '🏆', title: 'Vince il villaggio', songs: [
    s('We Are the Champions', 'Queen'),
    s('Inno alla gioia', 'Beethoven'),
  ] },
  { id: 'winwolves', emoji: '🐺', title: 'Vincono i lupi', songs: [
    s('Imperial March', 'John Williams'),
    s('Bad Moon Rising', 'Creedence Clearwater Revival'),
  ] },
];

export const ROLE_SONGS = [
  { id: 'lupo', emoji: '🐺', title: 'Lupi', songs: [
    s('Werewolves of London', 'Warren Zevon'),
    s('Hungry Like the Wolf', 'Duran Duran'),
    s('Una notte sul Monte Calvo', 'Musorgskij'),
  ] },
  { id: 'contadino', emoji: '🧑‍🌾', title: 'Contadino', songs: [
    s('Cotton Eye Joe', 'Rednex', true),
  ] },
  { id: 'veggente', emoji: '🔮', title: 'Veggente', songs: [
    s('Paul’s Dream (Dune)', 'Hans Zimmer'),
    s('I Put a Spell on You', 'Screamin’ Jay Hawkins'),
  ] },
  { id: 'puttana', emoji: '💋', title: 'Puttana', songs: [
    s('Roxanne', 'The Police', true),
    s('Bocca di rosa', 'Fabrizio De André', true),
    s('Via del Campo', 'Fabrizio De André', true),
    s('Can-can (Galop infernal)', 'Offenbach', true),
    s('Lady Marmalade', 'Labelle', true),
    s('Careless Whisper', 'George Michael', true),
    s('Je t’aime… moi non plus', 'Serge Gainsbourg e Jane Birkin', true),
  ] },
  { id: 'guardia', emoji: '🛡️', title: 'Guardia', songs: [
    s('Eye of the Tiger', 'Survivor'),
    s('I Will Always Love You', 'Whitney Houston', true),
  ] },
  { id: 'medium', emoji: '🕯️', title: 'Medium', songs: [
    s('Danse Macabre', 'Saint-Saëns'),
    s('Ghostbusters', 'Ray Parker Jr.', true),
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
    s('Hampster Dance Song', 'Hampton the Hampster', true),
  ] },
  { id: 'indemoniato', emoji: '😈', title: 'Indemoniato', songs: [
    s('Sympathy for the Devil', 'The Rolling Stones'),
    s('Highway to Hell', 'AC/DC'),
  ] },
  { id: 'mitomane', emoji: '🎭', title: 'Mitomane', songs: [
    s('Karma Chameleon', 'Culture Club', true),
  ] },
  { id: 'bambina', emoji: '👧', title: 'Bambina che sbircia', songs: [
    s('In the Hall of the Mountain King', 'Grieg'),
    s('The Pink Panther Theme', 'Henry Mancini', true),
  ] },
  { id: 'scemo', emoji: '🤪', title: 'Scemo del villaggio', songs: [
    s('Yakety Sax (Benny Hill)', 'Boots Randolph', true),
  ] },
  { id: 'sindaco', emoji: '🎩', title: 'Sindaco', songs: [
    s('Il Padrino (tema)', 'Nino Rota'),
    s('Hail to the Chief', 'Marine Band'),
  ] },
];

export const EFFECTS = [
  { id: 'fx-night', emoji: '🌌', title: 'Notte e ambiente', songs: [
    fx('Ululato di lupo', 'wolf howl sound effect'),
    fx('Branco di lupi in lontananza', 'wolf pack howling night forest'),
    fx('Gufo', 'owl hooting sound effect'),
    fx('Grilli di notte', 'crickets night ambience'),
    fx('12 rintocchi di mezzanotte', 'church bell midnight 12 chimes'),
    fx('Temporale e pioggia', 'rain thunderstorm ambience'),
    fx('Fuoco che scoppietta', 'fireplace crackling'),
  ] },
  { id: 'fx-morning', emoji: '🌅', title: 'Mattina e sonno', songs: [
    fx('Gallo che canta', 'rooster crow sound effect'),
    fx('Russare', 'snoring sound effect'),
    fx('Sbadiglio', 'yawn sound effect'),
  ] },
  { id: 'fx-roles', emoji: '🎭', title: 'Ruoli', songs: [
    fx('Porta che cigola', 'creaking door sound effect'),
    fx('Passi furtivi', 'sneaking footsteps sound effect'),
    fx('Battito cardiaco', 'heartbeat sound effect'),
    fx('Sparo (cacciatore)', 'gunshot sound effect'),
    fx('Pozione che ribolle (strega)', 'potion bubbling sound effect'),
    fx('Risata da strega', 'witch laugh sound effect'),
    fx('Sussurri di fantasmi (medium)', 'ghost whispers sound effect'),
  ] },
  { id: 'fx-day', emoji: '🗣️', title: 'Giorno e votazione', songs: [
    fx('Brusio della folla', 'crowd murmur sound effect'),
    fx('Rullo di tamburi', 'drum roll sound effect'),
    fx('Martelletto', 'gavel sound effect'),
    fx('Fanfara', 'fanfare sound effect'),
  ] },
  { id: 'fx-fun', emoji: '😂', title: 'Colpi di scena comici', songs: [
    fx('Wilhelm scream', 'wilhelm scream'),
    fx('Dun dun dun', 'dun dun dun sound effect'),
    fx('Disco che gratta', 'record scratch sound effect'),
    fx('Trombone triste', 'sad trombone sound effect'),
  ] },
];

export const GROUPS = [
  { id: 'moments', label: 'Momenti', sections: MOMENTS },
  { id: 'roles', label: 'Ruoli', sections: ROLE_SONGS },
  { id: 'effects', label: 'Effetti', sections: EFFECTS },
];

// Query di ricerca per un brano o un effetto.
export function queryOf(song) {
  return song.fx ? song.query : `${song.title} ${song.artist}`;
}
