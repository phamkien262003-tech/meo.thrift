const express = require('express');
const router = express.Router();
const { getFeaturedProducts, listJournalPosts, getJournalPostBySlug } = require('../db/models');

router.get('/', (req, res) => {
  const featured = getFeaturedProducts(8);
  res.render('pages/home', { title: 'Trang chủ', featured });
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

router.get('/nhat-ky', (req, res) => {
  const posts = listJournalPosts();
  res.render('pages/journal', { title: 'Nhật ký phong cách', posts });
});

router.get('/nhat-ky/:slug', (req, res) => {
  const post = getJournalPostBySlug(req.params.slug);
  if (!post) {
    return res.status(404).render('pages/404', { title: 'Không tìm thấy bài viết' });
  }
  res.render('pages/journal-post', { title: post.title, post });
});

module.exports = router;
