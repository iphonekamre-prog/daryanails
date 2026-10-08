"use strict";
/* ==========================================================
   common.js — Helpers, i18n, Supabase store, Realtime, Chrome
   ========================================================== */
import { fetchAll, fetchPublic, supabase } from './db.js';

/* ---------- 1. Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const PAGE = document.body.dataset.page || "home";
const HOME = PAGE === "home" ? "" : "index.html";
const ANY = "Любое удобное время", OWN = "Свой дизайн";
const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const imgSt = o => `object-fit:${esc(o.fit || "cover")};object-position:${esc(o.pos || "center")}`;
const toast = m => { const x = document.createElement("div"); x.className = "toast"; x.setAttribute("role", "status"); x.textContent = m; document.body.append(x); setTimeout(() => x.remove(), 3500) };
const shrink = (f, m = 700) => new Promise(r => { const i = new Image(); i.onload = () => { const k = Math.min(1, m / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); r(c.toDataURL("image/jpeg", .8)) }; i.src = URL.createObjectURL(f) });

/* ---------- 2. Translations ---------- */
const L = {
  "brand.sub": ["Дарья Нейлс", "Nail studio"],
  "nav.home": ["Главная", "Home"], "nav.svc": ["Маникюр", "Manicure"], "nav.ped": ["Педикюр", "Pedicure"], "nav.trt": ["Уход", "Treatment"],
  "hero.tags.aria": ["Направления", "Services"], "price.ask": ["По запросу", "On request"],  "title.gallery": ["Darya Nails — Наши работы", "Darya Nails — Our work"],
  "gallery.back": ["← На главную", "← Back to home"],
  "gal.eyebrow": ["Портфолио", "Portfolio"], "gal.desc": ["Каждая работа — это индивидуальный дизайн, созданный вручную: от нежного нюда до выразительного нейл-арта. Здесь собраны реальные результаты наших клиентов — вдохновляйтесь и приносите свои идеи.", "Every set is a one-of-a-kind design, made by hand — from a soft nude to bold nail art. These are real results from our clients: get inspired and bring your own ideas."],
  "gal.k1": ["Авторский дизайн", "Signature design"], "gal.k2": ["Стойкое покрытие", "Long-wear finish"], "gal.k3": ["Безупречная форма", "Flawless shape"],
  "gal.k1d": ["Уникальный рисунок под ваш образ", "A unique design made for your look"], "gal.k2d": ["Безупречный блеск до 4 недель", "Flawless shine for up to 4 weeks"], "gal.k3d": ["Аккуратные линии и идеальная длина", "Clean lines and the perfect length"],
  "gal.cta.e": ["Онлайн-запись", "Online booking"],
  "gal.count": ["{0} работ", "{0} works"], "gal.empty": ["Скоро здесь появятся наши работы.", "Our work will appear here soon."],
  "gal.cta.h": ["Хотите так же?", "Want a look like this?"], "gal.cta.p": ["Выберите услугу и запишитесь онлайн — мастер подберёт форму, длину и оттенок под вас.", "Choose a service and book online — your artist will tailor the shape, length and shade to you."],
  "gal.cta.b": ["Записаться", "Book now"], "gal.prev": ["Назад", "Previous"], "gal.next": ["Вперёд", "Next"], "gal.pages": ["Страницы", "Pages"],
  
  "ped.h": ["Педикюр", "Pedicure"], "ped.sub": ["Аккуратная обработка, ровное покрытие и комфорт. Выберите услугу и запишитесь в один клик.", "Careful prep, an even finish and complete comfort. Choose a service and book in a single click."],
  "trt.h": ["Уход и процедуры", "Treatment"], "trt.sub": ["Восстановление и укрепление ногтей, мягкая кожа рук и ног.", "Nail repair and strengthening, soft skin for hands and feet."], "nav.works": ["Работы", "Work"], "nav.rec": ["Рекомендуем", "Recommended"],
  "nav.shop": ["Магазин", "Shop"], "nav.about": ["Дарья", "About"], "nav.book": ["Запись", "Book"], "nav.contact": ["Контакты", "Contact"],
  "nav.aria": ["Основное меню", "Main menu"], "menu": ["Меню", "Menu"], "theme": ["Сменить тему", "Toggle theme"],
  "cta.call": ["Записаться", "Book now"],
  "ft.city": ["📍 Керчь, район Аршинцево, ул. Орджоникидзе, 33, помещение 5", "📍 Kerch, Arshintsevo district, Ordzhonikidze St., 33, Room 5"],
  "title.home": ["Darya Nails — студия маникюра, Керчь", "Darya Nails — nail studio, Kerch"],
  "title.rec": ["Рекомендуем — Darya Nails", "Recommended — Darya Nails"],
  "title.ok": ["Заявка отправлена — Darya Nails", "Request sent — Darya Nails"],
  "title.admin": ["Darya Nails — панель мастера", "Darya Nails — studio dashboard"],
  "kind.Услуга": ["Услуга", "Service"], "kind.Товар": ["Товар", "Product"], "kind.Дизайн": ["Дизайн", "Design"],
  "c.book": ["Записаться", "Book now"], "c.order": ["Заказать", "Order"], "c.contact": ["Связаться", "Contact us"],
  "more": ["Показать ещё", "Show more"], "sort.l": ["Сортировка", "Sort by"], "sort.d": ["По умолчанию", "Default"],
  "sort.h": ["Сначала дорогие", "Highest price first"], "sort.lo": ["Сначала дешёвые", "Lowest price first"],
  "hero.p": ["Авторский маникюр и нейл-арт в Керчи. Безупречное покрытие, редкие оттенки и дизайн по вашему референсу.", "Signature manicure and nail art in Kerch. Flawless finish, rare shades and designs from your own reference."],
  "hero.book": ["Записаться онлайн", "Book online"], "hero.works": ["Наши работы", "Our work"], "hero.rec": ["Рекомендуем", "Recommended"],
  "hero.alt": ["Нейл-арт Darya Nails", "Darya Nails nail art"],
  "svc.h": ["Маникюр и нейл-арт", "Manicure & nail art"], "svc.sub": ["Услуги и актуальные цены. Выберите нужную — и запишитесь в один клик.", "Services and current prices. Choose one and book in a single click."],
  "works.h": ["Наши работы", "Our work"], "works.sub": ["Реальные результаты наших клиентов. Нажмите на фото, чтобы рассмотреть работу.", "Real results from our clients. Tap a photo to take a closer look."],
  "prd.h": ["Магазин", "Shop"], "prd.sub": ["Уход за ногтями и аксессуары. Закажите в один клик — мы подтвердим заказ в WhatsApp.", "Nail care and accessories. Order in one click — we will confirm your order on WhatsApp."],
  "about.h": ["Дарья", "Darya"], "about.role": ["Основатель студии · мастер маникюра", "Studio founder · nail artist"],
  "about.text": ["Здравствуйте, я Дарья — основатель студии Darya Nails. Для меня маникюр — это авторская работа, а не конвейер: я выверяю форму, довожу покрытие до безупречного состояния и создаю дизайн, который подчёркивает ваш образ. Каждый визит проходит в спокойной атмосфере и по строгим стандартам гигиены.", "Hello, I'm Darya, founder of Darya Nails. To me a manicure is bespoke craft, not a production line: I perfect the shape, bring the finish to flawless and create a design that flatters your look. Every visit takes place in a calm atmosphere under strict hygiene standards."],
  "about.l1": ["Индивидуальный подход к каждому образу", "A personal approach to every look"],
  "about.l2": ["Защитная одежда, перчатки и инструменты в крафт-пакетах", "Protective clothing, gloves and tools in kraft packs"],
  "about.l3": ["Спокойная атмосфера и время только для вас", "A calm atmosphere and time that is only yours"],
  "about.alt": ["Дарья — основатель студии Darya Nails", "Darya, founder of Darya Nails"],
  "book.h": ["Запишитесь на удобное время", "Book a time that suits you"],
  "book.sub": ["Регистрация не нужна. Оставьте имя и номер телефона — мы перезвоним и подтвердим время.", "No account needed. Leave your name and phone number and we will call to confirm your time."],
  "f.name": ["Ваше имя", "Your name"], "f.name.er": ["Введите имя.", "Enter your name."],
  "f.phone": ["Телефон", "Phone"], "f.phone.er": ["Введите корректный номер телефона.", "Enter a valid phone number."],
  "f.design": ["Услуга", "Service"], "f.price": ["Стоимость", "Price"], "f.dur": ["Длительность", "Duration"], "f.sel": ["Выбранная услуга", "Selected service"], "f.design.ph": ["Выберите услугу", "Select your care service"], "f.design.er": ["Пожалуйста, выберите услугу.", "Please select a service."], "f.time.er": ["Пожалуйста, выберите удобное время.", "Please choose a preferred time."], "f.own": ["Свой дизайн (по референсу)", "My own design (from a reference)"],
  "f.date": ["Желаемая дата", "Preferred date"], "f.time": ["Удобное время", "Preferred time"], "time.any": ["Любое удобное время", "Any time that suits me"],
  "f.up.t": ["Прикрепить фото-референс", "Attach reference photos"], "f.up.s": ["До 3 фото: перетащите сюда или нажмите, чтобы выбрать", "Up to 3 photos — drag them here or click to choose"],
  "f.err": ["Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.", "We couldn't send your request. Check your connection and try again."],
  "f.note": ["Пожелания", "Notes"], "f.note.ph": ["Форма, длина, цвет, особые пожелания", "Shape, length, colour, special requests"],
  "f.submit": ["Отправить заявку", "Send request"], "f.sending": ["Отправляем…", "Sending…"],
  "load.send": ["Отправляем вашу заявку…", "Sending your request…"], "load.photo": ["Загружаем фото {0} из {1}…", "Uploading photo {0} of {1}…"],
  "load.ok": ["Заявка отправлена!", "Request sent!"], "load.wait": ["Пожалуйста, подождите…", "Please wait…"],
  "net.off": ["Нет соединения с интернетом", "No internet connection"], "net.on": ["Соединение восстановлено", "Back online"],
  "ct.h": ["Как нас найти", "How to find us"],
  "ct.addr": ["Россия, г. Керчь, район Аршинцево,\nул. Орджоникидзе, 33, помещение 5", "Kerch, Russia, Arshintsevo district,\nOrdzhonikidze St., 33, Room 5"],
  "ct.hint": ["Здание библиотеки, вход сбоку, рядом с вывеской «Нотариус».", "Library building, side entrance, next to the “Notarius” sign."],
  "ct.call": ["Позвонить", "Call"], "ct.wa": ["WhatsApp", "WhatsApp"], "ct.wa.s": ["Написать", "Message"], "ct.vk": ["ВКонтакте", "VK"], "ct.vk.s": ["Страница", "Profile"],
  "rec.h": ["Рекомендуем", "Recommended"], "rec.sub": ["Выбор студии, тренды сезона и советы по уходу — всё в одном месте.", "Studio picks, season trends and care tips — all in one place."],
  "rec.picks": ["Выбор студии", "Studio picks"], "rec.tr": ["Тренды", "Trends"], "rec.tp": ["Уход дома", "Home care"], "rec.sg": ["Фирменные стили", "Signature styles"],
  "rec.empty": ["Рекомендации скоро появятся.", "Recommendations are coming soon."], "rec.home": ["← На главную", "← Back to home"],
  "ok.h": ["Заявка отправлена", "Request sent"],
  "ok.next": ["Что дальше", "What happens next"], "ok.no": ["Заявка №", "Request №"], "ok.price": ["Стоимость", "Price"],
  "ok.cal": ["В календарь", "Add to calendar"], "ok.map": ["Маршрут", "Directions"],
  "ok.s1": ["Мы позвоним вам и подтвердим время — обычно в течение дня.", "We will call you to confirm the time — usually within the day."],
  "ok.s2": ["Если есть референс, пришлите его в WhatsApp — подготовим дизайн заранее.", "Got a reference? Send it on WhatsApp so we can prepare the design in advance."],
  "ok.s3": ["Приходите по адресу ниже. Если нужно перенести запись — просто напишите нам.", "Come to the address below. Need to reschedule? Just message us."],
  "ok.p": ["Спасибо, {0}! Мы получили вашу заявку и скоро перезвоним, чтобы подтвердить время.", "Thank you, {0}! We received your request and will call you shortly to confirm the time."],
  "ok.p0": ["Спасибо! Мы получили вашу заявку и скоро позвоним, чтобы подтвердить время.", "Thank you! We received your request and will call you shortly to confirm the time."],
  "ok.design": ["Дизайн", "Design"], "ok.date": ["Дата", "Date"], "ok.time": ["Время", "Time"], "ok.phone": ["Телефон", "Phone"], "ok.note": ["Пожелания", "Notes"],
  "ok.anydate": ["Любая дата", "Any date"], "ok.wa": ["Отправить также в WhatsApp", "Also send via WhatsApp"],
  "ok.home": ["На главную", "Back to home"], "ok.again": ["Новая запись", "Book again"],
  "wa.book": ["Здравствуйте! Заявка с сайта: {0}, {1}. Дизайн: {2}. Дата: {3}. Время: {4}.", "Hello! Booking request from the website: {0}, {1}. Design: {2}. Date: {3}. Time: {4}."],
  "wa.note": [" Пожелания: {0}.", " Notes: {0}."], "wa.any": ["любая", "any"],
  "wa.order": ["Здравствуйте! Хочу заказать: {0} — {1}", "Hello! I would like to order: {0} — {1}"],
  "a.site": ["← на сайт", "← View site"],
  "a.t.bk": ["Записи", "Bookings"], "a.t.cl": ["Клиенты", "Clients"], "a.t.fn": ["Финансы", "Finance"], "a.t.it": ["Услуги", "Services"], "a.t.wk": ["Галерея", "Gallery"], "a.t.st": ["Сайт", "Site"], "a.t.ad": ["Админы", "Admins"], "a.t.pr": ["Профиль", "Profile"],
  "a.cancel": ["Отмена", "Cancel"], "a.yes": ["Да", "Yes"], "a.del": ["Удалить", "Delete"], "a.save": ["Сохранить", "Save"], "a.confirm": ["Подтвердить", "Confirm"],
  "a.edit": ["Изменить", "Edit"], "a.full": ["Хранилище браузера заполнено. Удалите часть фото или подключите сервер.", "Browser storage is full. Remove some photos or connect a server."],
  "a.preview": ["Референс", "Reference"], "a.rmphoto": ["Удалить фото", "Remove photo"],
  "a.bk.h": ["Записи", "Bookings"], "a.client": ["Клиент", "Client"], "a.design": ["Дизайн", "Design"], "a.design.ph": ["Например, Глянцевый нюд", "e.g. Glossy nude"],
  "a.date": ["Дата", "Date"], "a.time": ["Время", "Time"], "a.price": ["Стоимость, ₽", "Price, ₽"], "a.nb.add": ["Добавить запись", "Add booking"],
  "a.search.ph": ["Поиск: имя, телефон, дизайн…", "Search: name, phone, design…"], "a.search": ["Поиск", "Search"], "a.filter": ["Фильтр", "Filter"],
  "a.f.all": ["Все записи", "All bookings"], "a.f.new": ["Новые", "New"], "a.f.unpaid": ["Не оплачено", "Unpaid"], "a.f.paid": ["Оплачено", "Paid"], "a.f.cancel": ["Отменённые", "Cancelled"],
  "a.csv": ["Скачать CSV", "Download CSV"],
  "st.new": ["Новая", "New"], "st.confirmed": ["Подтверждена", "Confirmed"], "st.done": ["Выполнена", "Completed"], "st.paid": ["Оплачена", "Paid"], "st.cancel": ["Отменена", "Cancelled"],
  "a.status": ["Статус", "Status"], "a.paid": ["Оплачено", "Paid"], "a.unpaid": ["Не оплачено", "Unpaid"],
  "a.web": ["Заказ с сайта", "Website order"], "a.delbk": ["Удалить запись", "Delete booking"], "a.delbk.q": ["Удалить запись?", "Delete this booking?"],
  "a.addphoto": ["＋ фото", "＋ photo"], "a.addphoto.a": ["Добавить фото", "Add photos"],
  "a.nobk": ["Записей не найдено. Заявки с сайта появятся здесь автоматически.", "No bookings found. Requests from the website will appear here automatically."],
  "a.addclient": ["Сначала добавьте клиента на вкладке «Клиенты».", "Add a client in the Clients tab first."], "a.untitled": ["Без названия", "Untitled"],
  "k.new": ["Новые", "New"], "k.today": ["Сегодня", "Today"], "k.unpaid": ["Не оплачено", "Unpaid"], "k.d7": ["7 дней", "7 days"], "k.month": ["Месяц", "Month"], "k.total": ["Всего", "Total"], "k.avg": ["Средний чек", "Average sale"],
  "csv.price": ["Цена", "Price"], "csv.pay": ["Оплата", "Payment"],
  "a.cl.h": ["Клиенты", "Clients"], "a.name": ["Имя", "Name"], "a.phone": ["Телефон", "Phone"], "a.notes": ["Заметки", "Notes"], "a.notes.ph": ["Форма, аллергии, предпочтения", "Shape, allergies, preferences"],
  "a.upphoto": ["Загрузить фото", "Upload photos"], "a.saveclient": ["Сохранить клиента", "Save client"], "a.savechg": ["Сохранить изменения", "Save changes"],
  "a.badclient": ["Введите имя и корректный номер телефона.", "Enter a name and a valid phone number."], "a.nonotes": ["Без заметок", "No notes"],
  "a.visits": ["Визитов: {0} · Оплачено: {1}", "Visits: {0} · Paid: {1}"], "a.delclient": ["Удалить клиента и его записи?", "Delete this client and their bookings?"],
  "a.noclients": ["Клиентов пока нет. Добавьте первого выше.", "No clients yet. Add the first one above."],
  "a.fn.h": ["Финансы", "Finance"], "a.chart": ["Выручка за 14 дней", "Revenue, last 14 days"], "a.tx": ["Транзакции", "Transactions"], "a.paidon": ["Дата оплаты", "Paid on"], "a.sum": ["Сумма, ₽", "Amount, ₽"],
  "a.notx": ["Нет оплаченных записей. Переведите запись в статус «Оплачена», и она попадёт сюда.", "No paid bookings yet. Set a booking to “Paid” and it will appear here."],
  "a.it.h": ["Услуги и цены", "Services & prices"], "a.it.info": ["Выберите раздел, укажите цену, скидку и длительность — услуга сразу появится на сайте. Цену, скидку, время и фото можно менять прямо в карточке.", "Choose a section and set the price, discount and duration — the service appears on the site immediately. You can change the price, discount, time and photo right in the card."],
  "a.add.h": ["Добавить услугу", "Add a service"], "a.more.en": ["Английская версия (необязательно)", "English version (optional)"], "a.final": ["Итого", "Final price"],
  "a.sec.old": ["Старые товары (скрыты на сайте)", "Old shop items (hidden on site)"], "a.upfail": ["Не удалось загрузить фото. Проверьте bucket dn-photos в Supabase.", "Photo upload failed. Check the dn-photos bucket in Supabase."],
  "a.type": ["Тип", "Type"], "a.title.ru": ["Название (русский)", "Title (Russian)"], "a.title.en": ["Название (английский)", "Title (English)"],
  "a.desc.ru": ["Описание (русский)", "Description (Russian)"], "a.desc.en": ["Описание (английский)", "Description (English)"],
  "a.cprice": ["Цена, ₽", "Price, ₽"], "a.old": ["Старая цена, ₽ (зачёркнутая)", "Old price, ₽ (struck through)"], "a.showrec": ["Показывать в «Рекомендуем»", "Show in Recommended"],
  "a.photo": ["Фото", "Photo"], "a.itadd": ["Добавить в каталог", "Add to catalog"], "a.badit": ["Введите название и цену.", "Enter a title and a price."],
  "a.badold": ["Старая цена должна быть больше новой.", "The old price must be higher than the new one."], "a.inrec": ["★ в «Рекомендуем»", "★ in Recommended"],
  "a.disc": ["Скидка, %", "Discount, %"], "a.discbtn": ["Скидка", "Discount"], "a.discoff": ["Снять", "Remove"], "a.baddisc": ["Введите скидку от 1 до 99 %.", "Enter a discount from 1 to 99 %."],
  "a.repl": ["Заменить фото", "Replace photo"], "a.rmimg": ["Убрать фото", "Remove photo"],
  "a.ratio": ["Пропорции", "Aspect ratio"], "a.fit": ["Вписывание", "Fit"], "a.fit.s": ["Вписать", "Fit"], "a.pos": ["Положение", "Position"], "a.pos.l": ["Положение фото", "Photo position"],
  "a.delit": ["Удалить позицию с сайта?", "Remove this item from the site?"], "a.noit": ["Пока ничего нет. Добавьте первую услугу или товар.", "Nothing here yet. Add your first service or product."],
  "r.auto": ["Авто", "Auto"], "r.sq": ["Квадрат 1:1", "Square 1:1"], "r.land": ["Альбом 4:3", "Landscape 4:3"], "r.wide": ["Широкий 16:9", "Wide 16:9"], "r.p45": ["Портрет 4:5", "Portrait 4:5"], "r.p34": ["Портрет 3:4", "Portrait 3:4"],
  "fit.fill": ["Заполнить", "Fill"], "fit.contain": ["Вписать целиком", "Fit whole image"],
  "pos.c": ["По центру", "Centre"], "pos.t": ["Сверху", "Top"], "pos.b": ["Снизу", "Bottom"], "pos.l": ["Слева", "Left"], "pos.r": ["Справа", "Right"],
  "a.wk.h": ["Галерея «Наши работы»", "“Our work” gallery"], "a.wk.info": ["Загрузите фото выполненных работ — они сразу появятся на сайте.", "Upload photos of finished work — they appear on the site right away."],
  "a.wk.title": ["Название", "Title"], "a.wk.title.ph": ["Например, Хром и кристаллы", "e.g. Chrome & crystals"], "a.wk.photo": ["Фото работы", "Photo of the work"], "a.wk.add": ["Добавить работу", "Add work"],
  "a.wk.pick": ["Выберите фото работы.", "Choose a photo of the work."], "a.rename": ["Переименовать", "Rename"], "a.rename.h": ["Переименовать работу", "Rename work"],
  "a.left": ["Сдвинуть влево", "Move left"], "a.right": ["Сдвинуть вправо", "Move right"], "a.delwk": ["Удалить фото из галереи?", "Remove this photo from the gallery?"],
  "a.nowk": ["Фото пока нет. Загрузите первую выполненную работу.", "No photos yet. Upload your first finished work."],
  "a.st.h": ["Сайт", "Site"], "a.st.info": ["Меняйте тексты, контакты и главные фото сайта. Пустое поле — остаётся исходный текст. Если английское поле пустое, на английской версии показывается русский текст. Изменения видны на сайте сразу.", "Edit the site's texts, contacts and main photos. An empty field keeps the default text. If an English field is empty, the English site shows the Russian text. Changes go live immediately."],
  "a.st.hero": ["Шапка и главный экран", "Header & hero"], "a.s.call": ["Кнопка в шапке (русский)", "Header button (Russian)"], "a.s.calle": ["Кнопка в шапке (английский)", "Header button (English)"],
  "a.s.hero": ["Подзаголовок (русский)", "Subtitle (Russian)"], "a.s.heroe": ["Подзаголовок (английский)", "Subtitle (English)"], "a.s.himg": ["Главное фото", "Main photo"],
  "a.reset": ["Вернуть исходное", "Restore default"],
  "a.st.about": ["О мастере", "About the artist"], "a.s.role": ["Должность (русский)", "Role (Russian)"], "a.s.rolee": ["Должность (английский)", "Role (English)"],
  "a.s.atext": ["Текст о мастере (русский)", "About text (Russian)"], "a.s.atexte": ["Текст о мастере (английский)", "About text (English)"], "a.s.mimg": ["Фото мастера", "Photo of the artist"],
  "a.st.contacts": ["Контакты", "Contacts"], "a.s.ph": ["Телефон", "Phone"], "a.s.wa": ["WhatsApp (номер)", "WhatsApp (number)"], "a.s.vk": ["Ссылка ВКонтакте", "VK link"],
  "a.s.ad": ["Адрес, русский (каждая строка — с новой строки)", "Address, Russian (one line per row)"], "a.s.ade": ["Адрес, английский", "Address, English"],
  "a.s.adh": ["Как найти (русский)", "Directions (Russian)"], "a.s.adhe": ["Как найти (английский)", "Directions (English)"],
  "a.st.rec": ["Страница «Рекомендуем»", "“Recommended” page"], "a.st.rec.i": ["Каждая строка: Название | Описание", "One per line: Title | Description"],
  "a.s.tr": ["Тренды (русский)", "Trends (Russian)"], "a.s.tre": ["Тренды (английский)", "Trends (English)"], "a.s.tp": ["Уход дома (русский)", "Home care (Russian)"], "a.s.tpe": ["Уход дома (английский)", "Home care (English)"],
  "a.s.sg": ["Фирменные стили (русский)", "Signature styles (Russian)"], "a.s.sge": ["Фирменные стили (английский)", "Signature styles (English)"],
  "a.st.backup": ["Резервная копия", "Backup"], "a.st.backup.i": ["Данные хранятся в этом браузере. Скачивайте копию регулярно и переносите её на другое устройство.", "Your data is stored in this browser. Download a backup regularly and move it to other devices."],
  "a.bkx": ["Скачать копию (JSON)", "Download backup (JSON)"], "a.bki": ["Восстановить из файла", "Restore from file"],
  "a.restore.q": ["Заменить все текущие данные данными из файла?", "Replace all current data with the data from this file?"], "a.restore": ["Заменить", "Replace"],
  "a.restored": ["Данные восстановлены.", "Data restored."], "a.badfile": ["Файл не подходит.", "This file can't be used."],
  "a.savesite": ["Сохранить изменения сайта", "Save site changes"], "a.saved": ["Сохранено — изменения уже на сайте.", "Saved — the changes are live on the site."],
  "a.himg.alt": ["Главное фото", "Main photo"], "a.mimg.alt": ["Фото мастера", "Photo of the artist"],
  "a.sec": ["Раздел", "Section"], "a.sec.all": ["Все", "All"], "a.sec.work": ["Наши работы", "Our work"], "a.dur": ["Длительность, мин", "Duration, min"],
  "a.import": ["Загрузить стандартные услуги", "Import standard services"],
  "a.import.q": ["Добавить 7 стандартных услуг (маникюр, педикюр, уход) в каталог? Фото возьмутся из существующих услуг. Старые услуги останутся — их можно изменить или удалить.", "Add the 7 standard services (manicure, pedicure, treatment) to the catalog? Photos are taken from your existing services. Old services stay — you can edit or delete them."],
  "a.import.ok": ["Услуги добавлены.", "Services added."], "a.import.none": ["Все стандартные услуги уже есть.", "All standard services are already there."],
  "a.sql.h": ["Нужно один раз обновить базу", "One-time database update needed"],
  "a.sql.i": ["Чтобы разделы и длительность сохранялись, выполните этот SQL в Supabase → SQL Editor, затем обновите страницу.", "To save sections and duration, run this SQL in Supabase → SQL Editor, then refresh the page."],
  "a.copy": ["Скопировать SQL", "Copy SQL"], "a.copied": ["Скопировано", "Copied"],
  "a.nocols": ["Сначала выполните SQL (см. блок выше).", "Run the SQL first (see the block above)."],
  "lg.h": ["Вход для мастера", "Studio sign-in"], "lg.email": ["Email", "Email"], "lg.pass": ["Пароль", "Password"],
  "lg.btn": ["Войти", "Sign in"], "lg.busy": ["Входим…", "Signing in…"], "lg.fill": ["Введите email и пароль.", "Enter your email and password."],
  "lg.bad": ["Неверный email или пароль.", "Wrong email or password."], "lg.net": ["Ошибка соединения. Попробуйте ещё раз.", "Connection error. Please try again."],
  "ad.h": ["Администраторы", "Administrators"], "ad.info": ["Пользователи, которые могут входить в эту панель.", "People who can sign in to this dashboard."],
  "ad.add": ["Добавить администратора", "Add an administrator"], "ad.pass": ["Пароль (минимум 6 символов)", "Password (at least 6 characters)"],
  "ad.addbtn": ["Добавить", "Add"], "ad.all": ["Все администраторы", "All administrators"], "ad.load": ["Загрузка…", "Loading…"],
  "ad.none": ["Администраторов пока нет.", "No administrators yet."], "ad.you": ["(вы)", "(you)"],
  "ad.created": ["Создан", "Created"], "ad.last": ["Последний вход", "Last sign-in"], "ad.never": ["ещё не входил", "never"],
  "ad.newpw": ["Новый пароль", "New password"], "ad.chpw": ["Сменить пароль", "Change password"],
  "ad.fill": ["Заполните оба поля.", "Fill in both fields."], "ad.min6": ["Пароль — минимум 6 символов.", "The password needs at least 6 characters."],
  "ad.added": ["Администратор добавлен.", "Administrator added."], "ad.pwok": ["Пароль обновлён.", "Password updated."],
  "ad.deleted": ["Администратор удалён.", "Administrator removed."], "ad.delq": ["Удалить этого администратора?", "Remove this administrator?"],
  "ad.err": ["Ошибка: {0}", "Error: {0}"],
  "pr.h": ["Мой профиль", "My profile"], "pr.info": ["Измените свой email или пароль.", "Change your own email or password."],
  "pr.pw": ["Новый пароль (оставьте пустым, чтобы не менять)", "New password (leave empty to keep the current one)"],
  "pr.save": ["Сохранить", "Save"], "pr.nothing": ["Нечего менять.", "Nothing to change."], "pr.saved": ["Сохранено.", "Saved."],
  "pr.meta": ["Создан: {0} · Последний вход: {1}", "Created: {0} · Last sign-in: {1}"], "pr.out": ["Выйти", "Sign out"]
};
const English = ["Paid", "Not paid"];

