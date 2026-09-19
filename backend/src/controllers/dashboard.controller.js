import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';
import { Contribution } from '../models/Contribution.js';
import { Loan } from '../models/Loan.js';
import { LoanRequest } from '../models/LoanRequest.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { Transaction } from '../models/Transaction.js';
import { EMISubmission } from '../models/EMISubmission.js';
import { getFundSummary } from '../services/fund.service.js';

export const getAdminSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Run independent top-level queries concurrently
    const [
      group,
      totalMembers,
      activeMembers,
      pendingMembersCount,
      currentContribs,
      activeLoans,
      overdueEMIsCount,
      pendingEMISubmissionsCount,
      pendingLoanRequestsCount
    ] = await Promise.all([
      Group.findOne().lean(),
      User.countDocuments({ role: 'MEMBER' }),
      User.countDocuments({ role: 'MEMBER', status: 'ACTIVE' }),
      User.countDocuments({ role: 'MEMBER', status: 'PENDING' }),
      Contribution.find({ month: currentMonth, year: currentYear }).select('amount status').lean(),
      Loan.find({ status: 'ACTIVE' }).select('_id principal').lean(),
      LoanInstallment.countDocuments({ status: 'OVERDUE' }),
      EMISubmission.countDocuments({ status: 'PENDING' }),
      LoanRequest.countDocuments({ status: 'PENDING' })
    ]);

    // 2. Run second stage queries in parallel: fund summary, paid installments batch, 6-month transactions batch
    const activeLoanIds = activeLoans.map(l => l._id);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [fundSummary, paidInsts, recentTransactions] = await Promise.all([
      getFundSummary(group?._id),
      activeLoanIds.length > 0 
        ? LoanInstallment.find({ loanId: { $in: activeLoanIds }, status: 'PAID' }).select('loanId principal').lean()
        : Promise.resolve([]),
      Transaction.find({ date: { $gte: sixMonthsAgo } }).select('type amount date').lean()
    ]);

    // Group paid installments by loanId in memory (O(N) instead of N database queries)
    const paidByLoanId = new Map();
    for (const inst of paidInsts) {
      const key = inst.loanId.toString();
      paidByLoanId.set(key, (paidByLoanId.get(key) || 0) + (inst.principal || 0));
    }

    let totalOutstandingPrincipal = 0;
    for (const l of activeLoans) {
      const paidP = paidByLoanId.get(l._id.toString()) || 0;
      totalOutstandingPrincipal += Math.max(0, l.principal - paidP);
    }

    // Tally current month contributions
    let paidThisMonth = 0;
    let pendingThisMonth = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const c of currentContribs) {
      if (c.status === 'PAID') {
        paidThisMonth += c.amount;
        paidCount++;
      } else {
        pendingThisMonth += c.amount;
        pendingCount++;
      }
    }

    // Monthly charts bucketed in memory from the single query
    const monthlyCharts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthLabel = d.toLocaleString('en-US', { month: 'short' }) + ' ' + y;

      const mStart = new Date(y, m - 1, 1).getTime();
      const mEnd = new Date(y, m, 0, 23, 59, 59).getTime();

      let income = 0;
      let expense = 0;
      for (const t of recentTransactions) {
        const tTime = new Date(t.date).getTime();
        if (tTime >= mStart && tTime <= mEnd) {
          if (t.type === 'INCOME') income += t.amount / 100;
          if (t.type === 'EXPENSE') expense += t.amount / 100;
        }
      }

      monthlyCharts.push({
        month: monthLabel,
        income,
        expense
      });
    }

    res.json({
      group,
      passwordResetCode: group?.passwordResetCode,
      fundSummary,
      members: {
        total: totalMembers,
        active: activeMembers,
        pending: pendingMembersCount
      },
      contributions: {
        month: currentMonth,
        year: currentYear,
        expectedAmount: (activeMembers * (group?.monthlyContribution || 200000)),
        paidAmount: paidThisMonth,
        pendingAmount: pendingThisMonth,
        paidCount,
        pendingCount
      },
      loans: {
        activeCount: activeLoans.length,
        totalOutstandingPrincipal,
        overdueEMIsCount,
        pendingRequestsCount: pendingLoanRequestsCount
      },
      pendingEMISubmissionsCount,
      charts: {
        monthlyComparison: monthlyCharts
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Run first stage queries concurrently
    const [group, currentContrib, allPaidContribs, activeLoan, memberFines] = await Promise.all([
      Group.findOne().lean(),
      Contribution.findOne({
        memberId: userId,
        month: currentMonth,
        year: currentYear
      }).lean(),
      Contribution.find({ memberId: userId, status: 'PAID' }).select('amount').lean(),
      Loan.findOne({ memberId: userId, status: 'ACTIVE' }).lean(),
      Transaction.find({ memberId: userId, category: 'FINE' }).select('amount').lean()
    ]);

    // Run second stage queries concurrently
    const [groupFundSummary, installments] = await Promise.all([
      getFundSummary(group?._id),
      activeLoan 
        ? LoanInstallment.find({ loanId: activeLoan._id }).sort({ installmentNumber: 1 }).lean()
        : Promise.resolve([])
    ]);

    const totalContributed = allPaidContribs.reduce((acc, c) => acc + (c.amount || 0), 0);
    const totalExtraInterestPenalty = memberFines.reduce((acc, f) => acc + (f.amount || 0), 0);

    let loanSummary = null;
    let nextEMI = null;

    if (activeLoan) {
      let paidPrincipal = 0;
      let paidInterest = 0;

      for (const inst of installments) {
        if (inst.status === 'PAID') {
          paidPrincipal += (inst.principal || 0);
          paidInterest += (inst.interest || 0);
        } else if (!nextEMI && (inst.status === 'DUE' || inst.status === 'UPCOMING' || inst.status === 'OVERDUE')) {
          nextEMI = inst;
        }
      }

      const remainingPrincipal = Math.max(0, activeLoan.principal - paidPrincipal);
      const progressPercent = activeLoan.principal > 0 ? Math.round((paidPrincipal / activeLoan.principal) * 100) : 0;

      loanSummary = {
        _id: activeLoan._id,
        principal: activeLoan.principal,
        remainingPrincipal,
        paidPrincipal,
        totalInterest: activeLoan.totalInterest,
        paidInterest,
        months: activeLoan.months,
        interestRate: activeLoan.interestRate,
        progressPercent
      };
    }

    res.json({
      user: req.user,
      group,
      totalGroupFund: groupFundSummary.currentBalance,
      currentMonthContribution: {
        amount: group?.monthlyContribution || 200000,
        status: currentContrib ? currentContrib.status : 'PENDING',
        paidAt: currentContrib?.paidAt
      },
      totalContributed,
      totalExtraInterestPenalty,
      activeLoan: loanSummary,
      nextEMI
    });
  } catch (error) {
    next(error);
  }
};
