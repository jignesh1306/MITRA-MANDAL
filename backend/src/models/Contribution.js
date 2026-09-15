import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },  // e.g. 2026
  amount: { type: Number, required: true }, // in paise
  status: { type: String, enum: ['PAID', 'PENDING', 'OVERDUE'], default: 'PENDING' },
  paidAt: { type: Date },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
}, {
  timestamps: true
});

contributionSchema.index({ groupId: 1, memberId: 1, month: 1, year: 1 }, { unique: true });

export const Contribution = mongoose.model('Contribution', contributionSchema);
