/** MySQL schema (replaces the old SQLite schema.sql). Images are stored as rows here —
 * not as files on disk — so they survive a Hostinger redeploy, which wipes anything not
 * committed to Git (confirmed 2026-08-24: a code-only push emptied the live product list). */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mime_type VARCHAR(100) NOT NULL,
    data LONGBLOB NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(255) NULL,
    size_label VARCHAR(20) NOT NULL,
    measurements VARCHAR(255) NULL,
    condition_grade VARCHAR(50) NOT NULL DEFAULT 'Rất tốt',
    condition_notes TEXT NULL,
    fabric VARCHAR(255) NULL,
    era_tag VARCHAR(100) NULL,
    price INT NOT NULL,
    original_price INT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    featured TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_id INT NULL,
    placeholder_tone VARCHAR(20) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_images_image FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NULL,
    address VARCHAR(500) NOT NULL,
    note TEXT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'manual',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    subtotal INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS journal_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NULL,
    content LONGTEXT NULL,
    cover_color VARCHAR(20) DEFAULT 'terracotta',
    cover_image_id INT NULL,
    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_journal_cover_image FOREIGN KEY (cover_image_id) REFERENCES images(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS settings (
    \`key\` VARCHAR(191) PRIMARY KEY,
    value LONGTEXT
  ) ENGINE=InnoDB`,

  `CREATE INDEX idx_products_status ON products(status)`,
  `CREATE INDEX idx_products_category ON products(category)`,
  `CREATE INDEX idx_orders_status ON orders(status)`,
];

// MySQL has no "CREATE INDEX IF NOT EXISTS" — ignore the harmless "duplicate key name" error on re-run.
const IGNORABLE_ERROR_CODES = new Set(['ER_DUP_KEYNAME']);

module.exports = { STATEMENTS, IGNORABLE_ERROR_CODES };
