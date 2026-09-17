import { Loan } from '../models/Loan.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { LoanRequest } from '../models/LoanRequest.js';
import { Transaction } from '../models/Transaction.js';
import { Group } from '../models/Group.js';
import { calculateLoanSchedule } from './loanCalculator.service.js';
import { getFundSummary } from './fund.service.js';
import { generateRefId } from './refId.service.js';
import { createNotification } from './notification.service.js';
import { createAuditLog } from './audit.service.js';

export const createLoanRequest = async ({ groupId, memberId, amount, months, purpose, note }) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found');

  // Business rule: max 1 active loan per member
  const activeLoans = await Loan.countDocuments({ groupId, memberId, status: 'ACTIVE' });
  if (activeLoans >= group.maxActiveLoansPerMember) {
    throw new Error('You already have an active loan.');
  }

  const calculation = calculateLoanSchedule({
    principal: amount,
    months,
    monthlyInterestRate: group.defaultInterestRate,
    interestType: group.interestType
  });

  const request = await LoanRequest.create({
    groupId,
    memberId,
    amount,
    months,
    interestRate: group.defaultInterestRate,
    interestType: group.interestType,
    purpose,
    note,
    status: 'PENDING'
  });

  return { request, calculation };
};

export const approveLoanRequest = async (requestId, adminUserId, overrideInsufficientFund = false, transferProofUrl = '') => {
  const request = await LoanRequest.findById(requestId).populate('memberId', 'name email');
  if (!request) throw new Error('Loan request not found');
  if (request.status !== 'PENDING') throw new Error('Loan request is not in PENDING status');

  const fundSummary = await getFundSummary(request.groupId);
  if (fundSummary.currentBalance < request.amount && !overrideInsufficientFund) {
    throw new Error('Insufficient group fund balance to approve this loan.');
  }

  const calculation = calculateLoanSchedule({
    principal: request.amount,
    months: request.months,
    monthlyInterestRate: request.interestRate,
    interestType: request.interestType
  });

  // Create Loan record
  const loan = await Loan.create({
    groupId: request.groupId,
    memberId: request.memberId._id || request.memberId,
    principal: calculation.principal,
    months: calculation.months,
    interestRate: calculation.interestRate,
    interestType: calculation.interestType,
    totalInterest: calculation.totalInterest,
    totalRepayment: calculation.totalRepayment,
    startDate: new Date(),
    status: 'ACTIVE',
    purpose: request.purpose,
    note: request.note,
    transferProofUrl,
    approvedBy: adminUserId,
    approvedAt: new Date()
  });

  // Create Loan Installments
  const installments = [];
  for (const s of calculation.schedule) {
    const inst = await LoanInstallment.create({
      loanId: loan._id,
      installmentNumber: s.month,
      dueDate: s.dueDate,
      principal: s.principal,
      interest: s.interest,
      emi: s.emi,
      paidAmount: 0,
      remainingPrincipal: s.remainingPrincipal,
      status: s.month === 1 ? 'DUE' : 'UPCOMING'
    });
    installments.push(inst);
  }

  // Create Loan Disbursement Transaction
  const refId = await generateRefId('LN');
  const transaction = await Transaction.create({
    referenceId: refId,
    groupId: request.groupId,
    type: 'EXPENSE',
    category: 'LOAN_DISBURSEMENT',
    amount: request.amount,
    memberId: request.memberId._id || request.memberId,
    loanId: loan._id,
    description: `Loan Disbursement to ${request.memberId.name} (${refId})`,
    date: new Date(),
    createdBy: adminUserId
  });

  request.status = 'APPROVED';
  request.transferProofUrl = transferProofUrl;
  request.reviewedBy = adminUserId;
  request.reviewedAt = new Date();
  await request.save();

  await createNotification({
    userId: request.memberId._id || request.memberId,
    groupId: request.groupId,
    type: 'LOAN_APPROVED',
    title: 'Loan Approved',
    message: `Your loan of ₹${(request.amount / 100).toLocaleString('en-IN')} was approved by Admin.`
  });

  await createAuditLog({
    groupId: request.groupId,
    userId: adminUserId,
    action: 'LOAN_APPROVED',
    entityType: 'Loan',
    entityId: loan._id.toString(),
    newValue: { loanId: loan._id, amount: request.amount, transactionId: transaction._id }
  });

  return { loan, installments, transaction };
};

