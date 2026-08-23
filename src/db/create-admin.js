require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { ensureDatabase, run } = require('../config/db');

async function createAdmin(email, password) {
  if (!password || password.length < 6) {
    console.error('Mật khẩu cần tối thiểu 6 ký tự.');
    process.exit(1);
  }
  const hash = bcrypt.hashSync(password, 10);
  // Chạy được từ terminal server nên coi là đáng tin cậy như chủ sở hữu — tạo mới thì là cấp 1;
  // nếu tài khoản đã tồn tại chỉ cập nhật mật khẩu, không đụng đến cấp bậc hiện có.
  await run(
    `INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'level1')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [email, hash]
  );
  console.log(`Đã tạo/cập nhật tài khoản quản trị: ${email}`);
}

// Dùng trực tiếp: node src/db/create-admin.js <email> <mat_khau>
// (tiện cho terminal Hostinger không hỗ trợ nhập tương tác)
const [, , argEmail, argPassword] = process.argv;

(async () => {
  await ensureDatabase();

  if (argEmail && argPassword) {
    await createAdmin(argEmail, argPassword);
    process.exit(0);
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

    const email =
      (await ask(`Email quản trị [${process.env.ADMIN_EMAIL || 'admin@teomhrift.vn'}]: `)) ||
      process.env.ADMIN_EMAIL ||
      'admin@teomhrift.vn';
    const password = await ask('Mật khẩu quản trị: ');
    rl.close();
    await createAdmin(email, password);
    process.exit(0);
  }
})();
