const mysql = require('mysql2/promise');
const { STATEMENTS, IGNORABLE_ERROR_CODES } = require('../db/schema');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      namedPlaceholders: true,
      waitForConnections: true,
      connectionLimit: 4,
      queueLimit: 0,
      dateStrings: true,
    });
  }
  return pool;
}

/** Runs a SELECT and returns all rows. */
async function query(sql, params) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Runs a SELECT and returns the first row, or undefined. */
async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0];
}

/** Runs an INSERT/UPDATE/DELETE; result has .insertId / .affectedRows. */
async function run(sql, params) {
  const [result] = await getPool().query(sql, params);
  return result;
}

/**
 * Runs `fn` inside a transaction on a single dedicated connection, so its queries are
 * atomic. `fn` receives { query, run } bound to that connection (same shape as the
 * module-level helpers above, but scoped to the transaction).
 */
async function runInTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const tx = {
      query: async (sql, params) => (await conn.query(sql, params))[0],
      run: async (sql, params) => (await conn.query(sql, params))[0],
    };
    const result = await fn(tx);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** MySQL has no "ADD COLUMN IF NOT EXISTS" (pre-8.0.29/MariaDB) — add newly-introduced
 * columns by hand so existing databases pick them up without a migration tool. */
async function addColumnIfMissing(table, column, definition) {
  const cols = await query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (cols.length === 0) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function migrateSchema() {
  await addColumnIfMissing('admin_users', 'role', "VARCHAR(20) NOT NULL DEFAULT 'level2'");
  // Lets an admin pick which part of an oversized photo stays visible under object-cover crop.
  await addColumnIfMissing('product_images', 'position', "VARCHAR(20) NOT NULL DEFAULT 'center center'");
  await addColumnIfMissing('journal_posts', 'cover_image_position', "VARCHAR(20) NOT NULL DEFAULT 'center center'");
}

async function ensureDatabase() {
  for (const sql of STATEMENTS) {
    try {
      await run(sql);
    } catch (err) {
      if (!IGNORABLE_ERROR_CODES.has(err.code)) throw err;
    }
  }
  await migrateSchema();
}

/**
 * Creates the first admin account from env vars on boot, when no admin exists yet.
 * Exists so hosts without shell/SSH access (e.g. Hostinger's git-deploy Node app, whose
 * SSH login shell rejects interactive sessions) can still get an admin login — just set
 * ADMIN_EMAIL + ADMIN_BOOTSTRAP_PASSWORD in the panel's environment variables and restart.
 * Never overwrites an existing admin, so it's safe to leave the env vars set afterward.
 */
async function ensureBootstrapAdmin() {
  const { c: adminCount } = await queryOne('SELECT COUNT(*) AS c FROM admin_users');
  if (adminCount > 0) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;

  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync(password, 10);
  await run("INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'level1')", [email, hash]);
  console.log(`[bootstrap] Đã tạo tài khoản quản trị cấp 1 đầu tiên: ${email}`);
}

module.exports = { getPool, query, queryOne, run, runInTransaction, ensureDatabase, ensureBootstrapAdmin };
