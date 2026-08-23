# teo.mhrift — hướng dẫn cho Claude

## Kiến trúc dữ liệu: MySQL, không phải file cục bộ

Phát hiện + khắc phục ngày 2026-08-24: Hostinger dựng lại toàn bộ thư mục ứng dụng từ
Git mỗi lần deploy (xác nhận qua thử nghiệm thực tế: một push chỉ sửa 1 dòng HTML comment
đã xoá sạch sản phẩm đang có trên web live). Vì vậy:

- **Toàn bộ dữ liệu (sản phẩm, đơn hàng, cài đặt, nội dung trang) sống trong MySQL**
  (`src/config/db.js`), không còn dùng SQLite file cục bộ nữa.
- **Ảnh tải lên (sản phẩm, bìa nhật ký, ảnh nội dung trang) lưu dưới dạng BLOB trong
  bảng `images`** (`src/services/images.js`), phục vụ qua route `GET /img/:id`
  (`app.js`) — không còn lưu file trong `public/uploads/`.
- **Session đăng nhập admin cũng lưu trong MySQL** (`express-mysql-session`), không
  còn dùng `session-file-store` cục bộ.

Kết quả: `git push`/deploy lại giờ an toàn — không còn gì sống trong thư mục ứng dụng
mà deploy có thể xoá mất.

**Bắt buộc phải có 5 biến môi trường MySQL** (`DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME`) cả ở `.env` cục bộ lẫn trong Environment Variables của
Hostinger — thiếu là app crash ngay khi khởi động. Xem `.env.example`.

Nếu sau này cần thêm cột/bảng mới: sửa `src/db/schema.js` (mảng câu lệnh
`CREATE TABLE IF NOT EXISTS` — chạy lại an toàn, không xoá dữ liệu cũ).

## Quy trình git

Theo yêu cầu của chủ dự án (2026-08-24): sau mỗi lần chỉnh sửa code trong repo này,
**tự động `git add` + `git commit` + `git push origin main`** — không cần hỏi lại
mỗi lần. Viết commit message ngắn gọn, đúng nội dung thay đổi.

Vẫn áp dụng các quy tắc an toàn git thông thường: không `--force`, không `--no-verify`,
không amend commit đã có, kiểm tra `git status`/diff trước khi add để tránh dính file
nhạy cảm (`.env`, v.v.) hoặc thư mục không liên quan (ví dụ `landing-page/` — một trang
demo SaaS "Flowly" chưa dùng đến, không thuộc website teo.mhrift, không commit trừ khi
được yêu cầu riêng).

Sau khi sửa CSS (Tailwind), luôn chạy `npm run build:css` và commit luôn
`public/css/output.css` — Hostinger tự deploy từ file CSS đã build sẵn, không chạy
bước build riêng.
