"use strict";
/* ==========================================================
   gallery.js — "Our work" page: photo grid + numbered pages
   ========================================================== */
import { onReady, db, esc, en, t, imgSt, WSEED } from './common.js';

const PER = 8;                                   // photos per page
const grid = document.getElementById('gallery-grid');
const pager = document.getElementById('pagination');
const gtop = document.getElementById('gtop');
let page = Math.max(1, parseInt(new URLSearchParams(location.search).get('p'), 10) || 1);

const list = () => { const w = db().works || []; return w.length ? w : WSEED };

function render(scroll) {
  const all = list(), pages = Math.max(1, Math.ceil(all.length / PER));
  page = Math.min(Math.max(page, 1), pages);

  document.getElementById('gcount').textContent = all.length ? t('gal.count', all.length) : '';
  document.getElementById('gempty').hidden = all.length > 0;

  grid.innerHTML = all.slice((page - 1) * PER, page * PER).map(w => {
    const ti = en() && w.te ? w.te : w.title;
    return `<figure class="w"><img style="${w.ratio ? `aspect-ratio:${esc(w.ratio)};` : ''}${imgSt(w)}" src="${esc(w.img)}" alt="${esc(ti)}" loading="lazy" onerror="this.closest('figure').remove()"><figcaption>${esc(ti)}</figcaption></figure>`;
  }).join('');

  // Numbers appear only when there is more than one page
  if (pages < 2) { pager.innerHTML = ''; }
  else {
    const btn = (n, label, extra = '') => `<button type="button" data-p="${n}" ${extra}>${label}</button>`;
    let h = btn(page - 1, '‹', `aria-label="${esc(t('gal.prev'))}"${page === 1 ? ' disabled' : ''}`);
    for (let i = 1; i <= pages; i++) h += btn(i, i, i === page ? 'class="active" aria-current="page"' : '');
    h += btn(page + 1, '›', `aria-label="${esc(t('gal.next'))}"${page === pages ? ' disabled' : ''}`);
    pager.innerHTML = h;
  }

  const u = new URL(location.href); page > 1 ? u.searchParams.set('p', page) : u.searchParams.delete('p');
  history.replaceState(null, '', u);
  if (scroll) gtop.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

pager.onclick = e => {
  const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return;
  page = +b.dataset.p; render(true);
};

/* lightbox */
/* phone: 1st tap shows the title, 2nd tap opens the big photo. desktop: hover shows the title, click opens. */
const touch = matchMedia('(hover:none)');
grid.onclick = e => {
  const f = e.target.closest('.w'); if (!f) return;
  if (touch.matches && !f.classList.contains('show')) {
    grid.querySelectorAll('.w.show').forEach(x => x.classList.remove('show'));
    f.classList.add('show'); return;
  }
  const i = f.querySelector('img'), lbi = document.getElementById('lbi'); lbi.src = i.src; lbi.alt = i.alt; document.getElementById('lb').showModal();
};
document.addEventListener('click', e => { if (!e.target.closest('.w')) grid.querySelectorAll('.w.show').forEach(x => x.classList.remove('show')) });
document.getElementById('lb').onclick = () => document.getElementById('lb').close();

window.onLang = () => render(false);
window.addEventListener('db-updated', () => render(false));
onReady(() => render(false));
