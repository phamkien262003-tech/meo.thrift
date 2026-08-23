const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { queryOne } = require('../config/db');
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

module.exports = router;
