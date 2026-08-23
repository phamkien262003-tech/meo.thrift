const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const { getDb } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { saveProductImage, deleteProductImageFiles } = require('../services/images');
const {
  CATEGORIES,
  ERA_TAGS,
  SIZE_LABELS,
  CONDITION_GRADES,
  ORDER_STATUS,
  getProductById,
  listAllProductsAdmin,
  getSetting,
  setSetting,
  listJournalPosts,
  getJournalPostById,
} = require('../db/models');
const { PAGE_CONTENT, getPageContent, savePageContent } = require('../services/page-content');

router.use(requireAdmin);

router.get('/', (req, res) => {
  const db = getDb();
  const stats = {
    totalProducts: db.prepare("SELECT COUNT(*) c FROM products WHERE status = 'available'").get().c,
    reserved: db.prepare("SELECT COUNT(*) c FROM products WHERE status = 'reserved'").get().c,
    sold: db.prepare("SELECT COUNT(*) c FROM products WHERE status = 'sold'").get().c,
    pendingOrders: db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'pending'").get().c,
  };
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6').all();
  res.render('admin/dashboard', { title: 'Bảng điều khiển', stats, recentOrders, ORDER_STATUS });
});

// ---------- Products ----------

router.get('/san-pham', (req, res) => {
  const products = listAllProductsAdmin();
  res.render('admin/products', { title: 'Quản lý sản phẩm', products });
});

router.get('/san-pham/them', (req, res) => {
  res.render('admin/product-form', {
    title: 'Thêm sản phẩm',
    product: null,
    categories: CATEGORIES,
    eraTags: ERA_TAGS,
    sizeLabels: SIZE_LABELS,
    conditionGrades: CONDITION_GRADES,
  });
});

router.get('/san-pham/:id/sua', (req, res) => {
  const product = getProductById(Number(req.params.id));
  if (!product) return res.redirect('/admin/san-pham');
  res.render('admin/product-form', {
    title: 'Sửa sản phẩm',
    product,
    categories: CATEGORIES,
    eraTags: ERA_TAGS,
    sizeLabels: SIZE_LABELS,
    conditionGrades: CONDITION_GRADES,
  });
});

router.post('/san-pham', upload.array('images', 6), async (req, res, next) => {
  try {
    const db = getDb();
    const body = req.body;
    const slug = `${slugify(body.name, { lower: true, locale: 'vi', strict: true })}-${Date.now().toString(36)}`;

    const info = db
      .prepare(
        `INSERT INTO products (slug, name, category, brand, size_label, measurements, condition_grade, condition_notes, fabric, era_tag, price, original_price, description, featured)
         VALUES (@slug, @name, @category, @brand, @size_label, @measurements, @condition_grade, @condition_notes, @fabric, @era_tag, @price, @original_price, @description, @featured)`
      )
      .run({
        slug,
        name: body.name,
        category: body.category,
        brand: body.brand || null,
        size_label: body.size_label,
        measurements: body.measurements || null,
        condition_grade: body.condition_grade,
        condition_notes: body.condition_notes || null,
        fabric: body.fabric || null,
        era_tag: body.era_tag || null,
        price: Number(body.price),
        original_price: body.original_price ? Number(body.original_price) : null,
        description: body.description || null,
        featured: body.featured ? 1 : 0,
      });

    const productId = info.lastInsertRowid;
    const files = req.files || [];
    const insertImage = db.prepare(
      'INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)'
    );

    if (files.length === 0) {
      insertImage.run(productId, 'placeholder:terracotta', 0);
    } else {
      for (let i = 0; i < files.length; i += 1) {
        const baseName = `${slug}-${i}-${Date.now().toString(36)}`;
        await saveProductImage(files[i].buffer, baseName);
        insertImage.run(productId, `${baseName}-thumb.webp`, i);
      }
    }

    req.session.flash = { type: 'success', message: 'Đã thêm sản phẩm mới.' };
    res.redirect('/admin/san-pham');
  } catch (err) {
    next(err);
  }
});

