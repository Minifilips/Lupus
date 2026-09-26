// Piccoli helper per costruire il DOM senza innerHTML (i nomi dei giocatori sono testo libero).

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

// Come replaceChildren/append nativi, ma ignorano null/false e accettano array annidati.
export function fill(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

export function add(el, ...children) {
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : String(c));
  }
}

export function vibrate(pattern = 30) {
  try { navigator.vibrate?.(pattern); } catch { /* iOS non supporta vibrate */ }
}

// Finestra modale semplice. Restituisce una funzione per chiuderla.
export function modal(content, { onClose } = {}) {
  const box = h('div', { class: 'modal' }, content);
  const back = h('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) close(); } }, box);
  function close() {
    back.remove();
    onClose?.();
  }
  document.body.append(back);
  return close;
}

export function confirmBox(text, okLabel = 'Conferma') {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; close(); resolve(v); } };
    const close = modal([
      h('p', { class: 'modal-text' }, text),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => finish(false) }, 'Annulla'),
        h('button', { class: 'btn danger', onclick: () => finish(true) }, okLabel)),
    ], { onClose: () => finish(false) });
  });
}

// Mantiene lo schermo acceso durante la partita (iOS 16.4+).
let lock = null;
export async function keepAwake(on) {
  try {
    if (on && !lock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    lock = null;
  }
}
