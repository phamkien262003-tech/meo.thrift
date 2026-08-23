require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const { ensureDatabase, ensureBootstrapAdmin, getPool } = require('./src/config/db');
const errorHandler = require('./src/middleware/error-handler');
const { icon } = require('./src/services/icons');
const { resolveImage, getImageRow } = require('./src/services/images');
const { placeholderArt } = require('./src/services/placeholder');
const { getContactInfo } = require('./src/db/models');
const { getAllPageContent, editableText } = require('./src/services/page-content');

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

// Images are served from the database (see src/services/images.js) so they survive a
// redeploy — Hostinger's git auto-deploy wipes anything only living on local disk.
app.get('/img/:id', async (req, res, next) => {
  try {
    const row = await getImageRow(Number(req.params.id));
    if (!row) return res.status(404).end();
    res.set('Content-Type', row.mime_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(row.data);
  } catch (err) {
    next(err);
  }
});

// Sessions also live in MySQL — a local file store gets wiped on redeploy just like
// everything else outside Git, which was silently logging admins out after every push.
// Reuses the app's own pool (rather than opening a second one) since shared-hosting
// MySQL plans often cap total connections quite low.
const sessionStore = new MySQLStore({}, getPool());

app.use(
  session({
    store: sessionStore,
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
  res.locals.edit = (page, key, value, opts) => editableText(res.locals.isAdmin, page, key, value, opts);
  delete req.session.flash;

  Promise.all([getContactInfo(), getAllPageContent()])
    .then(([contact, content]) => {
      res.locals.contact = contact;
      res.locals.content = content;
      next();
    })
    .catch(next);
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

async function start() {
  await ensureDatabase();
  await ensureBootstrapAdmin();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`teo.mhrift đang chạy tại http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Không khởi động được ứng dụng:', err);
  process.exit(1);
});

module.exports = app;
