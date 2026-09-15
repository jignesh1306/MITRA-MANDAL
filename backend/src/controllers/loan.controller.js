import { Loan } from '../models/Loan.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { LoanRequest } from '../models/LoanRequest.js';
import { Group } from '../models/Group.js';
import { 
  createLoanRequest, 
  approveLoanRequest, 
  payInstallment 
} from '../services/loan.service.js';
import { getFundSummary } from '../services/fund.service.js';
import { calculateLoanSchedule } from '../services/loanCalculator.service.js';

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

    res.json(enrichedLoans);
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

    const remainingPrincipal = loan.principal - paidAmount;
    const progressPercent = Math.round((paidAmount / loan.principal) * 100);

    res.json({
      loan,
      installments,
      summary: {
        paidAmount,
        remainingPrincipal,
        interestPaid,
        remainingInterest: loan.totalInterest - interestPaid,
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

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { override } = req.body;
    const result = await approveLoanRequest(id, req.user._id, !!override);
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

    res.json(request);
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
