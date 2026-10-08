"use strict";
/* ==========================================================
   script.js — home page (Supabase version)
   ========================================================== */
import { uploadPhoto, createBooking } from './db.js';

/* ---------- Hero glow follows the pointer ---------- */
$("#hero").onpointermove = e => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px");
  e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px");
};

/* ---------- Catalog: manicure, pedicure, treatment, gallery ---------- */
const CAT_UI = {
  mani: { sec: "#services",  nav: "#nsvc", box: "#svc", more: "#svc-more", label: "nav.svc" },
  pedi: { sec: "#pedicure",  nav: "#nped", box: "#ped", more: "#ped-more", label: "nav.ped" },
  trt:  { sec: "#treatment", nav: "#ntrt", box: "#trt", more: "#trt-more", label: "nav.trt" }
};
const catPager = {};
for (const [k, u] of Object.entries(CAT_UI))
  catPager[k] = mkPager({ box: $(u.box), btn: $(u.more), page: 4, onMore: renderCatalog });

/* الخدمات تأتي من قاعدة البيانات (حسب حقل القسم cat).
   إذا لم يُحدَّد أي قسم بعد في لوحة الأدمن، تُعرض القائمة الافتراضية بنفس الصور الحالية. */
const hasCats = d => d.items.some(i => i.kind === "Услуга" && ["mani", "pedi", "trt"].includes(i.cat));
const catItems = (d, k) => {
  if (hasCats(d)) return d.items.filter(i => i.kind === "Услуга" && catOf(i) === k);
  const pool = d.items.filter(i => i.kind === "Услуга" && i.img);
  const src = pool.length ? pool : SEED.filter(i => i.kind === "Услуга");
  return SERVICES.filter(x => x.cat === k).map((x, i) => {
    const p = src[i % src.length];
    return { ...x, img: p.img, ratio: p.ratio, fit: p.fit, pos: p.pos };
  });
};

function renderCatalog() {
  const d = db(), groups = {};
  for (const [k, u] of Object.entries(CAT_UI)) {
    groups[k] = catItems(d, k);
    catPager[k].draw(groups[k], card);
    $(u.sec).hidden = !groups[k].length;
    const n = $(u.nav); if (n) n.hidden = !groups[k].length;
  }
  buildDesignSelect(groups);
}

const designMap = {};
function syncDD() {
  const it = designMap[$("#design").value], lb = $("#ddlabel");
  lb.textContent = it ? ttl(it) : t("f.design.ph");
  $("#ddbtn").classList.toggle("ph", !it);
  $$("#ddlist .dd-o").forEach(o => o.setAttribute("aria-selected", String(o.dataset.v === $("#design").value)));
}
function showPrice() {
  syncDD();
  $("#dfld").classList.remove("bad");
  const box = $("#dprice"), it = designMap[$("#design").value];
  if (!it || !it.price) { box.hidden = true; return; }
  box.innerHTML = `<div class="dp-s"><span>${esc(t("f.sel"))}</span><strong>${esc(ttl(it))}</strong></div>` +
    `<div class="dp-row">` +
    (it.dur ? `<div class="dp-c"><span>${esc(t("f.dur"))}</span><em class="dur-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${esc(fmtDur(it.dur))}</em></div>` : "") +
    `<div class="dp-c dp-p"><span>${esc(t("f.price"))}</span><b>${fmt(it.price)}</b>${it.old > it.price ? `<s>${fmt(it.old)}</s>` : ""}</div></div>`;
  box.hidden = false;
}

function buildDesignSelect(groups) {
  const s = $("#design"), v = s.value;
  s.innerHTML = "";
  for (const k in designMap) delete designMap[k];
  for (const [k, u] of Object.entries(CAT_UI)) {
    if (!groups[k].length) continue;
    const g = document.createElement("optgroup"); g.label = t(u.label);
    groups[k].forEach(it => designMap[it.title] = it);
    groups[k].forEach(it => g.append(new Option(ttl(it) + (it.price ? " — " + fmt(it.price) : ""), it.title)));
    s.append(g);
  }
  const ph = new Option(t("f.design.ph"), "", true, true); ph.disabled = true; s.prepend(ph);
  s.value = designMap[v] ? v : "";
  buildDD(groups);
  showPrice();
}