router.post('/san-pham/:id', upload.array('images', 6), async (req, res, next) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const body = req.body;

    db.prepare(
      `UPDATE products SET name=@name, category=@category, brand=@brand, size_label=@size_label,
       measurements=@measurements, condition_grade=@condition_grade, condition_notes=@condition_notes,
       fabric=@fabric, era_tag=@era_tag, price=@price, original_price=@original_price,
       description=@description, featured=@featured, status=@status, updated_at=datetime('now')
       WHERE id=@id`
    ).run({
      id,
      name: body.name,
      category: body.category,
      brand: body.brand || null,
      size_label: body.size_label,
      measurements: body.measurements || null,
      condition_grade: body.condition_grade,
      condition_notes: body.condition_notes || null,
      fabric: body.fabric || null,
      era_tag: body.era_tag || null,
      price: Number(body.price),
      original_price: body.original_price ? Number(body.original_price) : null,
      description: body.description || null,
      featured: body.featured ? 1 : 0,
      status: body.status || 'available',
    });

    const files = req.files || [];
    if (files.length > 0) {
      const product = getProductById(id);
      // Ảnh mới được THÊM vào, không xóa ảnh cũ — trừ ảnh minh họa placeholder (không còn cần khi đã có ảnh thật).
      const realImages = product.images.filter((img) => !img.filename.startsWith('placeholder:'));
      const placeholders = product.images.filter((img) => img.filename.startsWith('placeholder:'));
      if (realImages.length > 0 || files.length > 0) {
        placeholders.forEach((img) => db.prepare('DELETE FROM product_images WHERE id = ?').run(img.id));
      }
      const insertImage = db.prepare(
        'INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)'
      );
      let nextSort = realImages.length;
      for (let i = 0; i < files.length; i += 1) {
        const baseName = `${product.slug}-${nextSort}-${Date.now().toString(36)}-${i}`;
        await saveProductImage(files[i].buffer, baseName);
        insertImage.run(id, `${baseName}-thumb.webp`, nextSort);
        nextSort += 1;
      }
    }

    req.session.flash = { type: 'success', message: 'Đã cập nhật sản phẩm.' };
    res.redirect('/admin/san-pham');
  } catch (err) {
    next(err);
  }
});

router.post('/san-pham/:id/anh/:imageId/xoa', (req, res) => {
  const db = getDb();
  const { id, imageId } = req.params;
  const image = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(Number(imageId), Number(id));
  if (image) {
    deleteProductImageFiles(image.filename);
    db.prepare('DELETE FROM product_images WHERE id = ?').run(image.id);
    const remaining = db.prepare('SELECT COUNT(*) AS c FROM product_images WHERE product_id = ?').get(Number(id));
    if (remaining.c === 0) {
      db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, 0)').run(Number(id), 'placeholder:terracotta');
    }
  }
  req.session.flash = { type: 'success', message: 'Đã xóa ảnh.' };
  res.redirect(`/admin/san-pham/${id}/sua`);
});

router.post('/san-pham/:id/xoa', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const product = getProductById(id);
  if (product) {
    product.images.forEach((img) => deleteProductImageFiles(img.filename));
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }
  req.session.flash = { type: 'success', message: 'Đã xóa sản phẩm.' };
  res.redirect('/admin/san-pham');
});

// ---------- Orders ----------

router.get('/don-hang', (req, res) => {
  const db = getDb();
  const status = req.query.trang_thai;
  const orders = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.render('admin/orders', { title: 'Quản lý đơn hàng', orders, ORDER_STATUS, status });
});

router.get('/don-hang/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!order) return res.redirect('/admin/don-hang');
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.render('admin/order-detail', { title: `Đơn hàng ${order.order_code}`, order, items, ORDER_STATUS });
});

router.post('/don-hang/:id/trang-thai', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.redirect('/admin/don-hang');

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  if (status === 'completed') {
    items.forEach((it) => {
      if (it.product_id) {
        db.prepare("UPDATE products SET status = 'sold', updated_at = datetime('now') WHERE id = ?").run(it.product_id);
      }
    });
  } else if (status === 'cancelled') {
    items.forEach((it) => {
      if (it.product_id) {
        db.prepare("UPDATE products SET status = 'available', updated_at = datetime('now') WHERE id = ?").run(it.product_id);
      }
    });
  }

  req.session.flash = { type: 'success', message: 'Đã cập nhật trạng thái đơn hàng.' };
  res.redirect(`/admin/don-hang/${id}`);
});

// ---------- Settings ----------

router.get('/cai-dat', (req, res) => {
  res.render('admin/settings', {
    title: 'Cài đặt',
    bankName: getSetting('bank_name', process.env.BANK_NAME || ''),
    bankAccountName: getSetting('bank_account_name', process.env.BANK_ACCOUNT_NAME || ''),
    bankAccountNumber: getSetting('bank_account_number', process.env.BANK_ACCOUNT_NUMBER || ''),
  });
});

router.post('/cai-dat', (req, res) => {
  setSetting('bank_name', req.body.bank_name || '');
  setSetting('bank_account_name', req.body.bank_account_name || '');
  setSetting('bank_account_number', req.body.bank_account_number || '');
  req.session.flash = { type: 'success', message: 'Đã lưu cài đặt.' };
  res.redirect('/admin/cai-dat');
});

