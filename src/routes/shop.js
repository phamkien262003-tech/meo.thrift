const express = require('express');
const router = express.Router();
const {
  listProducts,
  countProducts,
  getProductBySlug,
  getRelatedProducts,
  CATEGORIES,
  ERA_TAGS,
  SIZE_LABELS,
} = require('../db/models');

const PAGE_SIZE = 9;

router.get('/cua-hang', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.trang, 10) || 1);
    const filters = {
      category: req.query.loai || undefined,
      size: req.query.size || undefined,
      era: req.query.phong_cach || undefined,
      minPrice: req.query.gia_tu ? Number(req.query.gia_tu) : undefined,
      maxPrice: req.query.gia_den ? Number(req.query.gia_den) : undefined,
      q: req.query.q || undefined,
      sort: req.query.sap_xep || 'newest',
    };

    const total = await countProducts(filters);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);

    const products = await listProducts({
      ...filters,
      limit: PAGE_SIZE,
      offset: (safePage - 1) * PAGE_SIZE,
    });

    res.render('pages/shop', {
      title: 'Cửa hàng',
      products,
      total,
      page: safePage,
      totalPages,
      filters: req.query,
      categories: CATEGORIES,
      eraTags: ERA_TAGS,
      sizeLabels: SIZE_LABELS,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/san-pham/:slug', async (req, res, next) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).render('pages/404', { title: 'Không tìm thấy sản phẩm' });
    }
    const related = await getRelatedProducts(product, 4);
    res.render('pages/product', { title: product.name, product, related });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
