import { h, fill } from '../ui.js';
import { load, save } from '../storage.js';
import { GROUPS, linksOf } from '../playlist.js';

const link = (l) => h('a', { class: `link-btn ${l.kind}`, href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label);

function songRow(song) {
  return h('div', { class: 'song-row' },
    h('div', { class: 'grow' },
      h('div', { class: 'song-title' }, song.chosen ? '✅ ' : '', song.title, song.fun ? ' 😂' : ''),
      song.artist ? h('div', { class: 'small muted' }, song.artist) : null,
      song.note ? h('div', { class: 'small muted' }, song.note) : null),
    linksOf(song).map(link));
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
    h('p', { class: 'muted small' }, 'Tocca un pulsante: si apre YouTube o Spotify con la ricerca già pronta. ✅ = scelta già fatta.'),
    seg,
    body);
  return root;
}
