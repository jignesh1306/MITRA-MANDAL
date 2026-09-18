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

    // Notify Admins in simple English
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        title: 'EMI Submission',
        message: `${req.user.name} sent payment proof of ₹${(totalAmountPaise / 100).toLocaleString('en-IN')} for check.`,
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
        referenceId: refId,
        createdBy: req.user._id
      });
    }

    // 2. If Loan Principal or Loan Interest included, update Loan & Installments with split accounting
    if ((submission.includeLoanPrincipal && submission.loanPrincipalAmount > 0) || 
        (submission.includeLoanInterest && submission.loanInterestAmount > 0)) {
      
      let loan = null;
      if (submission.loanId) {
        loan = await Loan.findById(submission.loanId);
      } else {
        loan = await Loan.findOne({ memberId: submission.memberId, status: 'ACTIVE' });
      }

      if (loan) {
        // Find next unpaid or partially paid installment
        const nextInst = await LoanInstallment.findOne({ 
          loanId: loan._id, 
          status: { $in: ['DUE', 'UPCOMING', 'PARTIALLY_PAID', 'OVERDUE'] } 
        }).sort({ installmentNumber: 1 });

        if (nextInst) {
          if (submission.includeLoanPrincipal && submission.loanPrincipalAmount > 0) {
            nextInst.paidPrincipal = (nextInst.paidPrincipal || 0) + submission.loanPrincipalAmount;
          }
          if (submission.includeLoanInterest && submission.loanInterestAmount > 0) {
            nextInst.paidInterest = (nextInst.paidInterest || 0) + submission.loanInterestAmount;
          }

          nextInst.paidAmount = (nextInst.paidPrincipal || 0) + (nextInst.paidInterest || 0);
          const isFullyPaid = (nextInst.paidPrincipal >= nextInst.principal) && (nextInst.paidInterest >= nextInst.interest);
          nextInst.status = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';
          if (isFullyPaid) {
            nextInst.paidAt = new Date();
          }
          nextInst.recordedBy = req.user._id;
          await nextInst.save();
        }

        // Separate Accounting Transaction 1: LOAN_REPAYMENT_PRINCIPAL
        if (submission.includeLoanPrincipal && submission.loanPrincipalAmount > 0) {
          const refIdPrincipal = await generateRefId('EMI-P');
          await Transaction.create({
            groupId: submission.groupId,
            memberId: submission.memberId,
            loanId: loan._id,
            type: 'INCOME',
            category: 'LOAN_REPAYMENT_PRINCIPAL',
            amount: submission.loanPrincipalAmount,
            description: `Loan Principal Repayment for Month ${submission.month}/${submission.year}`,
            date: new Date(),
            referenceId: refIdPrincipal,
            createdBy: req.user._id
          });
        }

        // Separate Accounting Transaction 2: LOAN_INTEREST
        if (submission.includeLoanInterest && submission.loanInterestAmount > 0) {
          const refIdInterest = await generateRefId('EMI-I');
          await Transaction.create({
            groupId: submission.groupId,
            memberId: submission.memberId,
            loanId: loan._id,
            type: 'INCOME',
            category: 'LOAN_INTEREST',
            amount: submission.loanInterestAmount,
            description: `Loan Interest Income for Month ${submission.month}/${submission.year}`,
            date: new Date(),
            referenceId: refIdInterest,
            createdBy: req.user._id
          });
        }

        // Check if all installments for this loan are fully paid
        const unpaidCount = await LoanInstallment.countDocuments({ loanId: loan._id, status: { $ne: 'PAID' } });
        if (unpaidCount === 0) {
          loan.status = 'COMPLETED';
          loan.completedAt = new Date();
          await loan.save();
        }
      }
    }

    // 3. Mark submission APPROVED
    submission.status = 'APPROVED';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    // 4. Notify member in simple English
    await createNotification({
      userId: submission.memberId,
      title: 'EMI Approved',
      message: `Your EMI payment of ₹${(submission.totalAmount / 100).toLocaleString('en-IN')} was approved by Admin.`,
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
    submission.rejectionReason = reason || 'Payment proof was not clear.';
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    // Notify member in simple English
    await createNotification({
      userId: submission.memberId,
      title: 'EMI Rejected',
      message: `Your EMI payment of ₹${(submission.totalAmount / 100).toLocaleString('en-IN')} was rejected. Reason: ${submission.rejectionReason}`,
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
