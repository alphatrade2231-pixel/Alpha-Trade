/* Cart — سلة localStorage. تخزن {id, qty} فقط، والأسعار تُحسب من بيانات المنتجات الحالية */
(function (w) {
  'use strict';

  var KEY = 'at_cart_v1';
  var MAXQ = 5000;
  var items = [];
  var subs = [];

  function load() {
    try {
      var a = JSON.parse(w.localStorage.getItem(KEY) || '[]');
      if (Array.isArray(a)) {
        items = a.filter(function (x) { return x && x.id && Number(x.qty) > 0; })
          .map(function (x) { return { id: String(x.id), qty: Math.min(MAXQ, Math.floor(Number(x.qty)) || 1) }; });
      }
    } catch (e) { items = []; }
  }

  function emit() { subs.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }

  function save() {
    try { w.localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
    emit();
  }

  function find(id) {
    for (var i = 0; i < items.length; i++) if (items[i].id === String(id)) return items[i];
    return null;
  }

  function clamp(q, max) {
    q = Math.floor(Number(q)) || 0;
    return Math.max(0, Math.min(q, max > 0 ? Math.min(max, MAXQ) : MAXQ));
  }

  // يرجع { ok, capped }
  function add(id, qty, max) {
    id = String(id);
    var it = find(id), want = (it ? it.qty : 0) + (Math.floor(Number(qty)) || 1);
    var q = clamp(want, max);
    if (q < 1) return { ok: false, capped: true };
    if (it) it.qty = q; else items.push({ id: id, qty: q });
    save();
    return { ok: true, capped: q < want };
  }

  function setQty(id, qty, max) {
    var it = find(id);
    if (!it) return;
    var q = clamp(qty, max);
    if (q < 1) items = items.filter(function (x) { return x.id !== String(id); });
    else it.qty = q;
    save();
  }

  function remove(id) { items = items.filter(function (x) { return x.id !== String(id); }); save(); }
  function clear() { items = []; save(); }

  // حذف عناصر لم يعد لها منتج
  function prune(byId) {
    var n = items.length;
    items = items.filter(function (x) { return byId[x.id]; });
    if (items.length !== n) save();
  }

  function count() { return items.reduce(function (s, x) { return s + x.qty; }, 0); }

  function lines(byId) {
    var out = [], total = 0;
    items.forEach(function (it) {
      var p = byId[it.id];
      if (!p) return;
      var pr = w.Api && w.Api.unitPrice ? w.Api.unitPrice(p, it.qty) : { unit: p.retail, tier: 'retail' };
      var sub = Math.round(pr.unit * it.qty * 100) / 100;
      total += sub;
      out.push({ id: it.id, qty: it.qty, product: p, unit: pr.unit, tier: pr.tier, subtotal: sub });
    });
    return { lines: out, total: Math.round(total * 100) / 100 };
  }

  load();

  w.Cart = {
    items: function () { return items.slice(); },
    add: add, setQty: setQty, remove: remove, clear: clear, prune: prune,
    count: count, lines: lines,
    onChange: function (f) { subs.push(f); },
    MAXQ: MAXQ
  };
})(window);