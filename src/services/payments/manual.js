const { getSetting } = require('../../db/models');

/** Phase 1 payment "provider": no gateway, just structured instructions shown after an order is placed. */
async function getInstructions() {
  const [bankName, accountName, accountNumber] = await Promise.all([
    getSetting('bank_name', process.env.BANK_NAME || ''),
    getSetting('bank_account_name', process.env.BANK_ACCOUNT_NAME || ''),
    getSetting('bank_account_number', process.env.BANK_ACCOUNT_NUMBER || ''),
  ]);
  return {
    method: 'manual',
    label: 'Chuyển khoản ngân hàng / COD',
    bank: { bankName, accountName, accountNumber },
    codeNote: 'Vui lòng ghi mã đơn hàng vào nội dung chuyển khoản để được xác nhận nhanh nhất.',
    codAvailable: true,
  };
}

module.exports = { getInstructions };
