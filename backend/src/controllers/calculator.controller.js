import { calculateLoanSchedule } from '../services/loanCalculator.service.js';
import { Group } from '../models/Group.js';

export const calculateEMI = async (req, res, next) => {
  try {
    const { amount, months, interestRate, interestType } = req.body;
    const group = await Group.findOne();

    const principalPaise = amount ? Math.round(Number(amount) * 100) : 5000000;
    const monthsNum = months ? Number(months) : 10;

    const rateNum = interestRate !== undefined ? Number(interestRate) : (group?.defaultInterestRate ?? 1.0);
    const type = interestType || (group?.interestType ?? 'REDUCING');

    const calculation = calculateLoanSchedule({
      principal: principalPaise,
      months: monthsNum,
      monthlyInterestRate: rateNum,
      interestType: type
    });

    res.json({
      ...calculation,
      groupSettings: {
        interestRate: group?.defaultInterestRate ?? 1.0,
        interestType: group?.interestType ?? 'REDUCING'
      }
    });
  } catch (error) {
    next(error);
  }
};
