
(function () {
  'use strict';

  // رقم واتساب التجريبي الخاص بأدهم
  var WHATSAPP_NUMBER = '201114094278';

  // تجهيز رسالة تفاصيل الطلب
  function buildMessage(order, customer, items) {
    customer = customer || {};
    items = Array.isArray(items) ? items : [];

    var lines = [
      '🛒 طلب جديد - Alpha Trade',
      '━━━━━━━━━━━━━━━━',
      '🔢 رقم الطلب: ' + (order.orderId || order.order_id || 'غير متاح'),
      '',
      '👤 بيانات العميل',
      'الاسم: ' + (customer.name || 'غير متاح'),
      'الهاتف: ' + (customer.phone || 'غير متاح'),
      'العنوان: ' + (customer.address || 'غير متاح'),
      '',
      '🚗 بيانات السيارة',
      'النوع: ' + (customer.carType || 'غير محدد'),
      'الموديل: ' + (customer.carModel || 'غير محدد'),
      'السنة: ' + (customer.carYear || 'غير محددة'),
      '',
      '📦 تفاصيل المنتجات'
    ];

    items.forEach(function (item, index) {
      var name = item.name || item.product_name || 'منتج';
      var qty = Number(item.qty || item.quantity) || 0;
      var price = Number(item.unit || item.unit_price) || 0;
      var subtotal = Number(item.subtotal);

      if (!Number.isFinite(subtotal)) subtotal = qty * price;

      lines.push(
        (index + 1) + '. ' + name,
        '   الكمية: ' + qty,
        '   سعر الوحدة: ' + price.toFixed(2),
        '   الإجمالي: ' + subtotal.toFixed(2) + ' جنيه'
      );
    });

    lines.push(
      '',
      '💰 إجمالي الطلب: ' +
        (Number(order.total) || 0).toFixed(2) + ' جنيه',
      '💳 طريقة الدفع: ' +
        (customer.pay === 'cod' ? 'الدفع عند الاستلام' :
         customer.pay === 'online' ? 'دفع إلكتروني' :
         customer.pay || 'غير محددة'),
      '',
      '📝 ملاحظات: ' + (customer.notes || 'لا توجد'),
      '━━━━━━━━━━━━━━━━'
    );

    return lines.join('\n');
  }

  // فتح واتساب برسالة جاهزة
  function openWhatsApp(order, customer, items) {
    var message = buildMessage(order, customer, items);
    var url = 'https://wa.me/' + WHATSAPP_NUMBER +
      '?text=' + encodeURIComponent(message);

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // إتاحة الوظيفة لباقي ملفات الموقع
  window.AlphaWhatsApp = {
    buildMessage: buildMessage,
    open: openWhatsApp
  };
})();
