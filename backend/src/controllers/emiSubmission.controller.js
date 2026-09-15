import cloudinary from '../config/cloudinary.js';
import { EMISubmission } from '../models/EMISubmission.js';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { Contribution } from '../models/Contribution.js';
import { Loan } from '../models/Loan.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { Transaction } from '../models/Transaction.js';
import { createNotification } from '../services/notification.service.js';
import { generateRefId } from '../services/refId.service.js';
import { getFundSummary } from '../services/fund.service.js';

export const createSubmission = async (req, res, next) => {
  try {
    const { 
      month, 
      year, 
      includeRegularEMI, 
      regularAmount, 
      includeLoanPrincipal, 
      loanPrincipalAmount, 
      includeLoanInterest, 
      loanInterestAmount, 
      loanId,
      note 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot proof image is required.' });
    }

    const group = await Group.findOne();
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Upload file buffer to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const uploadRes = await cloudinary.uploader.upload(dataURI, {
      folder: 'mitra_mandal_proofs',
      resource_type: 'image'
    });

    const incReg = includeRegularEMI === 'true' || includeRegularEMI === true;
    const incP = includeLoanPrincipal === 'true' || includeLoanPrincipal === true;
    const incI = includeLoanInterest === 'true' || includeLoanInterest === true;

    const regPaise = incReg ? Math.round(Number(regularAmount || 0) * 100) : 0;
    const pPaise = incP ? Math.round(Number(loanPrincipalAmount || 0) * 100) : 0;
    const iPaise = incI ? Math.round(Number(loanInterestAmount || 0) * 100) : 0;

    const totalAmountPaise = regPaise + pPaise + iPaise;
    if (totalAmountPaise <= 0) {
      return res.status(400).json({ message: 'Total submitted payment amount must be greater than 0.' });
    }

    const submission = await EMISubmission.create({
      memberId: req.user._id,
      groupId: group._id,
      month: Number(month) || (new Date().getMonth() + 1),
      year: Number(year) || new Date().getFullYear(),
      includeRegularEMI: incReg,
      regularAmount: regPaise,
      includeLoanPrincipal: incP,
      loanPrincipalAmount: pPaise,
      includeLoanInterest: incI,
      loanInterestAmount: iPaise,
      loanId: loanId || undefined,
      totalAmount: totalAmountPaise,
      proofImageUrl: uploadRes.secure_url,
      proofImagePublicId: uploadRes.public_id,
      note: note || '',
      status: 'PENDING'
    });

    // Notify Admins
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        title: 'New EMI Payment Submission',
        message: `${req.user.name} submitted a new EMI payment proof of ₹${(totalAmountPaise / 100).toLocaleString('en-IN')} for review.`,
        type: 'SYSTEM'
      });
    }

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