const RD = {
  tr: [["Хромовая втирка", "Зеркальный блеск с жемчужным отливом.", "Chrome powder", "Mirror shine with a pearly glow."], ["Кошачий глаз", "Магнитный эффект, который играет на свету.", "Cat eye", "A magnetic effect that plays with the light."], ["Молочный нюд", "Тёплая нейтраль на каждый день.", "Milky nude", "A warm neutral for every day."], ["Микро-френч", "Тонкая линия вместо привычной белой каймы.", "Micro French", "A fine line instead of the usual white tip."]],
  tp: [["Масло для кутикулы", "Наносите каждый вечер: кожа вокруг ногтя остаётся мягкой.", "Cuticle oil", "Apply every evening to keep the skin around the nail soft."], ["Перчатки для уборки", "Бытовая химия сокращает срок носки покрытия.", "Gloves for cleaning", "Household chemicals shorten the wear of the coating."], ["Не срывайте покрытие", "Снимайте у мастера, чтобы не повредить ногтевую пластину.", "Do not peel the coating", "Have it removed by a technician to protect the nail plate."], ["Коррекция через 3–4 недели", "Так форма и покрытие выглядят безупречно весь срок.", "Refill after 3–4 weeks", "Shape and finish then look flawless for the whole wear."]],
  sg: [["Тихая роскошь", "Нюд и чистая форма.", "Quiet Luxury", "Nude and a clean shape."], ["Полночь и золото", "Вечерний дизайн с фольгой.", "Midnight & Gold", "An evening design with foil."], ["Нежные сердца", "Белая основа и ручная роспись.", "Tender Hearts", "A white base with hand painting."]]
};
const DESIGNS = [["Тихая роскошь", "Quiet Luxury"], ["Глянцевый нюд", "Glossy Nude"], ["Сияющий хром", "Radiant Chrome"], ["Черепаховый узор", "Tortoiseshell"], ["Полночь и золото", "Midnight & Gold"], ["Нежные сердца", "Tender Hearts"]];
const WSEED = [
  { img: U("1519014816548-bf5fe059798b"), title: "Нюд с глянцем", te: "Glossy nude" },
  { img: U("1522337660859-02fbefca4702"), title: "Хром и кристаллы", te: "Chrome & crystals" },
  { img: U("1604654894610-df63bc536371"), title: "Черепаховый узор", te: "Tortoiseshell" },
  { img: U("1754799670312-8e7da8e40ad7"), title: "Полночь и золото", te: "Midnight & gold" }];
