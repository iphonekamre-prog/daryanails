"use strict";
import { supabase, fetchAll, saveItem, deleteItem, saveWork, deleteWork, saveBooking, deleteBooking, saveSite, uploadPhoto } from '../db.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const R = n => (+n || 0).toLocaleString('ru-RU') + ' ₽';
const itemPrice = d => { const it = D.items.find(i => i.title === d); return it ? +it.price || 0 : 0 };
const P = b => +b.price > 0 ? +b.price : itemPrice(b.design);   // price comes from the service the client chose
const sum = a => a.reduce((s, b) => s + P(b), 0);
const isPaid = b => !!b.paid || b.status === 'paid';
/* ---------- language (EN / RU) ---------- */
let lang = localStorage.getItem('dnAdminLang') || 'ru';
const RU = { 'Studio dashboard · sign in': 'Панель мастера · вход', 'Password': 'Пароль', 'Sign in': 'Войти', 'Wrong email or password.': 'Неверный email или пароль.', 'This account has no dashboard access.': 'У этой учётной записи нет доступа к панели.', '← Back to website': '← На сайт', 'Show': 'Показать', 'Hide': 'Скрыть',
  'Overview': 'Обзор', 'Bookings': 'Записи', 'Payments': 'Оплаты', 'Manicure': 'Маникюр', 'Pedicure': 'Педикюр', 'Treatments': 'Уход', 'Gallery': 'Галерея', 'Website': 'Сайт', 'Security & Admins': 'Безопасность и админы', '◐ Theme': '◐ Тема', 'Sign out': 'Выйти', 'Super admin': 'Главный админ', 'Editor': 'Редактор',
  'Revenue (paid)': 'Выручка (оплачено)', 'Pending payments': 'Ожидают оплаты', 'Total bookings': 'Всего записей', 'New requests': 'Новые заявки', 'Revenue · last 6 months': 'Выручка · последние 6 месяцев', 'Booking summary': 'Сводка по записям', 'New': 'Новые', 'Confirmed': 'Подтверждённые', 'Completed': 'Завершённые', 'Cancelled': 'Отменённые', 'Top services': 'Популярные услуги', 'No data yet.': 'Данных пока нет.', 'Latest bookings': 'Последние записи', 'Paid': 'Оплачено', 'Unpaid': 'Не оплачено', 'No bookings yet.': 'Записей пока нет.',
  'Search name, phone, service…': 'Поиск: имя, телефон, услуга…', 'All statuses': 'Все статусы', 'Service:': 'Услуга:', 'Date:': 'Дата:', 'Time:': 'Время:', 'Phone:': 'Телефон:', 'Price:': 'Цена:', 'any': 'любая', 'Delete': 'Удалить', 'No bookings found.': 'Записи не найдены.',
  'Received': 'Получено', 'Pending': 'Ожидает', 'Mark unpaid': 'Отметить неоплаченным', 'Mark paid': 'Отметить оплаченным', 'Nothing here.': 'Здесь пусто.',
  '+ Add service': '+ Добавить услугу', 'Edit': 'Изменить', '+ Upload photos': '+ Загрузить фото',
  'Changes appear on the live website right after saving. Leave a field empty to keep the default text.': 'Изменения появятся на сайте сразу после сохранения. Пустое поле — стандартный текст.', 'Hero image': 'Главное фото', 'Master photo': 'Фото мастера', 'Image URL': 'Ссылка на фото', 'Save website changes': 'Сохранить изменения сайта', 'Hero text': 'Текст главного экрана', 'Master role': 'Должность мастера', 'About text': 'О мастере', 'Address': 'Адрес', 'Address hint': 'Подсказка к адресу', 'Phone': 'Телефон', 'WhatsApp number': 'Номер WhatsApp', 'VK link': 'Ссылка VK', 'Header button': 'Кнопка в шапке',
  'Admins table not found — run admin.sql in Supabase to enable roles.': 'Таблица admins не найдена — выполните admin.sql в Supabase, чтобы включить роли.', 'Change my password': 'Сменить мой пароль', 'New password': 'Новый пароль', 'Repeat password': 'Повторите пароль', 'Update password': 'Обновить пароль', 'Add an administrator': 'Добавить администратора', 'Password (min 6)': 'Пароль (минимум 6)', 'Role': 'Роль', 'Editor — edits content, cannot delete': 'Редактор — правит контент, не удаляет', 'Super admin — full access': 'Главный админ — полный доступ', 'Add admin': 'Добавить', 'Admins': 'Админы', 'Only the super admin can add or remove administrators.': 'Только главный админ может добавлять и удалять администраторов.', 'Administrators': 'Администраторы', 'Loading…': 'Загрузка…', '(you)': '(вы)', 'Remove': 'Удалить', 'No admins yet.': 'Администраторов пока нет.',
  'Edit photo': 'Изменить фото', 'Title': 'Название', 'Description': 'Описание', 'Price, ₽': 'Цена, ₽', 'Old price, ₽ (for discount)': 'Старая цена, ₽ (для скидки)', 'Discount % (auto-fills price)': 'Скидка % (считает цену)', 'e.g. 20': 'напр. 20', 'Duration, min': 'Длительность, мин', 'Duration': 'Длительность', 'Hours': 'Часы', 'Minutes': 'Минуты', 'Quick pick': 'Быстрый выбор', 'Cards': 'Карточки', 'Photo size': 'Размер фото', 'Fit': 'Вписывание', 'Position': 'Позиция', 'Default': 'По умолчанию', 'Square 1:1': 'Квадрат 1:1', 'Landscape 4:3': 'Горизонтально 4:3', 'Wide 16:9': 'Широкое 16:9', 'Portrait 3:4': 'Вертикально 3:4', 'Portrait 4:5': 'Вертикально 4:5', 'Fill (crop)': 'Заполнить (обрезка)', 'Whole photo': 'Фото целиком', 'Center': 'Центр', 'Top': 'Верх', 'Bottom': 'Низ', 'Left': 'Слева', 'Right': 'Справа', 'Table': 'Таблица', 'Photo': 'Фото', 'Service': 'Услуга', 'Price': 'Цена', 'Old price': 'Старая цена', 'Discount': 'Скидка', 'Cancel': 'Отмена', 'Save': 'Сохранить',
  'Uploading…': 'Загрузка…', 'Uploaded — now save': 'Загружено — теперь сохраните', 'Photos added': 'Фото добавлены', 'Status updated': 'Статус обновлён', 'Price saved': 'Цена сохранена', 'Saved — live on the site': 'Сохранено — уже на сайте', 'Password updated': 'Пароль обновлён', 'Passwords do not match': 'Пароли не совпадают', 'Administrator added': 'Администратор добавлен', 'Removed': 'Удалено', 'Saved': 'Сохранено', 'Title is required': 'Укажите название',
  'Delete this service?': 'Удалить эту услугу?', 'Delete this photo?': 'Удалить это фото?', 'Delete this booking?': 'Удалить эту запись?', 'Remove this administrator?': 'Удалить этого администратора?' };
