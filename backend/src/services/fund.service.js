import { Transaction } from '../models/Transaction.js';

export const getFundSummary = async (groupId) => {
  const transactions = await Transaction.find(groupId ? { groupId } : {});

  let totalIncome = 0;
  let totalExpense = 0;
  let totalContributions = 0;
  let totalLoanInterest = 0;
  let totalOtherRevenue = 0;
  let totalLoanRepaymentsPrincipal = 0;
  let totalLoansGiven = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.type === 'INCOME') {
      totalIncome += t.amount;
      if (t.category === 'MEMBER_CONTRIBUTION') totalContributions += t.amount;
      if (t.category === 'LOAN_INTEREST') totalLoanInterest += t.amount;
      if (t.category === 'OTHER_REVENUE') totalOtherRevenue += t.amount;
      if (t.category === 'LOAN_REPAYMENT_PRINCIPAL') totalLoanRepaymentsPrincipal += t.amount;
    } else if (t.type === 'EXPENSE') {
      totalExpense += t.amount;
      if (t.category === 'LOAN_DISBURSEMENT') totalLoansGiven += t.amount;
      if (t.category === 'GROUP_EXPENSE') totalExpenses += t.amount;
    }
  }

  const currentBalance = totalIncome - totalExpense;

  return {
    currentBalance,
    totalIncome,
    totalExpense,
    totalContributions,
    totalLoanInterest,
    totalOtherRevenue,
    totalLoanRepaymentsPrincipal,
    totalLoansGiven,
    totalExpenses
  };
};
