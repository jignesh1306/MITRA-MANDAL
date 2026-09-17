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

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });

    const enrichedUsers = await Promise.all(users.map(async (uDoc) => {
      const u = uDoc.toObject();
      const activeLoan = await Loan.findOne({ memberId: u._id, status: 'ACTIVE' });
      
      let loanSummary = null;
      if (activeLoan) {
        const installments = await LoanInstallment.find({ loanId: activeLoan._id });
        let paidP = 0;
        let paidI = 0;
        for (const inst of installments) {
          if (inst.status === 'PAID') {
            paidP += inst.principal;
            paidI += inst.interest;
          }
        }
        loanSummary = {
          loanId: activeLoan._id,
          hasActiveLoan: true,
          principal: activeLoan.principal,
          remainingPrincipal: Math.max(0, activeLoan.principal - paidP),
          totalRepayment: activeLoan.totalRepayment,
          progressPercent: activeLoan.principal > 0 ? Math.round((paidP / activeLoan.principal) * 100) : 0
        };
      }

      return {
        ...u,
        loanSummary: loanSummary || { hasActiveLoan: false }
      };
    }));

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

    res.json({
      user,
      summary: {
        totalPaidContributions,
        pendingContributions,
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
