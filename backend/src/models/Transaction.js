import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  referenceId: { type: String, required: true, unique: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  category: { 
    type: String, 
    enum: [
      'MEMBER_CONTRIBUTION', 
      'CONTRIBUTION',
      'LOAN_DISBURSEMENT', 
      'LOAN_REPAYMENT_PRINCIPAL', 
      'LOAN_INTEREST', 
      'LOAN_REPAYMENT',
      'GROUP_EXPENSE', 
      'OTHER_REVENUE', 
      'FINE'
    ], 
    required: true 
  },
  amount: { type: Number, required: true }, // in paise
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, {
  timestamps: true
});

transactionSchema.index({ groupId: 1, date: -1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ memberId: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
