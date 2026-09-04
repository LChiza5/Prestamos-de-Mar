import { round2 } from "../utils/money";

// Confirmed by Oldemar with a worked example: interest for an abono is a
// percent of the loan's CURRENT outstanding balance, not of the abono
// amount itself. The abono first covers that interest; whatever is left
// over is what actually reduces the balance.
// e.g. ₡100,000 loan at 8%: first abono of ₡20,000 owes 8% of 100,000 =
// ₡8,000 interest, so ₡12,000 goes to principal (new balance ₡88,000). The
// next abono's interest is then 8% of 88,000 = ₡7,040, not 8% of 100,000
// anymore - the base shrinks every time the balance does.
export function splitPayment(remainingBalance, ratePercent, amount) {
  const interestPortion = round2(remainingBalance * (ratePercent / 100));
  const principalPortion = round2(amount - interestPortion);
  return { interestPortion, principalPortion };
}

// Oldemar doesn't apply an abono the moment it's handed over - it sits
// "pendiente" until he decides to hacer corte (whenever he chooses, not on a
// fixed schedule). At that point each pending abono is run through
// splitPayment in the order it was received, one at a time, exactly like an
// abono applied immediately would be - only the timing is deferred.
export function processCorte(startingBalance, ratePercent, pendingAmounts) {
  let balance = round2(startingBalance);
  let totalInterestAdded = 0;
  const results = [];

  for (const amount of pendingAmounts) {
    const interestPortion = round2(balance * (ratePercent / 100));
    // An abono can't pay down more principal than what's left on the loan -
    // if pending abonos add up to more than the full payoff, the extra
    // simply doesn't reduce the balance below zero.
    const principalPortion = Math.min(
      round2(amount - interestPortion),
      balance
    );

    balance = round2(balance - principalPortion);
    totalInterestAdded = round2(totalInterestAdded + interestPortion);
    results.push({ interestPortion, principalPortion });
  }

  return { results, finalBalance: balance, totalInterestAdded };
}

export function simulateLoanPayoff(principal, ratePercent, monthlyPayment) {
  if (monthlyPayment <= 0) {
    throw new Error("La cuota mensual debe ser un número positivo");
  }

  let balance = round2(principal);
  let months = 0;
  let totalInterestPaid = 0;

  while (balance > 0) {
    const interestPortion = round2(balance * (ratePercent / 100));

    if (monthlyPayment <= interestPortion) {
      throw new Error(
        "La cuota mensual no alcanza para cubrir el interés de este mes; el préstamo nunca se terminaría de pagar"
      );
    }

    const payoffAmount = round2(balance + interestPortion);
    const isFinalPayment = monthlyPayment >= payoffAmount;
    const payment = isFinalPayment ? payoffAmount : monthlyPayment;
    const principalPortion = round2(payment - interestPortion);

    totalInterestPaid = round2(totalInterestPaid + interestPortion);
    balance = round2(balance - principalPortion);
    months += 1;
  }

  return { months, totalInterestPaid };
}