export const payInstallment = async (installmentId, adminUserId) => {
  const inst = await LoanInstallment.findById(installmentId).populate({
    path: 'loanId',
    populate: { path: 'memberId', select: 'name email' }
  });
  if (!inst) throw new Error('Installment not found');
  if (inst.status === 'PAID') throw new Error('EMI is already paid');

  const loan = inst.loanId;
  const member = loan.memberId;

  // Split Accounting Transactions
  const principalRef = await generateRefId('EMI-P');
  const interestRef = await generateRefId('EMI-I');

  const principalTx = await Transaction.create({
    referenceId: principalRef,
    groupId: loan.groupId,
    type: 'INCOME',
    category: 'LOAN_REPAYMENT_PRINCIPAL',
    amount: inst.principal,
    memberId: member._id || member,
    loanId: loan._id,
    description: `EMI #${inst.installmentNumber} Principal Repayment - ${member.name}`,
    date: new Date(),
    createdBy: adminUserId
  });

  const interestTx = await Transaction.create({
    referenceId: interestRef,
    groupId: loan.groupId,
    type: 'INCOME',
    category: 'LOAN_INTEREST',
    amount: inst.interest,
    memberId: member._id || member,
    loanId: loan._id,
    description: `EMI #${inst.installmentNumber} Interest Income - ${member.name}`,
    date: new Date(),
    createdBy: adminUserId
  });

  inst.status = 'PAID';
  inst.paidAmount = inst.emi;
  inst.paidAt = new Date();
  inst.recordedBy = adminUserId;
  inst.transactionId = principalTx._id;
  await inst.save();

  // Check if all installments for this loan are paid
  const unpaidCount = await LoanInstallment.countDocuments({ loanId: loan._id, status: { $ne: 'PAID' } });
  if (unpaidCount === 0) {
    loan.status = 'COMPLETED';
    loan.completedAt = new Date();
    await loan.save();

    await createNotification({
      userId: member._id || member,
      groupId: loan.groupId,
      type: 'LOAN_COMPLETED',
      title: 'Loan Completed',
      message: `Your loan has been fully paid off!`
    });
  } else {
    // Set next upcoming installment to DUE
    const nextInst = await LoanInstallment.findOne({ loanId: loan._id, status: 'UPCOMING' }).sort({ installmentNumber: 1 });
    if (nextInst) {
      nextInst.status = 'DUE';
      await nextInst.save();
    }
  }

  await createAuditLog({
    groupId: loan.groupId,
    userId: adminUserId,
    action: 'EMI_MARKED_PAID',
    entityType: 'LoanInstallment',
    entityId: inst._id.toString(),
    newValue: { installmentNumber: inst.installmentNumber, paidAmount: inst.emi }
  });

  return { installment: inst, principalTx, interestTx, loanStatus: loan.status };
};

export const createPastCompletedLoan = async ({
  groupId,
  memberId,
  amount, // in paise
  months,
  interestRate,
  interestType = 'REDUCING',
  startDate,
  note = '',
  adminUserId
}) => {
  const calculation = calculateLoanSchedule({
    principal: amount,
    months,
    monthlyInterestRate: interestRate,
    interestType,
    startDate: startDate ? new Date(startDate) : new Date()
  });

  const loan = await Loan.create({
    groupId,
    memberId,
    principal: calculation.principal,
    months: calculation.months,
    interestRate: calculation.interestRate,
    interestType: calculation.interestType,
    totalInterest: calculation.totalInterest,
    totalRepayment: calculation.totalRepayment,
    startDate: startDate ? new Date(startDate) : new Date(),
    status: 'COMPLETED',
    purpose: 'Past Historical Loan (Completed)',
    note,
    isHistorical: true,
    historicalType: 'COMPLETED',
    approvedBy: adminUserId,
    approvedAt: new Date(),
    completedAt: new Date()
  });

  // 1. Log Disbursement Expense for the loan creation
  const refIdD = await generateRefId('HIST-LN');
  await Transaction.create({
    referenceId: refIdD,
    groupId,
    type: 'EXPENSE',
    category: 'LOAN_DISBURSEMENT',
    amount: calculation.principal,
    memberId,
    loanId: loan._id,
    description: `Past Historical Loan Disbursement (${refIdD})`,
    date: startDate ? new Date(startDate) : new Date(),
    createdBy: adminUserId
  });

  // 2. Create Loan Installments marked as PAID
  for (const s of calculation.schedule) {
    await LoanInstallment.create({
      loanId: loan._id,
      installmentNumber: s.month,
      dueDate: s.dueDate,
      principal: s.principal,
      interest: s.interest,
      emi: s.emi,
      paidAmount: s.emi,
      remainingPrincipal: s.remainingPrincipal,
      status: 'PAID',
      paidAt: s.dueDate,
      recordedBy: adminUserId
    });
  }

  // 3. Log Income Transactions for Interest & Principal into group accounting
  const refIdP = await generateRefId('HIST-P');
  await Transaction.create({
    referenceId: refIdP,
    groupId,
    type: 'INCOME',
    category: 'LOAN_REPAYMENT_PRINCIPAL',
    amount: calculation.principal,
    memberId,
    loanId: loan._id,
    description: `Past Historical Loan Principal Repaid (${refIdP})`,
    date: startDate ? new Date(startDate) : new Date(),
    createdBy: adminUserId
  });

  const refIdI = await generateRefId('HIST-I');
  await Transaction.create({
    referenceId: refIdI,
    groupId,
    type: 'INCOME',
    category: 'LOAN_INTEREST',
    amount: calculation.totalInterest,
    memberId,
    loanId: loan._id,
    description: `Past Historical Loan Interest Earned (${refIdI})`,
    date: startDate ? new Date(startDate) : new Date(),
    createdBy: adminUserId
  });

  return loan;
};

