import { describe, it, expect } from 'vitest';
import { calculateLoanSchedule } from '../src/services/loanCalculator.service.js';

describe('Loan Calculator Service', () => {
  it('should accurately calculate 10-month reducing balance interest for ₹50,000 at 1% interest rate', () => {
    const principal = 5000000; // ₹50,000 in paise
    const months = 10;
    const monthlyInterestRate = 1.0;

    const result = calculateLoanSchedule({
      principal,
      months,
      monthlyInterestRate,
      interestType: 'REDUCING'
    });

    expect(result.principal).toBe(5000000);
    expect(result.months).toBe(10);
    expect(result.totalInterest).toBe(275000); // ₹2,750 in paise
    expect(result.totalRepayment).toBe(5275000); // ₹52,750 in paise

    // Verify Month 1
    expect(result.schedule[0].principal).toBe(500000); // ₹5,000
    expect(result.schedule[0].interest).toBe(50000);   // ₹500
    expect(result.schedule[0].emi).toBe(550000);        // ₹5,500
    expect(result.schedule[0].remainingPrincipal).toBe(4500000); // ₹45,000

    // Verify Month 2
    expect(result.schedule[1].principal).toBe(500000); // ₹5,000
    expect(result.schedule[1].interest).toBe(45000);   // ₹450
    expect(result.schedule[1].emi).toBe(545000);        // ₹5,450
    expect(result.schedule[1].remainingPrincipal).toBe(4000000); // ₹40,000

    // Verify Month 10 (Final Month)
    const finalMonth = result.schedule[9];
    expect(finalMonth.principal).toBe(500000); // ₹5,000
    expect(finalMonth.interest).toBe(5000);    // ₹50
    expect(finalMonth.emi).toBe(505000);       // ₹5,050
    expect(finalMonth.remainingPrincipal).toBe(0); // Exact 0 balance!
  });

  it('should throw an error if principal or months are invalid', () => {
    expect(() => calculateLoanSchedule({ principal: 0, months: 10, monthlyInterestRate: 1.0 })).toThrow();
    expect(() => calculateLoanSchedule({ principal: 50000, months: 0, monthlyInterestRate: 1.0 })).toThrow();
  });
});
