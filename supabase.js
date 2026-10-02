/* SB — إعدادات Supabase + REST helper. المفتاح هنا Publishable فقط. لا تضع Secret Key هنا أبدًا */
(function (w) {
  'use strict';

  var CONFIG = {
    URL: 'https://cmvmnwdcmhedufmordmn.supabase.co',
    KEY: 'sb_publishable_MIZkezJ43MceXsbm8yH8lg_s7ervBub',
    BUCKET: 'product-images',
    TIMEOUT_MS: 15000,

    // طريقة إنشاء الطلبات:
    //  'direct' → إدخال مباشر في orders ثم order_items (يحتاج سياسة INSERT للـ anon)
    //  'edge'   → إرسال {order, items} إلى Edge Function (للربط لاحقًا)
    //   عند استخدام edge: انشر الدالة بدون verify_jwt لأن المفتاح Publishable ليس JWT
    ORDER_MODE: 'direct',
    ORDER_FUNCTION: 'create-order',

    // false: عمود orders.items يستقبل نصًا (JSON string). true: لو العمود jsonb ويقبل array
    ITEMS_AS_JSON_COLUMN: false
  };

  // حماية: رفض أي مفتاح سري بالخطأ
  if (/^sb_secret_/i.test(CONFIG.KEY) || /service_role/i.test(CONFIG.KEY)) {
    throw new Error('SECURITY: Secret key must never be used in the frontend.');
  }

  function SBError(message, info) {
    var e = new Error(message);
    e.name = 'SBError';
    info = info || {};
    e.kind = info.kind || 'unknown';   // network | timeout | http
    e.status = info.status || 0;
    e.code = info.code || '';
    e.details = info.details || '';
    return e;
  }

  async function request(path, opts) {
    opts = opts || {};
    var headers = {
      'apikey': CONFIG.KEY,
      'Accept': 'application/json'
    };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.prefer) headers['Prefer'] = opts.prefer;

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, CONFIG.TIMEOUT_MS);
    var res;
    try {
      res = await fetch(CONFIG.URL + path, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: ctrl.signal
      });
    } catch (e) {
      var to = e && e.name === 'AbortError';
      throw SBError(to ? 'Request timed out' : 'Network error: ' + (e && e.message), { kind: to ? 'timeout' : 'network' });
    } finally {
      clearTimeout(timer);
    }

    var text = '';
    try { text = await res.text(); } catch (e) { /* ignore */ }
    var data = null;
    if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }

    if (!res.ok) {
      throw SBError((data && (data.message || data.error)) || ('HTTP ' + res.status), {
        kind: 'http', status: res.status, code: data && data.code, details: data && (data.details || data.hint)
      });
    }
    return data;
  }

  function qs(params) {
    return Object.keys(params || {}).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');
  }

  async function select(table, params) {
    var rows = await request('/rest/v1/' + table + '?' + qs(params));
    return Array.isArray(rows) ? rows : [];
  }

  // return=minimal: لا نحتاج قراءة الصف بعد الإدخال (وقد لا تسمح RLS بقراءته)
  function insert(table, rows) {
    return request('/rest/v1/' + table, { method: 'POST', body: rows, prefer: 'return=minimal' });
  }

  function publicUrl(path) {
    var p = String(path || '').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    return CONFIG.URL + '/storage/v1/object/public/' + CONFIG.BUCKET + '/' + p;
  }

  w.SB = { config: CONFIG, request: request, select: select, insert: insert, publicUrl: publicUrl };
})(window);