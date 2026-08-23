/**
 * Phase 2 stub — not implemented yet.
 * Implement MoMo's "Payment with redirect" API here (createPaymentUrl builds the signed
 * request to MoMo's create endpoint, verifyReturn checks the returned signature), then switch
 * PAYMENT_PROVIDER to "momo" in src/services/payments/index.js.
 */

function createPaymentUrl(/* order */) {
  throw new Error('Tích hợp MoMo chưa được triển khai (Phase 2).');
}

function verifyReturn(/* query */) {
  throw new Error('Tích hợp MoMo chưa được triển khai (Phase 2).');
}

module.exports = { createPaymentUrl, verifyReturn };
