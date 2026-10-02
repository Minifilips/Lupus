// Gioco in rete: il narratore è l'host, i cittadini si collegano col codice.
// Connessione diretta tra telefoni (WebRTC con PeerJS): il server pubblico di PeerJS
// serve solo per l'handshake iniziale, poi i dati passano da telefono a telefono.
// È l'unico file che conosce PeerJS. Nessun ruolo altrui viaggia sulla rete (vedi stateFor).
import { load, save, settings } from './storage.js';
import { makeCode, normalizeCode, peerId, uniqueName, stateFor } from './netlogic.js';

const ONLINE_MS = 35000; // oltre questo silenzio un telefono è considerato scollegato
const PING_MS = 10000;

const newToken = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`.replace('.', ''));

// ---------------------------------------------------------------- HOST (narratore)

const host = {
  peer: null,
  code: null,
  members: new Map(), // nome -> { name, token, conn, seen, lastSeen }
  last: new Map(), // nome -> ultimo stato inviato (JSON), per non rimandare uguale
  listeners: new Set(),
  getGame: null,
  sig: '',
};

const emitHost = () => host.listeners.forEach((fn) => fn());

function persistMembers() {
  save('lobbyMembers', [...host.members.values()].map((m) => ({ name: m.name, token: m.token })));
}

export function hostActive() {
  return !!host.peer;
}

export function isOnline(name) {
  const m = host.members.get(name);
  return !!(m && m.conn && m.conn.open && Date.now() - m.lastSeen < ONLINE_MS);
}

export function hostInfo() {
  return {
    active: hostActive(),
    code: host.code,
    members: [...host.members.values()].map((m) => ({ name: m.name, online: isOnline(m.name), seen: m.seen })),
  };
}

export function subscribe(fn) {
  host.listeners.add(fn);
  clientListeners.add(fn);
  return () => { host.listeners.delete(fn); clientListeners.delete(fn); };
}

// L'app dà all'host il modo di leggere la partita corrente.
export function setGameProvider(fn) {
  host.getGame = fn;
}

export function startHost() {
  if (host.peer) return Promise.resolve(host.code);
  if (!window.Peer) return Promise.reject(new Error('Libreria di rete non caricata'));
  return openHost(load('lobbyCode', null) || makeCode(), 0);
}

function openHost(code, tries) {
  return new Promise((resolve, reject) => {
    const peer = new window.Peer(peerId(code));
    peer.on('open', () => {
      host.peer = peer;
      host.code = code;
      save('lobbyCode', code);
      for (const m of load('lobbyMembers', [])) {
        host.members.set(m.name, { name: m.name, token: m.token, conn: null, seen: false, lastSeen: 0 });
      }
      peer.on('connection', onConnection);
      peer.on('disconnected', () => { if (host.peer === peer) peer.reconnect(); });
      host.timer = setInterval(() => {
        const sig = [...host.members.keys()].map((n) => `${n}:${isOnline(n)}`).join('|');
        if (sig !== host.sig) { host.sig = sig; emitHost(); }
      }, 5000);
      emitHost();
      resolve(code);
    });
    peer.on('error', (e) => {
      if (host.peer) return; // a lobby già aperta gli errori di singole connessioni si ignorano
      peer.destroy();
      if (e.type === 'unavailable-id' && tries < 5) openHost(makeCode(), tries + 1).then(resolve, reject);
      else reject(e);
    });
  });
}

function onConnection(conn) {
  conn.on('data', (msg) => handleHost(conn, msg));
  conn.on('close', () => {
    for (const m of host.members.values()) if (m.conn === conn) m.conn = null;
    emitHost();
  });
}

function handleHost(conn, msg) {
  if (!msg || typeof msg !== 'object') return;
  const member = [...host.members.values()].find((m) => m.conn === conn || (msg.token && m.token === msg.token));
  if (msg.t === 'hello') {
    let m = [...host.members.values()].find((x) => x.token === msg.token);
    if (m) {
      m.conn = conn;
    } else {
      const name = uniqueName(msg.name, [...host.members.keys()]);
      m = { name, token: String(msg.token || newToken()), conn, seen: false };
      host.members.set(name, m);
      persistMembers();
    }
    m.lastSeen = Date.now();
    host.last.delete(m.name);
    conn.send({ t: 'welcome', name: m.name });
    pushHost();
    emitHost();
    return;
  }
  if (!member) return;
  member.lastSeen = Date.now();
  if (msg.t === 'seen' && !member.seen) {
    member.seen = true;
    emitHost();
  }
}

// Manda a ogni telefono il suo stato (solo se è cambiato).
export function pushHost() {
  if (!host.peer || !host.getGame) return;
  const game = host.getGame();
  const opts = { revealDead: settings().revealDead !== false };
  for (const m of host.members.values()) {
    if (!m.conn || !m.conn.open) continue;
    const player = game.players.find((p) => p.name === m.name);
    const st = stateFor(player, game, opts);
    const json = JSON.stringify(st);
    if (host.last.get(m.name) === json) continue;
    host.last.set(m.name, json);
    try { m.conn.send({ t: 'state', state: st }); } catch { /* si riprova al prossimo cambio */ }
  }
}

export function resetSeen() {
  for (const m of host.members.values()) m.seen = false;
  emitHost();
}

export function removeMember(name) {
  const m = host.members.get(name);
  if (!m) return;
  try { m.conn?.close(); } catch { /* già chiusa */ }
  host.members.delete(name);
  host.last.delete(name);
  persistMembers();
  emitHost();
}

export function stopHost() {
  clearInterval(host.timer);
  host.members.forEach((m) => { try { m.conn?.close(); } catch { /* già chiusa */ } });
  try { host.peer?.destroy(); } catch { /* già chiusa */ }
  host.peer = null;
  host.code = null;
  host.members = new Map();
  host.last = new Map();
  save('lobbyCode', undefined);
  save('lobbyMembers', undefined);
  emitHost();
}

// ---------------------------------------------------------------- CLIENT (cittadino)

const client = {
  peer: null,
  conn: null,
  session: load('citizenSession', null), // { code, name, token }
  status: 'idle', // idle | connecting | connected | reconnecting | notfound | error
  state: null,
  timer: null,
  ping: null,
  everConnected: false,
};
const clientListeners = new Set();
const emitClient = () => clientListeners.forEach((fn) => fn());

export function clientInfo() {
  return { session: client.session, status: client.status, state: client.state };
}

export function joinLobby(code, name) {
  client.session = { code: normalizeCode(code), name: String(name).trim().slice(0, 20), token: client.session?.token || newToken() };
  save('citizenSession', client.session);
  client.state = null;
  client.everConnected = false;
  connect();
}

export function resumeSession() {
  if (client.session && client.status === 'idle') connect();
}

export function leaveLobby() {
  teardown();
  client.session = null;
  client.state = null;
  client.status = 'idle';
  save('citizenSession', undefined);
  emitClient();
}

export function sendSeen() {
  try { if (client.conn?.open) client.conn.send({ t: 'seen' }); } catch { /* si ripete al prossimo tocco */ }
}

function teardown() {
  clearTimeout(client.timer);
  clearInterval(client.ping);
  try { client.conn?.close(); } catch { /* già chiusa */ }
  try { client.peer?.destroy(); } catch { /* già chiusa */ }
  client.conn = null;
  client.peer = null;
}

function retrySoon(ms = 2500) {
  clearTimeout(client.timer);
  client.status = client.everConnected ? 'reconnecting' : 'connecting';
  emitClient();
  client.timer = setTimeout(connect, ms);
}

function connect() {
  const s = client.session;
  if (!s) return;
  if (!window.Peer) { client.status = 'error'; emitClient(); return; }
  teardown();
  client.status = client.everConnected ? 'reconnecting' : 'connecting';
  emitClient();
  const peer = new window.Peer();
  client.peer = peer;
  peer.on('open', () => {
    const conn = peer.connect(peerId(s.code), { reliable: true });
    client.conn = conn;
    conn.on('open', () => {
      conn.send({ t: 'hello', name: s.name, token: s.token });
      client.ping = setInterval(() => { try { conn.send({ t: 'ping' }); } catch { /* si riconnette da solo */ } }, PING_MS);
    });
    conn.on('data', (msg) => {
      if (msg?.t === 'welcome') {
        client.status = 'connected';
        client.everConnected = true;
        if (msg.name !== s.name) { s.name = msg.name; save('citizenSession', s); }
      } else if (msg?.t === 'state') {
        client.state = msg.state;
      }
      emitClient();
    });
    conn.on('close', () => { if (client.conn === conn) retrySoon(); });
  });
  peer.on('error', (e) => {
    if (client.peer !== peer) return;
    if (e.type === 'peer-unavailable' && !client.everConnected) {
      client.status = 'notfound';
      emitClient();
      return;
    }
    retrySoon(4000);
  });
  peer.on('disconnected', () => { if (client.peer === peer && client.status !== 'connected') retrySoon(); });
}

// Tornando sull'app (iPhone: schermo bloccato) si riconnette subito.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !client.session) return;
  // Dopo il blocco schermo la connessione può sembrare aperta ma essere morta: si rifà sempre.
  if (client.status !== 'notfound') connect();
});
