require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const { ensureDatabase, ensureBootstrapAdmin } = require('./src/config/db');
const errorHandler = require('./src/middleware/error-handler');
const { icon } = require('./src/services/icons');
const { resolveImage } = require('./src/services/images');
const { placeholderArt } = require('./src/services/placeholder');
const { getContactInfo } = require('./src/db/models');
const { getAllPageContent } = require('./src/services/page-content');

ensureDatabase();
ensureBootstrapAdmin();

const publicRoutes = require('./src/routes/public');
const shopRoutes = require('./src/routes/shop');
const cartOrderRoutes = require('./src/routes/cart-order');
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new FileStore({ path: path.join(__dirname, 'data', 'sessions'), logFn: () => {} }),
    secret: process.env.SESSION_SECRET || 'thay-doi-chuoi-bi-mat-nay',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

app.use((req, res, next) => {
  res.locals.siteName = process.env.SITE_NAME || 'teo.mhrift';
  res.locals.currentPath = req.path;
  res.locals.isAdmin = Boolean(req.session.adminId);
  res.locals.flash = req.session.flash;
  res.locals.icon = icon;
  res.locals.resolveImage = resolveImage;
  res.locals.placeholderArt = placeholderArt;
  res.locals.formatPrice = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;
  res.locals.contact = getContactInfo();
  res.locals.content = getAllPageContent();
  delete req.session.flash;
  next();
});

app.use('/', publicRoutes);
app.use('/', shopRoutes);
app.use('/', cartOrderRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Không tìm thấy trang' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`teo.mhrift đang chạy tại http://localhost:${PORT}`);
});

module.exports = app;
