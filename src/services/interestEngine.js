import { round2 } from "../utils/money";

export function splitPayment(amount, ratePercent) {
  const interestPortion = round2(amount * (ratePercent / 100));
  const principalPortion = round2(amount - interestPortion);
  return { interestPortion, principalPortion };
}

export function simulateLoanPayoff(principal, ratePercent, monthlyPayment) {
  if (monthlyPayment <= 0) {
    throw new Error("La cuota mensual debe ser un número positivo");
  }

  const rate = ratePercent / 100;
  let balance = round2(principal);
  let months = 0;
  let totalInterestPaid = 0;

  while (balance > 0) {
    const principalPortionOfFullPayment = round2(monthlyPayment * (1 - rate));
    const isFinalPayment = principalPortionOfFullPayment >= balance;
    const payment = isFinalPayment ? round2(balance / (1 - rate)) : monthlyPayment;

    const { interestPortion, principalPortion } = splitPayment(payment, ratePercent);
    totalInterestPaid = round2(totalInterestPaid + interestPortion);
    balance = round2(balance - principalPortion);
    months += 1;
  }

  return { months, totalInterestPaid };
}
