const manual = require('./manual');

/** Provider switch point for Phase 2 — set PAYMENT_PROVIDER=vnpay|momo once one is implemented. */
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'manual';

function getActiveProvider() {
  if (PAYMENT_PROVIDER === 'manual') return manual;
  throw new Error(`Cổng thanh toán "${PAYMENT_PROVIDER}" chưa sẵn sàng.`);
}

module.exports = { getActiveProvider, PAYMENT_PROVIDER };
