# teo.mhrift

Website bán váy secondhand cao cấp, chỉ bán online — xây dựng bằng Node.js (Express + EJS + Tailwind CSS + SQLite).

> **Yêu cầu Node.js ≥ 22.5.** Dự án dùng module `node:sqlite` có sẵn trong Node.js (không cần cài driver SQLite ngoài như `better-sqlite3`) — nhờ vậy `npm install` không cần trình biên dịch C++ nào, chạy được trên cả máy Windows lẫn hosting mà không lo lỗi build native. Khi tạo Node.js App trên Hostinger, hãy chọn phiên bản Node **22 trở lên**.

## Chạy dự án ở máy local

```bash
npm install
cp .env.example .env      # rồi chỉnh sửa các giá trị trong .env
npm run build:css
npm run seed               # thêm sản phẩm & bài viết mẫu (chỉ chạy lần đầu)
npm run create-admin       # tạo tài khoản đăng nhập /admin
npm run dev
```

Mở `http://localhost:3000`. Trang quản trị tại `http://localhost:3000/admin/dang-nhap`.

Khi sửa `public/css/input.css` hoặc thay đổi class Tailwind trong views, chạy song song:

```bash
npm run watch:css
```

## Cấu trúc thư mục

```
app.js                 điểm khởi động Express (tương thích Hostinger Node.js App)
src/
  config/              kết nối SQLite
  db/                  schema.sql, seed.js, create-admin.js, models.js
  middleware/          auth (đăng nhập admin), upload (multer), error-handler
  routes/              public, shop, cart-order, auth, admin
  services/            mailer, payments/ (manual = Phase 1, vnpay/momo = stub Phase 2), images, icons, placeholder
  views/                EJS templates
public/
  css/                 input.css (nguồn) → output.css (đã build, không sửa tay)
  js/                  main.js, cart.js, filters.js, gallery.js
  uploads/             ảnh sản phẩm do admin tải lên
data/                  file SQLite (tự tạo khi chạy, không commit lên Git)
```

## Giai đoạn thanh toán

- **Phase 1 (hiện tại)**: khách "đặt trước" → điền thông tin → shop xác nhận thủ công qua chuyển khoản/COD. Xem `src/services/payments/manual.js`.
- **Phase 2 (sau này)**: thêm VNPay/Momo — code đã có sẵn interface tại `src/services/payments/index.js`, chỉ cần hiện thực `vnpay.js` hoặc `momo.js` rồi đổi biến môi trường `PAYMENT_PROVIDER`.

## Triển khai lên Hostinger

Yêu cầu gói hosting **có hỗ trợ Node.js** (Business/Premium Web Hosting hoặc VPS có "Node.js Selector" trong hPanel) — gói Shared/Starter thông thường **không** chạy được server Node thật, chỉ phục vụ file tĩnh.

1. **Đẩy code lên GitHub**
   ```bash
   git init
   git add .
   git commit -m "Khởi tạo website teo.mhrift"
   git remote add origin <URL_REPO_GITHUB_CUA_BAN>
   git push -u origin main
   ```

2. **Tạo Node.js App trong hPanel**
   - Vào hPanel → *Advanced* → *Node.js* → *Create Application*.
   - Chọn Node.js version 20, Application root (thư mục chứa code), Application URL (domain/subdomain), Application startup file: `app.js`.

3. **Khai báo biến môi trường** trong màn hình Node.js App của hPanel (không commit file `.env` thật lên GitHub):
   `NODE_ENV=production`, `SESSION_SECRET`, `SITE_URL`, `ADMIN_EMAIL`, `SMTP_HOST/PORT/USER/PASS`, `SHOP_NOTIFY_EMAIL`, `BANK_*`.

4. **Kéo code & cài đặt**
   - Dùng tính năng Git trong hPanel (hoặc SSH) để pull code từ GitHub vào Application root.
   - Chạy `npm install --production` rồi `npm run build:css` trong terminal hPanel/SSH.
   - Chạy `npm run migrate` (nếu tách riêng) hoặc để `app.js` tự tạo schema khi khởi động.
   - Bấm **Restart** trong hPanel Node.js App.

5. **Gắn domain & SSL** — trỏ domain vào Application, bật SSL miễn phí trong hPanel.

6. Sau khi lên production, chạy `npm run create-admin` một lần (qua SSH) để tạo tài khoản quản trị, rồi đăng nhập `/admin` để tải ảnh sản phẩm thật lên.

> Nếu bạn chưa mua gói hosting, hãy chọn gói Hostinger Business/Premium Web Hosting hoặc VPS có hỗ trợ Node.js trước khi thực hiện bước 2–5.
