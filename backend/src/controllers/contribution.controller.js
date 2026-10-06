import { Contribution } from '../models/Contribution.js';
import { Group } from '../models/Group.js';
import { Loan } from '../models/Loan.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { Transaction } from '../models/Transaction.js';
import { generateMonthlyContributions, markContributionPaid } from '../services/contribution.service.js';

export const getContributions = async (req, res, next) => {
  try {
    const { month, year, memberId, status } = req.query;
    
    // Auto-ensure contribution records exist for active group members for target month/year
    if (month && year) {
      const group = await Group.findOne();
      if (group) {
        await generateMonthlyContributions(group._id, Number(month), Number(year));
      }
    }

    const query = {};
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (status) query.status = status;
    if (memberId) query.memberId = memberId;

    const list = await Contribution.find(query)
      .populate('memberId', 'name email phone profilePhoto status role')
      .populate('recordedBy', 'name')
      .sort({ year: -1, month: -1, 'memberId.name': 1 });

    const memberContributionsOnly = list.filter(item => item.memberId && item.memberId.role !== 'ADMIN');

    res.json(memberContributionsOnly);
  } catch (error) {
    next(error);
  }
};

export const getMyContributions = async (req, res, next) => {
  try {
    const list = await Contribution.find({ memberId: req.user._id })
      .populate('recordedBy', 'name')
      .sort({ year: -1, month: -1 });

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const generateContributions = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const group = await Group.findOne();
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const created = await generateMonthlyContributions(group._id, targetMonth, targetYear);
    res.json({ message: `${created.length} monthly contribution records created successfully.`, count: created.length });
  } catch (error) {
    next(error);
  }
};

export const markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await markContributionPaid(id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const markAllPaid = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const pendingList = await Contribution.find({
      ...(month && { month: Number(month) }),
      ...(year && { year: Number(year) }),
      status: 'PENDING'
    });

    let updatedCount = 0;
    for (const c of pendingList) {
      try {
        await markContributionPaid(c._id, req.user._id);
        updatedCount++;
      } catch (err) {
        // Continue loop if single failure
      }
    }

    res.json({ message: `${updatedCount} contributions marked as paid successfully.`, updatedCount });
  } catch (error) {
    next(error);
  }
};

// GET /contributions/member/:memberId?month=&year=
// Returns: { regularEMI, loanInstallments } for a specific member + month
export const getMemberEntries = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'month and year are required' });
    }

    // 1. Regular monthly EMI contribution
    const regularEMI = await Contribution.findOne({
      memberId,
      month: Number(month),
      year: Number(year)
    })
      .populate('recordedBy', 'name')
      .lean();

    // 2. All active / overdue loan installments due in this month/year
    const activeLoans = await Loan.find({
      memberId,
      status: { $in: ['ACTIVE', 'APPROVED'] }
    }).lean();

    const loanInstallments = [];
    for (const loan of activeLoans) {
      const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
      const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59);

      const installments = await LoanInstallment.find({
        loanId: loan._id,
        dueDate: { $gte: startOfMonth, $lte: endOfMonth }
      })
        .populate('recordedBy', 'name')
        .lean();

      for (const inst of installments) {
        loanInstallments.push({
          ...inst,
          loanPurpose: loan.purpose,
          loanPrincipal: loan.principal,
          interestRate: loan.interestRate,
        });
      }
    }

    // 3. Also fetch OVERDUE loan installments (any month, still unpaid) for this member
    const overdueInstallments = [];
    for (const loan of activeLoans) {
      const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
      const overdue = await LoanInstallment.find({
        loanId: loan._id,
        status: { $in: ['OVERDUE', 'DUE'] },
        dueDate: { $lt: startOfMonth }
      })
        .populate('recordedBy', 'name')
        .lean();

      for (const inst of overdue) {
        overdueInstallments.push({
          ...inst,
          loanPurpose: loan.purpose,
          loanPrincipal: loan.principal,
          interestRate: loan.interestRate,
        });
      }
    }

    res.json({ regularEMI, loanInstallments, overdueInstallments });
  } catch (error) {
    next(error);
  }
};

// DELETE /contributions/:id  — permanently delete a regular EMI contribution record
export const deleteContribution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contrib = await Contribution.findById(id);
    if (!contrib) return res.status(404).json({ message: 'Contribution record not found' });

    // If there is a linked transaction, delete it too
    if (contrib.transactionId) {
      await Transaction.findByIdAndDelete(contrib.transactionId);
    }

    await Contribution.findByIdAndDelete(id);
    res.json({ message: 'Contribution record permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// DELETE /contributions/installment/:id — permanently delete a loan installment record
// Also deletes ALL transactions linked to this installment via loanId + installmentNumber match
export const deleteLoanInstallment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inst = await LoanInstallment.findById(id).populate('loanId').lean();
    if (!inst) return res.status(404).json({ message: 'Installment record not found' });

    // Delete ALL transactions tied to this installment (principal + interest)
    // They share the same loanId and description pattern (installmentNumber)
    if (inst.loanId) {
      await Transaction.deleteMany({
        loanId: inst.loanId._id || inst.loanId,
        description: { $regex: `#${inst.installmentNumber}` }
      });
    }

    // Reset installment to UPCOMING (safer than deleting — preserves loan schedule)
    await LoanInstallment.findByIdAndUpdate(id, {
      $set: {
        status: inst.installmentNumber === 1 ? 'DUE' : 'UPCOMING',
        paidAmount: 0,
        paidPrincipal: 0,
        paidInterest: 0,
        paidAt: null,
        transactionId: null,
        recordedBy: null,
      }
    });

    res.json({ message: 'Installment payment entries permanently deleted and installment reset to unpaid.' });
  } catch (error) {
    next(error);
  }
};
