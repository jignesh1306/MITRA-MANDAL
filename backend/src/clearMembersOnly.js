import mongoose from 'mongoose';
import { User } from './models/User.js';
import { GroupMember } from './models/GroupMember.js';
import { Loan } from './models/Loan.js';
import { LoanInstallment } from './models/LoanInstallment.js';
import { LoanRequest } from './models/LoanRequest.js';
import { Transaction } from './models/Transaction.js';

async function removeAllMembersOnly() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mitra-mandal');
    console.log('Connected to MongoDB');

    // Find all member IDs (excluding ADMIN)
    const memberUsers = await User.find({ role: 'MEMBER' });
    const memberIds = memberUsers.map(u => u._id);

    console.log('Found member accounts to remove:', memberUsers.length);

    // Delete associated records for member users
    const delUsers = await User.deleteMany({ role: 'MEMBER' });
    const delGroupMembers = await GroupMember.deleteMany({ userId: { $in: memberIds } });
    const delLoans = await Loan.deleteMany({ memberId: { $in: memberIds } });
    
    const remainingLoanIds = (await Loan.find({}, '_id')).map(l => l._id);
    const delInstallments = await LoanInstallment.deleteMany({ loanId: { $nin: remainingLoanIds } });
    const delLoanRequests = await LoanRequest.deleteMany({ memberId: { $in: memberIds } });
    const delTransactions = await Transaction.deleteMany({ memberId: { $in: memberIds } });

    console.log('Deleted MEMBER users:', delUsers.deletedCount);
    console.log('Deleted GroupMember records:', delGroupMembers.deletedCount);
    console.log('Deleted Loan records:', delLoans.deletedCount);
    console.log('Deleted LoanInstallment records:', delInstallments.deletedCount);
    console.log('Deleted LoanRequest records:', delLoanRequests.deletedCount);
    console.log('Deleted Transaction records:', delTransactions.deletedCount);

    // List remaining admin users
    const adminUsers = await User.find({ role: 'ADMIN' });
    console.log('Remaining ADMIN accounts:');
    adminUsers.forEach(a => console.log(` - ${a.name} (${a.phone}) [Role: ${a.role}]`));

    process.exit(0);
  } catch (err) {
    console.error('Error removing members:', err);
    process.exit(1);
  }
}

removeAllMembersOnly();
