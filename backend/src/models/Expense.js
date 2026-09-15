import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  amount: { type: Number, required: true }, // in paise
  category: { type: String, enum: ['Meeting', 'Food', 'Event', 'Bank charges', 'Other'], default: 'Other' },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  receipt: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
}, {
  timestamps: true
});

export const Expense = mongoose.model('Expense', expenseSchema);
