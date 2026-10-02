/* App — الواجهة: Router + Views + حالات التحميل والخطأ */
(function (w, d) {
  'use strict';

  /* ---------- فحص أولي: لا صفحة بيضاء أبدًا ---------- */
  var NEED = ['I18N', 'SB', 'Api', 'Cart', 'Search'];
  var FILES = { I18N: 'translations.js', SB: 'supabase.js', Api: 'api.js', Cart: 'cart.js', Search: 'search.js' };

  function fatalScreen(list) {
    var el = d.getElementById('view');
    if (!el) return;
    el.innerHTML = '<div class="state"><div class="ico">⚠️</div>' +
      '<h2>تعذّر تشغيل الموقع · The site could not start</h2>' +
      '<p>لم يتم تحميل الملفات التالية بشكل صحيح · These files did not load correctly:</p>' +
      '<small>' + list.join(' , ') + '</small>' +
      '<p>افتح Console (F12) لمعرفة السبب · Open the browser console for details.</p></div>';
  }

  var missing = NEED.filter(function (n) { return !w[n]; }).map(function (n) { return FILES[n]; });
  (w.__failed || []).forEach(function (f) { if (missing.indexOf(f) < 0) missing.push(f); });
  if (missing.length) { console.error('[bootstrap] missing/failed files:', missing); fatalScreen(missing); return; }

  var I = w.I18N, Api = w.Api, Cart = w.Cart, Search = w.Search;
  function t(k, v) { return I.t(k, v); }

  /* ---------- State ---------- */
  function blankF() { return { q: '', cat: '', brand: '', visc: '', engine: '', size: '', spec: '', min: '', max: '', avail: false, sort: 'featured' }; }
  var S = { status: 'loading', error: null, categories: [], catById: {}, products: [], byId: {}, settings: {}, facets: null, f: blankF(), last: null };
  var LOW = 10;

  /* ---------- Helpers ---------- */
  function $(s, r) { return (r || d).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function enc(s) { return encodeURIComponent(s); }
  function ar() { return I.lang === 'ar'; }
  function cur() { return S.settings.currency || t('cur'); }
  function money(n) { return Number(n || 0).toLocaleString(ar() ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }) + ' ' + cur(); }
  function pname(p) { return ar() ? (p.nameAr || p.nameEn) : (p.nameEn || p.nameAr); }
  function pdesc(p) { return ar() ? (p.descAr || p.descEn) : (p.descEn || p.descAr); }
  function cname(c) { return ar() ? (c.nameAr || c.nameEn) : (c.nameEn || c.nameAr); }
  function pcat(p) {
    var c = S.catById[p.categoryId];
    if (c) return cname(c);
    return ar() ? (p.catAr || p.catEn) : (p.catEn || p.catAr);
  }
  function stockState(p) { return p.stock <= 0 ? 'out' : (p.stock <= LOW ? 'low' : 'in'); }
  function stockLabel(p) {
    var s = stockState(p);
    return s === 'out' ? t('out_stock') : (s === 'low' ? t('low_stock', { n: p.stock }) : t('in_stock'));
  }
  function view(html) { var v = $('#view'); if (v) v.innerHTML = html; }

  var tTimer;
  function toast(msg, type) {
    var e = $('#toast');
    if (!e) return;
    e.textContent = msg;
    e.className = 'toast show ' + (type || '');
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { e.className = 'toast'; }, 2800);
  }

  function ph(p, cls) {
    var img = p && p.image ? '<img loading="lazy" src="' + esc(p.image) + '" alt="' + esc(p ? pname(p) : '') + '" onerror="this.style.display=\'none\'">' : '';
    return '<span class="ph ' + (cls || '') + '">' + img + '</span>';
  }

  /* ---------- States ---------- */
  function loadingHtml() { return '<div class="state"><div class="spin"></div><p>' + esc(t('loading')) + '</p></div>'; }

  function errorHtml(title, msg, detail, retry) {
    return '<div class="state"><div class="ico">⚠️</div><h2>' + esc(title) + '</h2><p>' + esc(msg) + '</p>' +
      (detail ? '<small>' + esc(detail) + '</small>' : '') +
      (retry ? '<button class="btn" data-act="retry" type="button">' + esc(t('retry')) + '</button>' : '') + '</div>';
  }

  function errDetail(e) {
    if (!e) return '';
    var parts = [];
    if (e.kind) parts.push(e.kind);
    if (e.status) parts.push('HTTP ' + e.status);
    if (e.code) parts.push(e.code);
    parts.push(e.message || '');
    return parts.join(' · ');
  }

  /* ---------- Cards ---------- */
  function card(p) {
    var href = '#/product/' + enc(p.id);
    var tags = [p.viscosity, p.size].filter(Boolean).map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('');
    var ws = p.carton > 0 && p.wholesale > 0 ? '<small>' + esc(t('wholesale')) + ': ' + money(p.wholesale) + ' / ' + p.carton + '+</small>' : '';
    return '<article class="card"><a href="' + href + '">' + ph(p) + '</a><div class="card-b">' +
      (p.brand ? '<span class="brand">' + esc(p.brand) + '</span>' : '') +
      '<h3><a href="' + href + '">' + esc(pname(p)) + '</a></h3>' +
      '<div class="tags">' + tags + '</div>' +
      '<div class="price">' + money(p.retail) + ws + '</div>' +
      '<button class="btn sm" type="button" data-act="add" data-id="' + esc(p.id) + '"' + (p.stock <= 0 ? ' disabled' : '') + '>' +
      esc(p.stock <= 0 ? t('out_stock') : t('add_cart')) + '</button></div></article>';
  }

  function catCard(c) {
    var n = S.products.filter(function (p) { return p.categoryId === c.id; }).length;
    var bg = c.image ? ' style="background-image:url(\'' + esc(c.image) + '\')"' : '';
    return '<a class="cat" href="#/products?cat=' + enc(c.id) + '"' + bg + '><b>' + esc(cname(c)) + '</b><span>' + esc(t('cat_count', { n: n })) + '</span></a>';
  }

  /* ---------- Views ---------- */
  var VIEWS = {};

  VIEWS.home = function () {
    var feat = S.products.filter(function (p) { return p.featured; }).slice(0, 8);
    if (!feat.length) feat = S.products.slice(0, 8);
    view(
      '<section class="hero"><span class="kick">' + esc(t('hero_kicker')) + '</span>' +
      '<h1>' + esc(t('hero_title')) + '</h1><p>' + esc(t('hero_sub')) + '</p>' +
      '<div class="row"><a class="btn" href="#/products">' + esc(t('hero_cta')) + '</a>' +
      '<a class="btn ghost" href="#/categories">' + esc(t('hero_cta2')) + '</a></div></section>' +
      '<div class="trust"><div><b>' + esc(t('tr1_t')) + '</b><span>' + esc(t('tr1_d')) + '</span></div>' +
      '<div><b>' + esc(t('tr2_t')) + '</b><span>' + esc(t('tr2_d')) + '</span></div>' +
      '<div><b>' + esc(t('tr3_t')) + '</b><span>' + esc(t('tr3_d')) + '</span></div></div>' +
      (S.categories.length ? '<section class="sec"><div class="sec-h"><h2>' + esc(t('cat_title')) + '</h2><a href="#/categories">' + esc(t('view_all')) + '</a></div>' +
        '<div class="cats">' + S.categories.map(catCard).join('') + '</div></section>' : '') +
      (feat.length ? '<section class="sec"><div class="sec-h"><h2>' + esc(t('feat_title')) + '</h2><a href="#/products">' + esc(t('view_all')) + '</a></div>' +
        '<div class="grid">' + feat.map(card).join('') + '</div></section>' : '')
    );
  };

  function sel(key, label, opts, val, textFn) {
    return '<div class="fld"><label>' + esc(label) + '</label><select data-f="' + key + '"><option value="">' + esc(t('f_all')) + '</option>' +
      opts.map(function (o) {
        var v = typeof o === 'object' ? o.id : o;
        var tx = textFn ? textFn(o) : v;
        return '<option value="' + esc(v) + '"' + (v === val ? ' selected' : '') + '>' + esc(tx) + '</option>';
      }).join('') + '</select></div>';
  }

  VIEWS.products = function (r, keep) {
    if (!keep && r.params.has('cat')) { S.f = blankF(); S.f.cat = r.params.get('cat'); }
    var F = S.facets, f = S.f;
    view(
      '<div class="page-h"><h1>' + esc(t('products_title')) + '</h1><span id="count" class="mut"></span></div>' +
      '<button class="btn ghost fbtn" type="button" data-act="filters" style="color:var(--txt)">' + esc(t('filters')) + '</button>' +
      '<div class="shop"><aside id="filters" class="filters">' +
      sel('cat', t('f_cat'), S.categories, f.cat, cname) +
      sel('brand', t('f_brand'), F.brands, f.brand) +
      sel('visc', t('f_visc'), F.viscosities, f.visc) +
      sel('engine', t('f_engine'), F.engines, f.engine) +
      sel('size', t('f_size'), F.sizes, f.size) +
      sel('spec', t('f_spec'), F.specs, f.spec) +
      '<div class="fld"><label>' + esc(t('f_price')) + '</label><div class="two">' +
      '<input type="number" min="0" inputmode="decimal" data-f="min" placeholder="' + esc(t('f_min')) + '" value="' + esc(f.min) + '">' +
      '<input type="number" min="0" inputmode="decimal" data-f="max" placeholder="' + esc(t('f_max')) + '" value="' + esc(f.max) + '"></div></div>' +
      '<label class="chk"><input type="checkbox" data-f="avail"' + (f.avail ? ' checked' : '') + '> ' + esc(t('f_avail')) + '</label>' +
      '<button class="btn dark sm" type="button" data-act="reset">' + esc(t('reset')) + '</button></aside>' +
      '<div><div class="tb"><span></span><select data-f="sort" aria-label="' + esc(t('sort')) + '">' +
      [['featured', 's_feat'], ['priceAsc', 's_pa'], ['priceDesc', 's_pd'], ['name', 's_name']].map(function (o) {
        return '<option value="' + o[0] + '"' + (f.sort === o[0] ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>';
      }).join('') + '</select></div><div id="grid" class="grid"></div></div></div>'
    );
    syncQ();
    updateGrid();
  };

  function updateGrid() {
    var g = $('#grid');
    if (!g) return;
    var list = Search.filter(S.products, S.f);
    var c = $('#count');
    if (c) c.textContent = t('results', { n: list.length });
    g.innerHTML = list.length ? list.map(card).join('') : '<div class="empty">' + esc(t('no_results')) + '</div>';
  }

  function syncQ() { var q = $('#q'); if (q && q.value !== S.f.q) q.value = S.f.q; }

  VIEWS.categories = function () {
    view('<div class="page-h"><h1>' + esc(t('cat_title')) + '</h1></div><div class="cats">' + S.categories.map(catCard).join('') + '</div>');
  };

  VIEWS.about = function () {
    var s = S.settings;
    var text = (ar() ? s.about_ar : s.about_en) || t('about_text');
    var rows = [['phone', s.phone], ['whatsapp', s.whatsapp], ['email', s.email], ['address', s.address]]
      .filter(function (x) { return x[1]; })
      .map(function (x) { return '<div><span>' + esc(t(x[0])) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('');
    view('<div class="page-h"><h1>' + esc(t('about_title')) + '</h1></div><div class="prose"><p>' + esc(text) + '</p>' +
      (rows ? '<h3>' + esc(t('contact')) + '</h3><div class="contact">' + rows + '</div>' : '') + '</div>');
  };

  VIEWS.product = function (r) {
    var p = S.byId[r.arg];
    if (!p) return VIEWS.notfound();
    var imgs = [p.image].concat(p.gallery).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    var rows = [['brand', p.brand], ['category', pcat(p)], ['viscosity', p.viscosity], ['api', p.api], ['acea', p.acea],
      ['specs', p.specs], ['engine', p.engine], ['size', p.size], ['carton', p.carton || ''], ['code', p.code], ['sku', p.sku]]
      .filter(function (x) { return x[1]; })
      .map(function (x) { return '<tr><th>' + esc(t(x[0])) + '</th><td>' + esc(x[1]) + '</td></tr>'; }).join('');
    var related = S.products.filter(function (x) { return x.categoryId === p.categoryId && x.id !== p.id; }).slice(0, 4);
    var ws = p.carton > 0 && p.wholesale > 0 ? '<div class="mut">' + esc(t('wholesale_note', { price: money(p.wholesale), n: p.carton })) + '</div>' : '';
    var st = stockState(p);

    view(
      '<div class="pd"><div class="gal"><div class="main">' +
      '<span class="ph" id="mainph">' + (imgs[0] ? '<img id="mainimg" src="' + esc(imgs[0]) + '" alt="' + esc(pname(p)) + '" onerror="this.style.display=\'none\'">' : '') + '</span></div>' +
      (imgs.length > 1 ? '<div class="thumbs">' + imgs.map(function (u, i) {
        return '<button type="button" data-act="thumb" data-src="' + esc(u) + '" class="' + (i === 0 ? 'on' : '') + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>';
      }).join('') + '</div>' : '') + '</div>' +
      '<div>' + (p.brand ? '<span class="brand">' + esc(p.brand) + '</span>' : '') +
      '<h1>' + esc(pname(p)) + '</h1>' +
      '<div class="pbox"><div class="big">' + money(p.retail) + '</div>' + ws +
      '<span class="st ' + st + '">' + esc(stockLabel(p)) + '</span>' +
      '<div class="buy"><div class="qty"><button type="button" data-act="pdec">−</button><input id="pq" type="number" min="1" value="1" inputmode="numeric" aria-label="' + esc(t('qty')) + '"><button type="button" data-act="pinc">+</button></div>' +
      '<button class="btn" type="button" data-act="addq" data-id="' + esc(p.id) + '"' + (p.stock <= 0 ? ' disabled' : '') + '>' + esc(p.stock <= 0 ? t('out_stock') : t('add_cart')) + '</button></div></div>' +
      (rows ? '<table class="spec"><tbody>' + rows + '</tbody></table>' : '') +
      (pdesc(p) ? '<p class="desc">' + esc(pdesc(p)) + '</p>' : '') + '</div></div>' +
      (related.length ? '<section class="sec"><div class="sec-h"><h2>' + esc(t('related')) + '</h2></div><div class="grid">' + related.map(card).join('') + '</div></section>' : '')
    );
  };

  VIEWS.cart = function () {
    var c = Cart.lines(S.byId);
    if (!c.lines.length) {
      view('<div class="state"><div class="ico">🛒</div><h2>' + esc(t('cart_empty')) + '</h2><a class="btn" href="#/products">' + esc(t('continue')) + '</a></div>');
      return;
    }
    view(
      '<div class="page-h"><h1>' + esc(t('cart_title')) + '</h1></div><div class="two-col"><div>' +
      c.lines.map(function (l) {
        var p = l.product;
        return '<div class="line">' + ph(p) + '<div><h4><a href="#/product/' + enc(p.id) + '">' + esc(pname(p)) + '</a></h4>' +
          '<div class="mut">' + esc(t('unit')) + ': ' + money(l.unit) + ' · ' + esc(l.tier === 'wholesale' ? t('tier_w') : t('tier_r')) + '</div>' +
          '<div class="ctl"><div class="qty"><button type="button" data-act="dec" data-id="' + esc(p.id) + '">−</button>' +
          '<input type="number" min="1" value="' + l.qty + '" data-act="qty" data-id="' + esc(p.id) + '" inputmode="numeric">' +
          '<button type="button" data-act="inc" data-id="' + esc(p.id) + '">+</button></div>' +
          '<button class="rm" type="button" data-act="remove" data-id="' + esc(p.id) + '">' + esc(t('remove')) + '</button></div></div>' +
          '<div class="sub">' + money(l.subtotal) + '</div></div>';
      }).join('') + '</div>' +
      '<aside class="sum"><h3>' + esc(t('summary')) + '</h3>' +
      '<div class="r t"><span>' + esc(t('total')) + '</span><span>' + money(c.total) + '</span></div>' +
      '<p class="mut" style="margin:10px 0 14px;font-size:.85rem">' + esc(t('cart_note')) + '</p>' +
      '<a class="btn block" href="#/checkout">' + esc(t('checkout')) + '</a>' +
      '<a class="btn ghost block" style="margin-top:10px;color:var(--txt)" href="#/products">' + esc(t('continue')) + '</a></aside></div>'
    );
  };

  function fld(id, label, type, opt, extra) {
    return '<div class="fld" id="w_' + id + '"><label for="' + id + '">' + esc(label) + (opt ? ' <span class="mut">(' + esc(t('optional')) + ')</span>' : '') + '</label>' +
      (type === 'textarea' ? '<textarea id="' + id + '" rows="3"></textarea>' : '<input id="' + id + '" type="' + type + '" ' + (extra || '') + '>') + '</div>';
  }

  VIEWS.checkout = function () {
    var c = Cart.lines(S.byId);
    if (!c.lines.length) return VIEWS.cart();
    view(
      '<div class="page-h"><h1>' + esc(t('co_title')) + '</h1></div><div class="two-col">' +
      '<form id="co" class="formc" novalidate>' +
      '<h3>' + esc(t('co_customer')) + '</h3>' +
      fld('c_name', t('co_name'), 'text', false, 'autocomplete="name"') +
      fld('c_phone', t('co_phone'), 'tel', false, 'autocomplete="tel" inputmode="tel" dir="ltr"') +
      fld('c_address', t('co_address'), 'textarea', false) +
      '<h3>' + esc(t('co_car')) + '</h3><div class="two">' +
      fld('c_type', t('co_car_type'), 'text', true) + fld('c_model', t('co_car_model'), 'text', true) + '</div>' +
      fld('c_year', t('co_car_year'), 'number', true, 'min="1970" max="' + (new Date().getFullYear() + 1) + '" inputmode="numeric"') +
      fld('c_notes', t('co_notes'), 'textarea', true) +
      '<h3>' + esc(t('co_payment')) + '</h3><div class="pay">' +
      '<label><input type="radio" name="pay" value="cod" checked> ' + esc(t('pay_cod')) + '</label>' +
      '<label class="dis"><input type="radio" name="pay" value="online" disabled> ' + esc(t('pay_online')) + ' · ' + esc(t('soon')) + '</label></div>' +
      '<div id="co_err" class="alert" hidden></div>' +
      '<button id="co_btn" class="btn block" type="submit">' + esc(t('place_order')) + '</button></form>' +
      '<aside class="sum"><h3>' + esc(t('summary')) + '</h3>' +
      c.lines.map(function (l) {
        return '<div class="r"><span>' + esc(pname(l.product)) + ' × ' + l.qty + '</span><span>' + money(l.subtotal) + '</span></div>';
      }).join('') +
      '<div class="r t"><span>' + esc(t('total')) + '</span><span>' + money(c.total) + '</span></div></aside></div>'
    );
  };

  VIEWS.success = function () {
    if (!S.last) { location.hash = '#/'; return; }
    var wa = String(S.settings.whatsapp || '').replace(/\D/g, '');
    var msg = enc('Alpha Trade – ' + t('ok_id') + ': ' + S.last.orderId);
    view('<div class="state"><div class="ok">✓</div><h2>' + esc(t('ok_title')) + '</h2><p>' + esc(t('ok_msg')) + '</p>' +
      '<p><b>' + esc(t('ok_id')) + ':</b> <span dir="ltr" style="font-family:var(--fe);font-weight:800">' + esc(S.last.orderId) + '</span></p>' +
      (wa ? '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + msg + '">' + esc(t('ok_wa')) + '</a>' : '') +
      '<a class="btn dark" href="#/">' + esc(t('back_home')) + '</a></div>');
  };

  VIEWS.notfound = function () {
    view('<div class="state"><div class="ico">🔍</div><h2>' + esc(t('not_found')) + '</h2><a class="btn" href="#/">' + esc(t('back_home')) + '</a></div>');
  };

  /* ---------- Router ---------- */
  function parse() {
    var h = (location.hash || '#/').slice(1), q = '', i = h.indexOf('?');
    if (i > -1) { q = h.slice(i + 1); h = h.slice(0, i); }
    var parts = h.split('/').filter(Boolean), arg = '';
    try { arg = parts[1] ? decodeURIComponent(parts[1]) : ''; } catch (e) { arg = parts[1] || ''; }
    return { name: parts[0] || 'home', arg: arg, params: new URLSearchParams(q) };
  }

  function markNav(name) {
    var map = { home: '#/', products: '#/products', product: '#/products', categories: '#/categories', about: '#/about' };
    d.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === map[name]); });
  }

  function route(keep) {
    var r = parse();
    markNav(r.name);
    var nav = $('#nav'); if (nav) nav.classList.remove('open');
    if (S.status === 'loading') { view(loadingHtml()); return; }
    if (S.status === 'error') {
      view(errorHtml(t('err_title'), t('err_msg') + ' ' + t('err_hint'), errDetail(S.error), true));
      return;
    }
    try {
      (VIEWS[r.name] || VIEWS.notfound)(r, keep === true);
    } catch (e) {
      console.error('[view:' + r.name + ']', e);
      view(errorHtml(t('err_title'), t('err_msg'), e && e.message, false));
    }
    if (keep !== true) w.scrollTo(0, 0);
  }

  /* ---------- Static UI ---------- */
  function applyStatic() {
    d.documentElement.lang = I.lang;
    d.documentElement.dir = I.dir();
    d.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    d.querySelectorAll('[data-tp]').forEach(function (e) { e.setAttribute('placeholder', t(e.getAttribute('data-tp'))); });
    var lb = $('#langBtn'); if (lb) lb.textContent = t('lang_btn');
    var f = $('#ftr'); if (f) f.textContent = '© ' + new Date().getFullYear() + ' Alpha Trade | ألفا تريد · ' + t('ftr');
  }

  function updateBadge() { var b = $('#badge'); if (b) b.textContent = Cart.count(); }

  /* ---------- Checkout submit ---------- */
  function val(id) { var e = $('#' + id); return e ? e.value.trim() : ''; }
  function mark(id, bad) { var w2 = $('#w_' + id); if (w2) w2.classList.toggle('bad', !!bad); }

  async function submitOrder() {
    var box = $('#co_err'); box.hidden = true; box.innerHTML = '';
    var v = { name: val('c_name'), phone: val('c_phone'), address: val('c_address'), carType: val('c_type'), carModel: val('c_model'), carYear: val('c_year'), notes: val('c_notes'), pay: 'cod' };
    var errs = [];
    var ph2 = v.phone.replace(/[\s-]/g, '');
    var checks = [
      ['c_name', v.name.length < 2, 'e_name'],
      ['c_phone', !/^\+?\d{8,15}$/.test(ph2), 'e_phone'],
      ['c_address', v.address.length < 5, 'e_address'],
      ['c_year', v.carYear && (Number(v.carYear) < 1970 || Number(v.carYear) > new Date().getFullYear() + 1), 'e_year']
    ];
    checks.forEach(function (c) { mark(c[0], c[1]); if (c[1]) errs.push(c); });
    if (errs.length) {
      box.textContent = t(errs[0][2]); box.hidden = false;
      var el = $('#' + errs[0][0]); if (el) el.focus();
      return;
    }
    v.phone = ph2;

    var btn = $('#co_btn'); btn.disabled = true; btn.textContent = t('placing');
    try {
      var lines = Cart.items().map(function (i) { return { id: i.id, qty: i.qty }; });
      var res = await Api.createOrder({ customer: v, lines: lines });

try {
  var cartData = Cart.lines(S.byId);

  await w.SB.request('/functions/v1/dynamic-api', {
    method: 'POST',
    body: {
      order: {
        order_id: res.orderId,
        customer_name: v.name,
        phone: v.phone,
        address: v.address,
        car_type: v.carType || null,
        car_model: v.carModel || null,
        car_year: v.carYear ? Number(v.carYear) : null,
        notes: v.notes || null,
        payment_method: v.pay || 'cod',
        order_type: res.orderType,
        total: res.total
      },
      items: cartData.lines.map(function (l) {
        return {
          product_name: pname(l.product),
          quantity: l.qty,
          unit_price: l.unit,
          subtotal: l.subtotal
        };
      })
    }
  });

} catch (emailError) {
  console.error('[order-email]', emailError);
}

S.last = res;
Cart.clear();
location.hash = '#/success';
    } catch (e) {
      console.error('[createOrder]', e);
      if (e.code === 'CART_INVALID') {
        var msgs = [];
        (e.issues || []).forEach(function (is) {
          if (is.type === 'missing') { Cart.remove(is.id); msgs.push(t('i_missing')); }
          else if (is.type === 'stock') {
            if (is.available > 0) Cart.setQty(is.id, is.available, is.available); else Cart.remove(is.id);
            msgs.push(t('i_stock', { name: is.name || '', n: is.available }));
          }
        });
        toast(msgs[0] || t('e_generic'), 'err');
        location.hash = '#/cart';
        route(true);
        return;
      }
      var m = e.code === 'RLS_BLOCKED' ? t('e_rls') : (e.kind === 'network' || e.kind === 'timeout' ? t('e_net') : t('e_generic'));
      box.innerHTML = esc(m) + '<small>' + esc(errDetail(e)) + (e.orderId ? ' · ' + esc(e.orderId) : '') + '</small>';
      box.hidden = false;
      btn.disabled = false; btn.textContent = t('place_order');
    }
  }

  /* ---------- Events ---------- */
  function maxFor(id) { var p = S.byId[id]; return p ? p.stock : 0; }

  d.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    var p = id ? S.byId[id] : null;

    if (act === 'lang') { I.toggle(); applyStatic(); route(true); return; }
    if (act === 'menu') { $('#nav').classList.toggle('open'); return; }
    if (act === 'retry') { boot(); return; }
    if (act === 'filters') { var fl = $('#filters'); if (fl) fl.classList.toggle('open'); return; }
    if (act === 'reset') { S.f = blankF(); syncQ(); VIEWS.products({ params: new URLSearchParams() }, true); return; }
    if (act === 'thumb') {
      var mi = $('#mainimg'), src = el.getAttribute('data-src');
      if (!mi) { var mp = $('#mainph'); if (mp) mp.innerHTML = '<img id="mainimg" src="' + esc(src) + '" alt="">'; }
      else { mi.style.display = ''; mi.src = src; }
      d.querySelectorAll('.thumbs button').forEach(function (b) { b.classList.toggle('on', b === el); });
      return;
    }
    if (act === 'pdec' || act === 'pinc') {
      var inp = $('#pq'); if (!inp) return;
      var n = (parseInt(inp.value, 10) || 1) + (act === 'pinc' ? 1 : -1);
      inp.value = Math.max(1, n); return;
    }
    if (act === 'add' || act === 'addq') {
      if (!p) return;
      var qty = act === 'addq' ? (parseInt(($('#pq') || {}).value, 10) || 1) : 1;
      var r = Cart.add(id, qty, p.stock);
      if (!r.ok) toast(t('out_stock'), 'err');
      else toast(r.capped ? t('capped') : t('added'), r.capped ? '' : 'ok');
      return;
    }
    if (act === 'inc' || act === 'dec') {
      var cur2 = Cart.items().filter(function (x) { return x.id === id; })[0];
      if (!cur2) return;
      Cart.setQty(id, cur2.qty + (act === 'inc' ? 1 : -1), maxFor(id));
      route(true); return;
    }
    if (act === 'remove') { Cart.remove(id); route(true); return; }
  });

  d.addEventListener('change', function (e) {
    var el = e.target;
    if (el.getAttribute && el.getAttribute('data-act') === 'qty') {
      Cart.setQty(el.getAttribute('data-id'), el.value, maxFor(el.getAttribute('data-id')));
      route(true);
    }
  });

  function onFilter(e) {
    var el = e.target, k = el.getAttribute && el.getAttribute('data-f');
    if (!k) return;
    S.f[k] = el.type === 'checkbox' ? el.checked : el.value;
    updateGrid();
  }
  d.addEventListener('input', onFilter);
  d.addEventListener('change', onFilter);

  d.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'co') { e.preventDefault(); submitOrder(); }
  });

  var qTimer;
  $('#q').addEventListener('input', function (e) {
    var v = e.target.value;
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      S.f.q = v;
      if (S.status !== 'ready') return;
      if (parse().name !== 'products') location.hash = '#/products'; else updateGrid();
    }, 160);
  });

  w.addEventListener('hashchange', function () { route(); });
  w.addEventListener('error', function (e) { console.error('[window.error]', e.message); });
  w.addEventListener('unhandledrejection', function (e) { console.error('[unhandledrejection]', e.reason); });
  Cart.onChange(updateBadge);

  /* ---------- Boot ---------- */
  function boot() {
    S.status = 'loading'; S.error = null;
    route();
    return Api.bootstrap().then(function (data) {
      S.categories = data.categories.sort(function (a, b) { return a.order - b.order; });
      S.catById = {}; S.categories.forEach(function (c) { S.catById[c.id] = c; });
      S.products = data.products;
      S.byId = {}; S.products.forEach(function (p) { S.byId[p.id] = p; });
      S.settings = data.settings || {};
      Search.index(S.products);
      S.facets = Search.facets(S.products);
      Cart.prune(S.byId);
      S.status = 'ready';
      if (data.warnings.length) console.warn('[bootstrap] warnings:', data.warnings);
    }).catch(function (e) {
      console.error('[bootstrap]', e);
      S.status = 'error'; S.error = e;
    }).then(function () { updateBadge(); route(); });
  }

  applyStatic();
  updateBadge();
  boot();
})(window, document);