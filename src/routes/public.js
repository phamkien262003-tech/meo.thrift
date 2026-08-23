const express = require('express');
const router = express.Router();
const { getFeaturedProducts, listJournalPosts, getJournalPostBySlug } = require('../db/models');

router.get('/', async (req, res, next) => {
  try {
    const featured = await getFeaturedProducts(8);
    res.render('pages/home', { title: 'Trang chủ', featured });
  } catch (err) {
    next(err);
  }
});

router.get('/ve-chung-toi', (req, res) => {
  res.render('pages/about', { title: 'Về chúng tôi' });
});

router.get('/huong-dan-chon-size', (req, res) => {
  res.render('pages/size-guide', { title: 'Hướng dẫn chọn size' });
});

router.get('/chinh-sach', (req, res) => {
  res.render('pages/policy', { title: 'Chính sách đổi trả & vận chuyển' });
});

router.get('/cau-hoi-thuong-gap', (req, res) => {
  res.render('pages/faq', { title: 'Câu hỏi thường gặp' });
});

router.get('/lien-he', (req, res) => {
  res.render('pages/contact', { title: 'Liên hệ' });
});

router.post('/lien-he', (req, res) => {
  req.session.flash = {
    type: 'success',
    message: 'Cảm ơn bạn đã liên hệ! teo.mhrift sẽ phản hồi trong vòng 24 giờ.',
  };
  res.redirect('/lien-he');
});

router.get('/nhat-ky', async (req, res, next) => {
  try {
    const posts = await listJournalPosts();
    res.render('pages/journal', { title: 'Nhật ký phong cách', posts });
  } catch (err) {
    next(err);
  }
});

router.get('/nhat-ky/:slug', async (req, res, next) => {
  try {
    const post = await getJournalPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).render('pages/404', { title: 'Không tìm thấy bài viết' });
    }
    res.render('pages/journal-post', { title: post.title, post });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
