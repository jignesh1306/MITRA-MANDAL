import { Revenue } from '../models/Revenue.js';
import { Group } from '../models/Group.js';
import { Transaction } from '../models/Transaction.js';
import { generateRefId } from '../services/refId.service.js';
import { createAuditLog } from '../services/audit.service.js';

export const getRevenues = async (req, res, next) => {
  try {
    const list = await Revenue.find()
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createRevenue = async (req, res, next) => {
  try {
    const { amount, source, description, date } = req.body;
    const group = await Group.findOne();

    const amountPaise = Math.round(Number(amount));
    const refId = await generateRefId('INC');

    const transaction = await Transaction.create({
      referenceId: refId,
      groupId: group._id,
      type: 'INCOME',
      category: 'OTHER_REVENUE',
      amount: amountPaise,
      description: `[Revenue: ${source}] ${description}`,
      date: date || new Date(),
      createdBy: req.user._id
    });

    const revenue = await Revenue.create({
      groupId: group._id,
      amount: amountPaise,
      source,
      description,
      date: date || new Date(),
      createdBy: req.user._id,
      transactionId: transaction._id
    });

    await createAuditLog({
      groupId: group._id,
      userId: req.user._id,
      action: 'REVENUE_ADDED',
      entityType: 'Revenue',
      entityId: revenue._id.toString(),
      newValue: { amount: amountPaise, source, description }
    });

    res.status(201).json({ revenue, transaction });
  } catch (error) {
    next(error);
  }
};
