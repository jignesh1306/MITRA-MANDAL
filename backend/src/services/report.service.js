import { Transaction } from '../models/Transaction.js';
import { Contribution } from '../models/Contribution.js';
import { Loan } from '../models/Loan.js';
import { Expense } from '../models/Expense.js';
import { GroupMember } from '../models/GroupMember.js';

export const getFundReport = async (groupId, startDate, endDate) => {
  const query = {};
  if (groupId) query.groupId = groupId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const transactions = await Transaction.find(query).sort({ date: 1 });

  let income = 0;
  let expenses = 0;
  const items = transactions.map(t => {
    if (t.type === 'INCOME') income += t.amount;
    if (t.type === 'EXPENSE') expenses += t.amount;
    return {
      id: t._id,
      referenceId: t.referenceId,
      date: t.date,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description
    };
  });

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netBalance: income - expenses,
    transactions: items
  };
};

export const getContributionReport = async (groupId, year) => {
  const members = await GroupMember.find(groupId ? { groupId } : {}).populate('userId', 'name email phone');
  const contributions = await Contribution.find({ ...(groupId && { groupId }), ...(year && { year }) });

  const memberMap = {};
  for (const m of members) {
    if (!m.userId) continue;
    memberMap[m.userId._id.toString()] = {
      memberId: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      phone: m.userId.phone,
      months: Array(12).fill('PENDING'),
      totalPaid: 0
    };
  }

  for (const c of contributions) {
    const mId = c.memberId.toString();
    if (memberMap[mId]) {
      memberMap[mId].months[c.month - 1] = c.status;
      if (c.status === 'PAID') {
        memberMap[mId].totalPaid += c.amount;
      }
    }
  }

  return Object.values(memberMap);
};

export const getLoanReport = async (groupId) => {
  const loans = await Loan.find(groupId ? { groupId } : {}).populate('memberId', 'name email');

  let totalLoans = loans.length;
  let activeLoans = 0;
  let completedLoans = 0;
  let totalDisbursed = 0;
  let totalInterest = 0;

  for (const l of loans) {
    if (l.status === 'ACTIVE') activeLoans++;
    if (l.status === 'COMPLETED') completedLoans++;
    totalDisbursed += l.principal;
    totalInterest += l.totalInterest;
  }

  return {
    totalLoans,
    activeLoans,
    completedLoans,
    totalDisbursed,
    totalInterest,
    loans
  };
};

export const getExpenseReport = async (groupId) => {
  const expenses = await Expense.find(groupId ? { groupId } : {}).populate('createdBy', 'name');

  const categoryTotals = {};
  let grandTotal = 0;

  for (const e of expenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    grandTotal += e.amount;
  }

  return {
    grandTotal,
    byCategory: categoryTotals,
    expenses
  };
};