const SEED = [
  { kind: "Услуга", title: "Маникюр с покрытием гель-лак", te: "Manicure with gel polish", desc: "Аппаратная обработка, выравнивание и стойкое покрытие до 4 недель.", de: "Precision prep, smoothing and a long-wear gel finish of up to 4 weeks.", price: 2000, old: 0, img: U("1571290274554-6a2eaa771e5f"), rec: true },
  { kind: "Услуга", title: "Авторский нейл-арт", te: "Signature nail art", desc: "Ручная роспись, фольга и кристаллы по вашему референсу.", de: "Hand-painted art, foil and crystals from your own reference.", price: 2500, old: 3000, img: U("1522337660859-02fbefca4702"), rec: true },
  { kind: "Услуга", title: "Хром и втирка", te: "Chrome & powder", desc: "Зеркальный эффект с жемчужным отливом.", de: "A mirror effect with a pearly glow.", price: 2300, old: 0, img: U("1604654894610-df63bc536371"), rec: false },
  { kind: "Товар", title: "Масло для кутикулы", te: "Cuticle oil", desc: "Ежедневный уход за кожей вокруг ногтя.", de: "Daily care for the skin around the nail.", price: 600, old: 0, img: U("1754799670312-8e7da8e40ad7"), rec: true },
  { kind: "Товар", title: "Набор по уходу за ногтями", te: "Nail care set", desc: "Всё для поддержания маникюра дома.", de: "Everything to keep your manicure perfect at home.", price: 1500, old: 1800, img: U("1754799670410-b282791342c3"), rec: false }];

