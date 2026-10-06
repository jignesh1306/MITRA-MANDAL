/**
 * DUPLICATE TRANSACTION CLEANUP SCRIPT
 * =====================================
 * Fixes the double-entry bug where loan installment payments
 * (EMI-I-XXXXXX LOAN_INTEREST + EMI-P-XXXXXX LOAN_REPAYMENT_PRINCIPAL)
 * were recorded twice for the same installment.
 *
 * Run once: node src/utils/cleanDuplicateTransactions.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { Transaction } from '../models/Transaction.js';

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  let totalDuplicatesRemoved = 0;

  // Find all PAID installments
  const paidInstallments = await LoanInstallment.find({ status: 'PAID' }).lean();
  console.log(`Checking ${paidInstallments.length} paid installments for duplicate transactions...\n`);

  for (const inst of paidInstallments) {
    const loanId = inst.loanId;
    const instNum = inst.installmentNumber;

    // Find all LOAN_INTEREST transactions for this installment
    const interestTxs = await Transaction.find({
      loanId,
      category: 'LOAN_INTEREST',
      description: { $regex: `#${instNum}` }
    }).sort({ createdAt: 1 });

    // Find all LOAN_REPAYMENT_PRINCIPAL transactions for this installment
    const principalTxs = await Transaction.find({
      loanId,
      category: 'LOAN_REPAYMENT_PRINCIPAL',
      description: { $regex: `#${instNum}` }
    }).sort({ createdAt: 1 });

    const hasDuplicateInterest = interestTxs.length > 1;
    const hasDuplicatePrincipal = principalTxs.length > 1;

    if (hasDuplicateInterest || hasDuplicatePrincipal) {
      console.log(`⚠️  Loan Installment #${instNum} (loanId: ${loanId}) has duplicates:`);

      if (hasDuplicateInterest) {
        // Keep first (oldest), delete the rest
        const toDelete = interestTxs.slice(1);
        for (const tx of toDelete) {
          console.log(`   ❌ Deleting duplicate INTEREST tx: ${tx.referenceId} (₹${tx.amount / 100})`);
          await Transaction.findByIdAndDelete(tx._id);
          totalDuplicatesRemoved++;
        }
      }

      if (hasDuplicatePrincipal) {
        const toDelete = principalTxs.slice(1);
        for (const tx of toDelete) {
          console.log(`   ❌ Deleting duplicate PRINCIPAL tx: ${tx.referenceId} (₹${tx.amount / 100})`);
          await Transaction.findByIdAndDelete(tx._id);
          totalDuplicatesRemoved++;
        }
      }
    }
  }

  console.log(`\n✅ Done! Removed ${totalDuplicatesRemoved} duplicate transaction(s).`);

  if (totalDuplicatesRemoved === 0) {
    console.log('   No duplicates found — database is clean.');
  }

  process.exit(0);
};

run().catch(err => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
