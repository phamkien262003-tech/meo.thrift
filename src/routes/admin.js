const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const { query, queryOne, run } = require('../config/db');
const bcrypt = require('bcryptjs');
const { requireAdmin, requireLevel1 } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { saveImage, deleteImage, resolveImage } = require('../services/images');
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
const { PAGE_CONTENT, getPageContent, savePageContent, updatePageContentField } = require('../services/page-content');

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const [totalProducts, reserved, sold, pendingOrders, recentOrders] = await Promise.all([
      queryOne("SELECT COUNT(*) c FROM products WHERE status = 'available'"),
      queryOne("SELECT COUNT(*) c FROM products WHERE status = 'reserved'"),
      queryOne("SELECT COUNT(*) c FROM products WHERE status = 'sold'"),
      queryOne("SELECT COUNT(*) c FROM orders WHERE status = 'pending'"),
      query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6'),
    ]);
    const stats = {
      totalProducts: totalProducts.c,
      reserved: reserved.c,
      sold: sold.c,
      pendingOrders: pendingOrders.c,
    };
    res.render('admin/dashboard', { title: 'Bảng điều khiển', stats, recentOrders, ORDER_STATUS });
  } catch (err) {
    next(err);
  }
});

// ---------- Products ----------

router.get('/san-pham', async (req, res, next) => {
  try {
    const products = await listAllProductsAdmin();
    res.render('admin/products', { title: 'Quản lý sản phẩm', products });
  } catch (err) {
    next(err);
  }
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

router.get('/san-pham/:id/sua', async (req, res, next) => {
  try {
    const product = await getProductById(Number(req.params.id));
    if (!product) return res.redirect('/admin/san-pham');
    res.render('admin/product-form', {
      title: 'Sửa sản phẩm',
      product,
      categories: CATEGORIES,
      eraTags: ERA_TAGS,
      sizeLabels: SIZE_LABELS,
      conditionGrades: CONDITION_GRADES,
    });
  } catch (err) {
    next(err);
  }
});

const PLACEHOLDER_TONES = ['terracotta', 'olive', 'rose', 'sand', 'clay'];

router.post('/san-pham', upload.array('images', 6), async (req, res, next) => {
  try {
    const body = req.body;
    const slug = `${slugify(body.name, { lower: true, locale: 'vi', strict: true })}-${Date.now().toString(36)}`;

    const info = await run(
      `INSERT INTO products (slug, name, category, brand, size_label, measurements, condition_grade, condition_notes, fabric, era_tag, price, original_price, description, featured)
       VALUES (:slug, :name, :category, :brand, :size_label, :measurements, :condition_grade, :condition_notes, :fabric, :era_tag, :price, :original_price, :description, :featured)`,
      {
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
      }
    );

    const productId = info.insertId;
    const files = req.files || [];

    if (files.length === 0) {
      const tone = PLACEHOLDER_TONES[productId % PLACEHOLDER_TONES.length];
      await run('INSERT INTO product_images (product_id, placeholder_tone, sort_order) VALUES (?, ?, 0)', [productId, tone]);
    } else {
      for (let i = 0; i < files.length; i += 1) {
        const imageId = await saveImage(files[i].buffer);
        await run('INSERT INTO product_images (product_id, image_id, sort_order) VALUES (?, ?, ?)', [productId, imageId, i]);
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
    const id = Number(req.params.id);
    const body = req.body;

    await run(
      `UPDATE products SET name=:name, category=:category, brand=:brand, size_label=:size_label,
       measurements=:measurements, condition_grade=:condition_grade, condition_notes=:condition_notes,
       fabric=:fabric, era_tag=:era_tag, price=:price, original_price=:original_price,
       description=:description, featured=:featured, status=:status, updated_at=NOW()
       WHERE id=:id`,
      {
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
      }
    );

    const files = req.files || [];
    if (files.length > 0) {
      const product = await getProductById(id);
      // Ảnh mới được THÊM vào, không xóa ảnh cũ — trừ ảnh minh họa placeholder (không còn cần khi đã có ảnh thật).
      const realImages = product.images.filter((img) => img.image_id);
      const placeholders = product.images.filter((img) => !img.image_id);
      if (placeholders.length > 0) {
        for (const img of placeholders) {
          await run('DELETE FROM product_images WHERE id = ?', [img.id]);
        }
      }
      let nextSort = realImages.length;
      for (let i = 0; i < files.length; i += 1) {
        const imageId = await saveImage(files[i].buffer);
        await run('INSERT INTO product_images (product_id, image_id, sort_order) VALUES (?, ?, ?)', [id, imageId, nextSort]);
        nextSort += 1;
      }
    }

    req.session.flash = { type: 'success', message: 'Đã cập nhật sản phẩm.' };
    res.redirect('/admin/san-pham');
  } catch (err) {
    next(err);
  }
});

router.post('/san-pham/:id/anh/:imageId/xoa', async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const image = await queryOne('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [Number(imageId), Number(id)]);
    if (image) {
      await run('DELETE FROM product_images WHERE id = ?', [image.id]);
      if (image.image_id) await deleteImage(image.image_id);
      const remaining = await queryOne('SELECT COUNT(*) AS c FROM product_images WHERE product_id = ?', [Number(id)]);
      if (remaining.c === 0) {
        const tone = PLACEHOLDER_TONES[Number(id) % PLACEHOLDER_TONES.length];
        await run('INSERT INTO product_images (product_id, placeholder_tone, sort_order) VALUES (?, ?, 0)', [Number(id), tone]);
      }
    }
    req.session.flash = { type: 'success', message: 'Đã xóa ảnh.' };
    res.redirect(`/admin/san-pham/${id}/sua`);
  } catch (err) {
    next(err);
  }
});

router.post('/san-pham/:id/xoa', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const product = await getProductById(id);
    if (product) {
      for (const img of product.images) {
        if (img.image_id) await deleteImage(img.image_id);
      }
      await run('DELETE FROM products WHERE id = ?', [id]);
    }
    req.session.flash = { type: 'success', message: 'Đã xóa sản phẩm.' };
    res.redirect('/admin/san-pham');
  } catch (err) {
    next(err);
  }
});

// ---------- Orders ----------

router.get('/don-hang', async (req, res, next) => {
  try {
    const status = req.query.trang_thai;
    const orders = status
      ? await query('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', [status])
      : await query('SELECT * FROM orders ORDER BY created_at DESC');
    res.render('admin/orders', { title: 'Quản lý đơn hàng', orders, ORDER_STATUS, status });
  } catch (err) {
    next(err);
  }
});

router.get('/don-hang/:id', async (req, res, next) => {
  try {
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [Number(req.params.id)]);
    if (!order) return res.redirect('/admin/don-hang');
    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    res.render('admin/order-detail', { title: `Đơn hàng ${order.order_code}`, order, items, ORDER_STATUS });
  } catch (err) {
    next(err);
  }
});

