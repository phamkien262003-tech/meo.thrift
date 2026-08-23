function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.session.flash = { type: 'error', message: 'Vui lòng đăng nhập để tiếp tục.' };
  return res.redirect('/admin/dang-nhap');
}

function redirectIfAuthed(req, res, next) {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  return next();
}

/** Quản trị viên cấp 1 only — managing other admin accounts (add/remove/change role). */
function requireLevel1(req, res, next) {
  if (req.session && req.session.adminRole === 'level1') {
    return next();
  }
  req.session.flash = { type: 'error', message: 'Chỉ quản trị viên cấp 1 mới có quyền truy cập trang này.' };
  return res.redirect('/admin');
}

module.exports = { requireAdmin, redirectIfAuthed, requireLevel1 };