const PAT = [[/^(\d+) services$/, '$1 услуг'], [/^(\d+) works$/, '$1 работ'], [/^Pending \/ unpaid \((\d+)\)$/, 'Не оплачено ($1)'], [/^Paid \((\d+)\)$/, 'Оплачено ($1)'], [/^Error: (.*)$/, 'Ошибка: $1'],
  [/^(New|Edit) service · (.+)$/, (m, a, c) => (a === 'New' ? 'Новая услуга' : 'Изменить услугу') + ' · ' + (RU[c] || c)]];
const tr = s => {
  if (lang !== 'ru' || !s) return s;
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), c = m[2]; if (!c) return s;
  let r = RU[c]; if (!r) { const x = c.match(/^(.*?)( \((?:RU|EN)\))$/); if (x && RU[x[1]]) r = RU[x[1]] + x[2] }
  if (!r) for (const [re, to] of PAT) if (re.test(c)) { r = c.replace(re, to); break }
  return r ? m[1] + r + m[3] : s;
};
function i18n(root = document.body) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while (n = w.nextNode()) { if (n._o === undefined) n._o = n.nodeValue; const v = lang === 'ru' ? tr(n._o) : n._o; if (n.nodeValue !== v) n.nodeValue = v }
  root.querySelectorAll('[placeholder]').forEach(e => { if (e._p === undefined) e._p = e.getAttribute('placeholder'); e.setAttribute('placeholder', tr(e._p)) });
  document.documentElement.lang = lang;
}
const toast = m => { const x = document.createElement('div'); x.className = 'toast'; x.textContent = tr(m); document.body.append(x); setTimeout(() => x.remove(), 3200) };
const setWho = () => { if (me.email) $('#who').textContent = me.email + ' · ' + tr(me.role === 'super' ? 'Super admin' : 'Editor') };
document.addEventListener('click', e => { if (!e.target.closest('.langbtn')) return; lang = lang === 'ru' ? 'en' : 'ru'; localStorage.setItem('dnAdminLang', lang); document.querySelectorAll('.langbtn').forEach(b => b.textContent = lang === 'ru' ? 'EN' : 'RU'); setWho(); $('#app').hidden || render(); i18n() });
let D = { clients: [], bookings: [], items: [], works: [], site: {} }, me = { role: 'editor' }, tab = 'home', q = '', fl = 'all', admins = [];
const canDel = () => me.role === 'super';
const NAV = [['home', 'Overview', '◔'], ['bookings', 'Bookings', '▤'], ['payments', 'Payments', '₽'], ['mani', 'Manicure', '✦'], ['pedi', 'Pedicure', '✧'], ['trt', 'Treatments', '❁'], ['gallery', 'Gallery', '▣'], ['site', 'Website', '⌂'], ['security', 'Security & Admins', '⚿']];
const CATS = { mani: 'Manicure', pedi: 'Pedicure', trt: 'Treatments' };
const client = b => D.clients.find(c => c.id === b.clientId) || { name: '—', phone: '' };