router.post('/don-hang/:id/trang-thai', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.redirect('/admin/don-hang');

    await run('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    if (status === 'completed') {
      for (const it of items) {
        if (it.product_id) await run("UPDATE products SET status = 'sold', updated_at = NOW() WHERE id = ?", [it.product_id]);
      }
    } else if (status === 'cancelled') {
      for (const it of items) {
        if (it.product_id) await run("UPDATE products SET status = 'available', updated_at = NOW() WHERE id = ?", [it.product_id]);
      }
    }

    req.session.flash = { type: 'success', message: 'Đã cập nhật trạng thái đơn hàng.' };
    res.redirect(`/admin/don-hang/${id}`);
  } catch (err) {
    next(err);
  }
});

// ---------- Settings ----------

router.get('/cai-dat', async (req, res, next) => {
  try {
    const [bankName, bankAccountName, bankAccountNumber] = await Promise.all([
      getSetting('bank_name', process.env.BANK_NAME || ''),
      getSetting('bank_account_name', process.env.BANK_ACCOUNT_NAME || ''),
      getSetting('bank_account_number', process.env.BANK_ACCOUNT_NUMBER || ''),
    ]);
    res.render('admin/settings', { title: 'Cài đặt', bankName, bankAccountName, bankAccountNumber });
  } catch (err) {
    next(err);
  }
});