/* ---------- Category of a service (mani / pedi / trt) ----------
   1) поле cat из базы; 2) для старых записей без cat — по ключевым словам в названии. */
const CATS = ["mani", "pedi", "trt"];
const catOf = it => {
  if (CATS.includes(it.cat)) return it.cat;
  const s = ((it.title || "") + " " + (it.te || "")).toLowerCase();
  if (/педикюр|pedicure|pedi\b|ступн|foot|feet/.test(s)) return "pedi";
  if (/маникюр|manicure/.test(s)) return "mani";
  if (/уход|спа|парафин|процедур|лечени|укреплен|восстановлен|биогел|treatment|spa\b|care|repair|paraffin|biogel|strengthen/.test(s)) return "trt";
  return "mani";
};

/* ---------- Services: Manicure / Pedicure / Treatment ----------
   dur — длительность в минутах. Фото берутся из текущих услуг каталога (см. script.js). */
const SERVICES = [
  { cat: "mani", kind: "Услуга", price: 1000, dur: 60,  old: 0,
    title: "Маникюр без покрытия", te: "Manicure, no polish",
    desc: "Очищение и приведение ногтей в порядок без покрытия.", de: "Nail cleaning and shaping, with no polish." },
  { cat: "mani", kind: "Услуга", price: 1900, dur: 120, old: 0,
    title: "Маникюр с гель-лаком", te: "Manicure with gel polish",
    desc: "Полный маникюр со стойким покрытием гель-лак.", de: "A full manicure with a long-lasting gel polish finish." },

  { cat: "pedi", kind: "Услуга", price: 1200, dur: 60,  old: 0,
    title: "Педикюр без покрытия", te: "Pedicure, no polish",
    desc: "Очищение и приведение в порядок ногтей на ногах.", de: "Cleaning and tidying of the toenails." },
  { cat: "pedi", kind: "Услуга", price: 2000, dur: 90,  old: 0,
    title: "Педикюр с гель-лаком", te: "Pedicure with gel polish",
    desc: "Базовый педикюр ногтей с покрытием гель-лак.", de: "A basic nail pedicure with gel polish." },
  { cat: "pedi", kind: "Услуга", price: 2400, dur: 120, old: 0,
    title: "Педикюр «Всё включено»", te: "Complete pedicure package",
    desc: "Комплексный пакет: ногти, гель-лак и полный уход за пятками и стопами.", de: "The complete package: nails, gel polish and a full heel and foot treatment." },

  { cat: "trt", kind: "Услуга", price: 1000, dur: 60,  old: 0,
    title: "Уход за стопами и пятками", te: "Foot & heel treatment",
    desc: "Только уход за стопами и пятками, без обработки ногтей и покрытия.", de: "Foot and heel treatment only, with no nail service or polish." },
  { cat: "trt", kind: "Услуга", price: 1800, dur: 90,  old: 0,
    title: "Педикюр с уходом, без покрытия", te: "Pedicure with foot treatment, no polish",
    desc: "Педикюр ногтей с полным уходом за стопами и пятками, без покрытия.", de: "A nail pedicure with a full foot and heel treatment, with no polish." }
];

