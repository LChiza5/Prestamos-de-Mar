import { describe, it, expect } from "vitest";
import { round2, formatMoney, parseMoney } from "./money";

describe("round2", () => {
  it("rounds to 2 decimals", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });
});

describe("formatMoney", () => {
  it("formats with thousands separator and 2 decimals", () => {
    expect(formatMoney(1000)).toBe("1.000,00");
    expect(formatMoney(1000000.5)).toBe("1.000.000,50");
  });
});

describe("parseMoney", () => {
  it("parses a plain number string", () => {
    expect(parseMoney("1000.50")).toBe(1000.5);
  });

  it("returns 0 for empty or invalid input", () => {
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("abc")).toBe(0);
  });
});