export const getSubmissions = async (req, res, next) => {
  try {
    const { status, memberId } = req.query;
    const query = {};

    if (req.user.role !== 'ADMIN') {
      query.memberId = req.user._id;
    } else if (memberId) {
      query.memberId = memberId;
    }

    if (status) query.status = status;

    const submissions = await EMISubmission.find(query)
      .populate('memberId', 'name email phone profilePhoto')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

export const approveSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await EMISubmission.findById(id);

    if (!submission) return res.status(404).json({ message: 'EMI Submission request not found.' });
    if (submission.status !== 'PENDING') {
      return res.status(400).json({ message: `Submission is already ${submission.status}.` });
    }

    const group = await Group.findById(submission.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // 1. If Regular Fund EMI included, update/create Contribution as PAID
    if (submission.includeRegularEMI && submission.regularAmount > 0) {
      let contrib = await Contribution.findOne({
        groupId: submission.groupId,
        memberId: submission.memberId,
        month: submission.month,
        year: submission.year
      });

      const refId = await generateRefId('CON');

      if (contrib) {
        contrib.status = 'PAID';
        contrib.amount = submission.regularAmount;
        contrib.paidAt = new Date();
        contrib.referenceId = refId;
        await contrib.save();
      } else {
        await Contribution.create({
          groupId: submission.groupId,
          memberId: submission.memberId,
          month: submission.month,
          year: submission.year,
          amount: submission.regularAmount,
          status: 'PAID',
          paidAt: new Date(),
          referenceId: refId
        });
      }

      await Transaction.create({
        groupId: submission.groupId,
        memberId: submission.memberId,
        type: 'INCOME',
        category: 'CONTRIBUTION',
        amount: submission.regularAmount,
        description: `Monthly Fund Contribution for ${submission.month}/${submission.year}`,
        date: new Date(),
        referenceId: refId
      });
    }

    // 2. If Loan Principal or Loan Interest included, update Loan & Installments
    if ((submission.includeLoanPrincipal && submission.loanPrincipalAmount > 0) || 
        (submission.includeLoanInterest && submission.loanInterestAmount > 0)) {
      
      let loan = null;
      if (submission.loanId) {
        loan = await Loan.findById(submission.loanId);
      } else {
        loan = await Loan.findOne({ memberId: submission.memberId, status: 'ACTIVE' });
      }

      if (loan) {
        const installments = await LoanInstallment.find({ loanId: loan._id, status: 'PENDING' })
          .sort({ installmentNumber: 1 });

        let pRem = submission.loanPrincipalAmount;
        let iRem = submission.loanInterestAmount;

        for (const inst of installments) {
          if (pRem <= 0 && iRem <= 0) break;
          inst.status = 'PAID';
          inst.paidAt = new Date();
          await inst.save();
        }

        const refIdLoan = await generateRefId('LOAN_EMI');
        await Transaction.create({
          groupId: submission.groupId,
          memberId: submission.memberId,
          type: 'INCOME',
          category: 'LOAN_REPAYMENT',
          amount: (pRem || 0) + (iRem || 0) || (submission.loanPrincipalAmount + submission.loanInterestAmount),
          description: `Loan Repayment (Principal: ₹${(submission.loanPrincipalAmount/100).toLocaleString('en-IN')}, Interest: ₹${(submission.loanInterestAmount/100).toLocaleString('en-IN')})`,
          date: new Date(),
          referenceId: refIdLoan
        });

        // Check if all installments paid
        const pendingInst = await LoanInstallment.findOne({ loanId: loan._id, status: 'PENDING' });
        if (!pendingInst) {
          loan.status = 'COMPLETED';
          await loan.save();
        }
      }
    }

    // 3. Mark submission APPROVED
    submission.status = 'APPROVED';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    // 4. Notify member
    await createNotification({
      userId: submission.memberId,
      title: 'EMI Payment Approved',
      message: `Your EMI payment submission of ₹${(submission.totalAmount / 100).toLocaleString('en-IN')} for ${submission.month}/${submission.year} has been approved by Admin.`,
      type: 'SYSTEM'
    });

    // 5. Delete image from Cloudinary permanently to save cloud storage
    if (submission.proofImagePublicId) {
      try {
        await cloudinary.uploader.destroy(submission.proofImagePublicId);
        console.log(`Cloudinary image ${submission.proofImagePublicId} deleted successfully after payment approval.`);
      } catch (cloudErr) {
        console.warn('Failed to delete Cloudinary proof image:', cloudErr);
      }
    }

    res.json({ message: 'EMI Submission approved successfully.', submission });
  } catch (error) {
    next(error);
  }
};

export const rejectSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const submission = await EMISubmission.findById(id);
    if (!submission) return res.status(404).json({ message: 'EMI Submission request not found.' });

    if (submission.status !== 'PENDING') {
      return res.status(400).json({ message: `Submission is already ${submission.status}.` });
    }

    submission.status = 'REJECTED';
    submission.rejectionReason = reason || 'Payment screenshot invalid or payment not received.';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    // Notify member
    await createNotification({
      userId: submission.memberId,
      title: 'EMI Payment Rejected',
      message: `Your EMI payment submission of ₹${(submission.totalAmount / 100).toLocaleString('en-IN')} was rejected by Admin. Reason: ${submission.rejectionReason}`,
      type: 'SYSTEM'
    });

    // Delete image from Cloudinary permanently
    if (submission.proofImagePublicId) {
      try {
        await cloudinary.uploader.destroy(submission.proofImagePublicId);
        console.log(`Cloudinary image ${submission.proofImagePublicId} deleted after rejection.`);
      } catch (cloudErr) {
        console.warn('Failed to delete Cloudinary proof image:', cloudErr);
      }
    }

    res.json({ message: 'EMI Submission rejected.', submission });
  } catch (error) {
    next(error);
  }
};
