import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';
import { Contribution } from '../models/Contribution.js';
import { Loan } from '../models/Loan.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { Transaction } from '../models/Transaction.js';
import { getFundSummary } from '../services/fund.service.js';

export const getAdminSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const group = await Group.findOne();
    const fundSummary = await getFundSummary(group?._id);

    const totalMembers = await User.countDocuments();
    const activeMembers = await User.countDocuments({ status: 'ACTIVE' });
    const pendingMembersCount = await User.countDocuments({ status: 'PENDING' });

    const currentContribs = await Contribution.find({ month: currentMonth, year: currentYear });
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

    const activeLoans = await Loan.find({ status: 'ACTIVE' }).populate('memberId', 'name');
    let totalOutstandingPrincipal = 0;
    for (const l of activeLoans) {
      const paidInsts = await LoanInstallment.find({ loanId: l._id, status: 'PAID' });
      const paidP = paidInsts.reduce((acc, i) => acc + i.principal, 0);
      totalOutstandingPrincipal += (l.principal - paidP);
    }

    const overdueEMIsCount = await LoanInstallment.countDocuments({
      status: 'OVERDUE'
    });

    const monthlyCharts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthLabel = d.toLocaleString('en-US', { month: 'short' }) + ' ' + y;

      const mStart = new Date(y, m - 1, 1);
      const mEnd = new Date(y, m, 0, 23, 59, 59);

      const txs = await Transaction.find({ date: { $gte: mStart, $lte: mEnd } });
      let income = 0;
      let expense = 0;
      for (const t of txs) {
        if (t.type === 'INCOME') income += t.amount / 100;
        if (t.type === 'EXPENSE') expense += t.amount / 100;
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
        overdueEMIsCount
      },
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

    const group = await Group.findOne();
    const groupFundSummary = await getFundSummary(group?._id);

    const currentContrib = await Contribution.findOne({
      memberId: userId,
      month: currentMonth,
      year: currentYear
    });

    const allPaidContribs = await Contribution.find({ memberId: userId, status: 'PAID' });
    const totalContributed = allPaidContribs.reduce((acc, c) => acc + c.amount, 0);

    const activeLoan = await Loan.findOne({ memberId: userId, status: 'ACTIVE' });
    let loanSummary = null;
    let nextEMI = null;

    if (activeLoan) {
      const installments = await LoanInstallment.find({ loanId: activeLoan._id }).sort({ installmentNumber: 1 });
      let paidPrincipal = 0;
      let paidInterest = 0;

      for (const inst of installments) {
        if (inst.status === 'PAID') {
          paidPrincipal += inst.principal;
          paidInterest += inst.interest;
        } else if (!nextEMI && (inst.status === 'DUE' || inst.status === 'UPCOMING' || inst.status === 'OVERDUE')) {
          nextEMI = inst;
        }
      }

      const remainingPrincipal = activeLoan.principal - paidPrincipal;
      const progressPercent = Math.round((paidPrincipal / activeLoan.principal) * 100);

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
      activeLoan: loanSummary,
      nextEMI
    });
  } catch (error) {
    next(error);
  }
};
