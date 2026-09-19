import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  principal: { type: Number, required: true }, // in paise
  months: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // % per month e.g. 1.0
  interestType: { type: String, enum: ['REDUCING', 'FLAT'], default: 'REDUCING' },
  totalInterest: { type: Number, required: true }, // in paise
  totalRepayment: { type: Number, required: true }, // in paise
  startDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED'], default: 'PENDING' },
  purpose: { type: String, default: '' },
  note: { type: String, default: '' },
  transferProofUrl: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  completedAt: { type: Date },
  isHistorical: { type: Boolean, default: false },
  historicalType: { type: String, enum: ['COMPLETED', 'RUNNING', 'NONE'], default: 'NONE' }
}, {
  timestamps: true
});

loanSchema.index({ memberId: 1, status: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdAt: -1 });

export const Loan = mongoose.model('Loan', loanSchema);