/* ---------- auth ---------- */
async function boot() {
  const { data } = await supabase.auth.getSession();
  data.session ? enter(data.session.user) : ($('#login').hidden = false);
}
$('#lf').onsubmit = async e => {
  e.preventDefault(); const f = e.target; $('#lbtn').disabled = true; $('#lerr').textContent = '';
  const { data, error } = await supabase.auth.signInWithPassword({ email: f.email.value.trim(), password: f.pass.value });
  $('#lbtn').disabled = false;
  if (error) return $('#lerr').textContent = 'Wrong email or password.';
  $('#login').hidden = true; enter(data.user);
};
async function enter(u) {
  const { data, error } = await supabase.from('admins').select('role').eq('id', u.id).maybeSingle();
  if (!error && !data) { await supabase.auth.signOut(); $('#login').hidden = false; return $('#lerr').textContent = 'This account has no dashboard access.'; }
  me = { id: u.id, email: u.email, role: error ? 'super' : data.role, setup: !!error };
  setWho();
  $('#login').hidden = true; $('#app').hidden = false; await load(); render();
}
$('#out').onclick = async () => { await supabase.auth.signOut(); location.reload() };
document.addEventListener('click', e => { if (!e.target.closest('.themebtn')) return; const h = document.documentElement; h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('dnAdminTheme', h.dataset.theme) } catch (x) { } });
const load = async () => {
  D = await fetchAll();
  // bookings created on the website have no price yet: copy it from the chosen service (once)
  await Promise.all(D.bookings.filter(b => !(+b.price > 0) && itemPrice(b.design) > 0).map(async b => { b.price = itemPrice(b.design); await saveBooking({ ...b }) }));
};

/* ---------- shell ---------- */
function render() {
  $('#nav').innerHTML = NAV.map(([k, l, i]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}"><i>${i}</i>${l}</button>`).join('');
  $('#title').textContent = (NAV.find(n => n[0] === tab) || [])[1];
  $('#view').innerHTML = V[tab]();
  if (tab === 'security') loadAdmins();
  i18n();
  $('#nav .on')?.scrollIntoView({ inline: 'center', block: 'nearest' });   // keep the active tab visible in the phone tab bar
}
$('#nav').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; render(); scrollTo(0, 0) } };

/* ---------- views ---------- */
const V = {};
V.home = () => {
  const bk = D.bookings, paid = bk.filter(isPaid), pend = bk.filter(b => !isPaid(b) && b.status !== 'cancelled');
  const now = new Date(), ms = [...Array(6)].map((_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return { k: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), l: d.toLocaleString(lang === 'ru' ? 'ru' : 'en', { month: 'short' }), v: 0 } });
  paid.forEach(b => { const s = String(b.paid).length > 4 ? b.paid : (b.date || b.created || ''); const m = ms.find(x => x.k === String(s).slice(0, 7)); if (m) m.v += P(b) });
  const mx = Math.max(...ms.map(m => m.v), 1), top = {};
  bk.forEach(b => top[b.design] = (top[b.design] || 0) + 1);
  const tl = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const st = s => bk.filter(b => b.status === s).length;
  return `<div class="grid">
    <div class="card kpi"><span>Revenue (paid)</span><b>${R(sum(paid))}</b></div>
    <div class="card kpi"><span>Pending payments</span><b>${R(sum(pend))}</b></div>
    <div class="card kpi"><span>Total bookings</span><b>${bk.length}</b></div>
    <div class="card kpi"><span>New requests</span><b>${st('new')}</b></div></div>
  <div class="two"><div class="card"><h3>Revenue · last 6 months</h3><div class="bars">${ms.map(m => `<div title="${R(m.v)}"><i style="height:${Math.max(m.v / mx * 100, 3)}%"></i>${m.l}</div>`).join('')}</div></div>
  <div class="card"><h3>Booking summary</h3>${[['new', 'New', ''], ['confirmed', 'Confirmed', 'wr'], ['done', 'Completed', 'ok'], ['cancelled', 'Cancelled', 'bd']].map(([k, l, c]) => `<div class="row"><span>${l}</span><span class="pill ${c}">${st(k)}</span></div>`).join('')}</div></div>
  <div class="two"><div class="card"><h3>Top services</h3>${tl.map(([n, c]) => `<div class="row"><span>${esc(n)}</span><b>${c}</b></div>`).join('') || '<p class="mut">No data yet.</p>'}</div>
  <div class="card"><h3>Latest bookings</h3>${bk.slice(0, 5).map(b => `<div class="row"><span>${esc(client(b).name)}<br><s>${esc(b.design)}</s></span><span class="pill ${isPaid(b) ? 'ok' : 'wr'}">${isPaid(b) ? 'Paid' : 'Unpaid'}</span></div>`).join('') || '<p class="mut">No bookings yet.</p>'}</div></div>`;
};

