/* Api — طبقة البيانات: categories / products / settings / orders */
(function (w) {
  'use strict';

  function mkErr(code, msg, extra) {
    var e = new Error(msg);
    e.code = code;
    if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
    return e;
  }

  function sb() {
    if (!w.SB) throw mkErr('SB_MISSING', 'supabase.js failed to load');
    return w.SB;
  }

  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

  function absUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (/^(https?:|data:|\/\/)/i.test(u)) return u;
    return sb().publicUrl(u);
  }

  function parseGallery(g) {
    var a = [];
    if (Array.isArray(g)) a = g;
    else if (typeof g === 'string' && g.trim()) {
      var s = g.trim();
      if (s.charAt(0) === '[') { try { a = JSON.parse(s); } catch (e) { a = []; } }
      else a = s.split(/[\n,;|]+/);
    }
    return a.map(function (x) {
      if (x && typeof x === 'object') x = x.url || x.src || '';
      return absUrl(x);
    }).filter(Boolean);
  }

  function normProduct(r) {
    return {
      id: String(r.product_id),
      brand: r.brand || '',
      nameAr: r.product_name_ar || '',
      nameEn: r.product_name_en || '',
      categoryId: r.category_id || '',
      catAr: r.category_ar || '',
      catEn: r.category_en || '',
      descAr: r.description_ar || '',
      descEn: r.description_en || '',
      code: r.product_code || '',
      sku: r.sku || '',
      viscosity: r.viscosity || '',
      api: r.api || '',
      acea: r.acea || '',
      specs: r.specifications || '',
      engine: r.engine_type || '',
      size: r.package_size || '',
      carton: Number(r.carton_quantity) || 0,
      retail: Number(r.retail_price) || 0,
      wholesale: Number(r.wholesale_price) || 0,
      stock: Number(r.stock) || 0,
      image: absUrl(r.image_url),
      gallery: parseGallery(r.gallery),
      featured: r.featured === true
    };
  }

  function normCategory(r) {
    return {
      id: String(r.category_id),
      nameAr: r.name_ar || '',
      nameEn: r.name_en || '',
      descAr: r.description_ar || '',
      descEn: r.description_en || '',
      image: absUrl(r.image_url),
      order: Number(r.sort_order) || 0
    };
  }

  // قاعدة التسعير: جملة عند الوصول لكمية الكرتونة، وإلا تجزئة
  function unitPrice(p, qty) {
    if (p.carton > 0 && p.wholesale > 0 && qty >= p.carton) return { unit: p.wholesale, tier: 'wholesale' };
    return { unit: p.retail, tier: 'retail' };
  }

  // طلب واحد لجلب كل البيانات الأساسية
  async function bootstrap() {
    var s = sb();
    var res = await Promise.allSettled([
      s.select('categories', { select: '*', active: 'eq.true', order: 'sort_order.asc' }),
      s.select('products', { select: '*', active: 'eq.true', order: 'created_at.desc' }),
      s.select('settings', { select: 'key,value' })
    ]);
    var warnings = [];
    if (res[1].status !== 'fulfilled') throw res[1].reason;   // المنتجات إلزامية

    var products = res[1].value.map(normProduct);

    var categories = [];
    if (res[0].status === 'fulfilled') categories = res[0].value.map(normCategory);
    else warnings.push('categories: ' + res[0].reason.message);
    if (!categories.length) {                                  // بديل: استنتاج الفئات من المنتجات
      var seen = {};
      products.forEach(function (p) {
        if (p.categoryId && !seen[p.categoryId]) {
          seen[p.categoryId] = 1;
          categories.push({ id: p.categoryId, nameAr: p.catAr, nameEn: p.catEn, descAr: '', descEn: '', image: '', order: 999 });
        }
      });
    }

    var settings = {};
    if (res[2].status === 'fulfilled') res[2].value.forEach(function (r) { if (r.key) settings[r.key] = r.value; });
    else warnings.push('settings: ' + res[2].reason.message);

    return { categories: categories, products: products, settings: settings, warnings: warnings };
  }

  // تحقق حي من المنتجات والمخزون والأسعار قبل إنشاء الطلب
  async function validateCart(lines) {
    var ids = [];
    lines.forEach(function (l) { var id = String(l.id); if (ids.indexOf(id) < 0) ids.push(id); });
    if (!ids.length) return { ok: false, issues: [{ type: 'empty' }], lines: [], total: 0 };

    var list = ids.map(function (i) { return '"' + i.replace(/"/g, '') + '"'; }).join(',');
    var rows = await sb().select('products', {
      select: 'product_id,product_name_ar,product_name_en,retail_price,wholesale_price,carton_quantity,stock,active',
      product_id: 'in.(' + list + ')'
    });
    var map = {};
    rows.forEach(function (r) { map[String(r.product_id)] = r; });

    var out = [], issues = [], total = 0;
    lines.forEach(function (l) {
      var r = map[String(l.id)];
      var qty = Math.floor(Number(l.qty)) || 0;
      if (!r || r.active === false) { issues.push({ type: 'missing', id: String(l.id) }); return; }
      var p = normProduct(r);
      if (qty < 1 || p.stock < qty) {
        issues.push({ type: 'stock', id: p.id, available: p.stock, name: p.nameAr || p.nameEn });
        return;
      }
      var pr = unitPrice(p, qty);
      var sub = round2(pr.unit * qty);
      out.push({ id: p.id, name: p.nameAr || p.nameEn, qty: qty, unit: pr.unit, tier: pr.tier, subtotal: sub });
      total += sub;
    });
    return { ok: !issues.length, issues: issues, lines: out, total: round2(total) };
  }

  function genOrderId() {
    var d = new Date();
    var ymd = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    var rnd = '';
    try {
      var a = new Uint32Array(1);
      w.crypto.getRandomValues(a);
      rnd = a[0].toString(36).toUpperCase().slice(0, 5);
    } catch (e) {
      rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
    }
    while (rnd.length < 5) rnd += '0';
    return 'AT-' + ymd + '-' + rnd;
  }

  function classify(e) {
    if (e && (e.status === 401 || e.status === 403 || e.code === '42501')) {
      return mkErr('RLS_BLOCKED', e.message, { status: e.status });
    }
    return e;
  }

  // إنشاء الطلب. ملاحظة: السعر النهائي يُعاد حسابه من قاعدة البيانات، وليس من السلة
  async function createOrder(input) {
    var c = input.customer, s = sb(), cfg = s.config;
    var v = await validateCart(input.lines || []);
    if (!v.ok) throw mkErr('CART_INVALID', 'Cart validation failed', { issues: v.issues });

    var orderId = genOrderId();
    var type = v.lines.some(function (l) { return l.tier === 'wholesale'; }) ? 'wholesale' : 'retail';
    var itemsJson = v.lines.map(function (l) { return { id: l.id, name: l.name, qty: l.qty, unit: l.unit, subtotal: l.subtotal }; });

    var order = {
      order_id: orderId,
      created_at: new Date().toISOString(),
      customer_name: c.name,
      phone: c.phone,
      address: c.address,
      car_type: c.carType || null,
      car_model: c.carModel || null,
      car_year: c.carYear ? Number(c.carYear) : null,
      notes: c.notes || null,
      payment_method: c.pay || 'cod',
      order_type: type,
      items: cfg.ITEMS_AS_JSON_COLUMN ? itemsJson : JSON.stringify(itemsJson),
      total: v.total,
      status: 'New'
    };
    var items = v.lines.map(function (l) {
      return { order_id: orderId, product_id: l.id, product_name: l.name, quantity: l.qty, unit_price: l.unit, subtotal: l.subtotal };
    });

    try {
      if (cfg.ORDER_MODE === 'edge') {
        await s.request('/functions/v1/' + cfg.ORDER_FUNCTION, { method: 'POST', body: { order: order, items: items } });
      } else {
        await s.insert('orders', order);
        try {
          await s.insert('order_items', items);
        } catch (e2) {
          e2.orderId = orderId;   // الطلب أُنشئ لكن البنود فشلت
          throw e2;
        }
      }
    } catch (e) {
      throw classify(e);
    }
    return { orderId: orderId, total: v.total, orderType: type };
  }

  w.Api = {
    bootstrap: bootstrap,
    validateCart: validateCart,
    createOrder: createOrder,
    unitPrice: unitPrice
  };
})(window);