router.post('/cai-dat', async (req, res, next) => {
  try {
    await Promise.all([
      setSetting('bank_name', req.body.bank_name || ''),
      setSetting('bank_account_name', req.body.bank_account_name || ''),
      setSetting('bank_account_number', req.body.bank_account_number || ''),
    ]);
    req.session.flash = { type: 'success', message: 'Đã lưu cài đặt.' };
    res.redirect('/admin/cai-dat');
  } catch (err) {
    next(err);
  }
});

router.post('/cai-dat/lien-he', async (req, res, next) => {
  try {
    await Promise.all([
      setSetting('contact_email', req.body.contact_email || ''),
      setSetting('contact_phone', req.body.contact_phone || ''),
      setSetting('contact_zalo_url', req.body.contact_zalo_url || ''),
      setSetting('contact_instagram_handle', req.body.contact_instagram_handle || ''),
      setSetting('contact_instagram_url', req.body.contact_instagram_url || ''),
      setSetting('contact_facebook_url', req.body.contact_facebook_url || ''),
    ]);
    req.session.flash = { type: 'success', message: 'Đã lưu thông tin liên hệ.' };
    res.redirect('/admin/cai-dat');
  } catch (err) {
    next(err);
  }
});

// ---------- Quản trị viên (chỉ cấp 1) ----------

router.get('/quan-tri-vien', requireLevel1, async (req, res, next) => {
  try {
    const [admins, requests] = await Promise.all([
      query('SELECT id, email, role, created_at FROM admin_users ORDER BY created_at ASC'),
      query('SELECT id, email, created_at FROM admin_requests ORDER BY created_at ASC'),
    ]);
    res.render('admin/admins', { title: 'Quản trị viên', admins, requests, isAdminSelfId: req.session.adminId });
  } catch (err) {
    next(err);
  }
});

router.post('/quan-tri-vien', requireLevel1, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      req.session.flash = { type: 'error', message: 'Cần email hợp lệ và mật khẩu tối thiểu 6 ký tự.' };
      return res.redirect('/admin/quan-tri-vien');
    }
    const existing = await queryOne('SELECT id FROM admin_users WHERE email = ?', [email]);
    if (existing) {
      req.session.flash = { type: 'error', message: 'Email này đã là quản trị viên.' };
      return res.redirect('/admin/quan-tri-vien');
    }
    const hash = bcrypt.hashSync(password, 10);
    await run("INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'level2')", [email, hash]);
    req.session.flash = { type: 'success', message: `Đã thêm quản trị viên cấp 2: ${email}.` };
    res.redirect('/admin/quan-tri-vien');
  } catch (err) {
    next(err);
  }
});

router.post('/quan-tri-vien/:id/vai-tro', requireLevel1, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    if (!['level1', 'level2'].includes(role)) {
      req.session.flash = { type: 'error', message: 'Cấp quản trị không hợp lệ.' };
      return res.redirect('/admin/quan-tri-vien');
    }
    if (id === req.session.adminId) {
      req.session.flash = { type: 'error', message: 'Không thể tự đổi cấp của chính mình.' };
      return res.redirect('/admin/quan-tri-vien');
    }
    if (role === 'level2') {
      const target = await queryOne('SELECT role FROM admin_users WHERE id = ?', [id]);
      const { c } = await queryOne("SELECT COUNT(*) c FROM admin_users WHERE role = 'level1'");
      if (target && target.role === 'level1' && c <= 1) {
        req.session.flash = { type: 'error', message: 'Không thể hạ cấp — cần giữ ít nhất 1 quản trị viên cấp 1.' };
        return res.redirect('/admin/quan-tri-vien');
      }
    }
    await run('UPDATE admin_users SET role = ? WHERE id = ?', [role, id]);
    req.session.flash = { type: 'success', message: 'Đã cập nhật cấp quản trị.' };
    res.redirect('/admin/quan-tri-vien');
  } catch (err) {
    next(err);
  }
});

