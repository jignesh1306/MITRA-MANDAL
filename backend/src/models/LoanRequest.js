import mongoose from 'mongoose';

const loanRequestSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // in paise
  months: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  interestType: { type: String, enum: ['REDUCING', 'FLAT'], default: 'REDUCING' },
  purpose: { type: String, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], default: 'PENDING' },
  transferProofUrl: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String, default: '' }
}, {
  timestamps: true
});

export const LoanRequest = mongoose.model('LoanRequest', loanRequestSchema);
