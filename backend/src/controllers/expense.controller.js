import { Expense } from '../models/Expense.js';
import { Group } from '../models/Group.js';
import { Transaction } from '../models/Transaction.js';
import { generateRefId } from '../services/refId.service.js';
import { createAuditLog } from '../services/audit.service.js';

export const getExpenses = async (req, res, next) => {
  try {
    const list = await Expense.find()
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { amount, category, description, date, receipt } = req.body;
    const group = await Group.findOne();

    const amountPaise = Math.round(Number(amount));
    const refId = await generateRefId('EXP');

    const transaction = await Transaction.create({
      referenceId: refId,
      groupId: group._id,
      type: 'EXPENSE',
      category: 'GROUP_EXPENSE',
      amount: amountPaise,
      description: `[Expense: ${category}] ${description}`,
      date: date || new Date(),
      createdBy: req.user._id
    });

    const expense = await Expense.create({
      groupId: group._id,
      amount: amountPaise,
      category,
      description,
      date: date || new Date(),
      receipt: receipt || '',
      createdBy: req.user._id,
      transactionId: transaction._id
    });

    await createAuditLog({
      groupId: group._id,
      userId: req.user._id,
      action: 'EXPENSE_ADDED',
      entityType: 'Expense',
      entityId: expense._id.toString(),
      newValue: { amount: amountPaise, category, description }
    });

    res.status(201).json({ expense, transaction });
  } catch (error) {
    next(error);
  }
};
