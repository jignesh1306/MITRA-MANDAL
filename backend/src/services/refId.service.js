import { Transaction } from '../models/Transaction.js';

export const generateRefId = async (prefix) => {
  // Find the transaction with the highest referenceId for this prefix
  const lastTx = await Transaction.findOne({ 
    referenceId: new RegExp(`^${prefix}-\\d+$`) 
  }).sort({ referenceId: -1 });

  let nextNum = 1;
  if (lastTx) {
    const parts = lastTx.referenceId.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}-${nextNum.toString().padStart(6, '0')}`;
};