let lang = "ru"; try { lang = localStorage.getItem("dnLang") || "ru" } catch (e) { }
const en = () => lang === "en";
function t(k, ...a) { const v = L[k]; if (!v) return k; return a.reduce((s, x, i) => s.replace("{" + i + "}", x), v[en() ? 1 : 0]) }
const tm = v => v === ANY ? t("time.any") : v;
const ttl = it => en() && it.te ? it.te : it.title;
const dsc = it => en() && it.de ? it.de : it.desc;
const fmt = n => new Intl.NumberFormat(en() ? "en-US" : "ru-RU").format(Math.round(n)) + " ₽";
const fmtDur = m => { const h = Math.floor(m / 60), r = m % 60, u = en() ? ["h", "min"] : ["ч", "мин"]; return [h && h + " " + u[0], r && r + " " + u[1]].filter(Boolean).join(" ") };

function applyI18n() {
  root.lang = lang;
  $$("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
  [["ph", "placeholder"], ["aria", "aria-label"], ["alt", "alt"], ["title", "title"]].forEach(([k, a]) =>
    $$(`[data-i18n-${k}]`).forEach(e => e.setAttribute(a, t(e.dataset["i18n" + k[0].toUpperCase() + k.slice(1)]))));
  if (document.body.dataset.title) document.title = t(document.body.dataset.title);
  const b = $("#lang"); if (b) { b.textContent = en() ? "RU" : "EN"; b.setAttribute("aria-label", en() ? "Переключить на русский" : "Switch to English") }
}
function setLang(l) {
  lang = l; try { localStorage.setItem("dnLang", l) } catch (e) { }
  window.onLang && window.onLang();
  applyI18n(); applySite();
}

/* ---------- 3. Data store (Supabase, no cache) ---------- */
let CACHE = { clients: [], bookings: [], items: [], works: [], site: {} };
let ready = false;
const readyQ = [];
const onReady = fn => ready ? fn() : readyQ.push(fn);

function db() { return CACHE }
function dbSave(x) { CACHE = x; return true }

/* Load — public pages get only items / works / site settings; the admin gets everything */
const fetchData = () => PAGE === "admin" ? fetchAll() : fetchPublic();
const CKEY = "dnCache2";
const loadFresh = async () => {
  const d = await fetchData();
  if (PAGE !== "admin" && ((d.items && d.items.length) || (d.works && d.works.length))) { try { localStorage.setItem(CKEY, JSON.stringify(d)) } catch (e) { } }
  return d;
};
async function init() {
  // Public pages: show the last known data instantly, refresh quietly in the background (smooth page-to-page navigation)
  let warm = false;
  if (PAGE !== "admin") { try { const s = JSON.parse(localStorage.getItem(CKEY) || "null"); if (s && s.items) { CACHE = s; warm = true } } catch (e) { } }
  if (!warm) { try { CACHE = await loadFresh() } catch (e) { console.error('init:', e) } }

  ready = true;
  readyQ.forEach(fn => fn());
  readyQ.length = 0;

  if (warm) loadFresh().then(d => {
    if (JSON.stringify(d) === JSON.stringify(CACHE)) return;
    CACHE = d; window.onLang && window.onLang(); applyI18n(); applySite(); window.dispatchEvent(new Event('db-updated'));
  }).catch(e => console.error(e));

  // Realtime — instant updates, no cache
  const tables = PAGE === "admin" ? ['clients', 'bookings', 'items', 'works', 'site_settings'] : ['items', 'works', 'site_settings'];
  let timer = null;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        CACHE = await loadFresh();
        window.onLang && window.onLang();
        applyI18n(); applySite();
        window.dispatchEvent(new Event('db-updated'));
      } catch (e) { console.error(e) }
    }, 250);
  };
  const ch = supabase.channel('dn');
  tables.forEach(table => ch.on('postgres_changes', { event: '*', schema: 'public', table }, refresh));
  ch.subscribe();
  window.addEventListener('online', refresh);   // connection is back: pull fresh data
}
init();