/* ---------- Custom, modern services dropdown (the native <select> stays as the hidden value holder) ---------- */
const ddEl = $("#dd"), ddBtn = $("#ddbtn"), ddList = $("#ddlist");
function buildDD(groups) {
  let h = "";
  for (const [k, u] of Object.entries(CAT_UI)) {
    if (!groups[k].length) continue;
    h += `<div class="dd-g">${esc(t(u.label))}</div>` + groups[k].map(it =>
      `<button type="button" class="dd-o" role="option" data-v="${esc(it.title)}"><span class="n">${esc(ttl(it))}${it.dur ? `<small>${esc(fmtDur(it.dur))}</small>` : ""}</span><b>${it.price ? fmt(it.price) : ""}</b></button>`).join("");
  }
  ddList.innerHTML = h;
}
const ddOpen = o => { ddList.hidden = !o; ddEl.classList.toggle("open", o); ddBtn.setAttribute("aria-expanded", String(o)); };
ddBtn.onclick = () => ddOpen(ddList.hidden);
ddList.onclick = e => {
  const o = e.target.closest(".dd-o"); if (!o) return;
  $("#design").value = o.dataset.v; showPrice(); ddOpen(false); ddBtn.focus();
};
document.addEventListener("click", e => { if (!ddEl.contains(e.target)) ddOpen(false) });
document.addEventListener("keydown", e => { if (e.key === "Escape") ddOpen(false) });


/* ---------- Our work: first 5 photos + "Show more" → gallery page ---------- */
const mq = matchMedia('(max-width:760px)');
const hwN = () => mq.matches ? 2 : 5;      // phone: 2 photos only, desktop: 5
function renderWorks() {
  const w = db().works || [], all = w.length ? w : WSEED;
  $("#works").hidden = !all.length;
  $("#hworks").innerHTML = all.slice(0, hwN()).map(x => {
    const ti = en() && x.te ? x.te : x.title;
    return `<figure class="w"><img style="${imgSt(x)}" src="${esc(x.img)}" alt="${esc(ti)}" loading="lazy" onerror="this.closest('figure').remove()"><figcaption>${esc(ti)}</figcaption></figure>`;
  }).join("");
  $("#works-more").hidden = all.length <= hwN();     // button only when there are more photos than shown
}
mq.addEventListener('change', renderWorks);
/* phone: 1st tap shows the title, 2nd tap opens the big photo. desktop: hover shows the title, click opens. */
const touch = matchMedia("(hover:none)");
$("#hworks").onclick = e => {
  const f = e.target.closest(".w"); if (!f) return;
  if (touch.matches && !f.classList.contains("show")) {
    $$("#hworks .w.show").forEach(x => x.classList.remove("show"));
    f.classList.add("show"); return;
  }
  const i = f.querySelector("img"); $("#lbi").src = i.src; $("#lbi").alt = i.alt; $("#lb").showModal();
};
document.addEventListener("click", e => { if (!e.target.closest("#hworks .w")) $$("#hworks .w.show").forEach(x => x.classList.remove("show")) });
$("#lb").onclick = () => $("#lb").close();

window.onLang = () => { renderCatalog(); renderWorks(); };
window.addEventListener('db-updated', () => { renderCatalog(); renderWorks(); applySite(); });

/* ---------- Inspiration photos (max 3, click or drag & drop) ---------- */
let refs = [];
const up = $("#up"), rin = $("#ref");
function addRefs(list) {
  [...list].filter(f => f.type.startsWith("image/")).forEach(f => { if (refs.length < 3) refs.push(f) });
  $("#prev").innerHTML = refs.map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join("");
}
up.onclick = () => rin.click();
up.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rin.click() } };
rin.onchange = () => { addRefs(rin.files); rin.value = "" };
["dragenter", "dragover"].forEach(v => up.addEventListener(v, e => { e.preventDefault(); up.classList.add("over") }));
["dragleave", "drop"].forEach(v => up.addEventListener(v, e => { e.preventDefault(); up.classList.remove("over") }));
up.addEventListener("drop", e => addRefs(e.dataTransfer.files));

