import { Contribution } from '../models/Contribution.js';
import { Group } from '../models/Group.js';
import { generateMonthlyContributions, markContributionPaid } from '../services/contribution.service.js';

export const getContributions = async (req, res, next) => {
  try {
    const { month, year, memberId, status } = req.query;
    const query = {};
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (status) query.status = status;
    if (memberId) query.memberId = memberId;

    const list = await Contribution.find(query)
      .populate('memberId', 'name email phone profilePhoto')
      .populate('recordedBy', 'name')
      .sort({ year: -1, month: -1, 'memberId.name': 1 });

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getMyContributions = async (req, res, next) => {
  try {
    const list = await Contribution.find({ memberId: req.user._id })
      .populate('recordedBy', 'name')
      .sort({ year: -1, month: -1 });

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const generateContributions = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const group = await Group.findOne();
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const created = await generateMonthlyContributions(group._id, targetMonth, targetYear);
    res.json({ message: `${created.length} monthly contribution records created successfully.`, count: created.length });
  } catch (error) {
    next(error);
  }
};

export const markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await markContributionPaid(id, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const markAllPaid = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const pendingList = await Contribution.find({
      ...(month && { month: Number(month) }),
      ...(year && { year: Number(year) }),
      status: 'PENDING'
    });

    let updatedCount = 0;
    for (const c of pendingList) {
      try {
        await markContributionPaid(c._id, req.user._id);
        updatedCount++;
      } catch (err) {
        // Continue loop if single failure
      }
    }

    res.json({ message: `${updatedCount} contributions marked as paid successfully.`, updatedCount });
  } catch (error) {
    next(error);
  }
};
