# teo.mhrift — hướng dẫn cho Claude

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
