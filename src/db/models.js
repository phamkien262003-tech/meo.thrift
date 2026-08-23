const { getDb } = require('../config/db');

const CATEGORIES = [
  'Đầm dạ hội',
  'Đầm công sở',
  'Đầm maxi',
  'Đầm ren',
  'Váy hoa nhí',
  'Đầm dự tiệc',
];

const ERA_TAGS = ['Y2K', 'Vintage 90s', 'Cổ điển Pháp', 'Mori nhẹ nhàng', 'Tối giản hiện đại'];

const SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL'];

const CONDITION_GRADES = ['Như mới', 'Rất tốt', 'Tốt'];

const ORDER_STATUS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

function attachImages(products) {
  const db = getDb();
  const imgStmt = db.prepare(
    'SELECT id, filename, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC'
  );
  return products.map((p) => ({ ...p, images: imgStmt.all(p.id) }));
}

function listProducts({ category, size, era, minPrice, maxPrice, q, status = 'available', sort = 'newest', limit, offset } = {}) {
  const db = getDb();
  const clauses = [];
  const params = {};

  if (status) {
    clauses.push('status = @status');
    params.status = status;
  }
  if (category) {
    clauses.push('category = @category');
    params.category = category;
  }
  if (size) {
    clauses.push('size_label = @size');
    params.size = size;
  }
  if (era) {
    clauses.push('era_tag = @era');
    params.era = era;
  }
  if (minPrice) {
    clauses.push('price >= @minPrice');
    params.minPrice = minPrice;
  }
  if (maxPrice) {
    clauses.push('price <= @maxPrice');
    params.maxPrice = maxPrice;
  }
  if (q) {
    clauses.push('(name LIKE @q OR description LIKE @q OR brand LIKE @q)');
    params.q = `%${q}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderBy =
    sort === 'price_asc'
      ? 'ORDER BY price ASC'
      : sort === 'price_desc'
      ? 'ORDER BY price DESC'
      : 'ORDER BY featured DESC, created_at DESC';

  let sql = `SELECT * FROM products ${where} ${orderBy}`;
  if (limit) {
    sql += ' LIMIT @limit';
    params.limit = limit;
    if (offset) {
      sql += ' OFFSET @offset';
      params.offset = offset;
    }
  }

  const rows = db.prepare(sql).all(params);
  return attachImages(rows);
}

function countProducts(filters = {}) {
  const db = getDb();
  const clauses = [];
  const params = {};
  const { category, size, era, minPrice, maxPrice, q, status = 'available' } = filters;

  if (status) {
    clauses.push('status = @status');
    params.status = status;
  }
  if (category) {
    clauses.push('category = @category');
    params.category = category;
  }
  if (size) {
    clauses.push('size_label = @size');
    params.size = size;
  }
  if (era) {
    clauses.push('era_tag = @era');
    params.era = era;
  }
  if (minPrice) {
    clauses.push('price >= @minPrice');
    params.minPrice = minPrice;
  }
  if (maxPrice) {
    clauses.push('price <= @maxPrice');
    params.maxPrice = maxPrice;
  }
  if (q) {
    clauses.push('(name LIKE @q OR description LIKE @q OR brand LIKE @q)');
    params.q = `%${q}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const row = db.prepare(`SELECT COUNT(*) as total FROM products ${where}`).get(params);
  return row.total;
}

function listAllProductsAdmin() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  return attachImages(rows);
}

function getProductBySlug(slug) {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug);
  if (!product) return null;
  return attachImages([product])[0];
}

function getProductById(id) {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return null;
  return attachImages([product])[0];
}

function getRelatedProducts(product, limitCount = 4) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM products WHERE category = ? AND id != ? AND status = 'available' ORDER BY RANDOM() LIMIT ?`
    )
    .all(product.category, product.id, limitCount);
  return attachImages(rows);
}

function getFeaturedProducts(limitCount = 8) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM products WHERE status = 'available' ORDER BY featured DESC, created_at DESC LIMIT ?`
    )
    .all(limitCount);
  return attachImages(rows);
}

function getSetting(key, fallback = null) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

function setSetting(key, value) {
  const db = getDb();
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}

function listJournalPosts() {
  const db = getDb();
  return db.prepare('SELECT * FROM journal_posts ORDER BY published_at DESC').all();
}

function getJournalPostBySlug(slug) {
  const db = getDb();
  return db.prepare('SELECT * FROM journal_posts WHERE slug = ?').get(slug);
}

module.exports = {
  CATEGORIES,
  ERA_TAGS,
  SIZE_LABELS,
  CONDITION_GRADES,
  ORDER_STATUS,
  listProducts,
  listAllProductsAdmin,
  countProducts,
  getProductBySlug,
  getProductById,
  getRelatedProducts,
  getFeaturedProducts,
  getSetting,
  setSetting,
  listJournalPosts,
  getJournalPostBySlug,
};
