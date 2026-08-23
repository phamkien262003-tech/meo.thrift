function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  res.status(status).render('pages/error', {
    title: 'Đã có lỗi xảy ra',
    message: status === 500 ? 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.' : err.message,
  });
}

module.exports = errorHandler;
