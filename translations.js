/* I18N — لا يعتمد على أي ملف آخر */
(function (w) {
  'use strict';

  var D = {
    ar: {
      nav_home: 'الرئيسية', nav_products: 'المنتجات', nav_categories: 'الفئات', nav_about: 'من نحن',
      search_ph: 'ابحث عن زيت، ماركة، لزوجة…', lang_btn: 'English',
      loading: 'جارٍ التحميل…',
      err_title: 'تعذّر تحميل البيانات', err_msg: 'حدثت مشكلة أثناء الاتصال بالخادم.',
      err_hint: 'تأكد من اتصال الإنترنت ومن سياسات القراءة (RLS) للجداول في Supabase.',
      retry: 'إعادة المحاولة',
      fatal_title: 'تعذّر تشغيل الموقع', fatal_msg: 'لم يتم تحميل الملفات التالية بشكل صحيح، تأكد من وجودها بجانب index.html:',
      hero_kicker: 'ALPHA TRADE · زيوت وسوائل السيارات',
      hero_title: 'زيوت أصلية تحمي محرك سيارتك',
      hero_sub: 'أفضل الماركات العالمية للزيوت وسوائل السيارات، بأسعار تجزئة وجملة وتوصيل سريع.',
      hero_cta: 'تسوّق الآن', hero_cta2: 'تصفح الفئات',
      feat_title: 'منتجات مميزة', cat_title: 'الفئات', view_all: 'عرض الكل',
      tr1_t: 'منتجات أصلية', tr1_d: 'ماركات موثوقة ومنتجات مضمونة',
      tr2_t: 'أسعار جملة', tr2_d: 'سعر خاص عند شراء كرتونة كاملة',
      tr3_t: 'الدفع عند الاستلام', tr3_d: 'اطلب الآن وادفع عند وصول الطلب',
      products_title: 'المنتجات', results: '{n} منتج', no_results: 'لا توجد منتجات مطابقة.',
      filters: 'الفلاتر', reset: 'إعادة ضبط',
      f_cat: 'الفئة', f_brand: 'الماركة', f_visc: 'اللزوجة', f_engine: 'نوع المحرك', f_size: 'حجم العبوة',
      f_spec: 'المواصفات', f_price: 'السعر', f_min: 'من', f_max: 'إلى', f_avail: 'المتوفر فقط', f_all: 'الكل',
      sort: 'ترتيب', s_feat: 'الأكثر تميزًا', s_pa: 'السعر: الأقل أولًا', s_pd: 'السعر: الأعلى أولًا', s_name: 'الاسم',
      add_cart: 'أضف للسلة', out_stock: 'غير متوفر', in_stock: 'متوفر', low_stock: 'كمية محدودة ({n})',
      added: 'تمت الإضافة إلى السلة', capped: 'تم الوصول لأقصى كمية متاحة',
      brand: 'الماركة', code: 'كود المنتج', sku: 'SKU', viscosity: 'اللزوجة', api: 'API', acea: 'ACEA',
      specs: 'المواصفات', engine: 'نوع المحرك', size: 'حجم العبوة', carton: 'الكمية في الكرتونة', category: 'الفئة',
      desc: 'الوصف', related: 'منتجات مشابهة', retail: 'سعر التجزئة', wholesale: 'سعر الجملة',
      wholesale_note: 'سعر الجملة {price} عند شراء {n} قطعة أو أكثر', qty: 'الكمية', pcs: 'قطعة',
      cart_title: 'سلة المشتريات', cart_empty: 'سلتك فارغة', continue: 'متابعة التسوق',
      subtotal: 'المجموع الفرعي', total: 'الإجمالي', checkout: 'إتمام الطلب', remove: 'حذف',
      unit: 'سعر الوحدة', tier_w: 'جملة', tier_r: 'تجزئة',
      cart_note: 'يتم التحقق من الأسعار والمخزون عند تأكيد الطلب.',
      co_title: 'إتمام الطلب', co_customer: 'بيانات العميل', co_car: 'بيانات السيارة',
      co_name: 'الاسم', co_phone: 'رقم الهاتف', co_address: 'العنوان', co_car_type: 'نوع السيارة',
      co_car_model: 'الموديل', co_car_year: 'سنة الصنع', co_notes: 'ملاحظات', co_payment: 'طريقة الدفع',
      pay_cod: 'الدفع عند الاستلام', pay_online: 'دفع إلكتروني', soon: 'قريبًا',
      place_order: 'تأكيد الطلب', placing: 'جارٍ إرسال الطلب…', summary: 'ملخص الطلب', optional: 'اختياري',
      e_name: 'من فضلك أدخل الاسم', e_phone: 'رقم الهاتف غير صحيح', e_address: 'من فضلك أدخل العنوان',
      e_year: 'سنة الصنع غير صحيحة',
      i_missing: 'منتج لم يعد متاحًا وتمت إزالته من السلة', i_stock: '{name}: المتاح {n} فقط، تم تعديل الكمية',
      e_rls: 'نظام الطلبات غير مُفعّل بعد على الخادم. تواصل معنا هاتفيًا لإتمام الطلب.',
      e_net: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.',
      e_generic: 'تعذّر إرسال الطلب. حاول مرة أخرى.',
      ok_title: 'تم استلام طلبك', ok_msg: 'شكرًا لك! سنتواصل معك قريبًا لتأكيد الطلب.',
      ok_id: 'رقم الطلب', ok_wa: 'تأكيد عبر واتساب', back_home: 'العودة للرئيسية',
      about_title: 'من نحن',
      about_text: 'ألفا تريد متجر متخصص في زيوت وسوائل السيارات: زيوت المحركات، ناقل الحركة، مياه الرادياتير والمساحات، وسوائل الفرامل والدركسيون، من ماركات موثوقة وبأسعار تجزئة وجملة.',
      contact: 'تواصل معنا', phone: 'الهاتف', whatsapp: 'واتساب', email: 'البريد', address: 'العنوان',
      cat_count: '{n} منتج', not_found: 'الصفحة أو المنتج غير موجود', back: 'رجوع',
      cur: 'ج.م', ftr: 'جميع الحقوق محفوظة'
    },
    en: {
      nav_home: 'Home', nav_products: 'Products', nav_categories: 'Categories', nav_about: 'About',
      search_ph: 'Search oil, brand, viscosity…', lang_btn: 'العربية',
      loading: 'Loading…',
      err_title: 'Could not load data', err_msg: 'A problem occurred while contacting the server.',
      err_hint: 'Check your internet connection and the read (RLS) policies of the Supabase tables.',
      retry: 'Try again',
      fatal_title: 'The site could not start', fatal_msg: 'These files did not load correctly. Make sure they sit next to index.html:',
      hero_kicker: 'ALPHA TRADE · CAR OILS & FLUIDS',
      hero_title: 'Genuine oils that protect your engine',
      hero_sub: 'Top global brands of car oils and fluids, retail and wholesale prices, fast delivery.',
      hero_cta: 'Shop now', hero_cta2: 'Browse categories',
      feat_title: 'Featured products', cat_title: 'Categories', view_all: 'View all',
      tr1_t: 'Genuine products', tr1_d: 'Trusted brands, guaranteed quality',
      tr2_t: 'Wholesale prices', tr2_d: 'Special price when you buy a full carton',
      tr3_t: 'Cash on delivery', tr3_d: 'Order now, pay when it arrives',
      products_title: 'Products', results: '{n} products', no_results: 'No matching products.',
      filters: 'Filters', reset: 'Reset',
      f_cat: 'Category', f_brand: 'Brand', f_visc: 'Viscosity', f_engine: 'Engine type', f_size: 'Package size',
      f_spec: 'Specifications', f_price: 'Price', f_min: 'From', f_max: 'To', f_avail: 'In stock only', f_all: 'All',
      sort: 'Sort', s_feat: 'Featured', s_pa: 'Price: low to high', s_pd: 'Price: high to low', s_name: 'Name',
      add_cart: 'Add to cart', out_stock: 'Out of stock', in_stock: 'In stock', low_stock: 'Low stock ({n})',
      added: 'Added to cart', capped: 'Maximum available quantity reached',
      brand: 'Brand', code: 'Product code', sku: 'SKU', viscosity: 'Viscosity', api: 'API', acea: 'ACEA',
      specs: 'Specifications', engine: 'Engine type', size: 'Package size', carton: 'Units per carton', category: 'Category',
      desc: 'Description', related: 'Related products', retail: 'Retail price', wholesale: 'Wholesale price',
      wholesale_note: 'Wholesale price {price} when buying {n}+ units', qty: 'Quantity', pcs: 'pcs',
      cart_title: 'Shopping cart', cart_empty: 'Your cart is empty', continue: 'Continue shopping',
      subtotal: 'Subtotal', total: 'Total', checkout: 'Checkout', remove: 'Remove',
      unit: 'Unit price', tier_w: 'Wholesale', tier_r: 'Retail',
      cart_note: 'Prices and stock are verified when you confirm the order.',
      co_title: 'Checkout', co_customer: 'Customer details', co_car: 'Car details',
      co_name: 'Name', co_phone: 'Phone', co_address: 'Address', co_car_type: 'Car type',
      co_car_model: 'Model', co_car_year: 'Year', co_notes: 'Notes', co_payment: 'Payment method',
      pay_cod: 'Cash on delivery', pay_online: 'Online payment', soon: 'Soon',
      place_order: 'Place order', placing: 'Sending order…', summary: 'Order summary', optional: 'optional',
      e_name: 'Please enter your name', e_phone: 'Invalid phone number', e_address: 'Please enter your address',
      e_year: 'Invalid car year',
      i_missing: 'A product is no longer available and was removed from the cart', i_stock: '{name}: only {n} available, quantity adjusted',
      e_rls: 'The ordering system is not enabled on the server yet. Please contact us by phone to place your order.',
      e_net: 'Could not reach the server. Check your connection and try again.',
      e_generic: 'Could not send the order. Please try again.',
      ok_title: 'Order received', ok_msg: 'Thank you! We will contact you shortly to confirm your order.',
      ok_id: 'Order ID', ok_wa: 'Confirm on WhatsApp', back_home: 'Back to home',
      about_title: 'About us',
      about_text: 'Alpha Trade is a specialist store for car oils and fluids: engine oils, transmission, coolant, washer fluid, brake and power steering fluids, from trusted brands at retail and wholesale prices.',
      contact: 'Contact us', phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email', address: 'Address',
      cat_count: '{n} products', not_found: 'Page or product not found', back: 'Back',
      cur: 'EGP', ftr: 'All rights reserved'
    }
  };

  var KEY = 'at_lang';
  var lang = 'ar';
  try {
    var s = w.localStorage.getItem(KEY);
    if (s === 'ar' || s === 'en') lang = s;
  } catch (e) { /* ignore */ }

  function t(k, v) {
    var s = D[lang] && D[lang][k];
    if (s == null) s = D.en[k];
    if (s == null) return k;
    if (v) Object.keys(v).forEach(function (n) { s = s.split('{' + n + '}').join(v[n]); });
    return s;
  }

  function set(l) {
    lang = l === 'en' ? 'en' : 'ar';
    try { w.localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
    return lang;
  }

  w.I18N = {
    t: t,
    get lang() { return lang; },
    dir: function () { return lang === 'ar' ? 'rtl' : 'ltr'; },
    set: set,
    toggle: function () { return set(lang === 'ar' ? 'en' : 'ar'); }
  };
})(window);