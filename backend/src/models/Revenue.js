import mongoose from 'mongoose';

const revenueSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  amount: { type: Number, required: true }, // in paise
  source: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
}, {
  timestamps: true
});

export const Revenue = mongoose.model('Revenue', revenueSchema);
