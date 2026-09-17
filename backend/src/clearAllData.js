import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './models/User.js';
import { Group } from './models/Group.js';
import { GroupMember } from './models/GroupMember.js';
import { Contribution } from './models/Contribution.js';
import { Loan } from './models/Loan.js';
import { LoanRequest } from './models/LoanRequest.js';
import { LoanInstallment } from './models/LoanInstallment.js';
import { Transaction } from './models/Transaction.js';
import { Expense } from './models/Expense.js';
import { Revenue } from './models/Revenue.js';
import { Notification } from './models/Notification.js';
import { AuditLog } from './models/AuditLog.js';
import { EMISubmission } from './models/EMISubmission.js';
import { PushSubscription } from './models/PushSubscription.js';

const purgeCollections = async () => {
  console.log('Purging all database collections...');
  await User.deleteMany({});
  await GroupMember.deleteMany({});
  await Contribution.deleteMany({});
  await Loan.deleteMany({});
  await LoanRequest.deleteMany({});
  await LoanInstallment.deleteMany({});
  await Transaction.deleteMany({});
  await Expense.deleteMany({});
  await Revenue.deleteMany({});
  await Notification.deleteMany({});
  await AuditLog.deleteMany({});
  await EMISubmission.deleteMany({});
  await PushSubscription.deleteMany({});
  await Group.deleteMany({});

  const freshGroup = await Group.create({
    name: 'Mitra-Mandal (મિત્ર-મંડળ)',
    description: 'Simple and transparent group fund, savings, loan, and EMI management.',
    monthlyContribution: 200000, // ₹2,000 in paise
    defaultInterestRate: 1.0,
    interestType: 'REDUCING',
    maxActiveLoansPerMember: 1,
    passwordResetCode: Math.floor(100000 + Math.random() * 900000).toString()
  });

  console.log('----------------------------------------------------');
  console.log('ALL MEMBERS, ADMINS, LOANS & TRANSACTIONS CLEARED!');
  console.log('Fresh Group created with Secret Reset Code:', freshGroup.passwordResetCode);
  console.log('Database is now completely clean and ready for new users.');
  console.log('----------------------------------------------------');
};

const clearAllData = async () => {
  try {
    const localUri = 'mongodb://127.0.0.1:27017/mitra-mandal';
    const primaryUri = process.env.MONGODB_URI || localUri;

    try {
      console.log('Connecting to primary MongoDB...');
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to Primary MongoDB.');
      await purgeCollections();
      process.exit(0);
    } catch (primaryErr) {
      console.warn('Primary MongoDB connection failed. Falling back to local MongoDB...');
      await mongoose.connect(localUri);
      console.log('Connected to Local MongoDB.');
      await purgeCollections();
      process.exit(0);
    }
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearAllData();
