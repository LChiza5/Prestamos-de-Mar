import { describe, it, expect } from "vitest";
import { splitPayment, simulateLoanPayoff } from "./interestEngine";

describe("splitPayment", () => {
  it("splits a payment into interest and principal by rate percent", () => {
    expect(splitPayment(150000, 10)).toEqual({
      interestPortion: 15000,
      principalPortion: 135000,
    });
  });

  it("works the same regardless of how much time has passed", () => {
    expect(splitPayment(100000, 8)).toEqual({
      interestPortion: 8000,
      principalPortion: 92000,
    });
  });
});

describe("simulateLoanPayoff", () => {
  it("throws for a non-positive monthly payment", () => {
    expect(() => simulateLoanPayoff(1000000, 10, 0)).toThrow();
    expect(() => simulateLoanPayoff(1000000, 10, -500)).toThrow();
  });

  it("computes months to payoff and total interest for an even split", () => {
    const result = simulateLoanPayoff(900000, 10, 100000);
    expect(result.months).toBe(10);
    expect(result.totalInterestPaid).toBe(100000);
  });

  it("handles a final partial payment", () => {
    // 950,000 at 10%, 100,000/month: each regular payment nets 90,000 to
    // principal. 10 regular payments cover 900,000, leaving 50,000, which
    // needs one more (smaller, partial) payment - 11 months total.
    const result = simulateLoanPayoff(950000, 10, 100000);
    expect(result.months).toBe(11);
  });
});