export const createPreExistingRunningLoan = async ({
  groupId,
  memberId,
  amount, // in paise
  months,
  interestRate,
  interestType = 'REDUCING',
  startDate,
  note = '',
  adminUserId
}) => {
  const calcStartDate = startDate ? new Date(startDate) : new Date();
  const calculation = calculateLoanSchedule({
    principal: amount,
    months,
    monthlyInterestRate: interestRate,
    interestType,
    startDate: calcStartDate
  });

  const loan = await Loan.create({
    groupId,
    memberId,
    principal: calculation.principal,
    months: calculation.months,
    interestRate: calculation.interestRate,
    interestType: calculation.interestType,
    totalInterest: calculation.totalInterest,
    totalRepayment: calculation.totalRepayment,
    startDate: calcStartDate,
    status: 'ACTIVE',
    purpose: 'Pre-Existing Running Loan',
    note,
    isHistorical: true,
    historicalType: 'RUNNING',
    approvedBy: adminUserId,
    approvedAt: new Date()
  });

  // 1. Log Initial Loan Disbursement Expense
  const refIdD = await generateRefId('RUN-LN');
  await Transaction.create({
    referenceId: refIdD,
    groupId,
    type: 'EXPENSE',
    category: 'LOAN_DISBURSEMENT',
    amount: calculation.principal,
    memberId,
    loanId: loan._id,
    description: `Running Loan Disbursement (${refIdD})`,
    date: calcStartDate,
    createdBy: adminUserId
  });

  const now = new Date();
  let firstUnpaidFound = false;

  for (const s of calculation.schedule) {
    const isPastDue = s.dueDate <= now;
    const instStatus = isPastDue ? 'PAID' : (!firstUnpaidFound ? 'DUE' : 'UPCOMING');
    if (!isPastDue && !firstUnpaidFound) firstUnpaidFound = true;

    const inst = await LoanInstallment.create({
      loanId: loan._id,
      installmentNumber: s.month,
      dueDate: s.dueDate,
      principal: s.principal,
      interest: s.interest,
      emi: s.emi,
      paidAmount: isPastDue ? s.emi : 0,
      remainingPrincipal: s.remainingPrincipal,
      status: instStatus,
      paidAt: isPastDue ? s.dueDate : undefined,
      recordedBy: isPastDue ? adminUserId : undefined
    });

    // If past due, inject accounting income
    if (isPastDue) {
      const pRef = await generateRefId('RUN-P');
      await Transaction.create({
        referenceId: pRef,
        groupId,
        type: 'INCOME',
        category: 'LOAN_REPAYMENT_PRINCIPAL',
        amount: s.principal,
        memberId,
        loanId: loan._id,
        description: `Running Loan EMI #${s.month} Principal (${pRef})`,
        date: s.dueDate,
        createdBy: adminUserId
      });

      const iRef = await generateRefId('RUN-I');
      await Transaction.create({
        referenceId: iRef,
        groupId,
        type: 'INCOME',
        category: 'LOAN_INTEREST',
        amount: s.interest,
        memberId,
        loanId: loan._id,
        description: `Running Loan EMI #${s.month} Interest (${iRef})`,
        date: s.dueDate,
        createdBy: adminUserId
      });
    }
  }

  return loan;
};
