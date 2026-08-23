const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] SMTP chưa cấu hình — bỏ qua gửi email tới ${to}: ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: `"${process.env.SITE_NAME || 'teo.mhrift'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[mailer] Gửi email thất bại:', err.message);
  }
}

function formatOrderEmailHtml(order, items) {
  const rows = items
    .map(
      (it) => `<tr><td style="padding:6px 0;">${it.product_name}</td><td style="padding:6px 0;text-align:right;">${it.price.toLocaleString('vi-VN')}đ</td></tr>`
    )
    .join('');
  return `
    <div style="font-family:Georgia,serif;color:#3A2E27;max-width:480px;">
      <h2 style="color:#C67B5C;">Mã đơn: ${order.order_code}</h2>
      <p>Khách hàng: <strong>${order.customer_name}</strong></p>
      <p>Điện thoại: ${order.phone}</p>
      <p>Địa chỉ: ${order.address}</p>
      ${order.note ? `<p>Ghi chú: ${order.note}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">${rows}</table>
      <p style="margin-top:12px;font-weight:bold;">Tổng cộng: ${order.subtotal.toLocaleString('vi-VN')}đ</p>
    </div>
  `;
}

module.exports = { sendMail, formatOrderEmailHtml };
