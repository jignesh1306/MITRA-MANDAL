import { User } from '../models/User.js';
import { GroupMember } from '../models/GroupMember.js';
import { Group } from '../models/Group.js';
import { Contribution } from '../models/Contribution.js';
import { Loan } from '../models/Loan.js';
import { Transaction } from '../models/Transaction.js';
import bcrypt from 'bcryptjs';
import { generateRefId } from '../services/refId.service.js';

import { LoanInstallment } from '../models/LoanInstallment.js';
import { createPastCompletedLoan, createPreExistingRunningLoan } from '../services/loan.service.js';
import { markContributionPaid } from '../services/contribution.service.js';
import { getFundSummary } from '../services/fund.service.js';

export const getMembers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = { role: 'MEMBER' };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const [group, users] = await Promise.all([
      Group.findOne().lean(),
      User.find(query).select('-passwordHash').sort({ createdAt: -1 }).lean()
    ]);

    const fundSummary = group ? await getFundSummary(group._id) : { currentBalance: 0 };
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const memberIds = users.map(u => u._id);

    // Batch query contributions, active loans, and penalty/extra interest transactions in parallel
    const [contributions, activeLoans, allFines] = await Promise.all([
      Contribution.find({
        memberId: { $in: memberIds },
        month: currentMonth,
        year: currentYear
      }).lean(),
      Loan.find({
        memberId: { $in: memberIds },
        status: 'ACTIVE'
      }).lean(),
      Transaction.find({
        memberId: { $in: memberIds },
        category: 'FINE'
      }).select('memberId amount').lean()
    ]);

    // Map fines by memberId
    const finesByMemberId = new Map();
    for (const f of allFines) {
      const key = f.memberId.toString();
      finesByMemberId.set(key, (finesByMemberId.get(key) || 0) + (f.amount || 0));
    }

    // Map contributions by memberId
    const contribMap = new Map();
    for (const c of contributions) {
      contribMap.set(c.memberId.toString(), c);
    }

    // Map active loans by memberId
    const loanMap = new Map();
    const activeLoanIds = [];
    for (const l of activeLoans) {
      loanMap.set(l.memberId.toString(), l);
      activeLoanIds.push(l._id);
    }

    // Batch query installments for all active loans in 1 fast query
    const allInstallments = activeLoanIds.length > 0
      ? await LoanInstallment.find({ loanId: { $in: activeLoanIds } }).sort({ installmentNumber: 1 }).lean()
      : [];

    // Group installments by loanId
    const installmentsByLoanId = new Map();
    for (const inst of allInstallments) {
      const key = inst.loanId.toString();
      if (!installmentsByLoanId.has(key)) {
        installmentsByLoanId.set(key, []);
      }
      installmentsByLoanId.get(key).push(inst);
    }

    const enrichedUsers = users.map((u) => {
      const currentContribution = contribMap.get(u._id.toString());
      const monthlyContributionAmount = (u.monthlyContribution && u.monthlyContribution > 0)
        ? u.monthlyContribution
        : (group?.monthlyContribution || 200000);

      const contributionInfo = {
        month: currentMonth,
        year: currentYear,
        expectedAmount: monthlyContributionAmount,
        status: currentContribution ? currentContribution.status : 'PENDING',
        paidAmount: currentContribution?.status === 'PAID' ? currentContribution.amount : 0
      };

      const activeLoan = loanMap.get(u._id.toString());
      let loanSummary = null;

      if (activeLoan) {
        const installments = installmentsByLoanId.get(activeLoan._id.toString()) || [];
        let paidP = 0;
        let paidI = 0;
        let nextDueInstallment = null;

        for (const inst of installments) {
          if (inst.status === 'PAID') {
            paidP += (inst.principal || 0);
            paidI += (inst.interest || 0);
          } else if (!nextDueInstallment) {
            nextDueInstallment = inst;
          }
        }

        const remainingPrincipal = Math.max(0, activeLoan.principal - paidP);
        const remainingInterest = Math.max(0, activeLoan.totalInterest - paidI);

        loanSummary = {
          loanId: activeLoan._id,
          hasActiveLoan: true,
          principal: activeLoan.principal,
          paidPrincipal: paidP,
          remainingPrincipal,
          totalInterest: activeLoan.totalInterest,
          paidInterest: paidI,
          remainingInterest,
          totalRepayment: activeLoan.totalRepayment,
          currentEMI: nextDueInstallment ? nextDueInstallment.emi : 0,
          currentEMIPrincipal: nextDueInstallment ? nextDueInstallment.principal : 0,
          currentEMIInterest: nextDueInstallment ? nextDueInstallment.interest : 0,
          progressPercent: activeLoan.principal > 0 ? Math.round((paidP / activeLoan.principal) * 100) : 0
        };
      }

      return {
        ...u,
        groupFundBalance: fundSummary.currentBalance || 0,
        currentContribution: contributionInfo,
        loanSummary: loanSummary || { hasActiveLoan: false },
        totalExtraInterestPenalty: finesByMemberId.get(u._id.toString()) || 0
      };
    });

    res.json(enrichedUsers);
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Member not found.' });

    const contributions = await Contribution.find({ memberId: targetUserId }).sort({ year: -1, month: -1 });
    const loans = await Loan.find({ memberId: targetUserId }).sort({ createdAt: -1 });
    const transactions = await Transaction.find({ memberId: targetUserId }).sort({ date: -1 });

    let totalPaidContributions = 0;
    let pendingContributions = 0;
    for (const c of contributions) {
      if (c.status === 'PAID') totalPaidContributions += c.amount;
      else pendingContributions += c.amount;
    }

    let totalExtraInterestPenalty = 0;
    for (const t of transactions) {
      if (t.category === 'FINE') {
        totalExtraInterestPenalty += (t.amount || 0);
      }
    }

    const enrichedLoans = await Promise.all(loans.map(async (loanDoc) => {
      const l = loanDoc.toObject();
      const installments = await LoanInstallment.find({ loanId: l._id }).sort({ installmentNumber: 1 });
      
      let paidPrincipal = 0;
      let paidInterest = 0;
      for (const inst of installments) {
        if (inst.status === 'PAID') {
          paidPrincipal += inst.principal;
          paidInterest += inst.interest;
        }
      }

      const remainingPrincipal = Math.max(0, l.principal - paidPrincipal);
      const remainingInterest = Math.max(0, l.totalInterest - paidInterest);
      const totalRepayment = l.totalRepayment || (l.principal + l.totalInterest);
      const remainingTotalRepayment = remainingPrincipal + remainingInterest;
      const progressPercent = l.principal > 0 ? Math.round((paidPrincipal / l.principal) * 100) : 0;

      return {
        ...l,
        installments,
        summary: {
          originalPrincipal: l.principal,
          totalInterest: l.totalInterest,
          totalRepaymentWithInterest: totalRepayment,
          paidPrincipal,
          paidInterest,
          totalPaidSoFar: paidPrincipal + paidInterest,
          remainingPrincipal,
          remainingInterest,
          remainingTotalRepayment,
          progressPercent
        }
      };
    }));

    const group = await Group.findOne();
    const fundSummary = group ? await getFundSummary(group._id) : { currentBalance: 0 };
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const currentContribution = contributions.find(c => c.month === currentMonth && c.year === currentYear);
    const monthlyContributionAmount = (user.monthlyContribution && user.monthlyContribution > 0)
      ? user.monthlyContribution
      : (group?.monthlyContribution || 200000);

    const contributionInfo = {
      month: currentMonth,
      year: currentYear,
      expectedAmount: monthlyContributionAmount,
      status: currentContribution ? currentContribution.status : 'PENDING',
      paidAmount: currentContribution?.status === 'PAID' ? currentContribution.amount : 0
    };

    res.json({
      user,
      groupFundBalance: fundSummary.currentBalance || 0,
      currentContribution: contributionInfo,
      summary: {
        totalPaidContributions,
        pendingContributions,
        totalExtraInterestPenalty,
        totalLoans: loans.length,
        activeLoans: loans.filter(l => l.status === 'ACTIVE').length
      },
      contributions,
      loans: enrichedLoans,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, joiningDate, monthlyContribution } = req.body;
    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this mobile number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'mitra12345', salt);

    const user = await User.create({
      name,
      email: email || '',
      phone: phone.trim(),
      passwordHash,
      role: role || 'MEMBER',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: 'ACTIVE'
    });

    const group = await Group.findOne();
    const groupId = req.body.groupId || group?._id;

    if (groupId) {
      await GroupMember.create({
        groupId,
        userId: user._id,
        status: 'ACTIVE'
      });

      const amount = monthlyContribution ? Math.round(Number(monthlyContribution) * 100) : (group?.monthlyContribution || 200000);
      await generateMemberContributionsFromJoining(user, groupId, amount);
    }

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};