const waNum = () => ((db().site || {}).wa || "").replace(/\D/g, "") || "79785100511";
function recList(k) {
  const s = db().site || {};
  if (en() && s.listsEn && s.listsEn[k]) return s.listsEn[k];
  if (s.lists && s.lists[k]) return s.lists[k];
  return RD[k].map(x => en() ? [x[2], x[3]] : [x[0], x[1]]);
}

/* ---------- 4. Theme ---------- */
try { root.dataset.theme = localStorage.getItem("dnTheme") || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light") } catch (e) { }
function toggleTheme() { root.classList.add("theming"); setTimeout(() => root.classList.remove("theming"), 700); root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; try { localStorage.setItem("dnTheme", root.dataset.theme) } catch (e) { } }
document.addEventListener("pointermove", e => {
  root.style.setProperty("--mx", e.clientX + "px");
  root.style.setProperty("--my", e.clientY + "px");
}, { passive: true });

/* ---------- 5. Header, footer ---------- */
function buildChrome() {
  const hd = $("#hd"), ft = $("#ft"); if (!hd) return;
  const d = db();
  const link = (h, k, id, hide) => `<a href="${h}" data-i18n="${k}"${id ? ` id="${id}"` : ""}${hide ? " hidden" : ""}></a>`;
  hd.className = "site";
  hd.innerHTML = `<a class="brand" href="${HOME || "#top"}"><span>Darya Nails</span><small data-i18n="brand.sub"></small></a>
  <nav class="main" id="nav" data-i18n-aria="nav.aria">
    ${link(HOME + "#top", "nav.home", "nhome")}${link(HOME + "#services", "nav.svc", "nsvc")}${link(HOME + "#pedicure", "nav.ped", "nped")}${link(HOME + "#treatment", "nav.trt", "ntrt")}${link(HOME + "#about", "nav.about")}${link("gallery.html", "nav.works", "nwrk")}
  </nav>
  <div class="tools">
    <button class="ic" id="lang" type="button"></button>
    <button class="ic" id="theme" type="button" data-i18n-aria="theme"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg></button>
    <a class="btn sm" id="hcall" href="${HOME}#book" data-i18n="cta.call"></a>
    <button class="ic burger" id="burger" type="button" aria-expanded="false" aria-controls="nav" data-i18n-aria="menu">☰</button>
  </div>`;
  if (ft) {
    ft.className = "site";
    ft.innerHTML = `
    <a class="ft-addr" 
       href="https://www.google.com/maps/search/?api=1&query=Керчь+улица+Орджоникидзе+33" 
       target="_blank" 
       rel="noopener"
       data-i18n="ft.city"></a>`;
  }
  $("#nav").onclick = e => { if (e.target.closest("a")) closeNav() };
  $("#burger").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#burger").setAttribute("aria-expanded", o) };
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav() });
}
const closeNav = () => { const n = $("#nav"); if (n) { n.classList.remove("open"); $("#burger").setAttribute("aria-expanded", "false") } };

