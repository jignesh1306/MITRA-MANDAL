import { Contribution } from '../models/Contribution.js';
import { GroupMember } from '../models/GroupMember.js';
import { Group } from '../models/Group.js';
import { Transaction } from '../models/Transaction.js';
import { generateRefId } from './refId.service.js';
import { createAuditLog } from './audit.service.js';

export const generateMonthlyContributions = async (groupId, month, year) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found');

  const members = await GroupMember.find({ groupId, status: 'ACTIVE' }).populate('userId', 'role');
  const created = [];

  for (const m of members) {
    if (m.userId && m.userId.role === 'ADMIN') continue; // Do not generate contributions for ADMIN users
    try {
      const contrib = await Contribution.create({
        groupId,
        memberId: m.userId,
        month,
        year,
        amount: group.monthlyContribution,
        status: 'PENDING'
      });
      created.push(contrib);
    } catch (err) {
      // Duplicate error code 11000 can be safely ignored
      if (err.code !== 11000) throw err;
    }
  }
  return created;
};

export const markContributionPaid = async (contributionId, adminUserId) => {
  const contrib = await Contribution.findById(contributionId).populate('memberId', 'name email');
  if (!contrib) throw new Error('Contribution record not found');
  if (contrib.status === 'PAID') throw new Error('Contribution is already paid');

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
};
