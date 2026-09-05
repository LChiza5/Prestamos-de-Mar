import { describe, it, expect } from "vitest";
import { splitPayment, simulateLoanPayoff, processCorte } from "./interestEngine";

describe("splitPayment", () => {
  it("calculates interest from the current balance, not the abono amount", () => {
    // Confirmed by Oldemar: ₡100,000 loan at 8%, abono of ₡20,000. Interest
    // owed is 8% of the ₡100,000 balance = ₡8,000, so ₡12,000 pays down
    // principal.
    expect(splitPayment(100000, 8, 20000)).toEqual({
      interestPortion: 8000,
      principalPortion: 12000,
    });
  });

  it("recalculates interest on the new balance for the next abono", () => {
    // After the first abono the balance is ₡88,000, so the next abono's
    // interest is 8% of 88,000 = ₡7,040 (not 8% of the original 100,000).
    expect(splitPayment(88000, 8, 20000)).toEqual({
      interestPortion: 7040,
      principalPortion: 12960,
    });
  });
});

describe("processCorte", () => {
  it("charges interest once on the combined total of all pending abonos, not once per abono", () => {
    // Two ₡10,000 abonos left pending on a ₡100,000 loan at 8% must match
    // a single ₡20,000 abono done at once: interest is 8% of the ₡100,000
    // balance = ₡8,000 (charged ONCE), so ₡12,000 pays down principal.
    // Split evenly between the two ₡10,000 abonos: ₡4,000/₡6,000 each.
    const { results, finalBalance, totalInterestAdded } = processCorte(
      100000,
      8,
      [10000, 10000]
    );
    expect(results).toEqual([
      { interestPortion: 4000, principalPortion: 6000 },
      { interestPortion: 4000, principalPortion: 6000 },
    ]);
    expect(finalBalance).toBe(88000);
    expect(totalInterestAdded).toBe(8000);
  });

  it("distributes the rounding remainder onto the last abono so the parts add up exactly", () => {
    // Three ₡10,000 abonos (₡30,000 total) on the same ₡100,000-at-8% loan:
    // interest is still charged once - 8% of 100,000 = ₡8,000 - leaving
    // ₡22,000 for principal, split three ways (doesn't divide evenly, so
    // the last abono absorbs the extra cent).
    const { results, finalBalance, totalInterestAdded } = processCorte(
      100000,
      8,
      [10000, 10000, 10000]
    );
    expect(results).toEqual([
      { interestPortion: 2666.67, principalPortion: 7333.33 },
      { interestPortion: 2666.67, principalPortion: 7333.33 },
      { interestPortion: 2666.66, principalPortion: 7333.34 },
    ]);
    expect(finalBalance).toBe(78000);
    expect(totalInterestAdded).toBe(8000);
  });

  it("caps the combined principal so the balance never goes negative", () => {
    // ₡10,000 balance at 10%: interest is 1,000, so 11,000 would fully pay
    // it off. A pending abono of 50,000 shouldn't push the balance negative.
    const { results, finalBalance } = processCorte(10000, 10, [50000]);
    expect(results).toEqual([{ interestPortion: 1000, principalPortion: 10000 }]);
    expect(finalBalance).toBe(0);
  });

  it("returns the starting balance unchanged when there are no pending abonos", () => {
    const { results, finalBalance, totalInterestAdded } = processCorte(
      50000,
      6,
      []
    );
    expect(results).toEqual([]);
    expect(finalBalance).toBe(50000);
    expect(totalInterestAdded).toBe(0);
  });
});

describe("simulateLoanPayoff", () => {
  it("throws for a non-positive monthly payment", () => {
    expect(() => simulateLoanPayoff(1000000, 10, 0)).toThrow();
    expect(() => simulateLoanPayoff(1000000, 10, -500)).toThrow();
  });

  it("throws when the payment doesn't even cover the interest", () => {
    // 8% of 100,000 is 8,000 interest - a 5,000 cuota never touches
    // principal, so the loan would never be paid off.
    expect(() => simulateLoanPayoff(100000, 8, 5000)).toThrow();
  });

  it("pays off in one shot when the payment covers balance + interest", () => {
    // 10,000 at 10%: interest is 1,000, so 11,000 exactly clears it.
    const result = simulateLoanPayoff(10000, 10, 11000);
    expect(result.months).toBe(1);
    expect(result.totalInterestPaid).toBe(1000);
  });

  it("matches Oldemar's worked example over several months", () => {
    // ₡100,000 at 8%, ₡20,000/month, continuing the same example used for
    // splitPayment: 8,000 + 7,040 interest for the first two months, then
    // declining every month as the balance shrinks, until a smaller final
    // payment clears the last ₡11,968.85 in month 7.
    const result = simulateLoanPayoff(100000, 8, 20000);
    expect(result.months).toBe(7);
    expect(result.totalInterestPaid).toBe(32926.36);
  });
});
