"use strict";
/* ==========================================================
   success.js — "Request sent" page (reads the booking saved by script.js)
   ========================================================== */
import { onReady, db, esc, en, t, fmt, ttl, waNum, SERVICES } from './common.js';

let last = null;
try { last = JSON.parse(sessionStorage.getItem('dnLast') || 'null'); } catch (e) { }

const ADDR = 'ул. Орджоникидзе, 33, Керчь';
const $ = s => document.querySelector(s);

const itemOf = d => (db().items || []).find(i => i.title === d) || SERVICES.find(i => i.title === d) || null;

function fmtDate(iso) {
  if (!iso) return t('ok.anydate');
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString(en() ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function render() {
  const name = last && last.name ? last.name.split(' ')[0] : '';
  $('#oktext').textContent = name ? t('ok.p', name) : t('ok.p0');

  const no = $('#okno');
  no.hidden = !(last && last.id);
  if (last && last.id) no.textContent = t('ok.no') + ' ' + last.id;

  const card = $('#okcard');
  card.hidden = !last;
  if (!last) return;

  const it = itemOf(last.design);
  const rows = [
    [t('ok.design'), it ? ttl(it) : last.design],
    [t('ok.date'), fmtDate(last.date)],
    [t('ok.time'), last.time],
    [t('ok.phone'), last.phone]
  ];
  if (it && it.price) rows.push([t('ok.price'), fmt(it.price), 'pr']);
  if (last.note) rows.push([t('ok.note'), last.note]);
  $('#oklist').innerHTML = rows.filter(r => r[1]).map(r =>
    `<div class="ok-row ${r[2] || ''}"><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('');

  const msg = en()
    ? `Hello! I'm ${last.name}. I booked: ${last.design}, ${fmtDate(last.date)}, ${last.time}.`
    : `Здравствуйте! Я ${last.name}. Записалась: ${last.design}, ${fmtDate(last.date)}, ${last.time}.`;
  $('#okwa').href = 'https://wa.me/' + waNum() + '?text=' + encodeURIComponent(msg + (last.id ? ` (№${last.id})` : ''));
  $('#okcal').hidden = !last.date;
}

$('#okmap').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Керчь улица Орджоникидзе 33');

/* Add to calendar (.ics) */
$('#okcal').onclick = () => {
  if (!last || !last.date) return;
  const m = (last.time || '').match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
  const day = last.date.replace(/-/g, '');
  const p = n => String(n).padStart(2, '0');
  const st = m ? `${day}T${p(m[1])}${m[2]}00` : `${day}T100000`;
  const en_ = m ? `${day}T${p(m[3])}${m[4]}00` : `${day}T110000`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Darya Nails//EN', 'BEGIN:VEVENT',
    `UID:${Date.now()}@daryanails`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
    `DTSTART:${st}`, `DTEND:${en_}`, `SUMMARY:Darya Nails — ${last.design}`, `LOCATION:${ADDR}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'darya-nails.ics'; a.click(); URL.revokeObjectURL(a.href);
};

window.onLang = render;
window.addEventListener('db-updated', render);
onReady(render);
