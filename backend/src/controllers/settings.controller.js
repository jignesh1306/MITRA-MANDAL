import { Group } from '../models/Group.js';
import { createAuditLog } from '../services/audit.service.js';

export const getSettings = async (req, res, next) => {
  try {
    let group = await Group.findOne();
    if (!group) {
      group = await Group.create({ name: 'Mitra-Mandal' });
    }
    res.json(group);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let group = await Group.findOne();
    if (!group) {
      group = new Group();
    }

    const oldValue = group.toObject();
    const { 
      name, 
      description, 
      monthlyContribution, 
      defaultInterestRate, 
      interestType,
      maxActiveLoansPerMember,
      minLoanAmount,
      maxLoanAmount,
      maxLoanDurationMonths
    } = req.body;

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (monthlyContribution) group.monthlyContribution = Math.round(Number(monthlyContribution));
    if (defaultInterestRate !== undefined) group.defaultInterestRate = Number(defaultInterestRate);
    if (interestType) group.interestType = interestType;
    if (maxActiveLoansPerMember !== undefined) group.maxActiveLoansPerMember = Number(maxActiveLoansPerMember);
    if (minLoanAmount) group.minLoanAmount = Math.round(Number(minLoanAmount));
    if (maxLoanAmount) group.maxLoanAmount = Math.round(Number(maxLoanAmount));
    if (maxLoanDurationMonths) group.maxLoanDurationMonths = Number(maxLoanDurationMonths);

    await group.save();

    await createAuditLog({
      groupId: group._id,
      userId: req.user._id,
      action: 'GROUP_SETTINGS_UPDATED',
      entityType: 'Group',
      entityId: group._id.toString(),
      oldValue,
      newValue: group.toObject()
    });

    res.json(group);
  } catch (error) {
    next(error);
  }
};
