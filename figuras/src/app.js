'use strict';

/* ======================================================================
   Almacenamiento: usa Electron (window.api) si existe; si no, IndexedDB del
   navegador (mucho más espacio que localStorage, necesario por las imágenes).
   ====================================================================== */
const LS_KEY = 'mis-figuras-v1';
const idb = {
  db: null,
  open() {
    if (this.db) return this.db;
    this.db = new Promise((resolve, reject) => {
      const req = indexedDB.open('mis-figuras', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.db;
  },
  async run(mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', mode);
      const req = fn(tx.objectStore('kv'));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  },
  get: (k) => idb.run('readonly', (s) => s.get(k)),
  set: (k, v) => idb.run('readwrite', (s) => s.put(v, k)),
};
const store = {
  async load() {
    if (window.api) return window.api.load();
    try {
      const data = await idb.get('state');
      if (data) return data;
    } catch (e) { console.warn('IndexedDB no disponible', e); }
    // Migración desde la versión anterior (localStorage)
    try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; }
  },
  async save(data) {
    if (window.api) return window.api.save(data);
    try { await idb.set('state', JSON.parse(JSON.stringify(data))); }
    catch (e) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
      catch { toast('⚠ No se pudo guardar: ' + (e && e.message)); }
    }
  },
};

let state = { figures: [], settings: { currency: 'MXN' } };
let tab = 'owned';
let editingId = null;
let draftImage = '';

// `doc` cambia cuando la app se mueve a la ventana flotante (Picture-in-Picture)
let doc = document;
const $ = (s) => doc.querySelector(s);
const $$ = (s) => [...doc.querySelectorAll(s)];
function ask(msg, okText = 'Aceptar') {
  const dlg = $('#confirm');
  $('#confirm-msg').textContent = msg;
  $('#confirm-ok').textContent = okText;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise((resolve) => dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true }));
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function money(n) {
  const cur = state.settings.currency || 'MXN';
  try {
    const locale = { MXN: 'es-MX', USD: 'es-US', EUR: 'es-ES', JPY: 'ja-JP', COP: 'es-CO', ARS: 'es-AR', CLP: 'es-CL', PEN: 'es-PE', GBP: 'en-GB' }[cur] || 'es';
    const whole = ['JPY', 'CLP', 'COP'].includes(cur) || Number.isInteger(n || 0);
    return new Intl.NumberFormat(locale, { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n || 0);
  } catch { return '$' + (n || 0).toFixed(2); }
}
const remaining = (f) => Math.max(0, num(f.price) - num(f.paid));

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${MONTHS[+m - 1] || ''} ${y}`;
}
function fmtDate(d) {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return `${+dd} ${MONTHS[+m - 1]} ${y}`;
}
function daysUntil(d) {
  if (!d) return null;
  const t = new Date(d + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 86400000);
}
function dueLabel(f) {
  const n = daysUntil(f.dueDate);
  if (n === null) return { txt: '', cls: '' };
  if (n < 0) return { txt: `Vencido hace ${-n} d`, cls: 'late' };
  if (n === 0) return { txt: 'Vence hoy', cls: 'late' };
  if (n <= 7) return { txt: `Vence en ${n} d`, cls: 'soon' };
  return { txt: `Vence ${fmtDate(f.dueDate)}`, cls: '' };
}

function persist() {
  store.save(state);
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), 2200);
}

/* ======================================================================
   Render
   ====================================================================== */
function render() {
  const counts = { owned: 0, preorder: 0, wish: 0 };
  state.figures.forEach((f) => counts[f.status]++);
  $('#c-owned').textContent = counts.owned;
  $('#c-preorder').textContent = counts.preorder;
  $('#c-wish').textContent = counts.wish;
  $('#c-money').textContent = state.figures.filter((f) => f.status !== 'wish' && remaining(f) > 0).length;

  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $('#toolbar').hidden = tab === 'money';
  $('#fab').hidden = false;

  if (tab === 'money') return renderMoney();
  renderGrid();
}

function filtered() {
  const q = $('#search').value.trim().toLowerCase();
  let list = state.figures.filter((f) => f.status === tab);
  if (q) list = list.filter((f) => [f.name, f.series, f.maker, f.store, f.notes].join(' ').toLowerCase().includes(q));
  const s = $('#sort').value;
  const by = {
    recent: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    name: (a, b) => a.name.localeCompare(b.name, 'es'),
    price: (a, b) => num(b.price) - num(a.price),
    date: (a, b) => (a.releaseDate || '9999').localeCompare(b.releaseDate || '9999'),
  }[s];
  return list.sort(by);
}

function thumbHTML(f) {
  return f.image
    ? `<img src="${esc(f.image)}" alt="">`
    : '<span>◆</span>';
}

function renderGrid() {
  const list = filtered();
  const view = $('#view');
  if (!list.length) {
    const msg = {
      owned: ['🏆', 'Aún no hay figuras compradas.'],
      preorder: ['⏳', 'No tienes pre-órdenes.'],
      wish: ['✨', 'Tu lista de deseos está vacía.'],
    }[tab];
    view.innerHTML = `<div class="empty"><span class="big">${msg[0]}</span>${$('#search').value ? 'Sin resultados.' : msg[1]}<br><span class="small">Pulsa ＋ para añadir una.</span></div>`;
    return;
  }

  const total = list.reduce((s, f) => s + num(f.price), 0);
  const totalLabel = { owned: 'Valor de la colección', preorder: 'Total en pre-órdenes', wish: 'Costaría todo' }[tab];

  view.innerHTML = `
    <div class="section-total"><span>${list.length} figura${list.length === 1 ? '' : 's'}</span><span>${totalLabel}: <b>${money(total)}</b></span></div>
    <div class="grid">${list.map(cardHTML).join('')}</div>`;
}

function cardHTML(f) {
  let badge = '';
  if (f.status === 'preorder') {
    const d = dueLabel(f);
    if (d.cls && remaining(f) > 0) badge = `<span class="badge ${d.cls === 'late' ? 'late' : 'due'}">${d.txt}</span>`;
    else if (f.releaseDate) badge = `<span class="badge pre">${fmtMonth(f.releaseDate)}</span>`;
  }
  const rest = f.status !== 'wish' && remaining(f) > 0 ? ` <span class="rest">· faltan ${money(remaining(f))}</span>` : '';
  const quick = {
    owned: '',
    preorder: `<div class="quick"><button data-act="arrived">✓ Llegó</button></div>`,
    wish: `<div class="quick"><button data-act="topre">Pre-ordenar</button><button data-act="tobuy">Comprada</button></div>`,
  }[f.status];

  return `
    <article class="card" data-id="${f.id}">
      <div class="thumb">${thumbHTML(f)}
        ${f.image ? '<button class="zoom" data-act="zoom" title="Ver imagen">⤢</button>' : ''}
        ${badge}
      </div>
      <div class="info">
        <div class="name">${esc(f.name)}</div>
        <div class="sub">${esc([f.series, f.maker].filter(Boolean).join(' · ') || f.store || '—')}</div>
        ${num(f.price) ? `<div class="price">${money(f.price)}${rest}</div>` : ''}
      </div>
      ${quick}
    </article>`;
}

function renderMoney() {
  const pending = state.figures
    .filter((f) => f.status !== 'wish' && remaining(f) > 0)
    .sort((a, b) => (a.dueDate || a.releaseDate || '9999').localeCompare(b.dueDate || b.releaseDate || '9999'));

  const totalPending = pending.reduce((s, f) => s + remaining(f), 0);
  const deposits = state.figures.filter((f) => f.status === 'preorder').reduce((s, f) => s + num(f.paid), 0);
  const wishTotal = state.figures.filter((f) => f.status === 'wish').reduce((s, f) => s + num(f.price), 0);
  const collection = state.figures.filter((f) => f.status === 'owned').reduce((s, f) => s + num(f.price), 0);

  const next = pending.find((f) => f.dueDate) || pending[0];
  let nextTxt = 'No tienes pagos pendientes 🎉';
  if (next) {
    const when = next.dueDate ? fmtDate(next.dueDate) : next.releaseDate ? `sale ${fmtMonth(next.releaseDate)}` : 'sin fecha';
    nextTxt = `Próximo: ${esc(next.name)} — ${money(remaining(next))} (${when})`;
  }

  const rows = pending.map((f) => {
    const pct = num(f.price) ? Math.min(100, (num(f.paid) / num(f.price)) * 100) : 0;
    const d = dueLabel(f);
    const when = d.txt
      ? `<span class="${d.cls}-txt">${d.txt}</span>`
      : f.releaseDate ? `Sale ${fmtMonth(f.releaseDate)}` : '';
    return `
      <div class="pay ${d.cls}" data-id="${f.id}">
        <div class="pthumb" data-act="zoom" style="${f.image ? `background-image:url('${esc(f.image).replace(/'/g, '%27')}')` : ''}">${f.image ? '' : '◆'}</div>
        <div class="pbody">
          <div class="ptop"><span class="pname" data-act="edit">${esc(f.name)}</span><span class="prest">${money(remaining(f))}</span></div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="pmeta"><span>Pagado ${money(f.paid)} de ${money(f.price)}</span><span>${when}</span></div>
          <div class="pactions">
            <input type="number" min="0" step="0.01" placeholder="Monto" data-role="amt" />
            <button data-act="abonar">Abonar</button>
            <button class="go" data-act="liquidar">Liquidar</button>
          </div>
        </div>
      </div>`;
  }).join('');

  $('#view').innerHTML = `
    <div class="summary">
      <div class="label">Dinero por pagar</div>
      <div class="amount">${money(totalPending)}</div>
      <div class="next">${nextTxt}</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="l">Anticipos dados</div><div class="v">${money(deposits)}</div></div>
      <div class="stat"><div class="l">Colección</div><div class="v">${money(collection)}</div></div>
      <div class="stat"><div class="l">Deseadas</div><div class="v">${money(wishTotal)}</div></div>
    </div>
    ${pending.length ? `<h3 class="list-title">Pendientes (${pending.length})</h3>${rows}` : '<div class="empty"><span class="big">💸</span>Todo pagado.</div>'}`;
}

/* ======================================================================
   Acciones
   ====================================================================== */
const byId = (id) => state.figures.find((f) => f.id === id);

$('#view').addEventListener('click', (e) => {
  const host = e.target.closest('[data-id]');
  if (!host) return;
  const f = byId(host.dataset.id);
  if (!f) return;
  const act = e.target.closest('[data-act]')?.dataset.act;

  if (act === 'zoom') { if (f.image) openViewer(f); return; }
  if (act === 'arrived') {
    f.status = 'owned';
    f.arrivedAt = Date.now();
    persist(); render();
    toast(remaining(f) > 0 ? `¡${f.name} llegó! (aún debes ${money(remaining(f))})` : `¡${f.name} añadida a tu colección!`);
    return;
  }
  if (act === 'topre') { f.status = 'preorder'; persist(); render(); openForm(f); toast('Movida a pre-orden'); return; }
  if (act === 'tobuy') { f.status = 'owned'; if (!num(f.paid)) f.paid = f.price; persist(); render(); toast('¡Añadida a compradas!'); return; }
  if (act === 'abonar') {
    const inp = host.querySelector('[data-role="amt"]');
    const amt = num(inp.value);
    if (amt <= 0) { inp.focus(); return; }
    f.paid = Math.min(num(f.price), num(f.paid) + amt);
    (f.payments ||= []).push({ amount: amt, date: new Date().toISOString().slice(0, 10) });
    persist(); render();
    toast(`Abonaste ${money(amt)} a ${f.name}`);
    return;
  }
  if (act === 'liquidar') {
    const amt = remaining(f);
    f.paid = num(f.price);
    (f.payments ||= []).push({ amount: amt, date: new Date().toISOString().slice(0, 10) });
    persist(); render();
    toast(`${f.name} liquidada ✓`);
    return;
  }
  if (act === 'edit' || host.classList.contains('card')) {
    if (e.target.closest('input')) return;
    openForm(f);
  }
});

// Imagen rota (URL caída) → icono de reemplazo
$('#view').addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') e.target.replaceWith(Object.assign(document.createElement('span'), { textContent: '◆' }));
}, true);

$('#view').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('[data-role="amt"]')) {
    e.target.closest('.pay').querySelector('[data-act="abonar"]').click();
  }
});

$$('.tab').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
$('#search').addEventListener('input', render);
$('#sort').addEventListener('change', render);
$('#fab').addEventListener('click', () => openForm(null));

/* ---------- Visor ---------- */
function openViewer(f) {
  $('#viewer-img').src = f.image;
  $('#viewer-cap').textContent = f.name;
  $('#viewer').showModal();
}
$('#viewer').addEventListener('click', () => $('#viewer').close());

/* ======================================================================
   Formulario
   ====================================================================== */
const form = $('#form');
const F = (id) => $('#f-' + id);

function setImage(src) {
  draftImage = src || '';
  const img = $('#img-preview');
  img.hidden = !draftImage;
  $('#dz-hint').hidden = !!draftImage;
  $('#img-clear').hidden = !draftImage;
  if (draftImage) img.src = draftImage; else img.removeAttribute('src');
}

function syncStatusFields() {
  const s = F('status').value;
  $('#w-dates').hidden = s !== 'preorder';
  $('#w-paid').hidden = s === 'wish';
}

function openForm(f) {
  editingId = f ? f.id : null;
  form.reset();
  $('#modal-title').textContent = f ? 'Editar figura' : 'Nueva figura';
  $('#btn-delete').hidden = !f;
  const d = f || { status: tab === 'money' ? 'preorder' : tab };
  F('name').value = d.name || '';
  F('series').value = d.series || '';
  F('maker').value = d.maker || '';
  F('status').value = d.status;
  F('store').value = d.store || '';
  F('price').value = d.price ?? '';
  F('paid').value = d.paid ?? '';
  F('release').value = d.releaseDate || '';
  F('due').value = d.dueDate || '';
  F('notes').value = d.notes || '';
  F('imgurl').value = d.image && /^https?:/.test(d.image) ? d.image : '';
  setImage(d.image || '');
  syncStatusFields();
  $('#modal').showModal();
  setTimeout(() => F('name').focus(), 30);
}

F('status').addEventListener('change', syncStatusFields);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = F('name').value.trim();
  if (!name) { F('name').focus(); return; }
  const status = F('status').value;
  let paid = num(F('paid').value);
  const price = num(F('price').value);
  // Si es comprada y no indicaste cuánto pagaste, se asume pagada completa
  if (status === 'owned' && F('paid').value === '') paid = price;

  const data = {
    name,
    series: F('series').value.trim(),
    maker: F('maker').value.trim(),
    status,
    store: F('store').value.trim(),
    price,
    paid: status === 'wish' ? 0 : Math.min(paid, price || paid),
    releaseDate: F('release').value,
    dueDate: F('due').value,
    notes: F('notes').value.trim(),
    image: draftImage,
  };

  if (editingId) Object.assign(byId(editingId), data);
  else state.figures.push({ id: uid(), createdAt: Date.now(), ...data });

  persist();
  $('#modal').close();
  if (tab !== 'money') tab = status;
  render();
  toast(editingId ? 'Cambios guardados' : 'Figura añadida');
});

const closeModal = () => $('#modal').close();
$('#btn-cancel').addEventListener('click', closeModal);
$('#modal-x').addEventListener('click', closeModal);
$('#btn-delete').addEventListener('click', async () => {
  const f = byId(editingId);
  if (!f || !(await ask(`¿Eliminar "${f.name}"?`, 'Eliminar'))) return;
  state.figures = state.figures.filter((x) => x.id !== editingId);
  persist(); closeModal(); render();
  toast('Figura eliminada');
});

/* ---------- Imagen: clic, arrastrar, pegar o URL ---------- */
function fileToDataURL(file, max = 700) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
async function takeFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  try { setImage(await fileToDataURL(file)); F('imgurl').value = ''; }
  catch { toast('No se pudo leer la imagen'); }
}

const dz = $('#dropzone');
dz.addEventListener('click', (e) => { if (!e.target.closest('#img-clear')) $('#file').click(); });
dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file').click(); } });
$('#file').addEventListener('change', (e) => { takeFile(e.target.files[0]); e.target.value = ''; });
$('#img-clear').addEventListener('click', () => { setImage(''); F('imgurl').value = ''; });
['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove('over')));
dz.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) return takeFile(file);
  const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
  if (/^https?:\/\//.test(url)) { F('imgurl').value = url; setImage(url); }
});
F('imgurl').addEventListener('input', (e) => {
  const v = e.target.value.trim();
  if (/^https?:\/\/.+/.test(v)) setImage(v);
  else if (!v && /^https?:/.test(draftImage)) setImage('');
});
function wireDocument(d) {
  d.addEventListener('paste', (e) => {
    if (!$('#modal').open) return;
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); takeFile(item.getAsFile()); }
  });
  // Evita que soltar una imagen fuera de la zona abra el archivo en la ventana
  d.addEventListener('dragover', (e) => e.preventDefault());
  d.addEventListener('drop', (e) => e.preventDefault());
}
wireDocument(document);

/* ======================================================================
   Ventana: siempre encima, minimizar, cerrar, opacidad
   ====================================================================== */
async function initWindow() {
  const pin = $('#btn-pin');
  if (!window.api) {
    // En navegador: sin minimizar/cerrar/opacidad; el 📌 abre la ventana flotante
    ['#btn-min', '#btn-close', '#w-opacity'].forEach((s) => ($(s).hidden = true));
    initFloating(pin);
    return;
  }
  const setPinUI = (on) => {
    pin.classList.toggle('on', on);
    pin.title = on ? 'Siempre encima: ACTIVADO (clic para desactivar)' : 'Siempre encima: desactivado';
  };
  setPinUI(await window.api.getPin());
  pin.addEventListener('click', async () => {
    const on = await window.api.setPin(!pin.classList.contains('on'));
    setPinUI(on);
    toast(on ? '📌 Siempre encima activado' : 'Siempre encima desactivado');
  });
  $('#btn-min').addEventListener('click', () => window.api.minimize());
  $('#btn-close').addEventListener('click', async () => { await store.save(state); window.api.close(); });

  const op = Math.round((await window.api.getOpacity()) * 100);
  $('#s-opacity').value = op;
  $('#s-op-val').textContent = op + '%';
  $('#s-opacity').addEventListener('input', (e) => {
    $('#s-op-val').textContent = e.target.value + '%';
    window.api.setOpacity(e.target.value / 100);
  });
}

/* ---------- Navegador: ventana flotante siempre encima (Chrome/Edge) ---------- */
let pipWin = null;
function initFloating(pin) {
  pin.title = 'Abrir en ventana flotante (siempre encima)';
  pin.addEventListener('click', () => {
    if (pipWin) return pipWin.close();
    if (!('documentPictureInPicture' in window)) {
      toast('La ventana flotante solo funciona en Chrome o Edge');
      return;
    }
    openFloating().catch((e) => toast('No se pudo abrir: ' + e.message));
  });
  $('#btn-back').addEventListener('click', () => pipWin && pipWin.close());
}

async function openFloating() {
  const pip = await documentPictureInPicture.requestWindow({ width: 420, height: 680 });
  pipWin = pip;
  // Copiar estilos
  for (const sheet of document.styleSheets) {
    const style = pip.document.createElement('style');
    style.textContent = [...sheet.cssRules].map((r) => r.cssText).join('\n');
    pip.document.head.append(style);
  }
  pip.document.title = 'Mis Figuras';
  pip.document.documentElement.lang = 'es';
  wireDocument(pip.document);

  const app = [...document.body.children].filter((el) => el.id !== 'parked' && el.tagName !== 'SCRIPT');
  app.forEach((el) => pip.document.body.append(el));
  doc = pip.document;
  document.body.classList.add('is-parked');
  $('#btn-pin').classList.add('on');
  $('#btn-pin').title = 'Volver a la pestaña';

  pip.addEventListener('pagehide', () => {
    [...pip.document.querySelectorAll('dialog[open]')].forEach((d) => d.close());
    const parked = document.getElementById('parked');
    app.forEach((el) => document.body.insertBefore(el, parked));
    doc = document;
    pipWin = null;
    document.body.classList.remove('is-parked');
    $('#btn-pin').classList.remove('on');
    $('#btn-pin').title = 'Abrir en ventana flotante (siempre encima)';
  });
}

/* ---------- Ajustes ---------- */
$('#btn-settings').addEventListener('click', () => {
  $('#s-currency').value = state.settings.currency;
  $('#settings').showModal();
});
$('#settings-x').addEventListener('click', () => $('#settings').close());
$('#s-currency').addEventListener('change', (e) => { state.settings.currency = e.target.value; persist(); render(); });

$('#btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mis-figuras-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Copia exportada');
});
$('#btn-import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.figures)) throw new Error('formato');
    if (!(await ask(`Se importarán ${data.figures.length} figuras y se reemplazarán las actuales. ¿Continuar?`, 'Importar'))) return;
    state = { figures: data.figures, settings: { currency: 'MXN', ...data.settings } };
    persist(); render();
    $('#settings').close();
    toast('Copia importada');
  } catch { toast('Archivo no válido'); }
});

/* ======================================================================
   Inicio
   ====================================================================== */
(async function init() {
  const data = await store.load();
  if (data && Array.isArray(data.figures)) state = { figures: data.figures, settings: { currency: 'MXN', ...data.settings } };
  await initWindow();
  render();
})();
