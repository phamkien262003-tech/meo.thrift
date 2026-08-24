const { query, queryOne, run } = require('../config/db');

const CATEGORIES = [
  'Đầm dạ hội',
  'Đầm công sở',
  'Đầm maxi',
  'Đầm ren',
  'Váy hoa nhí',
  'Đầm dự tiệc',
  'Chân váy',
  'Áo sơ mi',
  'Áo len',
  'Áo khoác',
  'Phụ kiện',
  'Set phối đồ',
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

async function attachImages(products) {
  const results = [];
  for (const p of products) {
    const images = await query(
      'SELECT id, image_id, placeholder_tone, sort_order FROM product_images WHERE product_id = :id ORDER BY sort_order ASC, id ASC',
      { id: p.id }
    );
    results.push({ ...p, images });
  }
  return results;
}

async function listProducts({ category, size, era, minPrice, maxPrice, q, status = 'available', sort = 'newest', limit, offset } = {}) {
  const clauses = [];
  const params = {};

  if (status) {
    clauses.push('status = :status');
    params.status = status;
  }
  if (category) {
    clauses.push('category = :category');
    params.category = category;
  }
  if (size) {
    clauses.push('size_label = :size');
    params.size = size;
  }
  if (era) {
    clauses.push('era_tag = :era');
    params.era = era;
  }
  if (minPrice) {
    clauses.push('price >= :minPrice');
    params.minPrice = minPrice;
  }
  if (maxPrice) {
    clauses.push('price <= :maxPrice');
    params.maxPrice = maxPrice;
  }
  if (q) {
    clauses.push('(name LIKE :q OR description LIKE :q OR brand LIKE :q)');
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
    sql += ' LIMIT :limit';
    params.limit = Number(limit);
    if (offset) {
      sql += ' OFFSET :offset';
      params.offset = Number(offset);
    }
  }

  const rows = await query(sql, params);
  return attachImages(rows);
}

async function countProducts(filters = {}) {
  const clauses = [];
  const params = {};
  const { category, size, era, minPrice, maxPrice, q, status = 'available' } = filters;

  if (status) {
    clauses.push('status = :status');
    params.status = status;
  }
  if (category) {
    clauses.push('category = :category');
    params.category = category;
  }
  if (size) {
    clauses.push('size_label = :size');
    params.size = size;
  }
  if (era) {
    clauses.push('era_tag = :era');
    params.era = era;
  }
  if (minPrice) {
    clauses.push('price >= :minPrice');
    params.minPrice = minPrice;
  }
  if (maxPrice) {
    clauses.push('price <= :maxPrice');
    params.maxPrice = maxPrice;
  }
  if (q) {
    clauses.push('(name LIKE :q OR description LIKE :q OR brand LIKE :q)');
    params.q = `%${q}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const row = await queryOne(`SELECT COUNT(*) as total FROM products ${where}`, params);
  return row.total;
}

async function listAllProductsAdmin() {
  const rows = await query('SELECT * FROM products ORDER BY created_at DESC');
  return attachImages(rows);
}

async function getProductBySlug(slug) {
  const product = await queryOne('SELECT * FROM products WHERE slug = ?', [slug]);
  if (!product) return null;
  return (await attachImages([product]))[0];
}

async function getProductById(id) {
  const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) return null;
  return (await attachImages([product]))[0];
}

async function getRelatedProducts(product, limitCount = 4) {
  const rows = await query(
    `SELECT * FROM products WHERE category = :category AND id != :id AND status = 'available' ORDER BY RAND() LIMIT :limit`,
    { category: product.category, id: product.id, limit: limitCount }
  );
  return attachImages(rows);
}

async function getFeaturedProducts(limitCount = 8) {
  const rows = await query(
    `SELECT * FROM products WHERE status = 'available' ORDER BY featured DESC, created_at DESC LIMIT :limit`,
    { limit: limitCount }
  );
  return attachImages(rows);
}

async function getSoldProducts(limitCount = 4) {
  const rows = await query(
    `SELECT * FROM products WHERE status = 'sold' ORDER BY updated_at DESC LIMIT :limit`,
    { limit: limitCount }
  );
  return attachImages(rows);
}

async function getSetting(key, fallback = null) {
  const row = await queryOne('SELECT value FROM settings WHERE `key` = ?', [key]);
  return row ? row.value : fallback;
}

async function setSetting(key, value) {
  await run('INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [key, value]);
}

async function listJournalPosts() {
  return query('SELECT * FROM journal_posts ORDER BY published_at DESC');
}

async function getJournalPostBySlug(slug) {
  return queryOne('SELECT * FROM journal_posts WHERE slug = ?', [slug]);
}

async function getJournalPostById(id) {
  return queryOne('SELECT * FROM journal_posts WHERE id = ?', [id]);
}

/** Contact/social links shown in the header/footer/contact page — editable via /admin/cai-dat, falling back to .env defaults. */
async function getContactInfo() {
  const [email, phone, zaloUrl, instagramUrl, facebookUrl, instagramHandle] = await Promise.all([
    getSetting('contact_email', process.env.CONTACT_EMAIL || 'hello@teomhrift.vn'),
    getSetting('contact_phone', process.env.CONTACT_PHONE || '0900 000 000'),
    getSetting('contact_zalo_url', process.env.CONTACT_ZALO_URL || ''),
    getSetting('contact_instagram_url', process.env.CONTACT_INSTAGRAM_URL || ''),
    getSetting('contact_facebook_url', process.env.CONTACT_FACEBOOK_URL || ''),
    getSetting('contact_instagram_handle', process.env.CONTACT_INSTAGRAM_HANDLE || '@teo.mhrift'),
  ]);
  return { email, phone, zaloUrl, instagramUrl, facebookUrl, instagramHandle };
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
  getSoldProducts,
  getSetting,
  setSetting,
  listJournalPosts,
  getJournalPostBySlug,
  getJournalPostById,
  getContactInfo,
};
