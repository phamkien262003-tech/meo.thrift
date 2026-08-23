const express = require('express');
const router = express.Router();
const { queryOne, query, runInTransaction } = require('../config/db');
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

router.post('/api/gio-hang/thong-tin', express.json(), async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const products = await Promise.all(ids.map((id) => getProductById(Number(id))));
    const items = products
      .filter(Boolean)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        size_label: p.size_label,
        status: p.status,
        image_id: p.images[0] ? p.images[0].image_id : null,
        placeholder_tone: p.images[0] ? p.images[0].placeholder_tone : null,
      }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/dat-hang', async (req, res, next) => {
  try {
    const provider = getActiveProvider();
    res.render('pages/checkout', { title: 'Đặt hàng', payment: await provider.getInstructions() });
  } catch (err) {
    next(err);
  }
});

router.post('/dat-hang', async (req, res, next) => {
  try {
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

    const validItems = [];
    for (const raw of parsedItems) {
      const product = await getProductById(Number(raw.id));
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

    const orderId = await runInTransaction(async (tx) => {
      const info = await tx.run(
        `INSERT INTO orders (order_code, customer_name, phone, email, address, note, payment_method, status, subtotal)
         VALUES (:order_code, :customer_name, :phone, :email, :address, :note, 'manual', 'pending', :subtotal)`,
        {
          order_code: orderCode,
          customer_name,
          phone,
          email: email || null,
          address,
          note: note || null,
          subtotal,
        }
      );
      for (const p of validItems) {
        await tx.run('INSERT INTO order_items (order_id, product_id, product_name, price) VALUES (?, ?, ?, ?)', [
          info.insertId,
          p.id,
          p.name,
          p.price,
        ]);
        await tx.run("UPDATE products SET status = 'reserved', updated_at = NOW() WHERE id = ?", [p.id]);
      }
      return info.insertId;
    });

    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    const orderItems = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

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
  } catch (err) {
    next(err);
  }
});

router.get('/don-hang/:code', async (req, res, next) => {
  try {
    const order = await queryOne('SELECT * FROM orders WHERE order_code = ?', [req.params.code]);
    if (!order) {
      return res.status(404).render('pages/404', { title: 'Không tìm thấy đơn hàng' });
    }
    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const provider = getActiveProvider();
    res.render('pages/order-success', {
      title: 'Cảm ơn bạn đã đặt hàng',
      order,
      items,
      payment: await provider.getInstructions(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
