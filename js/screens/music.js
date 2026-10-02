import { h, fill } from '../ui.js';
import { load, save } from '../storage.js';
import { GROUPS, queryOf, ytUrl, spotifyUrl } from '../playlist.js';

const link = (cls, href, label) => h('a', { class: `link-btn ${cls}`, href, target: '_blank', rel: 'noopener noreferrer' }, label);

function songRow(song) {
  const q = queryOf(song);
  return h('div', { class: 'song-row' },
    h('div', { class: 'grow' },
      h('div', { class: 'song-title' }, song.title, song.fun ? ' 😂' : ''),
      song.artist ? h('div', { class: 'small muted' }, song.artist) : null),
    link('yt', ytUrl(q), '▶ YouTube'),
    song.fx ? null : link('sp', spotifyUrl(q), '🎧 Spotify'));
}

export function renderMusic() {
  const root = h('div', { class: 'screen' });
  const body = h('div', { class: 'stack' });
  let group = load('musicGroup', 'moments');

  const seg = h('div', { class: 'seg' });

  function draw() {
    fill(seg, ...GROUPS.map((g) => h('button', {
      class: `seg-btn ${g.id === group ? 'on' : ''}`,
      onclick: () => { group = g.id; save('musicGroup', group); draw(); window.scrollTo(0, 0); },
    }, g.label)));
    const current = GROUPS.find((g) => g.id === group) || GROUPS[0];
    fill(body, ...current.sections.map((sec) => h('section', { class: 'panel song-section' },
      h('div', { class: 'section-title' }, `${sec.emoji} ${sec.title}`),
      sec.songs.map(songRow))));
  }
  draw();

  fill(root,
    h('header', { class: 'game-header' }, h('h1', {}, '🎵 Musica')),
    h('p', { class: 'muted small' }, 'Tocca un pulsante: si apre YouTube o Spotify con la ricerca già pronta. Il primo risultato è quasi sempre quello giusto.'),
    seg,
    body);
  return root;
}
