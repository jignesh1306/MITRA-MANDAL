import { 
  getFundReport, 
  getContributionReport, 
  getLoanReport, 
  getExpenseReport 
} from '../services/report.service.js';
import { Group } from '../models/Group.js';

export const generateFundReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const group = await Group.findOne();
    const report = await getFundReport(group?._id, startDate, endDate);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const generateContributionReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    const group = await Group.findOne();
    const targetYear = year ? Number(year) : new Date().getFullYear();
    const report = await getContributionReport(group?._id, targetYear);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const generateLoanReport = async (req, res, next) => {
  try {
    const group = await Group.findOne();
    const report = await getLoanReport(group?._id);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const generateExpenseReport = async (req, res, next) => {
  try {
    const group = await Group.findOne();
    const report = await getExpenseReport(group?._id);
    res.json(report);
  } catch (error) {
    next(error);
  }
};
