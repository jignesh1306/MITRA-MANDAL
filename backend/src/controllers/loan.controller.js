import { Loan } from '../models/Loan.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { LoanRequest } from '../models/LoanRequest.js';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { 
  createLoanRequest, 
  approveLoanRequest, 
  payInstallment,
  createPastCompletedLoan,
  createPreExistingRunningLoan
} from '../services/loan.service.js';
import { getFundSummary } from '../services/fund.service.js';
import { calculateLoanSchedule } from '../services/loanCalculator.service.js';
import { createNotification } from '../services/notification.service.js';

export const getLoans = async (req, res, next) => {
  try {
    const { status, memberId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (memberId) query.memberId = memberId;

    const list = await Loan.find(query)
      .populate('memberId', 'name email phone profilePhoto')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getMyLoans = async (req, res, next) => {
  try {
    const list = await Loan.find({ memberId: req.user._id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    const pendingRequests = await LoanRequest.find({ memberId: req.user._id, status: 'PENDING' }).sort({ createdAt: -1 });

    const enrichedLoans = await Promise.all(list.map(async (loanDoc) => {
      const loan = loanDoc.toObject();
      const installments = await LoanInstallment.find({ loanId: loan._id }).sort({ installmentNumber: 1 });

      let paidPrincipal = 0;
      let paidInterest = 0;

      for (const inst of installments) {
        if (inst.status === 'PAID') {
          paidPrincipal += inst.principal;
          paidInterest += inst.interest;
        }
      }

      const remainingPrincipal = Math.max(0, loan.principal - paidPrincipal);
      const remainingInterest = Math.max(0, loan.totalInterest - paidInterest);
      const totalRepayment = loan.totalRepayment || (loan.principal + loan.totalInterest);
      const remainingTotalRepayment = remainingPrincipal + remainingInterest;
      const progressPercent = loan.principal > 0 ? Math.round((paidPrincipal / loan.principal) * 100) : 0;

      return {
        ...loan,
        installments,
        summary: {
          originalPrincipal: loan.principal,
          totalInterest: loan.totalInterest,
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

    // Format pending requests to match loan structures for UI
    const pendingItems = pendingRequests.map(r => ({
      _id: r._id,
      principal: r.amount,
      months: r.months,
      interestRate: r.interestRate,
      interestType: r.interestType,
      purpose: r.purpose,
      note: r.note,
      status: 'PENDING',
      requestDate: r.requestDate || r.createdAt,
      createdAt: r.createdAt
    }));

    res.json([...pendingItems, ...enrichedLoans]);
  } catch (error) {
    next(error);
  }
};

export const getLoanRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const requests = await LoanRequest.find(query)
      .populate('memberId', 'name email phone profilePhoto')
      .sort({ createdAt: -1 });

    const group = await Group.findOne();
    const fundSummary = await getFundSummary(group?._id);

    const items = requests.map(r => {
      const calculation = calculateLoanSchedule({
        principal: r.amount,
        months: r.months,
        monthlyInterestRate: r.interestRate,
        interestType: r.interestType
      });
      return {
        ...r.toObject(),
        calculation,
        insufficientFundWarning: fundSummary.currentBalance < r.amount
      };
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id).populate('memberId', 'name email phone profilePhoto');
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    if (req.user.role !== 'ADMIN' && loan.memberId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to other member loan details.' });
    }

    const installments = await LoanInstallment.find({ loanId: loan._id }).sort({ installmentNumber: 1 });

    let paidAmount = 0;
    let interestPaid = 0;
    for (const inst of installments) {
      if (inst.status === 'PAID') {
        paidAmount += inst.principal;
        interestPaid += inst.interest;
      }
    }

    // Fallback for COMPLETED loans (e.g. historical completed loans without explicit installments)
    if (loan.status === 'COMPLETED' && paidAmount === 0 && loan.principal > 0) {
      paidAmount = loan.principal;
      interestPaid = loan.totalInterest;
    }

    const remainingPrincipal = Math.max(0, loan.principal - paidAmount);
    const remainingInterest = Math.max(0, loan.totalInterest - interestPaid);
    const progressPercent = loan.principal > 0 ? Math.round((paidAmount / loan.principal) * 100) : 0;

    res.json({
      loan,
      installments,
      summary: {
        paidAmount,
        remainingPrincipal,
        interestPaid,
        remainingInterest,
        progressPercent
      }
    });
  } catch (error) {
    next(error);
  }
};

export const requestLoan = async (req, res, next) => {
  try {
    const { amount, months, purpose, note } = req.body;
    const group = await Group.findOne();
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const result = await createLoanRequest({
      groupId: group._id,
      memberId: req.user._id,
      amount,
      months,
      purpose,
      note
    });

    // Notify all Admins in simple English
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        groupId: group._id,
        type: 'SYSTEM',
        title: 'Loan Request',
        message: `${req.user.name} asked for a loan of ₹${(amount / 100).toLocaleString('en-IN')} for ${months} months.`,
        type: 'SYSTEM'
      });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { override, transferProofUrl } = req.body;
    const result = await approveLoanRequest(id, req.user._id, !!override, transferProofUrl || '');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const request = await LoanRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Loan request not found.' });

    request.status = 'REJECTED';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason || 'Rejected by Admin.';
    await request.save();

    // Notify member in simple English
    await createNotification({
      userId: request.memberId,
      groupId: request.groupId,
      type: 'LOAN_REJECTED',
      title: 'Loan Rejected',
      message: `Your loan request of ₹${(request.amount / 100).toLocaleString('en-IN')} was rejected. Reason: ${request.rejectionReason}`
    });

    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const addDirectHistoricalLoan = async (req, res, next) => {
  try {
    const { memberId, type, amount, months, interestRate, interestType, startDate, note } = req.body;
    const group = await Group.findOne();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!memberId || !type || !amount || !months) {
      return res.status(400).json({ message: 'Member, Loan Type, Amount, and Months are required.' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const monthsNum = Number(months);
    const rateNum = Number(interestRate || group.defaultInterestRate);
    const typeStr = interestType || group.interestType;
    const startDateObj = startDate ? new Date(startDate) : new Date();

    let loan;
    if (type === 'COMPLETED') {
      loan = await createPastCompletedLoan({
        groupId: group._id,
        memberId,
        amount: amountInPaise,
        months: monthsNum,
        interestRate: rateNum,
        interestType: typeStr,
        startDate: startDateObj,
        note: note || 'Direct Past Historical Loan Added by Admin',
        adminUserId: req.user._id
      });
    } else if (type === 'RUNNING') {
      loan = await createPreExistingRunningLoan({
        groupId: group._id,
        memberId,
        amount: amountInPaise,
        months: monthsNum,
        interestRate: rateNum,
        interestType: typeStr,
        startDate: startDateObj,
        note: note || 'Direct Pre-Existing Running Loan Added by Admin',
        adminUserId: req.user._id
      });
    } else {
      return res.status(400).json({ message: 'Invalid loan type. Use COMPLETED or RUNNING.' });
    }

    res.status(201).json({ message: 'Loan successfully added!', loan });
  } catch (error) {
    next(error);
  }
};

export const addExtraInterestPenalty = async (req, res, next) => {
  try {
    const { memberId, amount, description, loanId } = req.body;
    const group = await Group.findOne();
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!memberId || !amount) {
      return res.status(400).json({ message: 'Member and Extra Interest / Penalty Amount are required.' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const member = await User.findById(memberId);
    if (!member) return res.status(404).json({ message: 'Member not found.' });

    const refId = await generateRefId('FINE');
    const transaction = await Transaction.create({
      referenceId: refId,
      groupId: group._id,
      type: 'INCOME',
      category: 'FINE',
      amount: amountInPaise,
      memberId,
      loanId: loanId || undefined,
      description: description || `Extra Interest / Penalty from ${member.name} (${refId})`,
      date: new Date(),
      createdBy: req.user._id
    });

    res.status(201).json({ 
      message: `₹${Number(amount).toLocaleString('en-IN')} Extra Interest / Penalty successfully added to total treasury balance!`, 
      transaction 
    });
  } catch (error) {
    next(error);
  }
};


export const recordEMIPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await payInstallment(id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};