function bindTools() {
  const th = $("#theme"), lg = $("#lang");
  if (th) th.onclick = toggleTheme;
  if (lg) lg.onclick = () => setLang(en() ? "ru" : "en");
}

function applySite() {
  const s = db().site || {}, pick = (a, b) => (en() && s[b]) || s[a];
  const T = (sel, v, br) => { const el = $(sel); if (!el || !v) return; if (br) { el.textContent = ""; v.split("\n").forEach((l, i) => { if (i) el.append(document.createElement("br")); el.append(l) }) } else el.textContent = v };
  T("#hcall", pick("call", "calle")); T("#herop", pick("hero", "heroe")); T("#arole", pick("role", "rolee")); T("#atext", pick("atext", "atexte"));
  T("#ad", pick("addr", "addre"), 1); T("#adh", pick("hint", "hinte")); T("#cph", s.phone);
  const I = (sel, v, fit, pos, ratio) => { const el = $(sel); if (!el) return; if (el._o === undefined) el._o = el.getAttribute("src"); if (v) el.src = v; else el.src = el._o; el.style.objectFit = fit || ""; el.style.objectPosition = pos || ""; if (ratio !== undefined) el.style.aspectRatio = ratio || "" };
  I("#himg", s.himg, s.himgfit, s.himgpos); I("#mimg", s.mimg, s.mimgfit, s.mimgpos, s.mimgratio);
  const tel = $("#cphl"); if (tel) { let p = (s.phone || "").replace(/\D/g, ""); if (p.length === 11 && p[0] === "8") p = "7" + p.slice(1); tel.href = "tel:+" + (p || "79785100511") }
  const wa = $("#cwa"); if (wa) wa.href = "https://wa.me/" + waNum();
  const vk = $("#cvk"); if (vk) { if (vk._h === undefined) vk._h = vk.getAttribute("href"); vk.href = s.vk || vk._h }
}

/* ---------- 6. Cards, pager, transition, orders ---------- */
function card(it) {
  const ti = ttl(it), pct = it.old > it.price ? Math.round((1 - it.price / it.old) * 100) : 0;
  return `<article class="card"><div class="pic"${it.ratio ? ` style="aspect-ratio:${esc(it.ratio)}"` : ""}>${it.img ? `<img style="${imgSt(it)}" src="${esc(it.img)}" alt="${esc(ti)}" loading="lazy" onerror="this.remove()">` : ""}${pct ? `<span class="tag off">−${pct}%</span>` : ""}</div>
  <div class="cb"><h3>${esc(ti)}</h3><p>${esc(dsc(it))}</p><div class="pr"><b>${it.price ? fmt(it.price) : esc(t("price.ask"))}</b>${it.old > it.price ? `<s>${fmt(it.old)}</s>` : ""}${it.dur ? `<span class="dur">${esc(fmtDur(it.dur))}</span>` : ""}</div>
  <div class="ca"><button class="btn sm o" type="button" data-pick="${esc(it.title)}">${t("c.book")}</button></div></div></article>`;
}
function mkPager({ box, btn, sortBar, page = 4, onMore }) {
  let shown = page, expanded = false;
  btn.onclick = () => { shown += page; expanded = true; onMore() };
  return {
    draw(list, fn) {
      box.innerHTML = list.slice(0, shown).map(fn).join("");
      btn.hidden = list.length <= shown;
      if (sortBar) sortBar.hidden = !(expanded && list.length > 1);
    }
  };
}
const sortBy = (l, v) => v === "high" ? [...l].sort((a, b) => b.price - a.price) : v === "low" ? [...l].sort((a, b) => a.price - b.price) : l;

