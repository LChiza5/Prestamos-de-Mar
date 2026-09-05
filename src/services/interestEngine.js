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
// fixed schedule). None of the pending abonos moved the balance, so they all
// sat against the SAME balance the whole time - at corte, they're treated as
// ONE combined payment (interest charged once on the total), not as separate
// abonos each recalculating interest on a shrinking balance.
export function processCorte(startingBalance, ratePercent, pendingAmounts) {
  const balance = round2(startingBalance);

  if (pendingAmounts.length === 0) {
    return { results: [], finalBalance: balance, totalInterestAdded: 0 };
  }

  const totalAmount = round2(
    pendingAmounts.reduce((sum, amount) => sum + amount, 0)
  );

  const { interestPortion, principalPortion: rawPrincipal } = splitPayment(
    balance,
    ratePercent,
    totalAmount
  );
  // Pending abonos can't pay down more principal than what's left on the
  // loan - if they add up to more than the full payoff, the extra simply
  // doesn't push the balance below zero.
  const principalPortion = Math.min(rawPrincipal, balance);
  const finalBalance = round2(balance - principalPortion);

  // The combined interest/principal is split back across each individual
  // abono (proportional to its share of the total) purely so the payment
  // history can still show a line per abono - the last one absorbs the
  // rounding remainder so the parts add up exactly to the combined total.
  const results = [];
  let interestAssigned = 0;
  let principalAssigned = 0;
  pendingAmounts.forEach((amount, i) => {
    const isLast = i === pendingAmounts.length - 1;
    const share = amount / totalAmount;
    const thisInterest = isLast
      ? round2(interestPortion - interestAssigned)
      : round2(interestPortion * share);
    const thisPrincipal = isLast
      ? round2(principalPortion - principalAssigned)
      : round2(principalPortion * share);

    interestAssigned = round2(interestAssigned + thisInterest);
    principalAssigned = round2(principalAssigned + thisPrincipal);
    results.push({ interestPortion: thisInterest, principalPortion: thisPrincipal });
  });

  return { results, finalBalance, totalInterestAdded: interestPortion };
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
