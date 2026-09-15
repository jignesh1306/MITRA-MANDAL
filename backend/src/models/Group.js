import mongoose from 'mongoose';

export const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Mitra-Mandal (મિત્ર-મંડળ)' },
  description: { type: String, default: 'Simple and transparent group fund, savings, loan, and EMI management.' },
  monthlyContribution: { type: Number, required: true, default: 200000 }, // in paise (₹2,000)
  contributionStartDay: { type: Number, default: 1 },
  contributionEndDay: { type: Number, default: 5 },
  defaultInterestRate: { type: Number, default: 1.0 }, // 1%
  interestType: { type: String, enum: ['REDUCING', 'FLAT'], default: 'REDUCING' },
  maxActiveLoansPerMember: { type: Number, default: 1 },
  minLoanAmount: { type: Number, default: 500000 }, // ₹5,000 in paise
  maxLoanAmount: { type: Number, default: 5000000 }, // ₹50,000 in paise
  maxLoanDurationMonths: { type: Number, default: 24 },
  currency: { type: String, default: 'INR' },
  passwordResetCode: { type: String, default: generate6DigitCode }
}, {
  timestamps: true
});

export const Group = mongoose.model('Group', groupSchema);
