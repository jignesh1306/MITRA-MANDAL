import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';
import { Contribution } from '../models/Contribution.js';
import { Loan } from '../models/Loan.js';
import { LoanInstallment } from '../models/LoanInstallment.js';
import { Transaction } from '../models/Transaction.js';
import { Expense } from '../models/Expense.js';
import { Revenue } from '../models/Revenue.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { calculateLoanSchedule } from '../services/loanCalculator.service.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mitra-mandal');
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Group.deleteMany({});
    await GroupMember.deleteMany({});
    await Contribution.deleteMany({});
    await Loan.deleteMany({});
    await LoanInstallment.deleteMany({});
    await Transaction.deleteMany({});
    await Expense.deleteMany({});
    await Revenue.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Cleared existing data.');

    const group = await Group.create({
      name: 'Mitra-Mandal (મિત્ર-મંડળ)',
      description: 'Simple and transparent group fund, savings, loan, and EMI management.',
      monthlyContribution: 200000, // ₹2,000 in paise
      defaultInterestRate: 1.0,
      interestType: 'REDUCING'
    });

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('adminpassword', salt);
    const memberPasswordHash = await bcrypt.hash('memberpassword', salt);

    const adminUser = await User.create({
      name: 'Rajesh Patel (Admin)',
      email: 'admin@mitramandal.com',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    await GroupMember.create({ groupId: group._id, userId: adminUser._id });

    const memberNames = [
      'Rahul Sharma', 'Jignes Joshi', 'Sanjay Makwana', 'Amit Chauhan', 'Prakash Patel',
      'Keyur Shah', 'Vishal Desai', 'Mahesh Vyas', 'Harshil Parekh', 'Nirav Trivedi',
      'Bhavin Soni', 'Chetan Mehta', 'Dharmesh Thakkar', 'Alpesh Parmar'
    ];

    const users = [adminUser];
    for (let i = 0; i < memberNames.length; i++) {
      const u = await User.create({
        name: memberNames[i],
        email: `member${i + 1}@mitramandal.com`,
        phone: `98765432${(11 + i).toString().padStart(2, '0')}`,
        passwordHash: memberPasswordHash,
        role: 'MEMBER',
        status: 'ACTIVE'
      });
      await GroupMember.create({ groupId: group._id, userId: u._id });
      users.push(u);
    }

    console.log(`Created 15 members.`);

    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    let txCounter = 1;
    for (const u of users) {
      const refId = `CON-${(txCounter++).toString().padStart(6, '0')}`;
      const isPaid = u.role === 'ADMIN' || Math.random() > 0.2;

      let tx = null;
      if (isPaid) {
        tx = await Transaction.create({
          referenceId: refId,
          groupId: group._id,
          type: 'INCOME',
          category: 'MEMBER_CONTRIBUTION',
          amount: 200000,
          memberId: u._id,
          description: `Monthly Contribution (${curMonth}/${curYear}) - ${u.name}`,
          date: new Date(),
          createdBy: adminUser._id
        });
      }

      await Contribution.create({
        groupId: group._id,
        memberId: u._id,
        month: curMonth,
        year: curYear,
        amount: 200000,
        status: isPaid ? 'PAID' : 'PENDING',
        paidAt: isPaid ? new Date() : null,
        recordedBy: isPaid ? adminUser._id : null,
        transactionId: tx?._id
      });
    }

    const revRef = `INC-${(txCounter++).toString().padStart(6, '0')}`;
    const revTx = await Transaction.create({
      referenceId: revRef,
      groupId: group._id,
      type: 'INCOME',
      category: 'OTHER_REVENUE',
      amount: 300000,
      description: 'Group investment interest income',
      date: new Date(),
      createdBy: adminUser._id
    });
    await Revenue.create({
      groupId: group._id,
      amount: 300000,
      source: 'Investment Return',
      description: 'Group investment interest income',
      createdBy: adminUser._id,
      transactionId: revTx._id
    });

    const expRef = `EXP-${(txCounter++).toString().padStart(6, '0')}`;
    const expTx = await Transaction.create({
      referenceId: expRef,
      groupId: group._id,
      type: 'EXPENSE',
      category: 'GROUP_EXPENSE',
      amount: 100000,
      description: 'Monthly Group Meeting Refreshment',
      date: new Date(),
      createdBy: adminUser._id
    });
    await Expense.create({
      groupId: group._id,
      amount: 100000,
      category: 'Meeting',
      description: 'Monthly Group Meeting Refreshment',
      createdBy: adminUser._id,
      transactionId: expTx._id
    });

    const borrower = users[1]; // Rahul Sharma
    const calc = calculateLoanSchedule({
      principal: 5000000,
      months: 10,
      monthlyInterestRate: 1.0,
      interestType: 'REDUCING'
    });

    const loanRef = `LN-${(txCounter++).toString().padStart(6, '0')}`;
    await Transaction.create({
      referenceId: loanRef,
      groupId: group._id,
      type: 'EXPENSE',
      category: 'LOAN_DISBURSEMENT',
      amount: 5000000,
      memberId: borrower._id,
      description: `Loan Disbursement to ${borrower.name}`,
      date: new Date(),
      createdBy: adminUser._id
    });

    const loan = await Loan.create({
      groupId: group._id,
      memberId: borrower._id,
      principal: calc.principal,
      months: calc.months,
      interestRate: calc.interestRate,
      interestType: calc.interestType,
      totalInterest: calc.totalInterest,
      totalRepayment: calc.totalRepayment,
      startDate: new Date(),
      status: 'ACTIVE',
      purpose: 'Emergency medical expenses',
      approvedBy: adminUser._id,
      approvedAt: new Date()
    });

    for (let i = 0; i < calc.schedule.length; i++) {
      const s = calc.schedule[i];
      const isFirstPaid = i === 0;

      let instTx = null;
      if (isFirstPaid) {
        const emiPRef = `EMI-P-${(txCounter++).toString().padStart(6, '0')}`;
        instTx = await Transaction.create({
          referenceId: emiPRef,
          groupId: group._id,
          type: 'INCOME',
          category: 'LOAN_REPAYMENT_PRINCIPAL',
          amount: s.principal,
          memberId: borrower._id,
          loanId: loan._id,
          description: `EMI #1 Principal Repayment - ${borrower.name}`,
          date: new Date(),
          createdBy: adminUser._id
        });

        const emiIRef = `EMI-I-${(txCounter++).toString().padStart(6, '0')}`;
        await Transaction.create({
          referenceId: emiIRef,
          groupId: group._id,
          type: 'INCOME',
          category: 'LOAN_INTEREST',
          amount: s.interest,
          memberId: borrower._id,
          loanId: loan._id,
          description: `EMI #1 Interest Income - ${borrower.name}`,
          date: new Date(),
          createdBy: adminUser._id
        });
      }

      await LoanInstallment.create({
        loanId: loan._id,
        installmentNumber: s.month,
        dueDate: s.dueDate,
        principal: s.principal,
        interest: s.interest,
        emi: s.emi,
        paidAmount: isFirstPaid ? s.emi : 0,
        remainingPrincipal: s.remainingPrincipal,
        status: isFirstPaid ? 'PAID' : (i === 1 ? 'DUE' : 'UPCOMING'),
        paidAt: isFirstPaid ? new Date() : null,
        recordedBy: isFirstPaid ? adminUser._id : null,
        transactionId: instTx?._id
      });
    }

    await Notification.create({
      userId: borrower._id,
      groupId: group._id,
      type: 'LOAN_APPROVED',
      title: 'Loan Approved',
      message: 'Your loan request of ₹50,000 has been approved.'
    });

    await AuditLog.create({
      groupId: group._id,
      userId: adminUser._id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'Group',
      entityId: group._id.toString(),
      newValue: { name: group.name, membersCount: 15 }
    });

    console.log('Seeding completed successfully!');
    console.log('Admin Account: admin@mitramandal.com / adminpassword');
    console.log('Member Account: member1@mitramandal.com / memberpassword');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