const STS = [['new', 'New'], ['confirmed', 'Confirmed'], ['done', 'Completed'], ['cancelled', 'Cancelled']];
V.bookings = () => {
  const l = D.bookings.filter(b => (fl === 'all' || b.status === fl) && (client(b).name + client(b).phone + b.design).toLowerCase().includes(q.toLowerCase()));
  return `<div class="tabs"><input id="q" placeholder="Search name, phone, service…" value="${esc(q)}" style="max-width:300px"><select id="fl" style="max-width:180px"><option value="all">All statuses</option>${STS.map(s => `<option value="${s[0]}" ${fl === s[0] ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></div>` +
    (l.map(b => { const c = client(b); return `<div class="card bk"><div class="top"><b>${esc(c.name)} ${b.id ? `<s>#${b.id}</s>` : ''}</b><span><span class="pill ${isPaid(b) ? 'ok' : 'wr'}">${isPaid(b) ? 'Paid' : 'Unpaid'}</span> <select data-st="${b.id}" style="width:auto">${STS.map(s => `<option value="${s[0]}" ${b.status === s[0] ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></span></div>
    <div class="meta"><span>Service: <b>${esc(b.design)}</b></span><span>Date: <b>${esc(b.date || 'any')}</b></span><span>Time: <b>${esc(b.time || '—')}</b></span><span>Phone: <b><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></b></span><span>Price: <b>${R(P(b))}</b></span></div>
    ${b.note ? `<p class="mut">“${esc(b.note)}”</p>` : ''}${(b.refs || []).length ? `<div class="th">${b.refs.map(u => `<img src="${esc(u)}" alt="">`).join('')}</div>` : ''}
    ${canDel() ? `<div><button class="sm d" data-del-bk="${b.id}">Delete</button></div>` : ''}</div>` }).join('') || '<p class="mut">No bookings found.</p>');
};

V.payments = () => {
  const p = D.bookings.filter(b => b.status !== 'cancelled'), paid = p.filter(isPaid), un = p.filter(b => !isPaid(b));
  const list = (a, ok) => a.map(b => `<div class="row"><span>${esc(client(b).name)}<br><s>${esc(b.design)} · ${esc(b.date || '')}</s></span>
    <span style="display:flex;gap:10px;align-items:center"><b>${R(P(b))}</b><button class="sm" data-pay="${b.id}">${ok ? 'Mark unpaid' : 'Mark paid'}</button>${canDel() ? `<button class="sm d" data-del-bk="${b.id}">Remove</button>` : ''}</span></div>`).join('') || '<p class="mut">Nothing here.</p>';
  return `<div class="grid"><div class="card kpi"><span>Received</span><b style="color:var(--ok)">${R(sum(paid))}</b></div><div class="card kpi"><span>Pending</span><b style="color:var(--warn)">${R(sum(un))}</b></div></div>
  <div class="two"><div class="card"><h3>Pending / unpaid (${un.length})</h3>${list(un, 0)}</div><div class="card"><h3>Paid (${paid.length})</h3>${list(paid, 1)}</div></div>`;
};

