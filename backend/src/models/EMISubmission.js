import mongoose from 'mongoose';

const emiSubmissionSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },

  includeRegularEMI: { type: Boolean, default: true },
  regularAmount: { type: Number, default: 0 }, // in paise

  includeLoanPrincipal: { type: Boolean, default: false },
  loanPrincipalAmount: { type: Number, default: 0 }, // in paise

  includeLoanInterest: { type: Boolean, default: false },
  loanInterestAmount: { type: Number, default: 0 }, // in paise

  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: false },

  totalAmount: { type: Number, required: true }, // in paise

  proofImageUrl: { type: String, required: true },
  proofImagePublicId: { type: String, required: true },

  note: { type: String, default: '' },

  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  rejectionReason: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, {
  timestamps: true
});

export const EMISubmission = mongoose.model('EMISubmission', emiSubmissionSchema);
