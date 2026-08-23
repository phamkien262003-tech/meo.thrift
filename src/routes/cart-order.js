const express = require('express');
const router = express.Router();
const { getDb, runInTransaction } = require('../config/db');
const { getProductById } = require('../db/models');
const { getActiveProvider } = require('../services/payments');
const { sendMail, formatOrderEmailHtml } = require('../services/mailer');

function generateOrderCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TMR-${stamp}-${rand}`;
}

router.get('/gio-hang', (req, res) => {
  res.render('pages/cart', { title: 'Giỏ hàng' });
});

router.get('/yeu-thich', (req, res) => {
  res.render('pages/wishlist', { title: 'Sản phẩm yêu thích' });
});

router.post('/api/gio-hang/thong-tin', express.json(), (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const items = ids
    .map((id) => getProductById(Number(id)))
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      size_label: p.size_label,
      status: p.status,
      image: p.images[0] ? p.images[0].filename : null,
    }));
  res.json({ items });
});

router.get('/dat-hang', (req, res) => {
  const provider = getActiveProvider();
  res.render('pages/checkout', { title: 'Đặt hàng', payment: provider.getInstructions() });
});

router.post('/dat-hang', (req, res) => {
  const { customer_name, phone, email, address, note, items } = req.body;

  if (!customer_name || !phone || !address || !items) {
    req.session.flash = { type: 'error', message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' };
    return res.redirect('/dat-hang');
  }

  let parsedItems;
  try {
    parsedItems = JSON.parse(items);
  } catch (e) {
    parsedItems = [];
  }
  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    req.session.flash = { type: 'error', message: 'Giỏ hàng của bạn đang trống.' };
    return res.redirect('/gio-hang');
  }

  const db = getDb();
  const validItems = [];
  for (const raw of parsedItems) {
    const product = getProductById(Number(raw.id));
    if (product && product.status === 'available') {
      validItems.push(product);
    }
  }

  if (validItems.length === 0) {
    req.session.flash = {
      type: 'error',
      message: 'Rất tiếc, các sản phẩm trong giỏ đã được đặt bởi khách khác. Vui lòng chọn sản phẩm khác.',
    };
    return res.redirect('/gio-hang');
  }

  const subtotal = validItems.reduce((sum, p) => sum + p.price, 0);
  const orderCode = generateOrderCode();

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_code, customer_name, phone, email, address, note, payment_method, status, subtotal)
    VALUES (@order_code, @customer_name, @phone, @email, @address, @note, 'manual', 'pending', @subtotal)
  `);
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, product_name, price) VALUES (?, ?, ?, ?)'
  );
  const reserveProduct = db.prepare("UPDATE products SET status = 'reserved', updated_at = datetime('now') WHERE id = ?");

  const orderId = runInTransaction(() => {
    const info = insertOrder.run({
      order_code: orderCode,
      customer_name,
      phone,
      email: email || null,
      address,
      note: note || null,
      subtotal,
    });
    validItems.forEach((p) => {
      insertItem.run(info.lastInsertRowid, p.id, p.name, p.price);
      reserveProduct.run(p.id);
    });
    return info.lastInsertRowid;
  });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  const notifyEmail = process.env.SHOP_NOTIFY_EMAIL || process.env.SMTP_USER;
  if (notifyEmail) {
    sendMail({
      to: notifyEmail,
      subject: `Đơn hàng mới: ${order.order_code}`,
      html: formatOrderEmailHtml(order, orderItems),
    });
  }
  if (order.email) {
    sendMail({
      to: order.email,
      subject: `teo.mhrift đã nhận đơn hàng ${order.order_code}`,
      html: formatOrderEmailHtml(order, orderItems),
    });
  }

  res.redirect(`/don-hang/${order.order_code}`);
});

router.get('/don-hang/:code', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(req.params.code);
  if (!order) {
    return res.status(404).render('pages/404', { title: 'Không tìm thấy đơn hàng' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const provider = getActiveProvider();
  res.render('pages/order-success', {
    title: 'Cảm ơn bạn đã đặt hàng',
    order,
    items,
    payment: provider.getInstructions(),
  });
});

module.exports = router;
