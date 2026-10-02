/* Search — فهرسة + بحث + فلاتر (يدعم العربية والإنجليزية و "5w30" = "5W-30") */
(function (w) {
  'use strict';

  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\p{L}\p{N}\s.+\-\/]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compact(s) { return s.replace(/[^\p{L}\p{N}]/gu, ''); }

  function index(products) {
    products.forEach(function (p) {
      p._s = norm([p.nameAr, p.nameEn, p.brand, p.catAr, p.catEn, p.viscosity, p.api, p.acea,
        p.specs, p.engine, p.size, p.code, p.sku].join(' '));
      p._c = compact(p._s);
    });
  }

  function uniq(list, key) {
    var seen = {}, out = [];
    list.forEach(function (p) {
      var v = p[key];
      if (v && !seen[v]) { seen[v] = 1; out.push(v); }
    });
    return out.sort(function (a, b) { return String(a).localeCompare(String(b), 'en', { numeric: true }); });
  }

  function facets(products) {
    return {
      brands: uniq(products, 'brand'),
      viscosities: uniq(products, 'viscosity'),
      engines: uniq(products, 'engine'),
      sizes: uniq(products, 'size'),
      specs: uniq(products, 'specs')
    };
  }

  function filter(list, f) {
    var toks = norm(f.q).split(' ').filter(Boolean);
    var min = f.min === '' || f.min == null ? NaN : Number(f.min);
    var max = f.max === '' || f.max == null ? NaN : Number(f.max);

    var out = list.filter(function (p) {
      if (f.cat && p.categoryId !== f.cat) return false;
      if (f.brand && p.brand !== f.brand) return false;
      if (f.visc && p.viscosity !== f.visc) return false;
      if (f.engine && p.engine !== f.engine) return false;
      if (f.size && p.size !== f.size) return false;
      if (f.spec && p.specs !== f.spec) return false;
      if (f.avail && !(p.stock > 0)) return false;
      if (!isNaN(min) && p.retail < min) return false;
      if (!isNaN(max) && p.retail > max) return false;
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i];
        if ((p._s || '').indexOf(t) < 0 && (p._c || '').indexOf(compact(t)) < 0) return false;
      }
      return true;
    });

    var s = f.sort || 'featured';
    out.sort(function (a, b) {
      if (s === 'priceAsc') return a.retail - b.retail;
      if (s === 'priceDesc') return b.retail - a.retail;
      if (s === 'name') return String(a.nameEn || a.nameAr).localeCompare(String(b.nameEn || b.nameAr));
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
    return out;
  }

  w.Search = { index: index, facets: facets, filter: filter, norm: norm };
})(window);