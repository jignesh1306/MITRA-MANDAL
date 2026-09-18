import mongoose from 'mongoose';

const loanInstallmentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  installmentNumber: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  principal: { type: Number, required: true }, // in paise
  interest: { type: Number, required: true },  // in paise
  emi: { type: Number, required: true },       // in paise (principal + interest)
  paidAmount: { type: Number, default: 0 },    // in paise
  paidPrincipal: { type: Number, default: 0 }, // in paise
  paidInterest: { type: Number, default: 0 },  // in paise
  remainingPrincipal: { type: Number, required: true }, // remaining loan principal after this installment in paise
  status: { type: String, enum: ['UPCOMING', 'DUE', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'], default: 'UPCOMING' },
  paidAt: { type: Date },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
}, {
  timestamps: true
});

loanInstallmentSchema.index({ loanId: 1, installmentNumber: 1 }, { unique: true });

export const LoanInstallment = mongoose.model('LoanInstallment', loanInstallmentSchema);
