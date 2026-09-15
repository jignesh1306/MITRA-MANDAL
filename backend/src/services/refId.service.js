import { Transaction } from '../models/Transaction.js';

export const generateRefId = async (prefix) => {
  const count = await Transaction.countDocuments({ referenceId: new RegExp(`^${prefix}-`) });
  const nextNum = (count + 1).toString().padStart(6, '0');
  return `${prefix}-${nextNum}`;
};
