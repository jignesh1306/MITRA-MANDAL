import { getFundSummary } from '../services/fund.service.js';
import { Transaction } from '../models/Transaction.js';

export const getFundDetails = async (req, res, next) => {
  try {
    const summary = await getFundSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { type, category, memberId } = req.query;
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (memberId) query.memberId = memberId;

    // Non-admins can only see their own transactions or public fund summary
    if (req.user.role !== 'ADMIN') {
      query.memberId = req.user._id;
    }

    const list = await Transaction.find(query)
      .populate('memberId', 'name email')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json(list);
  } catch (error) {
    next(error);
  }
};
