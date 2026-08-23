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

module.exports = { requireAdmin, redirectIfAuthed };
