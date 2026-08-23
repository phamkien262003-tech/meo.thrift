const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { queryOne, run } = require('../config/db');
const { redirectIfAuthed } = require('../middleware/auth');

router.get('/admin/dang-nhap', redirectIfAuthed, (req, res) => {
  res.render('admin/login', { title: 'Đăng nhập quản trị', layout: false });
});

router.post('/admin/dang-nhap', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await queryOne('SELECT * FROM admin_users WHERE email = ?', [email]);

    if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
      req.session.flash = { type: 'error', message: 'Email hoặc mật khẩu không đúng.' };
      return res.redirect('/admin/dang-nhap');
    }

    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;
    req.session.adminRole = admin.role;
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/dang-xuat', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/dang-nhap'));
});

// Public self-service request for admin access — sits in a pending queue until a cấp 1
// admin approves it from /admin/quan-tri-vien (grants cấp 2 on approval).
router.post('/admin/yeu-cau-quyen', redirectIfAuthed, async (req, res, next) => {
  try {
    const { email, password, password_confirm } = req.body;

    if (!email || !password || password.length < 6) {
      req.session.flash = { type: 'error', message: 'Cần email hợp lệ và mật khẩu tối thiểu 6 ký tự.' };
      return res.redirect('/admin/dang-nhap');
    }
    if (password !== password_confirm) {
      req.session.flash = { type: 'error', message: 'Mật khẩu nhập lại không khớp.' };
      return res.redirect('/admin/dang-nhap');
    }

    const existingAdmin = await queryOne('SELECT id FROM admin_users WHERE email = ?', [email]);
    if (existingAdmin) {
      req.session.flash = { type: 'error', message: 'Email này đã là quản trị viên.' };
      return res.redirect('/admin/dang-nhap');
    }
    const existingRequest = await queryOne('SELECT id FROM admin_requests WHERE email = ?', [email]);
    if (existingRequest) {
      req.session.flash = { type: 'error', message: 'Email này đã có yêu cầu đang chờ duyệt.' };
      return res.redirect('/admin/dang-nhap');
    }

    const hash = bcrypt.hashSync(password, 10);
    await run('INSERT INTO admin_requests (email, password_hash) VALUES (?, ?)', [email, hash]);
    req.session.flash = {
      type: 'success',
      message: 'Đã gửi yêu cầu. Quản trị viên cấp 1 sẽ xem xét và phê duyệt.',
    };
    res.redirect('/admin/dang-nhap');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
