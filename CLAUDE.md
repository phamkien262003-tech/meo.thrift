# teo.mhrift — hướng dẫn cho Claude

## ⚠️ CẢNH BÁO: push code có thể xoá dữ liệu live trên Hostinger

Phát hiện ngày 2026-08-24: `data/*.db` (database) và `public/uploads/*` (ảnh tải lên)
bị `.gitignore` loại khỏi Git — nghĩa là sản phẩm/ảnh/nội dung mà admin đăng **trực
tiếp trên web live (Hostinger)** không hề tồn tại trong Git. Nếu cơ chế auto-deploy
của Hostinger thay nguyên thư mục ứng dụng bằng đúng nội dung repo (nhiều gói
Git-deploy trên hosting làm vậy) thì **mỗi lần `git push` — kể cả chỉ sửa 1 dòng
chữ không liên quan — có thể xoá sạch database và ảnh đang sống trên server**.

Chủ dự án xác nhận (2026-08-24): hiện đang có sản phẩm/ảnh thật đăng trực tiếp trên
bản live, nên rủi ro này là thật, không phải giả thuyết suông.

**Cho đến khi xác minh rõ cơ chế deploy của Hostinger và có cách bảo vệ
`data/`/`public/uploads/` khỏi bị ghi đè, TẠM DỪNG quy tắc auto-push bên dưới đối
với các thay đổi sẽ kích hoạt deploy lại** (tức là mọi push lên `main`). Vẫn có thể
`git commit` cục bộ bình thường, nhưng phải hỏi xác nhận trước khi `push` cho đến khi
vấn đề này được giải quyết dứt điểm.

## Quy trình git

Theo yêu cầu của chủ dự án (2026-08-24): sau mỗi lần chỉnh sửa code trong repo này,
**tự động `git add` + `git commit` + `git push origin main`** — không cần hỏi lại
mỗi lần. Viết commit message ngắn gọn, đúng nội dung thay đổi.

**Ngoại lệ hiện tại: xem cảnh báo phía trên — TẠM DỪNG phần `push` cho đến khi rủi ro
mất dữ liệu live được giải quyết.**

Vẫn áp dụng các quy tắc an toàn git thông thường: không `--force`, không `--no-verify`,
không amend commit đã có, kiểm tra `git status`/diff trước khi add để tránh dính file
nhạy cảm (`.env`, v.v.) hoặc thư mục không liên quan (ví dụ `landing-page/` — một trang
demo SaaS "Flowly" chưa dùng đến, không thuộc website teo.mhrift, không commit trừ khi
được yêu cầu riêng).

Sau khi sửa CSS (Tailwind), luôn chạy `npm run build:css` và commit luôn
`public/css/output.css` — Hostinger tự deploy từ file CSS đã build sẵn, không chạy
bước build riêng.
