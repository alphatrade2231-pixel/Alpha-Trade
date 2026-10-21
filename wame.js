
(function (w) {
  'use strict';

  // رقم واتساب الاختبار — غيّره لاحقًا لرقم صاحب الموقع
  var WHATSAPP_NUMBER = '201114094278';

  function buildMessage(order) {
    var customer = order.customer || {};
    var items = order.items || [];

    var lines = [
      '🛒 طلب جديد - Alpha Trade',
      '━━━━━━━━━━━━━━━━━━',
      '🔢 رقم الطلب: ' + (order.orderId || 'غير متاح'),
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
      '📦 المنتجات'
    ];

    items.forEach(function (item, index) {
      lines.push(
        (index + 1) + '. ' + item.name,
        '   الكمية: ' + item.qty,
        '   سعر الوحدة: ' + Number(item.unit || 0).toFixed(2),
        '   الإجمالي: ' + Number(item.subtotal || 0).toFixed(2)
      );
    });

    lines.push(
      '',
      '💰 إجمالي الطلب: ' + Number(order.total || 0).toFixed(2),
      '💳 طريقة الدفع: ' +
        (customer.pay === 'cod' ? 'الدفع عند الاستلام' : customer.pay),
      '📝 ملاحظات: ' + (customer.notes || 'لا توجد'),
      '',
      'برجاء مراجعة الطلب وتأكيده.',
      'Alpha Trade'
    );

    return lines.join('\n');
  }

  function url(order) {
    return 'https://wa.me/' + WHATSAPP_NUMBER +
      '?text=' + encodeURIComponent(buildMessage(order));
  }

  w.AlphaWhatsApp = {
    url: url,
    buildMessage: buildMessage
  };
})(window);