router.post('/cai-dat/lien-he', (req, res) => {
  setSetting('contact_email', req.body.contact_email || '');
  setSetting('contact_phone', req.body.contact_phone || '');
  setSetting('contact_zalo_url', req.body.contact_zalo_url || '');
  setSetting('contact_instagram_handle', req.body.contact_instagram_handle || '');
  setSetting('contact_instagram_url', req.body.contact_instagram_url || '');
  setSetting('contact_facebook_url', req.body.contact_facebook_url || '');
  req.session.flash = { type: 'success', message: 'Đã lưu thông tin liên hệ.' };
  res.redirect('/admin/cai-dat');
});

// ---------- Nội dung trang (page content) ----------

router.get('/noi-dung', (req, res) => {
  res.render('admin/content-list', { title: 'Nội dung trang', pages: PAGE_CONTENT });
});

router.get('/noi-dung/:page', (req, res) => {
  const schema = PAGE_CONTENT[req.params.page];
  if (!schema) return res.redirect('/admin/noi-dung');
  res.render('admin/content-edit', {
    title: `Nội dung — ${schema.label}`,
    page: req.params.page,
    schema,
    values: getPageContent(req.params.page),
  });
});

router.post('/noi-dung/:page', (req, res) => {
  const schema = PAGE_CONTENT[req.params.page];
  if (!schema) return res.redirect('/admin/noi-dung');
  savePageContent(req.params.page, req.body);
  req.session.flash = { type: 'success', message: `Đã lưu nội dung trang "${schema.label}".` };
  res.redirect(`/admin/noi-dung/${req.params.page}`);
});

// ---------- Nhật ký (Journal) ----------

router.get('/nhat-ky', (req, res) => {
  const posts = listJournalPosts();
  res.render('admin/journal-list', { title: 'Quản lý nhật ký', posts });
});

router.get('/nhat-ky/them', (req, res) => {
  res.render('admin/journal-form', { title: 'Viết bài mới', post: null });
});

router.get('/nhat-ky/:id/sua', (req, res) => {
  const post = getJournalPostById(Number(req.params.id));
  if (!post) return res.redirect('/admin/nhat-ky');
  res.render('admin/journal-form', { title: 'Sửa bài viết', post });
});

router.post('/nhat-ky', upload.single('cover_image'), async (req, res, next) => {
  try {
    const db = getDb();
    const { title, excerpt, content } = req.body;
    const slug = `${slugify(title, { lower: true, locale: 'vi', strict: true })}-${Date.now().toString(36)}`;

    let coverImage = 'placeholder:terracotta';
    if (req.file) {
      const baseName = `journal-${slug}-${Date.now().toString(36)}`;
      await saveProductImage(req.file.buffer, baseName);
      coverImage = `${baseName}-thumb.webp`;
    }

    db.prepare(
      `INSERT INTO journal_posts (slug, title, excerpt, content, cover_image, published_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).run(slug, title, excerpt || null, content || null, coverImage);

    req.session.flash = { type: 'success', message: 'Đã đăng bài viết mới.' };
    res.redirect('/admin/nhat-ky');
  } catch (err) {
    next(err);
  }
});

router.post('/nhat-ky/:id', upload.single('cover_image'), async (req, res, next) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { title, excerpt, content } = req.body;
    const existing = getJournalPostById(id);
    if (!existing) return res.redirect('/admin/nhat-ky');

    let coverImage = existing.cover_image;
    if (req.file) {
      deleteProductImageFiles(existing.cover_image);
      const baseName = `journal-${existing.slug}-${Date.now().toString(36)}`;
      await saveProductImage(req.file.buffer, baseName);
      coverImage = `${baseName}-thumb.webp`;
    }

    db.prepare('UPDATE journal_posts SET title = ?, excerpt = ?, content = ?, cover_image = ? WHERE id = ?').run(
      title,
      excerpt || null,
      content || null,
      coverImage,
      id
    );

    req.session.flash = { type: 'success', message: 'Đã cập nhật bài viết.' };
    res.redirect('/admin/nhat-ky');
  } catch (err) {
    next(err);
  }
});

router.post('/nhat-ky/:id/xoa', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const existing = getJournalPostById(id);
  if (existing) {
    deleteProductImageFiles(existing.cover_image);
    db.prepare('DELETE FROM journal_posts WHERE id = ?').run(id);
  }
  req.session.flash = { type: 'success', message: 'Đã xóa bài viết.' };
  res.redirect('/admin/nhat-ky');
});

module.exports = router;
