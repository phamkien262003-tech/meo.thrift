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
      connectionLimit: 10,
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

async function ensureDatabase() {
  for (const sql of STATEMENTS) {
    try {
      await run(sql);
    } catch (err) {
      if (!IGNORABLE_ERROR_CODES.has(err.code)) throw err;
    }
  }
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
  await run('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)', [email, hash]);
  console.log(`[bootstrap] Đã tạo tài khoản quản trị đầu tiên: ${email}`);
}

module.exports = { getPool, query, queryOne, run, runInTransaction, ensureDatabase, ensureBootstrapAdmin };