router.post('/quan-tri-vien/:id/xoa', requireLevel1, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.session.adminId) {
      req.session.flash = { type: 'error', message: 'Không thể tự xoá tài khoản của chính mình.' };
      return res.redirect('/admin/quan-tri-vien');
    }
    const target = await queryOne('SELECT role FROM admin_users WHERE id = ?', [id]);
    if (target && target.role === 'level1') {
      const { c } = await queryOne("SELECT COUNT(*) c FROM admin_users WHERE role = 'level1'");
      if (c <= 1) {
        req.session.flash = { type: 'error', message: 'Không thể xoá — cần giữ ít nhất 1 quản trị viên cấp 1.' };
        return res.redirect('/admin/quan-tri-vien');
      }
    }
    await run('DELETE FROM admin_users WHERE id = ?', [id]);
    req.session.flash = { type: 'success', message: 'Đã xoá quản trị viên.' };
    res.redirect('/admin/quan-tri-vien');
  } catch (err) {
    next(err);
  }
});

router.post('/quan-tri-vien/yeu-cau/:id/duyet', requireLevel1, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const request = await queryOne('SELECT * FROM admin_requests WHERE id = ?', [id]);
    if (!request) {
      req.session.flash = { type: 'error', message: 'Yêu cầu không tồn tại hoặc đã được xử lý.' };
      return res.redirect('/admin/quan-tri-vien');
    }
    const existing = await queryOne('SELECT id FROM admin_users WHERE email = ?', [request.email]);
    if (existing) {
      await run('DELETE FROM admin_requests WHERE id = ?', [id]);
      req.session.flash = { type: 'error', message: 'Email này đã là quản trị viên — đã xoá yêu cầu trùng.' };
      return res.redirect('/admin/quan-tri-vien');
    }
    await run("INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'level2')", [
      request.email,
      request.password_hash,
    ]);
    await run('DELETE FROM admin_requests WHERE id = ?', [id]);
    req.session.flash = { type: 'success', message: `Đã phê duyệt — ${request.email} là quản trị viên cấp 2.` };
    res.redirect('/admin/quan-tri-vien');
  } catch (err) {
    next(err);
  }
});

router.post('/quan-tri-vien/yeu-cau/:id/tu-choi', requireLevel1, async (req, res, next) => {
  try {
    await run('DELETE FROM admin_requests WHERE id = ?', [Number(req.params.id)]);
    req.session.flash = { type: 'success', message: 'Đã từ chối yêu cầu.' };
    res.redirect('/admin/quan-tri-vien');
  } catch (err) {
    next(err);
  }
});

// ---------- Nội dung trang (page content) ----------

const PAGE_LIVE_URL = {
  home: '/',
  about: '/ve-chung-toi',
  faq: '/cau-hoi-thuong-gap',
  policy: '/chinh-sach',
  sizeGuide: '/huong-dan-chon-size',
  contact: '/lien-he',
  footer: '/#site-footer',
};

router.get('/noi-dung', (req, res) => {
  res.render('admin/content-list', { title: 'Nội dung trang', pages: PAGE_CONTENT, liveUrls: PAGE_LIVE_URL });
});

