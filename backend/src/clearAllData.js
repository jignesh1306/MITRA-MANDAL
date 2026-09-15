import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../src/models/User.js';
import { Group } from '../src/models/Group.js';
import { GroupMember } from '../src/models/GroupMember.js';
import { Contribution } from '../src/models/Contribution.js';
import { Loan } from '../src/models/Loan.js';
import { LoanInstallment } from '../src/models/LoanInstallment.js';
import { Transaction } from '../src/models/Transaction.js';
import { Expense } from '../src/models/Expense.js';
import { Revenue } from '../src/models/Revenue.js';
import { Notification } from '../src/models/Notification.js';
import { AuditLog } from '../src/models/AuditLog.js';

const clearAllData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mitra-mandal');
    console.log('Connected to MongoDB. Clearing database...');

    await User.deleteMany({});
    await GroupMember.deleteMany({});
    await Contribution.deleteMany({});
    await Loan.deleteMany({});
    await LoanInstallment.deleteMany({});
    await Transaction.deleteMany({});
    await Expense.deleteMany({});
    await Revenue.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    // Ensure initial group exists
    let group = await Group.findOne();
    if (!group) {
      await Group.create({
        name: 'Mitra-Mandal (મિત્ર-મંડળ)',
        description: 'Simple and transparent group fund, savings, loan, and EMI management.',
        monthlyContribution: 200000,
        defaultInterestRate: 1.0,
        interestType: 'REDUCING'
      });
    }

    console.log('ALL MEMBERS, ADMINS, AND DATA CLEARED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
};

clearAllData();