export const generateMemberContributionsFromJoining = async (user, groupId, monthlyAmount, markPaid = false, adminUserId = null) => {
  const joinDate = user.joiningDate ? new Date(user.joiningDate) : new Date(user.createdAt);
  const startDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
  const now = new Date();
  const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);

  const curIter = new Date(startDate);
  while (curIter <= currentDate) {
    const m = curIter.getMonth() + 1;
    const y = curIter.getFullYear();

    try {
      const contrib = await Contribution.create({
        groupId,
        memberId: user._id,
        month: m,
        year: y,
        amount: monthlyAmount || 200000,
        status: 'PENDING'
      });

      if (markPaid && adminUserId) {
        await markContributionPaid(contrib._id, adminUserId);
      }
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    curIter.setMonth(curIter.getMonth() + 1);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== targetUserId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { 
      name, 
      phone, 
      status, 
      role, 
      joiningDate, 
      monthlyContribution, 
      markPastContributionsPaid, 
      pastLoans, 
      runningLoan 
    } = req.body;

    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ message: 'Member not found.' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (joiningDate) user.joiningDate = new Date(joiningDate);

    const wasPending = user.status === 'PENDING';
    if (status && req.user.role === 'ADMIN') {
      user.status = status;
      await GroupMember.updateMany({ userId: targetUserId }, { status });
    }
    if (role && req.user.role === 'ADMIN') user.role = role;

    await user.save();

    // If Admin approved user or changed status to ACTIVE, auto generate contributions from joining date
    if (user.status === 'ACTIVE' && (wasPending || joiningDate || status === 'ACTIVE')) {
      const group = await Group.findOne();
      if (group) {
        const amount = monthlyContribution ? Math.round(Number(monthlyContribution) * 100) : group.monthlyContribution;
        await generateMemberContributionsFromJoining(user, group._id, amount, !!markPastContributionsPaid, req.user._id);

        // Process Past Completed Loans array if provided
        if (Array.isArray(pastLoans) && pastLoans.length > 0) {
          for (const pl of pastLoans) {
            if (pl.amount && pl.months) {
              await createPastCompletedLoan({
                groupId: group._id,
                memberId: user._id,
                amount: Math.round(Number(pl.amount) * 100),
                months: Number(pl.months),
                interestRate: Number(pl.interestRate || group.defaultInterestRate),
                interestType: pl.interestType || group.interestType,
                startDate: pl.startDate ? new Date(pl.startDate) : new Date(),
                note: pl.note || 'Historical Completed Loan',
                adminUserId: req.user._id
              });
            }
          }
        }

        // Process Current Pre-Existing Running Loan if provided
        if (runningLoan && runningLoan.amount && runningLoan.months) {
          await createPreExistingRunningLoan({
            groupId: group._id,
            memberId: user._id,
            amount: Math.round(Number(runningLoan.amount) * 100),
            months: Number(runningLoan.months),
            interestRate: Number(runningLoan.interestRate || group.defaultInterestRate),
            interestType: runningLoan.interestType || group.interestType,
            startDate: runningLoan.startDate ? new Date(runningLoan.startDate) : new Date(),
            note: runningLoan.note || 'Historical Pre-Existing Running Loan',
            adminUserId: req.user._id
          });
        }
      }
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