router.get('/noi-dung/:page', async (req, res, next) => {
  try {
    const schema = PAGE_CONTENT[req.params.page];
    if (!schema) return res.redirect('/admin/noi-dung');
    res.render('admin/content-edit', {
      title: `Nội dung — ${schema.label}`,
      page: req.params.page,
      schema,
      values: await getPageContent(req.params.page),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/noi-dung/:page', async (req, res, next) => {
  try {
    const schema = PAGE_CONTENT[req.params.page];
    if (!schema) return res.redirect('/admin/noi-dung');
    await savePageContent(req.params.page, req.body);
    req.session.flash = { type: 'success', message: `Đã lưu nội dung trang "${schema.label}".` };
    res.redirect(`/admin/noi-dung/${req.params.page}`);
  } catch (err) {
    next(err);
  }
});

// Inline click-to-edit on the live pages (see public/js/inline-edit.js).
router.post('/noi-dung/api/text', async (req, res, next) => {
  try {
    const { page, key, value } = req.body;
    if (typeof page !== 'string' || typeof key !== 'string' || typeof value !== 'string') {
      return res.status(400).json({ ok: false, error: 'invalid_request' });
    }
    const ok = await updatePageContentField(page, key, value);
    if (!ok) return res.status(400).json({ ok: false, error: 'unknown_field' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/noi-dung/api/image', upload.single('image'), async (req, res, next) => {
  try {
    const { page, key } = req.body;
    const schema = PAGE_CONTENT[page];
    const field = schema && schema.groups.flatMap((g) => g.fields).find((f) => f.key === key && f.type === 'image');
    if (!field) return res.status(400).json({ ok: false, error: 'unknown_field' });
    if (!req.file) return res.status(400).json({ ok: false, error: 'no_file' });

    const previous = (await getPageContent(page))[key];
    const imageId = await saveImage(req.file.buffer);
    await updatePageContentField(page, key, imageId);
    if (previous) await deleteImage(previous);

    res.json({ ok: true, src: resolveImage(imageId).src });
  } catch (err) {
    next(err);
  }
});

// ---------- Nhật ký (Journal) ----------

router.get('/nhat-ky', async (req, res, next) => {
  try {
    const posts = await listJournalPosts();
    res.render('admin/journal-list', { title: 'Quản lý nhật ký', posts });
  } catch (err) {
    next(err);
  }
});

router.get('/nhat-ky/them', (req, res) => {
  res.render('admin/journal-form', { title: 'Viết bài mới', post: null });
});

router.get('/nhat-ky/:id/sua', async (req, res, next) => {
  try {
    const post = await getJournalPostById(Number(req.params.id));
    if (!post) return res.redirect('/admin/nhat-ky');
    res.render('admin/journal-form', { title: 'Sửa bài viết', post });
  } catch (err) {
    next(err);
  }
});

router.post('/nhat-ky', upload.single('cover_image'), async (req, res, next) => {
  try {
    const { title, excerpt, content } = req.body;
    const slug = `${slugify(title, { lower: true, locale: 'vi', strict: true })}-${Date.now().toString(36)}`;

    let coverImageId = null;
    if (req.file) {
      coverImageId = await saveImage(req.file.buffer);
    }

    await run(
      `INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_id, published_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [slug, title, excerpt || null, content || null, coverImageId]
    );

    req.session.flash = { type: 'success', message: 'Đã đăng bài viết mới.' };
    res.redirect('/admin/nhat-ky');
  } catch (err) {
    next(err);
  }
});

router.post('/nhat-ky/:id', upload.single('cover_image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, excerpt, content } = req.body;
    const existing = await getJournalPostById(id);
    if (!existing) return res.redirect('/admin/nhat-ky');

    let coverImageId = existing.cover_image_id;
    if (req.file) {
      const newImageId = await saveImage(req.file.buffer);
      if (existing.cover_image_id) await deleteImage(existing.cover_image_id);
      coverImageId = newImageId;
    }

    await run('UPDATE journal_posts SET title = ?, excerpt = ?, content = ?, cover_image_id = ? WHERE id = ?', [
      title,
      excerpt || null,
      content || null,
      coverImageId,
      id,
    ]);

    req.session.flash = { type: 'success', message: 'Đã cập nhật bài viết.' };
    res.redirect('/admin/nhat-ky');
  } catch (err) {
    next(err);
  }
});

router.post('/nhat-ky/:id/xoa', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await getJournalPostById(id);
    if (existing) {
      if (existing.cover_image_id) await deleteImage(existing.cover_image_id);
      await run('DELETE FROM journal_posts WHERE id = ?', [id]);
    }
    req.session.flash = { type: 'success', message: 'Đã xóa bài viết.' };
    res.redirect('/admin/nhat-ky');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