/* ---------- Booking form → Supabase → success page ---------- */
$("[name=date]").min = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

$("#form").onsubmit = async e => {
  e.preventDefault();
  const f = e.target, name = f.name.value.trim(), phone = f.phone.value.trim();
  const nameOk = name.length > 1, phoneOk = phone.replace(/\D/g, "").length >= 10 && /^[+\d\s()\-]+$/.test(phone);
  f.name.closest("label").classList.toggle("bad", !nameOk);
  f.phone.closest("label").classList.toggle("bad", !phoneOk);
  const designOk = !!designMap[f.design.value], timeEl = f.querySelector("[name=time]:checked");
  $("#dfld").classList.toggle("bad", !designOk);
  if (!nameOk || !phoneOk) return (nameOk ? f.phone : f.name).focus();
  if (!designOk) return ddBtn.focus();
  if (!timeEl) return toast(t("f.time.er"));

  const btn = $("#send"); btn.disabled = true; btn.classList.add("loading"); btn.textContent = t("f.sending");
  const ld = busy(t("load.send"));            // overlay appears only if the wait lasts > 250ms

  try {
    if (!navigator.onLine) throw new Error("offline");
    const photos = [];
    for (let i = 0; i < refs.length; i++) {
      ld.set(t("load.photo", i + 1, refs.length));
      const url = await uploadPhoto(refs[i], 'refs');
      if (url) photos.push(url);
    }
    ld.set(t("load.send"));
    const time = timeEl.value;
    const id = await Promise.race([
      createBooking({ name, phone, design: f.design.value, date: f.date.value, time, note: f.note.value.trim(), photos }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 30000))
    ]);

    try {
      sessionStorage.setItem("dnLast", JSON.stringify({
        id, name, phone, design: f.design.value,
        date: f.date.value, time, note: f.note.value.trim()
      }));
    } catch (err) { }

    ld.done();                                // no loader on success: go straight to the success page
    go("success.html");
  } catch (err) {
    console.error(err);
    ld.done();
    toast(t(!navigator.onLine ? "net.off" : "f.err"));
    btn.disabled = false; btn.classList.remove("loading"); btn.textContent = t("f.submit");
  }
};

/* ---------- Start ---------- */
document.addEventListener("click", e => { if (e.target.closest("[data-pick]")) setTimeout(showPrice, 0) });
onReady(() => {
  renderCatalog(); renderWorks();
  // arriving with #book (e.g. from the Work page): jump to the form once the page has its final layout
  const jump = () => { const el = location.hash && document.querySelector(location.hash); if (el) el.scrollIntoView({ behavior: "instant" }) };
  if (location.hash) { jump(); requestAnimationFrame(() => requestAnimationFrame(jump)); }
  initNavSpy();
  const pre = new URLSearchParams(location.search).get("pick");
  if (pre && [...$("#design").options].some(o => o.value === pre)) $("#design").value = pre;
  showPrice();
  document.body.classList.add("ready");
});

/* ---------- Highlight the current section in the header menu ----------
   لا يتحرك التمييز أثناء التمرير إلى Book now؛ يبقى بدون تمييز. */
function initNavSpy() {
  const ids = ["hero", "services", "pedicure", "treatment", "about", "book"];
  let lock = false, idle;
  const clear = () => $$("nav.main a").forEach(a => a.removeAttribute("aria-current"));
  const update = () => {
    if (lock) return;
    const y = innerHeight / 2; let cur = null;
    for (const id of ids) {
      const el = document.getElementById(id); if (!el || el.hidden) continue;
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) cur = id;
    }
    clear();
    if (!cur || cur === "book") return;
    const a = $(`nav.main a[href$="#${cur === "hero" ? "top" : cur}"]`);
    if (a) a.setAttribute("aria-current", "location");
  };
  const unlockSoon = () => { clearTimeout(idle); idle = setTimeout(() => { lock = false; update(); }, 160); };
  document.addEventListener("click", e => {
    if (!e.target.closest('a[href$="#book"]')) return;
    lock = true; clear(); unlockSoon();            // fallback if no scrolling happens
  });
  addEventListener("scroll", () => { if (lock) unlockSoon(); else update(); }, { passive: true });
  update();
}
