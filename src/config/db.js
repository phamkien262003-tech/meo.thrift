const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'teomhrift.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

/** node:sqlite's DatabaseSync has no built-in `.transaction()` helper (unlike better-sqlite3) — wrap manually. */
function runInTransaction(fn) {
  const database = getDb();
  database.exec('BEGIN');
  try {
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const database = getDb();
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  database.exec(schema);
  return database;
}

/**
 * Creates the first admin account from env vars on boot, when no admin exists yet.
 * Exists so hosts without shell/SSH access (e.g. Hostinger's git-deploy Node app, whose
 * SSH login shell rejects interactive sessions) can still get an admin login — just set
 * ADMIN_EMAIL + ADMIN_BOOTSTRAP_PASSWORD in the panel's environment variables and restart.
 * Never overwrites an existing admin, so it's safe to leave the env vars set afterward.
 */
function ensureBootstrapAdmin() {
  const database = getDb();
  const { c: adminCount } = database.prepare('SELECT COUNT(*) AS c FROM admin_users').get();
  if (adminCount > 0) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;

  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync(password, 10);
  database.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').run(email, hash);
  console.log(`[bootstrap] Đã tạo tài khoản quản trị đầu tiên: ${email}`);
}

module.exports = { getDb, ensureDatabase, ensureBootstrapAdmin, runInTransaction, DATA_DIR, DB_PATH };
