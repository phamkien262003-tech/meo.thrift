require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { ensureDatabase } = require('../config/db');

const db = ensureDatabase();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const email = (await ask(`Email quản trị [${process.env.ADMIN_EMAIL || 'admin@teomhrift.vn'}]: `)) ||
    process.env.ADMIN_EMAIL ||
    'admin@teomhrift.vn';
  const password = await ask('Mật khẩu quản trị: ');
  rl.close();

  if (!password || password.length < 6) {
    console.error('Mật khẩu cần tối thiểu 6 ký tự.');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO admin_users (email, password_hash) VALUES (?, ?)
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`
  ).run(email, hash);

  console.log(`Đã tạo/cập nhật tài khoản quản trị: ${email}`);
}

main();
