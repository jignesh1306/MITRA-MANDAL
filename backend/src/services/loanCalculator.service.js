/**
 * Reusable Loan Calculation Engine
 * Handles both monthly reducing balance and flat rate calculations in paise (integer arithmetic).
 */
export const calculateLoanSchedule = ({
  principal, // in paise or rupees
  months,
  monthlyInterestRate, // e.g. 1.0 for 1%
  interestType = 'REDUCING',
  startDate = new Date()
}) => {
  if (!principal || principal <= 0) throw new Error('Principal must be greater than 0');
  if (!months || months <= 0) throw new Error('Months must be greater than 0');
  if (monthlyInterestRate < 0) throw new Error('Interest rate cannot be negative');

  // Work with integer paise
  const totalPrincipalPaise = Math.round(principal);
  const rateFraction = monthlyInterestRate / 100;
  
  const schedule = [];
  let remainingPrincipal = totalPrincipalPaise;
  let totalInterest = 0;

  // Monthly base principal repayment portion
  const basePrincipalRepayment = Math.floor(totalPrincipalPaise / months);
  
  let currentDate = new Date(startDate);

  for (let m = 1; m <= months; m++) {
    // Increment due date by m months (same day of month)
    const dueDate = new Date(currentDate);
    dueDate.setMonth(dueDate.getMonth() + m);

    let principalPortion = basePrincipalRepayment;
    
    // Final month handles rounding difference to reach exact 0 remaining balance
    if (m === months) {
      principalPortion = remainingPrincipal;
    }

    let interestPortion = 0;
    if (interestType === 'REDUCING') {
      interestPortion = Math.round(remainingPrincipal * rateFraction);
    } else {
      // FLAT rate: interest calculated on original principal every month
      interestPortion = Math.round(totalPrincipalPaise * rateFraction);
    }

    const emi = principalPortion + interestPortion;
    remainingPrincipal = remainingPrincipal - principalPortion;
    if (remainingPrincipal < 0) remainingPrincipal = 0;

    totalInterest += interestPortion;

    schedule.push({
      month: m,
      principal: principalPortion,
      interest: interestPortion,
      emi,
      remainingPrincipal,
      dueDate
    });
  }

  const totalRepayment = totalPrincipalPaise + totalInterest;

  return {
    principal: totalPrincipalPaise,
    months,
    interestRate: monthlyInterestRate,
    interestType,
    totalInterest,
    totalRepayment,
    averageEMI: Math.round(totalRepayment / months),
    schedule
  };
};
