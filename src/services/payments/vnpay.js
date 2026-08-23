/**
 * Phase 2 stub — not implemented yet.
 * When ready to accept live online payments, implement VNPay's redirect + IPN flow here
 * (build the signed payment URL in `createPaymentUrl`, verify the checksum in `verifyReturn`),
 * then switch PAYMENT_PROVIDER to "vnpay" in src/services/payments/index.js. No other route
 * code should need to change — cart-order.js already calls through that index.
 */

function createPaymentUrl(/* order */) {
  throw new Error('Tích hợp VNPay chưa được triển khai (Phase 2).');
}

function verifyReturn(/* query */) {
  throw new Error('Tích hợp VNPay chưa được triển khai (Phase 2).');
}

module.exports = { createPaymentUrl, verifyReturn };
