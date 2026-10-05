import { Contribution } from '../models/Contribution.js';
import { GroupMember } from '../models/GroupMember.js';
import { Group } from '../models/Group.js';
import { Transaction } from '../models/Transaction.js';
import { generateRefId } from './refId.service.js';
import { createAuditLog } from './audit.service.js';

export const generateMonthlyContributions = async (groupId, month, year) => {
  const group = await Group.findById(groupId).lean();
  if (!group) throw new Error('Group not found');

  const members = await GroupMember.find({ groupId, status: 'ACTIVE' }).populate('userId', 'role').lean();
  const eligibleMembers = members.filter(m => m.userId && m.userId.role !== 'ADMIN');

  const existingCount = await Contribution.countDocuments({ groupId, month, year });
  if (existingCount >= eligibleMembers.length && eligibleMembers.length > 0) {
    return []; // Already fully generated, return immediately
  }

  const existingContribs = await Contribution.find({ groupId, month, year }).select('memberId').lean();
  const existingMemberIds = new Set(existingContribs.map(c => c.memberId.toString()));

  const toInsert = [];
  for (const m of eligibleMembers) {
    const memId = m.userId._id.toString();
    if (!existingMemberIds.has(memId)) {
      toInsert.push({
        groupId,
        memberId: m.userId._id,
        month,
        year,
        amount: group.monthlyContribution || 200000,
        status: 'PENDING'
      });
    }
  }

  if (toInsert.length > 0) {
    try {
      return await Contribution.insertMany(toInsert, { ordered: false });
    } catch (err) {
      if (err.code !== 11000) throw err;
      return [];
    }
  }
  return [];
};

export const markContributionPaid = async (contributionId, adminUserId) => {
  // Use findOneAndUpdate for atomic operation to prevent double-clicks creating duplicate transactions
  const contrib = await Contribution.findOneAndUpdate(
    { _id: contributionId, status: 'PENDING' },
    { $set: { status: 'PROCESSING_PAYMENT' } }, // Temporary state to lock it
    { new: true }
  ).populate('memberId', 'name email');

  if (!contrib) {
    const checkContrib = await Contribution.findById(contributionId);
    if (!checkContrib) throw new Error('Contribution record not found');
    if (checkContrib.status === 'PAID') throw new Error('Contribution is already paid');
    if (checkContrib.status === 'PROCESSING_PAYMENT') throw new Error('Contribution payment is already being processed');
    throw new Error('Could not process contribution');
  }

  try {
    const refId = await generateRefId('CON');
    
    const transaction = await Transaction.create({
      referenceId: refId,
      groupId: contrib.groupId,
      type: 'INCOME',
      category: 'MEMBER_CONTRIBUTION',
      amount: contrib.amount,
      memberId: contrib.memberId._id || contrib.memberId,
      description: `${contrib.memberId.name || 'Member'} - Monthly Contribution (${contrib.month}/${contrib.year})`,
      date: new Date(),
      createdBy: adminUserId
    });

    // Now securely mark it as PAID
    contrib.status = 'PAID';
    contrib.paidAt = new Date();
    contrib.recordedBy = adminUserId;
    contrib.transactionId = transaction._id;
    await contrib.save();

    await createAuditLog({
      groupId: contrib.groupId,
      userId: adminUserId,
      action: 'CONTRIBUTION_MARKED_PAID',
      entityType: 'Contribution',
      entityId: contrib._id.toString(),
      newValue: { status: 'PAID', paidAt: contrib.paidAt, transactionId: transaction._id }
    });

    return { contribution: contrib, transaction };
  } catch (error) {
    // Revert status if something failed
    await Contribution.updateOne({ _id: contributionId }, { $set: { status: 'PENDING' } });
    throw error;
  }
};