let svcView = 'cards';
const durOpts = m => { const l = [...new Set([0, ...Array.from({ length: 20 }, (_, i) => (i + 1) * 15), +m || 0])].sort((x, y) => x - y); return l.map(v => `<option value="${v}" ${v === (+m || 0) ? 'selected' : ''}>${fm(v)}</option>`).join('') };
const catView = k => () => {
  const l = D.items.filter(i => i.kind === 'Услуга' && i.cat === k);
  const pc = i => i.old > i.price ? Math.round((1 - i.price / i.old) * 100) : 0;
  const head = `<div class="tabs"><span class="mut">${l.length} services</span><span class="seg"><button class="sm ${svcView === 'cards' ? 'on' : ''}" data-vw="cards">Cards</button><button class="sm ${svcView === 'table' ? 'on' : ''}" data-vw="table">Table</button></span><button class="btn" data-new="${k}">+ Add service</button></div>`;
  if (svcView === 'table') return head + `<div class="card tw"><table class="tb"><thead><tr><th>Photo</th><th>Service</th><th>Price</th><th>Old price</th><th>Discount</th><th>Duration</th><th></th></tr></thead><tbody>${l.map(i => `<tr>
    <td>${i.img ? `<img src="${esc(i.img)}" alt="">` : '<div class="ph" style="width:56px;height:56px"></div>'}</td>
    <td><b>${esc(i.title)}</b><br><s>${esc(i.te || '')}</s></td>
    <td><input type="number" min="0" step="50" value="${+i.price || 0}" data-f="price" data-id="${i.id}"></td>
    <td><input type="number" min="0" step="50" value="${+i.old || 0}" data-f="old" data-id="${i.id}"></td>
    <td>${pc(i) ? `<span class="off">−${pc(i)}%</span>` : '—'}</td>
    <td><select data-f="dur" data-id="${i.id}">${durOpts(i.dur)}</select></td>
    <td class="ac"><button class="sm" data-edit="${i.id}">Edit</button>${canDel() ? `<button class="sm d" data-del-it="${i.id}">Delete</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
  return head + `<div class="grid">${l.map(i => `<div class="card it">${i.img ? `<img src="${esc(i.img)}" alt="">` : '<div class="ph"></div>'}<div class="b"><b>${esc(i.title)}</b><span class="mut">${esc((i.desc || '').slice(0, 90))}</span><div>${R(i.price)} ${pc(i) ? `<s>${R(i.old)}</s> <span class="off">−${pc(i)}%</span>` : ''} ${i.dur ? `<span class="pill">${fm(i.dur)}</span>` : ''}</div></div>
    <div class="a"><button class="sm" data-edit="${i.id}">Edit</button>${canDel() ? `<button class="sm d" data-del-it="${i.id}">Delete</button>` : ''}</div></div>`).join('')}</div>`;
};
V.mani = catView('mani'); V.pedi = catView('pedi'); V.trt = catView('trt');

V.gallery = () => `<div class="tabs"><span class="mut">${D.works.length} works</span><label class="btn" style="cursor:pointer">+ Upload photos<input id="wup" type="file" accept="image/*" multiple hidden></label></div>
  <div id="wdrop" class="note" style="text-align:center;border:2px dashed var(--line);cursor:pointer">Drop many photos here, or click to select several at once</div><p id="wprog" class="mut" hidden></p>
  <div class="grid">${D.works.map(w => `<div class="card it"><img src="${esc(w.img)}" alt=""><div class="b"><b>${esc(w.title)}</b></div><div class="a"><button class="sm" data-edit-w="${w.id}">Edit</button>${canDel() ? `<button class="sm d" data-del-w="${w.id}">Delete</button>` : ''}</div></div>`).join('')}</div>`;

const SF = [['hero', 'Hero text (RU)'], ['heroe', 'Hero text (EN)'], ['role', 'Master role (RU)'], ['rolee', 'Master role (EN)'], ['atext', 'About text (RU)', 1], ['atexte', 'About text (EN)', 1], ['addr', 'Address (RU)'], ['addre', 'Address (EN)'], ['hint', 'Address hint (RU)'], ['hinte', 'Address hint (EN)'], ['phone', 'Phone'], ['wa', 'WhatsApp number'], ['vk', 'VK link'], ['call', 'Header button (RU)'], ['calle', 'Header button (EN)']];
V.site = () => { const s = D.site || {}; const img = (k, l) => `<label>${l}<input name="${k}" value="${esc(s[k])}" placeholder="Image URL"><input type="file" accept="image/*" data-img="${k}"></label>`;
  return `<form class="card f" id="sf"><div class="note">Changes appear on the live website right after saving. Leave a field empty to keep the default text.</div><div class="c2">${img('himg', 'Hero image')}${img('mimg', 'Master photo')}</div>
  <div class="c2">${SF.map(([k, l, t]) => `<label>${l}${t ? `<textarea name="${k}" rows="3">${esc(s[k])}</textarea>` : `<input name="${k}" value="${esc(s[k])}">`}</label>`).join('')}</div><button class="btn">Save website changes</button></form>`; };

V.security = () => `${me.setup ? '<div class="note">Admins table not found — run admin.sql in Supabase to enable roles.</div>' : ''}
  <div class="two"><form class="card f" id="pf"><h3>Change my password</h3><label>New password<input name="p1" type="password" minlength="6" required></label><label>Repeat password<input name="p2" type="password" minlength="6" required></label><button class="btn">Update password</button></form>
  ${canDel() ? `<form class="card f" id="af"><h3>Add an administrator</h3><label>Email<input name="email" type="email" required></label><label>Password (min 6)<input name="pass" type="password" minlength="6" required></label><label>Role<select name="role"><option value="editor">Editor — edits content, cannot delete</option><option value="super">Super admin — full access</option></select></label><button class="btn">Add admin</button></form>` : '<div class="card"><h3>Admins</h3><p class="mut">Only the super admin can add or remove administrators.</p></div>'}</div>
  <div class="card" style="margin-top:16px"><h3>Administrators</h3><div id="alist"><p class="mut">Loading…</p></div></div>`;
async function loadAdmins() {
  const { data } = await supabase.from('admins').select('*').order('created_at'); admins = data || [];
  const el = $('#alist'); if (el) el.innerHTML = admins.map(a => `<div class="row"><span>${esc(a.email)} ${a.id === me.id ? '<s>(you)</s>' : ''}</span><span><span class="pill ${a.role === 'super' ? '' : 'wr'}">${a.role === 'super' ? 'Super admin' : 'Editor'}</span> ${canDel() && a.role !== 'super' ? `<button class="sm d" data-rm="${a.id}">Remove</button>` : ''}</span></div>`).join('') || '<p class="mut">No admins yet.</p>';
  if (el) i18n(el);
}

/* ---------- modal editors ---------- */
const dlg = $('#dlg');
function modal(html, onSave) {
  dlg.innerHTML = `<form class="f" method="dialog" novalidate>${html}<div class="c2"><button class="ghost" type="button" id="dx">Cancel</button><button class="btn">Save</button></div></form>`;
  dlg.showModal(); i18n(dlg); $('#dx').onclick = () => dlg.close();
  dlg.querySelector('form').onsubmit = async e => { e.preventDefault(); const b = e.submitter; b.disabled = true; try { await onSave(Object.fromEntries(new FormData(e.target))) ; dlg.close(); await load(); render() } catch (x) { toast('Error: ' + x.message) } b.disabled = false };
  dlg.querySelectorAll('input[type=file][data-up]').forEach(f => f.onchange = async () => { toast('Uploading…'); const u = await uploadPhoto(f.files[0], 'items'); if (u) { dlg.querySelector('[name=img]').value = u; dlg.querySelector('.ph2').src = u } });
  const pv = dlg.querySelector('.ph2');
  if (pv) { const g = n => dlg.querySelector(`[name=${n}]`), upd = () => { pv.style.aspectRatio = g('ratio').value || '4/3'; pv.style.objectFit = g('fit').value; pv.style.objectPosition = g('pos').value }; ['ratio', 'fit', 'pos'].forEach(n => g(n).onchange = upd) }
  const dh = dlg.querySelector('#dh');
  if (dh) {
    const dn = dlg.querySelector('#dmn'), dv = dlg.querySelector('[name=dur]'), tx = dlg.querySelector('#dtxt');
    const show = () => { const m = +dv.value || 0; dh.value = Math.floor(m / 60); dn.value = m % 60; tx.textContent = (lang === 'ru' ? 'Длительность: ' : 'Duration: ') + fm(m) };
    const fromInputs = () => { dv.value = Math.max(0, (+dh.value || 0) * 60 + (+dn.value || 0)); tx.textContent = (lang === 'ru' ? 'Длительность: ' : 'Duration: ') + fm(+dv.value) };
    dh.oninput = dn.oninput = fromInputs;
    dlg.querySelectorAll('[data-dm]').forEach(b => b.onclick = () => { dv.value = b.dataset.dm; show() });
    show();
  }
  const o = dlg.querySelector('[name=old]'), p = dlg.querySelector('[name=price]'), d = dlg.querySelector('#dsc');
  if (d) d.oninput = () => { if (!o.value) o.value = p.value; p.value = Math.round(o.value * (1 - d.value / 100)) };
}
const RAT = [['', 'Default'], ['1/1', 'Square 1:1'], ['4/3', 'Landscape 4:3'], ['16/9', 'Wide 16:9'], ['3/4', 'Portrait 3:4'], ['4/5', 'Portrait 4:5']];
const FIT = [['cover', 'Fill (crop)'], ['contain', 'Whole photo']];
const POS = [['center', 'Center'], ['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']];
const opts = (l, v) => l.map(([k, n]) => `<option value="${k}" ${k === (v || l[0][0]) ? 'selected' : ''}>${n}</option>`).join('');
const imgField = (u, o = {}) => `<div class="pvwrap"><img class="ph2" src="${esc(u || '')}" alt="" style="aspect-ratio:${o.ratio || '4/3'};object-fit:${o.fit || 'cover'};object-position:${o.pos || 'center'}"></div>
  <input name="img" type="hidden" value="${esc(u || '')}"><input type="file" accept="image/*" data-up>
  <div class="c3"><label>Photo size<select name="ratio">${opts(RAT, o.ratio)}</select></label><label>Fit<select name="fit">${opts(FIT, o.fit)}</select></label><label>Position<select name="pos">${opts(POS, o.pos)}</select></label></div>`;
function itemModal(it, cat) {
  it = it || {};
  modal(`<h3>${it.id ? 'Edit' : 'New'} service · ${CATS[cat]}</h3>${imgField(it.img, it)}
  <div class="c2"><label>Title (RU)<input name="title" value="${esc(it.title)}" required></label><label>Title (EN)<input name="te" value="${esc(it.te)}"></label></div>
  <label>Description (RU)<textarea name="desc" rows="2">${esc(it.desc)}</textarea></label><label>Description (EN)<textarea name="de" rows="2">${esc(it.de)}</textarea></label>
  <div class="c2"><label>Price, ₽<input name="price" type="number" min="0" step="50" value="${it.price || 0}"></label><label>Old price, ₽ (for discount)<input name="old" type="number" min="0" step="50" value="${it.old || 0}"></label></div>
  <label>Discount % (auto-fills price)<input id="dsc" type="number" min="0" max="90" step="5" placeholder="e.g. 20"></label>
  <div class="durbox"><b>Duration</b><div class="qk"><span class="mut">Quick pick</span>${[30, 60, 90, 120, 180].map(m => `<button type="button" class="sm" data-dm="${m}">${fm(m)}</button>`).join('')}</div>
  <div class="c2"><label>Hours<input id="dh" type="number" min="0" max="12" step="1"></label><label>Minutes<input id="dmn" type="number" min="0" max="55" step="5"></label></div>
  <input type="hidden" name="dur" value="${+it.dur || 0}"><p class="dtxt mut" id="dtxt"></p></div>`,
    async v => { if (!String(v.title || '').trim()) throw new Error('Title is required'); if (!await saveItem({ ...it, ...v, price: +v.price, old: +v.old, dur: +v.dur, kind: 'Услуга', cat })) throw new Error('save failed') });
}
function workModal(w) {
  modal(`<h3>Edit photo</h3>${imgField(w.img, w)}<div class="c2"><label>Title (RU)<input name="title" value="${esc(w.title)}"></label><label>Title (EN)<input name="te" value="${esc(w.te)}"></label></div>`, async v => { if (!await saveWork({ ...w, ...v })) throw new Error('save failed') });
}

/* ---------- actions ---------- */
const ask = m => confirm(tr(m));
const fm = m => { const h = Math.floor(m / 60), r = m % 60, u = lang === 'ru' ? ['ч', 'мин'] : ['h', 'min']; return [h && h + ' ' + u[0], r && r + ' ' + u[1]].filter(Boolean).join(' ') || '—' };
const byId = (a, id) => a.find(x => String(x.id) === String(id));
async function setPaid(b) {
  const on = !isPaid(b), row = { ...b, paid: on ? new Date().toISOString().slice(0, 10) : null, status: b.status === 'paid' && !on ? 'confirmed' : b.status };
  let r = await saveBooking(row); if (!r && on) r = await saveBooking({ ...row, paid: true }); if (!r) throw new Error('save failed');
}
/* ---------- bulk upload for Gallery: many photos at once (3 in parallel) ---------- */
async function uploadWorks(fileList) {
  const files = [...fileList].filter(f => f.type.startsWith('image/'));
  if (!files.length) return toast('Choose images');
  const prog = $('#wprog'); let done = 0, ok = 0, bad = 0;
  const upd = () => { if (prog) { prog.hidden = false; prog.textContent = `Uploading ${done} / ${files.length}…` } };
  upd();
  const queue = [...files];
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift();
      try { const u = await uploadPhoto(f, 'works'); if (u && await saveWork({ img: u, title: '', te: '' })) ok++; else bad++ } catch (e) { console.error(e); bad++ }
      done++; upd();
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  await load(); render();
  toast(bad ? `Added ${ok}, failed ${bad}` : `Photos added: ${ok}`);
}
const view = $('#view');
view.addEventListener('click', e => { if (e.target.closest('#wdrop')) $('#wup').click() });
['dragenter', 'dragover'].forEach(v => view.addEventListener(v, e => { if (e.target.closest('#wdrop')) { e.preventDefault(); e.target.closest('#wdrop').style.borderColor = 'var(--acc)' } }));
['dragleave', 'drop'].forEach(v => view.addEventListener(v, e => { const z = e.target.closest('#wdrop'); if (z) { e.preventDefault(); z.style.borderColor = '' } }));
view.addEventListener('drop', e => { if (e.target.closest('#wdrop')) uploadWorks(e.dataTransfer.files) });
view.onclick = async e => {
  if (e.target.closest('[data-vw]')) { svcView = e.target.closest('[data-vw]').dataset.vw; return render() }
  const im = e.target.closest('.th img, .it > img, .tb img'); if (im) { $('#lbi').src = im.src; return $('#lb').showModal() }
  const g = a => e.target.closest(`[${a}]`), c = n => g(n) && g(n).getAttribute(n);
  try {
    if (c('data-new')) return itemModal(null, c('data-new'));
    if (c('data-edit')) return itemModal(byId(D.items, c('data-edit')), tab);
    if (c('data-edit-w')) return workModal(byId(D.works, c('data-edit-w')));
    if (c('data-del-it') && ask('Delete this service?')) await deleteItem(c('data-del-it'));
    else if (c('data-del-w') && ask('Delete this photo?')) await deleteWork(c('data-del-w'));
    else if (c('data-del-bk') && ask('Delete this booking?')) await deleteBooking(c('data-del-bk'));
    else if (c('data-pay')) await setPaid(byId(D.bookings, c('data-pay')));
    else if (c('data-rm') && ask('Remove this administrator?')) { const { error } = await supabase.rpc('remove_admin', { p_id: c('data-rm') }); if (error) throw error; toast('Removed'); return loadAdmins() }
    else return;
    await load(); render();
  } catch (x) { toast('Error: ' + x.message) }
};
view.onchange = async e => {
  const t = e.target;
  try {
    if (t.dataset.f) { const it = byId(D.items, t.dataset.id); await saveItem({ ...it, [t.dataset.f]: +t.value || 0 }); await load(); render(); return toast('Saved') }
    if (t.id === 'fl') { fl = t.value; return render() }
    if (t.dataset.st) { const b = byId(D.bookings, t.dataset.st); await saveBooking({ ...b, status: t.value }); await load(); render(); toast('Status updated') }
    if (t.dataset.price) { const b = byId(D.bookings, t.dataset.price); await saveBooking({ ...b, price: +t.value || 0 }); await load(); render(); toast('Price saved') }
    if (t.id === 'wup') { const fl2 = [...t.files]; t.value = ''; return uploadWorks(fl2) }
    if (t.dataset.img) { toast('Uploading…'); const u = await uploadPhoto(t.files[0], 'site'); if (u) { t.closest('label').querySelector('input[name]').value = u; toast('Uploaded — now save') } }
  } catch (x) { toast('Error: ' + x.message) }
};
view.oninput = e => { if (e.target.id === 'q') { q = e.target.value; const p = e.target.selectionStart; render(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p) } };
view.onsubmit = async e => {
  e.preventDefault(); const f = e.target, v = Object.fromEntries(new FormData(f));
  try {
    if (f.id === 'sf') { const { error } = await saveSite({ ...D.site, ...v }); if (error) throw error; await load(); toast('Saved — live on the site') }
    if (f.id === 'pf') { if (v.p1 !== v.p2) return toast('Passwords do not match'); const { error } = await supabase.auth.updateUser({ password: v.p1 }); if (error) throw error; f.reset(); toast('Password updated') }
    if (f.id === 'af') {
      const tmp = createClient(supabase.supabaseUrl, supabase.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await tmp.auth.signUp({ email: v.email, password: v.pass }); if (error) throw error;
      const { error: e2 } = await supabase.rpc('register_admin', { p_id: data.user.id, p_email: v.email, p_role: v.role }); if (e2) throw e2;
      f.reset(); toast('Administrator added'); loadAdmins();
    }
  } catch (x) { toast('Error: ' + x.message) }
};
boot();
$('#eye').onclick = () => { const i = $('#lf').pass; i.type = i.type === 'password' ? 'text' : 'password'; $('#eye').textContent = i.type === 'password' ? 'Show' : 'Hide'; i18n() };
document.querySelectorAll('.langbtn').forEach(b => b.textContent = lang === 'ru' ? 'EN' : 'RU'); i18n();
$('#lb').onclick = () => $('#lb').close();
