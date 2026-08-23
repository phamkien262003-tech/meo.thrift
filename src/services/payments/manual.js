const { getSetting } = require('../../db/models');

/** Phase 1 payment "provider": no gateway, just structured instructions shown after an order is placed. */
function getInstructions() {
  return {
    method: 'manual',
    label: 'Chuyển khoản ngân hàng / COD',
    bank: {
      bankName: getSetting('bank_name', process.env.BANK_NAME || ''),
      accountName: getSetting('bank_account_name', process.env.BANK_ACCOUNT_NAME || ''),
      accountNumber: getSetting('bank_account_number', process.env.BANK_ACCOUNT_NUMBER || ''),
    },
    codeNote: 'Vui lòng ghi mã đơn hàng vào nội dung chuyển khoản để được xác nhận nhanh nhất.',
    codAvailable: true,
  };
}

module.exports = { getInstructions };