function go(url) {
  const c = document.createElement("div"); c.className = "curtain out"; c.innerHTML = "<span>Darya Nails</span>"; document.body.append(c);
  setTimeout(() => location.href = url, matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 520);
}

/* Soft exit before leaving the page (only where the browser has no native page cross-fade) */
if (!("onpagereveal" in window)) document.addEventListener("click", e => {
  const a = e.target.closest("a[href]");
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute("download")) return;
  const u = new URL(a.href, location.href);
  if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
  e.preventDefault();
  document.body.classList.add("leaving");
  setTimeout(() => location.href = u.href, matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 320);
});

document.addEventListener("click", e => {
  const p = e.target.closest("[data-pick]");
  if (p) {
    if (PAGE === "home") { $("#design").value = p.dataset.pick; $("#book").scrollIntoView(); setTimeout(() => $("[name=name]").focus({ preventScroll: true }), 500) }
    else location.href = "index.html?pick=" + encodeURIComponent(p.dataset.pick) + "#book";
    return;
  }
  const b = e.target.closest("[data-oid]"); if (!b) return;
  const x = db(), it = x.items.find(i => i.id == b.dataset.oid); if (!it) return;
  window.open("https://wa.me/" + waNum() + "?text=" + encodeURIComponent(t("wa.order", ttl(it), fmt(it.price))), "_blank", "noopener");
});

/* ---------- Loaders: first-visit splash, action overlay, connection banner ---------- */
function fadeOut(el, ms = 450) {
  if (!el) return;
  const op = parseFloat(getComputedStyle(el).opacity);
  if (!(op > .05)) { el.remove(); return }            // never became visible (fast load) → just drop it
  el.style.pointerEvents = "none"; el.style.animation = "none"; el.style.opacity = op;
  void el.offsetWidth;
  el.style.transition = `opacity ${ms}ms ease`; el.style.opacity = "0";
  setTimeout(() => el.remove(), ms + 60);
}
function hideBoot() {                                   // splash markup lives in each page (#boot)
  const b = document.getElementById("boot");
  if (b) requestAnimationFrame(() => requestAnimationFrame(() => fadeOut(b)));
}
/* busy("text") → { set(text), ok(text), done() } — blurred overlay with spinner; appears only if the wait lasts > 250ms */
function busy(msg) {
  const el = document.createElement("div"); el.className = "busy"; el.setAttribute("role", "alert"); el.setAttribute("aria-busy", "true");
  el.innerHTML = '<div class="busy-card"><div class="spin" aria-hidden="true"></div><p></p></div>';
  const p = el.querySelector("p"), ic = el.querySelector(".spin"), main = $("main");
  p.textContent = msg || t("load.wait");
  document.body.append(el); if (main) main.setAttribute("inert", "");
  let closed = false;
  return {
    set(m) { if (!closed) p.textContent = m },
    ok(m) {
      if (closed) return;
      ic.className = "tick"; el.setAttribute("aria-busy", "false");
      ic.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
      p.textContent = m || "";
    },
    done() { if (closed) return; closed = true; if (main) main.removeAttribute("inert"); fadeOut(el, 300) }
  };
}
/* connection banner */
let netEl = null, netT;
function netShow(ok) {
  clearTimeout(netT);
  if (!netEl) { netEl = document.createElement("div"); netEl.setAttribute("role", "alert"); document.body.append(netEl) }
  netEl.className = "net" + (ok ? " ok" : ""); netEl.textContent = t(ok ? "net.on" : "net.off");
  if (ok) netT = setTimeout(() => { fadeOut(netEl, 300); netEl = null }, 2600);
}
addEventListener("offline", () => netShow(false));
addEventListener("online", () => netShow(true));
if (!navigator.onLine) onReady(() => netShow(false));

/* ---------- Click light: a soft glow spreads from the exact point you press ---------- */
const GLOW_ON = ".btn,.ch,.card,.ic,.w,.up,.chip span,.tabs button,.b";
document.addEventListener("pointerdown", e => {
  if (e.button > 0 || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const el = e.target.closest(GLOW_ON);
  if (!el || el.disabled || el.hasAttribute("disabled")) return;
  const r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2, s = document.createElement("x-rip");
  s.className = "rip";
  s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  el.append(s);
  setTimeout(() => s.remove(), 900);
}, { passive: true });

/* ---------- Expose to window for non-module scripts ---------- */
Object.assign(window, {
  $, $$, t, db, dbSave, fmt, esc, tm, ttl, dsc, imgSt, shrink, toast, en, recList,
  card, mkPager, sortBy, go, RD, DESIGNS, ANY, OWN, SEED, WSEED, applyI18n, applySite,
  buildChrome, bindTools, English, onReady, supabase, SERVICES, catOf, fmtDur, waNum, busy
});

/* ---------- ✅ تصدير كل ما يحتاجه admin.js ---------- */
export {
  $, $$, t, db, dbSave, fmt, esc, tm, ttl, dsc, imgSt, shrink, toast, en, recList,
  card, mkPager, sortBy, go, RD, DESIGNS, ANY, OWN, SEED, WSEED, applyI18n, applySite,
  buildChrome, bindTools, English, onReady, supabase, SERVICES, catOf, fmtDur, waNum, busy
};

/* Header menu: show Manicure / Pedicure / Treatment only when that section really has services (same rule as the home page) */
function syncNav() {
  const d = db(), has = (d.items || []).some(i => i.kind === "Услуга" && ["mani", "pedi", "trt"].includes(i.cat));
  const n = k => has ? d.items.filter(i => i.kind === "Услуга" && catOf(i) === k).length : SERVICES.filter(x => x.cat === k).length;
  [["#nsvc", "mani"], ["#nped", "pedi"], ["#ntrt", "trt"]].forEach(([id, k]) => { const a = $(id); if (a) a.hidden = !n(k) });
}
window.addEventListener("db-updated", syncNav);

onReady(() => {
  if (document.getElementById("hd")) {
    buildChrome();
    if (PAGE === "gallery") $("#nwrk").setAttribute("aria-current", "page");
    bindTools();
    applySite();
    syncNav();
  }
  applyI18n();
  document.body.classList.add("ready");
  hideBoot();
});