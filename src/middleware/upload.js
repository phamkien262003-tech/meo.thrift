const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter(req, file, cb) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
