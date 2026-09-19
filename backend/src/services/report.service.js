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

  const transactions = await Transaction.find(query).populate('memberId', 'name email phone').sort({ date: 1 });
  const loans = await Loan.find(groupId ? { groupId } : {});
  
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalRegularEmi = 0;
  let totalLoanEmiPrincipal = 0;
  let totalInterest = 0;
  let totalExtraInterestPenalty = 0;

  for (const t of transactions) {
    if (t.type === 'INCOME') {
      totalIncome += t.amount;
      if (t.category === 'MEMBER_CONTRIBUTION' || t.category === 'CONTRIBUTION') totalRegularEmi += t.amount;
      if (t.category === 'LOAN_REPAYMENT_PRINCIPAL' || t.category === 'LOAN_REPAYMENT') totalLoanEmiPrincipal += t.amount;
      if (t.category === 'LOAN_INTEREST') totalInterest += t.amount;
      if (t.category === 'FINE') totalExtraInterestPenalty += t.amount;
    } else if (t.type === 'EXPENSE') {
      totalExpenses += t.amount;
    }
  }

  const activeLoansList = loans.filter(l => l.status === 'ACTIVE');
  const runningLoansCount = activeLoansList.length;
  const runningLoanAmount = activeLoansList.reduce((acc, l) => acc + l.principal, 0);

  const currentBalance = totalIncome - totalExpenses;
  const totalBankBalance = currentBalance; // Total current amount in bank

  return {
    totalCurrentBalance: currentBalance,
    runningLoansCount,
    runningLoanAmount,
    totalRegularEmi,
    totalLoanEmi: totalLoanEmiPrincipal,
    totalInterest,
    totalExtraInterestPenalty,
    totalBankBalance,
    transactions
  };
};

export const getContributionReport = async (groupId, year) => {
  const members = await GroupMember.find(groupId ? { groupId } : {}).populate('userId', 'name email phone');
  const contributions = await Contribution.find({ ...(groupId && { groupId }), ...(year && { year }) });
  
  const fineQuery = { category: 'FINE' };
  if (groupId) fineQuery.groupId = groupId;
  if (year) {
    fineQuery.date = {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31, 23, 59, 59)
    };
  }
  const fines = await Transaction.find(fineQuery);

  const memberMap = {};
  for (const m of members) {
    if (!m.userId) continue;
    memberMap[m.userId._id.toString()] = {
      memberId: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      phone: m.userId.phone,
      months: Array(12).fill('PENDING'),
      totalPaid: 0,
      totalPenaltyPaid: 0
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

  for (const f of fines) {
    const mId = f.memberId?.toString();
    if (mId && memberMap[mId]) {
      memberMap[mId].totalPenaltyPaid += f.amount;
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
